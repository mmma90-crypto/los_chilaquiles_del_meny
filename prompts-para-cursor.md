# Prompts para Cursor — VibeCoding

Estos prompts estan listos para copiar y pegar en Cursor. Reemplaza lo que esta entre corchetes `[ASI]` con tu propia informacion antes de enviarlo.

> **Como usar Cursor:** Abre el chat con `Ctrl+L` (o `Cmd+L` en Mac), pega el prompt y presiona Enter. Cursor va a leer los archivos del proyecto por su cuenta.

---

## Semana 3 — Primeros cambios

### Cambiar el color principal del sitio

```
Cambia el color principal del sitio de indigo/morado a [ESCRIBE EL COLOR, ejemplo: azul, verde, rojo, naranja].

El proyecto usa Tailwind CSS v4. El color actual es "indigo" y aparece en estos componentes:
- src/components/Header.jsx
- src/components/Hero.jsx
- src/components/Features.jsx
- src/components/Pricing.jsx
- src/components/ContactForm.jsx
- src/components/Footer.jsx

Para hacer el cambio de forma consistente:
1. Reemplaza todas las clases "indigo-" por el equivalente en el nuevo color de Tailwind
2. Asegúrate de cambiar tanto los fondos (bg-), textos (text-) y bordes (border-)
3. Actualiza también el comentario de color en src/config/site.js

Muéstrame los cambios antes de aplicarlos.
```

**Archivos que modifica:** `src/components/*.jsx`, `src/config/site.js`

**Resultado esperado:** Todo el sitio (botones, acentos, hover states) cambia al nuevo color de forma uniforme.

**Tip:** Los colores disponibles en Tailwind son: `slate`, `gray`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `violet`, `purple`, `fuchsia`, `pink`, `rose`.

---

### Cambiar el título y subtítulo del hero

```
Cambia el contenido de la sección hero en src/config/site.js con lo siguiente:

- hero.badge: "[TEXTO DEL BADGE, ejemplo: Nuevo lanzamiento 2024]"
- hero.title: "[PRIMERA PARTE DEL TITULO, ejemplo: Transforma tu]"
- hero.titleHighlight: "[PALABRA DESTACADA EN COLOR, ejemplo: negocio]"
- hero.subtitle: "[SUBTITULO COMPLETO, ejemplo: La herramienta que necesitas para crecer en digital.]"
- hero.ctaPrimary: "[TEXTO DEL BOTON PRINCIPAL, ejemplo: Quiero empezar]"
- hero.ctaSecondary: "[TEXTO DEL BOTON SECUNDARIO, ejemplo: Ver demo]"

Solo edita el archivo src/config/site.js, no toques los componentes.
```

**Archivos que modifica:** `src/config/site.js`

**Resultado esperado:** La sección principal de la página muestra los nuevos textos inmediatamente.

**Tip:** El `titleHighlight` es la palabra que aparece en color (actualmente morado). Úsala para enfatizar la palabra más importante de tu propuesta de valor.

---

### Agregar el logo del negocio en la barra de navegación

```
Quiero reemplazar el texto "VibeCoding" en el navbar por una imagen de logo.
El archivo se llama [NOMBRE DEL ARCHIVO, ejemplo: logo.png] y ya lo copié en la carpeta public/.

Modifica src/components/Header.jsx para:
1. Importar el componente Image de Next.js: import Image from "next/image"
2. Reemplazar el texto del nombre por: <Image src="/[NOMBRE DEL ARCHIVO]" alt="Logo" width={120} height={40} className="h-9 w-auto" />
3. Mantener el enlace href="#hero" que ya existe

No cambies nada más del Header.
```

**Archivos que modifica:** `src/components/Header.jsx`

**Resultado esperado:** El logo aparece en la esquina superior izquierda de la navbar en todos los tamaños de pantalla.

**Tip:** El `width` y `height` son obligatorios en Next.js Image. Si tu logo se ve muy grande o muy pequeño, ajusta el valor del `className` cambiando `h-9` por `h-8` (más pequeño) o `h-12` (más grande).

---

### Cambiar el nombre del negocio en todo el sitio

```
Cambia el nombre del negocio en el archivo src/config/site.js:
- name: "[NOMBRE DE TU NEGOCIO]"
- metadata.title: "[NOMBRE DE TU NEGOCIO] - [DESCRIPCION CORTA]"
- metadata.description: "[DESCRIPCION PARA GOOGLE, 1-2 oraciones]"
- footer.tagline: "[FRASE DEL FOOTER]"
- email.teamSignature: "El equipo de [NOMBRE DE TU NEGOCIO]"

Solo edita src/config/site.js.
```

**Archivos que modifica:** `src/config/site.js`

**Resultado esperado:** El nombre nuevo aparece en el header, footer, pestaña del navegador y en los emails automáticos.

---

## Semana 4 — Personalización

### Agregar una sección de testimonios

```
Crea una sección de testimonios que muestre opiniones de clientes. Sigue estas instrucciones:

1. Agrega una nueva sección en src/config/site.js llamada "testimonials" con este formato:
   testimonials: {
     heading: "[TITULO DE LA SECCION, ejemplo: Lo que dicen nuestros clientes]",
     items: [
       { name: "[NOMBRE 1]", role: "[CARGO/EMPRESA 1]", text: "[TESTIMONIO 1]" },
       { name: "[NOMBRE 2]", role: "[CARGO/EMPRESA 2]", text: "[TESTIMONIO 2]" },
       { name: "[NOMBRE 3]", role: "[CARGO/EMPRESA 3]", text: "[TESTIMONIO 3]" },
     ]
   }

2. Crea el archivo src/components/Testimonials.jsx que:
   - Importe siteConfig desde "@/config/site"
   - Muestre las tarjetas en un grid de 3 columnas (md:grid-cols-3)
   - Cada tarjeta con el texto del testimonio, nombre y cargo
   - Use el mismo estilo visual que Features.jsx (bg-white, rounded-2xl, border)

3. Agrega <Testimonials /> en src/app/page.js después del componente <Features />

Usa los 3 testimonios que te doy aquí:
[PEGA AQUI TUS 3 TESTIMONIOS]
```

**Archivos que modifica:** `src/config/site.js`, `src/components/Testimonials.jsx` (nuevo), `src/app/page.js`

**Resultado esperado:** Una nueva sección con 3 tarjetas de testimonio aparece entre Features y Pricing.

---

### Cambiar la tipografía del sitio

```
Cambia la fuente principal del sitio a [NOMBRE DE LA FUENTE, ejemplo: Inter, Poppins, Nunito, Lato].

El proyecto usa Next.js con next/font/google. Los cambios son:

1. En src/app/layout.js:
   - Reemplaza la importación actual de Geist por la nueva fuente
   - Ejemplo si quieres Inter: import { Inter } from "next/font/google"
   - Actualiza la configuración y el nombre de la variable CSS
   - Asegúrate de que el className del body use la nueva variable

2. En src/app/globals.css:
   - Actualiza --font-sans para que apunte a la nueva variable CSS

Muéstrame exactamente qué líneas cambian antes de aplicarlo.
```

**Archivos que modifica:** `src/app/layout.js`, `src/app/globals.css`

**Resultado esperado:** Toda la tipografía del sitio cambia a la nueva fuente sin perder los estilos.

**Tip:** Fuentes populares para proyectos de negocios: `Inter` (moderna, limpia), `Poppins` (amigable, redondeada), `Nunito` (suave), `Lato` (profesional). Todas están en Google Fonts y son gratuitas.

---

### Actualizar los beneficios/features con los de mi negocio

```
Actualiza la sección de features en src/config/site.js con la información de mi negocio:

features: {
  heading: "[TITULO DE LA SECCION]",
  subheading: "[SUBTITULO]",
  items: [
    {
      icon: "lightning",
      title: "[BENEFICIO 1]",
      description: "[DESCRIPCION DEL BENEFICIO 1, 1-2 oraciones]"
    },
    {
      icon: "mobile",
      title: "[BENEFICIO 2]",
      description: "[DESCRIPCION DEL BENEFICIO 2]"
    },
    {
      icon: "settings",
      title: "[BENEFICIO 3]",
      description: "[DESCRIPCION DEL BENEFICIO 3]"
    }
  ]
}

Los iconos disponibles son: "lightning" (rayo), "mobile" (celular), "settings" (engranaje).
Solo modifica src/config/site.js.
```

**Archivos que modifica:** `src/config/site.js`

**Resultado esperado:** Los 3 bloques de beneficios muestran la información real de tu negocio.

---

### Actualizar precios y planes

```
Actualiza los planes de precios en src/config/site.js con los precios reales de mi negocio:

pricing.plans debe quedar así:
[
  {
    name: "[NOMBRE DEL PLAN 1, ejemplo: Basico]",
    price: "[PRECIO, ejemplo: $0 o Gratis]",
    period: "[PERIODO, ejemplo: /mes o /sesion]",
    description: "[PARA QUIEN ES]",
    features: ["[INCLUYE 1]", "[INCLUYE 2]", "[INCLUYE 3]"],
    cta: "[TEXTO DEL BOTON]",
    highlighted: false
  },
  {
    name: "[NOMBRE DEL PLAN 2]",
    price: "[PRECIO]",
    period: "[PERIODO]",
    description: "[PARA QUIEN ES]",
    features: ["[INCLUYE 1]", "[INCLUYE 2]", "[INCLUYE 3]", "[INCLUYE 4]"],
    cta: "[TEXTO DEL BOTON]",
    highlighted: true
  },
  {
    name: "[NOMBRE DEL PLAN 3]",
    price: "[PRECIO]",
    period: "[PERIODO]",
    description: "[PARA QUIEN ES]",
    features: ["[INCLUYE 1]", "[INCLUYE 2]", "[INCLUYE 3]"],
    cta: "[TEXTO DEL BOTON]",
    highlighted: false
  }
]

Solo modifica src/config/site.js.
```

**Archivos que modifica:** `src/config/site.js`

**Resultado esperado:** Los 3 planes de precio muestran tus precios reales. El plan con `highlighted: true` se verá más grande y en color.

---

### Actualizar las preguntas frecuentes

```
Reemplaza todas las preguntas frecuentes en src/config/site.js con las preguntas reales de mi negocio.

El formato de cada pregunta es:
{ question: "[PREGUNTA]", answer: "[RESPUESTA]" }

Mis preguntas son:
[PEGA AQUI TUS PREGUNTAS Y RESPUESTAS]

Si tengo más o menos de 5, ajusta el array. Solo modifica src/config/site.js.
```

**Archivos que modifica:** `src/config/site.js`

**Resultado esperado:** El acordeón de FAQ muestra las preguntas reales de tu negocio.

---

### Agregar un campo nuevo al formulario de contacto

```
Quiero agregar el campo "Empresa" al formulario de contacto. Los pasos son:

1. En src/config/site.js, dentro de contact.form agrega:
   companyPlaceholder: "Nombre de tu empresa (opcional)"

2. En src/components/ContactForm.jsx:
   - Agrega "company: ''" al estado inicial del formulario
   - Agrega el campo de empresa entre el campo de email y el de teléfono
   - Sigue el mismo estilo visual de los otros campos

3. En src/app/api/contact/route.js:
   - Extrae "company" del body del request
   - Pásalo a addRowToSheet

4. En src/libs/google-sheets.js:
   - Agrega el parámetro "company" a la función addRowToSheet
   - Agrega la columna "Empresa" a la fila que se guarda en Google Sheets

IMPORTANTE: En tu Google Sheet agrega la columna "Empresa" manualmente antes de probar.
```

**Archivos que modifica:** `src/config/site.js`, `src/components/ContactForm.jsx`, `src/app/api/contact/route.js`, `src/libs/google-sheets.js`

**Resultado esperado:** El formulario muestra el campo "Empresa" y los datos se guardan en la columna correspondiente en Google Sheets.

---

## Semana 5 — Backend

### El formulario no envía — diagnóstico y solución

```
El formulario de contacto no está funcionando. Ayúdame a diagnosticar el problema.

Por favor revisa en este orden:
1. El archivo src/app/api/contact/route.js para ver si hay errores de sintaxis
2. El archivo .env.local para confirmar que todas estas variables existen:
   - RESEND_API_KEY
   - RESEND_FROM_EMAIL
   - GOOGLE_SERVICE_ACCOUNT_EMAIL
   - GOOGLE_PRIVATE_KEY
   - GOOGLE_SHEET_ID
3. El archivo src/libs/resend.js y src/libs/google-sheets.js para verificar que estén bien

El error que veo en la pantalla es: [PEGA AQUI EL MENSAJE DE ERROR]
El error en la terminal es: [PEGA AQUI EL ERROR DE LA TERMINAL, si hay]

¿Cuál es el problema y cómo lo resuelvo?
```

**Archivos que revisa:** `src/app/api/contact/route.js`, `src/libs/resend.js`, `src/libs/google-sheets.js`, `.env.local`

**Resultado esperado:** Cursor identifica la causa exacta del problema y propone la solución.

**Tip:** El error más común es que `GOOGLE_PRIVATE_KEY` no tiene el formato correcto. Debe incluir `\n` entre cada línea de la clave y estar entre comillas dobles en `.env.local`.

---

### Cambiar el email de confirmación que recibe el lead

```
Quiero personalizar el email que recibe el visitante cuando llena el formulario de contacto.

Modifica el template HTML en src/app/api/contact/route.js para que diga:
- Asunto: "[NUEVO ASUNTO, ejemplo: Gracias por contactarnos]" — actualiza también email.subject en site.js
- Saludo: "[SALUDO, ejemplo: Hola]"  
- Mensaje principal: "[TEXTO DEL EMAIL]"
- Firma: "[NOMBRE DE TU EQUIPO]" — actualiza también email.teamSignature en site.js

El template usa HTML inline con estilos. Mantén la estructura actual pero cambia los textos.
También actualiza src/config/site.js con el nuevo asunto y firma.
```

**Archivos que modifica:** `src/app/api/contact/route.js`, `src/config/site.js`

**Resultado esperado:** El email que reciben los visitantes usa tu mensaje personalizado.

---

### Activar el link de Calendly en el formulario

```
Quiero que el formulario de contacto muestre un botón para agendar una cita en Calendly.

En src/config/site.js modifica la sección contact:
- schedulingUrl: "[TU URL DE CALENDLY, ejemplo: https://calendly.com/tu-usuario/30min]"
- schedulingCta: "[TEXTO DEL BOTON, ejemplo: Agendar una llamada de 30 min]"

El botón ya está programado en ContactForm.jsx y solo aparece cuando schedulingUrl tiene valor.
Solo necesitas editar site.js.
```

**Archivos que modifica:** `src/config/site.js`

**Resultado esperado:** Aparece un botón debajo del título de la sección de contacto que abre Calendly en una pestaña nueva.

---

## Semana 6-7 — SEO y optimización

### Agregar meta tags de SEO completos

```
Quiero agregar meta tags de SEO para que el sitio se vea bien en Google y al compartir en redes sociales.

Modifica src/config/site.js con esta información:
metadata: {
  title: "[TITULO PARA GOOGLE, 50-60 caracteres máximo]",
  description: "[DESCRIPCION PARA GOOGLE, 150-160 caracteres máximo]",
}

Luego modifica src/app/layout.js para expandir el objeto metadata con:
- openGraph (para Facebook/WhatsApp): title, description, url, siteName, locale
- twitter: card, title, description
- keywords: array de palabras clave de tu negocio

Usa la información de src/config/site.js como fuente de verdad.
```

**Archivos que modifica:** `src/config/site.js`, `src/app/layout.js`

**Resultado esperado:** Al buscar tu sitio en Google aparece el título y descripción correctos. Al compartir el link en WhatsApp o redes muestra la vista previa.

---

### Reemplazar imágenes con el componente optimizado de Next.js

```
Quiero optimizar las imágenes del sitio usando el componente Image de Next.js para que cargue más rápido.

Revisa todos los archivos en src/components/ y src/app/ para encontrar tags <img> sin optimizar.
Para cada uno que encuentres:
1. Importa Image de next/image si no está importado
2. Reemplaza <img src="..." alt="..." /> por <Image src="..." alt="..." width={X} height={Y} />
3. Para imágenes que deben ocupar el 100% de su contenedor, usa fill con un padre relative

Si hay imágenes de dominios externos (URLs de internet), dime cuáles son para agregar 
los dominios permitidos en next.config.mjs.
```

**Archivos que modifica:** `src/components/*.jsx`, `src/app/*.js`, posiblemente `next.config.mjs`

**Resultado esperado:** Las imágenes cargan más rápido porque Next.js las convierte a formato WebP y las ajusta al tamaño exacto que necesita el navegador.

---

### Agregar Google Analytics

```
Quiero agregar Google Analytics 4 para ver cuántas personas visitan mi sitio.

Tengo mi ID de medición de Google Analytics: [TU ID, ejemplo: G-XXXXXXXXXX]

Por favor:
1. Crea el componente src/components/Analytics.jsx que cargue el script de GA4
   usando next/script con la estrategia "afterInteractive" para no afectar la velocidad
2. Agrega el componente en src/app/layout.js dentro del body, después de {children}
3. El ID de medición debe guardarse en src/config/site.js como analytics.googleId

Si no tengo el ID todavía, muéstrame los pasos para crearlo en analytics.google.com.
```

**Archivos que modifica:** `src/components/Analytics.jsx` (nuevo), `src/app/layout.js`, `src/config/site.js`

**Resultado esperado:** El sitio envía datos de visitas a Google Analytics. Puedes ver estadísticas en tiempo real en analytics.google.com.

---

### Configurar dominio personalizado (preparación para Vercel)

```
Me preparé para conectar mi dominio personalizado "[TU DOMINIO, ejemplo: minegocio.com]" en Vercel.

Por favor actualiza src/config/site.js con la URL definitiva del sitio:
- metadata.title sigue igual
- Agrega metadata.siteUrl: "https://[TU DOMINIO]"

Luego actualiza src/app/layout.js para incluir en metadata:
- metadataBase: new URL("https://[TU DOMINIO]")
- canonical URL en openGraph

Esto es necesario para que los meta tags de SEO funcionen correctamente con el dominio real.
```

**Archivos que modifica:** `src/config/site.js`, `src/app/layout.js`

**Resultado esperado:** Los meta tags usan tu dominio real, lo cual mejora el SEO y las vistas previas al compartir en redes.

---

## Prompts de emergencia — para cuando algo no funciona

### La pantalla se ve en blanco o hay un error rojo

```
El sitio muestra una pantalla en blanco o un error rojo. El mensaje es:
[PEGA EL MENSAJE DE ERROR COMPLETO]

Estoy en el archivo [NOMBRE DEL ARCHIVO QUE ESTABA EDITANDO].
El último cambio que hice fue: [DESCRIBE QUE CAMBIASTE].

Ayúdame a encontrar y corregir el error.
```

---

### Algo no se ve bien en mobile

```
En pantalla de celular [DESCRIBE EL PROBLEMA, ejemplo: el texto se sale, el menú no cierra, 
los botones quedan muy juntos].

El problema está en [SECCION O COMPONENTE, ejemplo: la sección Hero, el Header].
En desktop se ve bien, solo en mobile falla.

Revisa el componente correspondiente en src/components/ y corrige el CSS de Tailwind 
para que se vea bien en pantallas pequeñas (sm: y md: breakpoints).
```

---

### Quiero deshacer el último cambio

```
El último cambio que hiciste no quedó como esperaba. 
Quiero volver al estado anterior de [NOMBRE DEL ARCHIVO].

El problema es: [DESCRIBE QUE SALIO MAL]

¿Puedes revertir solo ese archivo al estado en que estaba antes?
```

**Tip:** Si ya guardaste y Cursor no puede revertirlo fácilmente, puedes usar Git. En la terminal escribe `git diff src/components/NombreDelArchivo.jsx` para ver qué cambió, o `git checkout src/components/NombreDelArchivo.jsx` para deshacerlo completamente.

---

## Glosario de términos que usa Cursor

| Cuando Cursor dice... | Significa... |
|---|---|
| "Server Component" | Código que corre en el servidor, no en el navegador |
| "Client Component" | Código que corre en el navegador (necesita `"use client"`) |
| "importar" | Traer código de otro archivo para usarlo |
| "prop" | Un valor que se le pasa a un componente, como un parámetro |
| "estado" (state) | Un valor que puede cambiar y actualiza la pantalla automáticamente |
| "hook" | Una función especial de React (siempre empieza con `use`) |
| "build" | El proceso de preparar el proyecto para publicarlo |
| "deploy" | Publicar el sitio en internet |
| "environment variable" | Variable de entorno — dato secreto en `.env.local` |
| "route" | Una URL del sitio, como `/admin` o `/api/contact` |
