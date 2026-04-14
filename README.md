# VibeCoding — Plantilla de Landing Page

Bienvenido al curso de VibeCoding. Esta guia te lleva desde cero hasta tener tu pagina web publicada en internet, paso a paso, sin asumir que sabes programar.

---

## Que es esto?

Una **landing page** es una pagina web de presentacion para tu negocio o proyecto. La abres en el navegador y ves: un titulo llamativo, tus beneficios, tus precios, preguntas frecuentes y un formulario de contacto.

Esta plantilla ya tiene todo eso construido. Tu trabajo es cambiar los textos, colores y datos para que sea de tu negocio, no del nuestro.

---

## Antes de empezar — lo que necesitas instalar una sola vez

Antes de abrir el proyecto por primera vez necesitas dos programas en tu computadora. Si ya los tienes, salta directo al Paso 1.

> **Tienes Mac o Windows?** Las instrucciones son diferentes. Identifica tu sistema y sigue solo la columna que te corresponde.

---

### Si tienes Mac — instala Homebrew primero

> **Homebrew** es el gestor de paquetes de Mac. Un "gestor de paquetes" es un programa que instala otros programas por ti desde la terminal, sin que tengas que buscar instaladores en internet. Es la forma mas rapida y limpia de instalar herramientas de desarrollo en Mac.

**Paso 1.** Abre la app **Terminal** en tu Mac (busca "Terminal" en Spotlight con `Cmd+Space`).

**Paso 2.** Copia y pega este comando exactamente como esta y presiona Enter:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Paso 3.** El instalador te pide tu contrasena de Mac. Escribela (no se ve mientras la escribes, eso es normal) y presiona Enter.

**Paso 4.** Espera. La instalacion puede tardar entre 3 y 10 minutos dependiendo de tu conexion. Cuando veas el cursor parpadeante de nuevo, termino.

**Paso 5.** Si tu Mac tiene chip Apple Silicon (M1, M2, M3, M4), al terminar el instalador te muestra dos lineas que debes copiar y pegar en la terminal. Se ven asi:

```
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Ejecutalas una por una. Si tu Mac es Intel (anterior a 2020) esto no es necesario.

**Paso 6.** Verifica que funciono escribiendo:
```
brew --version
```
Si te responde con un numero (ej. `Homebrew 4.x.x`), esta listo.

Pagina oficial de Homebrew: https://brew.sh

---

### Instalar Node.js

Node.js es el motor que hace funcionar el proyecto. Sin el, nada arranca.

**En Mac (con Homebrew):**

Escribe esto en la Terminal y presiona Enter:
```
brew install node
```
Espera a que termine. Luego verifica con:
```
node --version
```
Si te responde con un numero (ej. `v22.x.x`), esta listo.

**En Windows:**

1. Ve a https://nodejs.org
2. Descarga el boton grande que dice **LTS** (es la version estable recomendada).
3. Abre el instalador y haz clic en "Next" hasta que termine.
4. Reinicia tu computadora.
5. Abre una nueva terminal y escribe `node --version` para confirmar.

---

### Instalar Git

Git es el sistema que guarda el historial de cambios de tu proyecto y lo conecta con GitHub (donde vive el codigo en la nube).

**En Mac:**

La mayoria de las Macs ya tienen Git incluido. Verifica escribiendo en Terminal:
```
git --version
```
Si te responde con un numero, ya lo tienes y no necesitas hacer nada mas.

Si te dice que no esta instalado, instala con Homebrew:
```
brew install git
```

**En Windows:**

1. Ve a https://git-scm.com/downloads
2. Descarga el instalador para Windows.
3. Instalalo con todas las opciones por defecto (solo clic en "Next").
4. Cierra y vuelve a abrir la terminal despues de instalar.

---

## Paso 1 — Hacer Fork del repositorio

> **Repositorio** = la carpeta del proyecto guardada en la nube, en GitHub.
> **Fork** = hacer una copia de ese repositorio en tu propia cuenta de GitHub, para que puedas editarlo sin afectar el original.

1. Abre el repositorio en GitHub (tu instructor te da el enlace).
2. Haz clic en el boton **Fork** que esta en la esquina superior derecha de la pagina.
3. En la pantalla que aparece, deja todo como esta y haz clic en **Create fork**.
4. Espera unos segundos. GitHub te lleva automaticamente a tu copia del proyecto.

Listo. Ahora tienes tu propia version del proyecto en tu cuenta.

---

## Paso 2 — Abrir el proyecto en Cursor

Cursor puede descargar el proyecto directamente desde GitHub sin que tengas que abrir ninguna otra app.

1. Abre **Cursor**.
2. En la pantalla de inicio, haz clic en el buscador (o presiona `Ctrl+Shift+P` en Windows, `Cmd+Shift+P` en Mac).
3. Escribe **clone** y selecciona la opcion **Git: Clone**.
4. Pega la URL de tu repositorio. La encuentras en GitHub haciendo clic en el boton verde **Code** → copias la URL que aparece.
   Tiene este formato: `https://github.com/TU-USUARIO/vibecoding-plantilla.git`
5. Cursor te pregunta en que carpeta de tu computadora quieres guardar el proyecto. Elige una ubicacion facil de encontrar, como tu escritorio o una carpeta llamada "proyectos".
6. Cursor descarga todo y te pregunta si quieres abrir el proyecto. Haz clic en **Open**.

El proyecto se abre solo en Cursor. No necesitas hacer nada mas.

---

## Paso 3 — Instalar las librerias del proyecto

> **Librerias** = montones de codigo pre-escrito que otras personas crearon para simplificar el trabajo. En lugar de programar todo desde cero, el proyecto usa librerias que ya resuelven cosas comunes (mostrar paginas, enviar emails, etc.).

Necesitas descargarlas una sola vez. Para eso usas la **terminal integrada de Cursor** — es una ventanita de texto dentro del propio Cursor donde escribes instrucciones cortas.

**Como abrir la terminal en Cursor:**
- Presiona `Ctrl+` `` ` `` (la tecla que esta a la izquierda del numero 1, debajo de Escape)
- O ve al menu de arriba: **Terminal → New Terminal**

Se abre un panel en la parte de abajo de Cursor. Haz clic ahi y escribe:

```
npm install
```

Presiona Enter y espera. Puede tardar uno o dos minutos la primera vez. Vas a ver texto desplazarse; eso es normal. Cuando vuelva a aparecer el cursor parpadeante, termino.

> **npm** = el programa que descarga e instala las librerias. Viene incluido con Node.js que instalaste antes.

---

## Paso 4 — Configurar tus datos secretos

> **Variables de entorno** = datos confidenciales (como contrasenas de servicios externos) que el proyecto necesita pero que NO se guardan dentro del codigo. Se guardan en un archivo separado que jamas se sube a internet.

1. En el panel izquierdo de Cursor (el explorador de archivos) busca el archivo llamado `.env.example`.
2. Haz clic derecho sobre el → **Copy** → luego **Paste** en la misma carpeta.
3. Renombra la copia a `.env.local` (haz clic derecho → Rename).
4. Abre `.env.local` y llena los valores. Tu instructor te explica cuales necesitas para empezar.

> El archivo `.env.local` es invisible para GitHub. Nadie mas puede verlo aunque subas tu proyecto.

---

## Paso 5 — Arrancar el sitio en tu computadora

En la terminal de Cursor (la misma que abriste antes), escribe:

```
npm run dev
```

Presiona Enter. En unos segundos vas a ver algo como:

```
▲ Next.js 16.1.6
- Local: http://localhost:3000
```

Abre tu navegador y ve a: **http://localhost:3000**

Deberias ver tu landing page funcionando. Cada vez que guardes un archivo con `Ctrl+S`, la pagina se actualiza sola en el navegador.

> **localhost:3000** significa "el sitio que corre en mi propia computadora, en el canal 3000". Solo tu lo puedes ver por ahora. Para que todos lo vean hay que publicarlo (ver la seccion "Publicar en Vercel" mas adelante).

Para detener el servidor cuando termines de trabajar: haz clic en la terminal y presiona `Ctrl+C`.

---

## Que puedes cambiar y que no

Cuando le pidas cambios a Cursor (o a cualquier IA), hay una diferencia entre cambiar **como se ve** el proyecto y cambiar **como funciona por dentro**. Esto es lo que necesitas saber.

### Puedes pedir libremente:

Estos cambios son seguros. Si algo sale mal, es facil de revertir.

| Que quieres cambiar | Como pedirlo en Cursor |
|---|---|
| Colores del sitio | "Cambia el color principal de indigo a azul en todos los componentes" |
| Tipografia | "Usa la fuente Poppins de Google Fonts en todo el sitio" |
| Textos del hero | "Cambia `hero.title` en `src/config/site.js` a: Bienvenido a mi negocio" |
| Nueva seccion visual | "Crea un componente `Testimonials.jsx` en `src/components/` y agregalo en `src/app/page.js`" |
| Estilo de botones | "Haz los botones mas redondeados" |
| Espaciado entre secciones | "Agrega mas espacio entre la seccion principal y los beneficios" |
| Contenido del FAQ | "Reemplaza las preguntas frecuentes en `src/config/site.js` con estas: [...]" |

### Estos cambios necesitan cuidado extra:

Antes de hacerlos, pide a Cursor que te explique que implica. Cursor tiene instrucciones para avisarte antes de proceder.

- **Agregar una nueva pagina al sitio** (ej: `/servicios`, `/blog`) — implica tocar la estructura de carpetas del proyecto.
- **Instalar una libreria nueva** — Cursor debe avisarte que va a modificar la lista de librerias del proyecto y que necesitaras reiniciar el servidor.
- **Cambiar como funciona el formulario** — el formulario esta conectado a un servidor interno que guarda datos en Google Sheets y envia emails. Cambiar su estructura puede romper esa conexion.

### No pidas esto sin entender bien que hace:

Estas acciones pueden romper el proyecto y son dificiles de deshacer.

- Mover o renombrar carpetas (especialmente `src/components/`, `src/app/`, `src/libs/`)
- Borrar archivos que no creaste tu
- Modificar `next.config.mjs` — el archivo de configuracion principal del motor del sitio
- Escribir contrasenas o claves de servicios directamente dentro de archivos `.js` — siempre deben ir en `.env.local`

### Si Cursor hace algo que rompe el proyecto:

1. No entres en panico
2. En Cursor, mira el panel izquierdo y haz clic en el icono de **Control de codigo fuente** (parece una ramita con circulos). Ahi ves exactamente que archivos cambiaron.
3. Para deshacer los cambios en un archivo: haz clic derecho sobre el archivo en ese panel → **Discard Changes**.
4. Para deshacer TODOS los cambios a la vez: escribe en la terminal `git checkout .`
5. Cuando le pidas ayuda a Cursor para arreglar algo, dile exactamente **que le pediste** y **que mensaje de error ves**. Eso le da contexto para resolver el problema sin romper mas cosas.

### Por que existe esta separacion

Piensalo como un restaurante. El **menu y la decoracion** los puedes cambiar cuando quieras — eso es el frontend (lo visual). Pero la **cocina, el sistema de caja y los proveedores** tienen una logica que no debes tocar sin saber lo que haces — eso es la arquitectura.

Este proyecto esta disenado para que puedas personalizar todo lo visual **editando solo `src/config/site.js`** y los componentes visuales, sin necesidad de tocar la maquinaria interna.

---

## Archivos que SI debes tocar

Estos son los unicos archivos que necesitas editar para personalizar tu landing page:

| Archivo | Para que sirve |
|---|---|
| `src/config/site.js` | **El principal.** Aqui cambias el nombre del negocio, textos, precios, preguntas frecuentes, colores y datos de contacto. |
| `src/app/globals.css` | Para cambiar los colores globales del sitio. |
| `public/` | Carpeta donde pones tus imagenes: logo, fotos del equipo, etc. |
| `.env.local` | Tus claves secretas de servicios externos (Resend, Google Sheets). Nunca lo compartas. |

### Como personalizar tu sitio en 5 minutos

Abre `src/config/site.js` en Cursor y cambia estos valores:

- `name` — el nombre de tu negocio
- `hero.title` y `hero.subtitle` — el texto grande de la pagina principal
- `features.items` — las 3 caracteristicas de tu servicio
- `pricing.plans` — tus planes y precios
- `faq.items` — tus preguntas frecuentes
- `contact.email` — tu email de contacto

Guarda el archivo con `Ctrl+S` y mira como cambia la pagina automaticamente.

---

## Archivos que NO debes tocar

Estos archivos controlan como funciona el proyecto por dentro. Modificarlos puede romper la aplicacion:

| Archivo o carpeta | Por que no tocarlo |
|---|---|
| `src/components/*.jsx` | Son los bloques visuales de la pagina. Ya estan conectados a tu config. |
| `src/app/layout.js` | La estructura base que envuelve toda la pagina. |
| `src/app/page.js` | El archivo que une todos los bloques visuales en orden. |
| `src/app/api/` | El servidor interno que recibe los mensajes del formulario. |
| `src/libs/` | La conexion con Google Sheets y Resend (el servicio de emails). |
| `package.json` | La lista oficial de librerias del proyecto. |
| `next.config.mjs` | La configuracion del motor del sitio (Next.js). |
| `node_modules/` | La carpeta donde se guardan todas las librerias descargadas. Nunca la toques ni la borres. |

---

## Errores comunes y como resolverlos

### "npm: command not found" o "npm no se reconoce"

**Que significa:** Node.js no esta instalado, o la terminal no lo esta encontrando.

**Solucion:**
1. Ve a https://nodejs.org, descarga la version **LTS** e instalala.
2. Cierra completamente Cursor y vuelvelo a abrir.
3. Abre la terminal de nuevo y prueba escribir `node --version`. Si aparece un numero, ya funciona.

---

### "Error: EADDRINUSE: address already in use :::3000"

**Que significa:** El canal 3000 ya lo esta usando otra ventana del mismo proyecto que dejaste abierta.

**Solucion:** Busca otra terminal abierta en Cursor con el proyecto corriendo y cierrala (o presiona `Ctrl+C` ahi). Luego vuelve a escribir `npm run dev`.

Si no encuentras la otra terminal, puedes arrancar el sitio en un canal diferente:
```
npm run dev -- --port 3001
```
Luego abre http://localhost:3001

---

### La pagina muestra una pantalla roja con texto de error

**Que significa:** Hay un error en algun archivo del proyecto — puede ser una coma que falta, una comilla mal cerrada, o algo que Cursor cambio mal.

**Solucion:**
1. Lee el mensaje de error. Generalmente dice el nombre del archivo y el numero de linea donde esta el problema.
2. Abre ese archivo en Cursor y busca la linea mencionada.
3. Si el error dice "Cannot find module" (no puede encontrar una libreria), escribe `npm install` en la terminal y presiona Enter.
4. Si editaste `src/config/site.js`, revisa que no hayas borrado una coma `,` o una comilla `"` sin querer.

---

### El formulario de contacto no envia los mensajes

**Que significa:** Los datos secretos en `.env.local` no estan configurados o tienen algun error.

**Solucion:**
1. Verifica que el archivo `.env.local` existe en la raiz del proyecto (en el panel izquierdo de Cursor lo debes ver).
2. Abrelo y confirma que `RESEND_API_KEY` tiene un valor (no este vacio).
3. Detiene el servidor con `Ctrl+C` y vuelve a correr `npm run dev` para que tome los nuevos valores.

---

### Cambie algo en `site.js` pero la pagina no se actualiza

**Solucion:**
1. Guarda el archivo con `Ctrl+S`.
2. Espera 2-3 segundos a que el navegador se actualice solo.
3. Si no cambia, recarga la pagina manualmente con `Ctrl+R` o `F5`.
4. Si sigue igual, verifica que el servidor sigue corriendo en la terminal (debes ver el texto de Next.js, no un error).

---

## Glosario — palabras que vas a escuchar mucho

| Termino | Que significa en lenguaje normal |
|---|---|
| **Homebrew** | El gestor de paquetes de Mac. Te permite instalar programas desde la terminal con un comando corto, en lugar de buscar instaladores en internet. |
| **Libreria** | Monton de codigo pre-escrito que alguien mas creo para resolver un problema comun. En lugar de inventar todo desde cero, la usas y listo. |
| **Dependencias** | Las librerias especificas que este proyecto necesita para funcionar. Se listan en `package.json` y se descargan con `npm install`. |
| **npm** | El programa que descarga e instala las librerias. Viene incluido con Node.js. |
| **Terminal** | La ventanita de texto donde escribes instrucciones cortas para tu computadora. En Cursor se abre con `Ctrl+` `` ` ``. |
| **Repositorio** | La carpeta del proyecto guardada en la nube (GitHub). Es como un Google Drive especializado para codigo. |
| **Fork** | Hacer tu propia copia de un repositorio de otra persona en tu cuenta de GitHub. |
| **Clonar** | Descargar un repositorio de GitHub a tu computadora. |
| **Servidor local** | El sitio corriendo en tu propia computadora, visible solo para ti en `localhost:3000`. |
| **Deploy / publicar** | Subir el sitio a internet para que cualquier persona lo pueda ver. |
| **Variables de entorno** | Datos confidenciales (contrasenas, claves de APIs) que se guardan en `.env.local` separados del codigo. |
| **Componente** | Un bloque de interfaz reutilizable. Por ejemplo, el Header (encabezado) es un componente, el Footer (pie de pagina) es otro. |
| **Build** | El proceso de preparar y optimizar el codigo para publicarlo. Lo hace Vercel automaticamente. |
| **API** | Una conexion entre dos programas. Por ejemplo, el formulario usa una API para hablar con Google Sheets y enviar los datos ahi. |

---

## Configurar el formulario de contacto

El formulario hace dos cosas cuando alguien lo llena:
1. Guarda los datos (nombre, email, telefono, mensaje) en una hoja de Google Sheets — tu base de datos de contactos.
2. Le envia un email automatico al visitante confirmando que recibiste su mensaje.

Para que funcione necesitas configurar dos servicios gratuitos: **Resend** (para los emails) y **Google Sheets** (para guardar los datos).

---

### Parte A — Resend (el servicio que envia los emails)

Resend es una plataforma gratuita que te permite enviar emails automaticos desde tu sitio. No necesitas tarjeta de credito para empezar.

**Paso 1.** Crea tu cuenta en https://resend.com y confirma tu email.

**Paso 2.** Dentro de Resend, en el menu lateral izquierdo, haz clic en **API Keys**.

**Paso 3.** Haz clic en el boton **Create API Key**. Dale el nombre que quieras (por ejemplo "vibecoding") y haz clic en **Add**.

**Paso 4.** Aparece una clave que empieza con `re_`. Cópiala — solo la vas a ver una vez. Si la pierdes tendras que crear una nueva.

**Paso 5.** Abre tu archivo `.env.local` en Cursor y pega la clave en la linea de `RESEND_API_KEY`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

Deja `RESEND_FROM_EMAIL=onboarding@resend.dev` por ahora. Cuando tengas tu propio dominio de email puedes cambiarlo.

**Paso 6.** Reinicia el servidor: presiona `Ctrl+C` en la terminal y luego escribe `npm run dev` de nuevo.

---

### Parte B — Google Sheets (donde se guardan los contactos)

Vamos a crear una "cuenta robot" de Google que tiene permiso de escribir en tu hoja de calculo. Suena complicado pero son pasos visuales — solo clic, clic, clic.

**Paso 1.** Ve a https://console.cloud.google.com e inicia sesion con tu cuenta de Google.

**Paso 2.** Arriba a la izquierda hay un selector de proyectos. Haz clic → **Nuevo proyecto** → ponle el nombre que quieras → **Crear**.

**Paso 3.** En el menu lateral ve a **APIs y servicios** → **Biblioteca**. En el buscador escribe "Google Sheets API", haz clic en el resultado y luego en **Habilitar**.

> Esto activa el permiso para que tu proyecto pueda leer y escribir en Google Sheets.

**Paso 4.** Ve a **APIs y servicios** → **Credenciales** → **Crear credenciales** → **Cuenta de servicio**.
- En "Nombre de la cuenta de servicio" escribe algo como `vibecoding-sheets`.
- Haz clic en **Listo**.

> Una "cuenta de servicio" es un usuario robot que solo los programas pueden usar, no personas.

**Paso 5.** En la lista de cuentas de servicio, haz clic en la que acabas de crear. Ve a la pestana **Claves** → **Agregar clave** → **Crear clave nueva** → selecciona **JSON** → **Crear**.

Se descarga automaticamente un archivo `.json` a tu computadora. Guardalo en un lugar seguro.

**Paso 6.** Abre ese archivo `.json` con cualquier editor de texto (o con Cursor). Busca estos dos valores y copialo en tu `.env.local`:

- El campo `"client_email"` → pega su valor en `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- El campo `"private_key"` → pega su valor en `GOOGLE_PRIVATE_KEY`

Debe quedar asi (con tus valores reales):
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=mi-robot@mi-proyecto-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n"
```

> Importante: El valor de `GOOGLE_PRIVATE_KEY` debe ir entre comillas dobles `"..."` y los saltos de linea se escriben como `\n`.

**Paso 7.** Crea una hoja de calculo nueva en https://sheets.google.com. En la primera fila escribe estos titulos, cada uno en una celda diferente de izquierda a derecha:

```
Fecha    Nombre    Email    Telefono    Mensaje
```

**Paso 8.** Haz clic en el boton **Compartir** (arriba a la derecha de la hoja). Escribe el email de tu cuenta de servicio (el valor de `GOOGLE_SERVICE_ACCOUNT_EMAIL`) y dale permisos de **Editor**. Haz clic en **Enviar**.

> Esto le da permiso al robot para escribir en tu hoja.

**Paso 9.** Copia el ID de tu hoja desde la barra de direcciones del navegador. Esta entre `/d/` y `/edit`:
```
https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
```
Pegalo en `.env.local`:
```
GOOGLE_SHEET_ID=1abc...xyz
```

**Paso 10.** Reinicia el servidor (`Ctrl+C` y luego `npm run dev`).

Prueba llenando el formulario en tu pagina. Deberia aparecer una nueva fila en tu Google Sheet con los datos.

---

## Publicar tu proyecto en Vercel

Vercel es la plataforma donde publicas tu sitio para que cualquier persona en internet lo pueda ver. Tiene plan gratuito y se conecta directamente con GitHub — cada vez que guardes cambios en GitHub, Vercel republica el sitio solo.

---

### Paso 1 — Crear tu cuenta en Vercel

Ve a https://vercel.com y haz clic en **Sign Up**. Elige **Continue with GitHub** para conectar ambas cuentas con un solo clic. No necesitas tarjeta de credito.

---

### Paso 2 — Importar tu proyecto

1. Dentro de Vercel, haz clic en **Add New... → Project**.
2. En la lista aparecen tus repositorios de GitHub. Busca `vibecoding-plantilla` y haz clic en **Import**.
3. Vercel detecta automaticamente que es un proyecto Next.js. No cambies nada en esta pantalla.

---

### Paso 3 — Copiar tus datos secretos a Vercel

> Este es el paso mas importante. Tu `.env.local` nunca llega a Vercel porque esta en `.gitignore` (la lista de archivos que GitHub ignora). Debes copiarlo a mano en Vercel.

Antes de hacer clic en Deploy, despliega la seccion **Environment Variables** y agrega una por una estas variables con sus valores de tu `.env.local`:

| Variable | Valor que debes pegar |
|---|---|
| `RESEND_API_KEY` | Tu clave de Resend (empieza con `re_`) |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` o tu email verificado |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | El email de tu cuenta robot de Google |
| `GOOGLE_PRIVATE_KEY` | La clave privada del archivo JSON de Google |
| `GOOGLE_SHEET_ID` | El ID de tu hoja de Google Sheets |
| `ADMIN_PASSWORD` | La contrasena que eliges para entrar al panel /admin |

**Nota sobre `GOOGLE_PRIVATE_KEY`:** Es el valor mas largo y el que mas falla. Asegurate de copiar el valor completo, incluyendo `-----BEGIN RSA PRIVATE KEY-----` al inicio y `-----END RSA PRIVATE KEY-----` al final.

---

### Paso 4 — Publicar

Haz clic en **Deploy**. Vercel va a:
1. Descargar tu codigo de GitHub
2. Instalar las librerias (`npm install`)
3. Preparar el codigo para produccion (`npm run build`) — este proceso optimiza todo para que cargue rapido
4. Publicarlo en una URL del tipo `tu-proyecto.vercel.app`

El proceso tarda entre 1 y 3 minutos. Cuando termina, Vercel te muestra el link de tu sitio en vivo.

---

### Paso 5 — Subir cambios despues del primer deploy

Cuando modifiques archivos en Cursor y quieras que los cambios aparezcan en internet:

1. En Cursor, haz clic en el icono de **Control de codigo fuente** en el panel izquierdo (parece una ramita con circulos).
2. Escribe un mensaje describiendo que cambiaste (ej: "Actualizo los precios").
3. Haz clic en **Commit & Push** (o en el boton con un checkmark).

Vercel detecta el cambio automaticamente y republica el sitio en menos de 2 minutos. No tienes que hacer nada mas en Vercel.

---

### Paso 6 — Conectar tu dominio personalizado (opcional)

Si compraste un dominio propio (ej: `minegocio.com`):
1. En Vercel, entra a tu proyecto → **Settings → Domains**.
2. Escribe tu dominio y haz clic en **Add**.
3. Vercel te muestra unos registros DNS — son instrucciones para decirle a internet que tu dominio apunta a Vercel. Los debes agregar en el sitio donde compraste el dominio (GoDaddy, Namecheap, etc.).
4. Espera entre 10 minutos y 24 horas. Es normal que tarde.

---

### Si el deploy falla

**Error al construir ("Build failed")**

Copia el mensaje de error completo y pegalo en Cursor con este mensaje:
> "El deploy en Vercel falla con este error: [PEGA EL ERROR]. Ayudame a resolverlo."

El error mas frecuente es una variable de entorno mal escrita o que falta.

**El formulario funciona en local pero no en Vercel**

Casi siempre es porque alguna variable de entorno esta incorrecta o incompleta en Vercel. Ve a tu proyecto en Vercel → **Settings → Environment Variables**, revisalas una por una, y si cambias alguna haz clic en **Deployments → el ultimo → Redeploy** para que tome el nuevo valor.

**La pagina /admin dice "Panel no configurado"**

`ADMIN_PASSWORD` no esta configurada en Vercel. Agregala en **Settings → Environment Variables** y redesplega.

---

## Activar el panel de administracion (/admin)

El panel de administracion es una pagina privada donde puedes ver todos los contactos que llenaron el formulario. Solo tu puedes entrar porque esta protegida con una contrasena.

**Paso 1.** Abre `.env.local` en Cursor y agrega esta linea con la contrasena que tu elijas:
```
ADMIN_PASSWORD=micontrasena123
```

**Paso 2.** Reinicia el servidor: `Ctrl+C` en la terminal y luego `npm run dev`.

**Paso 3.** Abre en tu navegador: http://localhost:3000/admin

Escribe tu contrasena y entras. Ahi ves una tabla con todos los contactos guardados en tu Google Sheet.

> Si alguna vez olvidas tu contrasena, simplemente cambia el valor de `ADMIN_PASSWORD` en `.env.local` y reinicia el servidor.

---

## Agregar un boton de pago con PayPal

Si quieres que los visitantes puedan pagarte directamente desde tu pagina, puedes agregar un boton de PayPal. Cuando alguien hace clic, lo lleva a tu pagina de PayPal.me donde completa el pago. No necesitas configurar ninguna API ni cuenta de desarrollador.

### Activarlo

**Paso 1.** Inicia sesion en https://paypal.com y en tu perfil crea tu link de PayPal.me. Quedara algo como `paypal.me/tunombre`.

**Paso 2.** Abre `src/config/site.js` en Cursor y edita la seccion `payment`:
```js
payment: {
  enabled: true,                // Cambia false por true para activarlo
  paypalMeUsername: "tunombre", // Tu usuario de PayPal.me (sin el paypal.me/ del inicio)
  defaultAmount: 29,            // Cuanto cobrar (pon 0 si quieres que el comprador decida)
  currency: "USD",
  buttonText: "Pagar con PayPal",
},
```

**Paso 3.** Para agregar el boton en cualquier parte de tu pagina, dile a Cursor:
> "Agrega el componente PaymentButton en la seccion de precios, debajo de cada plan"

Cursor sabe como hacerlo porque el componente ya existe en `src/components/PaymentButton.jsx`.

---

## Necesitas ayuda?

Pregunta en el canal del curso o escribele a tu instructor. Para que te puedan ayudar rapido, incluye siempre estas tres cosas:

1. El mensaje de error exacto que ves (copia y pega el texto, no hagas una foto).
2. Que le pediste a Cursor que hiciera.
3. En que archivo estabas trabajando.

Con esa informacion cualquiera puede reproducir el problema y ayudarte a resolverlo.
