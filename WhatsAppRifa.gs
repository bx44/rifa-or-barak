/* ============================================================
 *  LISTA PARA WHATSAPP (WARocket / SenderRocket)
 * ============================================================
 *  waPrepararLista  → lee tus Contactos de Google (los mismos del celular)
 *                     y llena la hoja "WhatsApp Rifa" con teléfono, nombre
 *                     como lo tienes guardado, nombre para el saludo,
 *                     etiquetas, y si ya está en la rifa (compró o vende).
 *  Columna "Enviar": SI / NO. Los que ya están en la rifa salen en NO.
 * ============================================================ */

const WA = {
  HOJA: 'WhatsApp Rifa',
  EXCLUIR_NOMBRES: ['yoel perets'],
  MI_CEL: '5539896174'
};

function waPrepararLista() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(WA.HOJA) || ss.insertSheet(WA.HOJA);

  // Celulares que ya están en la rifa (compradores y vendedores)
  const enRifa = {};
  try {
    const c = SpreadsheetApp.openById(INV.RIFA_SHEET_ID).getSheetByName('COMPRADORES');
    c.getRange(2, 1, Math.max(c.getLastRow() - 1, 1), 1).getValues().forEach(function (r) {
      const d = String(r[0]).replace(/\D/g, '').slice(-10);
      if (d.length === 10) enRifa[d] = true;
    });
  } catch (e) { Logger.log('No pude leer COMPRADORES: ' + e.message); }

  // Etiquetas
  const etiquetas = {};
  const g = People.ContactGroups.list({ pageSize: 1000 });
  (g.contactGroups || []).forEach(function (x) { etiquetas[x.resourceName] = x.formattedName || x.name; });

  const filas = [], vistos = {};
  let token = null;
  do {
    const r = People.People.Connections.list('people/me', {
      pageSize: 1000, pageToken: token, personFields: 'names,phoneNumbers,memberships'
    });
    (r.connections || []).forEach(function (p) {
      const nm = (p.names && p.names[0]) || {};
      const nombre = String(nm.displayName || '').trim();
      if (!nombre || !p.phoneNumbers) return;
      const tels = p.phoneNumbers.map(function (t) { return waNormalizar_(t.canonicalForm || t.value); }).filter(Boolean);
      if (!tels.length) return;
      const tel = tels[0];
      if (vistos[tel]) return;
      vistos[tel] = true;
      const labs = (p.memberships || []).map(function (m) {
        const id = m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName;
        return id && !/^contactGroups\/(myContacts|starred|all|chatBuddies|friends|family|coworkers|blocked)$/.test(id) ? etiquetas[id] : '';
      }).filter(Boolean).join(', ');
      const ya = enRifa[tel.slice(-10)] ? 'SI' : 'NO';
      const excl = WA.EXCLUIR_NOMBRES.some(function (x) { return nombre.toLowerCase().indexOf(x) >= 0; }) || tel.slice(-10) === WA.MI_CEL;
      filas.push([tel, nombre, waSaludo_(nm.givenName, nombre), labs, ya, (ya === 'SI' || excl) ? 'NO' : 'SI', excl ? 'Excluido' : (ya === 'SI' ? 'Ya está en la rifa' : '')]);
    });
    token = r.nextPageToken;
  } while (token);

  filas.sort(function (a, b) { return a[1].localeCompare(b[1], 'es'); });
  sh.clearContents();
  const enc = ['Telefono', 'Nombre guardado', 'Nombre saludo', 'Etiquetas', 'Ya en la rifa', 'Enviar', 'Notas'];
  sh.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold');
  if (filas.length) {
    sh.getRange(2, 1, filas.length, 1).setNumberFormat('@');
    sh.getRange(2, 1, filas.length, enc.length).setValues(filas);
  }
  sh.setFrozenRows(1);
  const si = filas.filter(function (f) { return f[5] === 'SI'; }).length;
  const msg = filas.length + ' contactos con teléfono. Ya en la rifa: ' +
    filas.filter(function (f) { return f[4] === 'SI'; }).length + '. Marcados para enviar: ' + si + '.';
  Logger.log(msg);
  return msg;
}

// Teléfono en formato internacional sin "+" (ej. 525512345678)
function waNormalizar_(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10) d = '52' + d;                       // celular mexicano sin lada de país
  if (/^521\d{10}$/.test(d)) d = '52' + d.slice(3);         // formato viejo 521…
  if (/^0052/.test(d)) d = d.slice(2);
  return d.length >= 11 && d.length <= 15 ? d : '';
}

// Nombre para el saludo: el nombre de pila guardado, sin emojis ni signos
function waSaludo_(given, display) {
  const limpiar = function (s) { return String(s || '').replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim(); };
  let n = limpiar(given) || limpiar(display).split(' ')[0] || '';
  return n.split(' ')[0];
}

/* ------------------------------------------------------------
 *  waMarcarApoyo → deja en "Enviar = SI" solo a quien nos ha apoyado
 *  (aparece en Donativos/Cobrados de Cobranza o en las listas de
 *  donadores), y saca a Mone y a quien donó más de $5,000 en los
 *  últimos 3 meses.
 * ------------------------------------------------------------ */
const WA_COBRANZA_ID = '1LzPGO6Mun_96Y9a3Dxae00CJcjxLH18HQjCJloqd-dE';
const WA_EXCLUIR_APOYO = ['mone lev'];
const WA_TOPE_3M = 5000;

function waMarcarApoyo() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(WA.HOJA);
  const cb = SpreadsheetApp.openById(WA_COBRANZA_ID);
  const d10 = function (v) { const d = String(v || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : ''; };
  const norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(sr|sra|srita|rab|rav|dr)\.?\s+/, '').replace(/\s+/g, ' ').trim(); };

  // Teléfonos por nombre (Cobranza > Contactos)
  const telsPorNombre = {};
  const add = function (n, t) { n = norm(n); t = d10(t); if (n && t) (telsPorNombre[n] = telsPorNombre[n] || {})[t] = true; };
  const ct = cb.getSheetByName('Contactos').getDataRange().getValues();
  ct.slice(1).forEach(function (r) { add(r[3], r[4]); add(r[3], r[5]); });

  const apoyo = {}, fuente = function (t, f) { if (t) apoyo[t] = apoyo[t] || f; };
  // Donativos (compromisos)
  const dn = cb.getSheetByName('Donativos').getDataRange().getValues();
  dn.slice(1).forEach(function (r) { fuente(d10(r[3]), 'Donativos'); add(r[2], r[3]); });

  // Cobrados: quién pagó y cuánto en los últimos 3 meses
  const meses = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
  const fecha = function (v) {
    if (v instanceof Date) return v;
    const m = String(v || '').match(/(\d{1,2})\/([a-z]{3})\/(\d{2,4})/i);
    if (!m || meses[m[2].toLowerCase()] === undefined) return null;
    const y = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(y, meses[m[2].toLowerCase()], Number(m[1]));
  };
  const num = function (v) { return typeof v === 'number' ? v : Number(String(v || '').replace(/[^0-9.]/g, '')) || 0; };
  const desde = new Date(Date.now() - 92 * 86400000);
  const recientePorNombre = {};
  const co = cb.getSheetByName('Cobrados').getDataRange().getValues();
  co.slice(2).forEach(function (r) {
    const n = norm(r[2]); if (!n) return;
    Object.keys(telsPorNombre[n] || {}).forEach(function (t) { fuente(t, 'Cobrados'); });
    const f = fecha(r[1]);
    if (f && f >= desde) recientePorNombre[n] = (recientePorNombre[n] || 0) + num(r[3]) + num(r[4]) * 18;
  });
  const grandes = {};
  Object.keys(recientePorNombre).forEach(function (n) {
    if (recientePorNombre[n] > WA_TOPE_3M) Object.keys(telsPorNombre[n] || {}).forEach(function (t) { grandes[t] = Math.round(recientePorNombre[n]); });
  });

  // Listas de donadores de la hoja de correos
  ['Contactos', 'Contactos extranjeros'].forEach(function (h) {
    const s = ss.getSheetByName(h); if (!s) return;
    const v = s.getDataRange().getValues(); const enc = v[0].map(function (x) { return String(x).toLowerCase(); });
    const cols = [enc.indexOf('tel'), enc.indexOf('tel2')].filter(function (i) { return i >= 0; });
    v.slice(1).forEach(function (r) { cols.forEach(function (i) { fuente(d10(r[i]), 'Lista donadores'); }); });
  });

  // Aplicar a la hoja de WhatsApp
  const n = sh.getLastRow() - 1;
  const data = sh.getRange(2, 1, n, 7).getValues();
  let si = 0, grandesN = 0, excl = 0;
  const out = data.map(function (r) {
    const t = d10(r[0]);
    const nombre = String(r[1]).toLowerCase();
    const ap = apoyo[t] || '';
    const g = grandes[t] ? '$' + grandes[t].toLocaleString('es-MX') : '';
    const mone = WA_EXCLUIR_APOYO.some(function (x) { return nombre.indexOf(x) >= 0; });
    let enviar = 'NO', nota = r[6];
    if (r[4] === 'SI') nota = 'Ya está en la rifa';
    else if (r[6] === 'Excluido' || mone) { nota = 'Excluido'; excl++; }
    else if (g) { nota = 'Donó ' + g + ' en 3 meses'; grandesN++; }
    else if (!ap) nota = 'Sin historial de apoyo';
    else { enviar = 'SI'; nota = ''; si++; }
    return [enviar, nota, ap, g];
  });
  sh.getRange(1, 8, 1, 2).setValues([['Apoyo (fuente)', 'Donó 3 meses']]).setFontWeight('bold');
  sh.getRange(2, 6, n, 2).setValues(out.map(function (o) { return [o[0], o[1]]; }));
  sh.getRange(2, 8, n, 2).setValues(out.map(function (o) { return [o[2], o[3]]; }));
  const msg = 'Para enviar: ' + si + '. Fuera por donar >$5,000 en 3 meses: ' + grandesN + '. Excluidos (Mone, Yoel, tú): ' + excl + '.';
  Logger.log(msg);
  return msg;
}
