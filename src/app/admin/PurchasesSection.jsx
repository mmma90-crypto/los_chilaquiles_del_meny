"use client";

import { useMemo, useState } from "react";

const UNIDADES = ["kg", "pieza", "litro", "paquete"];

function todayInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

// Las fechas de Compras se guardan con Date.toLocaleDateString("es-MX"), ej:
// "2/7/2026" — dia/mes/año, sin hora.
function parseFecha(fecha) {
  if (!fecha) return null;
  const match = String(fecha).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(
    parseInt(yyyy, 10),
    parseInt(mm, 10) - 1,
    parseInt(dd, 10)
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

const initialForm = {
  fecha: todayInputValue(),
  producto: "",
  precioUnitario: "",
  cantidad: "",
  unidad: "kg",
  pagado: false,
};

export default function PurchasesSection({ initialPurchases, error }) {
  const [purchases, setPurchases] = useState(initialPurchases || []);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [search, setSearch] = useState("");

  const productSuggestions = useMemo(() => {
    const names = new Set(purchases.map((p) => p.producto).filter(Boolean));
    return Array.from(names);
  }, [purchases]);

  const withDates = useMemo(
    () => purchases.map((p) => ({ ...p, parsedDate: parseFecha(p.fecha) })),
    [purchases]
  );

  const now = useMemo(() => new Date(), []);

  const monthPurchases = useMemo(
    () =>
      withDates.filter(
        (p) =>
          p.parsedDate &&
          p.parsedDate.getFullYear() === now.getFullYear() &&
          p.parsedDate.getMonth() === now.getMonth()
      ),
    [withDates, now]
  );

  const totalMes = monthPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const numComprasMes = monthPurchases.length;

  const productoTopMes = useMemo(() => {
    const totals = {};
    monthPurchases.forEach((p) => {
      const nombre = p.producto || "Sin especificar";
      totals[nombre] = (totals[nombre] || 0) + (Number(p.total) || 0);
    });
    let best = null;
    let bestTotal = 0;
    Object.entries(totals).forEach(([nombre, total]) => {
      if (total > bestTotal) {
        best = nombre;
        bestTotal = total;
      }
    });
    return best;
  }, [monthPurchases]);

  const filtered = [...withDates]
    .reverse()
    .filter((p) => (p.producto || "").toLowerCase().includes(search.toLowerCase()));

  async function refreshPurchases() {
    try {
      const res = await fetch("/api/purchases");
      if (!res.ok) return;
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch {
      // Si falla el refresco, la lista local sigue mostrando el estado anterior.
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.producto.trim() || !form.precioUnitario || !form.cantidad) {
      setFormError("Completa producto, precio unitario y cantidad.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "No pudimos registrar la compra.");
        return;
      }
      await refreshPurchases();
      setForm({ ...initialForm, fecha: todayInputValue() });
    } catch {
      setFormError("No pudimos registrar la compra. Revisa tu conexion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Compras de insumos</h2>
      <p className="text-sm text-gray-500 mb-6">
        Registra las compras de ingredientes y materiales del negocio.
      </p>

      {/* Formulario de registro */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl p-5 mb-6"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Producto
            </label>
            <input
              type="text"
              list="producto-suggestions"
              placeholder="Ej. Tortillas"
              value={form.producto}
              onChange={(e) => setForm({ ...form, producto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
            <datalist id="producto-suggestions">
              {productSuggestions.map((nombre) => (
                <option key={nombre} value={nombre} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Precio unitario
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.precioUnitario}
              onChange={(e) => setForm({ ...form, precioUnitario: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Unidad
            </label>
            <select
              value={form.unidad}
              onChange={(e) => setForm({ ...form, unidad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2.5">
              <input
                type="checkbox"
                checked={form.pagado}
                onChange={(e) => setForm({ ...form, pagado: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
                style={{ accentColor: "#7f1d1d" }}
              />
              Pagado
            </label>
          </div>
        </div>

        {formError && (
          <p className="text-sm text-red-700 mt-3">{formError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: "#7f1d1d" }}
        >
          {submitting ? "Registrando..." : "Registrar compra"}
        </button>
      </form>

      {/* Mensaje de error de Google Sheets */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-amber-900 mb-1">
            No se pudieron cargar las compras
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
      )}

      {!error && (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Total gastado este mes</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalMes)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Compras este mes</p>
              <p className="text-3xl font-bold text-gray-900">{numComprasMes}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Producto con mas gasto</p>
              <p className="text-xl font-bold text-gray-900 truncate">
                {productoTopMes || "—"}
              </p>
            </div>
          </div>

          {/* Buscador */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar por producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent w-72"
              />
            </div>
            {search && (
              <span className="text-sm text-gray-500">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Estado vacio */}
          {purchases.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">Aun no hay compras registradas</p>
              <p className="text-sm text-gray-500 mt-1">
                Usa el formulario de arriba para registrar tu primera compra.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600 whitespace-nowrap">
                        Fecha
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                        Producto
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                        Precio unitario
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                        Cantidad
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                        Unidad
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                        Total
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                        Pagado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                          {p.fecha}
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {p.producto}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {formatCurrency(p.precioUnitario)}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {p.cantidad}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {p.unidad}
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {formatCurrency(p.total)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              p.pagado
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {p.pagado ? "Pagado" : "Pendiente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && search && (
                <p className="text-center text-gray-400 py-8 text-sm">
                  Sin resultados para &ldquo;{search}&rdquo;.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
