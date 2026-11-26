(function () {
  'use strict';
  const C = window.RIFA;
  const $ = (id) => document.getElementById(id);
  const T = window.T || ((s, v) => { let o = s; if (v) Object.keys(v).forEach((k) => { o = o.split('{' + k + '}').join(v[k]); }); return o; });
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
    const q = new URLSearchParams(Object.assign({ accion: 'web', op: action }, extra || {}));
    const r = await fetch(C.API_URL + '?' + q.toString());
    return r.json();
  }
  async function apiPost(body) {
    const r = await fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    return r.json();
  }

  /* ---------- enlaces de config ---------- */
  const waLink = (text) => 'https://wa.me/' + C.WHATSAPP + (text ? '?text=' + encodeURIComponent(text) : '');
  $('waTransfer').href = waLink(T('Hola, quiero comprar un boleto de la {r} por transferencia.', { r: T(C.NOMBRE) }));
  $('btnRegistro').href = waLink(T('Hola, quiero registrarme como vendedor de la {r}.', { r: T(C.NOMBRE) }));
  document.querySelectorAll('.js-wa').forEach((a) => (a.href = waLink(T('Hola, tengo una pregunta sobre la {r}.', { r: T(C.NOMBRE) }))));
  document.querySelectorAll('.js-consulta').forEach((a) => (a.href = C.FORM_CONSULTA_URL));
  document.querySelectorAll('.js-mail').forEach((s) => (s.textContent = C.CORREO_COMPROBANTES));
  if (C.BASES_URL) { $('basesLink').href = C.BASES_URL; $('basesLink').hidden = false; }
  $('permiso').textContent = C.PERMISO_SEGOB ? T('Permiso SEGOB: {p}', { p: C.PERMISO_SEGOB }) : '';

  /* ---------- reintenta imágenes que fallan (red móvil inestable) ---------- */
  document.querySelectorAll('img').forEach((img) => {
    let intentos = 0;
    const reintentar = () => {
      if (intentos++ >= 3) return;
      const base = img.getAttribute('src').split('?')[0];
      setTimeout(() => { img.src = base + '?r=' + Date.now(); }, 800 * intentos);
    };
    img.addEventListener('error', reintentar);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') reintentar();
  });

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

  /* ---------- embudo: visita / empezó a llenar (sin datos personales) ---------- */
  function evento(e) {
    if (!HAS_API) return;
    const k = 'rifa_ev_' + e;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (x) {}
    const q = new URLSearchParams({ accion: 'web', op: 'evento', e: e, v: cleanCode(params.get('v') || params.get('ref') || store.get('rifa_ref') || '') });
    fetch(C.API_URL + '?' + q.toString(), { keepalive: true }).catch(() => {});
  }
  evento('visita');
  // Clic desde el correo de invitación: se anota quién llegó (una vez por sesión)
  (function () {
    const c = (params.get('c') || '').replace(/[^0-9a-f]/g, '').slice(0, 12);
    if (!c || !HAS_API) return;
    try { if (sessionStorage.getItem('rifa_c_' + c)) return; sessionStorage.setItem('rifa_c_' + c, '1'); } catch (x) {}
    fetch(C.API_URL + '?' + new URLSearchParams({ accion: 'web', op: 'evento', e: 'correo', ck: c }).toString(), { keepalive: true }).catch(() => {});
  })();
  document.getElementById('buyForm').addEventListener('focusin', () => evento('inicio'), { once: true });

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
  // La barra no se mide contra los 1000 boletos (se vería siempre vacía):
  // se mide contra la siguiente meta, DESDE CERO.
  //
  // Antes se medía desde la meta anterior: con 51 boletos daba 37 %, porque
  // apenas iba 1 de los 25 que van del 50 al 75. Dos cosas estaban mal.
  // Una, que quien lo ve lee "51" y "meta 75" y espera ver dos terceras
  // partes. Dos, y peor: la barra RETROCEDÍA al cruzar cada meta — a los 74
  // boletos estaba casi llena y a los 76 se caía al 37 % otra vez. En una
  // página de donadores eso hace ver que la campaña va para atrás justo
  // cuando acaba de lograr algo.
  const METAS = [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];
  function renderStats(s) {
    stats = s;
    const v = Number(s.vendidos) || 0;
    animateNumber($('cSold'), v);
    const meta = METAS.find((m) => m > v);
    if (meta) {
      // Un mínimo chico para que con pocos boletos se vea una rayita y no
      // una barra vacía. Chico a propósito: 4 % se lee como "va empezando",
      // que es la verdad.
      const pct = v ? Math.max(4, 100 * v / meta) : 0;
      $('cBar').style.width = Math.min(100, pct) + '%';
      $('cLeft').textContent = T('{a} de {b} boletos — próxima meta',
                                 { a: fmt(v), b: fmt(meta) });
    } else {
      $('cBar').style.width = '100%';
      $('cLeft').textContent = T('¡Seguimos sumando!');
    }
  }
  async function loadStats() {
    if (!HAS_API) { $('cSold').textContent = '0'; $('cLeft').textContent = ''; return; }
    try { const s = await apiGet('stats'); if (s.ok) renderStats(s); }
    catch (e) { $('cLeft').textContent = ''; }
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
  // El código del vendedor se recuerda 30 días desde la última vez que se abrió su link.
  const REF_DIAS = 30;
  let refCode = cleanCode(params.get('v') || params.get('ref'));
  if (refCode) { store.set('rifa_ref', refCode); store.set('rifa_ref_t', String(Date.now())); }
  else {
    refCode = cleanCode(store.get('rifa_ref'));
    const t = Number(store.get('rifa_ref_t') || 0);
    if (refCode && !t) store.set('rifa_ref_t', String(Date.now()));              // links abiertos antes de este cambio
    else if (refCode && Date.now() - t > REF_DIAS * 864e5) { refCode = ''; store.set('rifa_ref', ''); }
  }
  $('sellerStripX').addEventListener('click', () => {
    store.set('rifa_ref', ''); store.set('rifa_ref_t', '');
    refCode = ''; fVend.value = ''; validateVend();
    $('sellerStrip').hidden = true;
  });
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
    vendHint.textContent = T('Verificando…');
    const r = await lookupSeller(code);
    if (cleanCode(fVend.value) !== code) return;
    if (r && r.ok) { vendHint.className = 'hint ok'; vendHint.textContent = T('Vendedor: {n}', { n: r.nombre }); }
    else if (r) { vendValid = false; vendHint.className = 'hint bad'; vendHint.textContent = T('Código no encontrado.'); fVend.classList.add('err'); }
    else { vendHint.textContent = ''; }
  }

  /* ---------- cuántos boletos ---------- */
  const MAX_CANT = 10;
  const elCant = $('fCant');
  const cantidad = () => Math.min(MAX_CANT, Math.max(1, Math.round(Number(elCant && elCant.value) || 1)));

  function pintarTotal() {
    const n = cantidad();
    if (elCant) elCant.value = n;
    const precio = Number(C.PRECIO) || 6000;
    const lbl = $('totalLbl'), val = $('totalVal');
    if (lbl) lbl.textContent = n === 1 ? T('1 boleto') : T('{n} boletos', { n: n });
    if (val) val.textContent = '$' + (precio * n).toLocaleString('es-MX') + ' MXN';
    const menos = $('qMenos'), mas = $('qMas');
    if (menos) menos.disabled = n <= 1;
    if (mas) mas.disabled = n >= MAX_CANT;
  }
  if (elCant) {
    const mover = (d) => { elCant.value = cantidad() + d; pintarTotal(); };
    if ($('qMenos')) $('qMenos').addEventListener('click', () => mover(-1));
    if ($('qMas')) $('qMas').addEventListener('click', () => mover(1));
    elCant.addEventListener('input', pintarTotal);
    elCant.addEventListener('blur', pintarTotal);
    pintarTotal();
  }

  if (params.get('cancelado')) { $('formMsg').textContent = T('El pago no se completó. Puedes intentarlo de nuevo.'); }

  /* ---------- compra ---------- */

  // Cada boleto se aparta con su propia llamada y regresa su liga de pago
  // firmada. Para pagar todos juntos se juntan los folios y sus firmas en una
  // sola liga: la página de pago las vuelve a separar y suma los saldos.
  function urlDePago(rs) {
    if (rs.length === 1) return rs[0].pagoUrl;
    try {
      const u = new URL(rs[0].pagoUrl, location.href);
      const fs = [], ts = [];
      rs.forEach((r) => {
        const x = new URL(r.pagoUrl, location.href);
        fs.push(x.searchParams.get('f') || '');
        ts.push(x.searchParams.get('t') || '');
      });
      u.searchParams.set('f', fs.join(','));
      u.searchParams.set('t', ts.join(','));
      return u.toString();
    } catch (e) {
      return rs[0].pagoUrl;   // si algo sale raro, al menos que pague el primero
    }
  }

  function showFolio(rs, pedidos) {
    const lista = [].concat(rs);
    const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const nums = lista.map((r) => String(r.folio).padStart(4, '0'));
    const ov = document.createElement('div');
    ov.className = 'folio-overlay';

    const titulo = lista.length === 1 ? T('Boleto apartado') : T('{n} boletos apartados', { n: lista.length });
    const chico = lista.length > 2 ? ' style="font-size:clamp(28px,7vw,54px);letter-spacing:.02em"' : '';
    const cuerpo = '<div class="tk-big"><small>' +
      (lista.length === 1 ? T('Tu número') : T('Tus números')) + '</small><b' + chico + '>' +
      nums.join('<span style="opacity:.4"> · </span>') + '</b></div>';

    // Si se pidieron 3 y sólo salieron 2, se dice. Callarlo sería peor: el
    // comprador cree que pagó por tres.
    const incompleto = pedidos && lista.length < pedidos
      ? '<p class="muted small" style="color:#e9b949">' +
        T('Pediste {p} y sólo alcanzamos a apartar {q}. Si querías más, escríbenos.', { p: pedidos, q: lista.length }) +
        '</p>' : '';

    ov.innerHTML = '<div class="folio-card"><p class="eyebrow">' + titulo + '</p>' + cuerpo +
      '<p>' + T('{n}, ahora elige cómo pagar: tarjeta, transferencia o efectivo…', { n: esc((lista[0].nombre || '').split(' ')[0]) }) + '</p>' +
      incompleto +
      '<p class="muted small">' + (lista.length === 1
        ? T('También te enviamos tu número y tu liga de pago por correo.')
        : T('También te enviamos tus números y tu liga de pago por correo.')) + '</p>' +
      '<a class="btn" href="' + esc(urlDePago(lista)) + '">' + T('Ver formas de pago') + '</a></div>';
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('show'));
  }
  const form = $('buyForm'), payBtn = $('payBtn'), msg = $('formMsg');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg.textContent = '';
    const data = {
      accion: 'web_comprar',
      nombre: $('fNombre').value.trim(),
      correo: $('fCorreo').value.trim(),
      telefono: $('fTel').value.replace(/[^\d+]/g, ''),
      vendedor: cleanCode(fVend.value),
      modo: (document.querySelector('input[name=modo]:checked') || {}).value || 'nombre',
      aNombre: $('fANombre').value.trim(),
      dedTipo: $('fDedTipo').value,
      dedTexto: $('fDedTexto').value.trim(),
      web_hp: $('fHp').value,
      lang: (document.documentElement.lang || 'es').slice(0, 2)
    };
    const bad = [];
    if (data.nombre.length < 3) bad.push('fNombre');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.correo)) bad.push('fCorreo');
    if (data.telefono.replace(/\D/g, '').length < 10) bad.push('fTel');
    ['fNombre', 'fCorreo', 'fTel'].forEach((id) => $(id).classList.toggle('err', bad.includes(id)));
    if (bad.length) { msg.textContent = T('Revisa los campos marcados.'); return; }
    const modoSel = (document.querySelector('input[name=modo]:checked') || {}).value;
    if (modoSel === 'otro' && data.aNombre.length < 2) { $('fANombre').classList.add('err'); msg.textContent = T('Escribe a nombre de quién quieres el boleto.'); return; }
    if (data.dedTipo && data.dedTexto.length < 2) { $('fDedTexto').classList.add('err'); msg.textContent = T('Completa la dedicatoria (por ejemplo, el nombre).'); return; }
    if (!vendValid) { msg.textContent = T('El código de vendedor no es válido. Corrígelo o déjalo vacío.'); return; }
    if (!$('fAcepto').checked) { msg.textContent = T('Debes aceptar las bases del sorteo.'); return; }

    payBtn.disabled = true; const label = payBtn.innerHTML; payBtn.textContent = T('Conectando con Stripe…');
    try {
      if (HAS_API) {
        const n = cantidad();
        // Uno por uno y en orden: si se mandaran en paralelo, dos llamadas
        // pueden pelearse el mismo folio.
        const hechos = [];
        let fallo = null;
        for (let i = 0; i < n; i++) {
          if (n > 1) payBtn.textContent = T('Apartando el boleto {i} de {n}…', { i: i + 1, n: n });
          try {
            const r = await apiPost(data);
            if (!r.ok) { fallo = r.error; break; }
            hechos.push(r);
          } catch (err) { fallo = err.message; break; }
        }
        // Si no salió ni uno, es un error de verdad. Si salieron algunos, se
        // sigue con esos y se le dice cuántos quedaron.
        if (!hechos.length) throw new Error(fallo || T('No se pudo registrar tu boleto.'));
        showFolio(hechos, n);
        setTimeout(() => { location.href = urlDePago(hechos); }, hechos.length > 1 ? 3800 : 2600);
        return;
      }
      // Respaldo sin backend: Payment Link de Stripe
      const u = new URL(C.STRIPE_PAYMENT_LINK);
      u.searchParams.set('prefilled_email', data.correo);
      u.searchParams.set('locale', window.RIFA_LANG || 'es');
      if (data.vendedor) u.searchParams.set('client_reference_id', data.vendedor);
      location.href = u.toString();
    } catch (e) {
      msg.textContent = e.message || T('Ocurrió un error. Intenta de nuevo.');
      payBtn.disabled = false; payBtn.innerHTML = label;
    }
  });

  /* ---------- opciones de muro / dedicatoria ---------- */
  document.querySelectorAll('input[name=modo]').forEach((r) => r.addEventListener('change', () => {
    const otro = document.querySelector('input[name=modo]:checked').value === 'otro';
    $('fANombre').hidden = !otro; if (otro) $('fANombre').focus();
  }));
  $('fDedTipo').addEventListener('change', () => {
    const t = $('fDedTipo').value;
    $('fDedTexto').hidden = !t;
    $('fDedTexto').placeholder = T(t === 'Otra' ? 'Escribe tu dedicatoria' : (t === 'En honor de' || t === 'Hatzlajá' || t === 'Zivug Hagún' ? 'Ej. Familia Cohen' : 'Ej. Moshe ben Sara'));
    if (t) $('fDedTexto').focus();
  });

  /* ---------- muro de participantes ---------- */
  function haceCuanto(t) {
    const m = Math.max(1, Math.round((Date.now() - t) / 60000));
    if (m < 60) return T('hace {n} min', { n: m });
    const h = Math.round(m / 60); if (h < 24) return h === 1 ? T('hace 1 hora') : T('hace {n} horas', { n: h });
    const d = Math.round(h / 24); return d === 1 ? T('hace 1 día') : T('hace {n} días', { n: d });
  }
  function iniciales(n) { return n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); }
  let muroItems = [], muroShown = 0;
  function pintarMuro(n) {
    const grid = $('wallGrid');
    muroItems.slice(muroShown, muroShown + n).forEach((it, i) => {
      const card = document.createElement('div'); card.className = 'wall-card'; card.style.animationDelay = (i * 0.04) + 's';
      const av = document.createElement('div'); av.className = 'wall-av' + (it.anon ? ' anon' : '');
      av.textContent = it.anon ? '✦' : iniciales(it.nombre);
      const body = document.createElement('div');
      const nm = document.createElement('p'); nm.className = 'wall-name'; nm.textContent = it.nombre; body.appendChild(nm);
      if (it.n > 1) { const nb = document.createElement('p'); nb.className = 'wall-time'; nb.textContent = T('{n} boletos', { n: it.n }); body.appendChild(nb); }
      if (it.dedTipo && it.dedTexto) {
        const dd = document.createElement('p'); dd.className = 'wall-ded';
        if (it.dedTipo === 'Otra') { dd.textContent = it.dedTexto; }
        else { const b = document.createElement('b'); b.textContent = T(it.dedTipo) + ' '; dd.appendChild(b); dd.appendChild(document.createTextNode(it.dedTexto)); }
        body.appendChild(dd);
      }
      const tm = document.createElement('p'); tm.className = 'wall-time'; tm.textContent = haceCuanto(it.t); body.appendChild(tm);
      card.appendChild(av); card.appendChild(body); grid.appendChild(card);
    });
    muroShown = Math.min(muroItems.length, muroShown + n);
    $('wallMore').hidden = muroShown >= muroItems.length;
  }
  $('wallMore').onclick = () => pintarMuro(12);
  // El muro se vuelve a consultar solo cada 30 segundos (y al regresar a la
  // pestaña). Si hay compras nuevas se repinta conservando cuántas tarjetas
  // tenía abiertas la persona; si no cambió nada, sólo se actualiza el "hace X min".
  let muroFirma = '';
  async function cargarMuro() {
    if (!HAS_API) return;
    try {
      const r = await apiGet('muro');
      if (!r.ok || !r.items.length) return;
      const firma = r.total + '|' + r.items.map((i) => i.t + ':' + i.n + ':' + i.nombre).join(',');
      $('muro').hidden = false;
      $('wallCount').textContent = r.total === 1 ? T('1 persona ya tiene su boleto.') : T('{n} personas ya tienen su boleto.', { n: r.total });
      const abiertas = Math.max(muroShown, window.innerWidth < 700 ? 6 : 12);
      muroItems = r.items;
      if (firma === muroFirma) {
        // nada nuevo: sólo refrescar los tiempos
        $('wallGrid').querySelectorAll('.wall-card').forEach((c, i) => {
          const ts = c.querySelectorAll('.wall-time'); if (ts.length && muroItems[i]) ts[ts.length - 1].textContent = haceCuanto(muroItems[i].t);
        });
        return;
      }
      muroFirma = firma;
      $('wallGrid').innerHTML = '';
      muroShown = 0;
      pintarMuro(abiertas);
    } catch (e) {}
  }
  cargarMuro();
  setInterval(() => { if (!document.hidden) cargarMuro(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cargarMuro(); });

  /* ---------- herramientas de vendedor ---------- */
  const sCel = $('sCel');
  const baseUrl = location.origin + location.pathname.replace(/index\.html$/, '');
  let sTimer;
  sCel.addEventListener('input', () => { clearTimeout(sTimer); sTimer = setTimeout(renderSellerTools, 500); });
  async function renderSellerTools() {
    const cel = sCel.value.replace(/\D/g, '').slice(-10);
    $('sellerOut').hidden = true;
    if (cel.length !== 10 || !HAS_API) return;
    let r;
    try { r = await apiGet('micodigo', { cel }); } catch (e) { return; }
    if (sCel.value.replace(/\D/g, '').slice(-10) !== cel) return;
    $('sellerOut').hidden = false;
    if (!r.ok) {
      $('sName').textContent = T('Ese celular no está registrado como vendedor.');
      $('sCodeTxt').textContent = ''; $('sProgWrap').hidden = true;
      document.querySelector('.linkbox').hidden = true; document.querySelector('.seller-out .btn-row').hidden = true;
      return;
    }
    document.querySelector('.linkbox').hidden = false; document.querySelector('.seller-out .btn-row').hidden = false;
    const link = baseUrl + '?v=' + encodeURIComponent(r.codigo);
    $('sName').textContent = r.nombre;
    $('sCodeTxt').textContent = T('Tu código: {c}', { c: r.codigo });
    $('sLink').textContent = link;
    $('sWa').href = 'https://wa.me/?text=' + encodeURIComponent(
      T('Un solo boleto. Dos ganadores. 🚗🚗\nParticipa en la {r}: un Mazda 2 para el comprador y otro para quien vende el boleto ganador. Sorteo 10 de diciembre.\n{l}', { r: T(C.NOMBRE), l: link }));
    $('sProgWrap').hidden = false;
    $('sBar').style.width = Math.min(100, (r.vendidos / r.max) * 100) + '%';
    $('sCount').textContent = T('{a} de {b} boletos vendidos', { a: r.vendidos, b: r.max });
  }
  $('sCopy').onclick = async () => {
    const t = $('sLink').textContent;
    try { await navigator.clipboard.writeText(t); } catch (e) {
      const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    $('sCopy').textContent = T('¡Copiado!'); setTimeout(() => ($('sCopy').textContent = T('Copiar link')), 1800);
  };
})();
