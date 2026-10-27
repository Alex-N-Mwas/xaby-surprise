const { codeMatches, sessionCookie } = require('./lib/security');

function json(statusCode, value, headers = {}) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }, body: JSON.stringify(value) };
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' }, { Allow: 'POST' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Please try again.' }); }
  if (body.consent !== true) return json(400, { error: 'Please read the notice and confirm before continuing.' });
  if (!process.env.ACCESS_CODE || !process.env.ACCESS_SESSION_SECRET) return json(500, { error: 'The site access settings are not configured yet.' });
  if (!codeMatches(body.code)) return json(401, { error: 'That code did not work. Try again.' });

  try {
    const { getStore } = await import('@netlify/blobs');
    const opens = getStore('site-state');
    const previous = await opens.get('opens', { type: 'json' }) || { count: 0 };
    const openCount = Number(previous.count || 0) + 1;
    await opens.setJSON('opens', { count: openCount, lastOpenedAt: new Date().toISOString() });
    return json(200, { redirect: '/surprise', openCount }, { 'Set-Cookie': sessionCookie() });
  } catch (error) {
    console.error('Could not save open count:', error.message);
    return json(500, { error: 'Could not save this opening. Please try again.' });
  }
};

exports.config = {
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowLimit: 5, windowSize: 600 }
};
