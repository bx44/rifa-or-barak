/* ============================================================
 *  PÁGINA WEB PÚBLICA DE LA RIFA
 *  La página (GitHub / tu dominio) habla con este script a través de
 *  la implementación PÚBLICA (la misma que usa el Worker: RIFA_GAS_URL).
 *
 *  GET  ?accion=web&op=stats                 -> contador de boletos
 *  GET  ?accion=web&op=vendedor&codigo=XXX   -> nombre y avance del vendedor
 *  GET  ?accion=web&op=micodigo&cel=55...    -> el vendedor obtiene su código/link
 *  POST {accion:'web_comprar', ...}          -> registra la venta (igual que el
 *        Form "Vender boleto") y devuelve el link de pago del Worker, que
 *        cobra el saldo exacto en Stripe. El webhook ya existente marca el pago.
 *
 *  Código de vendedor = iniciales del nombre + últimos 4 dígitos del celular
 *  (ej. Jonathan Ben-Hamu, 55 3989 6174 -> JBH6174). No hay que darlo de alta:
 *  todo vendedor con EsVendedor = SI ya tiene su código.
 * ============================================================ */
const WEB_PAGO_URL_BASE = 'https://muddy-meadow-b7aa.jonathan-cf5.workers.dev/pagar';
const WEB_MAX_POR_VENDEDOR = 50;
const WEB_MAX_PENDIENTES_POR_CELULAR = 3; // boletos con saldo que alguien puede apartar desde la web
const WEB_CORREO_VENDEDOR_DIRECTO = 'jonathan@ben-hamu.com'; // a quién se asignan las ventas web sin código

function webJson_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function webApi_(p) {
  try {
    if (p.op === 'stats') return webJson_(webStats_());
    if (p.op === 'vendedor') return webJson_(webVendedorPublico_(p.codigo));
    if (p.op === 'micodigo') return webJson_(webMiCodigo_(p.cel));
    if (p.op === 'evento') return webJson_(webRegistrarEvento_(p.e, p.v, ''));
    if (p.op === 'muro') return webJson_(webMuro_());
    return webJson_({ ok: true, rifa: NOMBRE_RIFA });
  } catch (err) {
    return webJson_({ ok: false, error: String(err && err.message || err) });
  }
}

function webCodigoVendedor_(nombre, celular) {
  const sinAcentos = String(nombre || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const iniciales = sinAcentos.split(/[^A-Z]+/).filter(Boolean).map(function (w) { return w[0]; }).join('').slice(0, 3);
  return (iniciales || 'V') + normalizarTelefono_(celular).slice(-4);
}

function webLimpiarCodigo_(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function webVendedores_() {
  const data = sh_(SH_COMPRADORES).getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== '' && String(data[i][3]).trim() === 'SI') {
      out.push({ celular: data[i][0], nombre: String(data[i][1]).trim(), correo: String(data[i][2]).trim(),
        codigo: webCodigoVendedor_(data[i][1], data[i][0]) });
    }
  }
  return out;
}

function webBoletos_() {
  const data = sh_(SH_BOLETOS).getDataRange().getValues(); // Folio, Comprador, Vendedor, Precio, Pagado, Saldo, Estado
  data.shift();
  return data.filter(function (r) { return r[0] !== ''; });
}

function webEstaVendido_(r) {
  const e = String(r[6]).trim();
  return e !== 'Disponible' && e !== 'Cancelado' && e !== '';
}

function webVentasDeVendedor_(celular, boletos) {
  const cel = normalizarTelefono_(celular);
  return (boletos || webBoletos_()).filter(function (r) {
    return webEstaVendido_(r) && normalizarTelefono_(r[2]) === cel;
  }).length;
}

function webStats_() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('web_stats');
  if (c) return JSON.parse(c);
  const b = webBoletos_();
  const vendidos = b.filter(webEstaVendido_);
  const r = {
    ok: true,
    total: b.length,
    vendidos: vendidos.length,
    liquidados: vendidos.filter(function (x) { return Number(x[5]) === 0; }).length,
    restantes: b.length - vendidos.length
  };
  cache.put('web_stats', JSON.stringify(r), 30);
  return r;
}

function webBuscarVendedorPorCodigo_(codigo) {
  codigo = webLimpiarCodigo_(codigo);
  if (!codigo) return null;
  const vs = webVendedores_();
  for (let i = 0; i < vs.length; i++) if (vs[i].codigo === codigo) return vs[i];
  return null;
}

function webVendedorPublico_(codigo) {
  const v = webBuscarVendedorPorCodigo_(codigo);
  if (!v) return { ok: false, error: 'No encontrado' };
  return { ok: true, codigo: v.codigo, nombre: v.nombre, vendidos: webVentasDeVendedor_(v.celular), max: WEB_MAX_POR_VENDEDOR };
}

function webMiCodigo_(cel) {
  const buscado = normalizarTelefono_(cel);
  if (buscado.length !== 10) return { ok: false, error: 'Celular no válido' };
  const vs = webVendedores_();
  for (let i = 0; i < vs.length; i++) {
    if (normalizarTelefono_(vs[i].celular) === buscado) {
      return { ok: true, codigo: vs[i].codigo, nombre: vs[i].nombre, vendidos: webVentasDeVendedor_(vs[i].celular), max: WEB_MAX_POR_VENDEDOR };
    }
  }
  return { ok: false, error: 'Ese celular no está registrado como vendedor' };
}

function webUrlPago_(folio) {
  return WEB_PAGO_URL_BASE + '?f=' + Number(folio) + '&t=' + firmaPago_(folio);
}

/* ---------- COMPRA DESDE LA WEB (misma lógica que el Form "Vender boleto") ---------- */
function webComprar_(d) {
  try {
    if (d.web_hp) return webJson_({ ok: false, error: 'Solicitud no válida.' }); // campo trampa anti-bots
    let nombre = String(d.nombre || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    let correo = String(d.correo || '').trim().toLowerCase().slice(0, 120);
    const cel = normalizarTelefono_(d.telefono);
    if (nombre.length < 3) return webJson_({ ok: false, error: 'Escribe tu nombre completo.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return webJson_({ ok: false, error: 'Correo no válido.' });
    if (cel.length !== 10) return webJson_({ ok: false, error: 'Escribe tu celular a 10 dígitos.' });

    let vendedor;
    const codigo = webLimpiarCodigo_(d.vendedor);
    if (codigo) {
      vendedor = webBuscarVendedorPorCodigo_(codigo);
      if (!vendedor) return webJson_({ ok: false, error: 'El código de vendedor no existe. Revísalo o déjalo vacío.' });
    } else {
      const v = buscarVendedorPorCorreo_(WEB_CORREO_VENDEDOR_DIRECTO);
      if (!v) return webJson_({ ok: false, error: 'Escribe el código de la persona que te invitó.' });
      vendedor = { celular: v.celular, nombre: v.nombre, correo: v.correo };
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    let folio, reconciliado = false;
    const nombreTecleado = nombre, correoTecleado = correo;
    try {
      const boletos = webBoletos_();
      if (webVentasDeVendedor_(vendedor.celular, boletos) >= WEB_MAX_POR_VENDEDOR) {
        return webJson_({ ok: false, error: vendedor.nombre + ' ya vendió el máximo de ' + WEB_MAX_POR_VENDEDOR + ' boletos. Usa otro código o déjalo vacío.' });
      }
      const pendientes = boletos.filter(function (r) {
        return webEstaVendido_(r) && normalizarTelefono_(r[1]) === cel && Number(r[5]) > 0;
      }).length;
      if (pendientes >= WEB_MAX_PENDIENTES_POR_CELULAR) {
        return webJson_({ ok: false, error: 'Ya tienes ' + pendientes + ' boletos pendientes de pago. Liquídalos primero o escríbenos por WhatsApp.' });
      }

      const existente = identidadPorCelular_(cel);
      if (existente) {
        if (existente.nombre.trim().toLowerCase() !== nombre.toLowerCase()) reconciliado = true;
        nombre = existente.nombre;
        correo = existente.correo || correo;
        if ((existente.correo || '').trim().toLowerCase() !== correoTecleado) reconciliado = true;
      }
      altaOActualizaComprador_(cel, nombre, correo);
      folio = asignarSiguienteFolio_(cel, vendedor.celular);
      if (!folio) return webJson_({ ok: false, error: 'Ya no hay boletos disponibles.' });
      SpreadsheetApp.flush();
      registrarLog_('WEB', 'VENTA_REGISTRADA', 'Folio ' + folio + ' asignado a comprador ' + cel + ' (' + nombre + ') desde la página web. Vendedor: ' + vendedor.nombre);
      webRegistrarEvento_('apartado', codigo || webCodigoVendedor_(vendedor.nombre, vendedor.celular), folio);
      webGuardarMuro_(d, folio, nombre, cel);
    } finally {
      lock.releaseLock();
    }
    CacheService.getScriptCache().remove('web_stats');

    try { registrarDonativoPendienteEnCobranza_(cel, nombre, correo, folio, vendedor.nombre); }
    catch (err) { registrarLog_('SISTEMA', 'ERROR_COBRANZA', 'Web, folio ' + folio + ': ' + err); }
    try { enviarCorreoConfirmacionComprador_(correo, nombre, folio, vendedor.nombre); }
    catch (err) { registrarLog_('SISTEMA', 'ERROR_EMAIL', String(err)); }
    try {
      if (vendedor.correo) enviarCorreoConfirmacionVendedor_(vendedor.correo, {
        folio: folio, celComprador: cel, nombreTecleado: nombreTecleado, correoTecleado: correoTecleado,
        nombreSistema: nombre, correoSistema: correo, reconciliado: reconciliado
      });
    } catch (err) { registrarLog_('SISTEMA', 'ERROR_EMAIL', String(err)); }

    return webJson_({ ok: true, folio: folio, nombre: nombre, vendedor: vendedor.nombre, pagoUrl: webUrlPago_(folio) });
  } catch (err) {
    try { registrarLog_('WEB', 'ERROR_WEB', String(err)); } catch (e2) {}
    return webJson_({ ok: false, error: 'No se pudo registrar. Intenta de nuevo o escríbenos por WhatsApp.' });
  }
}

/** Prueba desde el editor: muestra el contador y el link de pago de un folio vendido. */
function webProbar() {
  Logger.log(JSON.stringify(webStats_()));
  const b = webBoletos_().filter(function (r) { return webEstaVendido_(r) && Number(r[5]) > 0; })[0];
  if (b) Logger.log('Link de pago folio ' + b[0] + ': ' + webUrlPago_(b[0]));
  Logger.log('Vendedores: ' + webVendedores_().map(function (v) { return v.codigo + ' ' + v.nombre; }).join(' | '));
}

/* ---------- MATERIAL PARA COMPARTIR en los correos al vendedor ---------- */
const WEB_SITIO_URL = 'https://bx44.github.io/rifa-or-barak/';

function webLinkVendedor_(codigo) {
  return WEB_SITIO_URL + '?v=' + encodeURIComponent(codigo);
}

// Recibe el HTML ya armado de un correo al vendedor y le agrega al final el bloque
// con su link personal, su código, botón de WhatsApp y los 3 posters.
function webConCompartir_(html, correoVendedor) {
  try {
    const v = buscarVendedorPorCorreo_(String(correoVendedor || '').trim().toLowerCase());
    if (!v) return html;
    const codigo = webCodigoVendedor_(v.nombre, v.celular);
    const link = webLinkVendedor_(codigo);
    const textoWa = 'Un solo boleto. Dos ganadores. 🚗🚗\n' +
      'Participa en la ' + NOMBRE_RIFA + ': un Mazda 2 para el comprador y otro Mazda 2 para quien vende el boleto ganador. ' +
      'Sorteo 10 de diciembre.\n' + link;
    const wa = 'https://wa.me/?text=' + encodeURIComponent(textoWa);
    const poster = function (n, alt) {
      const src = WEB_SITIO_URL + 'assets/poster-' + n + '.jpg';
      return '<td style="padding:4px;width:33%" valign="top"><a href="' + src + '" target="_blank">' +
        '<img src="' + src + '" alt="' + alt + '" width="160" style="display:block;width:100%;max-width:160px;height:auto;border-radius:8px;border:1px solid #5a4526"></a>' +
        '<div style="font-size:11px;color:#a59c8f;text-align:center;padding-top:4px"><a href="' + src + '" target="_blank" style="color:#d2a45c">Descargar</a></div></td>';
    };
    const bloque =
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td align="center">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0f0c09;border:1px solid #5a4526;border-radius:14px;font-family:Helvetica,Arial,sans-serif;color:#ece6dc">' +
      '<tr><td style="padding:26px 22px 8px;text-align:center">' +
      '<div style="font-size:12px;letter-spacing:4px;color:#d2a45c">TU MATERIAL PARA COMPARTIR</div>' +
      '<div style="font-size:20px;margin:12px 0 4px;color:#ffffff">Un solo boleto. <span style="color:#d2a45c">Dos ganadores.</span></div>' +
      '<div style="font-size:14px;color:#a59c8f;margin-bottom:16px">Quien compre desde tu link queda registrado como venta tuya.</div>' +
      '<div style="font-size:13px;color:#a59c8f">Tu código: <b style="color:#f2d6a0;letter-spacing:2px">' + codigo + '</b></div>' +
      '<div style="margin:10px 0 18px;padding:12px;border:1px dashed #8a6a3a;border-radius:10px;font-size:14px;word-break:break-all"><a href="' + link + '" style="color:#f2d6a0;text-decoration:none">' + link + '</a></div>' +
      '<a href="' + wa + '" style="display:inline-block;background:#c4914a;color:#1a1209;text-decoration:none;padding:13px 24px;border-radius:30px;letter-spacing:1px;font-size:13px;font-weight:bold">COMPARTIR POR WHATSAPP</a>' +
      '</td></tr>' +
      '<tr><td style="padding:16px 14px 22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      poster(1, 'Un solo boleto, dos ganadores') + poster(2, 'Participa, comparte, gana') + poster(3, 'Bases') +
      '</tr></table>' +
      '<div style="font-size:12px;color:#a59c8f;text-align:center;padding-top:8px">Manda los posters junto con tu link por WhatsApp, Instagram o Facebook.</div>' +
      '</td></tr></table></td></tr></table>';
    const i = html.toLowerCase().lastIndexOf('</body>');
    return i === -1 ? html + bloque : html.slice(0, i) + bloque + html.slice(i);
  } catch (err) {
    try { registrarLog_('WEB', 'ERROR_BLOQUE_COMPARTIR', String(err)); } catch (e2) {}
    return html;
  }
}

/* ---------- EMBUDO DE LA PÁGINA: visitas → empezaron a llenar → apartaron → pagaron ----------
 * La página manda "visita" (1 por sesión) e "inicio" (cuando empiezan a llenar el formulario,
 * sin mandar ningún dato personal). "apartado" se registra al asignar folio.
 * Pestañas: WEB_EVENTOS (bitácora) y WEB_RESUMEN (se recalcula cada hora y con webActualizarResumen).
 */
const SH_WEB_EVENTOS = 'WEB_EVENTOS';
const SH_WEB_RESUMEN = 'WEB_RESUMEN';

function webHoja_(nombre, encabezados) {
  const ss = ss_();
  let h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    if (encabezados) {
      h.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold');
      h.setFrozenRows(1);
    }
  }
  return h;
}

function webRegistrarEvento_(evento, codigo, folio) {
  evento = String(evento || '').toLowerCase();
  if (['visita', 'inicio', 'apartado'].indexOf(evento) === -1) return { ok: false };
  const ahora = new Date();
  const dia = Utilities.formatDate(ahora, 'America/Mexico_City', 'yyyy-MM-dd');
  webHoja_(SH_WEB_EVENTOS, ['Fecha', 'Día', 'Evento', 'Código vendedor', 'Folio'])
    .appendRow([ahora, dia, evento, webLimpiarCodigo_(codigo) || '(directo)', folio || '']);
  return { ok: true };
}

function webActualizarResumen() {
  const ev = webHoja_(SH_WEB_EVENTOS, ['Fecha', 'Día', 'Evento', 'Código vendedor', 'Folio']).getDataRange().getValues();
  ev.shift();
  const saldoPorFolio = {};
  webBoletos_().forEach(function (r) { saldoPorFolio[Number(r[0])] = Number(r[5]); });
  const nombres = {};
  webVendedores_().forEach(function (v) { nombres[v.codigo] = v.nombre; });

  const porDia = {}, porVend = {};
  const vacio = function () { return { visita: 0, inicio: 0, apartado: 0, pagado: 0 }; };
  ev.forEach(function (r) {
    const dia = r[1] instanceof Date ? Utilities.formatDate(r[1], 'America/Mexico_City', 'yyyy-MM-dd') : String(r[1]);
    const e = String(r[2]), c = String(r[3] || '(directo)');
    porDia[dia] = porDia[dia] || vacio();
    porVend[c] = porVend[c] || vacio();
    if (porDia[dia][e] === undefined) return;
    porDia[dia][e]++; porVend[c][e]++;
    if (e === 'apartado' && r[4] !== '' && saldoPorFolio[Number(r[4])] === 0) { porDia[dia].pagado++; porVend[c].pagado++; }
  });
  const pct = function (a, b) { return b ? Math.round(100 * a / b) + '%' : '—'; };
  const filas = [['POR DÍA', 'Visitas', 'Empezaron a llenar', 'Apartaron folio', 'Pagaron', '% visita→pago']];
  Object.keys(porDia).sort().reverse().forEach(function (d) {
    const x = porDia[d]; filas.push([d, x.visita, x.inicio, x.apartado, x.pagado, pct(x.pagado, x.visita)]);
  });
  filas.push(['', '', '', '', '', '']);
  filas.push(['POR VENDEDOR (link)', 'Visitas', 'Empezaron a llenar', 'Apartaron folio', 'Pagaron', '% visita→pago']);
  Object.keys(porVend).sort(function (a, b) { return porVend[b].visita - porVend[a].visita; }).forEach(function (c) {
    const x = porVend[c];
    filas.push([c === '(directo)' ? 'Sin código (directo)' : c + ' — ' + (nombres[c] || '?'), x.visita, x.inicio, x.apartado, x.pagado, pct(x.pagado, x.visita)]);
  });
  const h = webHoja_(SH_WEB_RESUMEN);
  h.clear();
  h.getRange(1, 1, filas.length, 6).setValues(filas);
  h.getRange(1, 1, 1, 6).setFontWeight('bold');
  const iv = filas.findIndex(function (f) { return f[0] === 'POR VENDEDOR (link)'; });
  if (iv > 0) h.getRange(iv + 1, 1, 1, 6).setFontWeight('bold');
  h.getRange(filas.length + 2, 1).setValue('Actualizado: ' + Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm') + ' (se actualiza cada hora)');
  h.autoResizeColumns(1, 6);
}

/** Ejecutar UNA vez: crea las pestañas y el activador que actualiza WEB_RESUMEN cada hora. */
function webInstalarResumen() {
  webHoja_(SH_WEB_EVENTOS, ['Fecha', 'Día', 'Evento', 'Código vendedor', 'Folio']);
  ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'webActualizarResumen'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('webActualizarResumen').timeBased().everyHours(1).create();
  webActualizarResumen();
}


/** Prueba: manda SOLO a jonathan@ben-hamu.com el correo de bienvenida de vendedor con el bloque para compartir. */
function webPruebaCorreoVendedor() {
  enviarCorreoBienvenidaVendedor_('Jonathan Ben-Hamu', 'jonathan@ben-hamu.com');
}

/* ---------- MURO DE PARTICIPANTES (como en las páginas de donativos) ----------
 * Cada compra web guarda cómo quiere aparecer la persona y su dedicatoria en la pestaña WEB_MURO.
 * En la página solo aparecen los boletos YA PAGADOS (saldo 0) y con Visible = SI.
 * Para ocultar a alguien, cambia su "Visible" a NO.
 */
const SH_WEB_MURO = 'WEB_MURO';
const WEB_DEDICATORIAS = ['Leilui Nishmat', 'Refuá Shelemá', 'Hatzlajá', 'Zivug Hagún', 'En honor de', 'Otra'];

function webHojaMuro_() {
  return webHoja_(SH_WEB_MURO, ['Fecha', 'Folio', 'Cómo aparece', 'Nombre que se muestra', 'Dedicatoria', 'Texto de la dedicatoria', 'Comprador', 'Celular', 'Visible (SI/NO)']);
}

function webLimpiarTexto_(s, max) {
  return String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function webGuardarMuro_(d, folio, nombreComprador, cel) {
  try {
    let modo = String(d.modo || 'nombre');
    if (['nombre', 'anonimo', 'otro'].indexOf(modo) === -1) modo = 'nombre';
    let mostrado = nombreComprador;
    if (modo === 'anonimo') mostrado = 'Anónimo';
    if (modo === 'otro') mostrado = webLimpiarTexto_(d.aNombre, 60) || nombreComprador;
    let tipo = String(d.dedTipo || '');
    if (WEB_DEDICATORIAS.indexOf(tipo) === -1) tipo = '';
    const texto = tipo ? webLimpiarTexto_(d.dedTexto, 90) : '';
    const etiqueta = { nombre: 'Con su nombre', anonimo: 'Anónimo', otro: 'A nombre de otra persona' }[modo];
    webHojaMuro_().appendRow([new Date(), folio, etiqueta, mostrado, tipo, texto, nombreComprador, cel, 'SI']);
  } catch (err) {
    registrarLog_('WEB', 'ERROR_MURO', String(err));
  }
}

function webMuro_() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('web_muro');
  if (c) return JSON.parse(c);
  const saldo = {};
  webBoletos_().forEach(function (r) { saldo[Number(r[0])] = Number(r[5]); });
  const data = webHojaMuro_().getDataRange().getValues();
  data.shift();
  const items = data
    .filter(function (r) { return r[1] !== '' && String(r[8]).toUpperCase() !== 'NO' && saldo[Number(r[1])] === 0; })
    .map(function (r) {
      return { t: r[0] instanceof Date ? r[0].getTime() : new Date(r[0]).getTime(), nombre: String(r[3]), dedTipo: String(r[4] || ''), dedTexto: String(r[5] || ''), anon: String(r[2]) === 'Anónimo' };
    })
    .sort(function (a, b) { return b.t - a.t; });
  const out = { ok: true, total: items.length, items: items.slice(0, 60) };
  cache.put('web_muro', JSON.stringify(out), 60);
  return out;
}

/* ---------- MURO también para ventas por el Form "Vender boleto" ---------- */
// Lo llama ventaDesdeFormulario_ (Código.gs) justo después de asignar el folio.
function webGuardarMuroDesdeForm_(nv, folio, nombreComprador, celComprador) {
  const a = respuestaFormulario_(nv, 'aparecer en el muro');
  const modo = /an[oó]nimo/i.test(a) ? 'anonimo' : (/otra persona/i.test(a) ? 'otro' : 'nombre');
  let tipo = respuestaFormulario_(nv, 'tipo de dedicatoria');
  if (/^sin dedicatoria$/i.test(tipo)) tipo = '';
  webGuardarMuro_({
    modo: modo,
    aNombre: respuestaFormulario_(nv, 'nombre para el muro'),
    dedTipo: tipo,
    dedTexto: respuestaFormulario_(nv, 'texto de la dedicatoria')
  }, folio, nombreComprador, normalizarTelefono_(celComprador));
}

/** Ejecutar UNA vez: agrega al Form "Vender boleto" las preguntas del muro y la dedicatoria. */
const WEB_FORM_VENDER_ID = '1ZSDR8nPzsJqtI7WkqEsFvIiqdlgENacxWdGEHh-Egcc'; // Form "Venta Boleto Rifa 2026"

function webAgregarPreguntasMuroAlForm() {
  let form = null;
  try { form = FormApp.openById(WEB_FORM_VENDER_ID); } catch (err) { Logger.log('openById: ' + err); }
  ss_().getSheets().forEach(function (sh) {
    if (form) return;
    const u = sh.getFormUrl();
    if (!u) return;
    try {
      const f = FormApp.openByUrl(u);
      if (f.getItems().some(function (it) { return /celular del comprador/i.test(it.getTitle()); })) form = f;
    } catch (err) {}
  });
  if (!form) throw new Error('No encontré el Form "Vender boleto" ligado a esta hoja.');
  if (form.getItems().some(function (it) { return /aparecer en el muro/i.test(it.getTitle()); })) {
    Logger.log('Las preguntas ya existían en: ' + form.getTitle());
    return;
  }
  form.addMultipleChoiceItem()
    .setTitle('¿Cómo quiere aparecer el comprador en el muro de la página?')
    .setHelpText('El muro de participantes de la página muestra a quienes ya pagaron su boleto.')
    .setChoiceValues(['Con su nombre', 'Anónimo', 'A nombre de otra persona'])
    .setRequired(true);
  form.addTextItem()
    .setTitle('Nombre para el muro (solo si es a nombre de otra persona)')
    .setRequired(false);
  form.addListItem()
    .setTitle('Tipo de dedicatoria (opcional)')
    .setChoiceValues(['Sin dedicatoria'].concat(WEB_DEDICATORIAS))
    .setRequired(false);
  form.addTextItem()
    .setTitle('Texto de la dedicatoria (ej. Moshe ben Sara)')
    .setRequired(false);
  Logger.log('Listo: preguntas agregadas a "' + form.getTitle() + '"');
}
