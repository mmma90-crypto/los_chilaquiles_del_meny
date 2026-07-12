/**
 * CONFIGURACION DEL MENU Y PRECIOS
 * ================================
 * Edita aqui productos, precios y textos del flujo de pedido.
 * La pantalla del menu lee todo desde este archivo.
 */

export const menuConfig = {
  currency: "MXN",
  locale: "es-MX",

  heading: "Arma tu pedido",
  subheading:
    "Elige tu base, proteina y toppings. El total se actualiza al instante.",

  steps: {
    base: {
      number: 1,
      title: "Base",
      badge: "Obligatorio",
      price: 100,
      options: [
        {
          id: "verdes",
          label: "Chilaquiles verdes",
          description: "Salsa verde casera",
        },
        {
          id: "rojos",
          label: "Chilaquiles rojos",
          description: "Salsa roja casera",
        },
        {
          id: "combinados",
          label: "Combinados (verde + roja)",
          description: "Mitad verde, mitad roja",
        },
      ],
    },

    protein: {
      number: 2,
      title: "Proteina",
      badge: "Opcional — agrega las que quieras",
      // `activo` es el valor por defecto si la pestaña "Disponibilidad" de
      // Google Sheets no responde; la disponibilidad real se administra desde
      // el panel de admin (Compras > Disponibilidad de proteinas).
      options: [
        { id: "huevo", label: "Huevo", price: 10, activo: true },
        { id: "pollo", label: "Pollo", price: 20, activo: true },
        { id: "chicharron", label: "Chicharron prensado", price: 30, activo: true },
        { id: "barbacoa", label: "Barbacoa", price: 40, activo: true },
      ],
    },

    toppings: {
      number: 3,
      title: "Toppings",
      badge: "Opcional — incluidos sin costo",
      options: [
        { id: "queso", label: "Queso" },
        { id: "crema", label: "Crema" },
        { id: "cilantro", label: "Cilantro" },
        { id: "cebolla", label: "Cebolla" },
      ],
    },
  },

  spice: {
    verdeQuestion: "Salsa verde: ¿picosa o no picosa?",
    rojoQuestion: "Salsa roja: ¿picosa o no picosa?",
    singleQuestion: "¿Picoso o no picoso?",
    options: [
      { id: "picoso", label: "Picoso" },
      { id: "no-picoso", label: "No picoso" },
    ],
  },

  summary: {
    heading: "Resumen del pedido",
    totalLabel: "Total",
    emptyMessage: "Elige una base para empezar tu pedido.",
    continueButton: "Continuar",
    baseLabel: "Base",
    proteinLabel: "Proteina",
    toppingsLabel: "Toppings",
    noneSelected: "Ninguno",
  },

  // Paso de datos del cliente (aparece despues de "Continuar")
  customer: {
    heading: "Tus datos de entrega",
    subheading: "Necesitamos estos datos para llevarte tu pedido.",

    nameLabel: "Nombre completo",
    namePlaceholder: "Tu nombre completo",

    phoneLabel: "Telefono",
    phonePlaceholder: "10 digitos",

    addressLabel: "Direccion (calle, numero, colonia)",
    addressPlaceholder: "Calle, numero y colonia",

    locationLabel: "Ubicacion",
    locationButton: "Usar mi ubicacion actual",
    locationLoading: "Obteniendo ubicacion...",
    locationCaptured: "Ubicacion capturada ✓",
    locationPreview: "Previsualizar ubicacion",
    locationDeniedMessage:
      "No pudimos obtener tu ubicacion. No te preocupes, escribe tu direccion a mano y con eso te encontramos.",
    locationUnsupportedMessage:
      "Tu navegador no permite compartir ubicacion. No te preocupes, escribe tu direccion a mano y con eso te encontramos.",

    accessCodeLabel: "Codigo de acceso al fraccionamiento",
    accessCodePlaceholder: "Si tu fraccionamiento pide codigo, escribelo aqui",

    accessRefLabel: "Link o referencia de acceso",
    accessRefPlaceholder: "Pega aqui un enlace o una referencia de como llegar",

    optionalTag: "(opcional)",
    backButton: "Volver al pedido",
    payButton: "Continuar al pago",

    errors: {
      name: "Por favor escribe tu nombre completo.",
      phone: "Por favor escribe tu telefono.",
      address: "Por favor escribe tu direccion.",
    },
  },
};
