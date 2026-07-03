"use client";

import { useMemo, useState } from "react";
import { logoutAction } from "./actions";
import { siteConfig } from "@/config/site";

// Las fechas se guardan con Date.toLocaleString("es-MX"), ej:
// "2/7/2026, 4:33:08 a. m." — dia/mes/año, 12 horas con a. m. / p. m.
function parseFecha(fecha) {
  if (!fecha) return null;
  const clean = fecha.replace(/[  ]/g, " ").trim();
  const match = clean.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*([ap])\.?\s*\.?m\.?/i
  );
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min, ss, ampm] = match;
  let hours = parseInt(hh, 10);
  const isPM = ampm.toLowerCase() === "p";
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  const date = new Date(
    parseInt(yyyy, 10),
    parseInt(mm, 10) - 1,
    parseInt(dd, 10),
    hours,
    parseInt(min, 10),
    parseInt(ss, 10)
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function isUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo ... 6 = sabado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

const TABS = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
];

function groupForChart(orders, period) {
  if (period === "today") {
    const buckets = {};
    orders.forEach((o) => {
      if (!o.parsedDate) return;
      const hour = o.parsedDate.getHours();
      buckets[hour] = (buckets[hour] || 0) + (Number(o.total) || 0);
    });
    return Object.keys(buckets)
      .map(Number)
      .sort((a, b) => a - b)
      .map((hour) => ({
        label: `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "am" : "pm"}`,
        value: buckets[hour],
      }));
  }

  if (period === "week") {
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const weekOrder = [1, 2, 3, 4, 5, 6, 0]; // lunes a domingo
    const buckets = {};
    orders.forEach((o) => {
      if (!o.parsedDate) return;
      const day = o.parsedDate.getDay();
      buckets[day] = (buckets[day] || 0) + (Number(o.total) || 0);
    });
    return weekOrder.map((day) => ({
      label: dayNames[day],
      value: buckets[day] || 0,
    }));
  }

  // month -> agrupa por semana del mes
  const buckets = {};
  orders.forEach((o) => {
    if (!o.parsedDate) return;
    const week = Math.ceil(o.parsedDate.getDate() / 7);
    buckets[week] = (buckets[week] || 0) + (Number(o.total) || 0);
  });
  return Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((week) => ({
      label: `Semana ${week}`,
      value: buckets[week],
    }));
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <div className="flex items-end gap-2" style={{ height: 180 }}>
      {data.map((d, i) => {
        const isMax = max > 0 && d.value === max;
        const barHeight = max > 0 ? Math.max((d.value / max) * 130, d.value > 0 ? 6 : 2) : 2;
        return (
          <div
            key={i}
            className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1.5"
          >
            <span className="text-[10px] text-gray-500 truncate w-full text-center">
              {d.value > 0 ? formatCurrency(d.value) : ""}
            </span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${barHeight}px`,
                backgroundColor: isMax ? "#b91c1c" : "#fca5a5",
              }}
            />
            <span className="text-[11px] text-gray-500 whitespace-nowrap">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PaymentBadge({ metodo }) {
  const m = (metodo || "").toLowerCase();
  let style = "bg-gray-100 text-gray-500";
  if (m.includes("transfer")) style = "bg-green-100 text-green-700";
  else if (m.includes("paypal")) style = "bg-blue-100 text-blue-700";
  else if (m.includes("efectivo")) style = "bg-yellow-100 text-yellow-700";

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {metodo || "Sin especificar"}
    </span>
  );
}

export default function OrdersDashboard({ orders, error }) {
  const [period, setPeriod] = useState("today");
  const [search, setSearch] = useState("");

  const withDates = useMemo(
    () => orders.map((o) => ({ ...o, parsedDate: parseFecha(o.fecha) })),
    [orders]
  );

  const now = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(now), [now]);

  const periodOrders = useMemo(() => {
    return withDates.filter((o) => {
      if (!o.parsedDate) return false;
      if (period === "today") return isSameDay(o.parsedDate, now);
      if (period === "week") return o.parsedDate >= weekStart && o.parsedDate <= now;
      return (
        o.parsedDate.getFullYear() === now.getFullYear() &&
        o.parsedDate.getMonth() === now.getMonth()
      );
    });
  }, [withDates, period, now, weekStart]);

  const filtered = periodOrders.filter((order) =>
    `${order.nombre} ${order.telefono}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalVentas = periodOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const numPedidos = periodOrders.length;
  const promedio = numPedidos > 0 ? totalVentas / numPedidos : 0;

  const metodoMasUsado = useMemo(() => {
    const counts = {};
    periodOrders.forEach((o) => {
      const m = o.metodoPago || "Sin especificar";
      counts[m] = (counts[m] || 0) + 1;
    });
    let best = null;
    let bestCount = 0;
    Object.entries(counts).forEach(([m, c]) => {
      if (c > bestCount) {
        best = m;
        bestCount = c;
      }
    });
    return best;
  }, [periodOrders]);

  const chartData = useMemo(() => groupForChart(periodOrders, period), [periodOrders, period]);

  const chartUnit =
    period === "today" ? "hora" : period === "week" ? "día" : "semana";

  return (
    <div>
      <header style={{ backgroundColor: "#7f1d1d" }} className="px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              {siteConfig.name || "Los Chilaquiles del Meny"}
            </h1>
            <p className="text-sm text-red-100">Panel de administración</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-red-100 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Pestañas de periodo */}
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                period === tab.id
                  ? "text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
              style={period === tab.id ? { backgroundColor: "#7f1d1d" } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <p className="font-semibold text-amber-900 mb-1">
              No se pudieron cargar los pedidos
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
                <p className="text-sm text-gray-500 mb-1">Total en ventas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(totalVentas)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-sm text-gray-500 mb-1">Número de pedidos</p>
                <p className="text-3xl font-bold text-gray-900">{numPedidos}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Promedio por pedido: {formatCurrency(promedio)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-sm text-gray-500 mb-1">Método de pago más usado</p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {metodoMasUsado || "—"}
                </p>
              </div>
            </div>

            {/* Grafica de barras */}
            {periodOrders.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-4">
                  Ventas por {chartUnit}
                </p>
                <BarChart data={chartData} />
              </div>
            )}

            {/* Buscador */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre o telefono..."
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
            {periodOrders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">
                  No hay pedidos en este periodo
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Cuando alguien haga un pedido aqui aparecera.
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
                          Cliente
                        </th>
                        <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                          Pedido
                        </th>
                        <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                          Total
                        </th>
                        <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                          Pago
                        </th>
                        <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                          Ubicación
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((order, i) => {
                        const pedido = [order.base, order.proteinas, order.toppings]
                          .filter(Boolean)
                          .join(" + ");
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                              {order.fecha}
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">{order.nombre}</p>
                              <p className="text-xs text-gray-500">
                                {order.telefono || "—"}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-gray-600">
                              <span className="block max-w-xs truncate" title={pedido}>
                                {pedido || <span className="text-gray-300">—</span>}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="px-5 py-4">
                              <PaymentBadge metodo={order.metodoPago} />
                            </td>
                            <td className="px-5 py-4">
                              {isUrl(order.ubicacion) ? (
                                <a
                                  href={order.ubicacion}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-700 hover:underline whitespace-nowrap"
                                >
                                  Ver mapa ↗
                                </a>
                              ) : (
                                <span className="text-gray-400">Sin ubicación</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
      </main>
    </div>
  );
}
