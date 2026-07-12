"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { menuConfig } from "@/config/menu";
import { siteConfig } from "@/config/site";

/* ─── helpers ─────────────────────────────────── */
const PAY_METHOD_LABELS = {
  efectivo: "Efectivo (al recibir)",
  transferencia: "Transferencia (envío comprobante)",
  tarjeta: "Tarjeta (PayPal)",
};

function formatPrice(amount) {
  return new Intl.NumberFormat(menuConfig.locale, {
    style: "currency",
    currency: menuConfig.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function findOption(options, id) {
  return options.find((o) => o.id === id) ?? null;
}

function spiceLabel(spiceId) {
  return (
    menuConfig.spice.options.find((o) => o.id === spiceId)?.label ?? spiceId
  );
}

function isStep1Complete(base, verdeSpice, rojoSpice) {
  if (!base) return false;
  if (base === "verdes") return Boolean(verdeSpice);
  if (base === "rojos") return Boolean(rojoSpice);
  if (base === "combinados") return Boolean(verdeSpice && rojoSpice);
  return false;
}

/* Calcula las lineas y el total de UNA orden configurada. Es la misma logica
   de precios que siempre uso el formulario, extraida a una funcion pura para
   poder calcular tambien cada orden guardada en el carrito. */
function buildOrderSummary({ base, verdeSpice, rojoSpice, proteins, toppings }) {
  const { steps, summary } = menuConfig;
  const lines = [];
  let total = 0;

  if (isStep1Complete(base, verdeSpice, rojoSpice)) {
    const baseOption = findOption(steps.base.options, base);
    total += steps.base.price;
    let baseDetail = baseOption?.label ?? base;
    if (base === "verdes") baseDetail += ` (${spiceLabel(verdeSpice)})`;
    else if (base === "rojos") baseDetail += ` (${spiceLabel(rojoSpice)})`;
    else if (base === "combinados")
      baseDetail += ` — verde ${spiceLabel(verdeSpice).toLowerCase()}, roja ${spiceLabel(rojoSpice).toLowerCase()}`;
    lines.push({ label: summary.baseLabel, value: baseDetail, price: steps.base.price, isAddon: false });
  }

  steps.protein.options.forEach((opt) => {
    const qty = proteins[opt.id] || 0;
    if (qty > 0) {
      const subtotal = opt.price * qty;
      total += subtotal;
      lines.push({
        label: summary.proteinLabel,
        value: qty > 1 ? `${qty}× ${opt.label}` : opt.label,
        price: subtotal,
        isAddon: true,
      });
    }
  });

  if (toppings.length > 0) {
    const labels = toppings.map((id) => findOption(steps.toppings.options, id)?.label).filter(Boolean);
    lines.push({ label: summary.toppingsLabel, value: labels.join(", "), price: 0, isAddon: true });
  }

  return { lines, total };
}

/* Descripcion corta de una orden para las tarjetas del carrito y el resumen
   lateral, ej. "Chilaquiles verdes (Picoso) · Pollo · Queso, Crema". */
function orderShortDescription(orderSummary) {
  return orderSummary.lines.map((l) => l.value).join(" · ");
}

/* ─── sub-components ──────────────────────────── */
function StepCard({ number, title, badge, accentColor = "#D6452B", children }) {
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 24,
        padding: 26,
        border: "1px solid #F0E2CC",
        boxShadow: "0 14px 34px rgba(120,70,20,.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: accentColor,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          {number}
        </span>
        <h3
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 21,
            margin: 0,
            color: "#2E1B10",
          }}
        >
          {title}
        </h3>
        {badge && (
          <span
            style={{
              fontSize: 12.5,
              color: "#B5611A",
              background: "#FCEAD2",
              padding: "3px 10px",
              borderRadius: 999,
              fontWeight: 800,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        padding: "14px 15px",
        borderRadius: 16,
        border: `2px solid ${selected ? "#D6452B" : "#EFE0C9"}`,
        background: selected ? "#FFF1E8" : "#fff",
        transition: "all .15s ease",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function QuantityRow({ label, price, qty, onIncrement, onDecrement, agotado = false, accentColor = "#5E8C3A" }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "13px 16px",
        borderRadius: 14,
        border: `2px solid ${!agotado && qty > 0 ? accentColor : "#EFE0C9"}`,
        background: agotado ? "#FAF5EC" : qty > 0 ? "#F1F6E9" : "#fff",
        opacity: agotado ? 0.75 : 1,
        transition: "all .15s ease",
      }}
    >
      <div>
        <span
          style={{
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 700,
            fontSize: 15.5,
            color: agotado ? "#A8917A" : "#2E1B10",
            textDecoration: agotado ? "line-through" : "none",
          }}
        >
          {label}
        </span>
        {agotado && (
          <span
            style={{
              marginLeft: 8,
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 11.5,
              color: "#D6452B",
              background: "#FDE3DC",
              padding: "2px 9px",
              borderRadius: 999,
              verticalAlign: "middle",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Agotado
          </span>
        )}
        <span style={{ display: "block", fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 13, color: "#9b8369" }}>
          +{formatPrice(price)} c/u
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button
          type="button"
          onClick={onDecrement}
          disabled={qty === 0}
          aria-label={`Quitar ${label}`}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid #EFE0C9",
            background: "#fff",
            color: qty === 0 ? "#D8C7AE" : "#2E1B10",
            fontWeight: 800,
            fontSize: 18,
            lineHeight: 1,
            cursor: qty === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>
        <span
          style={{
            minWidth: 22,
            textAlign: "center",
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 16,
            color: "#2E1B10",
          }}
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={agotado}
          aria-label={`Agregar ${label}`}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: `2px solid ${agotado ? "#D8C7AE" : "#D6452B"}`,
            background: agotado ? "#D8C7AE" : "#D6452B",
            color: "#fff",
            fontWeight: 800,
            fontSize: 18,
            lineHeight: 1,
            cursor: agotado ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ChipButton({ selected, onClick, label, accentColor = "#F0A23C" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "11px 18px",
        borderRadius: 999,
        border: `2px solid ${selected ? accentColor : "#EFE0C9"}`,
        background: selected ? "#FFF3E0" : "#fff",
        color: selected ? "#B5611A" : "#6B5746",
        fontFamily: "'Baloo 2', sans-serif",
        fontWeight: 800,
        fontSize: 14.5,
        transition: "all .15s ease",
      }}
    >
      {selected ? "✓ " : ""}
      {label}
    </button>
  );
}

function SpiceChip({ selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "11px 18px",
        borderRadius: 999,
        border: `2px solid ${selected ? "#D6452B" : "#EFE0C9"}`,
        background: selected ? "#FFF1E8" : "#fff",
        color: selected ? "#B5611A" : "#6B5746",
        fontFamily: "'Baloo 2', sans-serif",
        fontWeight: 800,
        fontSize: 14.5,
        transition: "all .15s ease",
      }}
    >
      {label}
    </button>
  );
}

function PayChip({ selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "11px 20px",
        borderRadius: 999,
        border: `2px solid ${selected ? "#D6452B" : "#EFE0C9"}`,
        background: selected ? "#FFF1E8" : "#fff",
        color: selected ? "#B5611A" : "#6B5746",
        fontFamily: "'Baloo 2', sans-serif",
        fontWeight: 800,
        fontSize: 15,
        transition: "all .15s ease",
      }}
    >
      {label}
    </button>
  );
}

/* ─── main component ──────────────────────────── */
export default function Pricing() {
  const { heading, subheading, steps, spice, summary, customer } = menuConfig;
  const { whatsapp, payment } = siteConfig;

  const WHATSAPP_NUMBER = whatsapp?.number || "52XXXXXXXXXX";
  const PAYPAL_USER = payment?.paypalMeUsername || "TU_USUARIO_PAYPAL";

  /* pedido */
  const [base, setBase] = useState(null);
  const [verdeSpice, setVerdeSpice] = useState(null);
  const [rojoSpice, setRojoSpice] = useState(null);
  const [proteins, setProteins] = useState({});
  const [toppings, setToppings] = useState([]);

  /* disponibilidad de proteinas: mapa id -> activo. Mientras no cargue (o si
     falla la peticion), se usa el `activo` de menu.js como respaldo. */
  const [disponibilidad, setDisponibilidad] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/disponibilidad")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.proteinas) return;
        const map = {};
        data.proteinas.forEach((p) => {
          map[p.id] = p.activo !== false;
        });
        setDisponibilidad(map);
      })
      .catch(() => {
        // Sin conexion a la API: el menu usa los valores de menu.js.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function isProteinAgotada(opt) {
    if (disponibilidad) return disponibilidad[opt.id] === false;
    return opt.activo === false;
  }

  /* carrito: ordenes ya armadas ({ base, verdeSpice, rojoSpice, proteins,
     toppings }); editingIndex indica cual se esta editando en el formulario */
  const [cart, setCart] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  /* flujo */
  const [stage, setStage] = useState("menu"); // menu | cart | customer | payment

  /* datos del cliente */
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    accessCode: "",
    accessRef: "",
  });
  const [customerErrors, setCustomerErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  /* ubicación */
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationUrl, setLocationUrl] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  /* pago */
  const [savedOrder, setSavedOrder] = useState(null);
  const [payMethod, setPayMethod] = useState(null); // efectivo | transferencia | tarjeta
  const [clabeCopied, setClabeCopied] = useState(false);
  const clabeTimer = useRef(null);
  const [orderRowNumber, setOrderRowNumber] = useState(null);

  /* ── computed ── */
  const step1Complete = isStep1Complete(base, verdeSpice, rojoSpice);

  const orderSummary = useMemo(
    () => buildOrderSummary({ base, verdeSpice, rojoSpice, proteins, toppings }),
    [base, verdeSpice, rojoSpice, proteins, toppings]
  );

  /* resumen de cada orden del carrito y total acumulado (carrito + la orden
     que se este armando en el formulario, si hay una en curso). Al editar,
     la version guardada de esa orden se descuenta para no contarla doble. */
  const cartSummaries = useMemo(() => cart.map(buildOrderSummary), [cart]);
  const cartTotal = cartSummaries.reduce((sum, s) => sum + s.total, 0);
  const editingTotal =
    editingIndex !== null && cartSummaries[editingIndex]
      ? cartSummaries[editingIndex].total
      : 0;
  const totalAcumulado =
    stage === "menu" ? cartTotal - editingTotal + orderSummary.total : cartTotal;

  /* ── handlers ── */
  function handleBaseChange(baseId) {
    setBase(baseId);
    setVerdeSpice(null);
    setRojoSpice(null);
  }

  function toggleTopping(id) {
    setToppings((c) => (c.includes(id) ? c.filter((t) => t !== id) : [...c, id]));
  }

  function incrementProtein(id) {
    setProteins((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function decrementProtein(id) {
    setProteins((prev) => {
      const current = prev[id] || 0;
      if (current <= 0) return prev;
      return { ...prev, [id]: current - 1 };
    });
  }

  function scrollToFormTop() {
    setTimeout(() => {
      document.getElementById("order-form-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function resetOrderForm() {
    setBase(null);
    setVerdeSpice(null);
    setRojoSpice(null);
    setProteins({});
    setToppings([]);
  }

  /* Agrega la orden configurada al carrito (o guarda la edicion) y muestra
     el resumen "Tu pedido". */
  function handleAddToCart() {
    if (!step1Complete) return;
    const nuevaOrden = { base, verdeSpice, rojoSpice, proteins, toppings };
    setCart((prev) =>
      editingIndex === null
        ? [...prev, nuevaOrden]
        : prev.map((o, i) => (i === editingIndex ? nuevaOrden : o))
    );
    setEditingIndex(null);
    resetOrderForm();
    setStage("cart");
    scrollToFormTop();
  }

  /* Vuelve a cargar una orden del carrito en el formulario para editarla. */
  function handleEditOrder(index) {
    const o = cart[index];
    if (!o) return;
    setBase(o.base);
    setVerdeSpice(o.verdeSpice);
    setRojoSpice(o.rojoSpice);
    setProteins(o.proteins);
    setToppings(o.toppings);
    setEditingIndex(index);
    setStage("menu");
    scrollToFormTop();
  }

  function handleDeleteOrder(index) {
    const next = cart.filter((_, i) => i !== index);
    setCart(next);
    if (next.length === 0) {
      resetOrderForm();
      setEditingIndex(null);
      setStage("menu");
    }
  }

  /* "+ Agregar otra orden": formulario limpio, conservando el carrito. */
  function handleAddAnother() {
    resetOrderForm();
    setEditingIndex(null);
    setStage("menu");
    scrollToFormTop();
  }

  /* Descarta lo que haya en el formulario y regresa al resumen del carrito. */
  function handleBackToCart() {
    resetOrderForm();
    setEditingIndex(null);
    setStage("cart");
    scrollToFormTop();
  }

  function handleContinueToCustomer() {
    if (cart.length === 0) return;
    setStage("customer");
    scrollToFormTop();
  }

  function handleCustomerChange(e) {
    const { name, value } = e.target;
    setCustomerForm((p) => ({ ...p, [name]: value }));
    if (customerErrors[name]) setCustomerErrors((p) => ({ ...p, [name]: "" }));
  }

  function validateCustomer() {
    const errs = {};
    if (!customerForm.name.trim()) errs.name = customer.errors.name;
    if (!customerForm.phone.trim()) errs.phone = customer.errors.phone;
    if (!customerForm.address.trim()) errs.address = customer.errors.address;
    return errs;
  }

  function handleUseLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage(customer.locationUnsupportedMessage);
      return;
    }
    setLocationStatus("loading");
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationUrl(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`);
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
        setLocationUrl("");
        setLocationMessage(customer.locationDeniedMessage);
      }
    );
  }

  function handleContinueToPayment() {
    if (!acceptedTerms || cart.length === 0) return;
    const errs = validateCustomer();
    if (Object.keys(errs).length > 0) { setCustomerErrors(errs); return; }

    const customerData = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      address: customerForm.address.trim(),
      accessCode: customerForm.accessCode.trim(),
      accessRef: customerForm.accessRef.trim(),
      locationUrl,
    };

    // Desglose por orden del carrito. Una orden sin proteina se guarda como
    // "Sencillo" para que las estadisticas de platillos la cuenten.
    const ordenes = cart.map((config) => {
      const s = buildOrderSummary(config);
      const baseLine = s.lines.find((l) => l.label === summary.baseLabel);
      const proteinLines = s.lines.filter((l) => l.label === summary.proteinLabel);
      const toppingsLine = s.lines.find((l) => l.label === summary.toppingsLabel);
      return {
        lines: s.lines,
        total: s.total,
        base: baseLine?.value || "",
        proteinas: proteinLines.map((l) => l.value).join(", ") || "Sencillo",
        toppings: toppingsLine?.value || "",
      };
    });
    const totalCarrito = ordenes.reduce((sum, o) => sum + o.total, 0);

    setSavedOrder({ ordenes, total: totalCarrito, customer: customerData });
    setPayMethod(null);
    setOrderRowNumber(null);
    setStage("payment");
    scrollToFormTop();

    // Registro en Google Sheets para estadisticas; no bloquea el flujo si
    // falla. Todo el carrito viaja en UNA fila: cada columna concatena las
    // ordenes con " | " y el Total es la suma de todas.
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base: ordenes.map((o) => o.base).join(" | "),
        proteinas: ordenes.map((o) => o.proteinas).join(" | "),
        toppings: ordenes.map((o) => o.toppings).join(" | "),
        total: totalCarrito,
        nombre: customerData.name,
        telefono: customerData.phone,
        direccion: customerData.address,
        ubicacion: customerData.locationUrl,
        aceptaTerminos: acceptedTerms,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.rowNumber) setOrderRowNumber(data.rowNumber);
      })
      .catch((error) => console.error("No se pudo registrar el pedido:", error));
  }

  function handleSelectPayMethod(method) {
    setPayMethod(method);
    if (!orderRowNumber) return;
    const label = PAY_METHOD_LABELS[method] || method;
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowNumber: orderRowNumber, metodoPago: label }),
    }).catch((error) => console.error("No se pudo actualizar el metodo de pago:", error));
  }

  function buildWhatsAppUrl(method) {
    if (!savedOrder) return "#";
    const c = savedOrder.customer;
    const payLabels = PAY_METHOD_LABELS;
    const varias = savedOrder.ordenes.length > 1;

    // Cada orden del carrito con su propio bloque de detalle.
    const bloquesOrdenes = savedOrder.ordenes.flatMap((orden, i) => [
      varias ? `*Orden ${i + 1}* ($${orden.total}):` : "*Mi pedido:*",
      ...orden.lines.map((l) => `• ${l.label}: ${l.value}`),
      "",
    ]);

    const msgLines = [
      "¡Hola! Quiero hacer un pedido 🌮🌶️",
      "",
      ...bloquesOrdenes,
      `*Total${varias ? " general" : ""}: $${savedOrder.total}*`,
      "",
      "*Datos de entrega:*",
      `Nombre: ${c.name}`,
      `Teléfono: ${c.phone}`,
      `Dirección: ${c.address}`,
      c.locationUrl ? `Ubicación: ${c.locationUrl}` : null,
      c.accessCode ? `Código de acceso: ${c.accessCode}` : null,
      c.accessRef ? `Referencia: ${c.accessRef}` : null,
      "",
      `*Pago:* ${payLabels[method] || method}`,
    ]
      .filter((l) => l !== null)
      .join("\n");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msgLines)}`;
  }

  function copyClabe() {
    const clabe = "722969010792580412";
    const done = () => {
      setClabeCopied(true);
      if (clabeTimer.current) clearTimeout(clabeTimer.current);
      clabeTimer.current = setTimeout(() => setClabeCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(clabe).then(done).catch(() => fallbackCopy(clabe, done));
    } else {
      fallbackCopy(clabe, done);
    }
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
    cb();
  }

  /* ── input style helper ── */
  function inputStyle(hasError) {
    return {
      display: "block",
      width: "100%",
      marginTop: 6,
      padding: "13px 15px",
      borderRadius: 13,
      border: `2px solid ${hasError ? "#D6452B" : "#EFE0C9"}`,
      background: hasError ? "#FFF5F3" : "#FFFBF3",
      fontFamily: "'Nunito Sans', sans-serif",
      fontWeight: 600,
      fontSize: 15,
      outline: "none",
      boxSizing: "border-box",
    };
  }

  const labelStyle = {
    fontFamily: "'Baloo 2', sans-serif",
    fontWeight: 800,
    fontSize: 14,
    color: "#2E1B10",
    display: "block",
  };

  /* ── render ── */
  return (
    <section id="pricing" style={{ background: "#F7E9CF" }}>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div data-reveal style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 40px" }}>
          <div
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: ".12em",
              color: "#D6452B",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Menú
          </div>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(28px,4vw,44px)",
              margin: "0 0 12px",
              color: "#2E1B10",
            }}
          >
            {heading}
          </h2>
          <p style={{ fontSize: 18, color: "#6B5746", margin: 0 }}>{subheading}</p>
        </div>

        <div id="order-form-top" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* ====== STAGE: menu ====== */}
            {stage === "menu" && (
              <>
                {/* STEP 1 — Base */}
                <StepCard
                  number={steps.base.number}
                  title={steps.base.title}
                  badge={`${steps.base.badge} · ${formatPrice(steps.base.price)}`}
                  accentColor="#D6452B"
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 11 }}>
                    {steps.base.options.map((opt) => (
                      <OptionButton
                        key={opt.id}
                        selected={base === opt.id}
                        onClick={() => handleBaseChange(opt.id)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 15.5, color: "#2E1B10" }}>
                            {opt.label}
                          </span>
                          {base === opt.id && <span style={{ color: "#D6452B", fontWeight: 900 }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 12.5, color: "#9b8369", marginTop: 3, fontWeight: 700 }}>
                          {opt.description}
                        </div>
                      </OptionButton>
                    ))}
                  </div>

                  {/* Spice — verde */}
                  {(base === "verdes" || base === "combinados") && (
                    <div
                      style={{
                        marginTop: 14,
                        border: "2px dashed #EAD9BF",
                        borderRadius: 16,
                        padding: 16,
                        background: "#FFFCF6",
                      }}
                    >
                      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 14.5, color: "#2E1B10", margin: "0 0 10px" }}>
                        {base === "combinados" ? spice.verdeQuestion : spice.singleQuestion}
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {spice.options.map((o) => (
                          <SpiceChip
                            key={o.id}
                            label={o.label}
                            selected={verdeSpice === o.id}
                            onClick={() => setVerdeSpice(o.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spice — roja */}
                  {(base === "rojos" || base === "combinados") && (
                    <div
                      style={{
                        marginTop: 14,
                        border: "2px dashed #EAD9BF",
                        borderRadius: 16,
                        padding: 16,
                        background: "#FFFCF6",
                      }}
                    >
                      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 14.5, color: "#2E1B10", margin: "0 0 10px" }}>
                        {base === "combinados" ? spice.rojoQuestion : spice.singleQuestion}
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {spice.options.map((o) => (
                          <SpiceChip
                            key={o.id}
                            label={o.label}
                            selected={rojoSpice === o.id}
                            onClick={() => setRojoSpice(o.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </StepCard>

                {/* STEP 2 — Proteína */}
                <StepCard number={steps.protein.number} title={steps.protein.title} badge={steps.protein.badge} accentColor="#5E8C3A">
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {steps.protein.options.map((opt) => {
                      const agotada = isProteinAgotada(opt);
                      return (
                        <QuantityRow
                          key={opt.id}
                          label={opt.label}
                          price={opt.price}
                          qty={proteins[opt.id] || 0}
                          agotado={agotada}
                          onIncrement={() => {
                            if (!agotada) incrementProtein(opt.id);
                          }}
                          onDecrement={() => decrementProtein(opt.id)}
                        />
                      );
                    })}
                  </div>
                </StepCard>

                {/* STEP 3 — Toppings */}
                <StepCard number={steps.toppings.number} title={steps.toppings.title} badge={steps.toppings.badge} accentColor="#F0A23C">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {steps.toppings.options.map((opt) => (
                      <ChipButton
                        key={opt.id}
                        label={opt.label}
                        selected={toppings.includes(opt.id)}
                        onClick={() => toggleTopping(opt.id)}
                      />
                    ))}
                  </div>
                </StepCard>

                {/* Agregar la orden al carrito (o guardar la edicion) */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {(editingIndex !== null || cart.length > 0) && (
                    <button
                      type="button"
                      onClick={handleBackToCart}
                      style={{
                        flex: "0 0 auto",
                        border: "2px solid #EFE0C9",
                        background: "#fff",
                        color: "#6B5746",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: 16,
                        padding: "14px 22px",
                        borderRadius: 999,
                        cursor: "pointer",
                      }}
                    >
                      {editingIndex !== null
                        ? "Cancelar"
                        : `← Ver mi pedido (${cart.length})`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!step1Complete}
                    style={{
                      flex: 1,
                      minWidth: 180,
                      background: step1Complete ? "#D6452B" : "#C9A98C",
                      color: "#fff",
                      border: "none",
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 800,
                      fontSize: 18,
                      padding: "16px",
                      borderRadius: 999,
                      cursor: step1Complete ? "pointer" : "not-allowed",
                      opacity: step1Complete ? 1 : 0.65,
                      boxShadow: step1Complete ? "0 12px 26px rgba(214,69,43,.28)" : "none",
                      transition: "all .2s",
                    }}
                  >
                    {editingIndex !== null
                      ? "Guardar cambios"
                      : cart.length > 0
                      ? "+ Agregar esta orden"
                      : "Agregar a mi pedido"}
                  </button>
                </div>
                {!step1Complete && base && (
                  <p style={{ textAlign: "center", fontSize: 13, color: "#A8917A", margin: 0 }}>
                    Elige si la quieres picosa o no picosa para continuar.
                  </p>
                )}
              </>
            )}

            {/* ====== STAGE: cart (Tu pedido) ====== */}
            {stage === "cart" && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 26,
                  padding: 30,
                  border: "1px solid #F0E2CC",
                  boxShadow: "0 22px 50px rgba(120,70,20,.1)",
                }}
              >
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 23, margin: "0 0 4px", color: "#2E1B10" }}>
                  Tu pedido
                </h3>
                <p style={{ fontSize: 14.5, color: "#6B5746", margin: "0 0 20px" }}>
                  Revisa tus órdenes. Puedes editarlas, quitarlas o agregar más
                  antes de continuar con la entrega.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {cartSummaries.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        border: "2px solid #EFE0C9",
                        borderRadius: 16,
                        padding: "14px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 15.5, color: "#2E1B10" }}>
                          Orden {i + 1}
                          <span style={{ color: "#D6452B", marginLeft: 8 }}>
                            {formatPrice(s.total)}
                          </span>
                        </div>
                        {s.lines.map((l, j) => (
                          <p key={j} style={{ margin: "4px 0 0", fontSize: 13.5, color: "#6B5746" }}>
                            <span style={{ color: "#A8917A" }}>{l.label}:</span>{" "}
                            {l.value}
                          </p>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleEditOrder(i)}
                          aria-label={`Editar orden ${i + 1}`}
                          title="Editar"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            border: "2px solid #EFE0C9",
                            background: "#fff",
                            color: "#6B5746",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(i)}
                          aria-label={`Eliminar orden ${i + 1}`}
                          title="Eliminar"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            border: "2px solid #F5D5CC",
                            background: "#fff",
                            color: "#D6452B",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddAnother}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    border: "2px dashed #D6452B",
                    background: "#FFF8F3",
                    color: "#D6452B",
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    fontSize: 16,
                    padding: "13px",
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  + Agregar otra orden
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    borderTop: "2px dashed #EAD9BF",
                    marginTop: 18,
                    paddingTop: 14,
                  }}
                >
                  <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 17, color: "#2E1B10" }}>
                    Total ({cart.length} {cart.length === 1 ? "orden" : "órdenes"})
                  </span>
                  <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 28, color: "#D6452B" }}>
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleContinueToCustomer}
                  style={{
                    width: "100%",
                    marginTop: 16,
                    background: "#D6452B",
                    color: "#fff",
                    border: "none",
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    fontSize: 18,
                    padding: "16px",
                    borderRadius: 999,
                    cursor: "pointer",
                    boxShadow: "0 12px 26px rgba(214,69,43,.28)",
                  }}
                >
                  Continuar con la entrega
                </button>
              </div>
            )}

            {/* ====== STAGE: customer ====== */}
            {stage === "customer" && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 26,
                  padding: 30,
                  border: "1px solid #F0E2CC",
                  boxShadow: "0 22px 50px rgba(120,70,20,.1)",
                }}
              >
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 23, margin: "0 0 4px", color: "#2E1B10" }}>
                  {customer.heading}
                </h3>
                <p style={{ fontSize: 14.5, color: "#6B5746", margin: "0 0 20px" }}>{customer.subheading}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Nombre */}
                  <div>
                    <label style={labelStyle}>{customer.nameLabel}</label>
                    <input
                      name="name"
                      value={customerForm.name}
                      onChange={handleCustomerChange}
                      placeholder={customer.namePlaceholder}
                      style={inputStyle(!!customerErrors.name)}
                    />
                    {customerErrors.name && <p style={{ color: "#D6452B", fontSize: 13, fontWeight: 700, margin: "6px 0 0" }}>{customerErrors.name}</p>}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label style={labelStyle}>{customer.phoneLabel}</label>
                    <input
                      name="phone"
                      type="tel"
                      value={customerForm.phone}
                      onChange={handleCustomerChange}
                      placeholder={customer.phonePlaceholder}
                      style={inputStyle(!!customerErrors.phone)}
                    />
                    {customerErrors.phone && <p style={{ color: "#D6452B", fontSize: 13, fontWeight: 700, margin: "6px 0 0" }}>{customerErrors.phone}</p>}
                  </div>

                  {/* Dirección */}
                  <div>
                    <label style={labelStyle}>{customer.addressLabel}</label>
                    <textarea
                      name="address"
                      rows={2}
                      value={customerForm.address}
                      onChange={handleCustomerChange}
                      placeholder={customer.addressPlaceholder}
                      style={{ ...inputStyle(!!customerErrors.address), resize: "vertical" }}
                    />
                    {customerErrors.address && <p style={{ color: "#D6452B", fontSize: 13, fontWeight: 700, margin: "6px 0 0" }}>{customerErrors.address}</p>}
                  </div>

                  {/* Ubicación GPS */}
                  <div>
                    <label style={labelStyle}>{customer.locationLabel}</label>
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={locationStatus === "loading"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: locationStatus === "loading" ? "not-allowed" : "pointer",
                          border: "2px solid #EFE0C9",
                          background: "#fff",
                          color: "#2E1B10",
                          fontFamily: "'Baloo 2', sans-serif",
                          fontWeight: 800,
                          fontSize: 14.5,
                          padding: "11px 18px",
                          borderRadius: 999,
                          opacity: locationStatus === "loading" ? 0.6 : 1,
                        }}
                      >
                        {locationStatus === "loading" ? customer.locationLoading : `📍 ${customer.locationButton}`}
                      </button>

                      {locationStatus === "success" && (
                        <div style={{ marginTop: 10, border: "1px solid #CDE6CF", background: "#F1F7EE", borderRadius: 12, padding: 12 }}>
                          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 14, color: "#5E8C3A" }}>
                            {customer.locationCaptured}
                          </div>
                          <a href={locationUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2E1B10", textDecoration: "underline" }}>
                            {customer.locationPreview}
                          </a>
                        </div>
                      )}

                      {locationStatus === "error" && (
                        <p style={{ marginTop: 10, border: "1px solid #F0D9A8", background: "#FCF3E0", borderRadius: 12, padding: 12, fontSize: 13.5, color: "#9A6B17" }}>
                          {locationMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Código de acceso */}
                  <div>
                    <label style={labelStyle}>
                      {customer.accessCodeLabel}{" "}
                      <span style={{ color: "#A8917A", fontWeight: 700 }}>{customer.optionalTag}</span>
                    </label>
                    <input
                      name="accessCode"
                      value={customerForm.accessCode}
                      onChange={handleCustomerChange}
                      placeholder={customer.accessCodePlaceholder}
                      style={inputStyle(false)}
                    />
                  </div>

                  {/* Referencia */}
                  <div>
                    <label style={labelStyle}>
                      {customer.accessRefLabel}{" "}
                      <span style={{ color: "#A8917A", fontWeight: 700 }}>{customer.optionalTag}</span>
                    </label>
                    <input
                      name="accessRef"
                      value={customerForm.accessRef}
                      onChange={handleCustomerChange}
                      placeholder={customer.accessRefPlaceholder}
                      style={inputStyle(false)}
                    />
                  </div>

                  {/* Aceptación de aviso de privacidad y términos */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: "#D6452B", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 13.5, color: "#6B5746", lineHeight: 1.6 }}>
                      He leído y acepto el{" "}
                      <a
                        href="/aviso-de-privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#6B5746", textDecoration: "underline" }}
                      >
                        Aviso de Privacidad
                      </a>{" "}
                      y los{" "}
                      <a
                        href="/terminos-y-condiciones"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#6B5746", textDecoration: "underline" }}
                      >
                        Términos y Condiciones
                      </a>
                    </span>
                  </label>

                  {/* Botones */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setStage("cart")}
                      style={{
                        flex: "0 0 auto",
                        textAlign: "center",
                        border: "2px solid #EFE0C9",
                        background: "#fff",
                        color: "#6B5746",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: 16,
                        padding: "14px 22px",
                        borderRadius: 999,
                        cursor: "pointer",
                      }}
                    >
                      {customer.backButton}
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueToPayment}
                      disabled={!acceptedTerms}
                      style={{
                        flex: 1,
                        minWidth: 180,
                        background: acceptedTerms ? "#D6452B" : "#C9A98C",
                        color: "#fff",
                        border: "none",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: 17,
                        padding: 14,
                        borderRadius: 999,
                        cursor: acceptedTerms ? "pointer" : "not-allowed",
                        opacity: acceptedTerms ? 1 : 0.65,
                        boxShadow: acceptedTerms ? "0 12px 26px rgba(214,69,43,.28)" : "none",
                        transition: "all .2s",
                      }}
                    >
                      {customer.payButton}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ====== STAGE: payment ====== */}
            {stage === "payment" && savedOrder && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 26,
                  padding: 30,
                  border: "1px solid #F0E2CC",
                  boxShadow: "0 22px 50px rgba(120,70,20,.1)",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: 22 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "#E8F0DB",
                      color: "#5E8C3A",
                      fontSize: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 14px",
                    }}
                  >
                    ✓
                  </div>
                  <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 24, margin: "0 0 6px", color: "#2E1B10" }}>
                    ¡Datos guardados!
                  </h3>
                  <p style={{ fontSize: 15.5, color: "#6B5746", margin: "0 auto", maxWidth: "36ch" }}>
                    Tu pedido de{" "}
                    <strong style={{ color: "#2E1B10" }}>{formatPrice(savedOrder.total)}</strong>{" "}
                    está listo. Elige cómo quieres pagar.
                  </p>
                </div>

                {/* Selector de método */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 14, color: "#2E1B10", marginBottom: 10 }}>
                    ¿Cómo quieres pagar?
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      { k: "efectivo", label: "💵 Efectivo" },
                      { k: "transferencia", label: "📲 Transferencia" },
                      { k: "tarjeta", label: "💳 Tarjeta" },
                    ].map((o) => (
                      <PayChip
                        key={o.k}
                        label={o.label}
                        selected={payMethod === o.k}
                        onClick={() => handleSelectPayMethod(o.k)}
                      />
                    ))}
                  </div>
                </div>

                {/* Efectivo */}
                {payMethod === "efectivo" && (
                  <div style={{ border: "2px solid #DCE9CC", background: "#F1F7EE", borderRadius: 16, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 30, marginBottom: 6 }}>💵</div>
                    <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 17, color: "#2E1B10" }}>
                      Pago en efectivo
                    </div>
                    <p style={{ fontSize: 14.5, color: "#6B5746", margin: "6px auto 0", maxWidth: "34ch" }}>
                      Pagas{" "}
                      <strong>{formatPrice(savedOrder.total)}</strong>{" "}
                      en efectivo al recibir o recoger tu pedido. ¡Listo!
                    </p>
                  </div>
                )}

                {/* Transferencia */}
                {payMethod === "transferencia" && (
                  <div style={{ border: "2px solid #EFE0C9", background: "#FFFBF3", borderRadius: 16, padding: 20 }}>
                    <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 17, color: "#2E1B10", marginBottom: 12 }}>
                      📲 Transferencia por {formatPrice(savedOrder.total)}
                    </div>
                    <div style={{ fontSize: 14.5, color: "#6B5746", lineHeight: 1.7, marginBottom: 12 }}>
                      Institución: <strong>Mercado Pago W</strong>
                      <br />
                      Beneficiario: <strong>Manuel Mauricio Medina Alvidrez</strong>
                    </div>
                    {/* CLABE con botón copiar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#fff",
                        border: "2px solid #EFE0C9",
                        borderRadius: 12,
                        padding: "10px 12px",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#A8917A", letterSpacing: ".06em" }}>CLABE</div>
                        <div style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "#2E1B10", letterSpacing: ".02em" }}>
                          722969010792580412
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={copyClabe}
                        style={{
                          flexShrink: 0,
                          background: "#D6452B",
                          color: "#fff",
                          border: "none",
                          fontFamily: "'Baloo 2', sans-serif",
                          fontWeight: 800,
                          fontSize: 13,
                          padding: "10px 16px",
                          borderRadius: 10,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "background .15s",
                        }}
                      >
                        {clabeCopied ? "¡Copiado! ✓" : "Copiar"}
                      </button>
                    </div>
                    <p style={{ fontSize: 12.5, color: "#A8917A", margin: 0 }}>
                      Copia la CLABE, haz tu transferencia y envíanos el comprobante por WhatsApp.
                    </p>
                  </div>
                )}

                {/* Tarjeta → PayPal */}
                {payMethod === "tarjeta" && (
                  <div style={{ border: "2px solid #EFE0C9", background: "#FFFBF3", borderRadius: 16, padding: 20, textAlign: "center" }}>
                    <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 17, color: "#2E1B10", marginBottom: 12 }}>
                      💳 Pago con tarjeta
                    </div>
                    <a
                      href={`https://www.paypal.me/${PAYPAL_USER}/${savedOrder.total}MXN`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        textDecoration: "none",
                        background: "#003087",
                        color: "#fff",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: 18,
                        padding: "15px 30px",
                        borderRadius: 999,
                        boxShadow: "0 12px 26px rgba(0,48,135,.25)",
                      }}
                    >
                      {payment?.buttonText || "Pagar con PayPal"}
                    </a>
                    <p style={{ fontSize: 12.5, color: "#A8917A", margin: "12px auto 0", maxWidth: "34ch" }}>
                      Pagas con tarjeta de forma segura a través de PayPal.
                    </p>
                  </div>
                )}

                {/* WhatsApp CTA */}
                {payMethod && (
                  <>
                    <a
                      href={buildWhatsAppUrl(payMethod)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        textDecoration: "none",
                        marginTop: 16,
                        background: "#25D366",
                        color: "#fff",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: 18,
                        padding: "16px",
                        borderRadius: 999,
                        boxShadow: "0 12px 26px rgba(37,211,102,.3)",
                      }}
                    >
                      Enviar pedido por WhatsApp
                    </a>
                    <p style={{ fontSize: 12.5, color: "#A8917A", textAlign: "center", margin: "10px 0 0" }}>
                      Tu pedido nos llega por WhatsApp y te confirmamos enseguida.
                    </p>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setStage("customer")}
                  style={{
                    display: "block",
                    margin: "20px auto 0",
                    background: "none",
                    border: "none",
                    color: "#6B5746",
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  ← Volver a mis datos
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: resumen sticky ── */}
          <aside
            style={{
              position: "sticky",
              top: 88,
              height: "fit-content",
              background: "#2E1B10",
              color: "#FFF6EA",
              borderRadius: 26,
              padding: 28,
              boxShadow: "0 24px 50px rgba(46,27,16,.28)",
            }}
          >
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, margin: "0 0 4px", color: "#FFE7B3" }}>
              {summary.heading}
            </h3>
            <p style={{ fontSize: 13.5, color: "#C7AE92", margin: "0 0 16px" }}>
              {cart.length === 0 && orderSummary.lines.length === 0
                ? summary.emptyMessage
                : cart.length > 0
                ? `${cart.length} ${cart.length === 1 ? "orden" : "órdenes"} en tu pedido.`
                : "Personaliza tu orden, el total se actualiza solo."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 11, borderTop: "1px solid #4A3526", paddingTop: 16 }}>
              {/* Ordenes ya guardadas en el carrito (la que se esta editando
                  se muestra abajo con sus valores en curso, no aqui) */}
              {cartSummaries.map((s, i) =>
                stage === "menu" && editingIndex === i ? null : (
                  <div key={`orden-${i}`} style={{ fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#FFE7B3" }}>
                        Orden {i + 1}
                      </span>
                      <span style={{ fontWeight: 800, color: "#FFF6EA", textAlign: "right", flexShrink: 0 }}>
                        {formatPrice(s.total)}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 0", color: "#A8927C", fontSize: 13 }}>
                      {orderShortDescription(s)}
                    </p>
                  </div>
                )
              )}

              {/* Orden en preparacion (formulario actual) */}
              {stage === "menu" && orderSummary.lines.length > 0 && (
                <>
                  {cart.length > 0 && (
                    <p style={{ margin: "4px 0 0", color: "#C7AE92", fontSize: 12, fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {editingIndex !== null
                        ? `Editando orden ${editingIndex + 1}:`
                        : "En preparación:"}
                    </p>
                  )}
                  {orderSummary.lines.map((line) => (
                    <div key={`${line.label}-${line.value}`} style={{ fontSize: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <span style={{ color: "#C7AE92" }}>{line.label}</span>
                        <span style={{ fontWeight: 800, color: "#FFF6EA", textAlign: "right", flexShrink: 0 }}>
                          {line.price === 0
                            ? formatPrice(0)
                            : line.isAddon
                            ? `+${formatPrice(line.price)}`
                            : formatPrice(line.price)}
                        </span>
                      </div>
                      <p style={{ margin: "3px 0 0", color: "#A8927C", fontSize: 13 }}>{line.value}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #4A3526", marginTop: 16, paddingTop: 16 }}>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 18, color: "#FFE7B3" }}>
                {summary.totalLabel}
              </span>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 34, color: "#fff" }}>
                {formatPrice(totalAcumulado)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
