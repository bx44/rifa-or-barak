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
  DE: '',                  // vacío = sale de la cuenta personal (jonathan@ben-hamu.com), sin alias
  NOMBRE_REMITENTE: 'Jonathan Ben-Hamu',
  SITIO: 'https://rifa.orbarakmx.com/',
  WHATSAPP: '525539896174',
  SORTEO_ISO: '2026-12-10T20:00:00-06:00',
  RIFA_SHEET_ID: '1UKBkEhol-I4guu4ySuKRfulCOP707c0FykgcjM4XKqs', // para no invitar a quien ya compró
  CORREO_PRUEBA: 'jonathan@ben-hamu.com',
  POR_BLOQUE: 40,          // correos por corrida (cada 10 min)
  PAUSA_MS: 5000,
  EXCLUIR_NOMBRES: ['yoel perets'] // nunca invitar (comparado contra nombre + apellido)
};

// Columnas de la hoja de envío
const INV_COLS = ['Email', 'Nombre', 'Idioma', 'Enviar', 'Enviado', 'Notas', 'Clic en el link'];

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
    filas.push([email, c.nombre, idioma, enviar || 'SI', enviado, notas, p ? p[6] : '']);
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
    const t2 = invTemplate_(l, 'Jonathan', INV.CORREO_PRUEBA);
    invEnviar_(INV.CORREO_PRUEBA, '[PRUEBA ' + l.toUpperCase() + '] ' + t2.asunto, t2);
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

// Igual que invitacionIniciarEnvio, pero no manda nada durante los próximos
// `minutos` (para dejar descansar al servidor después de un rechazo por límite).
function invitacionReanudarEn30Min() { invitacionReanudarEn_(30); }
function invitacionReanudarEn_(minutos) {
  invRevisarAlias_();
  invitacionDetener();
  PropertiesService.getScriptProperties().setProperty('INV_NO_ANTES', String(Date.now() + minutos * 60000));
  ScriptApp.newTrigger('invitacionEnviarBloque').timeBased().everyMinutes(10).create();
  Logger.log('El envío se reanuda solo a partir de las ' +
    Utilities.formatDate(new Date(Date.now() + minutos * 60000), 'America/Mexico_City', 'HH:mm'));
}

function invitacionDetener() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'invitacionEnviarBloque') ScriptApp.deleteTrigger(t);
  });
}

function invitacionEnviarBloque() {
  const noAntes = Number(PropertiesService.getScriptProperties().getProperty('INV_NO_ANTES') || 0);
  if (Date.now() < noAntes) return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(INV.HOJA);
    if (!sh || sh.getLastRow() < 2) { Logger.log('Primero corre invitacionPrepararLista'); invitacionDetener(); return; }
    const n = sh.getLastRow() - 1;
    // Primero revisa rebotes: los que rebotaron por límite se vuelven a poner en cola.
    // Si hubo rebotes por límite nuevos, esta corrida no manda nada (deja descansar al servidor).
    const reb = invitacionRevisarRebotes();
    if (reb.limite > 0) { Logger.log('Hubo ' + reb.limite + ' rebote(s) por límite; se espera a la siguiente corrida.'); return; }
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
      if (enviados > 0) Utilities.sleep(INV.PAUSA_MS);
      const idioma = /^(es|en|he)$/.test(String(data[i][2]).trim()) ? String(data[i][2]).trim() : 'es';
      try {
        const t = invTemplate_(idioma, data[i][1], email);
        invEnviar_(email, t.asunto, t);
        sh.getRange(i + 2, 5).setValue('OK ' + Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm'));
        enviados++;
      } catch (err) {
        sh.getRange(i + 2, 5, 1, 2).setValues([['ERROR', String(err && err.message || err).slice(0, 200)]]);
      }
      SpreadsheetApp.flush();
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
  if (!INV.DE) return;
  const alias = GmailApp.getAliases().map(function (a) { return a.toLowerCase(); });
  if (alias.indexOf(INV.DE.toLowerCase()) < 0) {
    throw new Error('Esta cuenta (' + Session.getEffectiveUser().getEmail() + ') no tiene ' + INV.DE +
      ' como alias "Enviar como" en Gmail. Alias disponibles: ' + (alias.join(', ') || 'ninguno'));
  }
}

function invEnviar_(to, asunto, t) {
  const op = { name: INV.NOMBRE_REMITENTE, htmlBody: t.html };
  if (INV.DE) op.from = INV.DE;
  GmailApp.sendEmail(to, asunto, t.texto, op);
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
// Correo personal, sin diseño: se ve como un correo normal escrito por Jonathan.
// {dias} se calcula al momento de enviar. Los links llevan un código por persona
// (c=) para saber quién le dio clic (columna "Clic en el link").

const INV_TXT = {
  es: {
    asunto: 'Te voy a ser honesto',
    hola: function (n) { return n ? 'Hola ' + n + ',' : 'Hola,'; },
    cuerpo: [
      'Hoy abrí la hoja de la rifa. Faltan {dias} días para el sorteo y vamos muy por debajo de donde necesitamos estar.',
      'Te voy a ser honesto: me dieron ganas de rendirme.',
      'Pero no puedo.',
      'Cada mañana entran a Or Barak muchachos a los que otras escuelas ya les habían cerrado la puerta. Llegaron convencidos de que no servían para estudiar, y hoy están saliendo adelante. Si esto no sale, los que pierden son ellos.',
      'Además, muchos de ustedes nos apoyaron el año pasado, y eso significó muchísimo para nosotros. Sé que quieren vernos llegar.',
      'Y la verdad, conozco a nuestra gente. Sé que no nos va a dejar solos.',
      'Así que en lugar de rendirme, te escribo.',
      'Este año rifamos 2 Mazda 2, bzh. Uno para quien compra el boleto ganador y otro para quien se lo vendió. El boleto cuesta $6,000 y se puede pagar a meses.',
      'Te pido que compres el tuyo hoy:<br>{link}',
      'Si prefieres pagar por transferencia o tienes cualquier duda, contéstame este correo o {wa}. Lo veo yo personalmente.',
      'Y si este año no puedes, reenvíale este correo a alguien que sí pueda. Cada boleto cuenta.',
      'Me regreso a mis llamadas. Quedan {dias} días y pienso usarlos todos.'
    ],
    waTexto: 'escríbeme por WhatsApp',
    waMsg: 'Hola Jonathan, te escribo por tu correo de la rifa de Or Barak.',
    cierre: 'Gracias por estar,',
    firma: 'Jonathan Ben-Hamu<br>Or Barak',
    pd: [
      'P.D. El otro día le propuse algo a uno de nuestros muchachos. Se le complica mucho la vida por estar enganchado al celular. O tal vez está enganchado al celular porque la vida se le complica; a veces no sé cuál es cuál.',
      'Le dije: hagamos un intercambio. Esta noche tu celular duerme conmigo y el mío contigo.',
      'Aceptó.',
      'Yo tuve una noche tranquilísima. Él también.',
      'Son historias así las que me hacen creer en la valentía y la fuerza de estos muchachos. Por ellos no me rindo.'
    ]
  },
  en: {
    asunto: "I'll be honest with you",
    hola: function (n) { return n ? 'Hi ' + n + ',' : 'Hi,'; },
    cuerpo: [
      "Today I opened the raffle spreadsheet. The draw is {dias} days away, and we're far behind where we need to be.",
      "I'll be honest with you: I felt like giving up.",
      "But I can't.",
      "Every morning, boys walk into Or Barak who had already been turned away by other schools. They came in convinced they weren't cut out for learning, and today they're moving forward. If this doesn't work out, they're the ones who lose.",
      "Many of you supported us last year, and it meant the world to us. I know you want to see us make it.",
      "And honestly, I know our people. I know they won't leave us on our own.",
      "So instead of giving up, I'm writing to you.",
      "This year, with G-d's help, we're raffling two Mazda 2 cars. One for whoever buys the winning ticket, and one for whoever sold it. A ticket is $6,000 MXN, and you can pay in installments.",
      "I'm asking you to get yours today:<br>{link}",
      "If you'd rather pay by bank transfer, or you have any question, just reply to this email or {wa}. I read them myself.",
      "And if this year you can't, please forward this email to someone who can. Every ticket counts.",
      "I'm going back to my calls. There are {dias} days left, and I plan to use every one of them."
    ],
    waTexto: 'message me on WhatsApp',
    waMsg: "Hi Jonathan, I'm writing about your Or Barak raffle email.",
    cierre: 'Thank you for being with us,',
    firma: 'Jonathan Ben-Hamu<br>Or Barak',
    pd: [
      "P.S. The other day I suggested something to one of our boys. His phone makes his life very hard. Or maybe he's glued to his phone because life is hard for him; sometimes I can't tell which comes first.",
      "I told him: let's swap. Tonight your phone sleeps at my place, and mine sleeps at yours.",
      "He said yes.",
      "I had the calmest night. So did he.",
      "Stories like this make me believe in the courage and strength of these boys. They're the reason I don't give up."
    ]
  },
  he: {
    asunto: 'אני אהיה כן איתך',
    hola: function (n) { return n ? 'שלום ' + n + ',' : 'שלום,'; },
    cuerpo: [
      'היום פתחתי את הגיליון של ההגרלה. נשארו {dias} ימים עד ההגרלה, ואנחנו רחוקים מאוד מהמקום שבו אנחנו צריכים להיות.',
      'אני אהיה כן איתך: התחשק לי להרים ידיים.',
      'אבל אני לא יכול.',
      'כל בוקר נכנסים לאור ברק נערים שבתי ספר אחרים כבר סגרו בפניהם את הדלת. הם הגיעו משוכנעים שהם לא מסוגלים ללמוד, והיום הם מתקדמים. אם זה לא יצליח, מי שיפסידו הם הם.',
      'רבים מכם תמכו בנו בשנה שעברה, וזה היה חשוב לנו מאוד. אני יודע שאתם רוצים לראות אותנו מצליחים.',
      'והאמת, אני מכיר את האנשים שלנו. אני יודע שהם לא ישאירו אותנו לבד.',
      'אז במקום להרים ידיים, אני כותב לך.',
      'השנה אנחנו מגרילים, בעזרת ה\', שתי מכוניות מאזדה 2. אחת למי שקונה את הכרטיס הזוכה, ואחת למי שמכר אותו. כרטיס עולה 6,000 פסו מקסיקני, ואפשר לשלם בתשלומים.',
      'אני מבקש ממך לקנות את הכרטיס שלך היום:<br>{link}',
      'אם נוח לך יותר לשלם בהעברה בנקאית, או שיש לך שאלה, פשוט תענה למייל הזה או {wa}. אני קורא הכול בעצמי.',
      'ואם השנה זה לא מתאפשר, תעביר את המייל הזה למישהו שכן יכול. כל כרטיס חשוב.',
      'אני חוזר לטלפונים. נשארו {dias} ימים, ואני מתכוון לנצל כל אחד מהם.'
    ],
    waTexto: 'תכתוב לי בוואטסאפ',
    waMsg: 'שלום יהונתן, אני כותב בעקבות המייל שלך על ההגרלה של אור ברק.',
    cierre: 'תודה שאתה איתנו,',
    firma: 'יהונתן בן חמו<br>אור ברק',
    pd: [
      'נ.ב. לפני כמה ימים הצעתי משהו לאחד הנערים שלנו. הוא כל כך מחובר לטלפון שזה מסבך לו את החיים. או אולי הוא מחובר לטלפון כי החיים מסובכים לו; לפעמים אני לא יודע מה קודם.',
      'אמרתי לו: בוא נעשה החלפה. הלילה הטלפון שלך ישן אצלי, ושלי אצלך.',
      'הוא הסכים.',
      'לי היה לילה שקט במיוחד. גם לו.',
      'סיפורים כאלה גורמים לי להאמין באומץ ובכוח של הנערים האלה. בשבילם אני לא מרים ידיים.'
    ]
  }
};

function invDiasFaltan_() {
  return Math.max(1, Math.floor((new Date(INV.SORTEO_ISO).getTime() - Date.now()) / 86400000));
}

function invToken_(email) {
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(email).trim().toLowerCase());
  return d.slice(0, 6).map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function invTemplate_(lang, nombre, email) {
  const L = INV_TXT[lang] || INV_TXT.es;
  const rtl = lang === 'he';
  const dias = invDiasFaltan_();
  const url = INV.SITIO + '?lang=' + lang + '&utm_source=correo&utm_medium=email&utm_campaign=honesto2026' +
    (email ? '&c=' + invToken_(email) : '');
  const urlTxt = 'rifa.orbarakmx.com';
  const wa = 'https://wa.me/' + INV.WHATSAPP + '?text=' + encodeURIComponent(L.waMsg);
  const saludo = L.hola(invEsc_(invNombreSaludo_(nombre)));

  const fill = function (p, html) {
    return p.split('{dias}').join(String(dias))
      .split('{link}').join(html ? '<a href="' + url + '">' + urlTxt + '</a>' : url)
      .split('{wa}').join(html ? '<a href="' + wa + '">' + L.waTexto + '</a>' : L.waTexto + ' (' + wa + ')');
  };
  const parrafos = [saludo].concat(L.cuerpo.map(function (p) { return fill(p, true); }),
    [L.cierre + '<br><br>' + L.firma], L.pd);

  const html = '<div dir="' + (rtl ? 'rtl' : 'ltr') + '" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#222;' +
    (rtl ? 'text-align:right;' : '') + '">' +
    parrafos.map(function (p) { return '<p style="margin:0 0 14px;">' + p + '</p>'; }).join('') + '</div>';

  const texto = [L.hola(invNombreSaludo_(nombre))]
    .concat(L.cuerpo.map(function (p) { return fill(p, false).replace(/<br>/g, '\n'); }),
      [L.cierre + '\n' + L.firma.replace(/<br>/g, '\n')], L.pd).join('\n\n');

  return { asunto: L.asunto, html: html, texto: texto };
}

/* ---------------------------- Clics (web app) ---------------------------- */
// La página de la rifa llama a esta web app con ?c=<código> cuando alguien llega
// desde el correo. Se anota en la columna "Clic en el link": primera vez y cuántas.
function doGet(e) {
  const c = String((e && e.parameter && e.parameter.c) || '').replace(/[^0-9a-f]/g, '').slice(0, 12);
  if (c) {
    const lock = LockService.getScriptLock();
    if (lock.tryLock(10000)) {
      try {
        const sh = SpreadsheetApp.getActive().getSheetByName(INV.HOJA);
        if (sh && sh.getLastRow() > 1) {
          const emails = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
          for (let i = 0; i < emails.length; i++) {
            if (emails[i][0] && invToken_(emails[i][0]) === c) {
              const cel = sh.getRange(i + 2, 7);
              const prev = String(cel.getValue() || '');
              const m = prev.match(/\((\d+)\)$/);
              const veces = m ? Number(m[1]) + 1 : 1;
              const primera = prev ? prev.replace(/\s*\(\d+\)$/, '') :
                Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm');
              cel.setValue(primera + ' (' + veces + ')');
              break;
            }
          }
        }
      } finally { lock.releaseLock(); }
    }
  }
  return ContentService.createTextOutput('ok');
}

// Cuántos le dieron clic (para verlo rápido en el registro de ejecución).
function invitacionContarClics() {
  const sh = SpreadsheetApp.getActive().getSheetByName(INV.HOJA);
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, INV_COLS.length).getValues();
  const enviados = v.filter(function (r) { return /^OK/.test(String(r[4])); }).length;
  const clics = v.filter(function (r) { return r[6]; }).length;
  Logger.log('Enviados: ' + enviados + ' · Personas que dieron clic: ' + clics);
}

/* ---------------------------- Rebotes ---------------------------- */

// Lee los avisos de "El mensaje no se envió" de Gmail. Si el rechazo fue por
// límite de envío, vuelve a poner a esa persona en cola (borra su "OK"). Si fue
// otra cosa (correo inexistente, buzón lleno...), la marca REBOTÓ y no se reintenta.
function invitacionRevisarRebotes() {
  const sh = SpreadsheetApp.getActive().getSheetByName(INV.HOJA);
  const out = { limite: 0, otros: 0 };
  if (!sh || sh.getLastRow() < 2) return out;
  const etiqueta = GmailApp.getUserLabelByName('rifa-rebote-revisado') || GmailApp.createLabel('rifa-rebote-revisado');
  const hilos = GmailApp.search('from:mailer-daemon newer_than:3d -label:rifa-rebote-revisado', 0, 100);
  if (!hilos.length) return out;
  const emails = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).trim().toLowerCase(); });
  hilos.forEach(function (h) {
    const msgs = h.getMessages();
    let destino = '', texto = '';
    msgs.forEach(function (m) {
      const de = String(m.getFrom()).toLowerCase();
      if (de.indexOf('mailer-daemon') >= 0) texto += ' ' + m.getPlainBody();
      else if (de.indexOf(INV.DE) >= 0 && !destino) destino = String(m.getTo()).replace(/.*</, '').replace(/>.*/, '').trim().toLowerCase();
    });
    const idx = destino ? emails.indexOf(destino) : -1;
    if (idx >= 0) {
      const fila = idx + 2;
      if (/throttl|quota|rate limit|too many|limit exceeded/i.test(texto)) {
        sh.getRange(fila, 5, 1, 2).setValues([['', 'Reintento (rebote por límite)']]);
        out.limite++;
      } else {
        sh.getRange(fila, 5, 1, 2).setValues([['REBOTÓ', texto.replace(/\s+/g, ' ').slice(0, 180)]]);
        out.otros++;
      }
    }
    h.addLabel(etiqueta);
  });
  SpreadsheetApp.flush();
  Logger.log('Rebotes revisados: ' + out.limite + ' por límite (se reintentan), ' + out.otros + ' definitivos.');
  return out;
}
