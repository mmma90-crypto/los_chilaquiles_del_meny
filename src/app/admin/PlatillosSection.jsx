"use client";

import { useEffect, useMemo, useState } from "react";

// Colores por fuente de venta, los mismos que usa la pestaña Pedidos:
// pedidos de la pagina en rojo, ventas manuales en ambar.
const COLOR_PAGINA = "#7f1d1d";
const COLOR_MANUAL = "#f59e0b";

const CATEGORIAS = [
  { key: "pollo", label: "Pollo" },
  { key: "chicharron", label: "Chicharron" },
  { key: "huevo", label: "Huevo" },
  { key: "barbacoa", label: "Barbacoa" },
  { key: "sencillo", label: "Sencillo" },
  { key: "extraHuevo", label: "Extra huevo" },
  { key: "extraSalsa", label: "Extra salsa" },
  { key: "extraPrensado", label: "Extra prensado" },
  { key: "extraPollo", label: "Extra pollo" },
  { key: "extraBarbacoa", label: "Extra barbacoa" },
];

const TABS = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "all", label: "Histórico" },
];

// Mismo truco que google-sheets.js para quitar acentos sin poner caracteres
// combinantes literales en el codigo fuente.
const DIACRITICS_REGEX = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g"
);

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim();
}

// Misma clasificacion que usa el servidor en getPlatillosSummary: relaciona
// un texto de proteina con su categoria ("Chicharron prensado" -> chicharron).
function categoriaDeProteina(texto) {
  const p = normalizeName(texto);
  if (!p) return null;
  if (p.includes("pollo")) return "pollo";
  if (p.includes("chicharron")) return "chicharron";
  if (p.includes("barbacoa")) return "barbacoa";
  if (p.includes("huevo")) return "huevo";
  if (p.includes("sencillo")) return "sencillo";
  return null;
}

// Fechas de Pedidos ("2/7/2026, 4:33:08 a. m.") y de VentasManuales
// ("2/7/2026", sin hora). Las que no traen hora quedan a medianoche.
function parseFecha(fecha) {
  if (!fecha) return null;
  const clean = String(fecha).replace(/\s/g, " ").trim();
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

// Suma en `totales` las piezas de un Pedido del sitio a partir de su columna
// Proteinas ("Pollo", "2× Pollo, Barbacoa", ...); las ordenes del carrito
// vienen separadas por "|" y una orden sin proteina se guarda como "Sencillo".
function contarPedido(totales, proteinasTexto) {
  const partes = String(proteinasTexto || "")
    .split(/[,|]/)
    .map((parte) => parte.trim())
    .filter(Boolean);
  if (partes.length === 0) {
    totales.sencillo += 1;
    return;
  }
  partes.forEach((parte) => {
    const categoria = categoriaDeProteina(parte);
    if (!categoria) return;
    const qtyMatch = normalizeName(parte).match(/^(\d+)\s*[x×]/);
    totales[categoria] += qtyMatch ? Number(qtyMatch[1]) || 1 : 1;
  });
}

// Suma la composicion de una venta manual (columnas Base, Proteina, Extras).
// Las filas sin composicion (montos globales tipo "Venta domingo") no
// aportan piezas.
function contarVentaManual(totales, venta) {
  const categoria = categoriaDeProteina(venta.proteina);
  if (categoria) {
    totales[categoria] += 1;
  } else if (normalizeName(venta.base)) {
    totales.sencillo += 1;
  }
  const extras = normalizeName(venta.extras);
  if (extras) {
    if (extras.includes("extra huevo")) totales.extraHuevo += 1;
    if (extras.includes("extra salsa")) totales.extraSalsa += 1;
    if (extras.includes("extra prensado")) totales.extraPrensado += 1;
    if (extras.includes("extra pollo")) totales.extraPollo += 1;
    if (extras.includes("extra barbacoa")) totales.extraBarbacoa += 1;
  }
}

function emptyTotales() {
  const t = {};
  CATEGORIAS.forEach(({ key }) => {
    t[key] = 0;
  });
  return t;
}

const PERIODO_LABELS = {
  today: "hoy",
  week: "esta semana",
  month: "este mes",
};

export default function PlatillosSection({
  initialPlatillos,
  error,
  orders = [],
  manualSales = [],
}) {
  const [platillos, setPlatillos] = useState(initialPlatillos || []);
  const [loadError, setLoadError] = useState(null);
  const [periodo, setPeriodo] = useState("today");

  useEffect(() => {
    if (initialPlatillos && initialPlatillos.length > 0) return;
    async function load() {
      try {
        const res = await fetch("/api/platillos");
        if (!res.ok) return;
        const data = await res.json();
        setPlatillos(data.platillos || []);
      } catch {
        setLoadError("No pudimos cargar los platillos mas vendidos.");
      }
    }
    load();
  }, [initialPlatillos]);

  const now = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(now), [now]);

  // Piezas vendidas por categoria en el periodo elegido, combinando Pedidos
  // de la pagina y VentasManuales, con el desglose de cada fuente.
  const periodoRows = useMemo(() => {
    function inPeriod(parsedDate) {
      if (!parsedDate) return false;
      if (periodo === "today") return isSameDay(parsedDate, now);
      if (periodo === "week") return parsedDate >= weekStart && parsedDate <= now;
      return (
        parsedDate.getFullYear() === now.getFullYear() &&
        parsedDate.getMonth() === now.getMonth()
      );
    }

    const dePagina = emptyTotales();
    orders.forEach((o) => {
      if (!inPeriod(parseFecha(o.fecha))) return;
      contarPedido(dePagina, o.proteinas);
    });

    const deManual = emptyTotales();
    manualSales.forEach((v) => {
      if (!inPeriod(parseFecha(v.fecha))) return;
      contarVentaManual(deManual, v);
    });

    const rows = CATEGORIAS.map(({ key, label }) => ({
      key,
      categoria: label,
      pagina: dePagina[key],
      manual: deManual[key],
      total: dePagina[key] + deManual[key],
    }));
    const totalGeneral = rows.reduce((sum, r) => sum + r.total, 0);
    return rows
      .map((r) => ({
        ...r,
        porcentaje: totalGeneral > 0 ? (r.total / totalGeneral) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [orders, manualSales, periodo, now, weekStart]);

  const esHistorico = periodo === "all";
  const topHistorico = platillos[0];
  const topPeriodo = periodoRows[0];
  const sinDatosPeriodo = periodoRows.every((r) => r.total === 0);

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Platillos más vendidos
        </h3>
        <div className="inline-flex bg-white border border-gray-200 rounded-full p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriodo(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                periodo === tab.id ? "text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
              style={periodo === tab.id ? { backgroundColor: "#7f1d1d" } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error || loadError ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm text-amber-700">
            No pudimos cargar los platillos más vendidos.
          </p>
        </div>
      ) : esHistorico ? (
        // Vista historica: totales de todas las fuentes (VentasPorPlatillo +
        // Pedidos + VentasManuales) calculados por el servidor.
        <>
          {topHistorico && topHistorico.total > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <p className="text-sm text-gray-500 mb-1">Más vendido históricamente</p>
              <p className="text-2xl font-bold text-gray-900">{topHistorico.categoria}</p>
              <p className="text-sm font-medium mt-1" style={{ color: "#7f1d1d" }}>
                {topHistorico.porcentaje.toFixed(1)}% de las piezas vendidas
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2">
            {platillos.map((p, i) => (
              <div key={p.categoria} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-gray-700">
                  {p.categoria}
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(p.porcentaje, 100)}%`,
                      backgroundColor: i === 0 ? "#7f1d1d" : "#d4a5a5",
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-sm text-gray-600">
                  {p.porcentaje.toFixed(1)}%
                </span>
              </div>
            ))}
            {platillos.every((p) => p.total === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">
                Aún no hay ventas registradas en &ldquo;VentasPorPlatillo&rdquo;.
              </p>
            )}
          </div>
        </>
      ) : (
        // Vista por periodo: Pedidos de la pagina + VentasManuales, con el
        // desglose de cada fuente en la misma barra.
        <>
          {topPeriodo && topPeriodo.total > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <p className="text-sm text-gray-500 mb-1">
                Más vendido {PERIODO_LABELS[periodo]}
              </p>
              <p className="text-2xl font-bold text-gray-900">{topPeriodo.categoria}</p>
              <p className="text-sm font-medium mt-1" style={{ color: "#7f1d1d" }}>
                {topPeriodo.total} pieza{topPeriodo.total !== 1 ? "s" : ""} ·{" "}
                {topPeriodo.porcentaje.toFixed(1)}% de lo vendido
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {topPeriodo.pagina} de la página · {topPeriodo.manual} manual
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
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
            <div className="space-y-2">
              {periodoRows.map((r) => (
                <div key={r.key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-gray-700">
                    {r.categoria}
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min((r.pagina / Math.max(r.total, 1)) * r.porcentaje, 100)}%`,
                        backgroundColor: COLOR_PAGINA,
                      }}
                      title={`Página: ${r.pagina}`}
                    />
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min((r.manual / Math.max(r.total, 1)) * r.porcentaje, 100)}%`,
                        backgroundColor: COLOR_MANUAL,
                      }}
                      title={`Manual: ${r.manual}`}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-sm text-gray-600 whitespace-nowrap">
                    {r.total} pza{r.total !== 1 ? "s" : ""} · {r.porcentaje.toFixed(0)}%
                  </span>
                </div>
              ))}
              {sinDatosPeriodo && (
                <p className="text-sm text-gray-400 text-center py-6">
                  No hay ventas registradas {PERIODO_LABELS[periodo]}.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
