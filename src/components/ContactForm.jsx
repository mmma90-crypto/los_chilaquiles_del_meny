"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [serverError, setServerError] = useState("");

  const { heading, subheading, form: formConfig, schedulingUrl, schedulingCta } = siteConfig.contact;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpia el error del campo cuando el usuario empieza a corregirlo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = "Por favor escribe tu nombre.";
    }
    if (!form.email.trim()) {
      newErrors.email = "Por favor escribe tu email.";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "Ese email no parece valido. Ejemplo: nombre@correo.com";
    }
    if (formConfig.phoneRequired && !form.phone.trim()) {
      newErrors.phone = "Por favor escribe tu telefono.";
    }
    if (!form.message.trim()) {
      newErrors.message = "Por favor escribe tu mensaje.";
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, aceptaTerminos: acceptedTerms }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || formConfig.errorMessage);
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm({ name: "", email: "", phone: "", message: "" });
      setAcceptedTerms(false);
      setErrors({});
    } catch {
      setServerError(formConfig.errorMessage);
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            {heading}
          </h2>
          <p className="text-lg text-stone-600">
            {subheading}
          </p>
          {schedulingUrl && (
            <a
              href={schedulingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-2.5 border border-salsa-700 text-salsa-800 font-medium rounded-full hover:bg-salsa-50 transition-colors text-sm"
            >
              {schedulingCta}
            </a>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-crema-200 rounded-2xl p-8 space-y-6 shadow-sm"
        >
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder={formConfig.namePlaceholder}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-salsa-600 focus:border-transparent transition ${
                errors.name ? "border-red-400 bg-red-50" : "border-stone-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder={formConfig.emailPlaceholder}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-salsa-600 focus:border-transparent transition ${
                errors.email ? "border-red-400 bg-red-50" : "border-stone-300"
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Telefono */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-2">
              Telefono
              {!formConfig.phoneRequired && (
                <span className="ml-1.5 text-stone-400 font-normal">(opcional)</span>
              )}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder={formConfig.phonePlaceholder}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-salsa-600 focus:border-transparent transition ${
                errors.phone ? "border-red-400 bg-red-50" : "border-stone-300"
              }`}
            />
            {errors.phone && (
              <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Mensaje */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-2">
              Mensaje
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              placeholder={formConfig.messagePlaceholder}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-salsa-600 focus:border-transparent transition resize-none ${
                errors.message ? "border-red-400 bg-red-50" : "border-stone-300"
              }`}
            />
            {errors.message && (
              <p className="mt-1.5 text-sm text-red-600">{errors.message}</p>
            )}
          </div>

          {/* Aceptacion de aviso de privacidad y terminos */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-salsa-700 cursor-pointer"
            />
            <span className="text-sm text-stone-600">
              He leído y acepto el{" "}
              <a
                href="/aviso-de-privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-stone-700 hover:text-salsa-700"
              >
                Aviso de Privacidad
              </a>{" "}
              y los{" "}
              <a
                href="/terminos-y-condiciones"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-stone-700 hover:text-salsa-700"
              >
                Términos y Condiciones
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={status === "loading" || !acceptedTerms}
            className="w-full py-3.5 bg-salsa-700 text-white font-medium rounded-full hover:bg-salsa-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-salsa-700/20"
          >
            {status === "loading" ? formConfig.sendingButton : formConfig.submitButton}
          </button>

          {status === "success" && (
            <p className="text-center text-green-600 font-medium">
              {formConfig.successMessage}
            </p>
          )}
          {status === "error" && (
            <p className="text-center text-red-600 font-medium">
              {serverError || formConfig.errorMessage}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
