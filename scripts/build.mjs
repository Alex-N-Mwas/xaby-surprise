// Assembles the Netlify publish folder. The private page and media are only reachable
// through the edge gate in netlify/edge-functions/gate.ts.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'public');
const folders = {
  music: new Set(['.mp3', '.m4a', '.mp4', '.ogg', '.wav', '.aac', '.flac', '.opus', '.webm']),
  photos: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']),
  cutouts: new Set(['.png', '.webp', '.avif'])
};

function listFiles(folder, extensions) {
  try {
    return fs.readdirSync(path.join(root, folder), { withFileTypes: true })
      .filter(entry => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase()))
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch (error) { if (error.code !== 'ENOENT') throw error; return []; }
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'api'), { recursive: true });
fs.copyFileSync(path.join(root, 'gate.html'), path.join(out, 'index.html'));
fs.copyFileSync(path.join(root, 'index.html'), path.join(out, 'surprise.html'));
for (const file of ['styles.css', 'app.js']) fs.copyFileSync(path.join(root, file), path.join(out, file));

const lists = {};
for (const [folder, extensions] of Object.entries(folders)) {
  lists[folder] = listFiles(folder, extensions);
  fs.mkdirSync(path.join(out, folder));
  for (const name of lists[folder]) fs.copyFileSync(path.join(root, folder, name), path.join(out, folder, name));
}
const write = (name, value) => fs.writeFileSync(path.join(out, 'api', name), JSON.stringify(value));
write('music-list.json', lists.music.map(name => ({ name })));
write('photos.json', lists.photos.map(name => ({ name, caption: name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() })));
write('cutouts.json', lists.cutouts.map(name => ({ name })));
console.log(`Built public/ with ${lists.music.length} tracks, ${lists.photos.length} photos, ${lists.cutouts.length} cutouts.`);
