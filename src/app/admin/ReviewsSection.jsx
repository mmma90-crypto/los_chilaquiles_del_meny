"use client";

import { useState } from "react";

function Stars({ value }) {
  return (
    <span className="text-amber-500">
      {"★".repeat(value)}
      <span className="text-gray-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function ReviewsSection({ reviews: initialReviews, error }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [busyRow, setBusyRow] = useState(null);
  const [actionError, setActionError] = useState("");

  const pending = reviews.filter((r) => !r.aprobado);
  const approved = reviews.filter((r) => r.aprobado);

  async function handleApprove(rowNumber) {
    setBusyRow(rowNumber);
    setActionError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "No pudimos aprobar la reseña.");
        return;
      }
      setReviews((prev) =>
        prev.map((r) => (r.rowNumber === rowNumber ? { ...r, aprobado: true } : r))
      );
    } catch {
      setActionError("No pudimos aprobar la reseña.");
    } finally {
      setBusyRow(null);
    }
  }

  async function handleDelete(rowNumber) {
    if (!confirm("¿Eliminar esta reseña? Esta acción no se puede deshacer.")) return;
    setBusyRow(rowNumber);
    setActionError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "No pudimos eliminar la reseña.");
        return;
      }
      setReviews((prev) => prev.filter((r) => r.rowNumber !== rowNumber));
    } catch {
      setActionError("No pudimos eliminar la reseña.");
    } finally {
      setBusyRow(null);
    }
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <p className="font-semibold text-amber-900 mb-1">
          No se pudieron cargar las reseñas
        </p>
        <p className="text-sm text-amber-700">
          Verifica que las variables de entorno de Google Sheets esten configuradas en{" "}
          <code className="bg-amber-100 px-1 rounded">.env.local</code>.
        </p>
        <details className="mt-3">
          <summary className="text-xs text-amber-600 cursor-pointer select-none">
            Ver detalle tecnico
          </summary>
          <code className="block mt-2 text-xs text-amber-800 bg-amber-100 p-3 rounded break-all">
            {error}
          </code>
        </details>
      </div>
    );
  }

  return (
    <div>
      {actionError && (
        <p className="text-sm text-red-600 mb-4">{actionError}</p>
      )}

      {/* Pendientes de aprobar */}
      <div className="mb-10">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Pendientes de revisión ({pending.length})
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Solo las reseñas aprobadas se muestran en el sitio.
        </p>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">No hay reseñas pendientes.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div
                key={r.rowNumber}
                className="bg-white border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{r.nombre}</span>
                    <Stars value={r.calificacion} />
                    <span className="text-xs text-gray-400">{r.fecha}</span>
                  </div>
                  <p className="text-sm text-gray-600 break-words">{r.comentario}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyRow === r.rowNumber}
                    onClick={() => handleApprove(r.rowNumber)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    disabled={busyRow === r.rowNumber}
                    onClick={() => handleDelete(r.rowNumber)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ya aprobadas */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Publicadas ({approved.length})
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Visibles ahora mismo en la sección de reseñas del sitio.
        </p>
        {approved.length === 0 ? (
          <p className="text-sm text-gray-400">Aún no hay reseñas publicadas.</p>
        ) : (
          <div className="space-y-3">
            {approved.map((r) => (
              <div
                key={r.rowNumber}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{r.nombre}</span>
                    <Stars value={r.calificacion} />
                    <span className="text-xs text-gray-400">{r.fecha}</span>
                  </div>
                  <p className="text-sm text-gray-600 break-words">{r.comentario}</p>
                </div>
                <button
                  type="button"
                  disabled={busyRow === r.rowNumber}
                  onClick={() => handleDelete(r.rowNumber)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
