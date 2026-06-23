"use client";

import { useMemo, useState } from "react";
import { menuConfig } from "@/config/menu";

function formatPrice(amount) {
  return new Intl.NumberFormat(menuConfig.locale, {
    style: "currency",
    currency: menuConfig.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function findOption(options, id) {
  return options.find((option) => option.id === id) ?? null;
}

function spiceLabel(spiceId) {
  return (
    menuConfig.spice.options.find((option) => option.id === spiceId)?.label ??
    spiceId
  );
}

function isStep1Complete(base, verdeSpice, rojoSpice) {
  if (!base) return false;
  if (base === "verdes") return Boolean(verdeSpice);
  if (base === "rojos") return Boolean(rojoSpice);
  if (base === "combinados") return Boolean(verdeSpice && rojoSpice);
  return false;
}

function StepCard({ number, title, badge, children }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
          {number}
        </span>
        <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        {badge && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function OptionButton({ selected, onClick, children, name }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
        selected
          ? "border-stone-900 bg-stone-50"
          : "border-stone-200 hover:border-stone-400"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onClick}
        className="mt-1"
      />
      <span className="text-sm text-stone-800">{children}</span>
    </label>
  );
}

function CheckboxOption({ checked, onChange, label }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
        checked
          ? "border-stone-900 bg-stone-50"
          : "border-stone-200 hover:border-stone-400"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4"
      />
      <span className="text-sm text-stone-800">{label}</span>
    </label>
  );
}

export default function Pricing() {
  const { heading, subheading, steps, spice, summary, customer } = menuConfig;

  const [base, setBase] = useState(null);
  const [verdeSpice, setVerdeSpice] = useState(null);
  const [rojoSpice, setRojoSpice] = useState(null);
  const [protein, setProtein] = useState(null);
  const [toppings, setToppings] = useState([]);
  const [extraProtein, setExtraProtein] = useState(null);

  // Etapa del flujo: "menu" (seleccion de chilaquiles) | "customer" (datos del cliente)
  const [stage, setStage] = useState("menu");

  // Datos del cliente
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    accessCode: "",
    accessRef: "",
  });
  const [customerErrors, setCustomerErrors] = useState({});

  // Ubicacion (navigator.geolocation)
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | success | error
  const [locationUrl, setLocationUrl] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  // Pedido + datos del cliente ya ensamblados, listos para el siguiente paso
  const [savedOrder, setSavedOrder] = useState(null);

  const step1Complete = isStep1Complete(base, verdeSpice, rojoSpice);

  const orderSummary = useMemo(() => {
    const lines = [];
    let total = 0;

    if (step1Complete) {
      const baseOption = findOption(steps.base.options, base);
      total += steps.base.price;

      let baseDetail = baseOption?.label ?? base;

      if (base === "verdes") {
        baseDetail += ` (${spiceLabel(verdeSpice)})`;
      } else if (base === "rojos") {
        baseDetail += ` (${spiceLabel(rojoSpice)})`;
      } else if (base === "combinados") {
        baseDetail += ` — verde ${spiceLabel(verdeSpice).toLowerCase()}, roja ${spiceLabel(rojoSpice).toLowerCase()}`;
      }

      lines.push({
        label: summary.baseLabel,
        value: baseDetail,
        price: steps.base.price,
        isAddon: false,
      });
    }

    if (protein) {
      const proteinOption = findOption(steps.protein.options, protein);
      if (proteinOption) {
        total += proteinOption.price;
        lines.push({
          label: summary.proteinLabel,
          value: proteinOption.label,
          price: proteinOption.price,
          isAddon: true,
        });
      }
    }

    if (toppings.length > 0) {
      const toppingLabels = toppings
        .map((id) => findOption(steps.toppings.options, id)?.label)
        .filter(Boolean);

      lines.push({
        label: summary.toppingsLabel,
        value: toppingLabels.join(", "),
        price: 0,
        isAddon: true,
      });
    }

    if (extraProtein) {
      const extraOption = findOption(steps.extraProtein.options, extraProtein);
      if (extraOption) {
        total += extraOption.price;
        lines.push({
          label: summary.extraProteinLabel,
          value: extraOption.label,
          price: extraOption.price,
          isAddon: true,
        });
      }
    }

    return { lines, total };
  }, [
    base,
    verdeSpice,
    rojoSpice,
    protein,
    toppings,
    extraProtein,
    step1Complete,
    steps,
    summary,
  ]);

  function handleBaseChange(baseId) {
    setBase(baseId);
    setVerdeSpice(null);
    setRojoSpice(null);
  }

  function toggleTopping(toppingId) {
    setToppings((current) =>
      current.includes(toppingId)
        ? current.filter((id) => id !== toppingId)
        : [...current, toppingId]
    );
  }

  // Pasa de la seleccion de chilaquiles al paso de datos del cliente
  function handleContinue() {
    if (!step1Complete) return;
    setStage("customer");
  }

  function handleCustomerChange(e) {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({ ...prev, [name]: value }));
    // Limpia el error del campo cuando el usuario empieza a corregirlo
    if (customerErrors[name]) {
      setCustomerErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validateCustomer() {
    const newErrors = {};
    if (!customerForm.name.trim()) {
      newErrors.name = customer.errors.name;
    }
    if (!customerForm.phone.trim()) {
      newErrors.phone = customer.errors.phone;
    }
    if (!customerForm.address.trim()) {
      newErrors.address = customer.errors.address;
    }
    return newErrors;
  }

  // Pide la ubicacion al navegador y guarda el enlace de Google Maps
  function handleUseLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage(customer.locationUnsupportedMessage);
      return;
    }

    setLocationStatus("loading");
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationUrl(
          `https://www.google.com/maps?q=${latitude},${longitude}`
        );
        setLocationStatus("success");
        setLocationMessage("");
      },
      () => {
        setLocationStatus("error");
        setLocationUrl("");
        setLocationMessage(customer.locationDeniedMessage);
      }
    );
  }

  // Ensambla TODOS los datos (pedido + cliente) para el siguiente paso.
  // Por ahora el boton "Continuar al pago" solo valida y guarda; aun no procesa pagos.
  function handleContinueToPayment() {
    const validationErrors = validateCustomer();
    if (Object.keys(validationErrors).length > 0) {
      setCustomerErrors(validationErrors);
      return;
    }

    const order = {
      base,
      verdeSpice,
      rojoSpice,
      protein,
      toppings,
      extraProtein,
      lines: orderSummary.lines,
      total: orderSummary.total,
      customer: {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
        accessCode: customerForm.accessCode.trim(),
        accessRef: customerForm.accessRef.trim(),
        locationUrl,
      },
    };

    // Guardado para el siguiente paso (pago / WhatsApp / admin se agregaran despues).
    setSavedOrder(order);
    setStage("payment");
  }

  function renderSpiceChoices(question, value, onChange, namePrefix) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-stone-300 p-4">
        <p className="mb-3 text-sm font-medium text-stone-700">{question}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {spice.options.map((option) => (
            <OptionButton
              key={`${namePrefix}-${option.id}`}
              name={`${namePrefix}-spice`}
              selected={value === option.id}
              onClick={() => onChange(option.id)}
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            {heading}
          </h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            {subheading}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {stage === "menu" && (
              <>
            <StepCard
              number={steps.base.number}
              title={steps.base.title}
              badge={`${steps.base.badge} — ${formatPrice(steps.base.price)}`}
            >
              <div className="grid gap-3">
                {steps.base.options.map((option) => (
                  <OptionButton
                    key={option.id}
                    name="base"
                    selected={base === option.id}
                    onClick={() => handleBaseChange(option.id)}
                  >
                    <span className="block font-medium">{option.label}</span>
                    <span className="block text-stone-500">{option.description}</span>
                  </OptionButton>
                ))}
              </div>

              {base === "verdes" &&
                renderSpiceChoices(
                  spice.singleQuestion,
                  verdeSpice,
                  setVerdeSpice,
                  "verde"
                )}

              {base === "rojos" &&
                renderSpiceChoices(
                  spice.singleQuestion,
                  rojoSpice,
                  setRojoSpice,
                  "rojo"
                )}

              {base === "combinados" && (
                <>
                  {renderSpiceChoices(
                    spice.verdeQuestion,
                    verdeSpice,
                    setVerdeSpice,
                    "verde-combo"
                  )}
                  {renderSpiceChoices(
                    spice.rojoQuestion,
                    rojoSpice,
                    setRojoSpice,
                    "rojo-combo"
                  )}
                </>
              )}
            </StepCard>

            <StepCard
              number={steps.protein.number}
              title={steps.protein.title}
              badge={steps.protein.badge}
            >
              <div className="grid gap-3">
                {steps.protein.options.map((option) => (
                  <OptionButton
                    key={option.id}
                    name="protein"
                    selected={protein === option.id}
                    onClick={() => setProtein(option.id)}
                  >
                    <span className="flex w-full items-center justify-between gap-4">
                      <span>{option.label}</span>
                      <span className="font-medium">
                        {option.price === 0
                          ? formatPrice(0)
                          : `+${formatPrice(option.price)}`}
                      </span>
                    </span>
                  </OptionButton>
                ))}
              </div>
            </StepCard>

            <StepCard
              number={steps.toppings.number}
              title={steps.toppings.title}
              badge={steps.toppings.badge}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {steps.toppings.options.map((option) => (
                  <CheckboxOption
                    key={option.id}
                    label={option.label}
                    checked={toppings.includes(option.id)}
                    onChange={() => toggleTopping(option.id)}
                  />
                ))}
              </div>
            </StepCard>

            <StepCard
              number={steps.extraProtein.number}
              title={steps.extraProtein.title}
              badge={steps.extraProtein.badge}
            >
              <div className="grid gap-3">
                <OptionButton
                  name="extra-protein"
                  selected={extraProtein === null}
                  onClick={() => setExtraProtein(null)}
                >
                  <span className="flex w-full items-center justify-between gap-4">
                    <span>{steps.extraProtein.noneLabel}</span>
                    <span className="font-medium">{formatPrice(0)}</span>
                  </span>
                </OptionButton>

                {steps.extraProtein.options.map((option) => (
                  <OptionButton
                    key={option.id}
                    name="extra-protein"
                    selected={extraProtein === option.id}
                    onClick={() => setExtraProtein(option.id)}
                  >
                    <span className="flex w-full items-center justify-between gap-4">
                      <span>{option.label}</span>
                      <span className="font-medium">
                        +{formatPrice(option.price)}
                      </span>
                    </span>
                  </OptionButton>
                ))}
              </div>
            </StepCard>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!step1Complete}
              className="w-full rounded-full bg-stone-900 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {summary.continueButton}
            </button>
              </>
            )}

            {stage === "payment" && (
              <section className="rounded-xl border border-stone-200 bg-white p-6 text-center">
                <p className="text-4xl mb-4">✓</p>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  Datos guardados
                </h3>
                <p className="text-sm text-stone-600 mb-6">
                  Pronto aquí estará el paso de pago.
                </p>
                <button
                  type="button"
                  onClick={() => setStage("customer")}
                  className="rounded-full border border-stone-300 px-6 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-500"
                >
                  Volver a mis datos
                </button>
              </section>
            )}

            {stage === "customer" && (
              <section className="rounded-xl border border-stone-200 bg-white p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-stone-900">
                    {customer.heading}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {customer.subheading}
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Nombre completo (obligatorio) */}
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      {customer.nameLabel}
                    </label>
                    <input
                      id="customer-name"
                      name="name"
                      type="text"
                      value={customerForm.name}
                      onChange={handleCustomerChange}
                      placeholder={customer.namePlaceholder}
                      className={`w-full rounded-xl border px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                        customerErrors.name
                          ? "border-red-400 bg-red-50"
                          : "border-stone-300"
                      }`}
                    />
                    {customerErrors.name && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {customerErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Telefono (obligatorio) */}
                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      {customer.phoneLabel}
                    </label>
                    <input
                      id="customer-phone"
                      name="phone"
                      type="tel"
                      value={customerForm.phone}
                      onChange={handleCustomerChange}
                      placeholder={customer.phonePlaceholder}
                      className={`w-full rounded-xl border px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                        customerErrors.phone
                          ? "border-red-400 bg-red-50"
                          : "border-stone-300"
                      }`}
                    />
                    {customerErrors.phone && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {customerErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Direccion (obligatorio) */}
                  <div>
                    <label
                      htmlFor="customer-address"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      {customer.addressLabel}
                    </label>
                    <textarea
                      id="customer-address"
                      name="address"
                      rows={2}
                      value={customerForm.address}
                      onChange={handleCustomerChange}
                      placeholder={customer.addressPlaceholder}
                      className={`w-full resize-none rounded-xl border px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                        customerErrors.address
                          ? "border-red-400 bg-red-50"
                          : "border-stone-300"
                      }`}
                    />
                    {customerErrors.address && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {customerErrors.address}
                      </p>
                    )}
                  </div>

                  {/* Ubicacion actual (navigator.geolocation) */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">
                      {customer.locationLabel}
                    </label>
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={locationStatus === "loading"}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {locationStatus === "loading"
                        ? customer.locationLoading
                        : customer.locationButton}
                    </button>

                    {locationStatus === "success" && (
                      <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                        <p className="font-medium text-green-700">
                          {customer.locationCaptured}
                        </p>
                        <a
                          href={locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-stone-700 underline underline-offset-2 hover:text-stone-900"
                        >
                          {customer.locationPreview}
                        </a>
                      </div>
                    )}

                    {locationStatus === "error" && (
                      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        {locationMessage}
                      </p>
                    )}
                  </div>

                  {/* Codigo de acceso (opcional) */}
                  <div>
                    <label
                      htmlFor="customer-access-code"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      {customer.accessCodeLabel}
                      <span className="ml-1.5 font-normal text-stone-400">
                        {customer.optionalTag}
                      </span>
                    </label>
                    <input
                      id="customer-access-code"
                      name="accessCode"
                      type="text"
                      value={customerForm.accessCode}
                      onChange={handleCustomerChange}
                      placeholder={customer.accessCodePlaceholder}
                      className="w-full rounded-xl border border-stone-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  {/* Link o referencia de acceso (opcional) */}
                  <div>
                    <label
                      htmlFor="customer-access-ref"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      {customer.accessRefLabel}
                      <span className="ml-1.5 font-normal text-stone-400">
                        {customer.optionalTag}
                      </span>
                    </label>
                    <input
                      id="customer-access-ref"
                      name="accessRef"
                      type="text"
                      value={customerForm.accessRef}
                      onChange={handleCustomerChange}
                      placeholder={customer.accessRefPlaceholder}
                      className="w-full rounded-xl border border-stone-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={handleContinueToPayment}
                      className="w-full rounded-full bg-stone-900 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 sm:flex-1"
                    >
                      {customer.payButton}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStage("menu")}
                      className="w-full rounded-full border border-stone-300 px-8 py-3.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-500 sm:w-auto"
                    >
                      {customer.backButton}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-xl border border-stone-200 bg-white p-6 lg:sticky lg:top-24">
            <h3 className="text-lg font-semibold text-stone-900">
              {summary.heading}
            </h3>

            <div className="mt-4 space-y-3 border-b border-stone-200 pb-4">
              {orderSummary.lines.length === 0 ? (
                <p className="text-sm text-stone-500">{summary.emptyMessage}</p>
              ) : (
                orderSummary.lines.map((line) => (
                  <div key={`${line.label}-${line.value}`} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-stone-700">
                        {line.label}
                      </span>
                      <span className="shrink-0 text-stone-900">
                        {line.price === 0
                          ? formatPrice(0)
                          : line.isAddon
                            ? `+${formatPrice(line.price)}`
                            : formatPrice(line.price)}
                      </span>
                    </div>
                    <p className="mt-1 text-stone-600">{line.value}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-base font-semibold text-stone-900">
                {summary.totalLabel}
              </span>
              <span className="text-2xl font-bold text-stone-900">
                {formatPrice(orderSummary.total)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
