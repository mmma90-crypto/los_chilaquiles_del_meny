"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { logoutAction } from "./actions";
import { siteConfig } from "@/config/site";
import Accordion from "./Accordion";

// Cada cuanto se revisa si hay pedidos nuevos (Google Sheets no empuja
// cambios en vivo como una base de datos en tiempo real, asi que se simula
// con un refresco periodico mientras el panel esta abierto).
const POLL_INTERVAL_MS = 25_000;

const STATUS_LABELS = {
  pendiente: "Pendiente",
  en_camino: "En camino",
  entregado: "Entregado",
};

const STATUS_STYLES = {
  pendiente: "bg-gray-100 text-gray-600",
  en_camino: "bg-blue-100 text-blue-700",
  entregado: "bg-green-100 text-green-700",
};

// Limpia el telefono a 10 digitos; si no cuadra (numero viejo mal capturado,
// telefono vacio) no se puede armar el link de WhatsApp.
function cleanPhone10(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length === 10 ? digits : null;
}

function buildStatusWhatsAppUrl(order, kind) {
  const clean = cleanPhone10(order.telefono);
  if (!clean) return null;
  const nombre = order.nombre ? `¡Hola ${order.nombre}!` : "¡Hola!";
  const mensajes = {
    en_camino: `${nombre} 🛵 Tu pedido de Chilaquiles del Meny va en camino, llegamos en unos minutos. ¡Gracias por tu preferencia!`,
    entregado: `Gracias por tu pedido 🌶️. Esperamos que lo disfrutes. Síguenos en Instagram: instagram.com/loschilaquiles_delmeny ¡Feliz domingo! 🙌 Te esperamos el próximo domingo.`,
  };
  const texto = mensajes[kind];
  if (!texto) return null;
  return `https://wa.me/521${clean}?text=${encodeURIComponent(texto)}`;
}

// Beep corto (3 tonos) para avisar de un pedido nuevo sin depender de un
// archivo de audio. Si el navegador bloquea AudioContext (sin interaccion
// previa del usuario) simplemente no suena, sin romper nada.
function playNewOrderSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach((start) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.12);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.13);
    });
  } catch {
    // Sin soporte de audio: no pasa nada, la notificacion visual sigue.
  }
}

// Las fechas de Pedidos se guardan con Date.toLocaleString("es-MX"), ej:
// "2/7/2026, 4:33:08 a. m." — dia/mes/año, 12 horas con a. m. / p. m.
// Las de VentasManuales usan toLocaleDateString("es-MX"): solo "2/7/2026",
// sin hora; esas se interpretan a medianoche.
function parseFecha(fecha) {
  if (!fecha) return null;
  const clean = fecha.replace(/[  ]/g, " ").trim();
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

// Mismo truco que google-sheets.js para quitar acentos sin escribir
// caracteres combinantes literales en el codigo fuente.
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

// Folio corto y legible para la tarjeta del pedido; usa el numero de fila
// real de Google Sheets (el mismo rowNumber que identifica al pedido en
// todas las acciones), asi que siempre es unico y estable.
function folioPedido(order) {
  return `#${String(order.rowNumber).padStart(3, "0")}`;
}

// Desglose por platillo de un pedido (carrito con 1 o mas ordenes), zipando
// Base/Proteinas/Toppings/Precios/Notas -- todas se guardan con el mismo
// formato "|" por orden. Precios/Notas son columnas nuevas: los pedidos
// guardados antes de agregarlas quedan sin desglose por platillo (precio y
// nota en null/""), asi que la tarjeta cae al total general del pedido.
function getOrdenesDetalle(order) {
  const split = (value) => String(value || "").split("|").map((s) => s.trim());
  const bases = split(order.base);
  const proteinas = split(order.proteinas);
  const toppings = split(order.toppings);
  const precios = split(order.precios);
  const notas = split(order.notas);
  const numOrdenes = Math.max(bases.length, proteinas.length, toppings.length);
  return Array.from({ length: numOrdenes }, (_, i) => ({
    texto: [bases[i], proteinas[i], toppings[i]].filter(Boolean).join(" + "),
    base: bases[i] || "",
    proteina: proteinas[i] || "",
    topping: toppings[i] || "",
    precio: precios[i] ? Number(precios[i]) || null : null,
    nota: notas[i] || "",
  })).filter((o) => o.texto);
}

// Categoria de un texto de Base ("Chilaquiles verdes (Picoso)" -> "verdes").
// El orden de los checks importa: "combinados" tambien contiene "verde" y
// "roja" en su detalle, asi que se revisa primero.
function categoriaDeBase(baseTexto) {
  const b = normalizeName(baseTexto);
  if (!b) return null;
  if (b.includes("combinad")) return "Combinados";
  if (b.includes("verde")) return "Verdes";
  if (b.includes("roj")) return "Rojos";
  return null;
}

// Categoria de proteina de un texto ("2× Pollo, Barbacoa" -> cuenta pollo y
// barbacoa). Mismo criterio que usa PlatillosSection para el resto del panel.
function categoriasDeProteina(proteinasTexto) {
  return String(proteinasTexto || "")
    .split(",")
    .map((p) => normalizeName(p))
    .map((p) => {
      if (p.includes("pollo")) return "Pollo";
      if (p.includes("chicharron")) return "Chicharrón";
      if (p.includes("barbacoa")) return "Barbacoa";
      if (p.includes("huevo")) return "Huevo";
      return null;
    })
    .filter(Boolean);
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
  orders: initialOrders,
  error,
  manualSales = [],
  manualSalesError = null,
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [period, setPeriod] = useState("today");
  const [search, setSearch] = useState("");
  const [updatingEstado, setUpdatingEstado] = useState(null);
  const [notifStatus, setNotifStatus] = useState("default");

  // Numero de fila mas alto ya visto, para detectar pedidos nuevos al
  // refrescar. Arranca con lo que ya trajo el servidor para no disparar la
  // alerta con pedidos que ya estaban ahi al abrir el panel.
  const lastSeenRowRef = useRef(
    initialOrders.reduce((max, o) => Math.max(max, o.rowNumber || 0), 0)
  );

  useEffect(() => {
    if (typeof Notification !== "undefined") setNotifStatus(Notification.permission);
  }, []);

  async function enableAlerts() {
    if (typeof Notification === "undefined") {
      alert("Tu navegador no soporta notificaciones.");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifStatus(result);
  }

  // Refresca la lista de pedidos desde Google Sheets cada POLL_INTERVAL_MS.
  // Sheets no tiene tiempo real como Firestore, asi que esto simula la misma
  // experiencia (avisar cuando entra un pedido nuevo) con un refresco
  // periodico en vez de un listener.
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const nuevos = data.orders || [];
        const maxRow = nuevos.reduce((max, o) => Math.max(max, o.rowNumber || 0), 0);
        if (maxRow > lastSeenRowRef.current) {
          const pedidosNuevos = nuevos.filter((o) => o.rowNumber > lastSeenRowRef.current);
          playNewOrderSound();
          if (Notification?.permission === "granted") {
            pedidosNuevos.forEach((p) => {
              new Notification("Nuevo pedido", {
                body: `${p.nombre || "Cliente"} · ${formatCurrency(p.total)}`,
                tag: String(p.rowNumber),
              });
            });
          }
          lastSeenRowRef.current = maxRow;
        }
        if (!cancelled) setOrders(nuevos);
      } catch {
        // Sin conexion momentanea: se reintenta en el siguiente ciclo.
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Cambia el estado del pedido (pendiente/en camino/entregado). Actualiza
  // primero en pantalla y revierte si Sheets rechaza el cambio. Si el pedido
  // trae telefono valido, abre WhatsApp con el mensaje de aviso al cliente.
  async function handleUpdateEstado(order, nuevoEstado) {
    const anterior = order.estado;
    setUpdatingEstado(order.rowNumber);
    setOrders((prev) =>
      prev.map((o) => (o.rowNumber === order.rowNumber ? { ...o, estado: nuevoEstado } : o))
    );
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: order.rowNumber, estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error();

      const url = buildStatusWhatsAppUrl(order, nuevoEstado);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o.rowNumber === order.rowNumber ? { ...o, estado: anterior } : o))
      );
      alert("No pudimos actualizar el estado del pedido. Intenta de nuevo.");
    } finally {
      setUpdatingEstado(null);
    }
  }

  // Elimina un pedido. Accion irreversible: se confirma antes con el usuario.
  // Actualizacion optimista igual que el resto de las acciones de esta lista.
  const [deletingRow, setDeletingRow] = useState(null);
  async function handleDeleteOrder(order) {
    const ok = window.confirm(
      `¿Eliminar el pedido ${folioPedido(order)} de ${order.nombre || "este cliente"}? Esta accion no se puede deshacer.`
    );
    if (!ok) return;
    setDeletingRow(order.rowNumber);
    const prevOrders = orders;
    setOrders((prev) => prev.filter((o) => o.rowNumber !== order.rowNumber));
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: order.rowNumber }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders(prevOrders);
      alert("No pudimos eliminar el pedido. Intenta de nuevo.");
    } finally {
      setDeletingRow(null);
    }
  }
  // La lista de pedidos es lo que mas se consulta en esta pestaña.
  const [openSections, setOpenSections] = useState({
    disponibilidad: false,
    pedidos: true,
    resumen: false,
    grafica: false,
  });

  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Disponibilidad de proteinas (pestaña "Disponibilidad" de Google Sheets):
  // controla que proteinas se ofrecen en el formulario de pedido del sitio.
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [togglingProteina, setTogglingProteina] = useState(null);

  useEffect(() => {
    async function loadDisponibilidad() {
      try {
        const res = await fetch("/api/disponibilidad");
        if (!res.ok) return;
        const data = await res.json();
        setDisponibilidad(data.proteinas || []);
      } catch {
        // Si falla, la seccion muestra el aviso de "sin datos".
      }
    }
    loadDisponibilidad();
  }, []);

  async function handleToggleDisponibilidad(proteina) {
    const nuevoActivo = !proteina.activo;
    setTogglingProteina(proteina.id);
    // Actualizacion optimista: el switch responde al instante y se revierte
    // si Google Sheets no acepta el cambio.
    setDisponibilidad((prev) =>
      prev.map((p) => (p.id === proteina.id ? { ...p, activo: nuevoActivo } : p))
    );
    try {
      const res = await fetch("/api/disponibilidad", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proteina: proteina.label, activo: nuevoActivo }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.proteinas) setDisponibilidad(data.proteinas);
    } catch {
      setDisponibilidad((prev) =>
        prev.map((p) =>
          p.id === proteina.id ? { ...p, activo: proteina.activo } : p
        )
      );
    } finally {
      setTogglingProteina(null);
    }
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

  // Top 5 productos (por tipo de base) y extra/proteina mas pedida del
  // periodo, para las tarjetas de resumen estilo "dashboard" arriba de la
  // lista. Solo cuenta pedidos de la pagina (los mismos que arma el carrito
  // con Base/Proteinas), igual que la lista de tarjetas de abajo.
  const topProductos = useMemo(() => {
    const totals = {};
    periodOrders.forEach((o) => {
      getOrdenesDetalle(o).forEach(({ base }) => {
        const cat = categoriaDeBase(base);
        if (!cat) return;
        const label = `Chilaquiles ${cat}`;
        totals[label] = (totals[label] || 0) + 1;
      });
    });
    return Object.entries(totals)
      .map(([producto, total]) => ({ producto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [periodOrders]);

  const extraMasPedido = useMemo(() => {
    const counts = {};
    periodOrders.forEach((o) => {
      getOrdenesDetalle(o).forEach(({ proteina }) => {
        categoriasDeProteina(proteina).forEach((cat) => {
          counts[cat] = (counts[cat] || 0) + 1;
        });
      });
    });
    let best = null;
    let bestCount = 0;
    Object.entries(counts).forEach(([cat, c]) => {
      if (c > bestCount) {
        best = cat;
        bestCount = c;
      }
    });
    return best ? { label: best, count: bestCount } : null;
  }, [periodOrders]);

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

            {/* Tarjetas de resumen siempre visibles (no accordion), estilo
                dashboard: lo primero que se ve al abrir la pestaña. */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Total órdenes
                </p>
                <p className="text-3xl font-bold text-gray-900">{numPedidos}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Ingresos totales
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(totalPagina)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Promedio por orden
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(promedio)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Extra más pedido
                </p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {extraMasPedido ? `${extraMasPedido.label} · ${extraMasPedido.count}` : "—"}
                </p>
              </div>
            </div>

            {/* Top 5 productos (por tipo de base) */}
            {topProductos.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Top 5 productos
                </h3>
                <div className="space-y-3">
                  {topProductos.map((p) => {
                    const max = topProductos[0].total;
                    const pct = max > 0 ? (p.total / max) * 100 : 0;
                    return (
                      <div key={p.producto}>
                        <p className="text-sm text-gray-600 mb-1">{p.producto}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: "#7f1d1d" }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right text-sm font-medium text-gray-900">
                            {p.total}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de pedidos: lo primero que se ve, es lo que mas se consulta
                y de donde salen las estadisticas de abajo. */}
            <Accordion
              title="Lista de pedidos"
              summary={`${numPedidos} pedido${numPedidos !== 1 ? "s" : ""}`}
              isOpen={openSections.pedidos}
              onToggle={() => toggleSection("pedidos")}
            >
            {/* Buscador + alertas de pedido nuevo */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
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

              {notifStatus === "granted" ? (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                  🔔 Alertas activas
                </span>
              ) : notifStatus === "denied" ? (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  🔕 Alertas bloqueadas por el navegador
                </span>
              ) : (
                <button
                  type="button"
                  onClick={enableAlerts}
                  className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  🔔 Activar alertas de pedido nuevo
                </button>
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
              <div className="space-y-4">
                {filtered.map((order) => {
                  const detalle = getOrdenesDetalle(order);
                  return (
                    <div
                      key={order.rowNumber}
                      className="bg-white border border-gray-200 rounded-2xl p-5"
                    >
                      {/* Encabezado: folio, estado, total */}
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-gray-900">{folioPedido(order)}</span>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase whitespace-nowrap ${
                              STATUS_STYLES[order.estado] || STATUS_STYLES.pendiente
                            }`}
                          >
                            {STATUS_LABELS[order.estado] || order.estado}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(order.total)}
                        </span>
                      </div>

                      {/* Desglose por platillo */}
                      {detalle.length === 0 ? (
                        <p className="text-sm text-gray-400 mb-4">Sin detalle de platillos.</p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {detalle.map((o, j) => (
                            <div
                              key={j}
                              className="border-l-2 pl-3"
                              style={{ borderColor: "#7f1d1d" }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-gray-900">
                                  Orden {j + 1}
                                </p>
                                {o.precio !== null && (
                                  <span className="text-sm text-gray-600 whitespace-nowrap">
                                    {formatCurrency(o.precio)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {o.base && <><span className="font-medium">Base:</span> {o.base} </>}
                                {o.proteina && <><span className="font-medium">· Proteína:</span> {o.proteina} </>}
                                {o.topping && <><span className="font-medium">· Toppings:</span> {o.topping}</>}
                              </p>
                              {o.nota && (
                                <p className="text-xs text-gray-500 italic mt-0.5">✎ {o.nota}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Datos de entrega */}
                      <div className="border-t border-gray-100 pt-3 mb-4 text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium text-gray-900">{order.nombre || "Cliente"}</span>
                        </p>
                        <p>📍 {order.direccion || "Sin dirección"}</p>
                        <p>📱 {order.telefono || "—"}</p>
                        <p className="flex items-center gap-1">
                          💳 <PaymentBadge metodo={order.metodoPago} />
                        </p>
                        {isUrl(order.ubicacion) && (
                          <p>
                            🗺️{" "}
                            <a
                              href={order.ubicacion}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-700 hover:underline"
                            >
                              Ver en mapa ↗
                            </a>
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-1.5 flex-wrap">
                        {order.estado !== "en_camino" && (
                          <button
                            type="button"
                            disabled={updatingEstado === order.rowNumber}
                            onClick={() => handleUpdateEstado(order, "en_camino")}
                            title={
                              cleanPhone10(order.telefono)
                                ? "Marca en camino y abre WhatsApp para avisar al cliente"
                                : "Marca en camino (sin telefono valido para WhatsApp)"
                            }
                            className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                          >
                            🛵 En camino + WhatsApp
                          </button>
                        )}
                        {order.estado !== "entregado" && (
                          <button
                            type="button"
                            disabled={updatingEstado === order.rowNumber}
                            onClick={() => handleUpdateEstado(order, "entregado")}
                            className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                          >
                            ✓ Entregado
                          </button>
                        )}
                        {order.estado !== "pendiente" && (
                          <button
                            type="button"
                            disabled={updatingEstado === order.rowNumber}
                            onClick={() => handleUpdateEstado(order, "pendiente")}
                            className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                          >
                            ↩ Pendiente
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deletingRow === order.rowNumber}
                          onClick={() => handleDeleteOrder(order)}
                          className="text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                        >
                          🗑 Eliminar
                        </button>
                      </div>

                      <p className="text-xs text-gray-400 mt-3">{order.fecha}</p>
                    </div>
                  );
                })}

                {filtered.length === 0 && search && (
                  <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
                    Sin resultados para &ldquo;{search}&rdquo;.
                  </p>
                )}
              </div>
            )}
            </Accordion>

            {/* Disponibilidad de proteinas del menu del sitio */}
            <Accordion
              title="Disponibilidad de proteínas"
              summary={
                disponibilidad.length > 0
                  ? disponibilidad.every((p) => p.activo)
                    ? "todas disponibles ✓"
                    : `agotadas: ${disponibilidad
                        .filter((p) => !p.activo)
                        .map((p) => p.label)
                        .join(", ")}`
                  : "cargando..."
              }
              isOpen={openSections.disponibilidad}
              onToggle={() => toggleSection("disponibilidad")}
            >
              <p className="text-sm text-gray-500 mb-4">
                Apaga una proteína cuando se agote: en el formulario de pedido del
                sitio aparecerá como &ldquo;Agotado&rdquo; y no se podrá elegir.
              </p>
              {disponibilidad.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No pudimos cargar la disponibilidad. Recarga la página para
                  reintentar.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {disponibilidad.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.label}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            p.activo ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {p.activo ? "Disponible" : "Agotado"}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.activo}
                        aria-label={`${p.activo ? "Desactivar" : "Activar"} ${p.label}`}
                        disabled={togglingProteina === p.id}
                        onClick={() => handleToggleDisponibilidad(p)}
                        className="relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-60"
                        style={{ backgroundColor: p.activo ? "#7f1d1d" : "#d1d5db" }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                          style={{
                            transform: p.activo ? "translateX(20px)" : "translateX(0)",
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Accordion>

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
          </>
        )}
      </main>
    </div>
  );
}
