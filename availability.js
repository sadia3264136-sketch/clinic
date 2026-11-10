const { SLOTS, send, authorized, query, todayPK, validDate, isSunday } = require('../lib/common');
const store = require('../lib/store');

// GET /api/availability?date=YYYY-MM-DD&service=Dental
module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { result: 'error', message: 'Use GET' });
  if (!authorized(req)) return send(res, 401, { result: 'error', message: 'Invalid API key' });

  const q = query(req);
  const date = q.date;
  if (!validDate(date)) return send(res, 400, { result: 'error', message: 'date must be YYYY-MM-DD' });
  if (date < todayPK()) return send(res, 200, { date, service: q.service || '', available_slots: [], note: 'date is in the past' });
  if (isSunday(date)) return send(res, 200, { date, service: q.service || '', available_slots: [], note: 'clinic is closed on Sunday' });

  const taken = await store.takenSlots(date);
  const available = SLOTS.filter((s) => !taken[s]);
  return send(res, 200, { date, service: q.service || '', available_slots: available });
};
