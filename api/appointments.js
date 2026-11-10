const { STATUSES, send, authorized, query, body } = require('../lib/common');
const { book } = require('../lib/clinic');
const store = require('../lib/store');

// Bot / admin (needs X-API-Key)
module.exports = async (req, res) => {
  if (!authorized(req)) return send(res, 401, { result: 'error', message: 'Invalid API key' });

  // GET /api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD  -> plain JSON array
  if (req.method === 'GET') {
    const q = query(req);
    const from = q.from || '0000-00-00';
    const to = q.to || '9999-99-99';
    const list = (await store.all())
      .filter((a) => a.date >= from && a.date <= to)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return send(res, 200, list);
  }

  // POST /api/appointments {patient_name, patient_phone, service, date, time}
  if (req.method === 'POST') {
    const r = await book(body(req), 'bot');
    return send(res, r.code, r.body);
  }

  // PATCH /api/appointments {id, status}
  if (req.method === 'PATCH') {
    const b = body(req);
    if (!b.id || !STATUSES.includes(b.status)) {
      return send(res, 400, { result: 'error', message: 'id and status (' + STATUSES.join(', ') + ') are required' });
    }
    const appt = await store.get(String(b.id));
    if (!appt) return send(res, 404, { result: 'error', message: 'appointment not found' });
    if (b.status === 'cancelled' && appt.status !== 'cancelled') await store.release(appt.date, appt.resource, appt.time);
    appt.status = b.status;
    await store.save(appt);
    return send(res, 200, { result: 'ok', appointment: appt });
  }

  return send(res, 405, { result: 'error', message: 'Use GET, POST or PATCH' });
};
