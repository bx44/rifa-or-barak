/* ============================================================
   IDIOMAS — español (base), inglés y hebreo
   ------------------------------------------------------------
   Cómo se elige el idioma (en este orden):
   1. ?lang=es|en|he en la URL (y se recuerda en este navegador).
   2. El idioma que la persona eligió antes con el selector.
   3. Por ubicación (zona horaria del dispositivo):
        Israel  -> hebreo
        México  -> español
        resto   -> inglés
      Si el teléfono está en hebreo o en español se respeta eso.
   Para corregir una traducción, cambia el texto en DICT.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1) detectar idioma ---------- */
  var LANGS = ['es', 'en', 'he'];
  function guardado() { try { return localStorage.getItem('rifa_lang'); } catch (e) { return null; } }
  function guardar(l) { try { localStorage.setItem('rifa_lang', l); } catch (e) {} }

  function porUbicacion() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map(function (x) { return String(x).toLowerCase(); });
    var prim = langs[0] || '';
    if (/^(he|iw)/.test(prim) || /^Asia\/(Jerusalem|Tel_Aviv)$/.test(tz)) return 'he';
    if (/^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Hermosillo|Mazatlan|Bahia_Banderas|Tijuana|Ensenada|Santa_Isabel)$/.test(tz)) return 'es';
    if (/^es/.test(prim)) return 'es';
    return 'en';
  }

  var qp = new URLSearchParams(location.search).get('lang');
  var LANG = LANGS.indexOf(qp) !== -1 ? qp : (LANGS.indexOf(guardado()) !== -1 ? guardado() : porUbicacion());
  if (LANGS.indexOf(qp) !== -1) guardar(qp);

  /* ---------- 2) diccionario: 'texto en español': ['inglés', 'hebreo'] ---------- */
  var DICT = {
    // ---- títulos / meta
    'Gran Rifa Or Barak 2026 · Un solo boleto. Dos ganadores.': ['Or Barak Grand Raffle 2026 · One ticket. Two winners.', 'ההגרלה הגדולה של אור ברק 2026 · כרטיס אחד. שני זוכים.'],
    'Paga tu boleto · Gran Rifa Or Barak 2026': ['Pay for your ticket · Or Barak Grand Raffle 2026', 'תשלום עבור הכרטיס · ההגרלה הגדולה של אור ברק 2026'],
    'Verifica tu boleto · Gran Rifa Or Barak 2026': ['Check your ticket · Or Barak Grand Raffle 2026', 'בדיקת הכרטיס · ההגרלה הגדולה של אור ברק 2026'],
    '¡Gracias! · Gran Rifa Or Barak 2026': ['Thank you! · Or Barak Grand Raffle 2026', 'תודה! · ההגרלה הגדולה של אור ברק 2026'],
    '¿Cómo quieres aparecer? · Gran Rifa Or Barak 2026': ['How would you like to appear? · Or Barak Grand Raffle 2026', 'איך תרצו להופיע? · ההגרלה הגדולה של אור ברק 2026'],

    // ---- nav / generales
    'Gran Rifa Or Barak 2026': ['Or Barak Grand Raffle 2026', 'ההגרלה הגדולה של אור ברק 2026'],
    'Estás comprando con': ['You are buying through', 'אתם רוכשים דרך'],
    'Quitar': ['Remove', 'הסר'],
    'OR BARAK': ['OR BARAK', 'אור ברק'],
    'Premios': ['Prizes', 'פרסים'],
    'Cómo funciona': ['How it works', 'איך זה עובד'],
    'Vendedores': ['Sellers', 'מוכרים'],
    'Bases': ['Rules', 'תקנון'],
    'BASES': ['RULES', 'תקנון'],
    'Comprar boleto': ['Buy a ticket', 'לרכישת כרטיס'],
    'Escudo de Or Barak sobre muro de concreto y dos Mazda 2 iluminados': ['Or Barak crest on a concrete wall with two lit Mazda 2 cars', 'סמל אור ברק על קיר בטון ושתי מאזדה 2 מוארות'],
    'Escudo de Or Barak': ['Or Barak crest', 'סמל אור ברק'],
    'Dos Mazda 2': ['Two Mazda 2 cars', 'שתי מאזדה 2'],

    // ---- hero (claves especiales por data-i18n)
    '@hero1a': ['ONE', 'כרטיס'],
    '@hero1b': [' TICKET.', ' אחד.'],
    '@hero2a': ['TWO', 'שני'],
    '@hero2b': [' WINNERS.', ' זוכים.'],
    '@prize1': ['A <b>MAZDA 2</b><br>FOR THE BUYER.', '<b>מאזדה 2</b><br>לקונה.'],
    '@prize2': ['ANOTHER <b>MAZDA 2</b><br>FOR WHOEVER SOLD<br>THE WINNING TICKET.', '<b>מאזדה 2</b> נוספת<br>למי שמכר<br>את הכרטיס הזוכה.'],
    'Comprar boleto · $6,000 MXN': ['Buy a ticket · $6,000 MXN', 'לרכישת כרטיס · 6,000 פסו (MXN)'],
    'Quiero vender': ['I want to sell', 'אני רוצה למכור'],

    // ---- contador
    'Boletos vendidos': ['Tickets sold', 'כרטיסים שנמכרו'],
    'Cargando disponibilidad…': ['Loading availability…', 'טוען זמינות…'],
    'Sorteo': ['Draw', 'ההגרלה'],
    '10 DE DICIEMBRE': ['DECEMBER 10', '10 בדצמבר'],
    'días': ['days', 'ימים'],
    'horas': ['hours', 'שעות'],
    'min': ['min', 'דק׳'],
    'seg': ['sec', 'שנ׳'],

    // ---- cómo funciona
    'PARTICIPA': ['JOIN', 'השתתפו'],
    'Un boleto por $6,000 MXN.': ['One ticket for $6,000 MXN.', 'כרטיס אחד ב־6,000 פסו (MXN).'],
    'COMPARTE': ['SHARE', 'שתפו'],
    'Comparte la oportunidad con familiares y amigos.': ['Share the opportunity with family and friends.', 'שתפו את ההזדמנות עם המשפחה והחברים.'],
    'GANA': ['WIN', 'זכו'],
    'Si gana tu boleto, el Mazda es para ti.': ['If your ticket wins, the Mazda is yours.', 'אם הכרטיס שלכם זוכה, המאזדה שלכם.'],
    'Si gana un boleto vendido por ti, el otro Mazda es para ti.': ['If a ticket you sold wins, the other Mazda is yours.', 'אם זוכה כרטיס שמכרתם, המאזדה השנייה שלכם.'],

    // ---- comprar
    'Compra en línea': ['Buy online', 'רכישה אונליין'],
    'Tu boleto,': ['Your ticket,', 'הכרטיס שלכם,'],
    'en un minuto.': ['in one minute.', 'בדקה אחת.'],
    'Te registras, se te asigna tu número de boleto y eliges cómo pagar: tarjeta (con opción a meses), transferencia o efectivo. Tu número también te llega por correo.':
      ['Sign up, get your ticket number and choose how to pay: card (installments available), bank transfer or cash. Your number is also sent to you by email.',
       'נרשמים, מקבלים מספר כרטיס ובוחרים איך לשלם: כרטיס אשראי (אפשר בתשלומים), העברה בנקאית או מזומן. המספר נשלח אליכם גם במייל.'],
    'Al pagar, tu boleto queda liquidado y participa por el Mazda 2.': ['Once paid, your ticket is fully settled and enters the draw for the Mazda 2.', 'לאחר התשלום הכרטיס משולם במלואו ומשתתף בהגרלת המאזדה 2.'],
    '¿Quieres más de un boleto? Repite la compra con tus mismos datos.': ['Want more than one ticket? Repeat the purchase with the same details.', 'רוצים יותר מכרטיס אחד? חזרו על הרכישה עם אותם פרטים.'],
    'Si alguien te recomendó, su código queda registrado: si tu boleto gana, él también.': ['If someone referred you, their code is recorded: if your ticket wins, they win too.', 'אם מישהו המליץ לכם, הקוד שלו נרשם: אם הכרטיס שלכם זוכה, גם הוא זוכה.'],
    'Al apartar ves los datos para pagar por transferencia o en efectivo. ¿Dudas?': ['When you reserve, you will see the details to pay by transfer or in cash. Questions?', 'בעת השמירה תראו את הפרטים לתשלום בהעברה או במזומן. שאלות?'],
    'Escríbenos por WhatsApp': ['Message us on WhatsApp', 'כתבו לנו בוואטסאפ'],
    'escríbenos por WhatsApp': ['message us on WhatsApp', 'כתבו לנו בוואטסאפ'],
    'Nombre completo': ['Full name', 'שם מלא'],
    'Correo': ['Email', 'אימייל'],
    'WhatsApp': ['WhatsApp', 'וואטסאפ'],
    'Código de vendedor': ['Seller code', 'קוד מוכר'],
    '(opcional)': ['(optional)', '(לא חובה)'],
    'Ej. ABC1234': ['e.g. ABC1234', 'לדוגמה ABC1234'],
    '¿Cómo quieres aparecer en el muro?': ['How would you like to appear on the wall?', 'איך תרצו להופיע על הקיר?'],
    'Con mi nombre': ['With my name', 'בשמי'],
    'Anónimo': ['Anonymous', 'אנונימי'],
    'A nombre de…': ['In the name of…', 'על שם…'],
    'Nombre de la persona o familia': ['Name of the person or family', 'שם האדם או המשפחה'],
    'Nombre de la persona': ['Name of the person', 'שם האדם'],
    'Dedicatoria': ['Dedication', 'הקדשה'],
    'Sin dedicatoria': ['No dedication', 'ללא הקדשה'],
    'Leilui Nishmat': ['Leilui Nishmat (in memory of)', 'לעילוי נשמת'],
    'Refuá Shelemá': ['Refuah Shelemah (for the recovery of)', 'רפואה שלמה'],
    'Hatzlajá': ['Hatzlachah (success)', 'הצלחה'],
    'Zivug Hagún': ['Zivug Hagun (a worthy match)', 'זיווג הגון'],
    'En honor de': ['In honor of', 'לכבוד'],
    'Otra…': ['Other…', 'אחר…'],
    'Ej. Moshe ben Sara': ['e.g. Moshe ben Sara', 'לדוגמה משה בן שרה'],
    'Ej. Familia Cohen': ['e.g. The Cohen family', 'לדוגמה משפחת כהן'],
    'Escribe tu dedicatoria': ['Write your dedication', 'כתבו את ההקדשה'],
    'Tu dedicatoria': ['Your dedication', 'ההקדשה שלכם'],
    'Acepto las': ['I accept the', 'אני מאשר/ת את'],
    'bases del sorteo': ['raffle rules', 'תקנון ההגרלה'],
    'y el aviso de privacidad.': ['and the privacy notice.', 'ואת מדיניות הפרטיות.'],
    '1 boleto': ['1 ticket', 'כרטיס 1'],
    '$6,000 MXN': ['$6,000 MXN', '6,000 פסו (MXN)'],
    'Apartar y pagar': ['Reserve and pay', 'לשמירה ותשלום'],
    'Pagos procesados por Stripe. Or Barak no almacena datos de tu tarjeta.': ['Payments processed by Stripe. Or Barak does not store your card details.', 'התשלומים מעובדים על ידי Stripe. אור ברק אינה שומרת את פרטי הכרטיס שלכם.'],

    // ---- muro
    'Muro de participantes': ['Wall of participants', 'קיר המשתתפים'],
    'Gracias a quienes': ['Thank you to those', 'תודה לכל מי'],
    'ya participan': ['already taking part', 'שכבר משתתף'],
    'Ver más': ['See more', 'עוד'],

    // ---- vendedores
    'Vende y gana': ['Sell and win', 'מוכרים וזוכים'],
    'Si el boleto que vendiste gana,': ['If the ticket you sold wins,', 'אם הכרטיס שמכרתם זוכה,'],
    'el segundo Mazda 2 es tuyo.': ['the second Mazda 2 is yours.', 'המאזדה 2 השנייה שלכם.'],
    'Cada vendedor puede vender hasta 50 boletos. Para recibir el premio, el vendedor debe tener su propio boleto liquidado.':
      ['Each seller can sell up to 50 tickets. To receive the prize, the seller must have their own fully paid ticket.',
       'כל מוכר יכול למכור עד 50 כרטיסים. כדי לקבל את הפרס, למוכר חייב להיות כרטיס משלו ששולם במלואו.'],
    '¿Aún no eres vendedor?': ['Not a seller yet?', 'עדיין לא מוכרים?'],
    'Escríbenos por WhatsApp y te damos de alta. Recibirás tu código y tu link personal: cada boleto que vendas queda a tu nombre.':
      ['Message us on WhatsApp and we will sign you up. You will get your code and personal link: every ticket you sell is recorded under your name.',
       'כתבו לנו בוואטסאפ ונרשום אתכם. תקבלו קוד וקישור אישי: כל כרטיס שתמכרו נרשם על שמכם.'],
    'Registrarme como vendedor': ['Sign me up as a seller', 'הרשמה כמוכר'],
    'Tu link de vendedor': ['Your seller link', 'קישור המוכר שלכם'],
    'Escribe tu celular de vendedor y obtén tu código y tu link. Quien compre desde ahí queda registrado como venta tuya.':
      ['Enter your seller phone number to get your code and link. Anyone who buys through it is recorded as your sale.',
       'הזינו את הטלפון שלכם כמוכרים וקבלו את הקוד והקישור. מי שקונה דרכו נרשם כמכירה שלכם.'],
    'Tu celular (10 dígitos)': ['Your mobile number (10 digits)', 'מספר הנייד שלכם (10 ספרות)'],
    'Copiar link': ['Copy link', 'העתקת קישור'],
    'Compartir por WhatsApp': ['Share on WhatsApp', 'שיתוף בוואטסאפ'],
    'Material para compartir': ['Material to share', 'חומרים לשיתוף'],
    'Poster: Un solo boleto, dos ganadores': ['Poster: One ticket, two winners', 'פוסטר: כרטיס אחד, שני זוכים'],
    'Poster: Participa, comparte, gana': ['Poster: Join, share, win', 'פוסטר: השתתפו, שתפו, זכו'],
    'Poster: Bases': ['Poster: Rules', 'פוסטר: תקנון'],
    'Toca un poster para descargarlo.': ['Tap a poster to download it.', 'לחצו על פוסטר כדי להוריד אותו.'],

    // ---- bases
    'boletos disponibles.': ['tickets available.', 'כרטיסים זמינים.'],
    'Cada boleto:': ['Each ticket:', 'כל כרטיס:'],
    ', con opción a meses.': [', installments available.', ', אפשר בתשלומים.'],
    'Próxima meta: {n} boletos': ['Next goal: {n} tickets', 'היעד הבא: {n} כרטיסים'],
    '¡Seguimos sumando!': ['We keep going!', 'ממשיכים להתקדם!'],
    'Máximo': ['Up to', 'עד'],
    'boletos por vendedor.': ['tickets per seller.', 'כרטיסים לכל מוכר.'],
    'El boleto ganador deberá estar': ['The winning ticket must be', 'הכרטיס הזוכה חייב להיות'],
    'liquidado': ['fully paid', 'משולם במלואו'],
    'para reclamar el premio.': ['to claim the prize.', 'כדי לקבל את הפרס.'],
    'El vendedor ganador deberá tener su propio boleto': ['The winning seller must have their own ticket', 'למוכר הזוכה חייב להיות כרטיס משלו'],
    'para recibir el segundo Mazda 2.': ['to receive the second Mazda 2.', 'כדי לקבל את המאזדה 2 השנייה.'],
    'Sorteo:': ['Draw:', 'ההגרלה:'],
    '10 de diciembre de 2026': ['December 10, 2026', '10 בדצמבר 2026'],
    'Leer bases completas →': ['Read the full rules →', 'לתקנון המלא ←'],

    // ---- FAQ
    'Preguntas frecuentes': ['Frequently asked questions', 'שאלות נפוצות'],
    '¿Cómo recibo mi número de boleto?': ['How do I get my ticket number?', 'איך אקבל את מספר הכרטיס?'],
    'En cuanto te registras se te asigna tu número, lo ves en pantalla y te llega por correo con tu liga de pago. Al pagar recibes la confirmación. Si no lo encuentras,':
      ['As soon as you sign up you get your number: you see it on screen and it is emailed to you with your payment link. Once you pay you get a confirmation. If you cannot find it,',
       'מיד עם ההרשמה מוקצה לכם מספר: הוא מופיע על המסך ונשלח במייל יחד עם קישור לתשלום. לאחר התשלום תקבלו אישור. אם אינכם מוצאים אותו,'],
    'consulta tus boletos aquí': ['check your tickets here', 'בדקו את הכרטיסים שלכם כאן'],
    '¿Qué significa “dos ganadores”?': ['What does “two winners” mean?', 'מה פירוש „שני זוכים”?'],
    'Se sortea un solo boleto. Quien lo compró gana un Mazda 2, y la persona que se lo vendió gana otro Mazda 2.':
      ['A single ticket is drawn. The person who bought it wins a Mazda 2, and the person who sold it to them wins another Mazda 2.',
       'מוגרל כרטיס אחד בלבד. מי שקנה אותו זוכה במאזדה 2, ומי שמכר לו אותו זוכה במאזדה 2 נוספת.'],
    '¿Puedo pagar en efectivo o por transferencia?': ['Can I pay in cash or by bank transfer?', 'אפשר לשלם במזומן או בהעברה בנקאית?'],
    'Sí. Al apartar tu boleto te mostramos los datos para transferir. Para pagar en efectivo, entrégalo a tu vendedor o':
      ['Yes. When you reserve your ticket we show you the transfer details. To pay in cash, give it to your seller or',
       'כן. בעת שמירת הכרטיס נציג לכם את פרטי ההעברה. לתשלום במזומן, מסרו אותו למוכר או'],
    '. Los comprobantes de transferencia se envían a': ['. Transfer receipts are sent to', '. אישורי העברה שולחים אל'],
    '¿Cuál es el destino de lo recaudado?': ['Where does the money go?', 'לאן הולך הכסף?'],
    'Lo recaudado apoya a Or Barak, institución educativa para alumnos de secundaria y preparatoria que necesitan una escuela diferente.':
      ['Proceeds support Or Barak, an educational institution for middle and high school students who need a different kind of school.',
       'ההכנסות תומכות באור ברק, מוסד חינוכי לתלמידי חטיבת ביניים ותיכון שזקוקים לבית ספר אחר.'],
    '© 2026 Or Barak ·': ['© 2026 Or Barak ·', '© 2026 אור ברק ·'],
    'Contacto': ['Contact', 'צור קשר'],

    // ---- app.js (dinámicos)
    'Boletos agotados.': ['Sold out.', 'הכרטיסים אזלו.'],
    'Quedan {a} boletos de {b}.': ['{a} of {b} tickets left.', 'נותרו {a} כרטיסים מתוך {b}.'],
    '{n} boletos disponibles.': ['{n} tickets available.', '{n} כרטיסים זמינים.'],
    '{n} boletos en total.': ['{n} tickets in total.', 'סה״כ {n} כרטיסים.'],
    'Verificando…': ['Checking…', 'בודק…'],
    'Vendedor: {n}': ['Seller: {n}', 'מוכר: {n}'],
    'Código no encontrado.': ['Code not found.', 'הקוד לא נמצא.'],
    'El pago no se completó. Puedes intentarlo de nuevo.': ['The payment was not completed. You can try again.', 'התשלום לא הושלם. אפשר לנסות שוב.'],
    'Boleto apartado': ['Ticket reserved', 'הכרטיס נשמר'],
    'Tu número': ['Your number', 'המספר שלך'],
    '{n}, ahora elige cómo pagar: tarjeta, transferencia o efectivo…': ['{n}, now choose how to pay: card, transfer or cash…', '{n}, עכשיו בחרו איך לשלם: כרטיס אשראי, העברה או מזומן…'],
    'También te enviamos tu número y tu liga de pago por correo.': ['We also emailed you your number and payment link.', 'שלחנו לכם גם את המספר ואת קישור התשלום במייל.'],
    'Ver formas de pago': ['See payment options', 'לאפשרויות התשלום'],
    'Revisa los campos marcados.': ['Please check the highlighted fields.', 'בדקו את השדות המסומנים.'],
    'Escribe a nombre de quién quieres el boleto.': ['Write whose name the ticket should be in.', 'כתבו על שם מי הכרטיס.'],
    'Completa la dedicatoria (por ejemplo, el nombre).': ['Complete the dedication (for example, the name).', 'השלימו את ההקדשה (למשל, השם).'],
    'El código de vendedor no es válido. Corrígelo o déjalo vacío.': ['The seller code is not valid. Fix it or leave it empty.', 'קוד המוכר אינו תקין. תקנו אותו או השאירו ריק.'],
    'Debes aceptar las bases del sorteo.': ['You must accept the raffle rules.', 'יש לאשר את תקנון ההגרלה.'],
    'Conectando con Stripe…': ['Connecting to Stripe…', 'מתחבר ל־Stripe…'],
    'No se pudo registrar tu boleto.': ['We could not register your ticket.', 'לא הצלחנו לרשום את הכרטיס.'],
    'Ocurrió un error. Intenta de nuevo.': ['Something went wrong. Please try again.', 'אירעה שגיאה. נסו שוב.'],
    'hace {n} min': ['{n} min ago', 'לפני {n} דק׳'],
    'hace 1 hora': ['1 hour ago', 'לפני שעה'],
    'hace {n} horas': ['{n} hours ago', 'לפני {n} שעות'],
    'hace 1 día': ['1 day ago', 'לפני יום'],
    'hace {n} días': ['{n} days ago', 'לפני {n} ימים'],
    '1 persona ya tiene su boleto.': ['1 person already has a ticket.', 'אדם אחד כבר רכש כרטיס.'],
    '{n} personas ya tienen su boleto.': ['{n} people already have a ticket.', '{n} אנשים כבר רכשו כרטיס.'],
    'Ese celular no está registrado como vendedor.': ['That number is not registered as a seller.', 'המספר הזה אינו רשום כמוכר.'],
    'Tu código: {c}': ['Your code: {c}', 'הקוד שלך: {c}'],
    '{a} de {b} boletos vendidos': ['{a} of {b} tickets sold', '{a} מתוך {b} כרטיסים נמכרו'],
    '¡Copiado!': ['Copied!', 'הועתק!'],
    'Hola, quiero comprar un boleto de la {r} por transferencia.': ['Hi, I would like to buy a ticket for the {r} by bank transfer.', 'שלום, אני רוצה לקנות כרטיס בהעברה בנקאית ({r}).'],
    'Hola, quiero registrarme como vendedor de la {r}.': ['Hi, I would like to sign up as a seller for the {r}.', 'שלום, אני רוצה להירשם כמוכר ({r}).'],
    'Hola, tengo una pregunta sobre la {r}.': ['Hi, I have a question about the {r}.', 'שלום, יש לי שאלה לגבי {r}.'],
    'Un solo boleto. Dos ganadores. 🚗🚗\nParticipa en la {r}: un Mazda 2 para el comprador y otro para quien vende el boleto ganador. Sorteo 10 de diciembre.\n{l}':
      ['One ticket. Two winners. 🚗🚗\nJoin the {r}: a Mazda 2 for the buyer and another for whoever sells the winning ticket. Draw on December 10.\n{l}',
       'כרטיס אחד. שני זוכים. 🚗🚗\n{r}: מאזדה 2 לקונה ועוד אחת למי שמכר את הכרטיס הזוכה. ההגרלה ב־10 בדצמבר.\n{l}'],
    'Gran Rifa Or Barak 2026 ': ['Or Barak Grand Raffle 2026 ', 'ההגרלה הגדולה של אור ברק 2026 '],
    'Permiso SEGOB: {p}': ['SEGOB permit: {p}', 'היתר SEGOB: {p}'],

    // ---- pagar/
    'Paga tu boleto': ['Pay for your ticket', 'תשלום עבור הכרטיס'],
    'Cargando…': ['Loading…', 'טוען…'],
    '¿Dudas?': ['Questions?', 'שאלות?'],
    'Verifica tu boleto': ['Check your ticket', 'בדיקת הכרטיס'],
    'Hola, tengo una duda sobre el pago de mi boleto de la Gran Rifa Or Barak 2026.': ['Hi, I have a question about paying for my Or Barak Grand Raffle 2026 ticket.', 'שלום, יש לי שאלה לגבי התשלום על הכרטיס שלי בהגרלה הגדולה של אור ברק 2026.'],
    'No se pudo cargar tu boleto.': ['We could not load your ticket.', 'לא הצלחנו לטעון את הכרטיס.'],
    'No se pudo conectar. Revisa tu internet y recarga la página.': ['Could not connect. Check your internet and reload the page.', 'אין חיבור. בדקו את האינטרנט וטענו מחדש את הדף.'],
    'Folio': ['Ticket no.', 'מס׳ כרטיס'],
    'Te falta pagar': ['Remaining balance', 'נותר לתשלום'],
    'Total a pagar': ['Total due', 'סה״כ לתשלום'],
    'Pagado': ['Paid', 'שולם'],
    'Tu boleto ya está liquidado. ¡Mucha suerte!': ['Your ticket is fully paid. Good luck!', 'הכרטיס שלכם שולם במלואו. בהצלחה!'],
    'Ya participas en el sorteo del 10 de diciembre de 2026.': ['You are in the draw on December 10, 2026.', 'אתם משתתפים בהגרלה ב־10 בדצמבר 2026.'],
    'Elige cómo quieres pagar. Tu boleto participa cuando quede liquidado antes del sorteo.': ['Choose how you want to pay. Your ticket enters the draw once it is fully paid before the draw date.', 'בחרו איך לשלם. הכרטיס משתתף בהגרלה כשהוא משולם במלואו לפני מועד ההגרלה.'],
    'Tarjeta': ['Card', 'כרטיס אשראי'],
    'Pago seguro con Stripe. Puedes pagar a meses con tarjeta de crédito participante. Se registra al instante.': ['Secure payment with Stripe. Installments available with participating credit cards. Recorded instantly.', 'תשלום מאובטח עם Stripe. אפשר לשלם בתשלומים בכרטיסי אשראי משתתפים. נרשם מיד.'],
    'Pagar {m} con tarjeta': ['Pay {m} by card', 'לתשלום {m} בכרטיס אשראי'],
    'Transferencia': ['Bank transfer', 'העברה בנקאית'],
    'Transfiere {m} a esta cuenta y manda tu comprobante.': ['Transfer {m} to this account and send your receipt.', 'העבירו {m} לחשבון הזה ושלחו את האישור.'],
    'Beneficiario': ['Beneficiary', 'מוטב'],
    'Banco': ['Bank', 'בנק'],
    'CLABE': ['CLABE (Mexican account no.)', 'CLABE (מס׳ חשבון מקסיקני)'],
    'Concepto': ['Reference', 'אסמכתא'],
    'Enviar comprobante por WhatsApp': ['Send receipt on WhatsApp', 'שליחת אישור בוואטסאפ'],
    'Enviar comprobante por correo': ['Send receipt by email', 'שליחת אישור במייל'],
    'Hola, aquí está mi comprobante de transferencia del boleto {f} de la Gran Rifa Or Barak 2026.': ['Hi, here is my transfer receipt for ticket {f} of the Or Barak Grand Raffle 2026.', 'שלום, מצורף אישור ההעברה עבור כרטיס {f} בהגרלה הגדולה של אור ברק 2026.'],
    'Comprobante boleto {f}': ['Receipt ticket {f}', 'אישור כרטיס {f}'],
    'Te llega un correo cuando tu pago quede registrado.': ['You will get an email once your payment is recorded.', 'תקבלו מייל כשהתשלום יירשם.'],
    'Efectivo': ['Cash', 'מזומן'],
    'Entrega {m} a la persona que te vendió el boleto o coordina la entrega con nosotros. Pide que registren tu pago con el folio {f}.': ['Give {m} to the person who sold you the ticket or arrange the handover with us. Ask them to record your payment under ticket {f}.', 'מסרו {m} למי שמכר לכם את הכרטיס או תאמו איתנו את המסירה. בקשו שירשמו את התשלום על כרטיס מס׳ {f}.'],
    'Coordinar pago en efectivo': ['Arrange cash payment', 'תיאום תשלום במזומן'],
    'Hola, quiero pagar en efectivo mi boleto {f} de la Gran Rifa Or Barak 2026.': ['Hi, I would like to pay cash for my ticket {f} of the Or Barak Grand Raffle 2026.', 'שלום, אני רוצה לשלם במזומן על כרטיס {f} בהגרלה הגדולה של אור ברק 2026.'],
    'Rifa folio {f}': ['Raffle ticket {f}', 'הגרלה כרטיס {f}'],
    'Copiar': ['Copy', 'העתקה'],
    'Copiado': ['Copied', 'הועתק'],

    // ---- consulta/
    'Escribe el celular y el correo con los que se registró tu boleto.': ['Enter the mobile number and email your ticket was registered with.', 'הזינו את מספר הנייד והמייל שאיתם נרשם הכרטיס.'],
    'Celular (10 dígitos)': ['Mobile number (10 digits)', 'מספר נייד (10 ספרות)'],
    'tu@correo.com': ['you@email.com', 'you@email.com'],
    'Ver mis boletos': ['See my tickets', 'הצגת הכרטיסים שלי'],
    '¿Eres vendedor?': ['Are you a seller?', 'אתם מוכרים?'],
    'Consulta el estado de tus ventas': ['Check the status of your sales', 'בדיקת מצב המכירות שלכם'],
    'Hola, tengo una duda sobre mi boleto de la Gran Rifa Or Barak 2026.': ['Hi, I have a question about my Or Barak Grand Raffle 2026 ticket.', 'שלום, יש לי שאלה לגבי הכרטיס שלי בהגרלה הגדולה של אור ברק 2026.'],
    'Escribe tu celular a 10 dígitos.': ['Enter your 10-digit mobile number.', 'הזינו מספר נייד בן 10 ספרות.'],
    'Escribe tu correo.': ['Enter your email.', 'הזינו את המייל שלכם.'],
    'Buscando…': ['Searching…', 'מחפש…'],
    'No se pudo consultar. Intenta de nuevo.': ['Could not look it up. Please try again.', 'לא הצלחנו לבדוק. נסו שוב.'],
    'No se pudo conectar. Revisa tu internet e intenta de nuevo.': ['Could not connect. Check your internet and try again.', 'אין חיבור. בדקו את האינטרנט ונסו שוב.'],
    'Hola {n}, ': ['Hi {n}, ', 'שלום {n}, '],
    'este es tu boleto.': ['here is your ticket.', 'זה הכרטיס שלך.'],
    'estos son tus {n} boletos.': ['here are your {n} tickets.', 'אלה {n} הכרטיסים שלך.'],
    'Tus datos están registrados, pero todavía no tienes boletos asignados. Si acabas de comprar, espera unos minutos o escríbenos.': ['Your details are registered, but you have no tickets assigned yet. If you just bought, wait a few minutes or message us.', 'הפרטים שלכם רשומים, אבל עדיין לא הוקצו לכם כרטיסים. אם רכשתם זה עתה, המתינו כמה דקות או כתבו לנו.'],
    'Pago pendiente': ['Payment pending', 'ממתין לתשלום'],
    'Ganador': ['Winner', 'זוכה'],
    '{a} de {b}': ['{a} of {b}', '{a} מתוך {b}'],
    'Por pagar': ['Balance due', 'לתשלום'],
    'Vendedor': ['Seller', 'מוכר'],
    'Pagar {m}': ['Pay {m}', 'לתשלום {m}'],
    'Elegir cómo aparezco en el muro': ['Choose how I appear on the wall', 'בחירת אופן ההופעה על הקיר'],
    'Consultar con otros datos': ['Search with other details', 'בדיקה עם פרטים אחרים'],
    'Sorteo: 10 de diciembre de 2026': ['Draw: December 10, 2026', 'ההגרלה: 10 בדצמבר 2026'],

    // ---- gracias.html
    'Confirmando tu pago…': ['Confirming your payment…', 'מאשר את התשלום…'],
    'Esto toma unos segundos.': ['This takes a few seconds.', 'זה לוקח כמה שניות.'],
    'Volver al inicio': ['Back to home', 'חזרה לדף הבית'],
    'Sorteo: 10 de diciembre de 2026 · OR BARAK': ['Draw: December 10, 2026 · OR BARAK', 'ההגרלה: 10 בדצמבר 2026 · אור ברק'],
    '¡Ya tengo mi boleto de la {r}! Un solo boleto, dos ganadores: dos Mazda 2. {l}': ['I got my ticket for the {r}! One ticket, two winners: two Mazda 2 cars. {l}', 'קניתי כרטיס! {r} – כרטיס אחד, שני זוכים: שתי מאזדה 2. {l}'],
    '¡Gracias por tu compra!': ['Thank you for your purchase!', 'תודה על הרכישה!'],
    'Tu pago fue recibido. Te enviaremos tus números de boleto por correo.': ['Your payment was received. We will email you your ticket numbers.', 'התשלום התקבל. נשלח לכם את מספרי הכרטיסים במייל.'],
    'Boleto': ['Ticket', 'כרטיס'],
    '¡Gracias, {n}!': ['Thank you, {n}!', 'תודה, {n}!'],
    'Estos son tus números.': ['These are your numbers.', 'אלה המספרים שלך.'],
    'Este es tu número.': ['This is your number.', 'זה המספר שלך.'],
    ' También te los enviamos por correo.': [' We also emailed them to you.', ' שלחנו לכם אותם גם במייל.'],
    'Pago en proceso': ['Payment in progress', 'התשלום בתהליך'],
    'En cuanto se confirme te enviaremos tus números por correo.': ['As soon as it is confirmed we will email you your numbers.', 'ברגע שיאושר נשלח לכם את המספרים במייל.'],
    'Te enviaremos tus números de boleto por correo.': ['We will email you your ticket numbers.', 'נשלח לכם את מספרי הכרטיסים במייל.'],

    // ---- muro.html
    '¿Cómo quieres aparecer?': ['How would you like to appear?', 'איך תרצו להופיע?'],
    'Aparecer en el muro': ['Appear on the wall', 'הופעה על הקיר'],
    'Así se verá': ['This is how it will look', 'כך זה ייראה'],
    'Guardar': ['Save', 'שמירה'],
    'Guardando…': ['Saving…', 'שומר…'],
    '¡Listo, gracias!': ['Done, thank you!', 'מעולה, תודה!'],
    'Ver el muro': ['See the wall', 'לקיר המשתתפים'],
    'Este link no es válido. Revisa el correo que te enviamos.': ['This link is not valid. Check the email we sent you.', 'הקישור אינו תקין. בדקו את המייל ששלחנו לכם.'],
    'Este link no es válido.': ['This link is not valid.', 'הקישור אינו תקין.'],
    'Boleto {f}': ['Ticket {f}', 'כרטיס {f}'],
    'No pudimos cargar tu boleto. Intenta de nuevo en un momento.': ['We could not load your ticket. Please try again in a moment.', 'לא הצלחנו לטעון את הכרטיס. נסו שוב בעוד רגע.'],
    'Escribe a nombre de quién quieres aparecer.': ['Write whose name you want to appear under.', 'כתבו על שם מי תרצו להופיע.'],
    'Ya apareces en el muro de participantes.': ['You now appear on the wall of participants.', 'אתם מופיעים כעת על קיר המשתתפים.'],
    'Aparecerás en el muro en cuanto tu boleto quede liquidado.': ['You will appear on the wall once your ticket is fully paid.', 'תופיעו על הקיר ברגע שהכרטיס ישולם במלואו.'],
    'No se pudo guardar. Intenta de nuevo.': ['Could not save. Please try again.', 'לא הצלחנו לשמור. נסו שוב.']
  };

  /* ---------- 3) traducir ---------- */
  var IDX = { en: 0, he: 1 };
  function T(s, vars) {
    var out = s;
    if (LANG !== 'es' && DICT[s]) out = DICT[s][IDX[LANG]];
    if (vars) Object.keys(vars).forEach(function (k) { out = out.split('{' + k + '}').join(vars[k]); });
    return out;
  }
  window.T = T;
  window.RIFA_LANG = LANG;
  window.RIFA_LOCALE = LANG === 'he' ? 'he-IL' : (LANG === 'en' ? 'en-US' : 'es-MX');

  function norm(x) { return x.replace(/\s+/g, ' ').trim(); }
  function traducirNodo(root) {
    if (LANG === 'es') return;
    // elementos con clave fija
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = '@' + el.getAttribute('data-i18n'); if (DICT[k]) el.textContent = DICT[k][IDX[LANG]];
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = '@' + el.getAttribute('data-i18n-html'); if (DICT[k]) el.innerHTML = DICT[k][IDX[LANG]];
    });
    // las opciones conservan su valor original (es lo que se guarda en la hoja)
    root.querySelectorAll('option').forEach(function (o) { if (!o.hasAttribute('value')) o.setAttribute('value', o.textContent); });
    // textos
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.nodeName) || (p.closest && p.closest('[data-i18n],[data-i18n-html],svg'))) return NodeFilter.FILTER_REJECT;
        return norm(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(function (n) {
      var k = norm(n.nodeValue);
      if (DICT[k]) {
        var lead = /^\s/.test(n.nodeValue) ? ' ' : '', trail = /\s$/.test(n.nodeValue) ? ' ' : '';
        n.nodeValue = lead + DICT[k][IDX[LANG]] + trail;
      }
    });
    // atributos
    root.querySelectorAll('[placeholder],[alt],[title],[aria-label]').forEach(function (el) {
      ['placeholder', 'alt', 'title', 'aria-label'].forEach(function (a) {
        var v = el.getAttribute(a); if (v && DICT[norm(v)]) el.setAttribute(a, DICT[norm(v)][IDX[LANG]]);
      });
    });
  }
  window.traducir = traducirNodo;

  /* ---------- 4) aplicar a la página ---------- */
  var html = document.documentElement;
  html.lang = LANG;
  html.dir = LANG === 'he' ? 'rtl' : 'ltr';
  if (LANG !== 'es') {
    var t = norm(document.title); if (DICT[t]) document.title = DICT[t][IDX[LANG]];
    var md = document.querySelector('meta[name=description]');
    if (md) {
      var d = norm(md.content);
      var desc = { en: 'Or Barak Grand Raffle 2026: a Mazda 2 for the buyer and another Mazda 2 for whoever sold the winning ticket. Tickets at $6,000 MXN. Draw on December 10, 2026.', he: 'ההגרלה הגדולה של אור ברק 2026: מאזדה 2 לקונה ועוד מאזדה 2 למי שמכר את הכרטיס הזוכה. כרטיסים ב־6,000 פסו. ההגרלה ב־10 בדצמבר 2026.' };
      if (d.indexOf('Gran Rifa') === 0) md.content = desc[LANG];
    }
  }
  if (LANG === 'he') {
    var lk = document.createElement('link'); lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600&display=swap';
    document.head.appendChild(lk);
    var st = document.createElement('style');
    st.textContent =
      'html[dir=rtl] body{font-family:"Heebo","Jost",system-ui,sans-serif}html[dir=rtl] *{letter-spacing:0!important}' +
      'html[dir=rtl] .eyebrow,html[dir=rtl] .label,html[dir=rtl] .gold-title,html[dir=rtl] .opt h2{letter-spacing:.04em}' +
      'html[dir=rtl] .headline{letter-spacing:0}' +
      'html[dir=rtl] .checks li,html[dir=rtl] .bases-list li{text-align:right}' +
      'html[dir=rtl] input[type=tel],html[dir=rtl] input[type=email],html[dir=rtl] #sLink,html[dir=rtl] .linkbox{direction:ltr;text-align:right}' +
      'html[dir=rtl] .sum .amt{text-align:left}html[dir=rtl] .dato b{text-align:left}';
    document.head.appendChild(st);
  }
  traducirNodo(document.body);

  /* ---------- 5) selector de idioma ---------- */
  var sw = document.createElement('div');
  sw.className = 'lang-switch';
  sw.setAttribute('aria-label', 'Idioma / Language / שפה');
  [['es', 'ES'], ['en', 'EN'], ['he', 'עב']].forEach(function (p) {
    var a = document.createElement('a');
    a.href = '#'; a.textContent = p[1]; a.setAttribute('lang', p[0]);
    if (p[0] === LANG) a.className = 'on';
    a.addEventListener('click', function (e) {
      e.preventDefault(); guardar(p[0]);
      var u = new URL(location.href); u.searchParams.delete('lang'); location.href = u.toString();
    });
    sw.appendChild(a);
  });
  var css = document.createElement('style');
  css.textContent = '.lang-switch{position:fixed;top:74px;right:12px;z-index:60;display:flex;gap:2px;background:rgba(10,9,8,.82);border:1px solid rgba(210,164,92,.35);border-radius:999px;padding:3px;backdrop-filter:blur(6px);font-size:12px}' +
    '.lang-switch a{color:#cbb48a;text-decoration:none;padding:5px 9px;border-radius:999px;letter-spacing:.08em}' +
    '.lang-switch a.on{background:rgba(210,164,92,.22);color:#f4e3c1}' +
    'html[dir=rtl] .lang-switch{right:auto;left:12px}';
  document.head.appendChild(css);
  document.body.appendChild(sw);
})();
