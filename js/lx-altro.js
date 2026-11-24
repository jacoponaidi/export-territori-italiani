dash.draw('sel-paese', (sel) => {
  const s = dash.data('domanda_paesi');
  if (s.status !== 'ok') return;
  const tot = d3.rollups(s.data, (v) => d3.sum(v, (r) => r.import_mln), (r) => r.paese_cod + '|' + r.paese).sort((a, b) => b[1] - a[1]);
  sel.replaceChildren(...tot.map(([k]) => k.split('|')).sort((a, b) => a[1].localeCompare(b[1], 'it')).map(([c, p]) => new Option(p, c)));
  if (!tot.some(([k]) => k.startsWith(LX.paese + '|'))) LX.paese = tot.length ? tot[0][0].split('|')[0] : '';
  sel.value = LX.paese;
  sel.onchange = () => { LX.paese = sel.value; ['barre-paese', 'tab-dom', 'dom-fonte', 'tab-paese-dr', 'tab-paese-12dr', 'contesto'].forEach((n) => dash.draw(n)); };
});

dash.draw('tab-paese-12dr', (tb) => {
  const s = dash.data('paese_dr');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const f = LX.fmt;
  const rows = s.data.filter((r) => r.paese_cod === LX.paese).sort((a, b) => a.dr - b.dr);
  LX.rows(tb, rows, [
    { text: (r) => LX.drNome(r.dr) },
    { n: 1, text: (r) => f(r.export_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.peso_su_export_dr_pct, 'dec') },
    { n: 1, text: (r) => (r.posizione ? r.posizione + '°' : '') },
    { n: 1, text: (r) => f(r.var_2023_25_pct, 'pct'), cls: (r) => LX.sc(r.var_2023_25_pct) },
    { n: 1, text: (r) => f(r.export_mancante_mln, 'int') },
    { n: 1, text: (r) => f(r.soglia_mln, 'int') },
    { text: (r) => r.lista || '' },
  ], (r) => encodeURIComponent(r.chiave), (r) => (r.sopra_soglia === 'sì' ? 'row-strong' : null));
});

// contesto del Paese: solo "Perché guardarlo" e la fonte
dash.draw('contesto', (el) => {
  const s = dash.data('contesto_paesi');
  el.replaceChildren();
  if (s.status !== 'ok') return;
  const r = s.data.find((x) => x.paese_cod === LX.paese);
  if (!r) return;
  const card = d3.select(el).append('section').attr('class', 'lx-card');
  card.append('h2').text(r.titolo);
  card.append('h3').text('Perché guardarlo');
  card.append('p').text(r.perche);
  card.append('p').attr('class', 'lx-note').text('Fonte: ' + r.fonte);
});

LX.domP = function () {
  const s = dash.data('domanda_paesi');
  return s.status === 'ok' ? s.data.filter((r) => r.paese_cod === LX.paese).sort((a, b) => b.import_mln - a.import_mln) : null;
};

dash.draw('barre-paese', (el) => {
  const s = dash.data('domanda_paesi');
  if (s.status !== 'ok') { LX.empty(el, s); return; }
  const f = LX.f;
  const rows = LX.domP().slice(0, 15);
  el.replaceChildren();
  if (!rows.length) { el.textContent = 'Nessun dato di domanda per questo Paese.'; return; }
  const W = el.clientWidth || 640, bh = 24, m = { t: 22, r: 120, b: 8, l: 10 };
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('role', 'img').attr('aria-label', "Import del Paese per filiera e parte che arriva dall'Italia");
  const labs = svg.append('g').selectAll('text').data(rows).join('text').attr('class', 'lab2').text((r) => r.filiera);
  let lw = 0; labs.each(function () { lw = Math.max(lw, this.getComputedTextLength()); });
  m.l = Math.min(lw + 14, W * 0.35);
  const H = m.t + m.b + rows.length * bh;
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  const x = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.import_mln)]).nice().range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(rows.map((r) => r.chiave)).range([m.t, H - m.b]).padding(0.25);
  labs.attr('x', m.l - 8).attr('text-anchor', 'end').attr('y', (r) => y(r.chiave) + y.bandwidth() / 2 + 4);
  svg.append('g').attr('transform', `translate(0,${m.t})`).call(d3.axisTop(x).ticks(Math.max(2, Math.floor(W / 140))).tickFormat((v) => f.int(v)))
    .call((g) => g.selectAll('line,path').style('stroke', 'var(--cds-chart-axis)'));
  const tip = LX.tip(el);
  const g = svg.append('g').selectAll('g').data(rows).join('g');
  g.append('rect').attr('x', m.l).attr('y', (r) => y(r.chiave)).attr('height', y.bandwidth()).attr('width', (r) => x(r.import_mln) - m.l).style('fill', 'var(--cds-chart-muted)');
  g.append('rect').attr('x', m.l).attr('y', (r) => y(r.chiave)).attr('height', y.bandwidth()).attr('width', (r) => Math.max(0, x(r.import_da_italia_mln || 0) - m.l)).style('fill', dash.colors[0]);
  g.append('text').attr('x', (r) => x(r.import_mln) + 4).attr('y', (r) => y(r.chiave) + y.bandwidth() / 2 + 4)
    .text((r) => `${f.int(r.import_mln)} · ${f.pctd(r.crescita_import_pct)} · IT ${f.dec(r.quota_italia_pct)}%`);
  g.append('rect').attr('x', 0).attr('width', W).attr('y', (r) => y(r.chiave)).attr('height', y.bandwidth()).style('fill', 'transparent')
    .on('pointerenter pointermove', (ev, r) => tip.show(ev, `${r.filiera}: il Paese importa ${f.int(r.import_mln)} mln l'anno (media 2023-25), ${f.pctd(r.crescita_import_pct)} dal 2023 al 2025. Dall'Italia ${f.int(r.import_da_italia_mln)} mln l'anno, quota ${f.dec(r.quota_italia_pct)}% (media 2023-25), ${f.pt(r.var_quota_italia_punti)} punti dal 2023 al 2025.`))
    .on('pointerleave', () => tip.hide());
});

dash.draw('tab-dom', (tb) => {
  const rows = LX.domP();
  if (!rows) { tb.replaceChildren(); return; }
  const f = LX.fmt;
  LX.rows(tb, rows, [
    { text: (r) => r.filiera },
    { n: 1, text: (r) => f(r.import_mln, 'int') },
    { n: 1, text: (r) => f(r.import_da_italia_mln, 'int') },
    { n: 1, text: (r) => f(r.crescita_import_pct, 'pctd'), cls: (r) => LX.sc(r.crescita_import_pct) },
    { n: 1, text: (r) => f(r.quota_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.var_quota_italia_punti, 'pt'), cls: (r) => LX.sc(r.var_quota_italia_punti) },
  ], (r) => encodeURIComponent(r.chiave));
});

dash.draw('dom-fonte', (el) => {
  const rows = LX.domP();
  el.textContent = rows && rows.length ? rows[0].fonte : '-';
});

dash.draw('tab-paese-dr', (tb) => {
  const s = dash.data('opportunita');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const N = LX.N, f = LX.fmt;
  const rows = s.data.filter((r) => r.paese_cod === LX.paese && N(r.export_mancante_mln) >= 5)
    .sort((a, b) => N(b.export_mancante_mln) - N(a.export_mancante_mln)).slice(0, 50);
  LX.rows(tb, rows, [
    { text: (r) => LX.drNome(r.dr) },
    { text: (r) => r.filiera },
    { n: 1, text: (r) => f(r.export_dr_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.quota_dr_pct, 'dec') },
    { n: 1, text: (r) => f(r.quota_resto_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.export_mancante_mln, 'm') },
    { text: (r) => r.lista_paese || '' },
  ], (r) => encodeURIComponent(r.chiave), (r) => (r.paese_sopra_soglia === 'sì' ? 'row-strong' : null));
});

dash.draw('sel-filiera', (sel) => {
  const s = dash.data('filiere_dr');
  if (s.status !== 'ok') return;
  const tot = d3.rollups(s.data, (v) => d3.sum(v, (r) => r.export_medio_mln), (r) => r.cpa + '|' + r.filiera).sort((a, b) => b[1] - a[1]);
  sel.replaceChildren(...tot.map(([k]) => k.split('|')).sort((a, b) => a[1].localeCompare(b[1], 'it')).map(([c, p]) => new Option(p, c)));
  sel.value = LX.filiera;
  sel.onchange = () => { LX.filiera = sel.value; ['fil-mercato-sintesi', 'tab-fil-mercato', 'tab-fil-dr', 'tab-fil-opp'].forEach((n) => dash.draw(n)); };
  const ck = document.getElementById('chk-fil-tutti');
  if (ck) ck.onchange = () => { LX.filTutti = ck.checked; dash.draw('tab-fil-mercato'); };
});

dash.draw('fil-mercato-sintesi', (el) => {
  const s = dash.data('mercati_filiera'), q = dash.data('filiere_dr');
  if (s.status !== 'ok' || q.status !== 'ok') { el.textContent = '-'; return; }
  const f = LX.f;
  const rows = s.data.filter((r) => r.cpa === LX.filiera);
  const fr = q.data.filter((r) => r.cpa === LX.filiera);
  if (!rows.length) { el.textContent = 'Per questa filiera non ci sono dati sulla domanda dei Paesi.'; return; }
  const S = (a, k) => d3.sum(a, (r) => r[k] || 0);
  const i23 = S(rows, 'import_2023_mln'), i25 = S(rows, 'import_2025_mln'), it23 = S(rows, 'italia_2023_mln'), it25 = S(rows, 'italia_2025_mln');
  const im = S(rows, 'import_mln'), itm = S(rows, 'import_da_italia_mln');
  const tot = S(fr, 'mancante_tutti_paesi_mln');
  const p = (k) => (tot > 0 ? Math.round(S(fr, k) / tot * 100) + '%' : '-');
  el.textContent = `Nei 31 Paesi con dati, l'import di ${rows[0].filiera} da tutto il mondo vale ${f.int(im)} milioni l'anno (media 2023-25). Dal 2023 al 2025 è cambiato del ${f.pctd((i25 / i23 - 1) * 100)}. L'Italia ne copre ${LX.il(f.dec(itm / im * 100) + '%')} (media 2023-25): ${f.dec(it23 / i23 * 100)}% nel 2023, ${f.dec(it25 / i25 * 100)}% nel 2025. Export mancante dei 12 territori nella filiera: ${f.int(tot)} milioni l'anno (media 2023-25). Di questo, ${p('mancante_crescita_mln')} è in mercati in crescita, ${p('mancante_stabile_mln')} in mercati stabili, ${p('mancante_calo_mln')} in mercati in calo e ${p('mancante_senza_dato_mln')} in Paesi senza dato.`;
});

dash.draw('tab-fil-mercato', (tb) => {
  const s = dash.data('mercati_filiera');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const f = LX.fmt;
  const all = s.data.filter((r) => r.cpa === LX.filiera).sort((a, b) => b.import_mln - a.import_mln);
  const rows = LX.filTutti ? all : all.slice(0, 15);
  LX.rows(tb, rows, [
    { text: (r) => r.paese },
    { n: 1, text: (r) => f(r.import_mln, 'int') },
    { n: 1, text: (r) => f(r.crescita_import_pct, 'pctd'), cls: (r) => LX.sc(r.crescita_import_pct) },
    { n: 1, text: (r) => f(r.quota_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.var_quota_italia_punti, 'pt'), cls: (r) => LX.sc(r.var_quota_italia_punti) },
    { n: 1, text: (r) => f(r.export_12dr_mln, 'int') },
    { n: 1, text: (r) => f(r.mancante_12dr_mln, 'int') },
    { text: (r) => (r.dr_con_spazio ? r.dr_elenco.split('-').map((d) => LX.drNome(d)).join('; ') : '') },
  ], (r) => encodeURIComponent(r.chiave));
});

dash.draw('tab-fil-dr', (tb) => {
  const s = dash.data('filiere_dr');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const f = LX.fmt;
  const rows = s.data.filter((r) => r.cpa === LX.filiera).sort((a, b) => b.export_medio_mln - a.export_medio_mln);
  LX.rows(tb, rows, [
    { text: (r) => LX.drNome(r.dr) },
    { n: 1, text: (r) => f(r.export_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.var_23_25_pct, 'pct'), cls: (r) => LX.sc(r.var_23_25_pct) },
    { n: 1, text: (r) => f(r.peso_su_perimetro_pct, 'dec') },
    { n: 1, text: (r) => f(r.mancante_tutti_paesi_mln, 'int') },
    { n: 1, text: (r) => f(r.mancante_paesi_sopra_soglia_mln, 'int') },
    { n: 1, text: (r) => f(r.mancante_crescita_mln, 'int') + (r.quota_mancante_crescita_pct != null ? ' (' + r.quota_mancante_crescita_pct + '%)' : ''), cls: () => 'good' },
    { n: 1, text: (r) => f(r.mancante_stabile_mln, 'int') },
    { n: 1, text: (r) => f(r.mancante_calo_mln, 'int'), cls: () => 'bad' },
    { n: 1, text: (r) => f(r.mancante_senza_dato_mln, 'int') },
    { text: (r) => r.concentrata_su || '' },
  ], (r) => encodeURIComponent(r.chiave));
});

dash.draw('tab-fil-opp', (tb) => {
  const s = dash.data('opportunita');
  if (s.status !== 'ok') { tb.replaceChildren(); return; }
  const N = LX.N, f = LX.fmt;
  const rows = s.data.filter((r) => r.cpa === LX.filiera && N(r.export_mancante_mln) >= 5)
    .sort((a, b) => N(b.export_mancante_mln) - N(a.export_mancante_mln)).slice(0, 50);
  LX.rows(tb, rows, [
    { text: (r) => LX.drNome(r.dr) },
    { text: (r) => r.paese },
    { n: 1, text: (r) => f(r.export_dr_medio_mln, 'm') },
    { n: 1, text: (r) => f(r.vuoto_punti, 'pt') },
    { n: 1, text: (r) => f(r.export_mancante_mln, 'm') },
    { n: 1, text: (r) => f(r.import_paese_mln, 'int') },
    { n: 1, text: (r) => f(r.crescita_import_pct, 'pctd'), cls: (r) => LX.sc(r.crescita_import_pct) },
    { n: 1, text: (r) => f(r.quota_italia_pct, 'dec') },
    { n: 1, text: (r) => f(r.var_quota_italia_punti, 'pt'), cls: (r) => LX.sc(r.var_quota_italia_punti) },
  ], (r) => encodeURIComponent(r.chiave), (r) => (r.paese_sopra_soglia === 'sì' ? 'row-strong' : null));
});
