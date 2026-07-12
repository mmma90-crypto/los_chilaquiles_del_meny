"use client";

import { useEffect, useMemo, useState } from "react";
import Accordion from "./Accordion";

const UNIDADES = ["kg", "litro", "pieza", "paquete"];
const CATEGORIAS_PRODUCTO = ["Insumo", "Proteina", "Empaque", "Operativo"];
const NUEVO_PRODUCTO_VALUE = "__nuevo__";
const FINANCIADO_POR_OPCIONES = ["Yo", "Papás Vanessa"];
const METODOS_PAGO_COMPRA = ["Efectivo", "Tarjeta de credito"];
const TARJETAS_COMPRA = ["BBVA", "HSBC", "Banregio", "Hey", "Santander", "Otro"];
const PERIODOS_INSUMOS = [
  { id: "mes", label: "Este mes" },
  { id: "trimestre", label: "Últimos 3 meses" },
  { id: "historico", label: "Todo el histórico" },
];

function toISODate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayInputValue() {
  return toISODate(new Date());
}

// Convierte el periodo elegido (mes / trimestre / historico) en un rango
// [desde, hasta] en formato "YYYY-MM-DD" que entiende /api/purchases.
function getRangoPeriodoInsumos(periodo) {
  const hoy = new Date();
  if (periodo === "historico") return { desde: null, hasta: null };
  const hasta = toISODate(hoy);
  if (periodo === "mes") {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: toISODate(desde), hasta };
  }
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
  return { desde: toISODate(desde), hasta };
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
  unidad: "",
  pagado: false,
  financiadoPor: FINANCIADO_POR_OPCIONES[0],
  reembolsado: false,
  metodoPagoCompra: METODOS_PAGO_COMPRA[0],
  tarjeta: TARJETAS_COMPRA[0],
};

const initialNewProductForm = {
  nombre: "",
  unidad: UNIDADES[0],
  categoria: CATEGORIAS_PRODUCTO[0],
};

const initialDeudasValue = { yo: 0, yoPorTarjeta: {}, papasVanessa: 0 };

export default function PurchasesSection({ initialPurchases, initialDeudas, error }) {
  const [purchases, setPurchases] = useState(initialPurchases || []);
  const [deudas, setDeudas] = useState(initialDeudas || initialDeudasValue);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [search, setSearch] = useState("");
  const [reembolsandoRow, setReembolsandoRow] = useState(null);
  // Registrar compras es el uso principal de esta pestaña.
  const [openSections, setOpenSections] = useState({
    registrar: true,
    disponibilidad: false,
    resumen: false,
    deudas: false,
    insumos: false,
    historial: false,
  });

  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const [productos, setProductos] = useState([]);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState(initialNewProductForm);
  const [newProductSubmitting, setNewProductSubmitting] = useState(false);
  const [newProductError, setNewProductError] = useState(null);

  const [periodoInsumos, setPeriodoInsumos] = useState("mes");
  const [topInsumos, setTopInsumos] = useState([]);
  const [loadingTopInsumos, setLoadingTopInsumos] = useState(false);

  const [ayudaSemanal, setAyudaSemanal] = useState([]);
  const [ayudaPendiente, setAyudaPendiente] = useState(0);
  const [marcandoAyudaRow, setMarcandoAyudaRow] = useState(null);

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

  async function refreshAyuda() {
    try {
      const res = await fetch("/api/ayuda");
      if (!res.ok) return;
      const data = await res.json();
      setAyudaSemanal(data.ayudaSemanal || []);
      setAyudaPendiente(data.pendiente || 0);
    } catch {
      // Si falla, la seccion de ayuda semanal sigue mostrando el estado anterior.
    }
  }

  useEffect(() => {
    refreshAyuda();
  }, []);

  async function handleMarcarAyudaPagada(rowNumber) {
    setMarcandoAyudaRow(rowNumber);
    try {
      const res = await fetch("/api/ayuda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber, pagado: true }),
      });
      if (!res.ok) return;
      await refreshAyuda();
    } catch {
      // Si falla, la fila sigue mostrando pendiente y se puede reintentar.
    } finally {
      setMarcandoAyudaRow(null);
    }
  }

  const ayudaPendienteRows = ayudaSemanal.filter((a) => !a.pagado);
  const totalPapasVanessa = (deudas.papasVanessa || 0) + ayudaPendiente;

  useEffect(() => {
    async function loadProductos() {
      try {
        const res = await fetch("/api/productos");
        if (!res.ok) return;
        const data = await res.json();
        setProductos(data.productos || []);
      } catch {
        // Si falla la carga inicial, el select solo mostrara "+ Agregar producto nuevo".
      }
    }
    loadProductos();
  }, []);

  useEffect(() => {
    async function loadTopInsumos() {
      setLoadingTopInsumos(true);
      try {
        const { desde, hasta } = getRangoPeriodoInsumos(periodoInsumos);
        const params = new URLSearchParams();
        if (desde) params.set("desde", desde);
        if (hasta) params.set("hasta", hasta);
        const qs = params.toString();
        const res = await fetch(`/api/purchases${qs ? `?${qs}` : ""}`);
        if (!res.ok) return;
        const data = await res.json();
        setTopInsumos(data.topInsumos || []);
      } catch {
        // Si falla, la seccion sigue mostrando el periodo anterior.
      } finally {
        setLoadingTopInsumos(false);
      }
    }
    loadTopInsumos();
  }, [periodoInsumos]);

  function handleProductoChange(e) {
    const value = e.target.value;
    if (value === NUEVO_PRODUCTO_VALUE) {
      setShowNewProductForm(true);
      setNewProductError(null);
      setForm({ ...form, producto: "", unidad: "" });
      return;
    }
    setShowNewProductForm(false);
    const producto = productos.find((p) => p.nombre === value);
    setForm({ ...form, producto: value, unidad: producto?.unidad || "" });
  }

  // No es un <form> anidado: es un botón dentro del formulario de Compras, por
  // eso se invoca desde onClick (type="button") en vez de un onSubmit propio.
  async function handleAddNewProduct() {
    setNewProductError(null);

    if (!newProductForm.nombre.trim()) {
      setNewProductError("Escribe el nombre del producto.");
      return;
    }

    setNewProductSubmitting(true);
    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProductForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewProductError(data.error || "No pudimos registrar el producto.");
        return;
      }

      const productosRes = await fetch("/api/productos");
      const productosData = await productosRes.json();
      setProductos(productosData.productos || []);

      setForm({ ...form, producto: data.producto.nombre, unidad: data.producto.unidad });
      setShowNewProductForm(false);
      setNewProductForm(initialNewProductForm);
    } catch {
      setNewProductError("No pudimos registrar el producto. Revisa tu conexion.");
    } finally {
      setNewProductSubmitting(false);
    }
  }

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
      setDeudas(data.deudas || initialDeudasValue);
    } catch {
      // Si falla el refresco, la lista local sigue mostrando el estado anterior.
    }
  }

  async function handleMarcarReembolsado(rowNumber) {
    setReembolsandoRow(rowNumber);
    try {
      const res = await fetch("/api/purchases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber, reembolsado: true }),
      });
      if (!res.ok) return;
      await refreshPurchases();
    } catch {
      // Si falla, la fila sigue mostrando "No" y se puede reintentar.
    } finally {
      setReembolsandoRow(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.producto.trim() || !form.precioUnitario || !form.cantidad) {
      setFormError("Selecciona un producto y completa precio unitario y cantidad.");
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
      <Accordion
        title="Registrar compra"
        summary="nueva compra de insumos"
        isOpen={openSections.registrar}
        onToggle={() => toggleSection("registrar")}
      >
      <form onSubmit={handleSubmit}>
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
            <select
              value={showNewProductForm ? NUEVO_PRODUCTO_VALUE : form.producto}
              onChange={handleProductoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            >
              <option value="" disabled>
                Selecciona un producto
              </option>
              {productos.map((p) => (
                <option key={p.nombre} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
              <option value={NUEVO_PRODUCTO_VALUE}>+ Agregar producto nuevo</option>
            </select>
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
            <input
              type="text"
              value={form.unidad}
              readOnly
              disabled
              placeholder="Elige un producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Financiado por
            </label>
            <select
              value={form.financiadoPor}
              onChange={(e) => setForm({ ...form, financiadoPor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            >
              {FINANCIADO_POR_OPCIONES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          {form.financiadoPor === "Yo" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ¿Cómo se pagó?
              </label>
              <select
                value={form.metodoPagoCompra}
                onChange={(e) =>
                  setForm({ ...form, metodoPagoCompra: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
              >
                {METODOS_PAGO_COMPRA.map((m) => (
                  <option key={m} value={m}>
                    {m === "Tarjeta de credito" ? "Tarjeta de crédito" : m}
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.financiadoPor === "Yo" &&
            form.metodoPagoCompra === "Tarjeta de credito" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ¿Con qué tarjeta?
                </label>
                <select
                  value={form.tarjeta}
                  onChange={(e) => setForm({ ...form, tarjeta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  {TARJETAS_COMPRA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2.5">
              <input
                type="checkbox"
                checked={form.reembolsado}
                onChange={(e) => setForm({ ...form, reembolsado: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
                style={{ accentColor: "#7f1d1d" }}
              />
              Reembolsado
            </label>
          </div>
        </div>

        {showNewProductForm && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Agregar producto nuevo al catalogo
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombre nuevo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Aguacate"
                  value={newProductForm.nombre}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Unidad
                </label>
                <select
                  value={newProductForm.unidad}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, unidad: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Categoria
                </label>
                <select
                  value={newProductForm.categoria}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, categoria: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  {CATEGORIAS_PRODUCTO.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddNewProduct}
                  disabled={newProductSubmitting}
                  className="w-full px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity"
                  style={{ backgroundColor: "#7f1d1d" }}
                >
                  {newProductSubmitting ? "Agregando..." : "Agregar y usar"}
                </button>
              </div>
            </div>
            {newProductError && (
              <p className="text-sm text-red-700 mt-3">{newProductError}</p>
            )}
          </div>
        )}

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
          <Accordion
            title="Resumen del mes"
            summary={`${formatCurrency(totalMes)} en ${numComprasMes} compra${
              numComprasMes !== 1 ? "s" : ""
            }`}
            isOpen={openSections.resumen}
            onToggle={() => toggleSection("resumen")}
          >
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Total gastado este mes</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalMes)}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Compras este mes</p>
              <p className="text-3xl font-bold text-gray-900">{numComprasMes}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Producto con mas gasto</p>
              <p className="text-xl font-bold text-gray-900 truncate">
                {productoTopMes || "—"}
              </p>
            </div>
          </div>
          </Accordion>

          {/* Tarjetas de deuda por reembolsar */}
          <Accordion
            title="Deudas por reembolsar"
            summary={
              (deudas.yo || 0) + totalPapasVanessa > 0
                ? formatCurrency((deudas.yo || 0) + totalPapasVanessa)
                : "al día ✓"
            }
            isOpen={openSections.deudas}
            onToggle={() => toggleSection("deudas")}
          >
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Le debo a mí mismo</p>
              {deudas.yo > 0 ? (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(deudas.yo)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Object.entries(deudas.yoPorTarjeta || {})
                      .filter(([, monto]) => monto > 0)
                      .map(
                        ([tarjeta, monto]) =>
                          `${tarjeta}: ${formatCurrency(monto)}`
                      )
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold text-green-700">Al día ✓</p>
              )}
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Le debo a Papás Vanessa</p>
              {totalPapasVanessa > 0 ? (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalPapasVanessa)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Insumos: {formatCurrency(deudas.papasVanessa)} | Ayuda semanal:{" "}
                    {formatCurrency(ayudaPendiente)} ({ayudaPendienteRows.length} semana
                    {ayudaPendienteRows.length !== 1 ? "s" : ""})
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold text-green-700">Al día ✓</p>
              )}
            </div>
          </div>

          {/* Ayuda semanal pendiente */}
          {ayudaPendienteRows.length > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Ayuda semanal pendiente
              </h3>
              <div className="space-y-2">
                {ayudaPendienteRows.map((a) => (
                  <div
                    key={a.rowNumber}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-gray-600">{a.fecha}</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(a.monto)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMarcarAyudaPagada(a.rowNumber)}
                      disabled={marcandoAyudaRow === a.rowNumber}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-60 transition-colors"
                    >
                      {marcandoAyudaRow === a.rowNumber ? "Marcando..." : "Marcar pagada"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </Accordion>

          {/* Insumos con mayor impacto */}
          <Accordion
            title="Insumos con mayor impacto"
            summary={
              topInsumos.length > 0 ? `top: ${topInsumos[0].producto}` : "sin datos"
            }
            isOpen={openSections.insumos}
            onToggle={() => toggleSection("insumos")}
          >
          <div>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <p className="text-xs text-gray-500">
                Que productos representan el mayor gasto del periodo.
              </p>
              <div className="inline-flex bg-gray-50 border border-gray-200 rounded-full p-1 gap-1">
                {PERIODOS_INSUMOS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriodoInsumos(p.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      periodoInsumos === p.id
                        ? "text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    style={periodoInsumos === p.id ? { backgroundColor: "#7f1d1d" } : undefined}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {topInsumos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                {loadingTopInsumos
                  ? "Cargando..."
                  : "No hay compras con precio en este periodo."}
              </p>
            ) : (
              <div className="space-y-2">
                {topInsumos.map((item, i) => (
                  <div key={item.producto} className="flex items-center gap-3">
                    <span
                      className="w-5 text-xs font-semibold text-center shrink-0"
                      style={{ color: i < 3 ? "#7f1d1d" : "#9ca3af" }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`w-40 shrink-0 truncate text-sm ${
                        i < 3 ? "font-semibold text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {item.producto}
                    </span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(item.porcentaje, 100)}%`,
                          backgroundColor: i < 3 ? "#7f1d1d" : "#d4a5a5",
                        }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-sm text-gray-600">
                      {item.porcentaje.toFixed(1)}%
                    </span>
                    <span className="w-24 shrink-0 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          </Accordion>

          {/* Historial de compras */}
          <Accordion
            title="Historial de compras"
            summary={`${purchases.length} compra${purchases.length !== 1 ? "s" : ""}`}
            isOpen={openSections.historial}
            onToggle={() => toggleSection("historial")}
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
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 text-center">
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
            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
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
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                        Financiado por
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                        Reembolsado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
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
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {p.financiadoPor || "—"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {p.reembolsado ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Sí
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarcarReembolsado(p.rowNumber)}
                              disabled={reembolsandoRow === p.rowNumber}
                              className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-60 transition-colors"
                            >
                              {reembolsandoRow === p.rowNumber ? "Marcando..." : "No"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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
    </div>
  );
}
