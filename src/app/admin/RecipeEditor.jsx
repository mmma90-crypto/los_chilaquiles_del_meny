"use client";

import { useEffect, useMemo, useState } from "react";
import { menuConfig } from "@/config/menu";

const BRAND = "#7f1d1d";

const CATEGORIAS = [
  { id: "salsa", label: "Salsas" },
  { id: "platillo", label: "Platillos" },
  { id: "proteina", label: "Proteínas" },
];

// Relaciona el "Nombre" de la receta de proteina (pestaña Recetas) con el id
// de proteina del menu (src/config/menu.js). Mismo criterio que CostsSection.jsx.
const PROTEIN_MENU_ID = {
  Pollo: "pollo",
  Barbacoa: "barbacoa",
  Chicharron: "chicharron",
  Huevo: "huevo",
};

function utilidadBadgeClass(pct) {
  if (pct >= 50) return "bg-green-100 text-green-700";
  if (pct >= 35) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// Precio de venta real de una combinacion salsa+proteina, segun el menu
// publico (steps.base + extra de proteina). Mismo criterio que CostsSection.jsx.
function ventaPrice(proteinaNombre) {
  const basePrice = menuConfig.steps.base.price || 0;
  if (!proteinaNombre) return basePrice;
  const proteinId = PROTEIN_MENU_ID[proteinaNombre];
  const option = menuConfig.steps.protein.options.find((p) => p.id === proteinId);
  return basePrice + (option?.price || 0);
}

// Filas especiales de la pestaña Recetas que no son insumos comprables:
// RENDIMIENTO_LITROS (litros que rinde una salsa) y SALSA_LITROS (litros de
// salsa que usa un platillo). Se editan como cualquier fila pero su costo se
// interpreta aparte, igual que en getCostAnalysis.
const MARCADOR_RENDIMIENTO = "RENDIMIENTO_LITROS";
const MARCADOR_SALSA = "SALSA_LITROS";

// Mismo criterio que normalizeName() en google-sheets.js: sin acentos,
// minusculas y espacios colapsados. El rango son los acentos combinantes
// (U+0300 a U+036F), construido con fromCharCode para mantener el archivo
// en ASCII puro.
const DIACRITICS_REGEX = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g"
);

function normalize(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function esMarcador(nombre) {
  const n = normalize(nombre);
  return n === "rendimiento_litros" || n === "salsa_litros";
}

function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export default function RecipeEditor() {
  const [recetas, setRecetas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  // Sueldo prorrateado por platillo (vista "actual"), para estimar el margen
  // de salsas/platillo. Se lee de /api/costs (misma fuente que la pestaña
  // "Recetas y costos"); si falla, el margen se muestra sin este dato en 0.
  const [sueldoPorPlatillo, setSueldoPorPlatillo] = useState(0);
  // Margen % promedio de hoy entre todas las combinaciones salsa+proteina
  // (incluyendo "sencillo"), igual que el "margen promedio" de la pestaña
  // "Costo por platillo". Se usa para estimar el precio de venta de recetas
  // sin precio propio (salsas, platillo base, variantes como "media orden").
  const [avgMargenPct, setAvgMargenPct] = useState(null);

  // Receta abierta en el editor y su borrador de ingredientes editable.
  const [selectedKey, setSelectedKey] = useState(null); // "categoria|||nombre"
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "ok"|"error", text }

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/recetas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos leer las recetas.");
      setRecetas(data.recetas || []);
      setProductos(data.productos || []);
      setPrecios(data.precios || []);
      return data;
    } catch (e) {
      setLoadError(e.message || "No pudimos leer las recetas.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    fetch("/api/costs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.actual?.sueldo?.costoPorPlatillo) {
          setSueldoPorPlatillo(data.actual.sueldo.costoPorPlatillo);
        }
        const combinaciones = data?.actual?.combinaciones || [];
        if (combinaciones.length > 0) {
          const pcts = combinaciones.map((c) => {
            const precio = ventaPrice(c.proteina);
            return precio > 0 ? ((precio - c.costo) / precio) * 100 : 0;
          });
          setAvgMargenPct(pcts.reduce((sum, p) => sum + p, 0) / pcts.length);
        }
      })
      .catch(() => {});
  }, []);

  // Precio actual por ingrediente (compra reciente o precio base).
  const precioMap = useMemo(() => {
    const map = new Map();
    precios.forEach((p) => map.set(normalize(p.nombre), p));
    return map;
  }, [precios]);

  // Unidad de cada producto del catalogo, para autocompletarla en el select.
  const unidadMap = useMemo(() => {
    const map = new Map();
    productos.forEach((p) => map.set(normalize(p.nombre), p.unidad || ""));
    return map;
  }, [productos]);

  // Costo por litro de cada salsa (con precios actuales), para estimar en
  // vivo cuanto cuesta la linea SALSA_LITROS de un platillo.
  const salsasCostoPorLitro = useMemo(() => {
    return recetas
      .filter((r) => normalize(r.categoria) === "salsa")
      .map((r) => {
        let costo = 0;
        let rendimiento = 0;
        r.ingredientes.forEach((ing) => {
          if (normalize(ing.nombre) === "rendimiento_litros") {
            rendimiento = Number(ing.cantidad) || 0;
            return;
          }
          const precio = precioMap.get(normalize(ing.nombre))?.precio || 0;
          costo += precio * (Number(ing.cantidad) || 0);
        });
        return {
          nombre: r.nombre,
          costoPorLitro: rendimiento > 0 ? costo / rendimiento : 0,
        };
      });
  }, [recetas, precioMap]);

  const avgSalsaLitro = useMemo(() => {
    const conRendimiento = salsasCostoPorLitro.filter((s) => s.costoPorLitro > 0);
    if (conRendimiento.length === 0) return 0;
    return (
      conRendimiento.reduce((sum, s) => sum + s.costoPorLitro, 0) /
      conRendimiento.length
    );
  }, [salsasCostoPorLitro]);

  const selected = useMemo(
    () =>
      recetas.find(
        (r) => `${normalize(r.categoria)}|||${normalize(r.nombre)}` === selectedKey
      ) || null,
    [recetas, selectedKey]
  );

  // Costo comun del platillo base (ingredientes que no son SALSA_LITROS ni
  // Sueldo) y cuantos litros de salsa usa, para estimar el combo "sencillo"
  // de una salsa (precio de venta = $100 base, sin proteina). Se toma de la
  // receta guardada en "recetas", salvo que sea justo la que se esta editando,
  // en cuyo caso se usa el borrador para que se actualice en vivo.
  const platilloComun = useMemo(() => {
    const receta = recetas.find((r) => normalize(r.categoria) === "platillo");
    const esRecetaAbierta =
      receta && `platillo|||${normalize(receta.nombre)}` === selectedKey;
    const filas = esRecetaAbierta ? draft : receta?.ingredientes || [];
    let costoComun = 0;
    let salsaLitros = 0;
    filas.forEach((ing) => {
      const n = normalize(ing.nombre);
      const cantidad = Number(ing.cantidad) || 0;
      if (n === "salsa_litros") {
        salsaLitros = cantidad;
        return;
      }
      if (n === "sueldo") return;
      const precio = precioMap.get(n)?.precio || 0;
      costoComun += precio * cantidad;
    });
    return { costoComun, salsaLitros };
  }, [recetas, precioMap, draft, selectedKey]);

  function openReceta(receta) {
    setSelectedKey(`${normalize(receta.categoria)}|||${normalize(receta.nombre)}`);
    setDraft(
      receta.ingredientes.map((ing) => ({
        nombre: ing.nombre,
        cantidad: ing.cantidad,
        unidad: ing.unidad,
      }))
    );
    setNotice(null);
  }

  function closeEditor() {
    setSelectedKey(null);
    setDraft([]);
    setNotice(null);
  }

  // Opciones del select de ingredientes: catalogo de Productos + ingredientes
  // ya usados en recetas (ej. Sueldo) + el marcador especial de la categoria.
  const opcionesIngrediente = useMemo(() => {
    const nombres = new Map();
    productos.forEach((p) => {
      if (p.nombre && !esMarcador(p.nombre)) nombres.set(normalize(p.nombre), p.nombre);
    });
    precios.forEach((p) => {
      if (p.nombre && !esMarcador(p.nombre) && !nombres.has(normalize(p.nombre))) {
        nombres.set(normalize(p.nombre), p.nombre);
      }
    });
    return Array.from(nombres.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [productos, precios]);

  const categoriaSeleccionada = selected ? normalize(selected.categoria) : "";
  const marcadorDisponible =
    categoriaSeleccionada === "salsa"
      ? MARCADOR_RENDIMIENTO
      : categoriaSeleccionada === "platillo"
        ? MARCADOR_SALSA
        : null;

  function updateRow(index, patch) {
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleIngredienteChange(index, nombre) {
    // Autocompleta la unidad segun el producto elegido; los marcadores de
    // litros siempre van en litros.
    const patch = { nombre };
    if (esMarcador(nombre)) {
      patch.unidad = "litro";
    } else {
      const unidad = unidadMap.get(normalize(nombre));
      if (unidad) patch.unidad = unidad;
    }
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setDraft((prev) => [...prev, { nombre: "", cantidad: 1, unidad: "" }]);
  }

  function removeRow(index) {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  // Costo en vivo de una linea. Devuelve null cuando la linea no suma al
  // costo directo: RENDIMIENTO_LITROS es un dato de rendimiento y "Sueldo"
  // se prorratea aparte en la pestaña Costos (no sale de PreciosBase).
  function costoLinea(row) {
    const n = normalize(row.nombre);
    const cantidad = Number(row.cantidad) || 0;
    if (n === "rendimiento_litros") return null;
    if (n === "salsa_litros") return cantidad * avgSalsaLitro;
    if (categoriaSeleccionada === "platillo" && n === "sueldo") return null;
    const precio = precioMap.get(n)?.precio || 0;
    return cantidad * precio;
  }

  const costoTotal = useMemo(
    () => draft.reduce((sum, row) => sum + (costoLinea(row) ?? 0), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, precioMap, avgSalsaLitro, categoriaSeleccionada]
  );

  const rendimientoDraft = draft.find(
    (row) => normalize(row.nombre) === "rendimiento_litros"
  );
  const rendimientoLitros = Number(rendimientoDraft?.cantidad) || 0;
  const usaSalsa = draft.some((row) => normalize(row.nombre) === "salsa_litros");

  // Precio de venta y margen en vivo, segun la categoria de la receta abierta:
  // - Proteina: precio real = extra configurado en menu.js (steps.protein).
  // - Salsa/Platillo: no tienen precio propio. Se estima aplicando el margen
  //   promedio de hoy entre todas las combinaciones salsa+proteina (avgMargenPct,
  //   traido de /api/costs) al costo de esta receta (esta salsa/platillo +
  //   platillo base + sueldo prorrateado). Asi, una receta de menos porcion
  //   (ej. "media orden") da un precio estimado menor, con el mismo margen %
  //   tipico del negocio, en vez de compararse siempre contra el precio de
  //   una orden completa.
  const ventaInfo = useMemo(() => {
    if (!selected) return null;
    const basePrice = menuConfig.steps.base.price || 0;

    if (categoriaSeleccionada === "proteina") {
      const proteinId = PROTEIN_MENU_ID[selected.nombre];
      const option = menuConfig.steps.protein.options.find((o) => o.id === proteinId);
      if (!option) return null;
      const precioVenta = option.price || 0;
      const margen = precioVenta - costoTotal;
      const pct = precioVenta > 0 ? (margen / precioVenta) * 100 : 0;
      return { tipo: "proteina", precioVenta, margen, pct };
    }

    let costoCombo = null;
    if (categoriaSeleccionada === "salsa") {
      const costoPorLitroSalsa = rendimientoLitros > 0 ? costoTotal / rendimientoLitros : 0;
      costoCombo =
        platilloComun.costoComun +
        platilloComun.salsaLitros * costoPorLitroSalsa +
        sueldoPorPlatillo;
    } else if (categoriaSeleccionada === "platillo") {
      // costoTotal ya incluye SALSA_LITROS * avgSalsaLitro (promedio de todas
      // las salsas); solo falta sumar el sueldo prorrateado.
      costoCombo = costoTotal + sueldoPorPlatillo;
    } else {
      return null;
    }

    const margenFrac = avgMargenPct !== null ? avgMargenPct / 100 : null;
    const estimado = margenFrac !== null && margenFrac < 1;
    // Si aun no cargo el margen promedio (o da >=100%, imposible), cae de
    // vuelta al precio base como aproximacion minima.
    const precioVenta = estimado ? costoCombo / (1 - margenFrac) : basePrice;
    const margen = precioVenta - costoCombo;
    const pct = precioVenta > 0 ? (margen / precioVenta) * 100 : 0;
    return { tipo: "combo", precioVenta, margen, pct, costoCombo, estimado };
  }, [
    selected,
    categoriaSeleccionada,
    costoTotal,
    rendimientoLitros,
    platilloComun,
    sueldoPorPlatillo,
    avgMargenPct,
  ]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/recetas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: selected.categoria,
          nombre: selected.nombre,
          ingredientes: draft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos guardar la receta.");
      setNotice({ type: "ok", text: "Receta guardada." });
      await loadData();
    } catch (e) {
      setNotice({ type: "error", text: e.message || "No pudimos guardar la receta." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate() {
    if (!selected) return;
    const nombreNuevo = window.prompt(
      `Nombre de la nueva receta (copia de "${selected.nombre}"):`
    );
    if (!nombreNuevo || !nombreNuevo.trim()) return;
    setDuplicating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: selected.categoria,
          nombreOriginal: selected.nombre,
          nombreNuevo: nombreNuevo.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos duplicar la receta.");
      // Recarga desde la hoja y abre la copia recien creada, con sus
      // ingredientes tal como quedaron guardados (la original no cambia).
      const recargado = await loadData();
      const nueva = (recargado?.recetas || []).find(
        (r) =>
          normalize(r.categoria) === normalize(data.receta.categoria) &&
          normalize(r.nombre) === normalize(data.receta.nombre)
      );
      if (nueva) openReceta(nueva);
      setNotice({
        type: "ok",
        text: `Se creó "${data.receta.nombre}". Ya la estás editando (la original no cambia).`,
      });
    } catch (e) {
      setNotice({ type: "error", text: e.message || "No pudimos duplicar la receta." });
    } finally {
      setDuplicating(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <p className="text-sm text-gray-500">Cargando recetas…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {loadError}
        </div>
        <button
          type="button"
          onClick={loadData}
          className="mt-4 px-4 py-2 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: BRAND }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Editor de recetas</h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica ingredientes y cantidades de cada receta, o duplica una para
        crear variantes, sin editar Google Sheets a mano.
      </p>

      {!selected && (
        <div className="space-y-8">
          {CATEGORIAS.map(({ id, label }) => {
            const grupo = recetas.filter((r) => normalize(r.categoria) === id);
            if (grupo.length === 0) return null;
            return (
              <div key={id}>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  {label}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grupo.map((receta) => {
                    const numIngredientes = receta.ingredientes.filter(
                      (ing) => !esMarcador(ing.nombre)
                    ).length;
                    return (
                      <button
                        key={`${receta.categoria}-${receta.nombre}`}
                        type="button"
                        onClick={() => openReceta(receta)}
                        className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-left hover:border-gray-300 hover:shadow transition-all"
                      >
                        <p className="font-semibold text-gray-900">{receta.nombre}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {numIngredientes} ingrediente{numIngredientes === 1 ? "" : "s"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <button
                type="button"
                onClick={closeEditor}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors mb-1"
              >
                ← Volver a las recetas
              </button>
              <h3 className="text-lg font-bold text-gray-900">
                {selected.nombre}
                <span className="ml-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {selected.categoria}
                </span>
              </h3>
            </div>
            <div className="flex items-start gap-6 flex-wrap justify-end">
              <div className="text-right">
                <p className="text-xs text-gray-500">Costo de esta receta</p>
                <p className="text-2xl font-bold" style={{ color: BRAND }}>
                  {formatCurrency(costoTotal)}
                </p>
                {categoriaSeleccionada === "salsa" && rendimientoLitros > 0 && (
                  <p className="text-xs text-gray-500">
                    {formatCurrency(costoTotal / rendimientoLitros)} por litro (rinde{" "}
                    {rendimientoLitros} L)
                  </p>
                )}
              </div>

              {ventaInfo?.tipo === "proteina" && (
                <>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Precio de venta (extra en el menu)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(ventaInfo.precioVenta)}
                    </p>
                    <p className="text-xs text-gray-400">Se edita en src/config/menu.js</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Margen</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(ventaInfo.margen)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${utilidadBadgeClass(
                        ventaInfo.pct
                      )}`}
                    >
                      {ventaInfo.pct.toFixed(1)}%
                    </span>
                  </div>
                </>
              )}

              {ventaInfo?.tipo === "combo" && (
                <>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Precio de venta {ventaInfo.estimado ? "(estimado)" : "(referencia)"}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(ventaInfo.precioVenta)}
                    </p>
                    <p
                      className="text-xs text-gray-400"
                      title="Costo de este combo: platillo base + esta salsa + sueldo prorrateado"
                    >
                      Combo cuesta {formatCurrency(ventaInfo.costoCombo)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Margen</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(ventaInfo.margen)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${utilidadBadgeClass(
                        ventaInfo.pct
                      )}`}
                    >
                      {ventaInfo.pct.toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {ventaInfo?.tipo === "combo" && (
            <div className="px-6 pt-3 -mb-1">
              <p className="text-xs text-gray-400">
                Esta receta no tiene precio de venta propio (no se vende sola: incluye
                platillo base + esta salsa + sueldo prorrateado).{" "}
                {ventaInfo.estimado ? (
                  <>
                    El precio de arriba es una estimacion: se le aplica a su costo el
                    margen promedio de hoy entre todas las combinaciones salsa+proteina
                    ({avgMargenPct.toFixed(1)}%), la misma referencia de &quot;Costo por
                    platillo&quot; en Recetas y costos. Por eso una receta de menos porcion
                    (ej. media orden) da un precio menor de forma automatica.
                  </>
                ) : (
                  <>
                    Aun no cargamos el margen promedio de hoy, asi que por ahora se
                    muestra el precio base ({formatCurrency(menuConfig.steps.base.price)})
                    como referencia.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="px-6 py-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="py-2 pr-3 font-medium">Ingrediente</th>
                  <th className="py-2 pr-3 font-medium w-28">Cantidad</th>
                  <th className="py-2 pr-3 font-medium w-24">Unidad</th>
                  <th className="py-2 pr-3 font-medium w-28 text-right">Costo</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {draft.map((row, index) => {
                  const marcador = esMarcador(row.nombre);
                  const costo = costoLinea(row);
                  return (
                    <tr key={index}>
                      <td className="py-2 pr-3">
                        <select
                          value={row.nombre}
                          onChange={(e) => handleIngredienteChange(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-900/20"
                        >
                          <option value="">Elige un ingrediente…</option>
                          {marcadorDisponible && (
                            <option value={marcadorDisponible}>
                              {marcadorDisponible === MARCADOR_SALSA
                                ? "SALSA_LITROS (litros de salsa por platillo)"
                                : "RENDIMIENTO_LITROS (litros que rinde)"}
                            </option>
                          )}
                          {/* Conserva un nombre que ya no este en el catalogo */}
                          {row.nombre &&
                            !esMarcador(row.nombre) &&
                            !opcionesIngrediente.some(
                              (o) => normalize(o) === normalize(row.nombre)
                            ) && <option value={row.nombre}>{row.nombre}</option>}
                          {opcionesIngrediente.map((nombre) => (
                            <option key={nombre} value={nombre}>
                              {nombre}
                            </option>
                          ))}
                        </select>
                        {normalize(row.nombre) === "salsa_litros" && (
                          <p className="text-xs text-gray-400 mt-1">
                            El costo real depende de la salsa elegida; aquí se estima
                            con el promedio de todas las salsas.
                          </p>
                        )}
                      </td>
                      <td className="py-2 pr-3 align-top">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.cantidad}
                          onChange={(e) => updateRow(index, { cantidad: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20"
                        />
                      </td>
                      <td className="py-2 pr-3 align-top">
                        <input
                          type="text"
                          value={row.unidad}
                          onChange={(e) => updateRow(index, { unidad: e.target.value })}
                          placeholder="kg, pieza…"
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20"
                        />
                      </td>
                      <td className="py-2 pr-3 align-top text-right font-medium text-gray-900 whitespace-nowrap">
                        {costo === null ? (
                          <span
                            className="text-gray-400 font-normal"
                            title={
                              marcador
                                ? "Dato de rendimiento, no suma al costo"
                                : "El sueldo se prorratea aparte en la pestaña Costos"
                            }
                          >
                            —
                          </span>
                        ) : (
                          formatCurrency(costo)
                        )}
                      </td>
                      <td className="py-2 align-top text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-gray-400 hover:text-red-700 transition-colors p-1"
                          title="Quitar ingrediente"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              type="button"
              onClick={addRow}
              className="mt-4 text-sm font-medium px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Agregar ingrediente
            </button>

            {categoriaSeleccionada === "platillo" && !usaSalsa && (
              <p className="text-xs text-amber-600 mt-3">
                Este platillo no tiene la fila SALSA_LITROS: agrégala si el
                platillo lleva salsa, para que Costos calcule el costo por salsa.
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm">
              {notice && (
                <span
                  className={
                    notice.type === "ok" ? "text-green-700" : "text-red-700"
                  }
                >
                  {notice.text}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={duplicating || saving}
                className="px-5 py-2 rounded-full text-sm font-medium border text-gray-800 border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {duplicating ? "Duplicando…" : "Duplicar como nueva receta"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || duplicating}
                className="px-5 py-2 rounded-full text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
