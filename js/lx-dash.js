// Strato minimo che sostituisce il motore delle dashboard di origine.
// Offre le stesse funzioni usate dal codice della pagina: dash.draw, dash.data, dash.onData, dash.setLink, dash.colors.
// I dati sono file JSON nella cartella dati/, ciascuno nella forma {"rows": [...]}.
(function () {
  const DATASET = ['dr_scheda', 'distretti', 'liste', 'opportunita', 'mancante_paese', 'filiere_dr', 'dr_simili', 'dr_simili_paesi',
    'domanda_paesi', 'contesto_paesi', 'paese_dr', 'mercati_filiera', 'ma_codici', 'ma_stato', 'ma_testi', 'ma_mercato', 'ma_accesso',
    'ma_tasse', 'ma_calendari', 'ma_spedizione', 'ma_trasporto', 'ma_requisiti', 'ma_concorrenti', 'aggiornamenti'];
  const stato = {};
  DATASET.forEach((k) => { stato[k] = { status: 'loading', data: null }; });
  const disegni = new Map();
  const ascolti = [];

  function esegui(nome) {
    const fn = disegni.get(nome);
    if (!fn) return;
    document.querySelectorAll('[data-draw="' + nome + '"]').forEach((el) => {
      try { fn(el); } catch (e) { console.error('Disegno non riuscito: ' + nome, e); }
    });
  }

  window.dash = {
    colors: ['#8c5a2b', '#5f6f52', '#a7774a', '#6b6b6b'],
    draw(nome, fn) {
      if (typeof fn === 'function') disegni.set(nome, fn);
      esegui(nome);
    },
    data(id) { return stato[id] || { status: 'error', data: null }; },
    onData(fn) { ascolti.push(fn); },
    setLink(id) {
      try { history.replaceState(null, '', '#' + id); } catch (e) { /* niente */ }
    },
  };

  function ridisegnaTutto() {
    ascolti.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    disegni.forEach((fn, nome) => esegui(nome));
  }

  let attesa = null;
  function ridisegnaPresto() {
    if (attesa) return;
    attesa = requestAnimationFrame(() => { attesa = null; ridisegnaTutto(); });
  }

  DATASET.forEach((k) => {
    fetch('dati/' + k + '.json', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json(); })
      .then((j) => { stato[k] = { status: 'ok', data: j.rows }; ridisegnaPresto(); })
      .catch((e) => { console.error('Dati non caricati: ' + k, e); stato[k] = { status: 'error', data: null }; ridisegnaPresto(); });
  });
})();
