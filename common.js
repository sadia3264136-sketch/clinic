const SLOTS = ['10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];
const SERVICES = ['General Checkup', 'Dental', 'Skin', 'Lab Tests'];
const STATUSES = ['booked', 'confirmed', 'no_show', 'completed', 'cancelled'];

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

// X-API-Key header (or ?key=) must match API_KEY env. If API_KEY is not set, the API is open (demo only).
function authorized(req) {
  const expected = process.env.API_KEY;
  if (!expected) return true;
  const url = new URL(req.url, 'http://x');
  const given = req.headers['x-api-key'] || url.searchParams.get('key');
  return given === expected;
}

function query(req) {
  const url = new URL(req.url, 'http://x');
  return Object.fromEntries(url.searchParams.entries());
}

function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

// "today" in Pakistan time (UTC+5)
function todayPK() {
  return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

function validDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(d)) && !isNaN(new Date(d + 'T00:00:00Z').getTime());
}

function isSunday(d) {
  return new Date(d + 'T00:00:00Z').getUTCDay() === 0;
}

module.exports = { SLOTS, SERVICES, STATUSES, send, authorized, query, body, todayPK, validDate, isSunday };
