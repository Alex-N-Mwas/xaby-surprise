const fs = require('node:fs/promises');
const path = require('node:path');
const { hasSession } = require('./lib/security');

const types = {
  photos: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']),
  cutouts: new Set(['.png', '.webp', '.avif']),
  music: new Set(['.mp3', '.m4a', '.mp4', '.ogg', '.wav', '.aac', '.flac', '.opus', '.webm'])
};

async function listFiles(folder) {
  try {
    const entries = await fs.readdir(path.join(process.cwd(), folder), { withFileTypes: true });
    return entries.filter(entry => entry.isFile() && types[folder].has(path.extname(entry.name).toLowerCase())).map(entry => entry.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(`Could not read ${folder}/:`, error.message);
    return [];
  }
}

function json(statusCode, value, extraHeaders = {}) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }, body: JSON.stringify(value) };
}

exports.handler = async event => {
  const route = (event.queryStringParameters?.route || '').replace(/^\/+/, '');
  if (!hasSession(event)) return json(401, { error: 'Please enter the passcode first.' });
  if (route === 'photos') {
    const names = await listFiles('photos');
    return json(200, names.map(name => ({ name, caption: name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() })));
  }
  if (route === 'music-list') return json(200, (await listFiles('music')).map(name => ({ name })));
  if (route === 'cutouts') return json(200, (await listFiles('cutouts')).map(name => ({ name })));
  return json(404, { error: 'Not found.' });
};
