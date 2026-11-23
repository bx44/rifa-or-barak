/* ============================================================
 *  INVITACIÓN A LA GRAN RIFA OR BARAK 2026 — correo masivo
 * ============================================================
 *  Sale desde contacto@orbarakmx.com (alias "Enviar como" de Gmail).
 *  Español por default; inglés o hebreo según el país / correo / teléfono.
 *
 *  CÓMO SE USA (en este orden):
 *   1. invitacionPrepararLista  → crea/actualiza la hoja "Invitación Rifa 2026"
 *                                 con todos los correos de "Contactos", el idioma
 *                                 de cada uno y quién ya está en la rifa.
 *                                 Puedes cambiar a mano la columna Idioma (es/en/he)
 *                                 o escribir NO en "Enviar" para saltarte a alguien.
 *   2. invitacionPrueba         → te manda las 3 versiones (es, en, he) a ti.
 *   3. invitacionIniciarEnvio   → manda en bloques cada 10 minutos hasta terminar
 *                                 (se detiene solo). Para pararlo: invitacionDetener.
 *  Se puede volver a correr sin riesgo: a quien ya tiene "OK" no se le manda otra vez.
 * ============================================================ */

const INV = {
  HOJA: 'Invitación Rifa 2026',
  HOJAS_CONTACTOS: ['Contactos extranjeros', 'Contactos'], // la primera manda en país/idioma
  DE: 'contacto@orbarakmx.com',
  NOMBRE_REMITENTE: 'Or Barak',
  RESPONDER_A: 'contacto@orbarakmx.com',
  SITIO: 'https://rifa.orbarakmx.com/',
  WHATSAPP: '526572871690',
  RIFA_SHEET_ID: '1UKBkEhol-I4guu4ySuKRfulCOP707c0FykgcjM4XKqs', // para no invitar a quien ya compró
  CORREO_PRUEBA: 'jonathan@ben-hamu.com',
  POR_BLOQUE: 60,          // correos por corrida (cada 10 min)
  PAUSA_MS: 1500,
  EXCLUIR_NOMBRES: ['yoel perets'] // nunca invitar (comparado contra nombre + apellido)
};

// Columnas de la hoja de envío
const INV_COLS = ['Email', 'Nombre', 'Idioma', 'Enviar', 'Enviado', 'Notas'];

/* ---------------------------- 1. Lista ---------------------------- */

function invitacionPrepararLista() {
  const ss = SpreadsheetApp.getActive();
  // Contactos de todas las hojas fuente. La primera hoja manda: si un correo
  // está en "Contactos extranjeros" se usa su país (y por lo tanto su idioma).
  const contactos = [];
  INV.HOJAS_CONTACTOS.forEach(function (nombreHoja) {
    const src = ss.getSheetByName(nombreHoja);
    if (!src || src.getLastRow() < 2) return;
    const datos = src.getDataRange().getValues();
    const enc = datos[0].map(function (h) { return String(h).trim().toLowerCase(); });
    const col = function (nombres) {
      for (let i = 0; i < nombres.length; i++) { const k = enc.indexOf(nombres[i]); if (k >= 0) return k; }
      return -1;
    };
    const cE = col(['email', 'correo']), cN = col(['nombre']), cA = col(['apellido']),
          cT = col(['tel', 'telefono', 'teléfono', 'celular']), cT2 = col(['tel2']), cP = col(['país', 'pais', 'country']);
    if (cE < 0) return;
    for (let i = 1; i < datos.length; i++) {
      const r = datos[i];
      contactos.push({
        email: String(r[cE] || '').trim().toLowerCase(),
        nombre: cN >= 0 ? String(r[cN] || '').trim() : '',
        apellido: cA >= 0 ? String(r[cA] || '').trim() : '',
        tel: (cT >= 0 ? String(r[cT] || '') : '') || (cT2 >= 0 ? String(r[cT2] || '') : ''),
        pais: cP >= 0 ? r[cP] : ''
      });
    }
  });

  // Lo que ya existe en la hoja de envío se respeta (Idioma, Enviar, Enviado, Notas)
  let sh = ss.getSheetByName(INV.HOJA);
  const previo = {};
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, INV_COLS.length).getValues().forEach(function (r) {
      const k = String(r[0]).trim().toLowerCase();
      if (k) previo[k] = r;
    });
  } else if (!sh) {
    sh = ss.insertSheet(INV.HOJA);
  }

  const yaEnRifa = invCorreosEnRifa_();
  const vistos = {};
  const filas = [];
  const cuenta = { es: 0, en: 0, he: 0, rifa: 0, excluidos: 0 };

  contactos.forEach(function (c) {
    const email = c.email;
    if (!invCorreoValido_(email) || vistos[email]) return;
    vistos[email] = true;
    const p = previo[email];

    const idioma = p && /^(es|en|he)$/.test(String(p[2]).trim()) ? String(p[2]).trim() : invIdioma_(email, c.pais, c.tel);
    let enviar = p ? String(p[3]).trim() : 'SI';
    const enviado = p ? p[4] : '';
    let notas = p ? String(p[5] || '') : '';

    const completo = (c.nombre + ' ' + c.apellido).toLowerCase();
    if (INV.EXCLUIR_NOMBRES.some(function (x) { return completo.indexOf(x) >= 0; })) {
      enviar = 'NO'; notas = 'Excluido'; cuenta.excluidos++;
    } else if (yaEnRifa[email] && !enviado) {
      enviar = 'NO'; notas = 'Ya está en la rifa'; cuenta.rifa++;
    }
    if (enviar === 'SI' && !enviado) cuenta[idioma]++;
    filas.push([email, c.nombre, idioma, enviar || 'SI', enviado, notas]);
  });

  sh.clearContents();
  sh.getRange(1, 1, 1, INV_COLS.length).setValues([INV_COLS]).setFontWeight('bold');
  if (filas.length) sh.getRange(2, 1, filas.length, INV_COLS.length).setValues(filas);
  sh.setFrozenRows(1);
  const reglaIdioma = SpreadsheetApp.newDataValidation().requireValueInList(['es', 'en', 'he'], true).build();
  const reglaEnviar = SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build();
  if (filas.length) {
    sh.getRange(2, 3, filas.length, 1).setDataValidation(reglaIdioma);
    sh.getRange(2, 4, filas.length, 1).setDataValidation(reglaEnviar);
  }
  sh.autoResizeColumns(1, INV_COLS.length);

  const msg = filas.length + ' correos en la lista. Por enviar: ' + cuenta.es + ' en español, ' + cuenta.en +
    ' en inglés, ' + cuenta.he + ' en hebreo. Omitidos: ' + cuenta.rifa + ' que ya están en la rifa, ' + cuenta.excluidos + ' excluidos.';
  Logger.log(msg);
  try { SpreadsheetApp.getActive().toast(msg, 'Invitación rifa', 10); } catch (e) {}
  return msg;
}

/* ---------------------------- 2. Prueba ---------------------------- */

function invitacionPrueba() {
  invRevisarAlias_();
  ['es', 'en', 'he'].forEach(function (l) {
    const t = invTemplate_(l, 'Jonathan');
    invEnviar_(INV.CORREO_PRUEBA, '[PRUEBA ' + l.toUpperCase() + '] ' + t.asunto, t);
  });
  Logger.log('Se mandaron las 3 pruebas a ' + INV.CORREO_PRUEBA + ' desde ' + INV.DE);
}

/* ---------------------------- 3. Envío ---------------------------- */

function invitacionIniciarEnvio() {
  invRevisarAlias_();
  invitacionDetener();
  ScriptApp.newTrigger('invitacionEnviarBloque').timeBased().everyMinutes(10).create();
  invitacionEnviarBloque();
}

function invitacionDetener() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'invitacionEnviarBloque') ScriptApp.deleteTrigger(t);
  });
}

function invitacionEnviarBloque() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(INV.HOJA);
    if (!sh || sh.getLastRow() < 2) { Logger.log('Primero corre invitacionPrepararLista'); invitacionDetener(); return; }
    const n = sh.getLastRow() - 1;
    const data = sh.getRange(2, 1, n, INV_COLS.length).getValues();
    const yaEnRifa = invCorreosEnRifa_();
    const cupo = Math.min(INV.POR_BLOQUE, MailApp.getRemainingDailyQuota() - 5);
    if (cupo <= 0) { Logger.log('Se acabó la cuota diaria de Gmail; sigue mañana automáticamente.'); return; }

    let enviados = 0, pendientes = 0;
    const inicio = Date.now();
    for (let i = 0; i < n; i++) {
      const email = String(data[i][0]).trim();
      const enviar = String(data[i][3]).trim().toUpperCase();
      if (!email || enviar === 'NO' || data[i][4]) continue;
      if (yaEnRifa[email.toLowerCase()]) {
        sh.getRange(i + 2, 4, 1, 3).setValues([['NO', '', 'Ya está en la rifa']]);
        continue;
      }
      if (enviados >= cupo || Date.now() - inicio > 4.5 * 60 * 1000) { pendientes++; continue; }
      const idioma = /^(es|en|he)$/.test(String(data[i][2]).trim()) ? String(data[i][2]).trim() : 'es';
      try {
        const t = invTemplate_(idioma, data[i][1]);
        invEnviar_(email, t.asunto, t);
        sh.getRange(i + 2, 5).setValue('OK ' + Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm'));
        enviados++;
      } catch (err) {
        sh.getRange(i + 2, 5, 1, 2).setValues([['ERROR', String(err && err.message || err).slice(0, 200)]]);
      }
      Utilities.sleep(INV.PAUSA_MS);
    }
    Logger.log('Enviados en este bloque: ' + enviados + ' · pendientes: ' + pendientes);
    if (pendientes === 0) {
      invitacionDetener();
      Logger.log('Terminado: ya no quedan correos por enviar.');
    }
  } finally {
    lock.releaseLock();
  }
}

/* ---------------------------- Utilidades ---------------------------- */

function invRevisarAlias_() {
  const alias = GmailApp.getAliases().map(function (a) { return a.toLowerCase(); });
  if (alias.indexOf(INV.DE.toLowerCase()) < 0) {
    throw new Error('Esta cuenta (' + Session.getEffectiveUser().getEmail() + ') no tiene ' + INV.DE +
      ' como alias "Enviar como" en Gmail. Alias disponibles: ' + (alias.join(', ') || 'ninguno'));
  }
}

function invEnviar_(to, asunto, t) {
  GmailApp.sendEmail(to, asunto, t.texto, {
    from: INV.DE,
    name: INV.NOMBRE_REMITENTE,
    replyTo: INV.RESPONDER_A,
    htmlBody: t.html
  });
}

function invCorreoValido_(s) {
  return /^[^\s@,;<>]+@[^\s@,;<>]+\.[a-z]{2,}$/i.test(s);
}

function invCorreosEnRifa_() {
  const out = {};
  try {
    const sh = SpreadsheetApp.openById(INV.RIFA_SHEET_ID).getSheetByName('COMPRADORES');
    sh.getRange(2, 3, Math.max(sh.getLastRow() - 1, 1), 1).getValues().forEach(function (r) {
      const e = String(r[0]).trim().toLowerCase();
      if (e) out[e] = true;
    });
  } catch (e) {
    Logger.log('No pude leer COMPRADORES de la rifa: ' + e.message);
  }
  return out;
}

function invIdioma_(email, pais, tel) {
  const p = String(pais || '').trim().toLowerCase();
  if (/^(il|isr|israel|israël|ישראל)$/.test(p)) return 'he';
  if (/^(us|usa|eua|eeuu|ee\.?uu\.?|estados unidos|united states|ca|can|canada|canadá|gb|uk|reino unido|united kingdom|england|inglaterra|au|australia|ie|irlanda|ireland|nz|nueva zelanda|new zealand|za|sudáfrica|south africa)$/.test(p)) return 'en';
  if (p) return 'es';
  const e = String(email || '').toLowerCase();
  if (/\.il$/.test(e)) return 'he';
  if (/\.(uk|ca|au|ie|nz|za)$/.test(e)) return 'en';
  const t = String(tel || '').replace(/\D/g, '');
  if (/^972\d{8,9}$/.test(t)) return 'he';
  if (/^1\d{10}$/.test(t)) return 'en';
  return 'es';
}

function invNombreSaludo_(nombre) {
  let w = String(nombre || '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  // Quita títulos; sin nombre usable → saludo genérico
  while (w.length && /^(rab|rabbi|rav|sr|sra|dr|mr|mrs|ms)\.?$/i.test(w[0])) w.shift();
  if (!w.length || /@|\d/.test(w.join(' ')) || /^(familia|family|mishpajat|flia)$/i.test(w[0]) ||
      /\b(inc|llc|ltd|sa|corp)\b/i.test(w.join(' ')) || w[0].length < 2) return '';
  let partes = [w[0]];
  if (w.length >= 3 && /^(y|and|&|e)$/i.test(w[1])) partes = [w[0], w[1].toLowerCase(), w[2]];  // "Aaron y Linda"
  return partes.map(function (x) {
    return /^(y|and|&|e)$/.test(x) ? x : x.toLowerCase().replace(/(^|-)([a-záéíóúñü])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }).join(' ');
}

function invEsc_(s) {
  return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

/* ---------------------------- Plantilla ---------------------------- */

const INV_TXT = {
  es: {
    asunto: 'Un boleto, dos Mazda 2 · Gran Rifa Or Barak 2026',
    pre: 'Sorteo el 10 de diciembre. Boleto de $6,000 MXN, puedes pagar a meses.',
    eyebrow: 'GRAN RIFA OR BARAK 2026',
    titulo1: 'Un solo boleto.', titulo2: 'Dos ganadores.',
    hola: function (n) { return n ? 'Hola ' + n + ',' : 'Hola,'; },
    p1: 'Este año rifamos <b style="color:#E8C27A">dos Mazda 2</b> para apoyar a Or Barak, la escuela de secundaria y prepa para jóvenes que necesitan una oportunidad diferente.',
    p2: 'Cada boleto es una beca, un maestro, un alumno que sigue estudiando. Si ya nos has apoyado antes, sabes lo mucho que significa para nosotros.',
    prem1t: 'Un Mazda 2', prem1d: 'para quien compra el boleto ganador',
    prem2t: 'Otro Mazda 2', prem2d: 'para quien vendió ese boleto',
    d1t: '$6,000', d1d: 'MXN por boleto',
    d2t: '1,000', d2d: 'boletos en total',
    d3t: '10 dic', d3d: 'día del sorteo',
    cta: 'Comprar mi boleto',
    pago: 'Tarjeta (con opción a meses), transferencia o efectivo. Tu número de boleto te llega al momento por correo.',
    vendeT: '¿Conoces a alguien que quiera participar?',
    vendeP: 'Véndele un boleto. Si el boleto que vendiste gana, el segundo Mazda 2 es tuyo.',
    vendeCta: 'Quiero vender boletos',
    gracias: 'Gracias por estar con nosotros.',
    firma: 'Or Barak',
    dudas: '¿Dudas? Escríbenos por WhatsApp',
    baja: 'Si no quieres recibir más correos nuestros, responde a este mensaje con la palabra BAJA.',
  },
  en: {
    asunto: 'One ticket, two Mazda 2 cars · Or Barak Grand Raffle 2026',
    pre: 'Draw on December 10. Tickets are $6,000 MXN, installments available.',
    eyebrow: 'OR BARAK GRAND RAFFLE 2026',
    titulo1: 'One ticket.', titulo2: 'Two winners.',
    hola: function (n) { return n ? 'Hi ' + n + ',' : 'Hi,'; },
    p1: 'This year we are raffling <b style="color:#E8C27A">two Mazda 2 cars</b> to support Or Barak, a middle and high school in Mexico for teenagers who need a different kind of school.',
    p2: 'Every ticket is a scholarship, a teacher, a student who stays in school. If you have supported us before, you know how much it means to us.',
    prem1t: 'One Mazda 2', prem1d: 'for whoever buys the winning ticket',
    prem2t: 'Another Mazda 2', prem2d: 'for whoever sold that ticket',
    d1t: '$6,000', d1d: 'MXN per ticket',
    d2t: '1,000', d2d: 'tickets in total',
    d3t: 'Dec 10', d3d: 'draw date',
    cta: 'Get my ticket',
    pago: 'Pay by card (installments available), bank transfer or cash. Your ticket number arrives by email right away.',
    vendeT: 'Know someone who would like to join?',
    vendeP: 'Sell them a ticket. If the ticket you sold wins, the second Mazda 2 is yours.',
    vendeCta: 'I want to sell tickets',
    gracias: 'Thank you for being with us.',
    firma: 'Or Barak',
    dudas: 'Questions? Message us on WhatsApp',
    baja: 'If you would rather not receive our emails, reply to this message with the word UNSUBSCRIBE.',
  },
  he: {
    asunto: 'כרטיס אחד, שתי מאזדה 2 · ההגרלה הגדולה של אור ברק 2026',
    pre: 'ההגרלה ב־10 בדצמבר. כרטיס ב־6,000 פזו מקסיקני, אפשר לשלם בתשלומים.',
    eyebrow: 'ההגרלה הגדולה של אור ברק 2026',
    titulo1: 'כרטיס אחד.', titulo2: 'שני זוכים.',
    hola: function (n) { return n ? 'שלום ' + n + ',' : 'שלום,'; },
    p1: 'השנה אנחנו מגרילים <b style="color:#E8C27A">שתי מכוניות מאזדה 2</b> לטובת אור ברק, בית ספר לחטיבת ביניים ותיכון במקסיקו, לנערים שזקוקים לבית ספר מסוג אחר.',
    p2: 'כל כרטיס הוא מלגה, מורה, תלמיד שממשיך ללמוד. אם כבר תמכתם בנו בעבר, אתם יודעים כמה זה חשוב לנו.',
    prem1t: 'מאזדה 2 אחת', prem1d: 'למי שקנה את הכרטיס הזוכה',
    prem2t: 'מאזדה 2 נוספת', prem2d: 'למי שמכר את הכרטיס הזה',
    d1t: '6,000', d1d: 'פזו מקסיקני לכרטיס',
    d2t: '1,000', d2d: 'כרטיסים בסך הכול',
    d3t: '10.12', d3d: 'יום ההגרלה',
    cta: 'לקניית כרטיס',
    pago: 'אשראי (אפשר בתשלומים), העברה בנקאית או מזומן. מספר הכרטיס נשלח אליכם מיד במייל.',
    vendeT: 'מכירים מישהו שירצה להשתתף?',
    vendeP: 'מכרו לו כרטיס. אם הכרטיס שמכרתם זוכה, המאזדה 2 השנייה שלכם.',
    vendeCta: 'אני רוצה למכור כרטיסים',
    gracias: 'תודה שאתם איתנו.',
    firma: 'אור ברק',
    dudas: 'שאלות? כתבו לנו בוואטסאפ',
    baja: 'אם אינכם רוצים לקבל מאיתנו מיילים, השיבו להודעה זו במילה "הסר".',
  }
};

function invTemplate_(lang, nombre) {
  const L = INV_TXT[lang] || INV_TXT.es;
  const rtl = lang === 'he';
  const dir = rtl ? 'rtl' : 'ltr';
  const al = rtl ? 'right' : 'left';
  const n = invEsc_(invNombreSaludo_(nombre));
  const utm = 'utm_source=correo&utm_medium=email&utm_campaign=invitacion2026';
  const url = INV.SITIO + '?lang=' + lang + '&' + utm + '#comprar';
  const urlVende = INV.SITIO + '?lang=' + lang + '&' + utm + '#vendedores';
  const wa = 'https://wa.me/' + INV.WHATSAPP;
  const img = INV.SITIO + 'assets/';
  const font = rtl ? "Arial,'Helvetica Neue',Helvetica,sans-serif" : "'Helvetica Neue',Helvetica,Arial,sans-serif";
  const ls = rtl ? '0' : '1px';
  const gold = '#D2A45C', goldHi = '#E8C27A', bg = '#0A0908', card = '#14110E', line = '#3A2F22', text = '#F4EFE6', muted = '#B5AA98';

  const dato = function (t, d) {
    return '<td width="33%" align="center" style="padding:16px 6px;border-top:1px solid ' + line + ';border-bottom:1px solid ' + line + ';">' +
      '<div style="font-size:24px;line-height:28px;color:' + goldHi + ';font-weight:300;letter-spacing:1px;">' + t + '</div>' +
      '<div style="font-size:11px;line-height:16px;color:' + muted + ';letter-spacing:' + ls + ';text-transform:uppercase;padding-top:4px;">' + d + '</div></td>';
  };
  const premio = function (t, d) {
    return '<td width="50%" valign="top" align="center" style="padding:20px 12px;">' +
      '<div style="font-size:17px;line-height:22px;color:' + goldHi + ';font-weight:600;letter-spacing:' + ls + ';">' + t + '</div>' +
      '<div style="font-size:14px;line-height:20px;color:' + text + ';padding-top:6px;">' + d + '</div></td>';
  };
  const boton = function (href, txt, solido) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" bgcolor="' + (solido ? gold : bg) + '" style="border-radius:999px;' + (solido ? '' : 'border:1px solid ' + gold + ';') + '">' +
      '<a href="' + href + '" target="_blank" style="display:inline-block;padding:' + (solido ? '16px 40px' : '12px 28px') + ';font-family:' + font + ';font-size:' + (solido ? '16px' : '14px') + ';font-weight:600;letter-spacing:' + ls + ';color:' + (solido ? '#1A1208' : goldHi) + ';text-decoration:none;border-radius:999px;">' + txt + '</a></td></tr></table>';
  };

  const html =
'<!doctype html><html lang="' + lang + '" dir="' + dir + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>' + L.asunto + '</title></head>' +
'<body style="margin:0;padding:0;background:' + bg + ';" dir="' + dir + '">' +
'<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:' + bg + ';">' + L.pre + '</div>' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + bg + '" style="background:' + bg + ';"><tr><td align="center" style="padding:24px 12px;">' +
'<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" dir="' + dir + '" style="width:100%;max-width:600px;background:' + card + ';border:1px solid ' + line + ';border-radius:16px;overflow:hidden;font-family:' + font + ';color:' + text + ';">' +

// Encabezado con escudo
'<tr><td align="center" style="padding:34px 30px 8px;">' +
'<img src="' + img + 'escudo-sm.jpg" width="72" height="79" alt="Or Barak" style="display:block;border:0;width:72px;height:auto;margin:0 auto 18px;">' +
'<div style="font-size:12px;letter-spacing:' + (rtl ? '0' : '4px') + ';color:' + gold + ';font-weight:600;">' + L.eyebrow + '</div>' +
'<div style="font-size:34px;line-height:40px;font-weight:300;color:' + text + ';padding-top:14px;letter-spacing:' + (rtl ? '0' : '1px') + ';">' + L.titulo1 + '<br><span style="color:' + goldHi + ';font-weight:500;">' + L.titulo2 + '</span></div>' +
'</td></tr>' +

// Autos
'<tr><td style="padding:22px 0 0;"><a href="' + url + '" target="_blank"><img src="' + img + 'autos.jpg" width="600" alt="Mazda 2" style="display:block;border:0;width:100%;max-width:600px;height:auto;"></a></td></tr>' +

// Premios
'<tr><td style="padding:0 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="' + dir + '"><tr>' +
premio(L.prem1t, L.prem1d) +
'<td width="1" style="background:' + line + ';font-size:0;line-height:0;">&nbsp;</td>' +
premio(L.prem2t, L.prem2d) +
'</tr></table></td></tr>' +

// Texto
'<tr><td style="padding:14px 36px 6px;text-align:' + al + ';font-size:16px;line-height:26px;color:' + text + ';" dir="' + dir + '">' +
'<p style="margin:0 0 14px;">' + L.hola(n) + '</p>' +
'<p style="margin:0 0 14px;">' + L.p1 + '</p>' +
'<p style="margin:0;color:' + muted + ';">' + L.p2 + '</p>' +
'</td></tr>' +

// Datos
'<tr><td style="padding:24px 30px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="' + dir + '"><tr>' +
dato(L.d1t, L.d1d) + dato(L.d2t, L.d2d) + dato(L.d3t, L.d3d) +
'</tr></table></td></tr>' +

// CTA
'<tr><td align="center" style="padding:28px 30px 10px;">' + boton(url, L.cta, true) + '</td></tr>' +
'<tr><td align="center" style="padding:6px 44px 30px;font-size:13px;line-height:20px;color:' + muted + ';">' + L.pago + '</td></tr>' +

// Vendedores
'<tr><td style="padding:0 30px 30px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ' + line + ';border-radius:12px;"><tr><td align="center" style="padding:22px 20px;">' +
'<div style="font-size:16px;line-height:22px;color:' + text + ';font-weight:600;">' + L.vendeT + '</div>' +
'<div style="font-size:14px;line-height:21px;color:' + muted + ';padding:8px 0 16px;">' + L.vendeP + '</div>' +
boton(urlVende, L.vendeCta, false) +
'</td></tr></table></td></tr>' +

// Cierre
'<tr><td align="center" style="padding:0 30px 30px;font-size:15px;line-height:22px;color:' + text + ';">' + L.gracias + '<br><span style="color:' + gold + ';letter-spacing:' + (rtl ? '0' : '3px') + ';font-size:13px;">' + L.firma.toUpperCase() + '</span></td></tr>' +

'</table>' +

// Pie
'<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" dir="' + dir + '" style="width:100%;max-width:600px;font-family:' + font + ';"><tr><td align="center" style="padding:20px 24px 8px;font-size:12px;line-height:19px;color:#7D7466;">' +
'<a href="' + wa + '" target="_blank" style="color:' + gold + ';text-decoration:none;">' + L.dudas + '</a> · <a href="mailto:' + INV.DE + '" style="color:' + gold + ';text-decoration:none;">' + INV.DE + '</a><br>' +
'<a href="' + INV.SITIO + '?lang=' + lang + '&' + utm + '" target="_blank" style="color:#7D7466;text-decoration:none;">rifa.orbarakmx.com</a><br><br>' + L.baja +
'</td></tr></table>' +
'</td></tr></table></body></html>';

  const texto = [
    L.hola(invNombreSaludo_(nombre)), '',
    L.titulo1 + ' ' + L.titulo2, '',
    L.p1.replace(/<[^>]+>/g, ''), '',
    L.p2, '',
    '- ' + L.prem1t + ': ' + L.prem1d,
    '- ' + L.prem2t + ': ' + L.prem2d, '',
    L.d1t + ' ' + L.d1d + ' · ' + L.d2t + ' ' + L.d2d + ' · ' + L.d3t + ' ' + L.d3d, '',
    L.cta + ': ' + url, '',
    L.pago, '',
    L.vendeT + ' ' + L.vendeP + ' ' + urlVende, '',
    L.gracias, L.firma, '',
    L.dudas + ': ' + wa, '',
    L.baja
  ].join('\n');

  return { asunto: L.asunto, html: html, texto: texto };
}
