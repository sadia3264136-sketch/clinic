const { SLOTS, SERVICES, STATUSES, send, authorized, query, body, todayPK, validDate, isSunday } = require('../lib/common');
const store = require('../lib/store');

module.exports = async (req, res) => {
  if (!authorized(req)) return send(res, 401, { result: 'error', message: 'Invalid API key' });

  // GET /api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD  -> JSON array
  if (req.method === 'GET') {
    const q = query(req);
    const from = q.from || '0000-00-00';
    const to = q.to || '9999-99-99';
    const list = (await store.all())
      .filter((a) => a.date >= from && a.date <= to)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return send(res, 200, list);
  }

  // POST /api/appointments  {patient_name, patient_phone, service, date, time}
  if (req.method === 'POST') {
    const b = body(req);
    const name = String(b.patient_name || '').trim();
    const phone = String(b.patient_phone || '').replace(/\D/g, '');
    const service = String(b.service || '').trim();
    const date = String(b.date || '').trim();
    const time = String(b.time || '').trim();

    if (!name || !phone || !service || !date || !time) {
      return send(res, 400, { result: 'error', message: 'patient_name, patient_phone, service, date, time are required' });
    }
    if (!validDate(date)) return send(res, 400, { result: 'error', message: 'date must be YYYY-MM-DD' });
    if (date < todayPK()) return send(res, 400, { result: 'error', message: 'date is in the past' });
    if (isSunday(date)) return send(res, 400, { result: 'error', message: 'clinic is closed on Sunday' });
    if (!SLOTS.includes(time)) return send(res, 400, { result: 'error', message: 'time must be one of ' + SLOTS.join(', ') });
    if (!SERVICES.map((s) => s.toLowerCase()).includes(service.toLowerCase())) {
      return send(res, 400, { result: 'error', message: 'service must be one of ' + SERVICES.join(', ') });
    }

    // idempotent: same phone + date + time returns the existing booking
    const taken = await store.takenSlots(date);
    if (taken[time]) {
      const existing = await store.get(taken[time]);
      if (existing && existing.patient_phone === phone && existing.status !== 'cancelled') {
        return send(res, 200, { result: 'ok', duplicate: true, message: 'Appointment already booked', appointment: existing });
      }
      return send(res, 409, { result: 'error', message: 'slot already taken' });
    }

    const id = 'A-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const reserved = await store.reserve(date, time, id);
    if (!reserved) return send(res, 409, { result: 'error', message: 'slot already taken' });

    const appt = { id, patient_name: name, patient_phone: phone, service, date, time, status: 'booked', created_at: new Date().toISOString() };
    await store.save(appt);
    return send(res, 201, { result: 'ok', message: 'Appointment booked', appointment: appt });
  }

  // PATCH /api/appointments  {id, status}   (to test no_show / completed / cancelled flows)
  if (req.method === 'PATCH') {
    const b = body(req);
    if (!b.id || !STATUSES.includes(b.status)) {
      return send(res, 400, { result: 'error', message: 'id and status (' + STATUSES.join(', ') + ') are required' });
    }
    const appt = await store.get(b.id);
    if (!appt) return send(res, 404, { result: 'error', message: 'appointment not found' });
    if (b.status === 'cancelled' && appt.status !== 'cancelled') await store.release(appt.date, appt.time);
    appt.status = b.status;
    await store.save(appt);
    return send(res, 200, { result: 'ok', appointment: appt });
  }

  return send(res, 405, { result: 'error', message: 'Use GET, POST or PATCH' });
};
