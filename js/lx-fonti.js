// Scheda "Fonti e aggiornamenti": tabella delle fonti e registro degli aggiornamenti, dal dataset "aggiornamenti".
LX.fontiRighe = function (tipo) {
  const s = dash.data('aggiornamenti');
  if (s.status !== 'ok') return null;
  return s.data.filter((r) => r.tipo === tipo).sort((a, b) => LX.N(a.ordine) - LX.N(b.ordine));
};

dash.draw('fonti-tab', (tb) => {
  const rows = LX.fontiRighe('fonte');
  if (!rows) { tb.replaceChildren(); return; }
  LX.rows(tb, rows, [
    { text: (r) => r.fonte || '' },
    { text: (r) => r.cosa_da || '' },
    { text: (r) => r.dati_oggi || '' },
    { text: (r) => r.prossimo || '' },
    { text: (r) => r.schede || '' },
  ], (r) => encodeURIComponent(r.chiave));
});

dash.draw('fonti-reg', (tb) => {
  const rows = LX.fontiRighe('registro');
  if (!rows) { tb.replaceChildren(); return; }
  LX.rows(tb, rows, [
    { text: (r) => r.data || '' },
    { text: (r) => r.cambiato || '' },
  ], (r) => encodeURIComponent(r.chiave));
});
