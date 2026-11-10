const { send, query } = require('../../lib/common');
const { availability } = require('../../lib/clinic');
module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { result: 'error', message: 'Use GET' });
  const q = query(req);
  const r = await availability(q.date, q.service);
  return send(res, r.code, r.body);
};
