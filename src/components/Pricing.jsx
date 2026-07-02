"use client";

import { useMemo, useState, useRef } from "react";
import { menuConfig } from "@/config/menu";
import { siteConfig } from "@/config/site";

/* ─── helpers ─────────────────────────────────── */
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

function QuantityRow({ label, price, qty, onIncrement, onDecrement, accentColor = "#5E8C3A" }) {
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
        border: `2px solid ${qty > 0 ? accentColor : "#EFE0C9"}`,
        background: qty > 0 ? "#F1F6E9" : "#fff",
        transition: "all .15s ease",
      }}
    >
      <div>
        <span style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 15.5, color: "#2E1B10" }}>
          {label}
        </span>
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
          aria-label={`Agregar ${label}`}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid #D6452B",
            background: "#D6452B",
            color: "#fff",
            fontWeight: 800,
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
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

  /* flujo */
  const [stage, setStage] = useState("menu"); // menu | customer | payment

  /* datos del cliente */
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    accessCode: "",
    accessRef: "",
  });
  const [customerErrors, setCustomerErrors] = useState({});

  /* ubicación */
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationUrl, setLocationUrl] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  /* pago */
  const [savedOrder, setSavedOrder] = useState(null);
  const [payMethod, setPayMethod] = useState(null); // efectivo | transferencia | tarjeta
  const [clabeCopied, setClabeCopied] = useState(false);
  const clabeTimer = useRef(null);

  /* ── computed ── */
  const step1Complete = isStep1Complete(base, verdeSpice, rojoSpice);

  const orderSummary = useMemo(() => {
    const lines = [];
    let total = 0;

    if (step1Complete) {
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
  }, [base, verdeSpice, rojoSpice, proteins, toppings, step1Complete, steps, summary]);

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

  function handleContinue() {
    if (!step1Complete) return;
    setStage("customer");
    setTimeout(() => {
      document.getElementById("order-form-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
    const errs = validateCustomer();
    if (Object.keys(errs).length > 0) { setCustomerErrors(errs); return; }
    setSavedOrder({
      ...orderSummary,
      customer: {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
        accessCode: customerForm.accessCode.trim(),
        accessRef: customerForm.accessRef.trim(),
        locationUrl,
      },
    });
    setPayMethod(null);
    setStage("payment");
    setTimeout(() => {
      document.getElementById("order-form-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function buildWhatsAppUrl(method) {
    if (!savedOrder) return "#";
    const c = savedOrder.customer;
    const payLabels = {
      efectivo: "Efectivo (al recibir)",
      transferencia: "Transferencia (envío comprobante)",
      tarjeta: "Tarjeta (PayPal)",
    };
    const msgLines = [
      "¡Hola! Quiero hacer un pedido 🌮🌶️",
      "",
      "*Mi pedido:*",
      ...savedOrder.lines.map((l) => `• ${l.label}: ${l.value}`),
      "",
      `*Total: $${savedOrder.total}*`,
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
                    {steps.protein.options.map((opt) => (
                      <QuantityRow
                        key={opt.id}
                        label={opt.label}
                        price={opt.price}
                        qty={proteins[opt.id] || 0}
                        onIncrement={() => incrementProtein(opt.id)}
                        onDecrement={() => decrementProtein(opt.id)}
                      />
                    ))}
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

                {/* Continuar */}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!step1Complete}
                  style={{
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
                  {summary.continueButton}
                </button>
                {!step1Complete && base && (
                  <p style={{ textAlign: "center", fontSize: 13, color: "#A8917A", margin: 0 }}>
                    Elige si la quieres picosa o no picosa para continuar.
                  </p>
                )}
              </>
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

                  {/* Botones */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setStage("menu")}
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
                      style={{
                        flex: 1,
                        minWidth: 180,
                        background: "#D6452B",
                        color: "#fff",
                        border: "none",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: 17,
                        padding: 14,
                        borderRadius: 999,
                        cursor: "pointer",
                        boxShadow: "0 12px 26px rgba(214,69,43,.28)",
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
                        onClick={() => setPayMethod(o.k)}
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
              {orderSummary.lines.length === 0
                ? summary.emptyMessage
                : "Personaliza tu orden, el total se actualiza solo."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 11, borderTop: "1px solid #4A3526", paddingTop: 16 }}>
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
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #4A3526", marginTop: 16, paddingTop: 16 }}>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 18, color: "#FFE7B3" }}>
                {summary.totalLabel}
              </span>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 34, color: "#fff" }}>
                {formatPrice(orderSummary.total)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
