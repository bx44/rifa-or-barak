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
