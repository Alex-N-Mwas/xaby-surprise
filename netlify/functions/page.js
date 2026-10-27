const fs = require('node:fs/promises');
const path = require('node:path');
const { hasSession } = require('./lib/security');

exports.handler = async event => {
  const view = event.queryStringParameters?.page;
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Type': 'text/html; charset=utf-8' };
  if (view === 'surprise' && !hasSession(event)) return { statusCode: 302, headers: { ...headers, Location: '/' }, body: '' };
  if (view === 'gate' && hasSession(event)) return { statusCode: 302, headers: { ...headers, Location: '/surprise' }, body: '' };
  const file = view === 'surprise' ? 'index.html' : 'gate.html';
  try {
    const body = await fs.readFile(path.join(process.cwd(), file), 'utf8');
    return { statusCode: 200, headers, body };
  } catch (error) {
    console.error(`Could not load ${file}:`, error.message);
    return { statusCode: 500, headers, body: 'The page could not be loaded.' };
  }
};
