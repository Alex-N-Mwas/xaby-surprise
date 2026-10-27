const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
function readEnvFile() {
  try {
    for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
readEnvFile();

const opensPath = path.join(root, 'opens.json');
const port = Number(process.env.PORT || 3000);
const passcode = process.env.ACCESS_CODE || 'change-this-code';
const sessions = new Map();
let failedAttempts = 0;
let lockoutUntil = 0;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.aac': 'audio/aac', '.flac': 'audio/flac', '.opus': 'audio/ogg', '.webm': 'audio/webm'
};
const photoTypes = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const cutoutTypes = new Set(['.png', '.webp', '.avif']);
const musicTypes = new Set(['.mp3', '.m4a', '.mp4', '.ogg', '.wav', '.aac', '.flac', '.opus', '.webm']);
const sessionsCookie = 'twf_access';

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(value));
}
function getSession(request) {
  const match = (request.headers.cookie || '').match(/(?:^|;\s*)twf_access=([a-f\d]+)/);
  return match && sessions.has(match[1]) ? match[1] : null;
}
function timingSafeCodeMatch(attempt) {
  const expected = crypto.createHash('sha256').update(passcode).digest();
  const received = crypto.createHash('sha256').update(String(attempt || '')).digest();
  return crypto.timingSafeEqual(expected, received) && Boolean(passcode) && passcode !== 'change-this-code';
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => { body += chunk; if (body.length > 10000) { reject(new Error('Request too large')); request.destroy(); } });
    request.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    request.on('error', reject);
  });
}
async function listFiles(folder, extensions) {
  try {
    const entries = await fs.promises.readdir(path.join(root, folder), { withFileTypes: true });
    return entries.filter(entry => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())).map(entry => entry.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch (error) { if (error.code !== 'ENOENT') console.error(`Could not read ${folder}/:`, error.message); return []; }
}
function safeFilename(encoded) {
  let filename;
  try { filename = decodeURIComponent(encoded); } catch { return null; }
  if (!filename || filename !== path.basename(filename) || filename.includes('/') || filename.includes('\\')) return null;
  return filename;
}
function serveFile(response, file, headOnly = false) {
  fs.stat(file, (statError, info) => {
    if (statError || !info.isFile()) { response.writeHead(404); return response.end('Not found'); }
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    if (headOnly) return response.end();
    fs.createReadStream(file).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  let url;
  try { url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); }
  catch { response.writeHead(400); return response.end('Bad request'); }

  if (url.pathname === '/api/access' && request.method === 'POST') {
    if (Date.now() < lockoutUntil) return sendJson(response, 429, { error: 'Too many tries. Please wait a little and try again.' });
    let body;
    try { body = await readBody(request); } catch { return sendJson(response, 400, { error: 'Please try again.' }); }
    if (body.consent !== true) return sendJson(response, 400, { error: 'Please read the notice and confirm before continuing.' });
    if (!timingSafeCodeMatch(body.code)) {
      failedAttempts += 1;
      if (failedAttempts >= 5) { lockoutUntil = Date.now() + 10 * 60 * 1000; failedAttempts = 0; }
      return sendJson(response, 401, { error: 'That code did not work. Try again.' });
    }
    failedAttempts = 0; lockoutUntil = 0;
    let opens = { count: 0 };
    try { opens = JSON.parse(fs.readFileSync(opensPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') console.error('Could not read open count:', error.message); }
    const openedAt = new Date().toISOString(); const openCount = Number(opens.count || 0) + 1;
    try { fs.writeFileSync(opensPath, JSON.stringify({ count: openCount, lastOpenedAt: openedAt }, null, 2)); }
    catch (error) { console.error('Could not save open count:', error.message); return sendJson(response, 500, { error: 'Could not save this opening. Please try again.' }); }
    const token = crypto.randomBytes(24).toString('hex'); sessions.set(token, { createdAt: Date.now() });
    const secureCookie = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
    return sendJson(response, 200, { redirect: '/surprise', openCount }, { 'Set-Cookie': `${sessionsCookie}=${token}; HttpOnly; SameSite=Strict; Path=/${secureCookie}` });
  }

  const session = getSession(request);
  if ((url.pathname === '/' || url.pathname === '/gate.html') && request.method === 'GET') {
    if (session) { response.writeHead(302, { Location: '/surprise', 'Cache-Control': 'no-store' }); return response.end(); }
    return serveFile(response, path.join(root, 'gate.html'));
  }
  if (url.pathname === '/surprise' && request.method === 'GET') {
    if (!session) { response.writeHead(302, { Location: '/', 'Cache-Control': 'no-store' }); return response.end(); }
    return serveFile(response, path.join(root, 'index.html'));
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD, POST' }); return response.end('Method not allowed'); }
  if (!session) { response.writeHead(302, { Location: '/', 'Cache-Control': 'no-store' }); return response.end(); }

  if (url.pathname === '/api/music-list') {
    const names = await listFiles('music', musicTypes);
    return sendJson(response, 200, names.map(name => ({ name })));
  }
  if (url.pathname === '/api/photos') {
    const names = await listFiles('photos', photoTypes);
    return sendJson(response, 200, names.map(name => ({ name, caption: name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() })));
  }
  if (url.pathname === '/api/cutouts') {
    const names = await listFiles('cutouts', cutoutTypes);
    return sendJson(response, 200, names.map(name => ({ name })));
  }

  const match = url.pathname.match(/^\/(music|photos)\/(.+)$/);
  if (match) {
    const folder = match[1]; const name = safeFilename(match[2]);
    if (!name) { response.writeHead(400); return response.end('Bad filename'); }
    const allowed = folder === 'music' ? musicTypes : folder === 'photos' ? photoTypes : null;
    if (!allowed) { response.writeHead(404); return response.end('Not found'); }
    if (!allowed.has(path.extname(name).toLowerCase())) { response.writeHead(404); return response.end('Not found'); }
    const listed = await listFiles(folder, allowed);
    if (!listed.includes(name)) { response.writeHead(404); return response.end('Not found'); }
    return serveFile(response, path.join(root, folder, name), request.method === 'HEAD');
  }
  const cutoutMatch = url.pathname.match(/^\/cutouts\/(.+)$/);
  if (cutoutMatch) {
    const name = safeFilename(cutoutMatch[1]);
    if (!name || !cutoutTypes.has(path.extname(name).toLowerCase())) { response.writeHead(404); return response.end('Not found'); }
    const listed = await listFiles('cutouts', cutoutTypes);
    if (!listed.includes(name)) { response.writeHead(404); return response.end('Not found'); }
    return serveFile(response, path.join(root, 'cutouts', name), request.method === 'HEAD');
  }

  const publicFiles = new Set(['/styles.css', '/app.js']);
  if (!publicFiles.has(url.pathname)) { response.writeHead(404); return response.end('Not found'); }
  return serveFile(response, path.join(root, url.pathname.slice(1)), request.method === 'HEAD');
});

server.listen(port, '0.0.0.0', () => console.log(`Xaby's private page is running at http://localhost:${port}`));
