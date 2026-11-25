/* Botón flotante de WhatsApp (basado en el widget que mandó Jonathan, adaptado a la rifa).
   - Número: el de Jonathan, en formato wa.me (52 + 10 dígitos).
   - Textos en el idioma de la página (es / en / he).
   - En celular se sube para no tapar el botón "Comprar" de abajo. */
(function () {
  var NUMERO = '525539896174';
  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  var TXT = {
    es: { titulo: '¿Necesitas ayuda?', cuerpo: 'Escríbeme por WhatsApp y te ayudo con tu boleto.', boton: 'Escribir por WhatsApp', aria: 'Abrir chat de WhatsApp', msg: 'Hola Jonathan, te escribo desde la página de la rifa de Or Barak.' },
    en: { titulo: 'Need help?', cuerpo: 'Message me on WhatsApp and I will help you with your ticket.', boton: 'Message on WhatsApp', aria: 'Open WhatsApp chat', msg: 'Hi Jonathan, I am writing from the Or Barak raffle website.' },
    he: { titulo: 'צריכים עזרה?', cuerpo: 'כתבו לי בוואטסאפ ואעזור לכם עם הכרטיס.', boton: 'לכתוב בוואטסאפ', aria: 'פתיחת צ׳אט וואטסאפ', msg: 'שלום יהונתן, אני כותב מאתר ההגרלה של אור ברק.' }
  }[lang] || null;
  if (!TXT) TXT = { titulo: '¿Necesitas ayuda?', cuerpo: 'Escríbeme por WhatsApp y te ayudo con tu boleto.', boton: 'Escribir por WhatsApp', aria: 'Abrir chat de WhatsApp', msg: 'Hola Jonathan, te escribo desde la página de la rifa de Or Barak.' };
  var link = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(TXT.msg);
  var ladoDer = document.documentElement.dir !== 'rtl';

  var css = document.createElement('style');
  css.textContent =
    '#wa-chat{position:fixed;z-index:70;bottom:24px;' + (ladoDer ? 'right:20px' : 'left:20px') + ';font-family:inherit;display:flex;flex-direction:column;align-items:' + (ladoDer ? 'flex-end' : 'flex-start') + '}' +
    '#wa-chat .wa-btn{width:58px;height:58px;border-radius:50%;border:0;background:#25D366;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.35);position:relative;animation:waPulse 2.4s ease-in-out infinite}' +
    '#wa-chat .wa-btn svg{width:32px;height:32px}' +
    '#wa-chat .wa-dot{position:absolute;top:3px;right:3px;width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid #fff}' +
    '#wa-chat .wa-panel{display:none;width:280px;max-width:calc(100vw - 40px);margin-bottom:12px;padding:16px;border-radius:14px;background:#fff;color:#1a1a1a;box-shadow:0 16px 40px rgba(0,0,0,.35);text-align:start}' +
    '#wa-chat .wa-panel b{display:block;font-size:16px;margin-bottom:6px}' +
    '#wa-chat .wa-panel p{margin:0 0 12px;font-size:14px;line-height:1.45;color:#4b5563}' +
    '#wa-chat .wa-panel a{display:block;text-align:center;padding:11px 12px;border-radius:10px;background:#25D366;color:#fff;font-weight:700;text-decoration:none}' +
    '#wa-chat .wa-x{float:' + (ladoDer ? 'right' : 'left') + ';border:0;background:none;font-size:18px;line-height:1;color:#9ca3af;cursor:pointer;margin:-4px -4px 0 0}' +
    '@keyframes waPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}' +
    '@media (max-width:900px){#wa-chat{bottom:calc(92px + env(safe-area-inset-bottom))}}';
  document.head.appendChild(css);

  var root = document.createElement('div');
  root.id = 'wa-chat';
  root.innerHTML =
    '<div class="wa-panel" role="dialog"><button class="wa-x" type="button" aria-label="Cerrar">×</button>' +
    '<b></b><p></p><a target="_blank" rel="noopener"></a></div>' +
    '<button class="wa-btn" type="button"><span class="wa-dot"></span>' +
    '<svg viewBox="0 0 32 32" fill="#fff" aria-hidden="true"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8C29 8.7 23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4c-1.2-1.8-1.8-3.8-1.8-5.9C5 9.9 9.9 5.1 16 5.1S27 9.9 27 15.8s-4.9 10.6-11 10.6zm6-7.9c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.7-1.7-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.5c-.3-.7-.5-.6-.8-.6h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5.1.8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 2-.8 2.2-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.6-.4z"/></svg></button>';
  root.querySelector('b').textContent = TXT.titulo;
  root.querySelector('p').textContent = TXT.cuerpo;
  var a = root.querySelector('a');
  a.textContent = TXT.boton;
  a.href = link;
  var btn = root.querySelector('.wa-btn');
  btn.setAttribute('aria-label', TXT.aria);
  var panel = root.querySelector('.wa-panel');
  var dot = root.querySelector('.wa-dot');
  function abrir(si) { panel.style.display = si ? 'block' : 'none'; if (si) { dot.style.display = 'none'; try { localStorage.setItem('wa_chat_visto', String(Date.now())); } catch (e) {} } }
  btn.onclick = function () { abrir(panel.style.display === 'none' || !panel.style.display); };
  root.querySelector('.wa-x').onclick = function () { abrir(false); };

  // El saludo NO se abre solo (taparía el botón de "Comprar boleto"); el punto rojo invita a abrirlo
  // y se quita por 24 horas una vez que la persona lo abre.
  var visto = 0;
  try { visto = Number(localStorage.getItem('wa_chat_visto') || 0); } catch (e) {}
  if (visto && Date.now() - visto < 24 * 3600 * 1000) dot.style.display = 'none';

  document.body.appendChild(root);
})();
