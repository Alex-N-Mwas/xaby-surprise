const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const publish = path.join(root, 'public');
fs.rmSync(publish, { recursive: true, force: true });
fs.mkdirSync(publish, { recursive: true });
for (const file of ['styles.css', 'app.js']) {
  fs.copyFileSync(path.join(root, file), path.join(publish, file));
}
console.log('Prepared Netlify publish folder with public assets only.');
