// Dettaglio per gruppo di prodotti dentro la filiera (Istat, CPA a 3 cifre). Versione del 25/11/2026.
// Usa i dataset gruppi_coppie (solo gruppi leggibili) e gruppi_dr. Nessun totale per gruppo: il gruppo compare solo
// come scomposizione di una coppia filiera-Paese, nel riquadro dei casi nascosti e nella scheda Filiere.
window.LX = window.LX || {};
LX.grpCoppia = LX.grpCoppia || '';
LX.grpSel = LX.grpSel || '';
(function () {
  LX.grpData = (id) => { const s = dash.data(id); return s.status === 'ok' ? s.data : null; };
  LX.grpNome = (r) => r.gruppo + (r.nota_gruppo ? ' (' + r.nota_gruppo + ')' : '');
  // numero di gruppi Istat della filiera (0 se la filiera ha un solo gruppo: nessun dettaglio)
  LX.grpN = function (cpa) {
    const d = LX.grpData('gruppi_dr');
    const r = d ? d.find((x) => x.cpa === cpa) : null;
    return r ? LX.N(r.n_gruppi_filiera) : 0;
  };
  // riga unica con un messaggio, dentro il tbody
  LX.grpMsg = function (tb, n, testo) {
    d3.select(tb).selectAll('tr').remove();
    const tr = document.createElement('tr'); tr.className = 'row-muted lx-grp-msg';
    const td = document.createElement('td'); td.colSpan = n; td.textContent = testo;
    tr.append(td); tb.append(tr);
  };
  LX.grpCoppiaInfo = function () {
    const p = String(LX.grpCoppia || '').split('|');
    if (p.length < 3 || p[0] !== String(LX.dr)) return null;
    const o = (LX.oppDR() || []).find((r) => String(r.dr) === p[0] && r.cpa === p[1] && r.paese_cod === p[2]);
    return o ? { dr: p[0], cpa: p[1], paese_cod: p[2], filiera: o.filiera, paese: o.paese, spazio: LX.N(o.export_mancante_mln), motivo: o.escluso_perche || '' } : null;
  };
  // scelta della coppia: quella cliccata, se e ancora tra le righe visibili; altrimenti la prima riga della tabella
  LX.grpScegli = function () {
    const tb = document.querySelector('tbody[data-draw="tab-opp"]');
    if (!tb) return;
    const keys = [...tb.querySelectorAll('tr[data-key]')].map((tr) => decodeURIComponent(tr.getAttribute('data-key')));
    if (!keys.includes(LX.grpCoppia)) LX.grpCoppia = keys[0] || '';
    tb.querySelectorAll('tr[data-key]').forEach((tr) => {
      if (decodeURIComponent(tr.getAttribute('data-key')) === LX.grpCoppia) tr.setAttribute('aria-selected', 'true');
      else tr.removeAttribute('aria-selected');
    });
    ['grp-titolo', 'tab-grp', 'grp-altri'].forEach((n) => dash.draw(n));
  };
})();

dash.draw('grp-titolo', (el) => {
  const c = LX.grpCoppiaInfo();
  el.textContent = c ? `Dentro la filiera: ${c.filiera}, ${c.paese} (` + (c.motivo ? `filiera esclusa dal calcolo: ${c.motivo})` : `spazio della filiera ${LX.f.m(c.spazio)} mln/anno, media 2023-25)`) : 'Dentro la filiera';
});

dash.draw('tab-grp', (tb) => {
  const d = LX.grpData('gruppi_coppie'), g = LX.grpData('gruppi_dr');
  const c = LX.grpCoppiaInfo();
  if (!d || !g) { tb.replaceChildren(); return; }
  if (!c) { LX.grpMsg(tb, 5, 'Scegliere una riga della tabella qui sopra.'); return; }
  if (c.motivo === 'filiera concentrata') {
    const q = LX.grpData('filiere_dr');
    const fr = q ? q.find((x) => String(x.dr) === c.dr && x.cpa === c.cpa) : null;
    LX.grpMsg(tb, 5, 'Filiera concentrata' + (fr && fr.concentrata_su ? ' su ' + fr.concentrata_su : '') + ': il dettaglio per gruppo non si calcola.');
    return;
  }
  if (!LX.grpN(c.cpa)) { LX.grpMsg(tb, 5, 'Questa filiera ha un solo gruppo di prodotti nella classificazione Istat: non c\'è un dettaglio più fine.'); return; }
  const rows = d.filter((r) => r.coppia === LX.grpCoppia).sort((a, b) => LX.N(b.spazio_gruppo_mln) - LX.N(a.spazio_gruppo_mln));
  if (!rows.length) { LX.grpMsg(tb, 5, 'Nessun gruppo sopra la soglia di lettura per questa coppia.'); return; }
  tb.querySelectorAll('tr.lx-grp-msg').forEach((e) => e.remove());
  const f = LX.fmt;
  LX.rows(tb, rows, [
    { text: (r) => LX.grpNome(r) },
    { n: 1, text: (r) => f(r.export_dr_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.quota_dr_pct, 'dec') },
    { n: 1, text: (r) => f(r.quota_resto_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.spazio_gruppo_mln, 'm') },
  ], (r) => encodeURIComponent(r.chiave));
});

dash.draw('grp-altri', (el) => {
  const d = LX.grpData('gruppi_coppie');
  const c = LX.grpCoppiaInfo();
  const n = c ? LX.grpN(c.cpa) : 0;
  if (!d || !c || !n || c.motivo === 'filiera concentrata') { el.textContent = ''; return; }
  const k = d.filter((r) => r.coppia === LX.grpCoppia).length;
  const altri = n - k;
  el.textContent = altri > 0 ? `Altri gruppi della filiera: ${altri}, sotto la soglia di lettura, senza spazio o con oltre metà dell'export del territorio in un solo Paese.` : '';
});

dash.draw('tab-nascosto', (tb) => {
  const d = LX.grpData('gruppi_coppie');
  if (!d) { tb.replaceChildren(); return; }
  const rows = d.filter((r) => String(r.dr) === String(LX.dr) && LX.N(r.spazio_filiera_mln) < 5)
    .sort((a, b) => LX.N(b.spazio_gruppo_mln) - LX.N(a.spazio_gruppo_mln));
  if (!rows.length) { LX.grpMsg(tb, 9, 'Nessun caso per questo territorio.'); return; }
  tb.querySelectorAll('tr.lx-grp-msg').forEach((e) => e.remove());
  const f = LX.fmt;
  LX.rows(tb, rows, [
    { text: (r) => r.filiera },
    { text: (r) => LX.grpNome(r) },
    { text: (r) => r.paese },
    { n: 1, text: (r) => f(r.export_dr_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.quota_dr_pct, 'dec') },
    { n: 1, text: (r) => f(r.quota_resto_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.spazio_gruppo_mln, 'm') },
    { n: 1, text: (r) => f(r.spazio_filiera_mln, 'm') },
    { text: (r) => (r.motivo_filiera ? 'filiera esclusa: ' + r.motivo_filiera : '') },
  ], (r) => encodeURIComponent(r.chiave));
});

// scheda Filiere: gruppi della filiera scelta
LX.grpFil = function () {
  const sel = document.querySelector('select[data-draw="sel-filiera"]');
  return sel && sel.value ? sel.value : LX.filiera;
};

dash.draw('sel-grp', (sel) => {
  const g = LX.grpData('gruppi_dr');
  if (!g) return;
  const cpa = LX.grpFil();
  const gr = d3.rollups(g.filter((r) => r.cpa === cpa), (v) => LX.grpNome(v[0]), (r) => r.gruppo_cod).sort((a, b) => a[0].localeCompare(b[0]));
  sel.replaceChildren(...gr.map(([c, n]) => new Option(n, c)));
  sel.disabled = !gr.length;
  if (!gr.some(([c]) => c === LX.grpSel)) LX.grpSel = gr.length ? gr[0][0] : '';
  sel.value = LX.grpSel;
  sel.onchange = () => { LX.grpSel = sel.value; ['tab-grp-dr', 'tab-grp-vuoti'].forEach((n) => dash.draw(n)); };
});

dash.draw('grp-fil-msg', (el) => {
  const g = LX.grpData('gruppi_dr');
  if (!g) { el.textContent = ''; return; }
  el.textContent = LX.grpN(LX.grpFil()) ? '' : 'Questa filiera ha un solo gruppo di prodotti nella classificazione Istat: non c\'è un dettaglio più fine.';
});

dash.draw('tab-grp-dr', (tb) => {
  const g = LX.grpData('gruppi_dr');
  if (!g) { tb.replaceChildren(); return; }
  if (!LX.grpN(LX.grpFil())) { LX.grpMsg(tb, 3, 'Nessun dettaglio per questa filiera.'); return; }
  const rows = g.filter((r) => r.gruppo_cod === LX.grpSel).sort((a, b) => LX.N(b.export_medio_mln) - LX.N(a.export_medio_mln));
  tb.querySelectorAll('tr.lx-grp-msg').forEach((e) => e.remove());
  const f = LX.fmt;
  LX.rows(tb, rows, [
    { text: (r) => LX.drNome(r.dr) },
    { n: 1, text: (r) => f(r.export_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.peso_su_filiera_pct, 'dec') },
  ], (r) => encodeURIComponent(r.chiave));
});

dash.draw('tab-grp-vuoti', (tb) => {
  const d = LX.grpData('gruppi_coppie');
  if (!d) { tb.replaceChildren(); return; }
  if (!LX.grpN(LX.grpFil())) { LX.grpMsg(tb, 6, 'Nessun dettaglio per questa filiera.'); return; }
  const rows = d.filter((r) => r.gruppo_cod === LX.grpSel).sort((a, b) => LX.N(b.spazio_gruppo_mln) - LX.N(a.spazio_gruppo_mln)).slice(0, 30);
  if (!rows.length) { LX.grpMsg(tb, 6, 'Nessun caso sopra la soglia di lettura in questo gruppo.'); return; }
  tb.querySelectorAll('tr.lx-grp-msg').forEach((e) => e.remove());
  const f = LX.fmt;
  LX.rows(tb, rows, [
    { text: (r) => LX.drNome(r.dr) },
    { text: (r) => r.paese },
    { n: 1, text: (r) => f(r.export_dr_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.quota_dr_pct, 'dec') },
    { n: 1, text: (r) => f(r.quota_resto_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.spazio_gruppo_mln, 'm') },
  ], (r) => encodeURIComponent(r.chiave));
});

// collegamenti: clic su una riga delle opportunita, cambio di territorio, di filtri e di filiera
(function () {
  const tb = document.querySelector('tbody[data-draw="tab-opp"]');
  if (tb) {
    tb.addEventListener('click', (ev) => {
      const tr = ev.target.closest('tr[data-key]');
      if (!tr) return;
      LX.grpCoppia = decodeURIComponent(tr.getAttribute('data-key'));
      LX.grpScegli();
      const pan = document.getElementById('dr-gruppi');
      if (pan && pan.scrollIntoView) pan.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    new MutationObserver(() => LX.grpScegli()).observe(tb, { childList: true });
  }
  document.querySelectorAll('#sel-dr').forEach((s) => s.addEventListener('change', () => { LX.grpCoppia = ''; dash.draw('tab-nascosto'); LX.grpScegli(); }));
  document.querySelectorAll('select[data-draw="sel-filiera"]').forEach((s) => s.addEventListener('change', () => ['sel-grp', 'grp-fil-msg', 'tab-grp-dr', 'tab-grp-vuoti'].forEach((n) => dash.draw(n))));
  dash.onData(() => LX.grpScegli());
})();
