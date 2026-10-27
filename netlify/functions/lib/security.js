const crypto = require('node:crypto');

const COOKIE = 'twf_access';
const SESSION_SECONDS = 12 * 60 * 60;

function secret() {
  return process.env.ACCESS_SESSION_SECRET || '';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function codeMatches(attempt) {
  const expected = process.env.ACCESS_CODE || '';
  if (!expected || !secret()) return false;
  const a = crypto.createHash('sha256').update(String(attempt || '')).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function sessionCookie() {
  const payload = `${Date.now() + SESSION_SECONDS * 1000}.${crypto.randomBytes(24).toString('base64url')}`;
  const value = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`;
}

function hasSession(event) {
  if (!secret()) return false;
  const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
  const cookie = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`));
  if (!cookie) return false;
  const value = cookie.slice(COOKIE.length + 1);
  const lastDot = value.lastIndexOf('.');
  if (lastDot < 0) return false;
  const payload = value.slice(0, lastDot);
  const supplied = value.slice(lastDot + 1);
  if (!safeEqual(sign(payload), supplied)) return false;
  const expiry = Number(payload.slice(0, payload.indexOf('.')));
  return Number.isFinite(expiry) && expiry > Date.now();
}

module.exports = { codeMatches, hasSession, sessionCookie };
