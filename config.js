/* ============================================================
   CONFIGURACIÓN DE LA RIFA — único archivo que hay que editar
   ============================================================ */
window.RIFA = {
  // URL del Web App de Apps Script (termina en /exec). Mientras esté vacía,
  // la página cobra con el Payment Link de Stripe y el contador queda en modo local.
  API_URL: '',

  // Payment Link de Stripe (respaldo cuando no hay API_URL)
  STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/9B600kahi5kH9bJ4G12Fa0i',

  NOMBRE: 'Gran Rifa Or Barak 2026',
  PRECIO: 6000,            // MXN por boleto
  TOTAL_BOLETOS: 1000,
  MAX_POR_VENDEDOR: 50,
  MAX_POR_COMPRA: 10,
  SORTEO_ISO: '2026-12-10T20:00:00-06:00', // fecha y hora del sorteo (hora de CDMX)

  WHATSAPP: '525539896174',               // con 52 al inicio
  CORREO_COMPROBANTES: 'oficina.orbarak@gmail.com',
  FORM_VENDER_URL: 'https://forms.gle/18wzcdVxpph7ZfBd9',
  FORM_CONSULTA_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSevM2e1xbVzR7wyVCy4TU_xOfLra_wcewVsmEG2f5A85tqcHQ/viewform',

  // Número de permiso de la Dirección General de Juegos y Sorteos (SEGOB).
  // Se muestra en el pie de página cuando se llena.
  PERMISO_SEGOB: '',
  BASES_URL: '' // liga opcional al documento completo de bases
};
