"use client";

import { useMemo, useState } from "react";
import { logoutAction } from "./actions";
import { siteConfig } from "@/config/site";
import Accordion from "./Accordion";

// Las fechas de Pedidos se guardan con Date.toLocaleString("es-MX"), ej:
// "2/7/2026, 4:33:08 a. m." — dia/mes/año, 12 horas con a. m. / p. m.
// Las de VentasManuales usan toLocaleDateString("es-MX"): solo "2/7/2026",
// sin hora; esas se interpretan a medianoche.
function parseFecha(fecha) {
  if (!fecha) return null;
  const clean = fecha.replace(/[  ]/g, " ").trim();
  const match = clean.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2}):(\d{2})\s*([ap])\.?\s*\.?m\.?)?/i
  );
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min, ss, ampm] = match;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (hh !== undefined) {
    hours = parseInt(hh, 10);
    const isPM = (ampm || "").toLowerCase() === "p";
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    minutes = parseInt(min, 10);
    seconds = parseInt(ss, 10);
  }
  const date = new Date(
    parseInt(yyyy, 10),
    parseInt(mm, 10) - 1,
    parseInt(dd, 10),
    hours,
    minutes,
    seconds
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

// Un pedido del sitio puede traer varias ordenes (carrito) en una sola fila:
// Base, Proteinas y Toppings concatenan cada orden con " | ". Aqui se separan
// para mostrar cada orden en su propia linea. Los pedidos viejos (sin "|")
// devuelven una sola linea, igual que antes.
function splitPedidoOrdenes(order) {
  const bases = String(order.base || "").split("|").map((s) => s.trim());
  const proteinas = String(order.proteinas || "").split("|").map((s) => s.trim());
  const toppings = String(order.toppings || "").split("|").map((s) => s.trim());
  const numOrdenes = Math.max(bases.length, proteinas.length, toppings.length);
  return Array.from({ length: numOrdenes }, (_, i) =>
    [bases[i], proteinas[i], toppings[i]].filter(Boolean).join(" + ")
  ).filter(Boolean);
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

// Colores de las dos fuentes de venta en toda la pestaña: pedidos de la
// pagina en rojo y ventas manuales (directo por WhatsApp) en ambar.
const COLOR_PAGINA = "#b91c1c";
const COLOR_MANUAL = "#f59e0b";

// Agrupa pedidos de la pagina y ventas manuales en las barras del periodo.
// Cada barra trae { label, pagina, manual }. Las ventas manuales no guardan
// hora, asi que en la vista "Hoy" se muestran como una barra propia al final.
function groupForChart(orders, manualSales, period) {
  if (period === "today") {
    const buckets = {};
    orders.forEach((o) => {
      if (!o.parsedDate) return;
      const hour = o.parsedDate.getHours();
      buckets[hour] = (buckets[hour] || 0) + (Number(o.total) || 0);
    });
    const data = Object.keys(buckets)
      .map(Number)
      .sort((a, b) => a - b)
      .map((hour) => ({
        label: `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "am" : "pm"}`,
        pagina: buckets[hour],
        manual: 0,
      }));
    const manualTotal = manualSales.reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
    if (manualTotal > 0) {
      data.push({ label: "Manual", pagina: 0, manual: manualTotal });
    }
    return data;
  }

  if (period === "week") {
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const weekOrder = [1, 2, 3, 4, 5, 6, 0]; // lunes a domingo
    const pagina = {};
    const manual = {};
    orders.forEach((o) => {
      if (!o.parsedDate) return;
      const day = o.parsedDate.getDay();
      pagina[day] = (pagina[day] || 0) + (Number(o.total) || 0);
    });
    manualSales.forEach((v) => {
      if (!v.parsedDate) return;
      const day = v.parsedDate.getDay();
      manual[day] = (manual[day] || 0) + (Number(v.monto) || 0);
    });
    return weekOrder.map((day) => ({
      label: dayNames[day],
      pagina: pagina[day] || 0,
      manual: manual[day] || 0,
    }));
  }

  // month -> agrupa por semana del mes
  const pagina = {};
  const manual = {};
  orders.forEach((o) => {
    if (!o.parsedDate) return;
    const week = Math.ceil(o.parsedDate.getDate() / 7);
    pagina[week] = (pagina[week] || 0) + (Number(o.total) || 0);
  });
  manualSales.forEach((v) => {
    if (!v.parsedDate) return;
    const week = Math.ceil(v.parsedDate.getDate() / 7);
    manual[week] = (manual[week] || 0) + (Number(v.monto) || 0);
  });
  return Array.from(
    new Set([...Object.keys(pagina), ...Object.keys(manual)].map(Number))
  )
    .sort((a, b) => a - b)
    .map((week) => ({
      label: `Semana ${week}`,
      pagina: pagina[week] || 0,
      manual: manual[week] || 0,
    }));
}

function ChartLegend() {
  return (
    <div className="flex items-center gap-4 mb-3">
      <span className="flex items-center gap-1.5 text-xs text-gray-600">
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: COLOR_PAGINA }} />
        Página
      </span>
      <span className="flex items-center gap-1.5 text-xs text-gray-600">
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: COLOR_MANUAL }} />
        Venta manual
      </span>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.pagina + d.manual), 0);
  return (
    <div>
      <ChartLegend />
      <div className="flex items-end gap-2" style={{ height: 180 }}>
        {data.map((d, i) => {
          const total = d.pagina + d.manual;
          const barHeight = max > 0 ? Math.max((total / max) * 130, total > 0 ? 6 : 2) : 2;
          const paginaHeight = total > 0 ? (d.pagina / total) * barHeight : 0;
          const manualHeight = total > 0 ? (d.manual / total) * barHeight : 0;
          return (
            <div
              key={i}
              className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1.5"
            >
              <span className="text-[10px] text-gray-500 truncate w-full text-center">
                {total > 0 ? formatCurrency(total) : ""}
              </span>
              <div
                className="w-full rounded-t-md overflow-hidden flex flex-col justify-end"
                style={{ height: `${Math.max(barHeight, 2)}px` }}
              >
                {manualHeight > 0 && (
                  <div
                    className="w-full"
                    style={{ height: `${manualHeight}px`, backgroundColor: COLOR_MANUAL }}
                    title={`Manual: ${formatCurrency(d.manual)}`}
                  />
                )}
                <div
                  className="w-full"
                  style={{
                    height: `${Math.max(paginaHeight, total > 0 ? 0 : 2)}px`,
                    backgroundColor: total > 0 ? COLOR_PAGINA : "#e5e7eb",
                  }}
                  title={`Página: ${formatCurrency(d.pagina)}`}
                />
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
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

export default function OrdersDashboard({
  orders,
  error,
  manualSales = [],
  manualSalesError = null,
}) {
  const [period, setPeriod] = useState("today");
  const [search, setSearch] = useState("");
  // La lista de pedidos es lo que mas se consulta en esta pestaña.
  const [openSections, setOpenSections] = useState({
    resumen: false,
    grafica: false,
    pedidos: true,
  });

  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const withDates = useMemo(
    () => orders.map((o) => ({ ...o, parsedDate: parseFecha(o.fecha) })),
    [orders]
  );

  const manualWithDates = useMemo(
    () => manualSales.map((v) => ({ ...v, parsedDate: parseFecha(v.fecha) })),
    [manualSales]
  );

  const now = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(now), [now]);

  // Las ventas manuales solo guardan fecha (sin hora): para que las de hoy no
  // queden fuera del filtro de semana/mes por ser "medianoche <= now", basta
  // comparar contra el mismo criterio de dia.
  function inPeriod(parsedDate) {
    if (!parsedDate) return false;
    if (period === "today") return isSameDay(parsedDate, now);
    if (period === "week") return parsedDate >= weekStart && parsedDate <= now;
    return (
      parsedDate.getFullYear() === now.getFullYear() &&
      parsedDate.getMonth() === now.getMonth()
    );
  }

  const periodOrders = useMemo(
    () => withDates.filter((o) => inPeriod(o.parsedDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [withDates, period, now, weekStart]
  );

  const periodManual = useMemo(
    () => manualWithDates.filter((v) => inPeriod(v.parsedDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manualWithDates, period, now, weekStart]
  );

  const filtered = periodOrders.filter((order) =>
    `${order.nombre} ${order.telefono}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPagina = periodOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalManual = periodManual.reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  const totalVentas = totalPagina + totalManual;
  const numPedidos = periodOrders.length;
  const numManuales = periodManual.length;
  const promedio = numPedidos > 0 ? totalPagina / numPedidos : 0;

  const metodoMasUsado = useMemo(() => {
    const counts = {};
    periodOrders.forEach((o) => {
      const m = o.metodoPago || "Sin especificar";
      counts[m] = (counts[m] || 0) + 1;
    });
    periodManual.forEach((v) => {
      const m = v.metodoPago || "Sin especificar";
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
  }, [periodOrders, periodManual]);

  const chartData = useMemo(
    () => groupForChart(periodOrders, periodManual, period),
    [periodOrders, periodManual, period]
  );

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
            {manualSalesError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-6">
                <p className="text-sm text-amber-700">
                  No se pudieron cargar las ventas manuales; el resumen solo
                  incluye pedidos de la página.
                </p>
              </div>
            )}

            {/* Tarjetas de resumen */}
            <Accordion
              title="Resumen de ventas"
              summary={`${formatCurrency(totalVentas)} · ${numPedidos} pedido${
                numPedidos !== 1 ? "s" : ""
              } + ${numManuales} manual${numManuales !== 1 ? "es" : ""}`}
              isOpen={openSections.resumen}
              onToggle={() => toggleSection("resumen")}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <p className="text-sm text-gray-500 mb-1">Total en ventas</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalVentas)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Página + ventas manuales
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: COLOR_PAGINA }} />
                    Ventas de la página
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalPagina)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {numPedidos} pedido{numPedidos !== 1 ? "s" : ""} · promedio{" "}
                    {formatCurrency(promedio)}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: COLOR_MANUAL }} />
                    Ventas manuales
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalManual)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {numManuales} venta{numManuales !== 1 ? "s" : ""} directo por WhatsApp
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <p className="text-sm text-gray-500 mb-1">Método de pago más usado</p>
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {metodoMasUsado || "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Incluye página y ventas manuales
                  </p>
                </div>
              </div>
            </Accordion>

            {/* Grafica de barras */}
            <Accordion
              title={`Ventas por ${chartUnit}`}
              summary={
                periodOrders.length > 0 || periodManual.length > 0
                  ? "gráfica del periodo"
                  : "sin datos"
              }
              isOpen={openSections.grafica}
              onToggle={() => toggleSection("grafica")}
            >
              {periodOrders.length > 0 || periodManual.length > 0 ? (
                <BarChart data={chartData} />
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  No hay ventas en este periodo.
                </p>
              )}
            </Accordion>

            {/* Lista de pedidos */}
            <Accordion
              title="Lista de pedidos"
              summary={`${numPedidos} pedido${numPedidos !== 1 ? "s" : ""}`}
              isOpen={openSections.pedidos}
              onToggle={() => toggleSection("pedidos")}
            >
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
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 text-center">
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
              <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
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
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {filtered.map((order, i) => {
                        const ordenes = splitPedidoOrdenes(order);
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
                              {ordenes.length === 0 ? (
                                <span className="text-gray-300">—</span>
                              ) : (
                                ordenes.map((pedido, j) => (
                                  <span
                                    key={j}
                                    className="block max-w-xs truncate"
                                    title={pedido}
                                  >
                                    {ordenes.length > 1 && (
                                      <span className="text-gray-400 text-xs mr-1">
                                        {j + 1}.
                                      </span>
                                    )}
                                    {pedido}
                                  </span>
                                ))
                              )}
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
                  <p className="text-center text-gray-400 py-8 text-sm bg-white">
                    Sin resultados para &ldquo;{search}&rdquo;.
                  </p>
                )}
              </div>
            )}
            </Accordion>
          </>
        )}
      </main>
    </div>
  );
}
