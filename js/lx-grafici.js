// Barre in milioni con la scala dichiarata, frasi scritte dai dati, ordinamenti.
// Territorio, "Le filiere del territorio"; Filiere, "Il mercato della filiera";
// Paesi e domanda, "Quanto importa il Paese"; Mercato e accesso, "4. Chi vende nel Paese".
(function () {
  const N = LX.N, f = LX.f;
  const ORD = { anni: 'medio', fil: 'import_mln', pae: 'import_mln' };
  LX.gOrd = ORD;
  const COL = { grigio: 'var(--cds-chart-muted)', marrone: '#8c5a2b', scuro: 'var(--color-fg-muted)' };
  // nome del territorio
  LX.gDR = function (dr) {
    const s = dash.data('dr_scheda');
    const row = s.status === 'ok' ? s.data.find((x) => String(x.dr) === String(dr)) : null;
    const nome = row ? row.nome_esteso : '';
    return nome;
  };
  LX.gDella = (dr) => 'di ' + LX.gDR(dr);
  LX.gLa = (dr) => LX.gDR(dr);
  // milioni: interi da 10 in su, un decimale sotto
  const m = (v) => f.m(v);
  const sgm = (v) => LX.sg(f.m(v));
  // "a, b e c"; "ed" solo davanti a una parola che comincia con "e"
  LX.gUnisci = function (xs) {
    if (!xs.length) return '';
    if (xs.length === 1) return xs[0];
    const u = xs[xs.length - 1];
    return xs.slice(0, -1).join(', ') + (/^[eE]/.test(u) ? ' ed ' : ' e ') + u;
  };
  // cella con barra: larghezza in percentuale sulla barra piena, colore, valore scritto
  LX.gBar = function (td, w, col, testo) {
    const box = document.createElement('div'); box.className = 'lx-bar';
    const t = document.createElement('div'); t.className = 't';
    const b = document.createElement('span'); b.style.width = (isFinite(w) ? Math.max(0, Math.min(100, w)) : 0) + '%'; b.style.background = col;
    t.append(b);
    const v = document.createElement('span'); v.className = 'v'; v.textContent = testo;
    box.append(t, v); td.append(box);
  };
  // cella con barra divergente: calo a sinistra in rosso, crescita a destra in verde
  LX.gDiv = function (td, v, max, testo) {
    const box = document.createElement('div'); box.className = 'lx-bar';
    const g = document.createElement('div'); g.className = 'lx-dv';
    const a = document.createElement('div'); a.className = 'neg'; const sa = document.createElement('span');
    const b = document.createElement('div'); b.className = 'pos'; const sb = document.createElement('span');
    const w = max > 0 ? Math.min(100, Math.abs(v) / max * 100) : 0;
    sa.style.width = (v < 0 ? w : 0) + '%'; sb.style.width = (v > 0 ? w : 0) + '%';
    a.append(sa); b.append(sb); g.append(a, b);
    const t = document.createElement('span'); t.className = 'v'; t.textContent = testo;
    box.append(g, t); td.append(box);
  };
  // quota con "sopra la media" o "sotto la media"
  LX.gQuota = function (td, q, media) {
    td.className = 'n';
    if (N(q) === null) { td.textContent = ''; return; }
    const box = document.createElement('span'); box.className = 'lx-q';
    const a = document.createElement('b'); a.textContent = f.dec(N(q)) + '%';
    // confronto sui valori scritti (un decimale): se sono uguali, "pari alla media"
    const qs = f.dec(N(q)), ms = f.dec(media);
    const s = document.createElement('small'); s.textContent = qs === ms ? 'pari alla media' : (N(q) > media ? 'sopra la media' : 'sotto la media');
    box.append(a, s); td.append(box);
  };
  // tabella: righe e colonne {n, cls, cell(td, r) oppure text(r)}
  LX.gTab = function (tb, rows, cols, rowClass, vuoto) {
    tb.replaceChildren();
    if (!rows.length) {
      const tr = document.createElement('tr'); tr.className = 'row-muted';
      const td = document.createElement('td'); td.colSpan = cols.length; td.textContent = vuoto || 'Nessun dato.';
      tr.append(td); tb.append(tr); return;
    }
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      const k = r.chiave || (r.r && r.r.chiave); if (k) tr.dataset.key = encodeURIComponent(k);
      const rc = rowClass ? rowClass(r) : null; if (rc) tr.className = rc;
      cols.forEach((c) => {
        const td = document.createElement('td');
        const cl = [c.n ? 'n' : '', c.cls ? c.cls(r) : ''].join(' ').trim(); if (cl) td.className = cl;
        if (c.cell) c.cell(td, r); else td.textContent = c.text(r);
        tr.append(td);
      });
      tb.append(tr);
    });
  };
  // frase in più righe dentro un elemento
  LX.gRighe = function (el, righe) {
    el.replaceChildren(...righe.filter(Boolean).map((t) => { const p = document.createElement('p'); p.textContent = t; return p; }));
  };
  const scale = {}; // barra piena di ogni colonna: valore e riferimento
  LX.gScale = scale;
  const maxDi = (rows, k, lab) => {
    let best = null;
    rows.forEach((r) => { const v = N(r[k]); if (v !== null && (best === null || v > N(best[k]))) best = r; });
    return best ? { v: N(best[k]), lab: lab(best) } : { v: 0, lab: '' };
  };
  const scalaTesto = (x) => (x && x.v > 0 ? m(x.v) + (x.lab ? ' (' + x.lab + ')' : '') : '-');

  // ---------- le filiere del territorio negli anni ----------
  LX.gAnni = function () {
    const a = dash.data('filiere_anni'), d = dash.data('filiere_dr');
    if (a.status !== 'ok' || d.status !== 'ok') return null;
    const idx = new Map(a.data.filter((r) => String(r.dr) === LX.dr).map((r) => [r.cpa, r]));
    return d.data.filter((r) => String(r.dr) === LX.dr && idx.has(r.cpa)).map((r) => {
      const x = idx.get(r.cpa);
      const e23 = N(x.export_2023_mln), e25 = N(x.export_2025_mln), r23 = N(x.resto_2023_mln), r25 = N(x.resto_2025_mln);
      const vr = r23 > 0 ? (r25 / r23 - 1) * 100 : null;
      const vd = e23 > 0 ? (e25 / e23 - 1) * 100 : null;
      const vdS = N(r.var_23_25_pct) === null ? '' : f.pct(N(r.var_23_25_pct));
      const vrS = vr === null ? '' : f.pct(vr);
      // giudizio sulle variazioni non arrotondate, come nella matrice: scarto di oltre 5 punti
      let g = '';
      if (vd !== null && vr !== null) { const dv = vd - vr; g = dv > 5 ? 'meglio' : (dv < -5 ? 'peggio' : 'simile'); }
      return { r, x, dv: e25 - e23, vdS, vrS, g };
    });
  };
  const anniScale = (rows) => {
    scale['anni-2025'] = maxDi(rows.map((y) => ({ v: N(y.x.export_2025_mln), fil: y.r.filiera })), 'v', (b) => b.fil);
    scale['anni-var'] = rows.reduce((acc, y) => (Math.abs(y.dv) > acc.v ? { v: Math.abs(y.dv), lab: y.r.filiera } : acc), { v: 0, lab: '' });
    scale['anni-spazio'] = maxDi(rows.map((y) => ({ v: N(y.r.mancante_tutti_paesi_mln), fil: y.r.filiera })), 'v', (b) => b.fil);
  };
  dash.draw('tab-anni', (tb) => {
    const rows = LX.gAnni();
    if (!rows) { tb.replaceChildren(); return; }
    anniScale(rows);
    const s25 = scale['anni-2025'].v, sv = scale['anni-var'].v, ss = scale['anni-spazio'].v;
    const ord = ORD.anni === 'var' ? (a, b) => b.dv - a.dv : (a, b) => N(b.r.export_medio_mln) - N(a.r.export_medio_mln);
    LX.gTab(tb, rows.slice().sort(ord), [
      { text: (y) => y.r.filiera },
      { n: 1, text: (y) => m(N(y.x.export_2023_mln)) },
      { n: 1, text: (y) => m(N(y.x.export_2024_mln)) },
      { cell: (td, y) => LX.gBar(td, N(y.x.export_2025_mln) / s25 * 100, COL.grigio, m(N(y.x.export_2025_mln))) },
      { cell: (td, y) => LX.gDiv(td, y.dv, sv, sgm(y.dv)) },
      { n: 1, text: (y) => y.vdS, cls: (y) => LX.sc(N(y.r.var_23_25_pct)) },
      { n: 1, text: (y) => y.vrS },
      { n: 1, text: (y) => y.g, cls: (y) => (y.g === 'meglio' ? 'good' : y.g === 'peggio' ? 'bad' : '') },
      { cell: (td, y) => LX.gBar(td, (N(y.r.mancante_tutti_paesi_mln) || 0) / ss * 100, COL.scuro, f.int(N(y.r.mancante_tutti_paesi_mln) || 0)) },
      { n: 1, text: (y) => LX.fmt(y.r.peso_su_perimetro_pct, 'dec') },
      { n: 1, text: (y) => LX.fmt(y.r.quota_pmi_settore_pct, 'int') },
      { n: 1, text: (y) => LX.fmt(y.r.mancante_paesi_sopra_soglia_mln, 'int') },
      { text: (y) => y.r.concentrata_su || '' },
      { cell: (td, y) => { const c = y.r.confronto || ''; const i = c.indexOf(' ('); td.textContent = i > 0 ? c.slice(0, i) : c; if (i > 0) td.title = c; } },
    ], null, 'Nessuna filiera per questa scelta.');
  });
  const anniTot = () => {
    const a = dash.data('filiere_anni');
    if (a.status !== 'ok') return null;
    const rows = a.data.filter((r) => String(r.dr) === LX.dr);
    const T = {}, R = {};
    [2023, 2024, 2025].forEach((y) => { T[y] = d3.sum(rows, (r) => N(r['export_' + y + '_mln'])); R[y] = d3.sum(rows, (r) => N(r['altre11_' + y + '_mln'])); });
    return { T, R };
  };
  dash.draw('anni-tot', (el) => {
    const t = anniTot(); const y = +el.dataset.anno;
    el.textContent = t && t.T[y] ? f.int(t.T[y]) : '-';
  });
  dash.draw('anni-var', (el) => {
    const t = anniTot(); const y = +el.dataset.anno;
    if (!t || !t.T[y]) { el.textContent = '-'; return; }
    el.textContent = y === 2023 ? 'anno di partenza' : f.pctd((t.T[y] / t.T[y - 1] - 1) * 100) + " sull'anno prima; resto d'Italia " + f.pctd((t.R[y] / t.R[y - 1] - 1) * 100);
  });
  dash.draw('anni-frase', (el) => {
    const t = anniTot(), rows = LX.gAnni();
    if (!t || !rows || !rows.length || !t.T[2023]) { el.textContent = '-'; return; }
    const a = (t.T[2025] / t.T[2023] - 1) * 100, b = (t.R[2025] / t.R[2023] - 1) * 100;
    const r1 = "Dal 2023 al 2025 l'export delle filiere " + LX.gDella(LX.dr) + ' è passato da ' + f.int(t.T[2023]) + ' a ' + f.int(t.T[2025]) + ' milioni (' + f.pctd(a) + "); il resto d'Italia " + f.pctd(b) + '.';
    const sp = rows.slice().sort((p, q) => q.dv - p.dv);
    const pos = sp.filter((y) => Math.round(y.dv) > 0).slice(0, 2);
    const neg = sp.slice().reverse().filter((y) => Math.round(y.dv) < 0).slice(0, 2);
    const el2 = (xs) => LX.gUnisci(xs.map((y) => y.r.filiera + ' (' + LX.sg(f.int(y.dv)) + ' milioni)'));
    const r2 = (pos.length ? (pos.length > 1 ? 'Hanno spinto ' : 'Ha spinto ') + el2(pos) + '.' : '') +
      (neg.length ? (pos.length ? ' ' : '') + (neg.length > 1 ? 'Hanno frenato ' : 'Ha frenato ') + el2(neg) + '.' : '');
    LX.gRighe(el, [r1, r2]);
  });

  // ---------- il mercato della filiera ----------
  LX.gFil = function () {
    const s = dash.data('mercati_filiera');
    return s.status === 'ok' ? s.data.filter((r) => r.cpa === LX.filiera) : null;
  };
  const filMedia = (rows) => { const ti = d3.sum(rows, (r) => N(r.import_mln)), tt = d3.sum(rows, (r) => N(r.import_da_italia_mln)); return ti > 0 ? tt / ti * 100 : null; };
  const filScale = (all) => {
    scale['fil-imp'] = maxDi(all, 'import_mln', (r) => r.paese);
    scale['fil-ita'] = maxDi(all, 'import_da_italia_mln', (r) => r.paese);
    scale['fil-sp'] = maxDi(all, 'mancante_12dr_mln', (r) => r.paese);
  };
  dash.draw('tab-fil-bar', (tb) => {
    const all = LX.gFil();
    if (!all) { tb.replaceChildren(); return; }
    const k = ORD.fil, media = filMedia(all);
    filScale(all);
    const ck = document.getElementById('chk-fil-tutti');
    const sorted = all.slice().sort((a, b) => (N(b[k]) || 0) - (N(a[k]) || 0));
    const rows = ck && ck.checked ? sorted : sorted.slice(0, 15);
    LX.gTab(tb, rows, [
      { text: (r) => r.paese },
      { cell: (td, r) => LX.gBar(td, N(r.import_mln) / scale['fil-imp'].v * 100, COL.grigio, f.int(N(r.import_mln))) },
      { cell: (td, r) => LX.gBar(td, N(r.import_da_italia_mln) / scale['fil-ita'].v * 100, COL.marrone, f.int(N(r.import_da_italia_mln))) },
      { n: 1, cell: (td, r) => LX.gQuota(td, r.quota_italia_pct, media) },
      { n: 1, text: (r) => LX.fmt(r.var_quota_italia_punti, 'pt'), cls: (r) => LX.sc(r.var_quota_italia_punti) },
      { n: 1, text: (r) => LX.fmt(r.crescita_import_pct, 'pctd'), cls: (r) => LX.sc(r.crescita_import_pct) },
      { cell: (td, r) => LX.gBar(td, (N(r.mancante_12dr_mln) || 0) / scale['fil-sp'].v * 100, COL.scuro, f.int(N(r.mancante_12dr_mln) || 0)) },
      { cell: (td, r) => {
        if (!N(r.dr_con_spazio)) return;
        const xs = String(r.dr_elenco).split('-').filter((x) => x).map((x) => LX.gDR(x));
        const d = document.createElement('details'); d.className = 'lx-elenco';
        const s = document.createElement('summary'); s.textContent = xs.length === 1 ? '1 territorio' : xs.length + ' territori';
        const u = document.createElement('div'); u.textContent = xs.join('; ');
        d.append(s, u); td.append(d);
      } },
    ], null, 'Per questa filiera non ci sono dati sulla domanda dei Paesi.');
  });
  dash.draw('fil-media', (el) => { const rows = LX.gFil(); const v = rows && rows.length ? filMedia(rows) : null; el.textContent = v === null ? '-' : f.dec(v) + '%'; });
  dash.draw('fil-frase', (el) => {
    const rows = LX.gFil(), q = dash.data('filiere_dr');
    if (!rows || q.status !== 'ok') { el.textContent = '-'; return; }
    if (!rows.length) { el.textContent = 'Per questa filiera non ci sono dati sulla domanda dei Paesi.'; return; }
    const fr = q.data.filter((r) => r.cpa === LX.filiera);
    const S = (a, k) => d3.sum(a, (r) => N(r[k]) || 0);
    const im = S(rows, 'import_mln'), i23 = S(rows, 'import_2023_mln'), i25 = S(rows, 'import_2025_mln');
    const itm = S(rows, 'import_da_italia_mln'), it23 = S(rows, 'italia_2023_mln'), it25 = S(rows, 'italia_2025_mln');
    const tot = S(fr, 'mancante_tutti_paesi_mln');
    const top = rows.slice().sort((a, b) => N(b.import_da_italia_mln) - N(a.import_da_italia_mln)).slice(0, 3);
    const tsp = rows.filter((r) => (N(r.mancante_12dr_mln) || 0) > 0).sort((a, b) => N(b.mancante_12dr_mln) - N(a.mancante_12dr_mln)).slice(0, 3);
    const gr = (r) => (N(r.crescita_import_pct) === null ? 'senza dato' : f.pct(N(r.crescita_import_pct)));
    const r1 = 'Il mercato: ' + f.int(im) + " milioni di euro l'anno nei " + rows.length + ' Paesi con dati (media 2023-2025)' + (i23 > 0 ? ', ' + f.pctd((i25 / i23 - 1) * 100) + ' dal 2023 al 2025.' : '.');
    const r2 = "L'Italia: vende " + f.int(itm) + " milioni l'anno, " + LX.il(f.dec(itm / im * 100) + '%') + ' del mercato (' + f.dec(it23 / i23 * 100) + '% nel 2023, ' + f.dec(it25 / i25 * 100) + '% nel 2025). Primi tre Paesi per vendite: ' +
      top.map((r, i) => r.paese + ' (' + f.int(N(r.import_da_italia_mln)) + (i === 0 ? ' milioni)' : ')')).join(', ') + '.';
    const r3 = tot > 0
      ? 'Lo spazio: ' + 'i 12 territori hanno ' + f.int(tot) + " milioni l'anno di export mancante. " + f.int(S(fr, 'mancante_crescita_mln')) + ' milioni sono in mercati in crescita, ' +
        f.int(S(fr, 'mancante_stabile_mln')) + ' stabili, ' + f.int(S(fr, 'mancante_calo_mln')) + ' in calo, ' + f.int(S(fr, 'mancante_senza_dato_mln')) + ' senza dato.'
      : 'Lo spazio: ' + 'i 12 territori non hanno' + ' export mancante in questa filiera.';
    const r4 = tsp.length ? 'Spazio più grande: ' + tsp.map((r, i) => r.paese + ' (' + f.int(N(r.mancante_12dr_mln)) + (i === 0 ? ' milioni, mercato ' : ', ') + gr(r) + ')').join(', ') + '.' : '';
    LX.gRighe(el, [r1, r2, r3, r4]);
  });

  // ---------- il Paese, filiera per filiera ----------
  const paeRows = () => { const s = dash.data('domanda_paesi'); return s.status === 'ok' ? s.data.filter((r) => r.paese_cod === LX.paese) : null; };
  const paeSpazio = () => {
    const s = dash.data('opportunita');
    if (s.status !== 'ok') return null;
    const out = new Map();
    s.data.forEach((r) => { if (String(r.dr) === LX.dr && r.paese_cod === LX.paese) out.set(r.cpa, N(r.export_mancante_mln)); });
    return out;
  };
  const paeScale = (rows, sp) => {
    const spv = (r) => { const v = sp.get(r.cpa); return v !== null && v !== undefined && v >= 1 ? v : null; };
    scale['pae-imp'] = maxDi(rows, 'import_mln', (r) => r.filiera);
    scale['pae-ita'] = maxDi(rows, 'import_da_italia_mln', (r) => r.filiera);
    scale['pae-sp'] = maxDi(rows.map((r) => ({ v: spv(r), fil: r.filiera })), 'v', (b) => b.fil);
    return spv;
  };
  dash.draw('tab-pae', (tb) => {
    const rows = paeRows();
    if (!rows) { tb.replaceChildren(); return; }
    const spv = paeScale(rows, paeSpazio() || new Map()), media = filMedia(rows);
    const k = ORD.pae;
    const key = (r) => (k === 'spazio' ? (spv(r) || 0) : (N(r[k]) || 0));
    LX.gTab(tb, rows.slice().sort((a, b) => key(b) - key(a)), [
      { text: (r) => r.filiera },
      { cell: (td, r) => LX.gBar(td, N(r.import_mln) / scale['pae-imp'].v * 100, COL.grigio, f.int(N(r.import_mln))) },
      { cell: (td, r) => LX.gBar(td, N(r.import_da_italia_mln) / scale['pae-ita'].v * 100, COL.marrone, f.int(N(r.import_da_italia_mln))) },
      { n: 1, text: (r) => LX.fmt(r.crescita_import_pct, 'pctd'), cls: (r) => LX.sc(r.crescita_import_pct) },
      { n: 1, cell: (td, r) => LX.gQuota(td, r.quota_italia_pct, media) },
      { n: 1, text: (r) => LX.fmt(r.var_quota_italia_punti, 'pt'), cls: (r) => LX.sc(r.var_quota_italia_punti) },
      { cell: (td, r) => { const v = spv(r); if (v === null) { td.className = 'n'; td.textContent = '-'; } else LX.gBar(td, v / scale['pae-sp'].v * 100, COL.scuro, m(v)); } },
    ], null, 'Nessun dato di domanda per questo Paese.');
  });
  dash.draw('pae-media', (el) => { const rows = paeRows(); const v = rows && rows.length ? filMedia(rows) : null; el.textContent = v === null ? '-' : f.dec(v) + '%'; });
  dash.draw('pae-dr', (el) => { el.textContent = LX.gDR(LX.dr) || '-'; });
  dash.draw('pae-frase', (el) => {
    const rows = paeRows();
    if (!rows || !rows.length) { el.textContent = '-'; return; }
    const sp = paeSpazio();
    const ti = d3.sum(rows, (r) => N(r.import_mln)), tt = d3.sum(rows, (r) => N(r.import_da_italia_mln));
    const r1 = LX.maNome(LX.paese) + LX.maVerbo(LX.paese, ' importa ', ' importano ') + f.int(ti) + " milioni di euro l'anno nelle " + rows.length + " filiere della pagina (media 2023-2025). L'Italia ne vende " + f.int(tt) + ' milioni, ' + LX.il(f.dec(tt / ti * 100) + '%') + '.';
    const top = rows.slice().sort((a, b) => N(b.import_da_italia_mln) - N(a.import_da_italia_mln)).slice(0, 3);
    const r2 = "Le filiere dove l'Italia vende di più: " + top.map((r, i) => r.filiera + ' (' + f.int(N(r.import_da_italia_mln)) + (i === 0 ? ' milioni)' : ')')).join(', ') + '.';
    let r3 = '';
    if (sp) {
      const ts = rows.map((r) => ({ fil: r.filiera, v: sp.get(r.cpa) })).filter((x) => x.v !== null && x.v !== undefined && x.v >= 1).sort((a, b) => b.v - a.v).slice(0, 3);
      const chi = LX.gLa(LX.dr);
      r3 = ts.length ? 'Dove ' + chi + ' ha più spazio: ' + ts.map((x, i) => x.fil + ' (' + m(x.v) + (i === 0 ? " milioni l'anno)" : ')')).join(', ') + '.'
        : chi.charAt(0).toUpperCase() + chi.slice(1) + ' non ha spazio di almeno 1 milione in questo Paese.';
    }
    LX.gRighe(el, [r1, r2, r3]);
  });

  // ---------- chi vende nel Paese ----------
  const PREP = { US: 'Negli Stati Uniti', GB: 'Nel Regno Unito', NL: 'Nei Paesi Bassi', CZ: 'Nella Repubblica Ceca' };
  const inPaese = (c) => PREP[c] || 'In ' + LX.maNome(c, true).replace(/^(il |lo |la |i |gli |le |l')/, '');
  const famNome = (t) => { const s = String(t).split(' (')[0]; return s.charAt(0).toLowerCase() + s.slice(1); };
  const concIta = () => { const rows = LX.maConcAll(); return rows ? rows.filter((r) => r.italia === 'sì').sort((a, b) => a.ordine_famiglia - b.ordine_famiglia) : null; };
  const concScale = (it) => {
    const fam = it.filter((r) => r.ordine_famiglia !== 0);
    scale['conc-merc'] = maxDi(fam, 'mercato_2025_mln_eur', (r) => famNome(r.famiglia));
    scale['conc-ita'] = maxDi(fam, 'valore_2025_mln_eur', (r) => famNome(r.famiglia));
  };
  dash.draw('tab-conc-ita', (tb) => {
    const it = concIta();
    if (!it) { tb.replaceChildren(); return; }
    concScale(it);
    const bar = (td, r, k, sc, col) => {
      if (r.ordine_famiglia === 0) { td.className = 'n'; td.textContent = f.m(N(r[k]) || 0); }
      else LX.gBar(td, (N(r[k]) || 0) / scale[sc].v * 100, col, f.m(N(r[k]) || 0));
    };
    LX.gTab(tb, it, [
      { text: (r) => r.famiglia },
      { cell: (td, r) => bar(td, r, 'mercato_2025_mln_eur', 'conc-merc', COL.grigio) },
      { cell: (td, r) => bar(td, r, 'valore_2025_mln_eur', 'conc-ita', COL.marrone) },
      { n: 1, text: (r) => r.posizione_testo },
      { n: 1, text: (r) => LX.fmt(r.quota_2025_pct, 'dec') },
      { n: 1, cls: (r) => LX.sc(r.var_quota_punti), text: (r) => LX.fmt(r.var_quota_punti, 'pt') || '-' },
    ], (r) => (r.ordine_famiglia === 0 ? 'row-strong' : null), 'Nessun dato per questa coppia filiera-Paese.');
  });
  dash.draw('tab-conc-forn', (tb) => {
    const rows = LX.maConc();
    if (!rows) { tb.replaceChildren(); return; }
    scale['conc-val'] = maxDi(rows, 'valore_2025_mln_eur', (r) => r.partner);
    LX.gTab(tb, rows, [
      { n: 1, text: (r) => r.posizione_testo },
      { text: (r) => r.partner },
      { cell: (td, r) => LX.gBar(td, (N(r.valore_2025_mln_eur) || 0) / scale['conc-val'].v * 100, r.italia === 'sì' ? COL.marrone : COL.scuro, f.m(N(r.valore_2025_mln_eur) || 0)) },
      { n: 1, text: (r) => LX.fmt(r.quota_2025_pct, 'dec') },
      { n: 1, text: (r) => LX.fmt(r.quota_2023_pct, 'dec') || '-' },
      { n: 1, cls: (r) => LX.sc(r.var_quota_punti), text: (r) => LX.fmt(r.var_quota_punti, 'pt') || '-' },
    ], (r) => (r.italia === 'sì' ? 'row-strong lx-ita' : null), 'Nessun dato per questa coppia filiera-Paese.');
  });
  dash.draw('conc-frase', (el) => {
    const it = concIta(), all = LX.maConcAll(), cod = dash.data('ma_codici');
    if (!it || !all) { el.textContent = '-'; return; }
    const tf = it.find((r) => r.ordine_famiglia === 0);
    if (!tf) { el.replaceChildren(); return; }
    const cr = cod.status === 'ok' ? cod.data.find((r) => r.filiera_cpa === LX.maFil) : null;
    const fil = cr ? cr.filiera : '';
    const prep = inPaese(LX.maPaese);
    const v0 = N(tf.valore_2025_mln_eur) || 0;
    let r1;
    if (tf.posizione_testo === 'nessun export' || !(v0 > 0)) r1 = prep + " nel 2025 l'Italia non vende " + fil + '.';
    else {
      const q = f.dec(N(tf.quota_2025_pct)) + '%';
      const dq = N(tf.quota_2023_pct) === null ? null : N(tf.quota_2025_pct) - N(tf.quota_2023_pct);
      r1 = prep + " l'Italia è al " + tf.posizione_testo + '° posto tra i fornitori di ' + fil + ': nel 2025 vende ' + f.int(v0) + ' milioni di euro, ' + LX.il(q) + ' di quanto il Paese importa' +
        (dq === null ? '.' : Math.abs(dq) < 0.05 ? ' (quota stabile rispetto al 2023).' : ' (' + f.pt(dq) + ' punti dal 2023).');
    }
    const fam = it.filter((r) => r.ordine_famiglia !== 0);
    const forti = fam.filter((r) => N(r.posizione) && N(r.posizione) <= 5).sort((a, b) => (N(a.posizione) - N(b.posizione)) || (N(b.quota_2025_pct) - N(a.quota_2025_pct))).slice(0, 3);
    const r2 = fam.length ? (forti.length ? 'Dove è tra i primi cinque fornitori: ' + LX.gUnisci(forti.map((r) => famNome(r.famiglia) + ' (' + r.posizione_testo + '° posto, ' + f.dec(N(r.quota_2025_pct)) + '%)')) + '.' : 'In nessuna famiglia è tra i primi cinque fornitori.') : '';
    const grandi = v0 > 0 ? fam.filter((r) => (N(r.valore_2025_mln_eur) || 0) >= 0.05 * v0).sort((a, b) => N(b.valore_2025_mln_eur) - N(a.valore_2025_mln_eur)).slice(0, 3) : [];
    const r3 = grandi.length ? 'Dove vende di più: ' + LX.gUnisci(grandi.map((r) => famNome(r.famiglia) + ' (' + f.int(N(r.valore_2025_mln_eur)) + ' milioni)')) + '.' : '';
    const pf = all.filter((r) => String(r.ordine_famiglia) === '0' && r.italia !== 'sì' && N(r.posizione)).sort((a, b) => N(a.posizione) - N(b.posizione)).slice(0, 3);
    const r4 = pf.length ? 'I primi fornitori del Paese: ' + LX.gUnisci(pf.map((r) => r.partner + ' (' + f.dec(N(r.quota_2025_pct)) + '%)')) + '.' : '';
    LX.gRighe(el, [r1, r2, r3, r4]);
  });

  // ---------- barre piene scritte sotto i titoli delle colonne ----------
  dash.draw('scala', (el) => {
    const k = el.dataset.scala || '';
    // ricalcola la scala della sua tabella, senza dipendere dall'ordine dei disegni
    if (k.startsWith('anni')) { const rows = LX.gAnni(); if (rows) anniScale(rows); }
    else if (k.startsWith('fil')) { const all = LX.gFil(); if (all) filScale(all); }
    else if (k.startsWith('pae')) { const rows = paeRows(); if (rows) paeScale(rows, paeSpazio() || new Map()); }
    else if (k === 'conc-val') { const rows = LX.maConc(); if (rows) scale['conc-val'] = maxDi(rows, 'valore_2025_mln_eur', (r) => r.partner); }
    else if (k.startsWith('conc')) { const it = concIta(); if (it) concScale(it); }
    el.textContent = scalaTesto(scale[k]);
  });

  // ---------- ascolti: menu e pulsanti che ci sono già ----------
  const ANNI = ['anni-frase', 'anni-tot', 'anni-var', 'tab-anni', 'scala'];
  const FIL = ['fil-frase', 'fil-media', 'tab-fil-bar', 'scala'];
  const PAE = ['pae-frase', 'pae-media', 'pae-dr', 'tab-pae', 'scala'];
  const CONC = ['conc-frase', 'tab-conc-ita', 'tab-conc-forn', 'scala'];
  // dopo gli ascolti già presenti, che aggiornano la scelta (territorio, Paese, filiera)
  const dopo = (nomi) => setTimeout(() => nomi.forEach((n) => dash.draw(n)), 0);
  document.querySelectorAll('#sel-dr').forEach((s) => s.addEventListener('change', () => dopo(ANNI.concat(PAE))));
  document.querySelectorAll('[data-draw="sel-paese"]').forEach((s) => s.addEventListener('change', () => dopo(PAE)));
  document.querySelectorAll('[data-draw="sel-filiera"]').forEach((s) => s.addEventListener('change', () => dopo(FIL)));
  document.querySelectorAll('#chk-fil-tutti').forEach((c) => c.addEventListener('change', () => dopo(['tab-fil-bar'])));
  document.querySelectorAll('[data-draw="ma-sel-fam"]').forEach((s) => s.addEventListener('change', () => dopo(['tab-conc-forn', 'scala'])));
  if (Array.isArray(LX.maTutti)) CONC.forEach((n) => { if (!LX.maTutti.includes(n)) LX.maTutti.push(n); });
  document.querySelectorAll('button.lx-ord').forEach((b) => b.addEventListener('click', () => {
    const g = b.dataset.ord;
    ORD[g] = b.dataset.k;
    document.querySelectorAll('button.lx-ord[data-ord="' + g + '"]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    dash.draw({ anni: 'tab-anni', fil: 'tab-fil-bar', pae: 'tab-pae' }[g]);
  }));
})();
