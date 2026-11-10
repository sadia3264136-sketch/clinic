const STATUSES = ['booked', 'confirmed', 'no_show', 'completed', 'cancelled'];

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// Bot / admin endpoints need X-API-Key (or ?key=) equal to the API_KEY env var.
// If API_KEY is not set, they are open (demo only).
function authorized(req) {
  const expected = process.env.API_KEY;
  if (!expected) return true;
  const url = new URL(req.url, 'http://x');
  const given = req.headers['x-api-key'] || url.searchParams.get('key');
  return given === expected;
}

function query(req) {
  return Object.fromEntries(new URL(req.url, 'http://x').searchParams.entries());
}

function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b && typeof b === 'object' ? b : {};
}

// Pakistan time is UTC+5
function pkNow() { return new Date(Date.now() + 5 * 3600 * 1000).toISOString(); }
function todayPK() { return pkNow().slice(0, 10); }
function timePK() { return pkNow().slice(11, 16); }

function validDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(d)) && !isNaN(new Date(d + 'T00:00:00Z').getTime());
}
function isSunday(d) { return new Date(d + 'T00:00:00Z').getUTCDay() === 0; }

// remove control characters and angle brackets from free text coming from the public form
function clean(s) { return String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim(); }

module.exports = { STATUSES, send, authorized, query, body, todayPK, timePK, validDate, isSunday, clean };
