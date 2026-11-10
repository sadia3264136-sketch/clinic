// Everything clinic-specific for the website lives here. Change this file to re-skin the site for another clinic.
window.CLINIC = {
  name: 'Demo Clinic',
  phone: '+92 300 0000000',
  whatsapp: '923000000000',
  address: 'Main Boulevard, City',
  emergency: '1122',
  paymentNote: 'Cash, card, Easypaisa and JazzCash',
  services: [
    { name: 'General Checkup', doctor: 'Dr. Ahmed Khan', fee: 'Rs 1,500' },
    { name: 'Dental',          doctor: 'Dr. Sara Malik', fee: 'Rs 2,000' },
    { name: 'Skin',            doctor: 'Dr. Ahmed Khan', fee: 'Rs 2,000' },
    { name: 'Lab Tests',       doctor: 'Lab desk',       fee: 'Price depends on the test' }
  ],
  doctors: [
    { initials: 'AK', name: 'Dr. Ahmed Khan', role: 'General Physician', detail: 'General checkups and skin problems', days: 'Monday to Saturday, 10:00 AM to 2:00 PM' },
    { initials: 'SM', name: 'Dr. Sara Malik', role: 'Dentist', detail: 'Dental checkups, cleaning and fillings', days: 'Monday to Saturday, 4:00 PM to 8:00 PM' }
  ],
  hours: [
    { what: 'General Checkup and Skin', when: 'Mon to Sat, 10:00 AM to 2:00 PM' },
    { what: 'Dental',                   when: 'Mon to Sat, 4:00 PM to 8:00 PM' },
    { what: 'Lab',                      when: 'Mon to Sat, 8:00 AM to 12:00 PM' },
    { what: 'Sunday',                   when: 'Closed' }
  ],
  faq: [
    { q: 'How do I cancel or reschedule?', a: 'Message us on WhatsApp or call at least 3 hours before your appointment.' },
    { q: 'What should I bring?', a: 'Your mobile number, and any earlier reports or prescriptions. Please arrive 10 minutes early.' },
    { q: 'Do I need to fast for a blood test?', a: 'For fasting tests, take nothing but water for 8 to 10 hours before. The lab will tell you if your test needs it.' },
    { q: 'When do I get my lab report?', a: 'Within 24 hours, on WhatsApp.' },
    { q: 'Is there parking?', a: 'Yes, in front of the clinic.' }
  ]
};
