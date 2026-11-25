/* ============================================================
   CONFIGURACIÓN DE LA RIFA — único archivo que hay que editar
   ============================================================ */
window.RIFA = {
  // Implementación PÚBLICA del script de la rifa (la misma que usa el Worker de Cloudflare).
  // La página registra la venta en tus hojas y manda al pago del Worker (saldo exacto, Stripe).
  API_URL: 'https://script.google.com/macros/s/AKfycbwWEQPMKoBdrx0dzhpzNZ2UAOTTS-ga3-jCmE8n8tQzQiXJrPmnF3zq-TtjjtEqCMNhJA/exec',

  // Payment Link de Stripe (respaldo cuando no hay API_URL)
  STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/9B600kahi5kH9bJ4G12Fa0i',

  NOMBRE: 'Gran Rifa Or Barak 2026',
  PRECIO: 6000,            // MXN por boleto
  TOTAL_BOLETOS: 1000,
  MAX_POR_VENDEDOR: 50,
  MAX_POR_COMPRA: 1,       // cada compra = 1 folio (el Worker cobra por folio)
  SORTEO_ISO: '2026-12-10T20:00:00-06:00', // fecha y hora del sorteo (hora de CDMX)

  WHATSAPP: '526572871690',               // con 52 al inicio
  CORREO_COMPROBANTES: 'contacto@orbarakmx.com',
  FORM_VENDER_URL: 'https://forms.gle/18wzcdVxpph7ZfBd9',
  FORM_CONSULTA_URL: 'consulta/',

  // Quiénes compiten por los premios del vendedor en la pantalla del evento.
  // Sólo alumnos y exalumnos de Or Barak: los demás (maestros, papás, la
  // dirección) sí suman para la meta del día y sí salen en "Últimas ventas",
  // pero no aparecen en el ranking ni acumulan para AirPods, dron, etc.
  //
  // Los nombres van tal como quedan en la hoja COMPRADORES. No importan
  // acentos ni mayúsculas. Si la lista se deja vacía, el ranking cae en su
  // regla de respaldo: todos menos el administrador, para que nunca se vea
  // vacío por un olvido.
  ALUMNOS: [],

  // Número de permiso de la Dirección General de Juegos y Sorteos (SEGOB).
  // Se muestra en el pie de página cuando se llena.
  PERMISO_SEGOB: '',
  BASES_URL: '' // liga opcional al documento completo de bases
};
