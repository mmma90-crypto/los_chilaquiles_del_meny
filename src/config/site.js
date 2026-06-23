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

  // HORARIO — agrega mas dias copiando una linea en schedule

  // Ejemplo: { day: "Sabado", open: "9:00 AM", close: "2:00 PM" },

  // ─────────────────────────────────────────────

  hours: {

    heading: "Horario de atencion",

    schedule: [

      { day: "Domingo", open: "9:00 AM", close: "1:00 PM" },

    ],

  },



  // ─────────────────────────────────────────────

  // SECCION HERO (la primera pantalla que ven los visitantes)

  // ─────────────────────────────────────────────

  hero: {

    badge: "Domingos 9 AM – 1 PM",

    title: "Los Chilaquiles",

    titleHighlight: "del Meny",

    subtitle:

      "Los favoritos, sabor casero en cada bocado. Chilaquiles verdes y rojos, picosos o suaves, con pollo, huevo, chicharron prensado, barbacoa y mas.",

    ctaPrimary: "Ver menu",

    ctaSecondary: "Contactanos",

    ctaPrimaryUrl: "#pricing",

    ctaSecondaryUrl: "#contact",

  },



  // ─────────────────────────────────────────────

  // BENEFICIOS / FEATURES (seccion de caracteristicas)

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

        title: "Verdes o rojos, tu eliges",

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

  // MENU (seccion de precios — aqui va tu carta)

  // ─────────────────────────────────────────────

  pricing: {

    heading: "Nuestro menu",

    subheading:

      "Elige tu salsa y la proteina que prefieras. Pregunta precios al ordenar.",

    plans: [

      {

        name: "Chilaquiles verdes",

        price: "Consultar",

        period: "",

        description: "Salsa verde casera",

        features: ["Picosos", "No picosos"],

        cta: "Ordenar",

        highlighted: false,

      },

      {

        name: "Chilaquiles rojos",

        price: "Consultar",

        period: "",

        description: "Salsa roja casera",

        features: ["Picosos", "No picosos"],

        cta: "Ordenar",

        highlighted: true,

      },

      {

        name: "Con proteina",

        price: "Consultar",

        period: "",

        description: "Agrega a tus chilaquiles",

        features: [

          "Sencillos",

          "Pollo",

          "Huevo",

          "Chicharron prensado",

          "Barbacoa",

        ],

        cta: "Ordenar",

        highlighted: false,

      },

    ],

  },



  // ─────────────────────────────────────────────

  // PREGUNTAS FRECUENTES (FAQ)

  // ─────────────────────────────────────────────

  faq: {

    heading: "Preguntas frecuentes",

    subheading: "Lo que mas nos preguntan antes de venir.",

    items: [

      {

        question: "Que dias abren?",

        answer:

          "Por ahora atendemos los domingos de 9:00 AM a 1:00 PM. Si agregamos mas dias, lo actualizaremos aqui en la pagina.",

      },

      {

        question: "Tienen opcion picosa y no picosa?",

        answer:

          "Si. Tanto los chilaquiles verdes como los rojos los puedes pedir picosos o no picosos, segun tu gusto.",

      },

      {

        question: "Que proteinas puedo agregar?",

        answer:

          "Puedes pedirlos sencillos o con pollo, huevo, chicharron prensado o barbacoa.",

      },

      {

        question: "Puedo hacer pedidos por anticipado?",

        answer:

          "Si. Escribenos por el formulario de contacto o llamanos y con gusto te tomamos la orden.",

      },

      {

        question: "Aceptan pagos con tarjeta?",

        answer:

          "Consultanos directamente las formas de pago disponibles el dia de tu visita.",

      },

    ],

  },



  // ─────────────────────────────────────────────

  // SECCION DE CONTACTO

  // ─────────────────────────────────────────────

  contact: {

    heading: "Contactanos",

    subheading:

      "Escribenos para pedidos, dudas o sugerencias. Te esperamos los domingos de 9 AM a 1 PM.",

    schedulingUrl: "",

    schedulingCta: "Agendar una llamada",

    form: {

      namePlaceholder: "Tu nombre",

      emailPlaceholder: "tu@email.com",

      phonePlaceholder: "Tu numero de telefono (opcional)",

      phoneRequired: false,

      messagePlaceholder: "Ejemplo: quiero chilaquiles verdes con pollo, no picosos...",

      submitButton: "Enviar mensaje",

      sendingButton: "Enviando...",

      successMessage:

        "Mensaje enviado correctamente. Te responderemos pronto.",

      errorMessage:

        "Hubo un error al enviar. Intentalo de nuevo.",

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

      { label: "Menu", href: "#pricing" },

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

      { label: "Menu", href: "#pricing" },

      { label: "FAQ", href: "#faq" },

      { label: "Contacto", href: "#contact" },

    ],

    copyright: "Todos los derechos reservados.",

  },



  // ─────────────────────────────────────────────

  // EMAIL (notificaciones automaticas al recibir un contacto)

  // ─────────────────────────────────────────────

  email: {

    subject: "Recibimos tu mensaje — Los Chilaquiles del Meny",

    teamSignature: "Los Chilaquiles del Meny",

    from: "onboarding@resend.dev",

  },



  // ─────────────────────────────────────────────

  // COLORES PRINCIPALES (referencia para personalizar globals.css)

  // ─────────────────────────────────────────────

  colors: {

    primary: "salsa-700",

    secondary: "stone-900",

    accent: "crema-100",

    accentText: "verde-600",

    highlight: "salsa-600",

    background: "crema-50",

  },



  // ─────────────────────────────────────────────

  // BOTON DE PAGO (PayPal)

  // ─────────────────────────────────────────────

  payment: {

    enabled: true,

    paypalMeUsername: "PGutierrezCarrera",

    defaultAmount: 0,

    currency: "USD",

    buttonText: "Pagar con PayPal",

  },



  // ─────────────────────────────────────────────

  // METADATOS SEO (lo que aparece en Google y redes sociales)

  // ─────────────────────────────────────────────

  metadata: {

    title: "Los Chilaquiles del Meny — Sabor casero los domingos",

    description:

      "Chilaquiles verdes y rojos, picosos o suaves, con pollo, huevo, chicharron prensado y barbacoa. Domingos de 9 AM a 1 PM.",

  },

};


