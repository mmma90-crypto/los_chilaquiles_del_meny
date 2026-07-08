"use client";

import { useMemo, useState } from "react";
import { menuConfig } from "@/config/menu";
import PlatillosSection from "./PlatillosSection";

// Relaciona el "Nombre" de la receta de proteina (pestaña Recetas) con el
// id de proteina del menu (src/config/menu.js), para poder leer su precio
// de venta real.
const PROTEIN_MENU_ID = {
  Pollo: "pollo",
  Barbacoa: "barbacoa",
  Chicharron: "chicharron",
  Huevo: "huevo",
};

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function ventaPrice(proteinaNombre) {
  const basePrice = menuConfig.steps.base.price || 0;
  if (!proteinaNombre) return basePrice;
  const proteinId = PROTEIN_MENU_ID[proteinaNombre];
  const option = menuConfig.steps.protein.options.find((p) => p.id === proteinId);
  return basePrice + (option?.price || 0);
}

function utilidadBadgeClass(pct) {
  if (pct >= 50) return "bg-green-100 text-green-700";
  if (pct >= 35) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

const FUENTE_LABELS = {
  "compra reciente": "Compra reciente",
  "promedio ponderado": "Promedio ponderado",
  "precio base": "Precio base",
};

function fuenteLabel(fuente) {
  return FUENTE_LABELS[fuente] || "Precio base";
}

function fuenteBadgeClass(fuente) {
  if (fuente === "compra reciente") return "bg-green-100 text-green-700";
  if (fuente === "promedio ponderado") return "bg-sky-100 text-sky-700";
  return "bg-gray-100 text-gray-500";
}

function Accordion({ title, summary, isOpen, onToggle, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-xs shrink-0 transition-transform duration-200"
            style={{
              color: "#7f1d1d",
              display: "inline-block",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
          <h3 className="text-sm font-semibold text-gray-700 truncate">{title}</h3>
        </div>
        {summary && (
          <span
            className={`text-xs text-gray-400 truncate shrink-0 transition-opacity duration-200 ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          >
            {summary}
          </span>
        )}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

const emptySueldo = { sueldoSemanal: 0, promedioPlatillosSemana: 0, costoPorPlatillo: 0 };
const emptyBlock = {
  salsas: [],
  proteinas: [],
  combinaciones: [],
  ingredientes: [],
  sueldo: emptySueldo,
};
const emptyAnalysis = { actual: emptyBlock, ultimos30dias: emptyBlock };

const VIEWS = [
  { id: "actual", label: "Hoy" },
  { id: "ultimos30dias", label: "Últimos 30 días" },
  { id: "rangoPersonalizado", label: "Rango personalizado" },
];

export default function CostsSection({
  initialAnalysis,
  error,
  initialPlatillos,
  platillosError,
}) {
  const [analysis, setAnalysis] = useState(initialAnalysis || emptyAnalysis);
  const [view, setView] = useState("actual");
  const [desdeInput, setDesdeInput] = useState("");
  const [hastaInput, setHastaInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [openSections, setOpenSections] = useState({
    salsas: false,
    proteinas: false,
    platillo: true,
    ingredientes: false,
  });

  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const currentBlock = analysis[view] || emptyBlock;
  const rangoPendiente = view === "rangoPersonalizado" && !analysis.rangoPersonalizado;

  const rows = useMemo(
    () =>
      currentBlock.combinaciones.map((c) => {
        const precioVenta = ventaPrice(c.proteina);
        const utilidad = precioVenta - c.costo;
        const pct = precioVenta > 0 ? (utilidad / precioVenta) * 100 : 0;
        return {
          key: `${c.salsa}-${c.proteina || "sencillo"}`,
          salsa: c.salsa,
          proteina: c.proteina || "Sencillo",
          costo: c.costo,
          precioVenta,
          utilidad,
          pct,
        };
      }),
    [currentBlock]
  );

  const proteinRows = useMemo(
    () =>
      currentBlock.proteinas.map((p) => {
        const proteinId = PROTEIN_MENU_ID[p.nombre];
        const option = menuConfig.steps.protein.options.find((o) => o.id === proteinId);
        const precioExtra = option?.price;
        const tieneExtra = precioExtra !== undefined && precioExtra !== null;
        const utilidad = tieneExtra ? precioExtra - p.costo : null;
        const pct = tieneExtra && precioExtra > 0 ? (utilidad / precioExtra) * 100 : null;
        return {
          key: p.nombre,
          nombre: p.nombre,
          costo: p.costo,
          precioExtra,
          tieneExtra,
          utilidad,
          pct,
        };
      }),
    [currentBlock]
  );

  const avgUtilidadPct = useMemo(() => {
    if (rows.length === 0) return null;
    const sum = rows.reduce((acc, r) => acc + r.pct, 0);
    return sum / rows.length;
  }, [rows]);

  async function fetchAnalysis({ desde, hasta } = {}) {
    setRefreshing(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const qs = params.toString();
      const res = await fetch(`/api/costs${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "No pudimos actualizar los costos.");
        return;
      }
      setAnalysis(data);
    } catch {
      setLoadError("No pudimos actualizar los costos. Revisa tu conexion.");
    } finally {
      setRefreshing(false);
    }
  }

  function refresh() {
    if (view === "rangoPersonalizado" && desdeInput && hastaInput) {
      fetchAnalysis({ desde: desdeInput, hasta: hastaInput });
    } else {
      fetchAnalysis();
    }
  }

  function calcularRango() {
    fetchAnalysis({ desde: desdeInput, hasta: hastaInput });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Recetas y costos</h2>
          <p className="text-sm text-gray-500">
            Costo real de tus salsas y platillos a partir de tus recetas y compras.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity shrink-0"
          style={{ backgroundColor: "#7f1d1d" }}
        >
          {refreshing ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="inline-flex bg-white border border-gray-200 rounded-full p-1 gap-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                view === v.id ? "text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
              style={view === v.id ? { backgroundColor: "#7f1d1d" } : undefined}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === "rangoPersonalizado" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={desdeInput}
              onChange={(e) => setDesdeInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700"
            />
            <span className="text-sm text-gray-400">a</span>
            <input
              type="date"
              value={hastaInput}
              onChange={(e) => setHastaInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700"
            />
            <button
              type="button"
              onClick={calcularRango}
              disabled={refreshing || !desdeInput || !hastaInput}
              className="px-4 py-1.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: "#7f1d1d" }}
            >
              {refreshing ? "Calculando..." : "Calcular"}
            </button>
          </div>
        )}
      </div>

      {(error || loadError) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-amber-900 mb-1">
            No se pudieron cargar los costos
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
              {error || loadError}
            </code>
          </details>
        </div>
      )}

      {!error && rangoPendiente && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
          Elige un rango de fechas y presiona &quot;Calcular&quot; para ver los costos de ese periodo.
        </div>
      )}

      {!error && !rangoPendiente && (
        <>
          <PlatillosSection initialPlatillos={initialPlatillos} error={platillosError} />

          {/* Mis salsas */}
          <Accordion
            title="Mis salsas"
            summary={`${currentBlock.salsas.length} ${
              currentBlock.salsas.length === 1 ? "salsa" : "salsas"
            }`}
            isOpen={openSections.salsas}
            onToggle={() => toggleSection("salsas")}
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentBlock.salsas.map((s) => (
                <div
                  key={s.nombre}
                  className="bg-white border border-gray-200 rounded-2xl p-5"
                >
                  <p className="text-sm text-gray-500 mb-1">{s.nombre}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(s.costoTotal)}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    costo de la tanda ({s.rendimientoLitros} L)
                  </p>
                  <p className="text-sm font-medium" style={{ color: "#7f1d1d" }}>
                    {formatCurrency(s.costoPorLitro)} / litro
                  </p>
                </div>
              ))}
              {currentBlock.salsas.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full">
                  No hay recetas de salsa registradas.
                </p>
              )}
            </div>
          </Accordion>

          {/* Proteinas y extras */}
          <Accordion
            title="Proteínas y extras"
            summary={`${proteinRows.length} ${
              proteinRows.length === 1 ? "proteina" : "proteinas"
            }`}
            isOpen={openSections.proteinas}
            onToggle={() => toggleSection("proteinas")}
          >
            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Proteina</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Costo por porcion</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Precio de venta como extra</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Utilidad</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Utilidad %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {proteinRows.map((p) => (
                      <tr key={p.key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {p.nombre}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {formatCurrency(p.costo)}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {p.tieneExtra ? formatCurrency(p.precioExtra) : "—"}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {p.tieneExtra ? formatCurrency(p.utilidad) : "—"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {p.tieneExtra ? (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${utilidadBadgeClass(
                                p.pct
                              )}`}
                            >
                              {p.pct.toFixed(1)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                    {proteinRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 py-8 text-sm">
                          No hay proteinas registradas en Recetas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Accordion>

          {/* Costo por platillo */}
          <Accordion
            title="Costo por platillo"
            summary={
              avgUtilidadPct === null
                ? "sin datos"
                : `margen promedio ${avgUtilidadPct.toFixed(0)}%`
            }
            isOpen={openSections.platillo}
            onToggle={() => toggleSection("platillo")}
          >
            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Salsa</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Proteina</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Costo real</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Precio de venta</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Utilidad</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Utilidad %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {rows.map((r) => (
                      <tr key={r.key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {r.salsa}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {r.proteina}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {formatCurrency(r.costo)}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {formatCurrency(r.precioVenta)}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {formatCurrency(r.utilidad)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${utilidadBadgeClass(
                              r.pct
                            )}`}
                          >
                            {r.pct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-400 py-8 text-sm">
                          No hay platillos registrados en Recetas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Accordion>

          {/* Mano de obra prorrateada */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Mano de obra (sueldo)</h3>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8">
            <p className="text-sm text-gray-600">
              Sueldo semanal:{" "}
              <span className="font-semibold text-gray-900">
                {formatCurrency(currentBlock.sueldo?.sueldoSemanal ?? 0)}
              </span>
              {" | "}
              Promedio platillos/semana:{" "}
              <span className="font-semibold text-gray-900">
                {(currentBlock.sueldo?.promedioPlatillosSemana ?? 0).toFixed(1)}
              </span>
              {" | "}
              Costo de mano de obra por platillo:{" "}
              <span className="font-semibold" style={{ color: "#7f1d1d" }}>
                {formatCurrency(currentBlock.sueldo?.costoPorPlatillo ?? 0)}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Editable en la hoja &quot;ParametrosCosteo&quot; (columna Valor de
              &quot;Sueldo semanal ayuda&quot;). El pago real sigue registrandose aparte como
              Retiro.
            </p>
          </div>

          {/* Precios de ingredientes */}
          <Accordion
            title="Precios de ingredientes"
            summary={`${currentBlock.ingredientes.length} ${
              currentBlock.ingredientes.length === 1 ? "ingrediente" : "ingredientes"
            }`}
            isOpen={openSections.ingredientes}
            onToggle={() => toggleSection("ingredientes")}
          >
            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Ingrediente</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Precio usado</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Unidad</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">Origen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {currentBlock.ingredientes.map((ing) => (
                      <tr key={ing.nombre} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {ing.nombre}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {formatCurrency(ing.precio)}
                        </td>
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {ing.unidad}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${fuenteBadgeClass(
                              ing.fuente
                            )}`}
                          >
                            {fuenteLabel(ing.fuente)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {currentBlock.ingredientes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-gray-400 py-8 text-sm">
                          No hay ingredientes registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Accordion>
        </>
      )}
    </div>
  );
}
