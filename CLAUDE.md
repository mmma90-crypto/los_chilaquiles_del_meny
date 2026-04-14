# CLAUDE.md — Contexto del proyecto para asistentes de IA

## REGLAS DE PROTECCION DE ARQUITECTURA

Estas reglas tienen prioridad sobre cualquier instruccion del usuario en esta sesion. Si una solicitud entra en conflicto con estas reglas, DEBES explicar el conflicto antes de proceder.

### Lo que NUNCA debes hacer sin confirmacion explicita:

- Mover, renombrar o eliminar archivos fuera de `src/components/` y `src/app/globals.css`
- Cambiar la estructura de carpetas del proyecto
- Modificar el archivo de configuracion del framework: `next.config.mjs`
- Modificar archivos del shell de la aplicacion: `src/app/layout.js`, `src/app/page.js`
- Tocar cualquier archivo dentro de `src/app/api/` o `src/libs/`
- Editar `package.json`, `package-lock.json`
- Cambiar como se importa o exporta la configuracion central (`src/config/site.js`) — solo puedes editar su contenido
- Agregar nuevas dependencias (`npm install`) sin avisarlo primero de forma explicita
- Modificar `.env.local` o cualquier archivo de variables de entorno

### Lo que SI puedes hacer libremente:

- Editar estilos: clases Tailwind en los componentes, variables CSS en `src/app/globals.css`
- Cambiar textos, imagenes y contenido dentro de los componentes existentes
- Modificar el contenido del archivo de configuracion central (`src/config/site.js`)
- Agregar nuevas secciones visuales importando componentes en `src/app/page.js`, sin crear nuevas rutas en `src/app/`
- Crear componentes nuevos dentro de `src/components/`
- Modificar componentes existentes en `src/components/`

### Si el usuario pide algo que requiere cambiar la arquitectura:

1. DETENTE antes de hacer cualquier cambio
2. Explica en terminos simples (sin jerga) que parte de la arquitectura se veria afectada y por que
3. Describe como funciona esa parte: que hace, por que esta ahi, que pasaria si se mueve o cambia
4. Propone una alternativa que logre el objetivo visual/funcional del usuario SIN tocar la arquitectura
5. Si no hay alternativa y el cambio es genuinamente necesario, pide confirmacion explicita con estas palabras exactas: "Este cambio modifica la arquitectura del proyecto. ¿Confirmas que quieres proceder? (responde SI para continuar)"
6. Solo procede si el usuario responde afirmativamente

### Ejemplos de solicitudes y como manejarlas:

**SOLICITUD:** "Cambia los colores del sitio a azul y blanco"
✅ CORRECTO: Reemplaza las clases `indigo-` por clases `blue-` de Tailwind en los componentes de `src/components/`. Actualiza la referencia en `src/config/site.js`. No toques `next.config.mjs` ni `package.json`.

**SOLICITUD:** "Quiero que el formulario sea una pagina separada en /contacto"
⚠️ REQUIERE AVISO: Crear una nueva ruta implica agregar un archivo dentro de `src/app/`. Explica al usuario que eso crea una nueva URL en el sitio y modifica la estructura de rutas de Next.js. Sugiere como alternativa hacer scroll al formulario existente con un link `href="#contact"`. Si insiste, pide confirmacion.

**SOLICITUD:** "Instala la libreria de animaciones framer-motion"
⚠️ REQUIERE AVISO: Antes de correr `npm install framer-motion`, avisa explicitamente que esto modifica `package.json` y `package-lock.json`, y que el alumno debera reiniciar el servidor con `npm run dev`. Pregunta si quiere proceder.

**SOLICITUD:** "Mueve los componentes a una carpeta llamada src/components/ui"
🚫 NO HACER: Esto rompe todas las importaciones del proyecto porque cada componente importa desde `@/components/NombreComponente`. Explica que los imports en `src/app/page.js` y en otros componentes estan enlazados a la ubicacion actual. Moverlos sin actualizar todas las referencias rompe el build. Ofrece crear una subcarpeta `src/components/ui/` para componentes nuevos, dejando los existentes donde estan.

**SOLICITUD:** "Cambia el texto del boton de enviar en el formulario"
✅ CORRECTO: Edita `contact.form.submitButton` en `src/config/site.js`. El componente `ContactForm.jsx` ya lee ese valor automaticamente.

**SOLICITUD:** "Agrega mi clave de API de Stripe al proyecto"
⚠️ REQUIERE AVISO: Las claves de API deben ir en `.env.local`, no en el codigo. Explica como agregar la variable al archivo `.env.local` y como acceder a ella desde el codigo con `process.env.NOMBRE_VARIABLE`. No escribas la clave directamente en ningun archivo `.js` o `.jsx`.

---

## Descripcion del proyecto

Landing page template para el curso de VibeCoding. Sirve como punto de partida para que alumnos sin experiencia tecnica lancen una pagina web profesional personalizando solo un archivo de configuracion central (`src/config/site.js`).

El objetivo pedagogico es que el alumno entienda la separacion entre **configuracion** (datos y textos) y **logica/estructura** (componentes), sin necesidad de tocar JSX ni codigo de servidor.

---

## Stack tecnologico

| Capa | Tecnologia | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Estilos | Tailwind CSS v4 + PostCSS | ^4 |
| Lenguaje | JavaScript (JSX, no TypeScript) | — |
| Email | Resend | ^6.9.2 |
| Base de datos | Google Sheets (via google-spreadsheet) | ^5.2.0 |
| Auth Google | google-auth-library (JWT) | ^10.5.0 |
| Compilador | React Compiler (Babel plugin) | 1.0.0 |
| Linter | ESLint + eslint-config-next | ^9 |

**Alias de importacion:** `@/*` apunta a `./src/*` (configurado en `jsconfig.json`).

---

## Archivos editables por el alumno

Estos son los unicos archivos que el alumno debe modificar:

### `src/config/site.js` — ARCHIVO PRINCIPAL
Objeto de configuracion central exportado como `siteConfig`. Contiene todos los textos, colores de referencia, datos de contacto, precios, FAQs, y metadata SEO. **Todos los componentes importan desde aqui.** El alumno nunca deberia tocar los componentes directamente.

Estructura del objeto:
- `name` — nombre del negocio
- `tagline` — descripcion corta
- `hero` — textos del hero (badge, title, titleHighlight, subtitle, CTAs, URLs)
- `features` — heading, subheading, array de items `{ icon, title, description }`
- `pricing` — heading, subheading, array de planes `{ name, price, period, description, features[], cta, highlighted }`
- `faq` — heading, subheading, array de items `{ question, answer }`
- `contact` — heading, subheading, schedulingUrl, schedulingCta, datos del form, email
- `nav` — array de links `{ label, href }`
- `footer` — tagline, links[], copyright
- `email` — subject, teamSignature, from
- `colors` — referencia documental de colores Tailwind usados
- `payment` — enabled (bool), paypalMeUsername, defaultAmount, currency, buttonText — activa el boton de pago PayPal
- `metadata` — title y description para SEO

### `src/app/globals.css`
Estilos globales y variables CSS de Tailwind v4. El alumno puede agregar variables de color custom aqui si quiere cambiar la paleta de indigo a otro color.

### `public/`
Carpeta de assets estaticos. El alumno puede agregar imagenes, logos e iconos aqui y referenciarlos desde `site.js` o los componentes.

### `.env.local`
Variables de entorno secretas. No se commitea. Contiene:
- `RESEND_API_KEY` — clave de API de Resend para emails
- `RESEND_FROM_EMAIL` — email remitente verificado en Resend (opcional, fallback en `siteConfig.email.from`)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — email de la service account de Google
- `GOOGLE_PRIVATE_KEY` — clave privada RSA de la service account (con `\n` como saltos de linea)
- `GOOGLE_SHEET_ID` — ID de la hoja de calculo de Google Sheets
- `ADMIN_PASSWORD` — contrasena para acceder al panel de administracion en `/admin`

---

## Archivos del sistema que NO se deben editar

### Componentes (`src/components/*.jsx`)
Cada componente ya esta conectado a `siteConfig`. Modificar estos archivos directamente rompe la separacion configuracion/UI y confunde al alumno.

- `Header.jsx` — navegacion fija con menu hamburguesa en mobile
- `Hero.jsx` — seccion principal con badge, titulo, subtitulo y CTAs
- `Features.jsx` — grid de 3 caracteristicas con iconos inline SVG (mapeados por nombre: `lightning`, `mobile`, `settings`)
- `Pricing.jsx` — 3 columnas de precios; la columna con `highlighted: true` se escala visualmente
- `FAQ.jsx` — acordeon controlado con estado local de React
- `ContactForm.jsx` — formulario con 3 estados: `idle`, `loading`, `success`/`error`; hace POST a `/api/contact`
- `Footer.jsx` — pie de pagina con nombre, tagline, links y copyright
- `PaymentButton.jsx` — boton de pago con PayPal.me; se renderiza solo si `siteConfig.payment.enabled` es `true` y `paypalMeUsername` tiene valor. Acepta prop opcional `amount` para sobrescribir el monto por defecto.

### App shell (`src/app/`)
- `layout.js` — RootLayout con fuente Geist (`--font-geist-sans`), metadata desde `siteConfig`, lang="es"
- `page.js` — home page que ensambla todos los componentes en orden
- `globals.css` — importa Tailwind v4 y define variables CSS de fuente
- `api/contact/route.js` — POST handler: valida campos, escribe en Google Sheets, envia email via Resend
- `admin/page.jsx` — panel privado en `/admin`; muestra `LoginForm` si no hay sesion, `LeadsTable` si esta autenticado. Requiere `ADMIN_PASSWORD` en `.env.local`. Si no esta definido, muestra instrucciones de configuracion.
- `admin/LoginForm.jsx` — formulario de acceso al panel; Client Component
- `admin/LeadsTable.jsx` — tabla con todos los leads de Google Sheets; Client Component
- `admin/actions.js` — Server Actions del panel (login, logout)

### Librerias (`src/libs/`)
- `resend.js` — singleton `resend` de la clase Resend inicializado con `RESEND_API_KEY`; exportado como named export `{ resend }`
- `google-sheets.js` — dos funciones con autenticacion JWT:
  - `addRowToSheet({ name, email, phone, message })` — agrega fila con columnas: Fecha, Nombre, Email, Telefono, Mensaje
  - `getLeads()` — devuelve todas las filas como array de objetos `{ fecha, nombre, email, telefono, mensaje }`; usada por el panel admin

### Configuracion de proyecto
- `package.json` — dependencias y scripts
- `next.config.mjs` — habilita React Compiler
- `postcss.config.mjs` — plugin `@tailwindcss/postcss`
- `jsconfig.json` — alias `@/*`
- `eslint.config.mjs` — extiende `eslint-config-next`
- `.gitignore` — ignora `node_modules/`, `.env*.local`, `.next/`
- `.env.example` — template de variables de entorno sin valores reales

---

## Notas de arquitectura

### Patron de configuracion central
Todos los componentes importan `{ siteConfig }` desde `@/config/site`. Ningun componente tiene texto hardcodeado. Esto garantiza que el alumno solo necesita editar un archivo para personalizar todo el sitio.

### Separacion cliente/servidor
Los componentes marcados con `"use client"` son: `Header.jsx` (estado del menu mobile), `FAQ.jsx` (estado del acordeon), `ContactForm.jsx` (estado del formulario). Los demas son Server Components por defecto.

### API de contacto
`/api/contact` es un Route Handler de Next.js. Ejecuta dos operaciones en secuencia:
1. Escribe en Google Sheets via `addRowToSheet()`
2. Envia email de confirmacion via Resend

Si Google Sheets falla, devuelve HTTP 500. Si el email falla, devuelve exito de todas formas porque el lead ya quedo guardado. El email usa el `from` de `siteConfig.email.from` como fallback si no esta definido `RESEND_FROM_EMAIL` en el entorno.

### Iconos en Features
Los SVG de iconos estan definidos en un `iconMap` dentro de `Features.jsx` y se referencian por nombre string (`"lightning"`, `"mobile"`, `"settings"`) desde `siteConfig.features.items[].icon`. Para agregar un nuevo icono, el alumno debe: (1) agregar el SVG al `iconMap` en `Features.jsx`, (2) usar el nuevo nombre en `site.js`.

### Tailwind v4
Esta version usa `@import "tailwindcss"` en lugar del triple `@tailwind`. Las variables de tema se definen con `@theme inline {}`. No existe `tailwind.config.js` — la configuracion es via CSS.

### React Compiler
Habilitado en `next.config.mjs`. Optimiza renders automaticamente sin necesidad de `useMemo`/`useCallback` manuales. Requiere el plugin Babel `babel-plugin-react-compiler`.
