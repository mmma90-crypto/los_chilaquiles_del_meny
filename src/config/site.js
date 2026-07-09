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
  name: "Los Chilaquiles del Meny",
  tagline: "Los favoritos, sabor casero en cada bocado.",
  description:
    "Chilaquiles verdes y rojos, picosos o suaves, con la proteina que mas te guste. Solo domingos.",

  // ─────────────────────────────────────────────
  // HORARIO
  // ─────────────────────────────────────────────
  hours: {
    heading: "Horario de atencion",
    schedule: [
      { day: "Domingo", open: "9:00 AM", close: "1:00 PM" },
    ],
  },

  // ─────────────────────────────────────────────
  // SECCION HERO
  // ─────────────────────────────────────────────
  hero: {
    badge: "Domingos 9 AM – 1 PM",
    title: "Los Chilaquiles",
    titleHighlight: "del Meny",
    subtitle:
      "Los favoritos, sabor casero en cada bocado. Chilaquiles verdes y rojos, picosos o suaves, con pollo, huevo, chicharron prensado, barbacoa y mas.",
    ctaPrimary: "Armar mi pedido",
    ctaSecondary: "Contáctanos",
    ctaPrimaryUrl: "#pricing",
    ctaSecondaryUrl: "#contact",
  },

  // ─────────────────────────────────────────────
  // BENEFICIOS / FEATURES
  // ─────────────────────────────────────────────
  features: {
    heading: "Sabor casero que se nota",
    subheading: "Preparamos cada orden con ingredientes frescos y recetas de casa.",
    items: [
      {
        icon: "lightning",
        title: "Hechos al momento",
        description:
          "Tus chilaquiles se preparan cuando los pides, crujientes por fuera y con la salsa justa.",
      },
      {
        icon: "mobile",
        title: "Verdes o rojos, tú eliges",
        description:
          "Salsa verde o roja, picosa o suave. Combina como quieras en cada visita.",
      },
      {
        icon: "settings",
        title: "Domingos en familia",
        description:
          "Nos vemos los domingos de 9 AM a 1 PM. El plan perfecto para un desayuno casero.",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // PREGUNTAS FRECUENTES
  // ─────────────────────────────────────────────
  faq: {
    heading: "Preguntas frecuentes",
    subheading: "Lo que más nos preguntan antes de venir.",
    items: [
      {
        question: "¿Qué días abren?",
        answer:
          "Por ahora atendemos los domingos de 9:00 AM a 1:00 PM. Si agregamos más días, lo actualizaremos aquí en la página.",
      },
      {
        question: "¿Tienen opción picosa y no picosa?",
        answer:
          "Sí. Tanto los chilaquiles verdes como los rojos los puedes pedir picosos o no picosos, según tu gusto.",
      },
      {
        question: "¿Qué proteínas puedo agregar?",
        answer:
          "Puedes pedirlos sencillos o con pollo, huevo, chicharrón prensado o barbacoa.",
      },
      {
        question: "¿Puedo hacer pedidos por anticipado?",
        answer:
          "Sí. Escríbenos por el formulario de contacto o llámanos y con gusto te tomamos la orden.",
      },
      {
        question: "¿Aceptan pagos con tarjeta?",
        answer:
          "Sí, puedes pagar con tarjeta a través de PayPal, por transferencia a Mercado Pago, o en efectivo al recibir tu pedido.",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // SECCION DE CONTACTO
  // ─────────────────────────────────────────────
  contact: {
    heading: "Contáctanos",
    subheading:
      "Escríbenos para pedidos, dudas o sugerencias. Te esperamos los domingos de 9 AM a 1 PM.",
    schedulingUrl: "",
    schedulingCta: "Agendar una llamada",
    form: {
      namePlaceholder: "Tu nombre",
      emailPlaceholder: "tu@email.com",
      phonePlaceholder: "Tu número de teléfono (opcional)",
      phoneRequired: false,
      messagePlaceholder: "Ejemplo: quiero chilaquiles verdes con pollo, no picosos...",
      submitButton: "Enviar mensaje",
      sendingButton: "Enviando...",
      successMessage: "Mensaje enviado correctamente. Te responderemos pronto.",
      errorMessage: "Hubo un error al enviar. Inténtalo de nuevo.",
    },
    email: "hola@loschilaquilesdelmeny.com",
    phone: "",
    address: "",
  },

  // ─────────────────────────────────────────────
  // NAVEGACION
  // ─────────────────────────────────────────────
  nav: {
    links: [
      { label: "Inicio", href: "#hero" },
      { label: "Nosotros", href: "#features" },
      { label: "Menú", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Contacto", href: "#contact" },
    ],
  },

  // ─────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────
  footer: {
    tagline: "Los favoritos, sabor casero en cada bocado.",
    links: [
      { label: "Inicio", href: "#hero" },
      { label: "Menú", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Contacto", href: "#contact" },
    ],
    copyright: "Todos los derechos reservados.",
    // Links a las paginas legales (se muestran discretos al pie del footer)
    legalLinks: [
      { label: "Términos y Condiciones", href: "/terminos-y-condiciones" },
      { label: "Aviso de Privacidad", href: "/aviso-de-privacidad" },
      { label: "Aviso Legal", href: "/aviso-legal" },
      { label: "Política de Compras", href: "/politica-de-compras" },
      { label: "Envíos y Entregas", href: "/politica-de-envios" },
      { label: "Cancelaciones y Reembolsos", href: "/politica-de-cancelaciones" },
      { label: "Cookies", href: "/politica-de-cookies" },
    ],
  },

  // ─────────────────────────────────────────────
  // WHATSAPP ← aquí está tu número
  // ─────────────────────────────────────────────
  whatsapp: {
    number: "526142750183", // lada de México (52) + tu número
  },

  // ─────────────────────────────────────────────
  // PAGO — PayPal
  // Cambia paypalMeUsername por tu usuario de PayPal.me
  // Ejemplo: si tu link es paypal.me/MenyChilaquiles → pon "MenyChilaquiles"
  // ─────────────────────────────────────────────
  payment: {
    enabled: true,
    paypalMeUsername: "lochilaquilesdelmeny", // ← CAMBIAR por tu usuario de PayPal.me
    defaultAmount: 0,
    currency: "MXN",
    buttonText: "Pagar con PayPal",
  },

  // ─────────────────────────────────────────────
  // EMAIL (notificaciones automáticas)
  // ─────────────────────────────────────────────
  email: {
    subject: "Recibimos tu mensaje — Los Chilaquiles del Meny",
    teamSignature: "Los Chilaquiles del Meny",
    from: "onboarding@resend.dev",
  },

  // ─────────────────────────────────────────────
  // METADATOS SEO
  // ─────────────────────────────────────────────
  metadata: {
    title: "Los Chilaquiles del Meny — Sabor casero los domingos",
    description:
      "Chilaquiles verdes y rojos, picosos o suaves, con pollo, huevo, chicharrón prensado y barbacoa. Domingos de 9 AM a 1 PM.",
  },
};
