"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";

function Stars({ value, onChange }) {
  const interactive = typeof onChange === "function";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          className={`text-2xl leading-none ${interactive ? "cursor-pointer" : "cursor-default"} ${
            n <= value ? "text-amber-500" : "text-stone-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { heading, subheading, form: formConfig } = siteConfig.reviews;

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [form, setForm] = useState({ name: "", comment: "" });
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = "Por favor escribe tu nombre.";
    }
    if (rating < 1) {
      newErrors.rating = "Por favor selecciona una calificación.";
    }
    if (!form.comment.trim()) {
      newErrors.comment = "Por favor escribe tu comentario.";
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
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || formConfig.errorMessage);
        setStatus("error");
        return;
      }

      setReviews((prev) => [
        { fecha: "", nombre: form.name, calificacion: rating, comentario: form.comment },
        ...prev,
      ]);
      setStatus("success");
      setForm({ name: "", comment: "" });
      setRating(0);
      setErrors({});
    } catch {
      setServerError(formConfig.errorMessage);
      setStatus("error");
    }
  }

  const average =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section id="reviews" className="py-20 px-6 bg-crema-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            {heading}
          </h2>
          <p className="text-lg text-stone-600">{subheading}</p>
          {average && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Stars value={Math.round(average)} />
              <span className="text-stone-700 font-medium">
                {average} de 5 ({reviews.length} reseña{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-crema-200 rounded-2xl p-8 space-y-6 shadow-sm mb-12"
        >
          <div>
            <label htmlFor="review-name" className="block text-sm font-medium text-stone-700 mb-2">
              Nombre
            </label>
            <input
              id="review-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder={formConfig.namePlaceholder}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-salsa-600 focus:border-transparent transition ${
                errors.name ? "border-red-400 bg-red-50" : "border-stone-300"
              }`}
            />
            {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Calificación
            </label>
            <Stars value={rating} onChange={setRating} />
            {errors.rating && <p className="mt-1.5 text-sm text-red-600">{errors.rating}</p>}
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-stone-700 mb-2">
              Comentario
            </label>
            <textarea
              id="review-comment"
              name="comment"
              rows={4}
              value={form.comment}
              onChange={handleChange}
              placeholder={formConfig.commentPlaceholder}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-salsa-600 focus:border-transparent transition resize-none ${
                errors.comment ? "border-red-400 bg-red-50" : "border-stone-300"
              }`}
            />
            {errors.comment && <p className="mt-1.5 text-sm text-red-600">{errors.comment}</p>}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3.5 bg-salsa-700 text-white font-medium rounded-full hover:bg-salsa-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-salsa-700/20"
          >
            {status === "loading" ? formConfig.sendingButton : formConfig.submitButton}
          </button>

          {status === "success" && (
            <p className="text-center text-green-600 font-medium">{formConfig.successMessage}</p>
          )}
          {status === "error" && (
            <p className="text-center text-red-600 font-medium">
              {serverError || formConfig.errorMessage}
            </p>
          )}
        </form>

        {/* Lista de reseñas */}
        <div className="space-y-4">
          {loadingReviews ? (
            <p className="text-center text-stone-500">Cargando reseñas...</p>
          ) : reviews.length === 0 ? (
            <p className="text-center text-stone-500">{formConfig.emptyMessage}</p>
          ) : (
            reviews.map((r, i) => (
              <div
                key={i}
                className="bg-white border border-crema-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-stone-900">{r.nombre}</span>
                  <Stars value={r.calificacion} />
                </div>
                <p className="text-stone-600">{r.comentario}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
