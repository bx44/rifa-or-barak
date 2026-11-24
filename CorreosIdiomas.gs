

/* =====================================================================
 * CORREOS EN INGLÉS Y HEBREO (escritos a mano, no traducción automática)
 * Se usan cuando la columna Idioma de COMPRADORES dice "en" o "he"
 * (o el correo termina en .il / el nombre está en hebreo).
 * ===================================================================== */

const I18N_CORREO = {
  he: {
    dir: 'rtl',
    rifa: 'ההגרלה הגדולה של אור ברק 2026',
    org: 'אור ברק',
    hola: function (n) { return 'שלום ' + n + ','; },
    asuntoCompra: function (varios, f) { return 'ההגרלה הגדולה של אור ברק 2026 — ' + (varios ? 'הכרטיסים שלך מס\' ' : 'הכרטיס שלך מס\' ') + f; },
    tituloCompra: function (varios, n) { return varios ? n + ' הכרטיסים שלך נרשמו!' : 'הכרטיס שלך נרשם!'; },
    etiquetaFolio: function (varios) { return varios ? 'מספרי הכרטיסים' : 'מספר הכרטיס'; },
    vendidoPor: function (v) { return 'נמכר על ידי ' + v; },
    precio: 'מחיר לכרטיס',
    total: 'סה"כ',
    sorteo: 'ההגרלה',
    fechaSorteo: '10 בדצמבר 2026, 20:00 (שעון מקסיקו)',
    premios: 'שתי מכוניות מאזדה 2: אחת למי שקנה את הכרטיס הזוכה, ואחת למי שמכר אותו.',
    importante: 'חשוב לדעת',
    imp1: function (v) { return 'אם הכרטיס שלך יזכה, גם ' + v + ', שמכר לך אותו, יזכה במאזדה 2.'; },
    imp2: 'כדי לזכות, הכרטיס צריך להיות משולם במלואו לפני ההגרלה.',
    imp3: 'אם יעלה בהגרלה כרטיס שעדיין יש עליו יתרה לתשלום, הוא יבוטל ותתבצע הגרלה חוזרת.',
    comoPagar: 'איך משלמים',
    conTarjeta: 'בכרטיס אשראי (מאובטח, דרך Stripe):',
    botonPagar: function (f) { return 'לתשלום כרטיס מס\' ' + f; },
    conTransfer: 'בהעברה בנקאית במקסיקו:',
    cuenta: 'שם החשבון', banco: 'בנק', clabe: 'CLABE',
    comprobante: function (c) { return 'אחרי ההעברה שלחו את האישור ל-' + c + ', ותקבלו מייל כשהתשלום יירשם.'; },
    vendedorTitulo: 'רוצה לעזור עוד?',
    vendedorTexto: 'אפשר להיות גם מוכר. כל כרטיס שתמכור עוזר לנערים של אור ברק, ואם כרטיס שמכרת יזכה, גם אתה זוכה במאזדה 2.',
    vendedorBoton: 'לכתוב לנו בוואטסאפ',
    vendedorWa: function (n) { return 'שלום, כאן ' + n + ', אני רוצה להצטרף כמוכר בהגרלה הגדולה של אור ברק 2026.'; },
    gracias: 'תודה שאתה חלק מזה.',
    compartirTitulo: 'כרטיס אחד. <span style="color:#d2a45c">שני זוכים.</span>',
    compartirTexto: 'שתפו את ההגרלה עם המשפחה והחברים.',
    compartirBoton: 'לשתף בוואטסאפ',
    compartirWa: 'כרטיס אחד, שני זוכים 🚗🚗\nקניתי כרטיס להגרלה הגדולה של אור ברק 2026: מאזדה 2 למי שקונה את הכרטיס הזוכה, ועוד אחת למי שמכר אותו. ההגרלה ב-10 בדצמבר.\n',
    asuntoPago: function (f) { return 'ההגרלה הגדולה של אור ברק 2026 — התשלום נרשם (כרטיס מס\' ' + f + ')'; },
    tituloPago: 'התשלום שלך נרשם',
    pagoRecibido: function (m, met, f) { return 'קיבלנו תשלום של ' + m + (met ? ' (' + met + ')' : '') + ' עבור כרטיס מס\' ' + f + '.'; },
    referencia: 'אסמכתא',
    pagado: 'שולם עד עכשיו', de: 'מתוך', saldo: 'יתרה לתשלום',
    liquidado: 'הכרטיס שלך משולם במלואו. אתה משתתף בהגרלה ב-10 בדצמבר 2026, 20:00 (שעון מקסיקו). בהצלחה!',
    faltaPagar: 'אפשר להשלים את התשלום בכרטיס אשראי:',
    botonSaldo: 'לתשלום היתרה',
    recordatorio: 'כדי לזכות, הכרטיס צריך להיות משולם במלואו לפני ההגרלה ב-10 בדצמבר.',
    metodos: { 'transferencia': 'העברה בנקאית', 'efectivo': 'מזומן', 'stripe': 'כרטיס אשראי', 'tarjeta': 'כרטיס אשראי', 'cobranza': 'אור ברק' }
  },
  en: {
    dir: 'ltr',
    rifa: 'Or Barak Grand Raffle 2026',
    org: 'Or Barak',
    hola: function (n) { return 'Hi ' + n + ','; },
    asuntoCompra: function (varios, f) { return 'Or Barak Grand Raffle 2026 — your ' + (varios ? 'tickets #' : 'ticket #') + f; },
    tituloCompra: function (varios, n) { return varios ? 'Your ' + n + ' tickets are registered!' : 'Your ticket is registered!'; },
    etiquetaFolio: function (varios) { return varios ? 'Your ticket numbers' : 'Your ticket number'; },
    vendidoPor: function (v) { return 'Sold by ' + v; },
    precio: 'Price per ticket',
    total: 'Total',
    sorteo: 'Drawing',
    fechaSorteo: 'December 10, 2026, 8:00 pm (Mexico City time)',
    premios: 'Two Mazda 2 cars: one for whoever bought the winning ticket, and one for whoever sold it.',
    importante: 'Good to know',
    imp1: function (v) { return 'If your ticket wins, ' + v + ', who sold it to you, also wins a Mazda 2.'; },
    imp2: 'To win, a ticket must be paid in full before the drawing.',
    imp3: 'If a ticket with an unpaid balance is drawn, it is voided and another ticket is drawn instead.',
    comoPagar: 'How to pay',
    conTarjeta: 'By card (secure, through Stripe):',
    botonPagar: function (f) { return 'Pay ticket #' + f; },
    conTransfer: 'By bank transfer in Mexico:',
    cuenta: 'Account name', banco: 'Bank', clabe: 'CLABE',
    comprobante: function (c) { return 'After the transfer, send the receipt to ' + c + '. You will get an email once the payment is recorded.'; },
    vendedorTitulo: 'Want to help even more?',
    vendedorTexto: 'You can also become a seller. Every ticket you sell helps the boys at Or Barak, and if a ticket you sold wins, you win a Mazda 2 too.',
    vendedorBoton: 'Message us on WhatsApp',
    vendedorWa: function (n) { return 'Hi, this is ' + n + '. I would like to become a seller for the Or Barak Grand Raffle 2026.'; },
    gracias: 'Thank you for being part of this.',
    compartirTitulo: 'One ticket. <span style="color:#d2a45c">Two winners.</span>',
    compartirTexto: 'Share the raffle with your family and friends.',
    compartirBoton: 'Share on WhatsApp',
    compartirWa: 'One ticket, two winners 🚗🚗\nI got my ticket for the Or Barak Grand Raffle 2026: a Mazda 2 for the buyer and another one for whoever sold the winning ticket. Drawing on December 10.\n',
    asuntoPago: function (f) { return 'Or Barak Grand Raffle 2026 — payment received (ticket #' + f + ')'; },
    tituloPago: 'Your payment is recorded',
    pagoRecibido: function (m, met, f) { return 'We received a payment of ' + m + (met ? ' (' + met + ')' : '') + ' for ticket #' + f + '.'; },
    referencia: 'Reference',
    pagado: 'Paid so far', de: 'of', saldo: 'Balance due',
    liquidado: 'Your ticket is paid in full. You are in the drawing on December 10, 2026, 8:00 pm (Mexico City time). Good luck!',
    faltaPagar: 'You can pay the rest by card:',
    botonSaldo: 'Pay the balance',
    recordatorio: 'To win, the ticket must be paid in full before the drawing on December 10.',
    metodos: { 'transferencia': 'bank transfer', 'efectivo': 'cash', 'stripe': 'card', 'tarjeta': 'card', 'cobranza': 'Or Barak' }
  }
};

function i18nEsc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function i18nMxn_(n) {
  return '$' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' MXN';
}

// Texto que siempre va de izquierda a derecha (montos, CLABE, correos) dentro de un correo en hebreo.
function i18nLtr_(s) {
  return '<span dir="ltr" style="unicode-bidi:embed">' + i18nEsc_(s) + '</span>';
}

function i18nBoton_(href, texto) {
  return '<a href="' + i18nEsc_(href) + '" style="display:inline-block;background:#1F3864;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:bold;font-size:13px;margin:4px 0">' + i18nEsc_(texto) + '</a>';
}

function i18nMarco_(L, titulo, cuerpo) {
  const al = L.dir === 'rtl' ? 'right' : 'left';
  return '<div dir="' + L.dir + '" style="max-width:520px;width:100%;box-sizing:border-box;margin:0 auto;font-family:Arial,sans-serif;text-align:' + al + ';direction:' + L.dir + '">' +
    '<div style="background:#1F3864;color:#fff;padding:16px;border-radius:10px 10px 0 0;text-align:center">' +
    '<h2 style="margin:0;font-size:16px">' + i18nEsc_(L.rifa) + '</h2>' +
    '<p style="margin:4px 0 0;font-size:13px;color:#cbd5e1">' + i18nEsc_(titulo) + '</p></div>' +
    '<div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:20px 16px;box-sizing:border-box;font-size:14px;line-height:1.55;color:#1a1a1a">' +
    cuerpo +
    '<p style="margin:22px 0 0">' + i18nEsc_(L.gracias) + '<br><b>' + i18nEsc_(L.org) + '</b></p>' +
    '</div></div>';
}

function i18nCompartir_(L, idioma) {
  const url = WEB_SITIO_URL + '?lang=' + idioma;
  const wa = 'https://wa.me/?text=' + encodeURIComponent(L.compartirWa + url);
  return '<div dir="' + L.dir + '" style="max-width:520px;margin:22px auto 0;background:#0f0c09;border:1px solid #5a4526;border-radius:14px;font-family:Helvetica,Arial,sans-serif;color:#ece6dc;text-align:center;padding:24px 20px;box-sizing:border-box">' +
    '<div style="font-size:12px;letter-spacing:3px;color:#d2a45c">' + i18nEsc_(L.rifa) + '</div>' +
    '<div style="font-size:20px;margin:12px 0 6px;color:#ffffff">' + L.compartirTitulo + '</div>' +
    '<div style="font-size:14px;color:#a59c8f;margin-bottom:14px">' + i18nEsc_(L.compartirTexto) + '</div>' +
    '<a href="' + i18nEsc_(wa) + '" style="display:inline-block;background:#c4914a;color:#1a1209;text-decoration:none;padding:12px 20px;border-radius:30px;font-size:12px;font-weight:bold;letter-spacing:1px">' + i18nEsc_(L.compartirBoton) + '</a>' +
    '</div>';
}

function correoCompradorIdioma_(idioma, correo, nombre, folios, nombreVendedor) {
  const L = I18N_CORREO[idioma];
  if (!Array.isArray(folios)) folios = [folios];
  const varios = folios.length > 1;
  const fTxt = folios.join(', ');
  const pagos = folios.map(function (f) { return { folio: f, url: urlPagoBoleto_(f) }; });
  const waVend = 'https://wa.me/' + WHATSAPP_ADMIN + '?text=' + encodeURIComponent(L.vendedorWa(nombre));
  const caja = 'background:#F5F6F8;border-radius:10px;padding:14px 16px;margin:14px 0';

  let c = '<p style="margin:0 0 14px">' + i18nEsc_(L.hola(nombre)) + '</p>' +
    '<div style="background:#F5F6F8;border:2px solid #C9A34E;border-radius:10px;padding:16px;text-align:center">' +
    '<div style="font-size:11px;color:#6B7280;letter-spacing:1px">' + i18nEsc_(L.etiquetaFolio(varios)) + '</div>' +
    '<div style="font-size:30px;font-weight:bold;color:#1F3864;margin:6px 0">' + i18nLtr_(fTxt) + '</div>' +
    '<div style="font-size:13px;color:#374151">' + i18nEsc_(L.vendidoPor(nombreVendedor)) + '</div></div>' +
    '<p style="margin:14px 0 4px"><b>' + i18nEsc_(L.precio) + ':</b> ' + i18nLtr_(i18nMxn_(PRECIO_BOLETO)) +
    (varios ? ' &nbsp;·&nbsp; <b>' + i18nEsc_(L.total) + ':</b> ' + i18nLtr_(i18nMxn_(PRECIO_BOLETO * folios.length)) : '') + '</p>' +
    '<p style="margin:0 0 4px"><b>' + i18nEsc_(L.sorteo) + ':</b> ' + i18nEsc_(L.fechaSorteo) + '</p>' +
    '<p style="margin:0 0 14px">' + i18nEsc_(L.premios) + '</p>' +
    '<div style="' + caja + '"><b>' + i18nEsc_(L.importante) + '</b><ul style="margin:8px 0 0;padding-' + (L.dir === 'rtl' ? 'right' : 'left') + ':18px">' +
    '<li>' + i18nEsc_(L.imp1(nombreVendedor)) + '</li><li>' + i18nEsc_(L.imp2) + '</li><li>' + i18nEsc_(L.imp3) + '</li></ul></div>' +
    '<h3 style="font-size:15px;color:#1F3864;margin:20px 0 8px">' + i18nEsc_(L.comoPagar) + '</h3>' +
    '<p style="margin:0 0 6px">' + i18nEsc_(L.conTarjeta) + '</p>' +
    pagos.map(function (p) { return '<div>' + i18nBoton_(p.url, L.botonPagar(p.folio)) + '</div>'; }).join('') +
    '<p style="margin:14px 0 6px">' + i18nEsc_(L.conTransfer) + '</p>' +
    '<div style="' + caja + ';margin-top:0">' +
    i18nEsc_(L.cuenta) + ': ' + i18nLtr_(RAZON_SOCIAL) + '<br>' +
    i18nEsc_(L.banco) + ': ' + i18nLtr_(BANCO) + '<br>' +
    i18nEsc_(L.clabe) + ': <b>' + i18nLtr_(CLABE) + '</b></div>' +
    '<p style="margin:0 0 14px;font-size:13px;color:#374151">' + i18nEsc_(L.comprobante(CORREO_COMPROBANTES)) + '</p>' +
    '<div style="' + caja + ';border:1px dashed #C9A34E"><b>' + i18nEsc_(L.vendedorTitulo) + '</b><p style="margin:6px 0 10px">' + i18nEsc_(L.vendedorTexto) + '</p>' +
    i18nBoton_(waVend, L.vendedorBoton) + '</div>';

  const html = i18nMarco_(L, L.tituloCompra(varios, folios.length), c) + i18nCompartir_(L, idioma);

  const texto = L.hola(nombre) + '\n\n' + L.tituloCompra(varios, folios.length) + '\n' +
    L.etiquetaFolio(varios) + ': ' + fTxt + '\n' + L.vendidoPor(nombreVendedor) + '\n' +
    L.precio + ': ' + i18nMxn_(PRECIO_BOLETO) + '\n' + L.sorteo + ': ' + L.fechaSorteo + '\n\n' +
    L.importante + ':\n- ' + L.imp1(nombreVendedor) + '\n- ' + L.imp2 + '\n- ' + L.imp3 + '\n\n' +
    L.comoPagar + ':\n' + L.conTarjeta + '\n' + pagos.map(function (p) { return '  #' + p.folio + ': ' + p.url; }).join('\n') + '\n' +
    L.conTransfer + '\n' + L.cuenta + ': ' + RAZON_SOCIAL + '\n' + L.banco + ': ' + BANCO + '\n' + L.clabe + ': ' + CLABE + '\n' +
    L.comprobante(CORREO_COMPROBANTES) + '\n\n' + L.vendedorTitulo + ' ' + L.vendedorTexto + '\n' + waVend + '\n\n' + L.gracias + '\n' + L.org;

  enviarCorreo_(correo, L.asuntoCompra(varios, fTxt), texto, html, true);
}

function correoPagoIdioma_(idioma, comprador, boleto, monto, metodo, referencia) {
  const L = I18N_CORREO[idioma];
  const met = L.metodos[String(metodo || '').trim().toLowerCase()] || String(metodo || '');
  const saldo = Number(boleto.saldo) || 0;
  const caja = 'background:#F5F6F8;border-radius:10px;padding:14px 16px;margin:14px 0';

  let c = '<p style="margin:0 0 12px">' + i18nEsc_(L.hola(comprador.nombre)) + '</p>' +
    '<p style="margin:0 0 6px">' + i18nEsc_(L.pagoRecibido('§M§', met, '§F§')).replace('§M§', i18nLtr_(i18nMxn_(monto))).replace('§F§', i18nLtr_(boleto.folio)) + '</p>' +
    (referencia ? '<p style="margin:0 0 6px;font-size:12px;color:#6B7280">' + i18nEsc_(L.referencia) + ': ' + i18nLtr_(referencia) + '</p>' : '') +
    '<div style="' + caja + '">' +
    '<b>' + i18nEsc_(L.pagado) + ':</b> ' + i18nLtr_(i18nMxn_(boleto.pagado)) + ' ' + i18nEsc_(L.de) + ' ' + i18nLtr_(i18nMxn_(boleto.precio)) + '<br>' +
    '<b>' + i18nEsc_(L.saldo) + ':</b> ' + i18nLtr_(i18nMxn_(saldo)) + '</div>' +
    (saldo > 0
      ? '<p style="margin:0 0 6px">' + i18nEsc_(L.faltaPagar) + '</p>' + i18nBoton_(urlPagoBoleto_(boleto.folio), L.botonSaldo) +
        '<p style="margin:14px 0 0;font-size:13px;color:#374151">' + i18nEsc_(L.recordatorio) + '</p>'
      : '<p style="margin:0;font-weight:bold;color:#166534">' + i18nEsc_(L.liquidado) + '</p>');

  const html = i18nMarco_(L, L.tituloPago, c) + i18nCompartir_(L, idioma);
  const texto = L.hola(comprador.nombre) + '\n\n' + L.pagoRecibido(i18nMxn_(monto), met, boleto.folio) + '\n' +
    (referencia ? L.referencia + ': ' + referencia + '\n' : '') +
    L.pagado + ': ' + i18nMxn_(boleto.pagado) + ' ' + L.de + ' ' + i18nMxn_(boleto.precio) + '\n' +
    L.saldo + ': ' + i18nMxn_(saldo) + '\n\n' +
    (saldo > 0 ? L.faltaPagar + ' ' + urlPagoBoleto_(boleto.folio) + '\n' + L.recordatorio : L.liquidado) + '\n\n' + L.gracias + '\n' + L.org;

  enviarCorreo_(comprador.correo, L.asuntoPago(boleto.folio), texto, html, true);
}

/** Prueba: te manda a ti los dos correos (compra y pago) en hebreo y en inglés. */
function pruebaCorreosIdiomas() {
  const yo = 'jonathan@ben-hamu.com';
  ['he', 'en'].forEach(function (idi) {
    correoCompradorIdioma_(idi, yo, idi === 'he' ? 'אבינועם' : 'Joshua', [44], 'Jonathan Ben-Hamu');
    correoPagoIdioma_(idi, { nombre: idi === 'he' ? 'אבינועם' : 'Joshua', correo: yo },
      { folio: 44, pagado: 3000, precio: 6000, saldo: 3000 }, 3000, 'Transferencia', '');
  });
}
