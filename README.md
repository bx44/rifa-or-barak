# Gran Rifa Or Barak 2026 — sitio web

Sitio estático conectado al sistema existente de la rifa (Google Sheets + Apps Script + Worker de Cloudflare + Stripe).

## Cómo funciona
1. El comprador llena nombre, correo, celular y (opcional) código de vendedor.
2. La página llama a la implementación pública del script "Rifa" (`?accion=web` / `web_comprar`), que registra la venta igual que el Form "Vender boleto": alta en COMPRADORES, folio en BOLETOS, Cobranza y correos al comprador y al vendedor.
3. Se muestra el folio y se manda al Worker `muddy-meadow-b7aa/pagar`, que cobra el saldo exacto en Stripe (con meses).
4. Stripe avisa al Worker → Worker reenvía al script → `doPost` registra el pago en PAGOS (boleto liquidado).

El contador lee BOLETOS en vivo. Códigos de vendedor = iniciales + últimos 4 dígitos del celular (ej. JBH6174); el vendedor lo obtiene en la sección "Vendedores" con su celular.

## Archivos
- `config.js` — único archivo a editar (URL de la API, contacto, permiso SEGOB).
- `backend/Web.gs` — copia del archivo agregado al proyecto de Apps Script "Rifa" (más 2 líneas en `doGet`/`doPost` de Código.gs).

## Si haces una implementación nueva del script
Actualiza la implementación existente (Implementar → Administrar → Editar → Nueva versión) para que la URL no cambie; si cambia, actualízala aquí en `config.js` y en la variable `RIFA_GAS_URL` del Worker.

## Idiomas (español, inglés, hebreo)
`i18n.js` traduce todas las páginas. El idioma se elige así: `?lang=es|en|he` en la URL → el que la persona eligió antes en el selector (arriba a la derecha) → por ubicación del dispositivo (zona horaria de Israel = hebreo, de México = español, resto = inglés; si el teléfono está en hebreo o español se respeta). En hebreo la página se muestra de derecha a izquierda. Para corregir una traducción, edita el diccionario `DICT` en `i18n.js`. Los posters (imágenes) y los correos siguen en español.
