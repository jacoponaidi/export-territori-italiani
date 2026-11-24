LX.lista = function (tb, nome) {
  const s = dash.data('liste');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const f = LX.fmt, N = LX.N;
  const rows = s.data.filter((r) => String(r.dr) === LX.dr && r.lista === nome);
  const paese = { text: (r) => r.paese };
  if (nome === 'Consolidare') {
    rows.sort((a, b) => N(b.export_medio_mld) - N(a.export_medio_mld));
    LX.rows(tb, rows, [
      paese,
      { n: 1, text: (r) => f(r.export_medio_mld, 'mld') },
      { n: 1, text: (r) => f(r.peso_pct, 'dec') },
      { n: 1, text: (r) => f(r.var_23_25_pct, 'pct'), cls: (r) => LX.sc(r.var_23_25_pct) },
      { n: 1, text: (r) => f(r.domanda_cons_pct, 'pct'), cls: (r) => LX.sc(r.domanda_cons_pct) },
    ], (r) => encodeURIComponent(r.chiave));
    return;
  }
  rows.sort((a, b) => N(b.export_mancante_mln) - N(a.export_mancante_mln));
  LX.rows(tb, rows, [
    paese,
    { n: 1, text: (r) => f(r.export_mancante_mln, 'int') },
    { text: (r) => r.filiere || '' },
    { n: 1, text: (r) => f(r.mercato_filiere_mld, 'dec') },
    { n: 1, text: (r) => f(r.domanda_pct, 'pct'), cls: (r) => LX.sc(r.domanda_pct) },
    { n: 1, text: (r) => f(r.quota_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.var_quota_punti, 'pt'), cls: (r) => LX.sc(r.var_quota_punti) },
  ], (r) => encodeURIComponent(r.chiave));
};
dash.draw('tab-liste', (tb) => LX.lista(tb, 'Consolidare'));
dash.draw('tab-liste-a', (tb) => LX.lista(tb, 'Approfondire'));
dash.draw('tab-liste-o', (tb) => LX.lista(tb, 'Aprire'));
document.querySelectorAll('#sel-dr').forEach((s) => s.addEventListener('change', () => { dash.draw('tab-liste-a'); dash.draw('tab-liste-o'); }));

dash.draw('sel-opp-paese', (sel) => {
  const rows = LX.oppDR() || [];
  const tot = d3.rollups(rows, (v) => d3.sum(v, (r) => LX.N(r.export_mancante_mln)), (r) => r.paese).sort((a, b) => b[1] - a[1]);
  sel.replaceChildren(new Option('Tutti i Paesi', ''), ...tot.map(([p]) => p).sort((a, b) => a.localeCompare(b, 'it')).map((p) => new Option(p, p)));
  sel.value = LX.oppPaese;
  sel.onchange = () => { LX.oppPaese = sel.value; dash.draw('tab-opp'); };
});

dash.draw('sel-opp-fil', (sel) => {
  const rows = LX.oppDR() || [];
  const tot = d3.rollups(rows, (v) => d3.sum(v, (r) => LX.N(r.export_mancante_mln)), (r) => r.filiera).sort((a, b) => b[1] - a[1]);
  sel.replaceChildren(new Option('Tutte le filiere', ''), ...tot.map(([p]) => p).sort((a, b) => a.localeCompare(b, 'it')).map((p) => new Option(p, p)));
  sel.value = LX.oppFil;
  sel.onchange = () => { LX.oppFil = sel.value; dash.draw('tab-opp'); };
});

dash.draw('tab-opp', (tb) => {
  const s = dash.data('opportunita');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const N = LX.N, f = LX.fmt;
  const rows = LX.oppDR().filter((r) => (!LX.oppPaese || r.paese === LX.oppPaese) && (!LX.oppFil || r.filiera === LX.oppFil) && (!LX.soglia || r.paese_sopra_soglia === 'sì'))
    .sort((a, b) => N(b.export_mancante_mln) - N(a.export_mancante_mln) || N(b.export_dr_medio_mln) - N(a.export_dr_medio_mln)).slice(0, 60);
  LX.rows(tb, rows, [
    { text: (r) => r.filiera },
    { text: (r) => r.paese },
    { n: 1, text: (r) => f(r.export_dr_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.quota_dr_pct, 'dec') },
    { n: 1, text: (r) => f(r.quota_resto_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.vuoto_punti, 'pt'), cls: (r) => (N(r.vuoto_punti) > 0 ? 'good' : '') },
    { n: 1, text: (r) => f(r.export_mancante_mln, 'm') },
    { n: 1, text: (r) => f(r.import_paese_mln, 'int') },
    { n: 1, text: (r) => f(r.crescita_import_pct, 'pctd'), cls: (r) => LX.sc(r.crescita_import_pct) },
    { n: 1, text: (r) => f(r.quota_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.var_quota_italia_punti, 'pt'), cls: (r) => LX.sc(r.var_quota_italia_punti) },
    { n: 1, text: (r) => f(r.var_dr_pct, 'pct'), cls: (r) => (r.lettura_dr === 'peggio' ? 'bad' : r.lettura_dr === 'meglio' ? 'good' : '') },
    { n: 1, text: (r) => f(r.var_resto_italia_pct, 'pct') },
    { n: 1, text: (r) => f(r.h1_2026_mln, 'm') },
    { text: (r) => [r.escluso_perche, r.lettura_dr === 'piccolo' ? 'flusso del territorio sotto 10 mln' : r.lettura_dr === 'forte' ? 'variazione del territorio molto forte' : ''].filter(Boolean).join('; ') },
  ], (r) => encodeURIComponent(r.chiave), (r) => (r.paese_sopra_soglia === 'sì' ? 'row-strong' : null));
});

dash.draw('sel-vuoto', (sel) => {
  const s = dash.data('liste');
  const est = s.status === 'ok' ? s.data.filter((r) => String(r.dr) === LX.dr && r.lista !== 'Consolidare') : [];
  const rows = LX.oppDR() || [];
  const tot = d3.rollups(rows, (v) => d3.sum(v, (r) => LX.N(r.export_mancante_mln)), (r) => r.paese).sort((a, b) => b[1] - a[1]).map((d) => d[0]);
  const list = [...new Set(est.map((r) => r.paese).concat(tot))];
  if (!LX.vuoto || !list.includes(LX.vuoto)) LX.vuoto = list[0] || '';
  sel.replaceChildren(...[...list].sort((a, b) => a.localeCompare(b, 'it')).map((p) => new Option(p, p)));
  sel.value = LX.vuoto;
  sel.onchange = () => { LX.vuoto = sel.value; dash.draw('vuoto'); };
});

dash.draw('vuoto', (el) => {
  const s = dash.data('opportunita');
  if (s.status !== 'ok') { LX.empty(el, s); return; }
  const N = LX.N, f = LX.f;
  if (!LX.vuoto) dash.draw('sel-vuoto');
  const rows = (LX.oppDR() || []).filter((r) => r.paese === LX.vuoto && N(r.export_mancante_mln) > 0)
    .sort((a, b) => N(b.export_mancante_mln) - N(a.export_mancante_mln)).slice(0, 12);
  el.replaceChildren();
  if (!rows.length) { el.textContent = 'Nessuna filiera con export mancante verso questo Paese.'; return; }
  const W = el.clientWidth || 600, bh = 26, m = { t: 22, r: 70, b: 8, l: 10 };
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('role', 'img').attr('aria-label', "Quota del Paese nell'export del territorio e del resto d'Italia per filiera");
  const labs = svg.append('g').selectAll('text').data(rows).join('text').attr('class', 'lab2').text((r) => r.filiera);
  let lw = 0; labs.each(function () { lw = Math.max(lw, this.getComputedTextLength()); });
  m.l = Math.min(lw + 14, W * 0.4);
  const H = m.t + m.b + rows.length * bh;
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  const xm = d3.max(rows, (r) => Math.max(N(r.quota_dr_pct), N(r.quota_resto_italia_pct)));
  const x = d3.scaleLinear().domain([0, xm]).nice().range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(rows.map((r) => r.chiave)).range([m.t, H - m.b]).padding(0.3);
  labs.attr('x', m.l - 8).attr('text-anchor', 'end').attr('y', (r) => y(r.chiave) + y.bandwidth() / 2 + 4);
  svg.append('g').attr('transform', `translate(0,${m.t})`).call(d3.axisTop(x).ticks(Math.max(2, Math.floor(W / 120))).tickFormat((v) => f.int(v) + '%'))
    .call((g) => g.selectAll('line,path').style('stroke', 'var(--cds-chart-axis)'));
  const tip = LX.tip(el);
  const g = svg.append('g').selectAll('g').data(rows).join('g');
  const cy = (r) => y(r.chiave) + y.bandwidth() / 2;
  g.append('line').attr('x1', (r) => x(N(r.quota_dr_pct))).attr('x2', (r) => x(N(r.quota_resto_italia_pct))).attr('y1', cy).attr('y2', cy).style('stroke', 'var(--cds-chart-muted)').style('stroke-width', 3);
  g.append('circle').attr('cx', (r) => x(N(r.quota_resto_italia_pct))).attr('cy', cy).attr('r', 6).style('fill', 'var(--color-bg)').style('stroke', dash.colors[0]).style('stroke-width', 2);
  g.append('circle').attr('cx', (r) => x(N(r.quota_dr_pct))).attr('cy', cy).attr('r', 6).style('fill', dash.colors[0]);
  g.append('text').attr('x', W - 4).attr('text-anchor', 'end').attr('y', (r) => cy(r) + 4).text((r) => f.m(N(r.export_mancante_mln)) + ' mln');
  g.append('rect').attr('x', m.l).attr('width', W - m.l - m.r).attr('y', (r) => y(r.chiave)).attr('height', y.bandwidth()).style('fill', 'transparent')
    .on('pointerenter pointermove', (ev, r) => tip.show(ev, `${r.filiera}, ${r.paese}, media 2023-2025: nel Paese va ${LX.il(f.dec(N(r.quota_dr_pct)) + '%')} dell'export del territorio e ${LX.il(f.dec(N(r.quota_resto_italia_pct)) + '%')} di quello del resto d'Italia. Export mancante ${f.m(N(r.export_mancante_mln))} mln l'anno.` + (N(r.import_paese_mln) !== null ? ` Il Paese importa ${f.int(N(r.import_paese_mln))} mln l'anno (media 2023-25), ${f.pctd(N(r.crescita_import_pct))} dal 2023 al 2025.` : '')))
    .on('pointerleave', () => tip.hide());
});

dash.draw('tab-fil', (tb) => {
  const s = dash.data('filiere_dr');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const f = LX.fmt;
  const rows = s.data.filter((r) => String(r.dr) === LX.dr).sort((a, b) => b.export_medio_mln - a.export_medio_mln);
  LX.rows(tb, rows, [
    { text: (r) => r.filiera },
    { n: 1, text: (r) => f(r.export_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.var_23_25_pct, 'pct'), cls: (r) => LX.sc(r.var_23_25_pct) },
    { n: 1, text: (r) => f(r.peso_su_perimetro_pct, 'dec') },
    { n: 1, text: (r) => f(r.quota_pmi_settore_pct, 'int') },
    { n: 1, text: (r) => f(r.mancante_tutti_paesi_mln, 'int') },
    { n: 1, text: (r) => f(r.mancante_paesi_sopra_soglia_mln, 'int') },
    { text: (r) => r.concentrata_su || '' },
    { text: (r) => r.confronto },
  ], (r) => encodeURIComponent(r.chiave));
});

LX.letturaDR = function (r) {
  const N = LX.N, f = LX.f, l = r.lettura_dr, vd = N(r.var_dr_pct), vr = N(r.var_resto_italia_pct), g = N(r.crescita_import_pct);
  if (l === 'piccolo' || !l) return ' Export del territorio sotto 10 mln in un anno: troppo piccolo per un confronto.';
  const base = ` Export del territorio 2023-25: ${f.pct(vd)} (resto d'Italia ${f.pct(vr)}` + (g !== null ? `, mercato ${f.pct(g)})` : ')');
  if (l === 'forte') return base + ': variazione molto forte (oltre il 50%), da verificare.';
  if (l === 'peggio') return base + ": il territorio va peggio del resto d'Italia.";
  if (l === 'meglio') return base + ": il territorio va meglio del resto d'Italia.";
  return base + ": il territorio è in linea con il resto d'Italia.";
};

dash.draw('matrice', (el) => {
  const s = dash.data('opportunita');
  if (s.status !== 'ok') { LX.empty(el, s); return; }
  const N = LX.N, f = LX.f;
  const rows = (LX.oppDR() || []).filter((r) => N(r.export_mancante_mln) > 0 && (!LX.mxCresc || N(r.crescita_import_pct) > 2));
  el.replaceChildren();
  if (!rows.length) { el.textContent = LX.mxCresc ? 'Nessuna filiera con export mancante in un mercato in crescita.' : 'Nessun export mancante per questo territorio.'; return; }
  const byP = d3.rollups(rows, (v) => ({ tot: d3.sum(v, (r) => N(r.export_mancante_mln)), sopra: v[0].paese_sopra_soglia === 'sì' }), (r) => r.paese);
  byP.sort((a, b) => (b[1].sopra - a[1].sopra) || (b[1].tot - a[1].tot));
  const paesi = byP.slice(0, 10);
  const fil = d3.rollups(rows, (v) => d3.sum(v, (r) => N(r.export_mancante_mln)), (r) => r.filiera).sort((a, b) => b[1] - a[1]).slice(0, 12).map((d) => d[0]);
  const cell = new Map(rows.map((r) => [r.filiera + '|' + r.paese, r]));
  const max = d3.max(fil, (fl) => d3.max(paesi, ([p]) => N((cell.get(fl + '|' + p) || {}).export_mancante_mln) || 0)) || 1;
  const box = document.createElement('div'); box.className = 'lx-mx'; el.appendChild(box);
  const t = d3.select(box).append('table');
  const hr = t.append('thead').append('tr');
  hr.append('th').text('Filiera');
  paesi.forEach(([p, v]) => hr.append('th').attr('class', 'p' + (v.sopra ? ' sopra' : '')).style('font-weight', v.sopra ? '600' : null).text(p));
  const tb = t.append('tbody');
  const tip = LX.tip(box);
  fil.forEach((fl) => {
    const tr = tb.append('tr');
    tr.append('td').text(fl);
    paesi.forEach(([p]) => {
      const r = cell.get(fl + '|' + p), v = r ? N(r.export_mancante_mln) : 0;
      const pc = Math.round(85 * Math.sqrt(v / max));
      const td = tr.append('td').attr('class', 'c').text(v >= 1 ? f.int(v) : '')
        .style('background', v >= 1 ? `color-mix(in srgb, ${dash.colors[0]} ${pc}%, transparent)` : null)
        .style('color', pc > 50 ? 'var(--color-bg)' : null);
      const q = r ? N(r.var_quota_italia_punti) : null;
      if (v >= 1 && r.lettura_dr === 'peggio') td.classed('peggio', true);
      else if (v >= 1 && q !== null && q < -0.2) td.classed('perde', true);
      const g = r ? N(r.crescita_import_pct) : null;
      if (v >= 1 && g !== null) {
        td.append('span').attr('class', 'fr ' + (g > 2 ? 'su' : g < -2 ? 'giu' : 'piatto')).text(g > 2 ? '▲' : g < -2 ? '▼' : '●');
      }
      if (r) td.on('pointerenter pointermove', (ev) => tip.show(ev, `${fl}, ${p}: export mancante ${f.m(v)} mln l'anno (media 2023-25). Il territorio manda lì ${LX.il(f.dec(N(r.quota_dr_pct)) + '%')} del suo export della filiera, il resto d'Italia ${LX.il(f.dec(N(r.quota_resto_italia_pct)) + '%')} (media 2023-25).` + (N(r.crescita_import_pct) !== null ? ` Import del Paese ${f.int(N(r.import_paese_mln))} mln l'anno (media 2023-25), ${f.pctd(N(r.crescita_import_pct))} dal 2023 al 2025. Quota dell'Italia ${f.dec(N(r.quota_italia_pct))}% (media 2023-25), ${f.pt(N(r.var_quota_italia_punti))} punti dal 2023 al 2025.` : ' Domanda del Paese non disponibile.') + LX.letturaDR(r))).on('pointerleave', () => tip.hide());
    });
  });
  const tr = tb.append('tr').attr('class', 'tot');
  tr.append('td').style('text-align', 'left').text(LX.mxCresc ? 'Totale, solo mercati in crescita' : 'Totale, tutte le filiere');
  const mp = dash.data('mancante_paese');
  const tot = new Map(mp.status === 'ok' ? mp.data.filter((r) => String(r.dr) === LX.dr).map((r) => [r.paese_cod, N(r.export_mancante_mln)]) : []);
  const cod = new Map(rows.map((r) => [r.paese, r.paese_cod]));
  paesi.forEach(([p, v]) => tr.append('td').text(f.int(!LX.mxCresc && tot.has(cod.get(p)) ? tot.get(cod.get(p)) : v.tot)));
});
document.querySelectorAll('#sel-dr').forEach((s) => s.addEventListener('change', () => dash.draw('matrice')));
document.querySelectorAll('#chk-crescita').forEach((c) => c.addEventListener('change', () => { LX.mxCresc = c.checked; dash.draw('matrice'); }));

LX.icone = {
  macchinari: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 6a6 6 0 1 0 0 12a6 6 0 1 0 0-12M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8',
  metallo: 'M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  alimentare: 'M12 21V8M12 8c-3 0-4-3-4-5 2 0 4 1 4 5zM12 8c3 0 4-3 4-5-2 0-4 1-4 5zM12 14c-3 0-4-3-4-5 2 0 4 1 4 5zM12 14c3 0 4-3 4-5-2 0-4 1-4 5z',
  agricoltura: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8',
  bevande: 'M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v7M8 20h8',
  moda: 'M8 3l-5 3 2 4 3-1v12h8V9l3 1 2-4-5-3c0 2-2 3-4 3s-4-1-4-3z',
  pelle: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  mobili: 'M7 3v10h10V3M5 13h14M7 13v8M17 13v8',
  legno: 'M12 3l6 9H6zM12 9l5 7H7zM12 16v5',
  elettronica: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4',
  elettrici: 'M13 2L4 14h7l-1 8 9-12h-7z',
  ceramica: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  trasporto: 'M2 13l20-7-7 14-3-6zM12 14l3-3',
  farmaci: 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 10l7 7',
  gioielli: 'M6 3h12l3 6-9 12L3 9zM3 9h18M9 3l3 6 3-6',
  plastica: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z',
  occhiali: 'M3 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M15 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M9 12h6',
  carta: 'M6 3h9l4 4v14H6zM15 3v4h4',
  altro: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
};
LX.iconaFiliera = function (f) {
  f = (f || '').toLowerCase();
  const m = [['macchinari', 'macchinari'], ['metall', 'metallo'], ['alimentare', 'alimentare'], ['agricoltura', 'agricoltura'], ['bevande', 'bevande'], ['tessile', 'moda'], ['abbigliamento', 'moda'], ['pelle', 'pelle'], ['mobili', 'mobili'], ['legno', 'legno'], ['elettronica', 'elettronica'], ['elettrici', 'elettrici'], ['ceramica', 'ceramica'], ['trasporto', 'trasporto'], ['farmaci', 'farmaci'], ['gioielli', 'gioielli'], ['gomma', 'plastica'], ['occhiali', 'occhiali'], ['carta', 'carta']];
  const k = m.find(([s]) => f.includes(s));
  return LX.icone[k ? k[1] : 'altro'];
};

dash.draw('territorio', (el) => {
  const s = dash.data('distretti');
  el.replaceChildren();
  if (s.status !== 'ok') { el.textContent = '-'; return; }
  const N = LX.N, f = LX.f;
  const all = s.data.filter((r) => String(r.dr) === LX.dr).slice().sort((a, b) => (N(b.export_mln) || 0) - (N(a.export_mln) || 0));
  const rows = LX.distTutti ? all : all.slice(0, 8);
  if (!rows.length) { el.textContent = 'Nessun distretto monitorato per questo territorio.'; return; }
  rows.forEach((r) => {
    const c = d3.select(el).append('div').attr('class', 'lx-dc');
    const hd = c.append('div').attr('class', 'hd');
    hd.append('div').attr('class', 'ic').append('svg').attr('viewBox', '0 0 24 24').attr('aria-hidden', 'true').append('path').attr('d', LX.iconaFiliera(r.filiera_indicativa));
    const tx = hd.append('div');
    const nm = tx.append('div').attr('class', 'nm').text(r.distretto);
    if (/^polo/i.test(r.distretto)) nm.append('span').attr('class', 'tag').text('polo');
    tx.append('div').attr('class', 'fl').text(r.filiera_indicativa || '');
    const nums = c.append('div').attr('class', 'nums');
    const ex = N(r.export_mln);
    nums.append('span').attr('class', 'ex').text(ex !== null ? f.int(ex) + ' mln' : (r.export_testo || 'n.d.'));
    const m = String(r.variazione || '').match(/^([+-]\s?[\d.,]+%)(.*)$/);
    if (m) {
      const v = parseFloat(m[1].replace(/\s/g, '').replace('.', '').replace(',', '.'));
      nums.append('span').attr('class', 'vr ' + (v > 0 ? 'good' : v < 0 ? 'bad' : '')).text(m[1]);
      const rest = m[2].replace(/^[\s;:,]+/, '');
      const extra = (r.export_testo && /\(|nel/.test(r.export_testo)) ? 'Export: ' + r.export_testo + '. ' : '';
      if (rest || extra) c.append('div').attr('class', 'nt').text(extra + rest);
    } else if (r.variazione) {
      c.append('div').attr('class', 'nt').text(r.variazione);
    }
  });
});
document.querySelectorAll('#sel-dr').forEach((s) => s.addEventListener('change', () => dash.draw('territorio')));
document.querySelectorAll('#chk-dist-tutti').forEach((c) => c.addEventListener('change', () => { LX.distTutti = c.checked; dash.draw('territorio'); }));

dash.draw('dist-fonte', (el) => {
  const s = dash.data('distretti');
  const row = s.status === 'ok' ? s.data.find((r) => String(r.dr) === LX.dr) : null;
  el.textContent = row ? row.fonte : '-';
});
document.querySelectorAll('#sel-dr').forEach((s) => s.addEventListener('change', () => dash.draw('dist-fonte')));

dash.draw('dr-terr', (ul) => {
  const s = dash.data('dr_scheda');
  ul.replaceChildren();
  if (s.status !== 'ok') return;
  const row = s.data.find((r) => String(r.dr) === LX.dr);
  String(row ? row.numeri_territorio || '' : '').split('|').map((t) => t.trim()).filter(Boolean)
    .forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
});

dash.draw('dr-int', (ul) => {
  const s = dash.data('dr_scheda');
  ul.replaceChildren();
  if (s.status !== 'ok') return;
  const row = s.data.find((r) => String(r.dr) === LX.dr);
  String(row ? row.interessi || '' : '').split('|').map((t) => t.trim()).filter(Boolean)
    .forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
});

dash.draw('tab-simili', (tb) => {
  const s = dash.data('dr_simili');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const f = LX.fmt;
  const rows = s.data.filter((r) => String(r.dr) === LX.dr).sort((a, b) => a.ordine - b.ordine);
  LX.rows(tb, rows, [
    { text: (r) => LX.drNome(r.dr_simile) },
    { n: 1, text: (r) => f(r.indice, 'dec') },
    { n: 1, text: (r) => f(r.n_filiere_comuni, 'int') },
    { n: 1, text: (r) => f(r.n_paesi, 'int') },
  ], (r) => encodeURIComponent(r.chiave));
  d3.select(tb).selectAll('tr')
    .attr('title', (r) => `${LX.drNome(LX.dr)} e ${LX.drNome(r.dr_simile)}, media 2023-2025. ${f(r.indice, 'dec')} su 100 del loro export nel perimetro è nelle stesse filiere, con lo stesso peso. Filiere in comune: ${f(r.n_filiere_comuni, 'int')}.` + (r.quasi_dr ? ` Quasi uguale: ${LX.drNome(r.quasi_dr)} (indice ${f(r.quasi_indice, 'dec')}).` : ''));
});

dash.draw('simili-paesi', (el) => {
  const s = dash.data('dr_simili_paesi'), q = dash.data('dr_simili');
  el.replaceChildren();
  if (s.status !== 'ok' || q.status !== 'ok') { LX.empty(el, s.status !== 'ok' ? s : q); return; }
  const f = LX.fmt;
  const tip = LX.tip(el);
  const me = LX.drNome(LX.dr);
  q.data.filter((r) => String(r.dr) === LX.dr).sort((a, b) => a.ordine - b.ordine).forEach((sim) => {
    const altra = LX.drNome(sim.dr_simile);
    const all = s.data.filter((r) => String(r.dr) === LX.dr && String(r.dr_simile) === String(sim.dr_simile)).sort((a, b) => a.riga - b.riga);
    const rows = LX.simTutti ? all : all.slice(0, 8);
    const box = d3.select(el).append('div').attr('class', 'lx-sim');
    box.append('h3').text(`Dove vende di più ${altra}: ${all.length} casi filiera-Paese` + (all.length > rows.length ? `, i primi ${rows.length}` : ''));
    if (!all.length) { box.append('p').attr('class', 'lx-note').text('Nessun caso sopra le soglie.'); return; }
    const t = box.append('div').attr('class', 'lx-wrap').append('table');
    const hr = t.append('thead').append('tr');
    [['filiera', 'Filiera', 0], ['paese', 'Paese', 0],
      ['quota_dr_pct', `Quota di ${me} (%, media 2023-25)`, 1], ['quota_simile_pct', `Quota di ${altra} (%, media 2023-25)`, 1],
      ['scarto_punti', 'Scarto (punti, media 2023-25)', 1], ['export_simile_mln', `Export di ${altra} nel Paese (mln/anno, media 2023-25)`, 1],
      ['export_in_piu_mln', `Export in più con la quota di ${altra} (mln/anno, media 2023-25)`, 1]]
      .forEach(([k, l, n]) => hr.append('th').attr('data-field', k).attr('class', n ? 'n' : null).text(l));
    const tb = t.append('tbody').node();
    LX.rows(tb, rows, [
      { text: (r) => r.filiera },
      { text: (r) => r.paese },
      { n: 1, text: (r) => f(r.quota_dr_pct, 'dec') },
      { n: 1, text: (r) => f(r.quota_simile_pct, 'dec') },
      { n: 1, text: (r) => f(r.scarto_punti, 'dec') },
      { n: 1, text: (r) => f(r.export_simile_mln, 'm') },
      { n: 1, text: (r) => f(r.export_in_piu_mln, 'm') },
    ], (r) => encodeURIComponent(r.chiave));
    d3.select(tb).selectAll('tr')
      .on('pointerenter pointermove', (ev, r) => tip.show(ev, `${r.filiera}, ${r.paese}, media 2023-2025. In questo Paese va ${LX.il(f(r.quota_simile_pct, 'dec') + '%')} dell'export della filiera di ${altra}, ${f(r.export_simile_mln, 'm')} milioni l'anno. Per ${me} la quota è ${LX.il(f(r.quota_dr_pct, 'dec') + '%')}. Con la quota di ${altra}, ${me} venderebbe lì ${f(r.export_in_piu_mln, 'm')} milioni l'anno in più. Il calcolo è quello dell'export mancante, peso PMI compreso.`))
      .on('pointerleave', () => tip.hide());
  });
});
document.querySelectorAll('#sel-dr').forEach((s) => s.addEventListener('change', () => ['dr-terr', 'dr-int', 'tab-simili', 'simili-paesi'].forEach((n) => dash.draw(n))));
document.querySelectorAll('#chk-simili-tutti').forEach((c) => c.addEventListener('change', () => { LX.simTutti = c.checked; dash.draw('simili-paesi'); }));
