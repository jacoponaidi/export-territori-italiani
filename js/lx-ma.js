window.LX = window.LX || {};
LX.maFil = LX.maFil || 'CK28';
LX.maPaese = LX.maPaese || 'US';
LX.maFam = LX.maFam || '0';
LX.maOrdine = LX.maOrdine || 50000;
(function () {
  const ART = { AT: "l'Austria", BE: 'il Belgio', BG: 'la Bulgaria', CZ: 'la Repubblica Ceca', DE: 'la Germania', DK: 'la Danimarca', ES: 'la Spagna', FR: 'la Francia', GR: 'la Grecia', HR: 'la Croazia', HU: "l'Ungheria", IE: "l'Irlanda", NL: 'i Paesi Bassi', PL: 'la Polonia', PT: 'il Portogallo', RO: 'la Romania', SE: 'la Svezia', SI: 'la Slovenia', SK: 'la Slovacchia', BR: 'il Brasile', CA: 'il Canada', CH: 'la Svizzera', CN: 'la Cina', GB: 'il Regno Unito', ID: "l'Indonesia", IN: "l'India", JP: 'il Giappone', KR: 'la Corea del Sud', MX: 'il Messico', SA: "l'Arabia Saudita", US: 'gli Stati Uniti' };
  const PL = { US: 1, NL: 1 };
  LX.maNome = (c, mid) => { const t = ART[c] || c; return mid ? t : t.charAt(0).toUpperCase() + t.slice(1); };
  LX.maVerbo = (c, sg, pl) => (PL[c] ? pl : sg);
  LX.maArt = (t) => LX.il(t).slice(0, -String(t).length);
  // arrotondamento commerciale a un decimale (7,35 -> 7,4), anche dove il valore binario sta appena sotto
  LX.r1 = (x) => Math.round(+(x * 10).toPrecision(12)) / 10;
  LX.maPct = (v) => (LX.N(v) === null ? '-' : LX.f.dec(LX.N(v)).replace(',0', ''));
  const UE = new Set(['AT', 'BE', 'BG', 'CZ', 'DE', 'DK', 'ES', 'FR', 'GR', 'HR', 'HU', 'IE', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK']);
  LX.maFilOk = (v) => { const t = String(v || ''); return t === LX.maFil || t === '*' || t.split(',').map((x) => x.trim()).includes(LX.maFil); };
  LX.maPaeseOk = (v) => v === LX.maPaese || (v === 'UE' && UE.has(LX.maPaese));
  // righe della coppia; con "proprie" le righe della filiera prendono il posto di quelle valide per tutte (filiera "*")
  LX.maRows = function (id, proprie) {
    const s = dash.data(id);
    if (s.status !== 'ok') return null;
    const r = s.data.filter((x) => LX.maFilOk(x.filiera_cpa) && LX.maPaeseOk(x.paese_cod));
    if (proprie && r.some((x) => x.filiera_cpa === LX.maFil)) return r.filter((x) => x.filiera_cpa === LX.maFil);
    return r;
  };
  LX.maStato = function () {
    const s = dash.data('ma_stato');
    return s.status === 'ok' ? s.data.find((r) => r.filiera_cpa === LX.maFil && r.paese_cod === LX.maPaese) : null;
  };
  // tabella: righe, colonne {text, n, cls, opt}; le colonne opt vuote per tutta la selezione si nascondono (anche l'intestazione)
  LX.maTab = function (tb, rows, cols, keyFn, rowClass, vuotoTesto) {
    const table = tb.closest('table');
    const vuote = cols.map((c) => !!c.opt && rows.every((r) => { const v = c.text(r); return v === '' || v === '-' || v === null || v === undefined; }));
    if (!rows.length) {
      d3.select(tb).selectAll('tr').remove();
      const tr = document.createElement('tr'); tr.className = 'row-muted lx-ma-vuoto';
      const td = document.createElement('td'); td.colSpan = cols.length; td.textContent = vuotoTesto || 'Nessun dato per questa coppia filiera-Paese.';
      tr.append(td); tb.append(tr);
    } else {
      tb.querySelectorAll('tr.lx-ma-vuoto').forEach((e) => e.remove());
      LX.rows(tb, rows, cols.map((c, i) => ({ n: c.n, text: c.text, cls: (r) => [c.cls ? c.cls(r) : '', vuote[i] ? 'lx-ma-off' : ''].join(' ').trim() })), keyFn, rowClass);
    }
    if (table) table.querySelectorAll('thead th').forEach((th, i) => { th.hidden = !!(rows.length && vuote[i]); });
  };
  LX.maTesti = function (slot) {
    const s = dash.data('ma_testi');
    if (s.status !== 'ok') return [];
    return s.data.filter((r) => (r.filiera_cpa === '*' || r.filiera_cpa === LX.maFil) && r.slot === slot && (!r.paese_cod || r.paese_cod === LX.maPaese))
      .sort((a, b) => ((a.filiera_cpa === '*' ? 0 : 1) - (b.filiera_cpa === '*' ? 0 : 1)) || ((a.paese_cod ? 1 : 0) - (b.paese_cod ? 1 : 0)) || (a.ordine - b.ordine));
  };
  LX.maTutti = ['ma-sel-paese', 'ma-st-note', 'ma-cod', 'ma-sintesi', 'ma-testo', 'ma-tab-acc', 'ma-tab-tax', 'ma-cal-titolo', 'ma-tab-cal', 'ma-cal-th', 'ma-tab-sped', 'ma-tab-tr', 'ma-tab-req', 'ma-sel-fam', 'ma-conc-sintesi', 'ma-tab-conc', 'ma-tab-ita', 'ma-metodo'];
  LX.maBox = function () {
    const s = dash.data('ma_calendari');
    const c = s.status === 'ok' && s.data.some((r) => r.filiera_cpa === LX.maFil && r.paese_cod === LX.maPaese);
    document.querySelectorAll('#ma-cal-box').forEach((b) => { b.hidden = !c; });
    const st = LX.maStato();
    document.querySelectorAll('#ma-note-coppia').forEach((b) => { b.hidden = !(st && st.note); });
  };
  LX.maRidisegna = () => { LX.maBox(); LX.maTutti.forEach((n) => dash.draw(n)); };
})();

dash.onData(() => LX.maBox());

dash.draw('ma-sel-fil', (sel) => {
  const s = dash.data('ma_codici');
  if (s.status !== 'ok') return;
  sel.replaceChildren(...s.data.slice().sort((a, b) => a.filiera.localeCompare(b.filiera, 'it')).map((r) => new Option(r.filiera.charAt(0).toUpperCase() + r.filiera.slice(1), r.filiera_cpa)));
  sel.value = LX.maFil;
  sel.onchange = () => { LX.maFil = sel.value; LX.maFam = '0'; LX.maRidisegna(); };
});

dash.draw('ma-sel-paese', (sel) => {
  const s = dash.data('ma_stato');
  if (s.status !== 'ok') return;
  const rows = s.data.filter((r) => r.filiera_cpa === LX.maFil).sort((a, b) => a.paese.localeCompare(b.paese, 'it'));
  const grp = (g, lab) => {
    const o = document.createElement('optgroup'); o.label = lab;
    rows.filter((r) => r.gruppo === g).forEach((r) => o.append(new Option(r.paese, r.paese_cod)));
    return o;
  };
  sel.replaceChildren(grp('UE', 'Unione europea (mercato unico)'), grp('extra UE', "Fuori dall'UE"));
  sel.value = LX.maPaese;
  sel.onchange = () => { LX.maPaese = sel.value; LX.maFam = '0'; LX.maRidisegna(); };
});

dash.draw('ma-st-note', (el) => {
  const r = LX.maStato();
  el.textContent = r ? (r.note || '') : '';
});

dash.draw('ma-cod', (el) => {
  const s = dash.data('ma_codici');
  const r = s.status === 'ok' ? s.data.find((x) => x.filiera_cpa === LX.maFil) : null;
  if (!r) { el.textContent = '-'; return; }
  const v = r[el.dataset.field];
  el.textContent = v === null || v === undefined || v === '' ? (el.dataset.field === 'nota' ? '' : '-') : (typeof v === 'number' ? LX.f.dec(v) : String(v));
});

dash.draw('ma-sintesi', (el) => {
  const s = dash.data('ma_mercato');
  const key = LX.maFil + '|' + LX.maPaese;
  el.replaceChildren();
  if (s.status !== 'ok') { el.textContent = '-'; return; }
  const r = s.data.find((x) => x.chiave === key);
  if (!r) { el.textContent = 'Nessun dato sul mercato per questa coppia.'; return; }
  const add = (t) => el.append(document.createTextNode(t));
  const num = (txt) => { const b = document.createElement('b'); b.textContent = txt; el.append(b); };
  add(LX.maNome(LX.maPaese) + LX.maVerbo(LX.maPaese, ' importa', ' importano') + ' '); num(LX.f.int(+r.import_mln)); add(' milioni di euro l\'anno di ' + r.filiera + ' (media 2023-25), ');
  num(LX.f.pctd(+r.crescita_import_pct)); const qi = LX.f.dec(+r.quota_italia_pct) + '%';
  add(' dal 2023 al 2025. L\'Italia pesa per ' + LX.maArt(qi)); num(qi); add(' (media 2023-25; ');
  num(LX.f.pt(+r.var_quota_italia_punti)); add(' punti dal 2023 al 2025). I 12 territori ci vendono ');
  num(LX.f.int(+r.export_12dr_mln)); add(' milioni l\'anno (media 2023-25). Il loro export mancante è di ');
  num(LX.f.int(+r.mancante_12dr_mln)); add(' milioni l\'anno (media 2023-25).');
  const dr = String(r.dr_elenco || '').split('-').filter(Boolean);
  if (dr.length) {
    add(' Territori con almeno 5 milioni di export mancante: ');
    const sp = document.createElement('span');
    sp.textContent = dr.map(LX.drNome).join('; '); el.append(sp); add('.');
  } else add(' Nessun territorio ha almeno 5 milioni di export mancante.');
});

dash.draw('ma-testo', (el) => {
  const t = LX.maTesti(el.dataset.slot).map((r) => r.testo);
  if (!t.length && el.dataset.default) t.push(el.dataset.default);
  el.replaceChildren(...t.map((x) => { const p = document.createElement('p'); p.className = el.dataset.kind === 'take' ? 'lx-take' : 'lx-note'; p.textContent = x; return p; }));
});

dash.draw('ma-metodo', (ul) => {
  const t = LX.maTesti('metodo');
  ul.replaceChildren(...t.map((r) => { const li = document.createElement('li'); li.textContent = r.testo; return li; }));
});

dash.draw('ma-tab-acc', (tb) => {
  const rows = LX.maRows('ma_accesso');
  if (!rows) { tb.replaceChildren(); return; }
  const st = LX.maStato();
  rows.sort((a, b) => a.ordine - b.ordine);
  LX.maTab(tb, rows, [
    { text: (r) => r.famiglia },
    { text: (r) => r.codici || '', opt: 1 },
    { n: 1, text: (r) => LX.maPct(r.dazio_ue_medio_pct) },
    { n: 1, opt: 1, text: (r) => (LX.N(r.dazio_ue_min_pct) === null ? '-' : LX.maPct(r.dazio_ue_min_pct) + ' - ' + LX.maPct(r.dazio_ue_max_pct)) },
    { n: 1, text: (r) => LX.maPct(r.dazio_normale_medio_pct) },
    { n: 1, opt: 1, text: (r) => LX.fmt(r.righe, 'int') || '-' },
    { text: (r) => r.nota || '' },
    { text: (r) => r.aggiornato || '', opt: 1 },
  ], (r) => encodeURIComponent(r.chiave), (r) => (r.tipo === 'famiglia' && r.ordine === 0 && r.righe ? 'row-strong' : null),
  st && st.gruppo === 'UE' ? 'Mercato unico europeo: nessun dazio e nessuna dogana.' : null);
});

dash.draw('ma-tab-tax', (tb) => {
  const rows = LX.maRows('ma_tasse', true);
  if (!rows) { tb.replaceChildren(); return; }
  rows.sort((a, b) => a.ordine - b.ordine);
  LX.maTab(tb, rows, [{ text: (r) => r.voce }, { text: (r) => r.aliquota }, { text: (r) => r.base }], (r) => encodeURIComponent(r.chiave));
});

dash.draw('ma-cal-titolo', (el) => {
  const t = LX.maTesti('calendario_titolo');
  el.textContent = t.length ? t[0].testo : '-';
});

dash.draw('ma-cal-th', (el) => {
  const t = LX.maTesti(el.dataset.slot);
  el.textContent = t.length ? t[0].testo.replace(/^Dazio (per merce UE|normale) \(%\)/, '') : '';
});

dash.draw('ma-tab-cal', (tb) => {
  const rows = LX.maRows('ma_calendari');
  if (!rows) { tb.replaceChildren(); return; }
  LX.maTab(tb, rows.sort((a, b) => a.anno - b.anno), [
    { text: (r) => r.quando },
    { n: 1, text: (r) => LX.maPct(r.dazio_ue_pct) },
    { n: 1, text: (r) => LX.maPct(r.dazio_normale_pct) },
  ], (r) => encodeURIComponent(r.chiave));
});

dash.draw('ma-tab-sped', (tb) => {
  const s = dash.data('ma_spedizione');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const rows = s.data.filter((r) => r.paese_cod === LX.maPaese);
  const v = LX.maOrdine;
  LX.maTab(tb, rows, [
    { text: (r) => r.modo },
    { text: (r) => r.area },
    { text: (r) => r.nolo },
    { n: 1, text: (r) => LX.fmt(r.nolo_eur, 'int') },
    { n: 1, text: (r) => LX.fmt(r.var_2024_pct, 'pctd') },
    { n: 1, opt: 1, text: (r) => LX.fmt(r.costo_ton_eur, 'dec') },
    { n: 1, text: (r) => (v > 0 ? LX.f.dec(LX.r1(+r.nolo_eur / v * 100)) + '%' : '-') },
  ], (r) => encodeURIComponent(r.chiave));
});

dash.draw('ma-tab-tr', (tb) => {
  const rows = LX.maRows('ma_trasporto');
  if (!rows) { tb.replaceChildren(); return; }
  rows.sort((a, b) => (b.totale - a.totale) || (a.ordine - b.ordine));
  LX.maTab(tb, rows, [
    { text: (r) => r.famiglia },
    { n: 1, text: (r) => LX.fmt(r.export_2025_mln_eur, 'dec') || '-' },
    { n: 1, opt: 1, text: (r) => LX.fmt(r.export_2023_mln_eur, 'dec') || '-' },
    { n: 1, opt: 1, text: (r) => LX.fmt(r.peso_2025_t, 'int') || '-' },
    { n: 1, text: (r) => LX.fmt(r.valore_kg_eur_2025, 'dec') || '-' },
    { n: 1, text: (r) => LX.fmt(r.valore_kg_eur_2023, 'dec') || '-' },
    { n: 1, opt: 1, text: (r) => LX.fmt(r.peso_trasporto_pct, 'dec') || '-' },
    { n: 1, opt: 1, text: (r) => LX.fmt(r.nolo_assic_pct, 'dec') || '-' },
    { opt: 1, text: (r) => r.nota || '' },
  ], (r) => encodeURIComponent(r.chiave), (r) => (r.totale ? 'row-strong' : null));
});

dash.draw('ma-tab-req', (tb) => {
  const rows = LX.maRows('ma_requisiti');
  tb.replaceChildren();
  if (!rows) return;
  const SO = { 'Paese': 0, 'Filiera (regole UE)': 1, 'Filiera e Paese': 2 };
  rows.sort((a, b) => ((SO[a.strato] ?? 9) - (SO[b.strato] ?? 9)) || (a.ordine - b.ordine));
  if (!rows.length) { LX.maTab(tb, [], [{}, {}, {}, {}]); return; }
  rows.forEach((r) => {
    const tr = document.createElement('tr'); tr.setAttribute('data-key', encodeURIComponent(r.chiave));
    const t0 = document.createElement('td'); t0.textContent = r.strato === 'Paese' ? 'Tutte le filiere' : r.strato === 'Filiera (regole UE)' ? 'Filiera, regole UE' : 'Filiera nel Paese';
    const t1 = document.createElement('td'); t1.textContent = r.tema;
    const t2 = document.createElement('td'); t2.textContent = r.testo;
    const t3 = document.createElement('td');
    if (/^https?:/.test(String(r.link || ''))) { const a = document.createElement('a'); a.href = r.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.fonte; t3.append(a); } else t3.textContent = r.fonte;
    tr.append(t0, t1, t2, t3); tb.append(tr);
  });
});

LX.maConcAll = () => LX.maRows('ma_concorrenti');
LX.maConc = function () {
  const rows = LX.maConcAll();
  if (!rows) return null;
  return rows.filter((r) => String(r.ordine_famiglia) === LX.maFam).sort((a, b) => (a.posizione || 99) - (b.posizione || 99));
};

dash.draw('ma-sel-fam', (sel) => {
  const rows = LX.maConcAll() || [];
  const fam = d3.rollups(rows, (v) => v[0].famiglia, (r) => r.ordine_famiglia).sort((a, b) => a[0] - b[0]);
  if (!fam.length) { sel.replaceChildren(new Option('Nessun dato', '0')); sel.disabled = true; return; }
  sel.disabled = false;
  sel.replaceChildren(...fam.map(([o, l]) => new Option(l, String(o))));
  if (!fam.some(([o]) => String(o) === LX.maFam)) LX.maFam = String(fam[0][0]);
  sel.value = LX.maFam;
  sel.onchange = () => { LX.maFam = sel.value; ['ma-conc-sintesi', 'ma-tab-conc'].forEach((n) => dash.draw(n)); };
});

dash.draw('ma-conc-sintesi', (el) => {
  const rows = LX.maConc();
  el.replaceChildren();
  if (!rows || !rows.length) { el.textContent = '-'; return; }
  const it = rows.find((r) => r.italia === 'sì');
  const add = (t) => el.append(document.createTextNode(t));
  const num = (txt) => { const b = document.createElement('b'); b.textContent = txt; el.append(b); };
  const r0 = rows[0];
  add('Nel 2025 ' + LX.maNome(LX.maPaese, true) + LX.maVerbo(LX.maPaese, ' ha', ' hanno') + ' importato '); num(LX.f.m(+r0.mercato_2025_mln_eur)); add(' milioni di euro (2023: ');
  num(LX.f.m(+r0.mercato_2023_mln_eur)); const q0 = LX.f.dec(+r0.quota_2025_pct) + '%';
  add('). Primo fornitore: ' + r0.partner + ' con ' + LX.maArt(q0)); num(q0); add('.');
  if (it && it !== r0 && it.posizione_testo === 'nessun export') add(' L\'Italia non vi esporta.');
  else if (it && it !== r0) {
    const q1 = LX.f.dec(+it.quota_2025_pct) + '%';
    add(' L\'Italia ' + (it.posizione ? 'è ' + it.posizione + 'ª' : 'è fuori dai primi 7') + ' con ' + LX.maArt(q1)); num(q1);
    if (it.var_quota_punti !== null && it.var_quota_punti !== undefined) { add(' ('); num(LX.f.pt(+it.var_quota_punti)); add(' punti dal 2023).'); } else add('.');
  } else if (it) add(' L\'Italia è il primo fornitore.');
});

dash.draw('ma-tab-conc', (tb) => {
  const rows = LX.maConc();
  if (!rows) { tb.replaceChildren(); return; }
  LX.maTab(tb, rows, [
    { n: 1, text: (r) => r.posizione_testo },
    { text: (r) => r.partner },
    { n: 1, text: (r) => LX.fmt(r.valore_2025_mln_eur, 'm') },
    { n: 1, text: (r) => LX.fmt(r.quota_2025_pct, 'dec') },
    { n: 1, text: (r) => LX.fmt(r.quota_2023_pct, 'dec') || '-' },
    { n: 1, cls: (r) => LX.sc(r.var_quota_punti), text: (r) => LX.fmt(r.var_quota_punti, 'pt') || '-' },
  ], (r) => encodeURIComponent(r.chiave), (r) => (r.italia === 'sì' ? 'row-strong' : null));
});

dash.draw('ma-tab-ita', (tb) => {
  const rows = LX.maConcAll();
  if (!rows) { tb.replaceChildren(); return; }
  const it = rows.filter((r) => r.italia === 'sì').sort((a, b) => a.ordine_famiglia - b.ordine_famiglia);
  LX.maTab(tb, it, [
    { text: (r) => r.famiglia },
    { n: 1, text: (r) => LX.fmt(r.mercato_2025_mln_eur, 'm') },
    { n: 1, text: (r) => r.posizione_testo },
    { n: 1, text: (r) => LX.fmt(r.quota_2025_pct, 'dec') },
    { n: 1, cls: (r) => LX.sc(r.var_quota_punti), text: (r) => LX.fmt(r.var_quota_punti, 'pt') || '-' },
  ], (r) => encodeURIComponent(r.chiave), (r) => (r.ordine_famiglia === 0 ? 'row-strong' : null));
});

document.querySelectorAll('#inp-ma-ordine').forEach((i) => i.addEventListener('input', () => {
  const v = parseFloat(i.value);
  LX.maOrdine = isFinite(v) && v > 0 ? v : 0;
  dash.draw('ma-tab-sped');
}));
