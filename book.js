const { send, body } = require('../../lib/common');
const { book } = require('../../lib/clinic');

// Website: POST /api/public/book   (no key)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { result: 'error', message: 'Use POST' });
  const b = body(req);
  if (b.website) return send(res, 400, { result: 'error', message: 'invalid request' }); // honeypot field
  const r = await book(b, 'website');
  return send(res, r.code, r.body);
};
