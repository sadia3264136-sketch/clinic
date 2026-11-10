const { send, authorized, query } = require('../lib/common');
const { availability } = require('../lib/clinic');

// Bot: GET /api/availability?date=YYYY-MM-DD&service=Dental   (needs X-API-Key)
module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { result: 'error', message: 'Use GET' });
  if (!authorized(req)) return send(res, 401, { result: 'error', message: 'Invalid API key' });
  const q = query(req);
  const r = await availability(q.date, q.service);
  return send(res, r.code, r.body);
};
