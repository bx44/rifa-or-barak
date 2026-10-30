/**
 * GRAN RIFA OR BARAK 2026 — Backend (Google Apps Script)
 * ------------------------------------------------------------------
 * - Crea sesiones de pago en Stripe Checkout (con reserva de boletos)
 * - Asigna números de boleto al confirmarse el pago
 * - Expone el contador público y el avance de cada vendedor
 * - Sincroniza con Stripe cada 5 minutos (no requiere webhook)
 *
 * Instalación: ver README.md (5 minutos).
 * La llave secreta de Stripe va en Propiedades del script → STRIPE_SECRET_KEY
 */

const CFG = {
  RIFA_ID: 'orbarak2026',
  NOMBRE: 'Gran Rifa Or Barak 2026',
  PRECIO_CENTAVOS: 600000,          // $6,000.00 MXN
  TOTAL: 1000,
  MAX_VENDEDOR: 50,
  MAX_POR_COMPRA: 10,
  SITIO_URL: 'https://bx44.github.io/rifa-or-barak/', // con / al final
  METODOS_PAGO: ['card'],
  MESES_SIN_INTERESES: false,        // true = ofrece MSI (la comisión la absorbe Or Barak)
  MINUTOS_RESERVA: 30,               // mínimo que permite Stripe
  CORREOS_ADMIN: ['jonathan@ben-hamu.com', 'saraorbarak@gmail.com'],
  WHATSAPP: '525539896174',

  HOJA_BOLETOS: 'Web_Boletos',
  HOJA_VENDEDORES: 'Web_Vendedores',
  HOJA_RESERVAS: 'Web_Reservas',

  // Boletos vendidos FUERA de la web (opcional). Si el sistema actual guarda
  // los folios en otra hoja de este mismo archivo, indícala aquí para que esos
  // números no se repitan y sumen al contador.
  HOJA_EXTERNA: '',            // ej. 'Boletos'
  COLUMNA_FOLIO_EXTERNA: '',   // ej. 'A'
  COLUMNA_VENDEDOR_EXTERNA: '' // ej. 'F' (opcional, para el límite de 50)
};

/* =============================== HTTP =============================== */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    switch (p.action) {
      case 'stats':    return json_(stats_());
      case 'vendedor': return json_(vendedorPublico_(p.codigo));
      case 'sesion':   return json_(cumplir_(String(p.id || '')));
      default:         return json_({ ok: true, rifa: CFG.NOMBRE });
    }
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.action === 'checkout') return json_(checkout_(data));
    return json_({ ok: false, error: 'Acción no válida' });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================ CHECKOUT ============================== */

function checkout_(d) {
  const nombre = String(d.nombre || '').trim().slice(0, 120);
  const correo = String(d.correo || '').trim().toLowerCase().slice(0, 120);
  const telefono = String(d.telefono || '').replace(/[^\d+]/g, '').slice(0, 20);
  const cantidad = parseInt(d.cantidad, 10);
  const vendedor = limpiarCodigo_(d.vendedor);

  if (nombre.length < 3) throw new Error('Escribe tu nombre completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) throw new Error('Correo no válido.');
  if (telefono.replace(/\D/g, '').length < 10) throw new Error('Teléfono no válido.');
  if (!(cantidad >= 1 && cantidad <= CFG.MAX_POR_COMPRA)) throw new Error('Cantidad no válida.');

  let vend = null;
  if (vendedor) {
    vend = buscarVendedor_(vendedor);
    if (!vend) throw new Error('El código de vendedor no existe.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const ocupados = foliosOcupados_();
    const reservas = reservasActivas_();
    const reservadoTotal = reservas.reduce((s, r) => s + r.cantidad, 0);
    const disponibles = CFG.TOTAL - ocupados.size - reservadoTotal;
    if (disponibles <= 0) throw new Error('Los boletos están agotados o apartados en este momento.');
    if (cantidad > disponibles) throw new Error('Solo quedan ' + disponibles + ' boletos disponibles.');

    if (vend) {
      const usados = ventasVendedor_(vend.codigo) +
        reservas.filter(r => r.vendedor === vend.codigo).reduce((s, r) => s + r.cantidad, 0);
      if (usados + cantidad > CFG.MAX_VENDEDOR) {
        const resta = Math.max(0, CFG.MAX_VENDEDOR - usados);
        throw new Error(resta ? 'Este vendedor solo puede vender ' + resta + ' boleto(s) más.' : 'Este vendedor ya alcanzó el máximo de ' + CFG.MAX_VENDEDOR + ' boletos.');
      }
    }

    const expira = Math.floor(Date.now() / 1000) + CFG.MINUTOS_RESERVA * 60 + 60;
    const meta = { rifa: CFG.RIFA_ID, nombre: nombre, telefono: telefono, vendedor: vend ? vend.codigo : '', cantidad: String(cantidad) };
    const params = {
      mode: 'payment',
      locale: 'es',
      customer_email: correo,
      client_reference_id: vend ? vend.codigo : 'DIRECTO',
      line_items: [{
        quantity: cantidad,
        price_data: {
          currency: 'mxn',
          unit_amount: CFG.PRECIO_CENTAVOS,
          product_data: { name: 'Boleto · ' + CFG.NOMBRE, description: 'Sorteo 10 de diciembre de 2026. Un Mazda 2 para el comprador y otro para el vendedor del boleto ganador.' }
        }
      }],
      payment_method_types: CFG.METODOS_PAGO,
      success_url: CFG.SITIO_URL + 'gracias.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: CFG.SITIO_URL + '?cancelado=1' + (vend ? '&v=' + encodeURIComponent(vend.codigo) : '') + '#comprar',
      expires_at: expira,
      metadata: meta,
      payment_intent_data: { description: CFG.NOMBRE + ' · ' + cantidad + ' boleto(s)', metadata: meta }
    };
    if (CFG.MESES_SIN_INTERESES) params.payment_method_options = { card: { installments: { enabled: true } } };

    const ses = stripe_('post', 'checkout/sessions', params);
    hoja_(CFG.HOJA_RESERVAS).appendRow([ses.id, new Date(), new Date(expira * 1000), cantidad, vend ? vend.codigo : '', nombre, correo, 'pendiente']);
    return { ok: true, url: ses.url };
  } finally {
    lock.releaseLock();
  }
}

/* ===================== CUMPLIR (asignar folios) ===================== */

function cumplir_(sessionId) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return { ok: false, error: 'Sesión no válida' };

  const previo = foliosDeSesion_(sessionId);
  if (previo) return { ok: true, estado: 'pagado', folios: previo.folios, nombre: previo.nombre };

  const ses = stripe_('get', 'checkout/sessions/' + sessionId);
  if (!ses.metadata || ses.metadata.rifa !== CFG.RIFA_ID) return { ok: false, error: 'Sesión no válida' };
  if (ses.payment_status !== 'paid') {
    if (ses.status === 'expired') marcarReserva_(sessionId, 'expirada');
    return { ok: true, estado: ses.status === 'expired' ? 'expirado' : 'pendiente' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  let folios, m = ses.metadata;
  try {
    const otra = foliosDeSesion_(sessionId); // revisión dentro del candado
    if (otra) return { ok: true, estado: 'pagado', folios: otra.folios, nombre: otra.nombre };

    const cantidad = parseInt(m.cantidad, 10) || (ses.amount_total / CFG.PRECIO_CENTAVOS);
    const ocupados = foliosOcupados_();
    const libres = [];
    for (let i = 1; i <= CFG.TOTAL; i++) { const f = folio_(i); if (!ocupados.has(f)) libres.push(f); }
    for (let i = libres.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = libres[i]; libres[i] = libres[j]; libres[j] = t; }
    folios = libres.slice(0, cantidad).sort();

    const correo = (ses.customer_details && ses.customer_details.email) || ses.customer_email || '';
    const pagado = ses.amount_total / 100;
    const ahora = new Date();
    const filas = folios.map(f => [f, ahora, m.nombre, correo, m.telefono, m.vendedor, sessionId, pagado, 'Liquidado (Stripe)']);
    if (filas.length) {
      const h = hoja_(CFG.HOJA_BOLETOS);
      h.getRange(h.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
    }
    marcarReserva_(sessionId, 'pagada');
    CacheService.getScriptCache().remove('stats');

    if (folios.length < cantidad) {
      MailApp.sendEmail(CFG.CORREOS_ADMIN.join(','), '⚠️ Rifa: pago sin folios suficientes',
        'La sesión ' + sessionId + ' pagó ' + cantidad + ' boletos pero solo había ' + folios.length + ' libres. Revisar reembolso.');
    }
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  try { enviarCorreos_(m, ses, folios); } catch (err) { console.error(err); }
  return { ok: true, estado: 'pagado', folios: folios, nombre: m.nombre };
}

/* ======================= SINCRONIZACIÓN (5 min) ===================== */

function sincronizarStripe() {
  const desde = Math.floor(Date.now() / 1000) - 3 * 24 * 3600;
  let after = null, n = 0;
  do {
    const q = { limit: 100, status: 'complete', 'created[gte]': desde };
    if (after) q.starting_after = after;
    const page = stripe_('get', 'checkout/sessions', q);
    page.data.forEach(s => {
      after = s.id;
      if (s.metadata && s.metadata.rifa === CFG.RIFA_ID && s.payment_status === 'paid' && !foliosDeSesion_(s.id)) {
        cumplir_(s.id); n++;
      }
    });
    if (!page.has_more) break;
  } while (true);

  // marcar reservas vencidas
  const h = hoja_(CFG.HOJA_RESERVAS), v = h.getDataRange().getValues(), now = new Date();
  for (let i = 1; i < v.length; i++) {
    if (v[i][7] === 'pendiente' && new Date(v[i][2]) < now) h.getRange(i + 1, 8).setValue('expirada');
  }
  if (n) console.log('Sincronizadas ' + n + ' sesiones');
}

/* ============================ CONSULTAS ============================= */

function stats_() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('stats');
  if (c) return JSON.parse(c);
  const vendidos = foliosOcupados_().size;
  const r = { ok: true, vendidos: vendidos, total: CFG.TOTAL, restantes: Math.max(0, CFG.TOTAL - vendidos) };
  cache.put('stats', JSON.stringify(r), 20);
  return r;
}

function vendedorPublico_(codigo) {
  const v = buscarVendedor_(limpiarCodigo_(codigo));
  if (!v) return { ok: false, error: 'No encontrado' };
  return { ok: true, codigo: v.codigo, nombre: v.nombre, vendidos: ventasVendedor_(v.codigo), max: CFG.MAX_VENDEDOR };
}

function buscarVendedor_(codigo) {
  if (!codigo) return null;
  const v = hoja_(CFG.HOJA_VENDEDORES).getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (limpiarCodigo_(v[i][0]) === codigo && String(v[i][4]).toUpperCase() !== 'NO') {
      return { codigo: codigo, nombre: String(v[i][1]).trim(), correo: String(v[i][2]).trim() };
    }
  }
  return null;
}

function ventasVendedor_(codigo) {
  let n = 0;
  const v = hoja_(CFG.HOJA_BOLETOS).getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (limpiarCodigo_(v[i][5]) === codigo) n++;
  if (CFG.HOJA_EXTERNA && CFG.COLUMNA_VENDEDOR_EXTERNA) {
    columnaExterna_(CFG.COLUMNA_VENDEDOR_EXTERNA).forEach(x => { if (limpiarCodigo_(x) === codigo) n++; });
  }
  return n;
}

function foliosOcupados_() {
  const set = new Set();
  const v = hoja_(CFG.HOJA_BOLETOS).getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (v[i][0] !== '') set.add(folio_(v[i][0]));
  if (CFG.HOJA_EXTERNA && CFG.COLUMNA_FOLIO_EXTERNA) {
    columnaExterna_(CFG.COLUMNA_FOLIO_EXTERNA).forEach(x => { const n = parseInt(String(x).replace(/\D/g, ''), 10); if (n >= 1 && n <= CFG.TOTAL) set.add(folio_(n)); });
  }
  return set;
}

function reservasActivas_() {
  const v = hoja_(CFG.HOJA_RESERVAS).getDataRange().getValues(), now = new Date(), out = [];
  for (let i = 1; i < v.length; i++) {
    if (v[i][7] === 'pendiente' && new Date(v[i][2]) > now) out.push({ id: v[i][0], cantidad: Number(v[i][3]) || 0, vendedor: limpiarCodigo_(v[i][4]) });
  }
  return out;
}

function foliosDeSesion_(sessionId) {
  const h = hoja_(CFG.HOJA_BOLETOS);
  const found = h.getRange('G:G').createTextFinder(sessionId).matchEntireCell(true).findAll();
  if (!found.length) return null;
  const folios = found.map(r => folio_(h.getRange(r.getRow(), 1).getValue())).sort();
  return { folios: folios, nombre: h.getRange(found[0].getRow(), 3).getValue() };
}

function marcarReserva_(sessionId, estado) {
  const h = hoja_(CFG.HOJA_RESERVAS);
  const r = h.getRange('A:A').createTextFinder(sessionId).matchEntireCell(true).findNext();
  if (r) h.getRange(r.getRow(), 8).setValue(estado);
}

function columnaExterna_(col) {
  const h = SpreadsheetApp.getActive().getSheetByName(CFG.HOJA_EXTERNA);
  if (!h || h.getLastRow() < 2) return [];
  return h.getRange(col + '2:' + col + h.getLastRow()).getValues().map(r => r[0]).filter(x => x !== '');
}

/* ============================= CORREOS ============================== */

function enviarCorreos_(m, ses, folios) {
  const correo = (ses.customer_details && ses.customer_details.email) || ses.customer_email;
  const lista = folios.map(f =>
    '<td style="padding:6px"><div style="border:1px solid #a9793a;border-radius:10px;padding:14px 20px;text-align:center;background:#1a1510">' +
    '<div style="font-size:10px;letter-spacing:3px;color:#a59c8f">BOLETO</div>' +
    '<div style="font-size:30px;letter-spacing:3px;color:#f2d6a0">' + f + '</div></div></td>').join('');
  const html =
    '<div style="background:#0a0908;padding:40px 16px;font-family:Helvetica,Arial,sans-serif;color:#ece6dc">' +
    '<div style="max-width:560px;margin:0 auto;text-align:center">' +
    '<div style="letter-spacing:8px;color:#d2a45c;font-size:13px">OR BARAK</div>' +
    '<h1 style="font-weight:400;letter-spacing:4px;font-size:26px;margin:26px 0 6px;color:#fff">UN SOLO BOLETO.<br><span style="color:#d2a45c">DOS</span> GANADORES.</h1>' +
    '<div style="width:90px;height:1px;background:#d2a45c;margin:22px auto"></div>' +
    '<p style="font-size:16px">Hola ' + esc_(m.nombre) + ', tu pago fue confirmado. ' + (folios.length > 1 ? 'Estos son tus números:' : 'Este es tu número:') + '</p>' +
    '<table role="presentation" style="margin:18px auto"><tr>' + lista + '</tr></table>' +
    '<p style="color:#a59c8f;font-size:14px">Boleto(s) liquidado(s) · Pagado: $' + (ses.amount_total / 100).toLocaleString('es-MX') + ' MXN</p>' +
    '<p style="font-size:15px;margin-top:28px">Sorteo: <b style="color:#d2a45c">10 de diciembre de 2026</b></p>' +
    '<p style="margin:30px 0"><a href="https://wa.me/' + CFG.WHATSAPP + '?text=' + encodeURIComponent('Hola, quiero ser vendedor de la ' + CFG.NOMBRE) + '" style="display:inline-block;background:#c4914a;color:#1a1209;text-decoration:none;padding:14px 26px;border-radius:30px;letter-spacing:2px;font-size:13px">QUIERO SER VENDEDOR</a></p>' +
    '<p style="color:#a59c8f;font-size:13px">Si vendes el boleto ganador, el segundo Mazda 2 es tuyo.</p>' +
    '</div></div>';
  MailApp.sendEmail({ to: correo, subject: 'Tus boletos · ' + CFG.NOMBRE + ' (' + folios.join(', ') + ')', htmlBody: html, name: 'Or Barak' });

  MailApp.sendEmail({
    to: CFG.CORREOS_ADMIN.join(','),
    subject: '💳 Venta web: ' + folios.length + ' boleto(s) — ' + m.nombre,
    htmlBody: 'Comprador: ' + esc_(m.nombre) + '<br>Correo: ' + esc_(correo) + '<br>Tel: ' + esc_(m.telefono) +
      '<br>Vendedor: ' + esc_(m.vendedor || '—') + '<br>Folios: <b>' + folios.join(', ') + '</b><br>Total: $' + (ses.amount_total / 100) + ' MXN<br>Sesión: ' + ses.id
  });
}

/* ============================= UTILIDADES =========================== */

function stripe_(method, path, params) {
  const key = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');
  if (!key) throw new Error('Falta STRIPE_SECRET_KEY en Propiedades del script');
  const opts = { method: method, headers: { Authorization: 'Bearer ' + key }, muteHttpExceptions: true };
  let url = 'https://api.stripe.com/v1/' + path;
  const body = params ? codificar_(params) : '';
  if (method === 'get') { if (body) url += '?' + body; }
  else { opts.payload = body; opts.contentType = 'application/x-www-form-urlencoded'; }
  const res = UrlFetchApp.fetch(url, opts);
  const j = JSON.parse(res.getContentText());
  if (res.getResponseCode() >= 300) throw new Error('Stripe: ' + ((j.error && j.error.message) || res.getResponseCode()));
  return j;
}

function codificar_(obj, prefix) {
  const out = [];
  Object.keys(obj).forEach(k => {
    const v = obj[k];
    const key = prefix ? prefix + '[' + k + ']' : k;
    if (v === null || v === undefined) return;
    if (typeof v === 'object') out.push(codificar_(v, key));
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(v));
  });
  return out.filter(Boolean).join('&');
}

function hoja_(nombre) {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(nombre) || crearHoja_(ss, nombre);
}

function crearHoja_(ss, nombre) {
  const enc = {
    [CFG.HOJA_BOLETOS]: ['Folio', 'Fecha', 'Nombre', 'Correo', 'Teléfono', 'Vendedor', 'Sesión Stripe', 'Pagado (MXN)', 'Estado'],
    [CFG.HOJA_VENDEDORES]: ['Código', 'Nombre', 'Correo', 'Teléfono', 'Activo (SI/NO)'],
    [CFG.HOJA_RESERVAS]: ['Sesión', 'Creada', 'Expira', 'Cantidad', 'Vendedor', 'Nombre', 'Correo', 'Estado']
  }[nombre];
  const h = ss.insertSheet(nombre);
  if (enc) {
    h.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold').setBackground('#1a1510').setFontColor('#d2a45c');
    h.setFrozenRows(1);
  }
  if (nombre === CFG.HOJA_BOLETOS) h.getRange('A:A').setNumberFormat('@');
  if (nombre === CFG.HOJA_VENDEDORES) h.getRange('A:A').setNumberFormat('@');
  return h;
}

function folio_(n) { return String(parseInt(String(n).replace(/\D/g, ''), 10)).padStart(4, '0'); }
function limpiarCodigo_(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40); }
function esc_(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ============================ INSTALACIÓN =========================== */

/** Ejecutar UNA vez desde el editor: crea hojas y el sincronizador de 5 min. */
function instalar() {
  [CFG.HOJA_BOLETOS, CFG.HOJA_VENDEDORES, CFG.HOJA_RESERVAS].forEach(hoja_);
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'sincronizarStripe').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sincronizarStripe').timeBased().everyMinutes(5).create();
  const key = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');
  console.log(key ? 'Listo. Llave de Stripe detectada (' + key.slice(0, 8) + '…).' : 'Listo. FALTA poner STRIPE_SECRET_KEY en Propiedades del script.');
}

/** Prueba rápida de la conexión con Stripe. */
function probarStripe() {
  const b = stripe_('get', 'balance');
  console.log('Conexión OK. Modo: ' + (b.livemode ? 'PRODUCCIÓN' : 'PRUEBA'));
}
