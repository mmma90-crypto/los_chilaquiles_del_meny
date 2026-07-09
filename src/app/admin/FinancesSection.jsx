"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { siteConfig } from "@/config/site";

const MESES_NOMBRES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const METODOS_PAGO = ["Efectivo", "Transferencia", "Otro"];

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

function formatPercent(value) {
  const num = Number(value) || 0;
  return `${num.toFixed(1)}%`;
}

const initialForm = {
  fecha: todayInputValue(),
  concepto: "Venta domingo",
  monto: "",
  metodoPago: "Efectivo",
};

export default function FinancesSection({ initialFinances, error }) {
  const [meses, setMeses] = useState(initialFinances || []);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();

  function toggleMonth(mes) {
    setExpandedMonth((prev) => (prev === mes ? null : mes));
  }

  const mesActual = useMemo(
    () => meses.find((m) => m.mes === selectedMonth) || null,
    [meses, selectedMonth]
  );

  const resumenAnual = useMemo(() => {
    let ventasTotales = 0;
    let efectivo = 0;
    let transferencia = 0;
    let tarjetaPaypal = 0;
    let gastoInsumos = 0;
    let gastosFijosAcumulados = 0;

    meses.forEach((m) => {
      ventasTotales += m.ventasTotales || 0;
      efectivo += m.totalesPorMetodo?.efectivo || 0;
      transferencia += m.totalesPorMetodo?.transferencia || 0;
      tarjetaPaypal += m.totalesPorMetodo?.tarjetaPaypal || 0;
      gastoInsumos += m.gastoInsumos || 0;
      if (m.mes <= currentMonthIndex) {
        gastosFijosAcumulados += m.gastosFijos || 0;
      }
    });

    const utilidadNeta = ventasTotales - gastoInsumos - gastosFijosAcumulados;
    const margenNeto = ventasTotales > 0 ? (utilidadNeta / ventasTotales) * 100 : 0;

    return {
      ventasTotales,
      efectivo,
      transferencia,
      tarjetaPaypal,
      gastoInsumos,
      gastosFijosAcumulados,
      utilidadNeta,
      margenNeto,
    };
  }, [meses, currentMonthIndex]);

  async function refreshFinances() {
    try {
      const res = await fetch("/api/finances");
      if (!res.ok) return;
      const data = await res.json();
      setMeses(data.meses || []);
    } catch {
      // Si falla el refresco, la lista local sigue mostrando el estado anterior.
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.concepto.trim() || !form.monto) {
      setFormError("Completa concepto y monto.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "No pudimos registrar la venta.");
        return;
      }
      await refreshFinances();
      setForm({ ...initialForm, fecha: todayInputValue() });
    } catch {
      setFormError("No pudimos registrar la venta. Revisa tu conexion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
      {!error && <EstadoResultadosSection meses={meses} />}

      {!error && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Resumen anual {currentYear}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Todos los meses del año, sin importar el mes elegido abajo.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Ventas del año</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(resumenAnual.ventasTotales)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Efectivo {formatCurrency(resumenAnual.efectivo)} · Transferencia{" "}
                {formatCurrency(resumenAnual.transferencia)} · Tarjeta/PayPal{" "}
                {formatCurrency(resumenAnual.tarjetaPaypal)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Gastado en insumos del año</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(resumenAnual.gastoInsumos)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Gastos fijos acumulados</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(resumenAnual.gastosFijosAcumulados)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Utilidad neta del año</p>
              <p
                className={`text-2xl font-bold ${
                  resumenAnual.utilidadNeta >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {formatCurrency(resumenAnual.utilidadNeta)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Margen {formatPercent(resumenAnual.margenNeto)}
              </p>
            </div>
          </div>

          <AnnualBarChart meses={meses} />
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Finanzas</h2>
          <p className="text-sm text-gray-500">
            Utilidad neta mensual del negocio.
          </p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
        >
          {MESES_NOMBRES.map((nombre, i) => (
            <option key={nombre} value={i}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-amber-900 mb-1">
            No se pudieron cargar las finanzas
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
          {/* Tarjetas del mes seleccionado */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Ventas totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mesActual?.ventasTotales)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Pagina {formatCurrency(mesActual?.ventasPagina)} · Manuales{" "}
                {formatCurrency(mesActual?.ventasManuales)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Gasto en insumos</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mesActual?.gastoInsumos)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Gastos fijos</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mesActual?.gastosFijos)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Utilidad neta</p>
              <p
                className={`text-2xl font-bold ${
                  (mesActual?.utilidadNeta || 0) >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {formatCurrency(mesActual?.utilidadNeta)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Margen {formatPercent(mesActual?.margenNeto)}
              </p>
            </div>
          </div>

          {/* Formulario de venta manual */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-2xl p-5 mb-6"
          >
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Registrar venta manual
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  Concepto
                </label>
                <input
                  type="text"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Metodo de pago
                </label>
                <select
                  value={form.metodoPago}
                  onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity"
                  style={{ backgroundColor: "#7f1d1d" }}
                >
                  {submitting ? "Registrando..." : "Registrar venta"}
                </button>
              </div>
            </div>
            {formError && <p className="text-sm text-red-700 mt-3">{formError}</p>}
          </form>

          {/* Tabla comparativa de todos los meses */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                      Mes
                    </th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                      Ventas
                    </th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                      Insumos
                    </th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                      Fijos
                    </th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                      Utilidad neta
                    </th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                      Margen %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {meses.map((m) => {
                    const expanded = expandedMonth === m.mes;
                    return (
                      <Fragment key={m.mes}>
                        <tr
                          onClick={() => toggleMonth(m.mes)}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                            m.mes === selectedMonth ? "bg-gray-50" : ""
                          }`}
                        >
                          <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                            <span className="flex items-center gap-2">
                              <svg
                                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                                  expanded ? "rotate-90" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              {MESES_NOMBRES[m.mes]}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            {formatCurrency(m.ventasTotales)}
                          </td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            {formatCurrency(m.gastoInsumos)}
                          </td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            {formatCurrency(m.gastosFijos)}
                          </td>
                          <td
                            className={`px-5 py-4 font-medium whitespace-nowrap ${
                              m.utilidadNeta >= 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {formatCurrency(m.utilidadNeta)}
                          </td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            {formatPercent(m.margenNeto)}
                          </td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={6} className="p-0 bg-gray-50">
                              <WeekendBreakdown month={m} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EstadoResultadosSection({ meses }) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth());
  const [anio, setAnio] = useState(now.getFullYear());
  // `resultado.key` indica a que mes/año corresponde lo cargado; mientras no
  // coincida con la seleccion actual, la seccion se muestra como "cargando".
  const [resultado, setResultado] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  const anios = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];
  const requestKey = `${mes}-${anio}`;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/estado-resultados?mes=${mes}&anio=${anio}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "No pudimos cargar el estado de resultados.");
        }
        if (!cancelled) setResultado({ key: requestKey, data: json });
      })
      .catch((e) => {
        if (!cancelled) {
          setResultado({
            key: requestKey,
            error: e.message || "No pudimos cargar el estado de resultados.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mes, anio, requestKey]);

  const loading = resultado?.key !== requestKey;
  const loadError = loading ? null : resultado?.error || null;
  const data = loading ? null : resultado?.data || null;

  // Margen neto promedio de los ultimos 6 meses con ventas (o los que haya).
  const margenPromedio = useMemo(() => {
    const conVentas = meses.filter((m) => (m.ventasTotales || 0) > 0);
    const ultimos = conVentas.slice(-6);
    if (ultimos.length === 0) return null;
    return {
      valor: ultimos.reduce((s, m) => s + (m.margenNeto || 0), 0) / ultimos.length,
      numMeses: ultimos.length,
    };
  }, [meses]);

  const estado = data?.estado;
  const pe = data?.puntoEquilibrio;
  const equilibrioPlatillos =
    pe?.puntoEquilibrioPlatillos != null
      ? Math.ceil(pe.puntoEquilibrioPlatillos)
      : null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Estado de resultados
          </h2>
          <p className="text-sm text-gray-500">
            Ventas, costos y utilidades del mes elegido.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          >
            {MESES_NOMBRES.map((nombre, i) => (
              <option key={nombre} value={i}>
                {nombre}
              </option>
            ))}
          </select>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowPrint(true)}
            disabled={!estado || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity flex items-center gap-1.5"
            style={{ backgroundColor: "#7f1d1d" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        {loading ? (
          <p className="text-sm text-gray-500 py-4">Calculando estado de resultados...</p>
        ) : loadError ? (
          <p className="text-sm text-red-700 py-4">{loadError}</p>
        ) : estado ? (
          <div className="max-w-2xl">
            <EstadoResultadosDetalle estado={estado} />
          </div>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500 mb-1">Punto de equilibrio</p>
          {!pe ? (
            <p className="text-sm text-gray-400">
              {loading ? "Calculando..." : "Sin datos suficientes."}
            </p>
          ) : equilibrioPlatillos === null ? (
            <p className="text-sm text-red-700">
              No se puede calcular: el costo variable promedio (
              {formatCurrency(pe.costoVariablePromedio)}) es igual o mayor al precio
              promedio de venta ({formatCurrency(pe.precioPromedio)}).
            </p>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {equilibrioPlatillos}{" "}
                <span className="text-sm font-medium text-gray-500">
                  platillos/mes
                </span>
              </p>
              <p
                className={`text-sm font-medium mt-1 ${
                  pe.arribaDelEquilibrio ? "text-green-700" : "text-red-700"
                }`}
              >
                {MESES_NOMBRES[pe.mes]}: {pe.platillosVendidosMes} vendidos —{" "}
                {pe.arribaDelEquilibrio ? "arriba" : "abajo"} del equilibrio
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Precio promedio {formatCurrency(pe.precioPromedio)} · Costo variable{" "}
                {formatCurrency(pe.costoVariablePromedio)} · Gastos fijos{" "}
                {formatCurrency(pe.gastosFijosMensuales)}/mes
              </p>
            </>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500 mb-1">Margen neto promedio</p>
          {margenPromedio === null ? (
            <p className="text-sm text-gray-400">Sin meses con ventas todavia.</p>
          ) : (
            <>
              <p
                className={`text-2xl font-bold ${
                  margenPromedio.valor >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {formatPercent(margenPromedio.valor)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Promedio de los ultimos {margenPromedio.numMeses}{" "}
                {margenPromedio.numMeses === 1 ? "mes" : "meses"} con ventas.
              </p>
            </>
          )}
        </div>
      </div>

      {showPrint && estado && (
        <EstadoResultadosPrint estado={estado} onClose={() => setShowPrint(false)} />
      )}
    </div>
  );
}

// Desglose del estado de resultados, compartido entre la tarjeta del panel y
// la vista de impresion.
function EstadoResultadosDetalle({ estado }) {
  const brutaPositiva = estado.utilidadBruta >= 0;
  const netaPositiva = estado.utilidadNeta >= 0;

  return (
    <div className="text-sm">
      <div className="flex justify-between py-2 text-gray-600">
        <span>Ventas del sitio</span>
        <span>{formatCurrency(estado.ventasSitio)}</span>
      </div>
      <div className="flex justify-between py-2 text-gray-600">
        <span>Ventas manuales</span>
        <span>{formatCurrency(estado.ventasManuales)}</span>
      </div>
      <div className="flex justify-between py-2 border-t border-gray-200 font-semibold text-gray-900">
        <span>Ventas totales</span>
        <span>{formatCurrency(estado.ventasTotales)}</span>
      </div>
      <div className="flex justify-between py-2 text-gray-600">
        <span>Costo de ventas (insumos)</span>
        <span>−{formatCurrency(estado.costoVentas)}</span>
      </div>
      <div
        className={`flex justify-between items-center rounded-lg px-3 py-2.5 my-2 font-semibold ${
          brutaPositiva ? "bg-green-50 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        <span>Utilidad bruta</span>
        <span>
          {formatCurrency(estado.utilidadBruta)}{" "}
          <span className="text-xs font-medium">
            ({formatPercent(estado.margenBruto)})
          </span>
        </span>
      </div>
      <p className="font-medium text-gray-700 pt-2 pb-1">Gastos de operacion</p>
      {estado.gastosOperacion.length === 0 ? (
        <p className="pl-4 py-1.5 text-gray-400">Sin gastos registrados este mes.</p>
      ) : (
        estado.gastosOperacion.map((g) => (
          <div
            key={g.categoria}
            className="flex justify-between py-1.5 pl-4 text-gray-600"
          >
            <span>{g.categoria}</span>
            <span>−{formatCurrency(g.monto)}</span>
          </div>
        ))
      )}
      <div className="flex justify-between py-2 border-t border-gray-200 font-medium text-gray-900">
        <span>Total gastos de operacion</span>
        <span>−{formatCurrency(estado.totalGastosOperacion)}</span>
      </div>
      <div
        className={`flex justify-between items-center rounded-lg px-3 py-2.5 mt-2 font-bold ${
          netaPositiva ? "bg-blue-50 text-blue-800" : "bg-red-100 text-red-800"
        }`}
      >
        <span>Utilidad neta</span>
        <span>
          {formatCurrency(estado.utilidadNeta)}{" "}
          <span className="text-xs font-semibold">
            ({formatPercent(estado.margenNeto)})
          </span>
        </span>
      </div>
    </div>
  );
}

// Vista de impresion: cubre toda la pantalla con solo el estado de resultados
// y dispara window.print() al abrirse; el usuario elige "Guardar como PDF" en
// el dialogo del navegador. El <style> oculta el resto del panel al imprimir.
function EstadoResultadosPrint({ estado, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="estado-resultados-print" className="fixed inset-0 z-50 bg-white overflow-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #estado-resultados-print, #estado-resultados-print * { visibility: visible; }
          #estado-resultados-print {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: auto;
            overflow: visible;
          }
        }
      `}</style>
      <div className="print:hidden flex justify-end gap-2 px-6 py-4 border-b border-gray-100">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#7f1d1d" }}
        >
          Imprimir / Guardar PDF
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>
      <div className="max-w-2xl mx-auto px-8 py-10">
        <div
          className="border-b-2 pb-4 mb-6"
          style={{ borderColor: "#7f1d1d" }}
        >
          <p className="text-2xl font-bold" style={{ color: "#7f1d1d" }}>
            {siteConfig.name}
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            Estado de resultados — {MESES_NOMBRES[estado.mes]} {estado.anio}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Generado el {new Date().toLocaleDateString("es-MX")}
          </p>
        </div>
        <EstadoResultadosDetalle estado={estado} />
      </div>
    </div>
  );
}

function AnnualBarChart({ meses }) {
  const maxAbs = Math.max(1, ...meses.map((m) => Math.abs(m.utilidadNeta || 0)));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-sm font-semibold text-gray-900 mb-4">
        Utilidad neta por mes
      </p>
      <div className="flex items-stretch gap-2">
        {meses.map((m) => {
          const utilidad = m.utilidadNeta || 0;
          const sinDatos =
            (m.ventasTotales || 0) === 0 && (m.gastoInsumos || 0) === 0;
          const alturaPositiva =
            !sinDatos && utilidad > 0
              ? Math.max(4, (utilidad / maxAbs) * 60)
              : 0;
          const alturaNegativa =
            !sinDatos && utilidad < 0
              ? Math.max(4, (Math.abs(utilidad) / maxAbs) * 60)
              : 0;
          const color = sinDatos
            ? "#d1d5db"
            : utilidad >= 0
            ? "#15803d"
            : "#b91c1c";

          return (
            <div
              key={m.mes}
              className="flex-1 flex flex-col items-center"
              title={`${MESES_NOMBRES[m.mes]}: ${formatCurrency(utilidad)}`}
            >
              <div
                className="w-full flex flex-col justify-end"
                style={{ height: 64 }}
              >
                {alturaPositiva > 0 && (
                  <div
                    className="w-full rounded-t"
                    style={{ height: alturaPositiva, backgroundColor: color }}
                  />
                )}
              </div>
              <div className="w-full border-t border-gray-300" />
              <div
                className="w-full flex flex-col justify-start"
                style={{ height: 64 }}
              >
                {sinDatos ? (
                  <div
                    className="w-full rounded-b"
                    style={{ height: 4, backgroundColor: color }}
                  />
                ) : (
                  alturaNegativa > 0 && (
                    <div
                      className="w-full rounded-b"
                      style={{ height: alturaNegativa, backgroundColor: color }}
                    />
                  )
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 uppercase">
                {MESES_NOMBRES[m.mes].slice(0, 3)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekendBreakdown({ month }) {
  const dias = month.ventasPorFecha || [];
  const totales = month.totalesPorMetodo || {
    efectivo: 0,
    transferencia: 0,
    tarjetaPaypal: 0,
    otro: 0,
    total: 0,
  };
  const showOtro = totales.otro > 0;

  if (dias.length === 0) {
    return (
      <div className="px-5 py-6 text-sm text-gray-500">
        Sin ventas registradas este mes.
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Detalle por fin de semana
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium text-gray-600">Fecha</th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">Efectivo</th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Transferencia
              </th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Tarjeta/PayPal
              </th>
              {showOtro && (
                <th className="text-left py-2 pr-4 font-medium text-gray-600">Otro</th>
              )}
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Total del dia
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dias.map((dia) => (
              <tr key={dia.fecha}>
                <td className="py-2 pr-4 whitespace-nowrap text-gray-700">{dia.fecha}</td>
                <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                  {formatCurrency(dia.efectivo)}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                  {formatCurrency(dia.transferencia)}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                  {formatCurrency(dia.tarjetaPaypal)}
                </td>
                {showOtro && (
                  <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                    {formatCurrency(dia.otro)}
                  </td>
                )}
                <td className="py-2 pr-4 whitespace-nowrap font-medium text-gray-900">
                  {formatCurrency(dia.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 font-semibold">
              <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">
                Total del mes
              </td>
              <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">
                {formatCurrency(totales.efectivo)}
              </td>
              <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">
                {formatCurrency(totales.transferencia)}
              </td>
              <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">
                {formatCurrency(totales.tarjetaPaypal)}
              </td>
              {showOtro && (
                <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">
                  {formatCurrency(totales.otro)}
                </td>
              )}
              <td
                className="py-2 pr-4 whitespace-nowrap"
                style={{ color: "#7f1d1d" }}
              >
                {formatCurrency(totales.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
