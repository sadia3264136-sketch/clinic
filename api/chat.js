const { send, body, clean } = require('../lib/common');

const clinic = {
  name: 'Demo Clinic',
  address: 'Main Boulevard, City',
  phone: '+92 300 0000000',
  emergency: '1122',
  hours: 'Monday to Saturday. General and skin: 10:00 AM–2:00 PM. Dental: 4:00 PM–8:00 PM. Lab: 8:00 AM–12:00 PM. Sunday closed.',
  services: 'General Checkup (Rs 1,500, Dr. Ahmed Khan), Skin (Rs 2,000, Dr. Ahmed Khan), Dental (Rs 2,000, Dr. Sara Malik), Lab Tests (price depends on test).',
  policies: 'Arrive 10 minutes early. Cancel or reschedule at least 3 hours before. Fasting tests may require 8–10 hours without food, water allowed. Lab reports usually arrive within 24 hours on WhatsApp.'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { message: 'Use POST' });
  const message = clean(body(req).message).slice(0, 700);
  if (!message) return send(res, 400, { message: 'Please write a question.' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return send(res, 503, { message: 'AI assistant is not configured yet. Please use the booking form.' });

  const prompt = [
    'You are the friendly website assistant for a clinic. Answer in the user\'s language or Roman Urdu when they use Roman Urdu.',
    'Use only the clinic facts below. Do not invent doctors, prices, timings, availability, bookings, tokens, diagnoses, prescriptions, or test results.',
    'For appointment booking, direct the user to the website booking form; only the form can confirm a booking and issue a token.',
    'For emergencies, tell the user to call the emergency number or go to the nearest hospital. Do not diagnose or give urgent medical treatment advice.',
    'Keep replies short and clear (up to 120 words).',
    'CLINIC FACTS: ' + JSON.stringify(clinic),
    'USER QUESTION: ' + message
  ].join('\n');

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 400 } })
    });
    const data = await r.json();
    if (!r.ok) return send(res, 502, { message: 'Gemini could not answer right now. Please use the booking form.' });
    const reply = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    return send(res, 200, { reply: reply || 'Please use the booking form or call the clinic for help.' });
  } catch (e) {
    return send(res, 502, { message: 'AI assistant is temporarily unavailable.' });
  }
};
