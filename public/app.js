(function () {
  'use strict';
  var C = window.CLINIC;
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- static content from site-config.js ----------
  document.title = C.name + ' | Book an appointment';
  $('brandName').textContent = C.name;
  $('footName').textContent = C.name;
  $('emNum').textContent = C.emergency;
  $('payNote').textContent = 'Payment: ' + C.paymentNote + '.';

  C.services.forEach(function (s) {
    var li = el('li');
    var who = el('span', 'who', s.name);
    who.appendChild(el('small', null, s.doctor));
    li.appendChild(who);
    li.appendChild(el('span', 'dots'));
    li.appendChild(el('span', 'fee', s.fee));
    $('feeBoard').appendChild(li);
  });

  C.doctors.forEach(function (d) {
    var li = el('li');
    li.appendChild(el('div', 'mono', d.initials));
    var box = el('div');
    box.appendChild(el('h3', null, d.name));
    box.appendChild(el('p', null, d.role + '. ' + d.detail + '.'));
    box.appendChild(el('p', null, d.days));
    li.appendChild(box);
    $('doctorList').appendChild(li);
  });

  C.hours.forEach(function (h) {
    var tr = el('tr');
    tr.appendChild(el('th', null, h.what)).setAttribute('scope', 'row');
    tr.appendChild(el('td', null, h.when));
    $('hoursBody').appendChild(tr);
  });

  $('addr').textContent = C.address;
  var tel = $('telLink');
  tel.textContent = C.phone;
  tel.href = 'tel:' + C.phone.replace(/[^\d+]/g, '');
  $('waLink').href = 'https://wa.me/' + C.whatsapp.replace(/\D/g, '');

  C.faq.forEach(function (f) {
    var d = el('details');
    d.appendChild(el('summary', null, f.q));
    d.appendChild(el('p', null, f.a));
    $('faqList').appendChild(d);
  });

  // ---------- booking ----------
  var svcSel = $('service');
  C.services.forEach(function (s) {
    var o = el('option', null, s.name);
    o.value = s.name;
    svcSel.appendChild(o);
  });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoLocal(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmt12(t) {
    var p = t.split(':'), h = +p[0];
    return (h % 12 === 0 ? 12 : h % 12) + ':' + p[1] + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function fmtDate(s) {
    return parseISO(s).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  var today = new Date();
  var first = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (first.getDay() === 0) first.setDate(first.getDate() + 1);
  $('date').min = isoLocal(today);
  $('date').value = isoLocal(first);

  function setNote(t) { $('slotNote').textContent = t || ''; }
  function setMsg(t) { $('formMsg').textContent = t || ''; }

  function doctorLine() {
    var s = C.services.filter(function (x) { return x.name === svcSel.value; })[0];
    $('doctorLine').textContent = s ? 'With ' + s.doctor + '. Fee: ' + s.fee + '.' : '';
  }

  var reqId = 0;
  function loadSlots() {
    var box = $('slots');
    box.textContent = '';
    setMsg('');
    var date = $('date').value, service = svcSel.value;
    if (!date) { setNote('Choose a date to see free times.'); return; }
    var id = ++reqId;
    setNote('Checking free times...');
    fetch('/api/public/availability?date=' + encodeURIComponent(date) + '&service=' + encodeURIComponent(service))
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (id !== reqId) return;
        if (!res.ok) { setNote(res.j.message || 'Could not load times. Try again.'); return; }
        var slots = res.j.available_slots || [];
        if (!slots.length) {
          if (res.j.note === 'clinic is closed on Sunday') setNote('The clinic is closed on Sundays. Pick another date.');
          else if (res.j.note === 'date is in the past') setNote('That date has passed. Pick another date.');
          else setNote('No free times on this date. Try another day.');
          return;
        }
        setNote('');
        slots.forEach(function (t) {
          var label = el('label', 'chip');
          var input = el('input');
          input.type = 'radio'; input.name = 'slot'; input.value = t;
          label.appendChild(input);
          label.appendChild(el('span', null, fmt12(t)));
          box.appendChild(label);
        });
      })
      .catch(function () {
        if (id === reqId) setNote('Could not reach the server. Check your connection and try again.');
      });
  }

  svcSel.addEventListener('change', function () { doctorLine(); loadSlots(); });
  $('date').addEventListener('change', loadSlots);
  doctorLine();
  loadSlots();

  function normPhone(v) {
    var p = String(v).replace(/\D/g, '');
    if (p.indexOf('00') === 0) p = p.slice(2);
    else if (p.charAt(0) === '0') p = '92' + p.slice(1);
    return p;
  }

  $('bookForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('phoneErr').textContent = '';
    setMsg('');
    var chosen = document.querySelector('input[name=slot]:checked');
    var name = $('name').value.trim();
    var phone = normPhone($('phone').value);

    if (!chosen) { setMsg('Choose a free time first.'); return; }
    if (name.length < 2) { setMsg('Enter your name.'); $('name').focus(); return; }
    if (phone.length < 10 || phone.length > 15) {
      $('phoneErr').textContent = 'Enter a valid mobile number, for example 0300 1234567.';
      $('phone').focus();
      return;
    }

    var btn = $('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Booking...';
    fetch('/api/public/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name: name, patient_phone: phone, service: svcSel.value,
        date: $('date').value, time: chosen.value, website: $('website').value
      })
    })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        if (res.j.result === 'ok' && res.j.appointment) { showToken(res.j.appointment); return; }
        if (res.status === 409) { setMsg('That time was just taken. Pick another free time.'); loadSlots(); return; }
        setMsg(res.j.message || 'Could not book. Please try again.');
      })
      .catch(function () { setMsg('Could not reach the server. Check your connection and try again.'); })
      .then(function () { btn.disabled = false; btn.textContent = 'Book appointment'; });
  });

  function showToken(a) {
    $('tokId').textContent = a.id;
    $('tokName').textContent = a.patient_name;
    $('tokService').textContent = a.service;
    $('tokDoctor').textContent = a.doctor;
    $('tokDate').textContent = fmtDate(a.date);
    $('tokTime').textContent = fmt12(a.time);
    $('bookForm').hidden = true;
    var t = $('token');
    t.hidden = false;
    t.focus();
  }

  $('againBtn').addEventListener('click', function () {
    $('token').hidden = true;
    $('bookForm').hidden = false;
    loadSlots();
    $('service').focus();
  });
})();
