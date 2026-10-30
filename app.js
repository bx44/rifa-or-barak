(function () {
  'use strict';
  const C = window.RIFA;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('es-MX');
  const money = (n) => '$' + n.toLocaleString('es-MX') + ' MXN';
  const params = new URLSearchParams(location.search);
  const HAS_API = !!C.API_URL;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const cleanCode = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40);

  async function apiGet(action, extra) {
    const q = new URLSearchParams(Object.assign({ action }, extra || {}));
    const r = await fetch(C.API_URL + '?' + q.toString());
    return r.json();
  }
  async function apiPost(body) {
    const r = await fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    return r.json();
  }

  /* ---------- enlaces de config ---------- */
  const waLink = (text) => 'https://wa.me/' + C.WHATSAPP + (text ? '?text=' + encodeURIComponent(text) : '');
  $('waTransfer').href = waLink('Hola, quiero comprar un boleto de la ' + C.NOMBRE + ' por transferencia.');
  $('btnRegistro').href = C.FORM_VENDER_URL;
  $('btnWaVend').href = waLink('Hola, quiero ser vendedor de la ' + C.NOMBRE + '.');
  document.querySelectorAll('.js-wa').forEach((a) => (a.href = waLink('Hola, tengo una pregunta sobre la ' + C.NOMBRE + '.')));
  document.querySelectorAll('.js-consulta').forEach((a) => (a.href = C.FORM_CONSULTA_URL));
  document.querySelectorAll('.js-mail').forEach((s) => (s.textContent = C.CORREO_COMPROBANTES));
  if (C.BASES_URL) { $('basesLink').href = C.BASES_URL; $('basesLink').hidden = false; }
  $('permiso').textContent = C.PERMISO_SEGOB ? 'Permiso SEGOB: ' + C.PERMISO_SEGOB : '';
  $('cTotal').textContent = fmt(C.TOTAL_BOLETOS);

  /* ---------- nav / scroll ---------- */
  const nav = $('nav'), floatCta = $('floatCta'), buy = $('comprar');
  let buyVisible = false;
  new IntersectionObserver((es) => { buyVisible = es[0].isIntersecting; onScroll(); }, { threshold: 0.05 }).observe(buy);
  function onScroll() {
    nav.classList.toggle('scrolled', scrollY > 10);
    floatCta.classList.toggle('show', scrollY > window.innerHeight * 0.8 && !buyVisible);
  }
  addEventListener('scroll', onScroll, { passive: true });

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- cuenta regresiva ---------- */
  const target = new Date(C.SORTEO_ISO).getTime();
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    $('cdD').textContent = pad(Math.floor(s / 86400)); s %= 86400;
    $('cdH').textContent = pad(Math.floor(s / 3600)); s %= 3600;
    $('cdM').textContent = pad(Math.floor(s / 60));
    $('cdS').textContent = pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- contador ---------- */
  function animateNumber(el, to) {
    const t0 = performance.now(), dur = 1400;
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  let stats = null;
  function renderStats(s) {
    stats = s;
    const total = s.total || C.TOTAL_BOLETOS;
    animateNumber($('cSold'), s.vendidos);
    $('cBar').style.width = Math.min(100, (s.vendidos / total) * 100) + '%';
    const left = Math.max(0, total - s.vendidos);
    $('cLeft').textContent = left === 0 ? 'Boletos agotados.' : 'Quedan ' + fmt(left) + ' boletos de ' + fmt(total) + '.';
  }
  async function loadStats() {
    if (!HAS_API) {
      $('cSold').textContent = '0';
      $('cLeft').textContent = fmt(C.TOTAL_BOLETOS) + ' boletos disponibles.';
      return;
    }
    try { const s = await apiGet('stats'); if (s.ok) renderStats(s); }
    catch (e) { $('cLeft').textContent = fmt(C.TOTAL_BOLETOS) + ' boletos en total.'; }
  }
  loadStats();
  if (HAS_API) setInterval(loadStats, 60000);

  /* ---------- vendedor (link de referido) ---------- */
  const sellerCache = {};
  async function lookupSeller(code) {
    if (!HAS_API || !code) return null;
    if (sellerCache[code]) return sellerCache[code];
    try { const r = await apiGet('vendedor', { codigo: code }); sellerCache[code] = r; return r; }
    catch (e) { return null; }
  }

  const fVend = $('fVend'), vendHint = $('vendHint');
  let vendTimer, vendValid = true;
  let refCode = cleanCode(params.get('v') || params.get('ref'));
  if (refCode) store.set('rifa_ref', refCode); else refCode = cleanCode(store.get('rifa_ref'));
  if (refCode) {
    fVend.value = refCode;
    validateVend();
    lookupSeller(refCode).then((r) => {
      $('sellerStrip').hidden = false;
      $('sellerStripName').textContent = r && r.ok ? r.nombre : refCode;
    });
  }

  fVend.addEventListener('input', () => { fVend.value = cleanCode(fVend.value); clearTimeout(vendTimer); vendTimer = setTimeout(validateVend, 450); });
  async function validateVend() {
    const code = cleanCode(fVend.value);
    vendHint.className = 'hint'; vendHint.textContent = ''; vendValid = true; fVend.classList.remove('err');
    if (!code || !HAS_API) return;
    vendHint.textContent = 'Verificando…';
    const r = await lookupSeller(code);
    if (cleanCode(fVend.value) !== code) return;
    if (r && r.ok) { vendHint.className = 'hint ok'; vendHint.textContent = 'Vendedor: ' + r.nombre; }
    else if (r) { vendValid = false; vendHint.className = 'hint bad'; vendHint.textContent = 'Código no encontrado.'; fVend.classList.add('err'); }
    else { vendHint.textContent = ''; }
  }

  /* ---------- cantidad / total ---------- */
  let qty = 1;
  function setQty(n) { qty = Math.max(1, Math.min(C.MAX_POR_COMPRA, n)); $('qVal').textContent = qty; $('totalVal').textContent = money(qty * C.PRECIO); }
  $('qMinus').onclick = () => setQty(qty - 1);
  $('qPlus').onclick = () => setQty(qty + 1);
  setQty(1);
  if (params.get('cancelado')) { $('formMsg').textContent = 'El pago no se completó. Puedes intentarlo de nuevo.'; }

  /* ---------- compra ---------- */
  const form = $('buyForm'), payBtn = $('payBtn'), msg = $('formMsg');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg.textContent = '';
    const data = {
      action: 'checkout',
      nombre: $('fNombre').value.trim(),
      correo: $('fCorreo').value.trim(),
      telefono: $('fTel').value.replace(/[^\d+]/g, ''),
      cantidad: qty,
      vendedor: cleanCode(fVend.value)
    };
    const bad = [];
    if (data.nombre.length < 3) bad.push('fNombre');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.correo)) bad.push('fCorreo');
    if (data.telefono.replace(/\D/g, '').length < 10) bad.push('fTel');
    ['fNombre', 'fCorreo', 'fTel'].forEach((id) => $(id).classList.toggle('err', bad.includes(id)));
    if (bad.length) { msg.textContent = 'Revisa los campos marcados.'; return; }
    if (!vendValid) { msg.textContent = 'El código de vendedor no es válido. Corrígelo o déjalo vacío.'; return; }
    if (!$('fAcepto').checked) { msg.textContent = 'Debes aceptar las bases del sorteo.'; return; }

    payBtn.disabled = true; const label = payBtn.innerHTML; payBtn.textContent = 'Conectando con Stripe…';
    try {
      if (HAS_API) {
        const r = await apiPost(data);
        if (!r.ok) throw new Error(r.error || 'No se pudo iniciar el pago.');
        location.href = r.url;
        return;
      }
      // Respaldo: Payment Link de Stripe (la cantidad se elige dentro de Stripe)
      const u = new URL(C.STRIPE_PAYMENT_LINK);
      u.searchParams.set('prefilled_email', data.correo);
      u.searchParams.set('locale', 'es');
      if (data.vendedor) u.searchParams.set('client_reference_id', data.vendedor);
      location.href = u.toString();
    } catch (e) {
      msg.textContent = e.message || 'Ocurrió un error. Intenta de nuevo.';
      payBtn.disabled = false; payBtn.innerHTML = label;
    }
  });

  /* ---------- herramientas de vendedor ---------- */
  const sCode = $('sCode');
  const baseUrl = location.origin + location.pathname.replace(/index\.html$/, '');
  let sTimer;
  sCode.addEventListener('input', () => { sCode.value = cleanCode(sCode.value); clearTimeout(sTimer); sTimer = setTimeout(renderSellerTools, 450); });
  async function renderSellerTools() {
    const code = cleanCode(sCode.value);
    $('sellerOut').hidden = !code;
    if (!code) return;
    const link = baseUrl + '?v=' + encodeURIComponent(code);
    $('sLink').textContent = link;
    $('sWa').href = 'https://wa.me/?text=' + encodeURIComponent(
      'Un solo boleto. Dos ganadores. 🚗🚗\nParticipa en la ' + C.NOMBRE + ': un Mazda 2 para el comprador y otro para quien vende el boleto ganador. Sorteo 10 de diciembre.\n' + link);
    $('sName').textContent = ''; $('sProgWrap').hidden = true;
    const r = await lookupSeller(code);
    if (cleanCode(sCode.value) !== code) return;
    if (r && r.ok) {
      $('sName').textContent = r.nombre;
      $('sProgWrap').hidden = false;
      $('sBar').style.width = Math.min(100, (r.vendidos / r.max) * 100) + '%';
      $('sCount').textContent = r.vendidos + ' de ' + r.max + ' boletos vendidos';
    } else if (r) {
      $('sName').textContent = 'Este código aún no está registrado.';
    }
  }
  $('sCopy').onclick = async () => {
    const t = $('sLink').textContent;
    try { await navigator.clipboard.writeText(t); } catch (e) {
      const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    $('sCopy').textContent = '¡Copiado!'; setTimeout(() => ($('sCopy').textContent = 'Copiar link'), 1800);
  };
})();
