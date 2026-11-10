// Clinic rules: services, doctors, hourly slots. Used by the website AND the WhatsApp bot API.
const store = require('./store');
const { todayPK, timePK, validDate, isSunday, clean } = require('./common');

const SERVICES = [
  { name: 'General Checkup', doctor: 'Dr. Ahmed Khan', resource: 'ahmed', slots: ['10:00', '11:00', '12:00', '13:00'], aliases: ['general', 'checkup', 'general physician', 'general checkup'] },
  { name: 'Skin',            doctor: 'Dr. Ahmed Khan', resource: 'ahmed', slots: ['10:00', '11:00', '12:00', '13:00'], aliases: ['skin consultation', 'dermatology', 'skin'] },
  { name: 'Dental',          doctor: 'Dr. Sara Malik', resource: 'sara',  slots: ['16:00', '17:00', '18:00', '19:00'], aliases: ['dental checkup', 'dentist', 'dental'] },
  { name: 'Lab Tests',       doctor: 'Lab',            resource: 'lab',   slots: ['08:00', '09:00', '10:00', '11:00'], aliases: ['lab', 'lab test', 'blood test', 'lab tests'] },
];
const NAMES = SERVICES.map((s) => s.name).join(', ');

function findService(input) {
  const k = String(input || '').trim().toLowerCase();
  if (!k) return null;
  return SERVICES.find((s) => s.name.toLowerCase() === k || s.aliases.includes(k)) || null;
}

const err = (code, message) => ({ code, body: { result: 'error', message } });

async function availability(date, serviceInput) {
  if (!validDate(date)) return err(400, 'date must be YYYY-MM-DD');
  const svc = findService(serviceInput);
  if (!svc) return err(400, 'service is required and must be one of: ' + NAMES);

  const base = { date, service: svc.name, doctor: svc.doctor };
  if (date < todayPK()) return { code: 200, body: { ...base, available_slots: [], note: 'date is in the past' } };
  if (isSunday(date)) return { code: 200, body: { ...base, available_slots: [], note: 'clinic is closed on Sunday' } };

  const taken = await store.takenSlots(date, svc.resource);
  let slots = svc.slots.filter((s) => !taken[s]);
  if (date === todayPK()) { const now = timePK(); slots = slots.filter((s) => s > now); }
  return { code: 200, body: { ...base, available_slots: slots } };
}

async function book(b, source) {
  const name = clean(b.patient_name).slice(0, 80);
  const phone = String(b.patient_phone || '').replace(/\D/g, '');
  const date = String(b.date || '').trim();
  const time = String(b.time || '').trim();

  if (!name || !phone || !b.service || !date || !time) {
    return err(400, 'patient_name, patient_phone, service, date, time are required');
  }
  if (phone.length < 10 || phone.length > 15) return err(400, 'patient_phone looks invalid (use country code, e.g. 923001234567)');
  if (!validDate(date)) return err(400, 'date must be YYYY-MM-DD');
  const svc = findService(b.service);
  if (!svc) return err(400, 'service must be one of: ' + NAMES);
  if (date < todayPK()) return err(400, 'date is in the past');
  if (isSunday(date)) return err(400, 'clinic is closed on Sunday');
  if (!svc.slots.includes(time)) return err(400, 'time for ' + svc.name + ' must be one of: ' + svc.slots.join(', '));
  if (date === todayPK() && time <= timePK()) return err(400, 'that time has already passed');

  // same patient asking again for the same slot -> return the existing booking (no double booking)
  const taken = await store.takenSlots(date, svc.resource);
  if (taken[time]) {
    const existing = await store.get(taken[time]);
    if (existing && existing.patient_phone === phone && existing.status !== 'cancelled') {
      return { code: 200, body: { result: 'ok', duplicate: true, message: 'Appointment already booked', appointment: existing } };
    }
    return err(409, 'slot already taken');
  }

  const id = 'A-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();
  if (!(await store.reserve(date, svc.resource, time, id))) return err(409, 'slot already taken');

  const appt = {
    id, patient_name: name, patient_phone: phone, service: svc.name, doctor: svc.doctor, resource: svc.resource,
    date, time, status: 'booked', source: source || 'api', created_at: new Date().toISOString(),
  };
  await store.save(appt);
  return { code: 201, body: { result: 'ok', message: 'Appointment booked', appointment: appt } };
}

module.exports = { SERVICES, availability, book, findService };
