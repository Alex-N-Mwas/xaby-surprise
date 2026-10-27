const fs = require('node:fs/promises');
const path = require('node:path');
const { Readable } = require('node:stream');
const { stream } = require('@netlify/functions');
const { hasSession } = require('./lib/security');

const types = {
  photos: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']),
  cutouts: new Set(['.png', '.webp', '.avif']),
  music: new Set(['.mp3', '.m4a', '.mp4', '.ogg', '.wav', '.aac', '.flac', '.opus', '.webm'])
};
const mime = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.aac': 'audio/aac', '.flac': 'audio/flac', '.opus': 'audio/ogg', '.webm': 'audio/webm'
};

exports.handler = stream(async event => {
  if (!hasSession(event)) return { statusCode: 401, headers: { 'Cache-Control': 'no-store' }, body: 'Enter the passcode first.' };
  const folder = event.queryStringParameters?.folder;
  let name;
  try { name = decodeURIComponent(event.queryStringParameters?.name || ''); } catch { name = ''; }
  if (!types[folder] || !name || name !== path.basename(name) || name.includes('/') || name.includes('\\') || !types[folder].has(path.extname(name).toLowerCase())) {
    return { statusCode: 404, body: 'Not found.' };
  }
  try {
    const file = path.join(process.cwd(), folder, name);
    const info = await fs.stat(file);
    if (!info.isFile()) return { statusCode: 404, body: 'Not found.' };
    if (event.httpMethod === 'HEAD') return { statusCode: 200, headers: { 'Content-Type': mime[path.extname(name).toLowerCase()], 'Content-Length': String(info.size), 'Cache-Control': 'private, no-store' }, body: '' };
    return {
      statusCode: 200,
      headers: { 'Content-Type': mime[path.extname(name).toLowerCase()] || 'application/octet-stream', 'Content-Length': String(info.size), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
      body: Readable.toWeb((await fs.open(file)).createReadStream())
    };
  } catch {
    return { statusCode: 404, headers: { 'Cache-Control': 'no-store' }, body: 'Not found.' };
  }
});
