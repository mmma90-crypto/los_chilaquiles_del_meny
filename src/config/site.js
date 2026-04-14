/**
 * ARCHIVO DE CONFIGURACION CENTRAL
 * =================================
 * Este es el archivo que debes editar para personalizar tu landing page.
 * Cambia los textos, colores y datos de contacto aqui.
 * Los cambios se aplicaran automaticamente en toda la pagina.
 */

export const siteConfig = {
  // ─────────────────────────────────────────────
  // INFORMACION DEL NEGOCIO
  // ─────────────────────────────────────────────
  name: "VibeCoding",
  tagline: "La plantilla perfecta para lanzar tu idea al mundo.",
  description:
    "Rapido, moderno y listo para personalizar a tu gusto.",

  // ─────────────────────────────────────────────
  // SECCION HERO (la primera pantalla que ven los visitantes)
  // ─────────────────────────────────────────────
  hero: {
    badge: "Bienvenido a tu nuevo proyecto",
    title: "Construye algo",
    titleHighlight: "increible",
    subtitle:
      "La plantilla perfecta para lanzar tu idea al mundo. Rapido, moderno y listo para personalizar a tu gusto.",
    ctaPrimary: "Empezar ahora",
    ctaSecondary: "Ver mas",
    // Enlace del boton principal. Puedes poner una URL de Calendly o Google Calendar.
    // Ejemplo Calendly: "https://calendly.com/tu-usuario/30min"
    // Ejemplo Google Calendar: "https://calendar.google.com/calendar/appointments/..."
    ctaPrimaryUrl: "#contacto",
    ctaSecondaryUrl: "#features",
  },

  // ─────────────────────────────────────────────
  // BENEFICIOS / FEATURES (seccion de caracteristicas)
  // ─────────────────────────────────────────────
  features: {
    heading: "Todo lo que necesitas para lanzar",
    subheading: "Caracteristicas disenadas para ayudarte a crecer.",
    items: [
      {
        icon: "lightning",
        title: "Rapido y eficiente",
        description:
          "Optimizado para velocidad. Tu sitio cargara en un instante y tus usuarios lo amaran.",
      },
      {
        icon: "mobile",
        title: "Diseno responsive",
        description:
          "Se ve perfecto en cualquier dispositivo: celular, tablet o computadora.",
      },
      {
        icon: "settings",
        title: "Facil de personalizar",
        description:
          "Cambia colores, textos e imagenes facilmente desde un solo archivo de configuracion.",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // PRECIOS (planes de pago)
  // ─────────────────────────────────────────────
  pricing: {
    heading: "Precios simples y transparentes",
    subheading:
      "Elige el plan que mejor se adapte a tus necesidades. Sin costos ocultos.",
    plans: [
      {
        name: "Basico",
        price: "$0",
        period: "/mes",
        description: "Perfecto para empezar",
        features: [
          "1 proyecto",
          "Soporte por email",
          "Actualizaciones basicas",
        ],
        cta: "Empezar gratis",
        highlighted: false,
      },
      {
        name: "Pro",
        price: "$29",
        period: "/mes",
        description: "Para crecer tu negocio",
        features: [
          "Proyectos ilimitados",
          "Soporte prioritario",
          "Todas las funcionalidades",
          "Analiticas avanzadas",
        ],
        cta: "Empezar ahora",
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$99",
        period: "/mes",
        description: "Para equipos grandes",
        features: [
          "Todo lo de Pro",
          "Soporte dedicado 24/7",
          "Integraciones custom",
          "SLA garantizado",
        ],
        cta: "Contactar ventas",
        highlighted: false,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // PREGUNTAS FRECUENTES (FAQ)
  // ─────────────────────────────────────────────
  faq: {
    heading: "Preguntas frecuentes",
    subheading: "Resolvemos tus dudas mas comunes.",
    items: [
      {
        question: "Como puedo empezar a usar la plantilla?",
        answer:
          "Solo necesitas clonar el repositorio, instalar las dependencias con npm install y ejecutar npm run dev para verla en tu computadora.",
      },
      {
        question: "Necesito saber programar?",
        answer:
          "No necesariamente. Puedes personalizar textos, colores e imagenes sin tocar codigo complejo. Solo edita el archivo src/config/site.js.",
      },
      {
        question: "Puedo usar mi propio dominio?",
        answer:
          "Si. Una vez que despliegues tu sitio en Vercel o cualquier otro hosting, puedes conectar tu dominio personalizado facilmente.",
      },
      {
        question: "Que metodos de pago aceptan?",
        answer:
          "Aceptamos tarjetas de credito y debito a traves de nuestra plataforma de pago segura.",
      },
      {
        question: "Ofrecen soporte tecnico?",
        answer:
          "Si. Todos los planes incluyen soporte por email. Los planes Pro y Enterprise tienen soporte prioritario.",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // SECCION DE CONTACTO
  // ─────────────────────────────────────────────
  contact: {
    heading: "Contactanos",
    subheading:
      "Envianos un mensaje y te responderemos lo antes posible.",
    // URL para agendar una cita (Calendly o Google Calendar)
    // Si no tienes, deja el valor vacio: ""
    schedulingUrl: "",
    schedulingCta: "Agendar una llamada",
    form: {
      namePlaceholder: "Tu nombre",
      emailPlaceholder: "tu@email.com",
      // Telefono es opcional. Cambia phoneRequired a true si quieres hacerlo obligatorio.
      phonePlaceholder: "Tu numero de telefono (opcional)",
      phoneRequired: false,
      messagePlaceholder: "Escribe tu mensaje aqui...",
      submitButton: "Enviar mensaje",
      sendingButton: "Enviando...",
      successMessage:
        "Mensaje enviado correctamente. Revisa tu email.",
      errorMessage:
        "Hubo un error al enviar. Intentalo de nuevo.",
    },
    // Datos de contacto opcionales para mostrar en el footer o sidebar
    email: "hola@vibecoding.com",
    phone: "",
    address: "",
  },

  // ─────────────────────────────────────────────
  // NAVEGACION
  // ─────────────────────────────────────────────
  nav: {
    links: [
      { label: "Inicio", href: "#inicio" },
      { label: "Features", href: "#features" },
      { label: "Precios", href: "#precios" },
      { label: "FAQ", href: "#faq" },
      { label: "Contacto", href: "#contacto" },
    ],
  },

  // ─────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────
  footer: {
    tagline: "Hecho con Next.js y mucho cafe.",
    links: [
      { label: "Inicio", href: "#inicio" },
      { label: "Features", href: "#features" },
      { label: "Precios", href: "#precios" },
      { label: "Contacto", href: "#contacto" },
    ],
    copyright: "Todos los derechos reservados.",
  },

  // ─────────────────────────────────────────────
  // EMAIL (notificaciones automaticas al recibir un contacto)
  // ─────────────────────────────────────────────
  email: {
    subject: "Recibimos tu mensaje",
    teamSignature: "El equipo de VibeCoding",
    // El remitente del email. Debe coincidir con tu dominio verificado en Resend.
    from: "onboarding@resend.dev",
  },

  // ─────────────────────────────────────────────
  // COLORES PRINCIPALES (referencia para personalizar globals.css)
  // ─────────────────────────────────────────────
  // Estos valores son documentacion. Para cambiar colores en Tailwind v4,
  // edita el archivo src/app/globals.css y modifica las variables CSS.
  colors: {
    primary: "indigo-600",    // Color principal (botones, acentos)
    secondary: "gray-900",    // Color de textos principales
    accent: "indigo-50",      // Fondos suaves y badges
    background: "white",      // Fondo general
  },

  // ─────────────────────────────────────────────
  // BOTON DE PAGO (PayPal)
  // ─────────────────────────────────────────────
  payment: {
    // Cambia enabled a true cuando tengas tu cuenta de PayPal lista
    enabled: false,
    // Tu nombre de usuario de PayPal.me
    // Para obtenerlo: ve a paypal.com > Perfil > Configura tu link PayPal.me
    // Ejemplo: si tu link es paypal.me/juanperez, escribe "juanperez"
    paypalMeUsername: "",
    // Monto sugerido en dolares. Pon 0 para que el comprador elija cuanto pagar.
    defaultAmount: 0,
    currency: "USD",
    buttonText: "Pagar con PayPal",
  },

  // ─────────────────────────────────────────────
  // METADATOS SEO (lo que aparece en Google y redes sociales)
  // ─────────────────────────────────────────────
  metadata: {
    title: "VibeCoding - Tu plantilla para lanzar rapido",
    description:
      "La plantilla perfecta para lanzar tu idea al mundo. Rapido, moderno y listo para personalizar.",
  },
};
