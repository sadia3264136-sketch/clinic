(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'clinicStaffKey';
  var STATUS = [['booked', 'Booked'], ['confirmed', 'Confirmed'], ['no_show', 'No-show'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
  var timer = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function key() { return sessionStorage.getItem(KEY) || ''; }
  function msg(t) { $('adminMsg').textContent = t || ''; }
  function label(v) { var f = STATUS.filter(function (s) { return s[0] === v; })[0]; return f ? f[1] : v; }
  function h12(t) { var p = t.split(':'), h = +p[0]; return (h % 12 === 0 ? 12 : h % 12) + ':' + p[1] + ' ' + (h >= 12 ? 'PM' : 'AM'); }

  var now = new Date(), end = new Date();
  end.setDate(end.getDate() + 7);
  $('from').value = iso(now);
  $('to').value = iso(end);

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'X-API-Key': key() }, opts.headers || {});
    return fetch(path, opts);
  }

  function show(on) {
    $('panel').hidden = !on;
    $('keyForm').hidden = on;
    clearInterval(timer);
    if (on) timer = setInterval(function () { if (!document.hidden) load(); }, 30000);
  }

  function td(text) { var c = document.createElement('td'); c.textContent = text; return c; }

  function render(list) {
    var rows = $('rows');
    rows.textContent = '';
    $('empty').hidden = list.length > 0;
    var counts = {};
    list.forEach(function (a) {
      counts[a.status] = (counts[a.status] || 0) + 1;
      var tr = document.createElement('tr');
      tr.appendChild(td(a.date));
      tr.appendChild(td(h12(a.time)));
      tr.appendChild(td(a.patient_name));
      tr.appendChild(td('+' + a.patient_phone));
      tr.appendChild(td(a.service + (a.doctor && a.doctor !== 'Lab' ? ' (' + a.doctor + ')' : '')));
      tr.appendChild(td(a.source || ''));
      var c = document.createElement('td');
      var sel = document.createElement('select');
      sel.setAttribute('aria-label', 'Status for ' + a.patient_name);
      STATUS.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s[0]; o.textContent = s[1];
        if (s[0] === a.status) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () { setStatus(a.id, sel.value); });
      c.appendChild(sel);
      tr.appendChild(c);
      rows.appendChild(tr);
    });
    var box = $('counts');
    box.textContent = '';
    STATUS.forEach(function (s) {
      var d = document.createElement('span');
      d.className = 'count';
      d.textContent = s[1] + ': ' + (counts[s[0]] || 0);
      box.appendChild(d);
    });
  }

  function load() {
    msg('');
    api('/api/appointments?from=' + encodeURIComponent($('from').value) + '&to=' + encodeURIComponent($('to').value))
      .then(function (r) {
        if (r.status === 401) { sessionStorage.removeItem(KEY); show(false); msg('Wrong staff key. Try again.'); throw new Error('auth'); }
        if (!r.ok) throw new Error('http');
        return r.json();
      })
      .then(function (list) { show(true); render(Array.isArray(list) ? list : []); })
      .catch(function (e) { if (e.message !== 'auth') msg('Could not load appointments. Check your connection and refresh.'); });
  }

  function setStatus(id, status) {
    msg('');
    api('/api/appointments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id, status: status }) })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function () { msg('Status changed to ' + label(status) + '.'); load(); })
      .catch(function () { msg('Could not change the status. Refresh and try again.'); load(); });
  }

  $('keyForm').addEventListener('submit', function (e) {
    e.preventDefault();
    sessionStorage.setItem(KEY, $('apiKey').value.trim());
    $('apiKey').value = '';
    load();
  });
  $('reload').addEventListener('click', load);
  $('from').addEventListener('change', load);
  $('to').addEventListener('change', load);
  $('signOut').addEventListener('click', function () { sessionStorage.removeItem(KEY); show(false); });

  if (key()) load();
})();
