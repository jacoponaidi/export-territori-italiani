window.LX = window.LX || { dr: '1', oppPaese: '', oppFil: '', soglia: false, vuoto: '', paese: 'US', filiera: 'CK28' };
(function () {
  const it = d3.formatLocale({ decimal: ',', thousands: '.', grouping: [3], currency: ['€', ''], minus: '-' });
  const i0 = it.format(',.0f'), i1 = it.format(',.1f'), i2 = it.format(',.2f');
  const N = (v) => (v === null || v === undefined || v === '' ? null : +v);
  LX.N = N;
  // segno della variazione sul numero gia arrotondato: zero senza segno
  LX.sg = (s) => (/^-?0(,0+)?$/.test(s) ? s.replace('-', '') : (s.charAt(0) === '-' ? s : '+' + s));
  LX.f = {
    int: (v) => i0(v),
    dec: (v) => i1(v),
    mld: (v) => i2(v),
    m: (v) => (Math.abs(v) >= 10 ? i0(v) : i1(v)),
    pct: (v) => LX.sg(i0(v)) + '%',
    pctd: (v) => LX.sg(i1(v)) + '%',
    pt: (v) => LX.sg(i1(v)),
  };
  // articolo davanti a un numero scritto ("8,0%", "11%", "0,5%"): l' se si legge con vocale (1, 8..., 11), lo davanti a zero
  LX.voc = (t) => { const ip = String(t).replace(/^[+-]/, '').split(',')[0].replace(/\./g, '').replace(/\D.*$/, ''); return ip === '0' ? 'z' : (ip === '1' || ip.charAt(0) === '8' || (ip.slice(0, 2) === '11' && [2, 5, 8].includes(ip.length))) ? 'v' : 'c'; };
  LX.il = (t) => ({ v: "l'", z: 'lo ', c: 'il ' })[LX.voc(t)] + t;
  LX.fmt = (v, kind) => (N(v) === null ? '' : LX.f[kind](N(v)));
  LX.sc = (v) => (N(v) === null ? '' : N(v) > 0 ? 'good' : N(v) < 0 ? 'bad' : '');
  LX.rows = function (tbody, rows, cols, keyFn, rowClass) {
    d3.select(tbody).selectAll('tr.lx-vuota').remove();
    const tr = d3.select(tbody).selectAll('tr').data(rows, keyFn).join('tr')
      .attr('data-key', keyFn).attr('class', rowClass || null);
    tr.selectAll('td').data((r) => cols.map((c) => ({ c, r }))).join('td')
      .attr('class', (d) => [d.c.n ? 'n' : '', d.c.cls ? d.c.cls(d.r) : ''].join(' ').trim() || null)
      .text((d) => d.c.text(d.r));
  };
  LX.tip = function (el) {
    let t = el.querySelector(':scope > .lx-tip');
    if (!t) { t = document.createElement('div'); t.className = 'lx-tip'; t.style.display = 'none'; el.appendChild(t); }
    return {
      show(ev, text) {
        const [px, py] = d3.pointer(ev, el);
        t.textContent = text; t.style.display = '';
        // dentro il riquadro e dentro lo schermo, anche quando la tabella scorre di lato
        const er = el.getBoundingClientRect(), tw = t.offsetWidth || 280;
        const minL = Math.max(0, -er.left + 4), maxL = Math.min(el.scrollWidth, window.innerWidth - er.left) - tw - 4;
        t.style.left = Math.max(minL, Math.min(px + 12, maxL)) + 'px'; t.style.top = (py + 12) + 'px';
      },
      hide() { t.style.display = 'none'; },
    };
  };
  // accorcia con "…" le etichette di un grafico più lunghe di max pixel; il nome intero resta nel tooltip del browser
  LX.accorcia = function (sel, max) {
    sel.each(function () {
      const full = this.textContent;
      if (this.getComputedTextLength() <= max) return;
      let t = full;
      while (t.length > 3 && this.getComputedTextLength() > max) { t = t.slice(0, -1); this.textContent = t.trimEnd() + '…'; }
      const ti = document.createElementNS('http://www.w3.org/2000/svg', 'title'); ti.textContent = full; this.appendChild(ti);
    });
  };
  // tabella senza righe: una riga sola con il messaggio
  LX.vuota = function (tb, n, testo) {
    d3.select(tb).selectAll('tr').remove();
    const tr = document.createElement('tr'); tr.className = 'row-muted lx-vuota';
    const td = document.createElement('td'); td.colSpan = n; td.textContent = testo;
    tr.append(td); tb.append(tr);
  };
  LX.empty = function (el, s) {
    el.replaceChildren();
    el.textContent = s.status === 'error' ? 'Caricamento non riuscito' : '-';
  };
  LX.oppDR = function () {
    const s = dash.data('opportunita');
    if (s.status !== 'ok') return null;
    if (LX._oppKey !== LX.dr || LX._oppSrc !== s.data) {
      LX._oppSrc = s.data; LX._oppKey = LX.dr;
      LX._opp = s.data.filter((r) => String(r.dr) === LX.dr);
    }
    return LX._opp;
  };
  // nome del territorio dal numero interno (solo il nome, senza sigla e senza numero)
  LX.drNome = function (dr) {
    const s = dash.data('dr_scheda');
    const row = s.status === 'ok' ? s.data.find((x) => String(x.dr) === String(dr)) : null;
    if (row) return row.nome_esteso;
    let t = '';
    document.querySelectorAll('#sel-dr option').forEach((o) => { if (o.value === String(dr)) t = o.textContent.trim(); });
    return t;
  };
})();

dash.draw('drv', (el) => {
  const s = dash.data('dr_scheda');
  if (s.status !== 'ok') { el.textContent = '-'; return; }
  const row = s.data.find((r) => String(r.dr) === LX.dr);
  const v = row ? row[el.dataset.field] : null;
  if (v === null || v === undefined || v === '') { el.textContent = '-'; return; }
  el.textContent = el.dataset.fmt === 'text' ? String(v) : LX.f[el.dataset.fmt](+v);
});

// ridisegna le parti di una scheda quando diventa visibile: i grafici misurano larghezza e testi, che in una scheda nascosta valgono zero
LX.ridisegnaScheda = function (id) {
  const sec = document.getElementById(id);
  if (!sec) return;
  [...new Set([...sec.querySelectorAll('[data-draw]')].map((e) => e.dataset.draw))].forEach((n) => dash.draw(n));
};
document.querySelectorAll('.lx-tab').forEach((b) => b.addEventListener('click', () => {
  const id = b.dataset.tab;
  document.querySelectorAll('.lx-tab').forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
  document.querySelectorAll('.lx-sec').forEach((s) => { s.hidden = s.id !== id; });
  dash.setLink(id);
  LX.ridisegnaScheda(id);
}));
// al cambio di larghezza della finestra si ridisegnano i grafici della scheda visibile
(function () {
  let t = null, w = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === w) return;
    w = window.innerWidth;
    clearTimeout(t);
    t = setTimeout(() => { const s = [...document.querySelectorAll('.lx-sec')].find((x) => !x.hidden); if (s) LX.ridisegnaScheda(s.id); }, 200);
  });
})();
(function () {
  const h = (location.hash || '').slice(1);
  if (h && document.getElementById(h) && document.getElementById(h).classList.contains('lx-sec')) {
    document.querySelectorAll('.lx-tab').forEach((x) => x.setAttribute('aria-selected', x.dataset.tab === h ? 'true' : 'false'));
    document.querySelectorAll('.lx-sec').forEach((s) => { s.hidden = s.id !== h; });
  }
})();

document.querySelectorAll('#sel-dr').forEach((s) => s.addEventListener('change', () => {
  LX.dr = s.value; LX.oppPaese = ''; LX.oppFil = ''; LX.vuoto = '';
  ['drv', 'tab-liste', 'sel-opp-paese', 'sel-opp-fil', 'tab-opp', 'sel-vuoto', 'vuoto', 'tab-fil'].forEach((n) => dash.draw(n));
}));
document.querySelectorAll('#chk-soglia').forEach((c) => c.addEventListener('change', () => { LX.soglia = c.checked; dash.draw('tab-opp'); }));
