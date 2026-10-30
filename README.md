# Gran Rifa Or Barak 2026 — sitio web

Sitio estático (GitHub Pages) + backend en Google Apps Script + pagos con Stripe Checkout.

```
index.html     Página principal (hero, contador, cómo funciona, compra, vendedores, bases, FAQ)
gracias.html   Confirmación de pago con los números de boleto
config.js      ← ÚNICO archivo a editar en el sitio (URL del backend, precios, contacto, permiso SEGOB)
app.js / styles.css / assets/
backend/Code.gs  Backend para Apps Script
```

## Cómo funciona
- **Sin backend (hoy):** el botón de pago abre el Payment Link de Stripe existente, con el correo y el código de vendedor (`client_reference_id`) prellenados.
- **Con backend:** el sitio crea una sesión de Stripe Checkout con la cantidad exacta, aparta los boletos 30 min, valida el código de vendedor y el límite de 50, asigna números aleatorios al pagar, los muestra en `gracias.html`, manda correo al comprador y a los admins, y alimenta el contador en vivo.
- **Link de vendedor:** `https://bx44.github.io/rifa-or-barak/?v=CODIGO`. El código se recuerda en el navegador del comprador.

## Activar el backend (una vez)
1. Abre la hoja de cálculo de la rifa → **Extensiones → Apps Script** → crea un archivo `Web.gs` y pega `backend/Code.gs`.
2. **Configuración del proyecto → Propiedades del script** → agrega `STRIPE_SECRET_KEY` = tu llave secreta (`sk_live_…` o `sk_test_…` para probar).
3. Ejecuta la función `instalar` (crea las hojas `Web_Boletos`, `Web_Vendedores`, `Web_Reservas` y el sincronizador cada 5 min). Autoriza permisos.
4. **Implementar → Nueva implementación → Aplicación web** · Ejecutar como: *Yo* · Acceso: *Cualquier usuario*. Copia la URL `/exec`.
5. Pega esa URL en `config.js` → `API_URL`.
6. Da de alta vendedores en `Web_Vendedores` (Código, Nombre, Correo, Teléfono, Activo).

> Si tu sistema actual ya guarda folios en otra hoja del mismo archivo, llena `HOJA_EXTERNA` y `COLUMNA_FOLIO_EXTERNA` en `Code.gs` para que esos números no se repitan y cuenten en el contador.

No hace falta webhook: el pago se confirma al volver a `gracias.html` y, como respaldo, el sincronizador revisa Stripe cada 5 minutos.

## Migrar después
Todo es HTML/CSS/JS sin dependencias: se copia tal cual a cualquier hosting (Netlify, Vercel, servidor propio). Solo hay que actualizar `SITIO_URL` en `Code.gs`.
