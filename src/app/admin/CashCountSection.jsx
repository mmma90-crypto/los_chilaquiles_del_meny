"use client";

import { useMemo, useState } from "react";

const CATEGORIAS = [
  "Sueldo",
  "Renta",
  "Gas",
  "Reembolso insumos",
  "Ayuda Papás Vanessa",
  "Personal",
  "Otro",
];
const ORIGENES = ["Efectivo", "Cuenta"];

const CATEGORIA_ESTILOS = {
  Sueldo: "bg-blue-100 text-blue-700",
  Renta: "bg-purple-100 text-purple-700",
  Gas: "bg-amber-100 text-amber-700",
  "Reembolso insumos": "bg-teal-100 text-teal-700",
  "Ayuda Papás Vanessa": "bg-orange-100 text-orange-700",
  Personal: "bg-pink-100 text-pink-700",
  Otro: "bg-gray-100 text-gray-600",
};

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

// Las fechas de Arqueos/Retiros se guardan con Date.toLocaleDateString("es-MX"),
// ej: "2/7/2026" — dia/mes/año, sin hora.
function parseFecha(fecha) {
  if (!fecha) return null;
  const match = String(fecha).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
  return Number.isNaN(date.getTime()) ? null : date;
}

function Diferencia({ esperado, contado }) {
  const diferencia = Number(contado) - Number(esperado);
  if (diferencia === 0) {
    return <span className="text-gray-500 font-medium">Cuadrado</span>;
  }
  if (diferencia < 0) {
    return (
      <span className="text-red-700 font-semibold">
        Faltante {formatCurrency(Math.abs(diferencia))}
      </span>
    );
  }
  return (
    <span className="text-green-700 font-semibold">
      Sobrante {formatCurrency(diferencia)}
    </span>
  );
}

const initialArqueoForm = {
  fecha: todayInputValue(),
  efectivoContado: "",
  cuentaContado: "",
};

const initialRetiroForm = {
  fecha: todayInputValue(),
  concepto: "",
  categoria: CATEGORIAS[0],
  monto: "",
  deDonde: ORIGENES[0],
};

export default function CashCountSection({ initialArqueos, initialRetiros, error }) {
  const [arqueos, setArqueos] = useState(initialArqueos || []);
  const [retiros, setRetiros] = useState(initialRetiros || []);

  const [arqueoForm, setArqueoForm] = useState(initialArqueoForm);
  const [arqueoSubmitting, setArqueoSubmitting] = useState(false);
  const [arqueoError, setArqueoError] = useState(null);
  const [ultimoArqueo, setUltimoArqueo] = useState(null);

  const [retiroForm, setRetiroForm] = useState(initialRetiroForm);
  const [retiroSubmitting, setRetiroSubmitting] = useState(false);
  const [retiroError, setRetiroError] = useState(null);

  async function refreshData() {
    try {
      const res = await fetch("/api/cashcount");
      if (!res.ok) return;
      const data = await res.json();
      setArqueos(data.arqueos || []);
      setRetiros(data.retiros || []);
    } catch {
      // Si falla el refresco, la lista local sigue mostrando el estado anterior.
    }
  }

  async function handleArqueoSubmit(e) {
    e.preventDefault();
    setArqueoError(null);

    if (arqueoForm.efectivoContado === "" || arqueoForm.cuentaContado === "") {
      setArqueoError("Completa efectivo contado y cuenta contado.");
      return;
    }

    setArqueoSubmitting(true);
    try {
      const res = await fetch("/api/cashcount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "arqueo", ...arqueoForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setArqueoError(data.error || "No pudimos registrar el arqueo.");
        return;
      }
      setUltimoArqueo({
        efectivoContado: Number(arqueoForm.efectivoContado) || 0,
        cuentaContado: Number(arqueoForm.cuentaContado) || 0,
        efectivoEsperado: data.esperado?.efectivoEsperado || 0,
        cuentaEsperado: data.esperado?.cuentaEsperado || 0,
      });
      await refreshData();
      setArqueoForm({ ...initialArqueoForm, fecha: todayInputValue() });
    } catch {
      setArqueoError("No pudimos registrar el arqueo. Revisa tu conexion.");
    } finally {
      setArqueoSubmitting(false);
    }
  }

  async function handleRetiroSubmit(e) {
    e.preventDefault();
    setRetiroError(null);

    if (!retiroForm.concepto.trim() || !retiroForm.monto) {
      setRetiroError("Completa concepto y monto.");
      return;
    }

    setRetiroSubmitting(true);
    try {
      const res = await fetch("/api/cashcount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "retiro", ...retiroForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetiroError(data.error || "No pudimos registrar el retiro.");
        return;
      }
      await refreshData();
      setRetiroForm({ ...initialRetiroForm, fecha: todayInputValue() });
    } catch {
      setRetiroError("No pudimos registrar el retiro. Revisa tu conexion.");
    } finally {
      setRetiroSubmitting(false);
    }
  }

  const withDates = useMemo(
    () => retiros.map((r) => ({ ...r, parsedDate: parseFecha(r.fecha) })),
    [retiros]
  );

  const now = useMemo(() => new Date(), []);

  const retirosMes = useMemo(
    () =>
      withDates.filter(
        (r) =>
          r.parsedDate &&
          r.parsedDate.getFullYear() === now.getFullYear() &&
          r.parsedDate.getMonth() === now.getMonth()
      ),
    [withDates, now]
  );

  const totalRetiradoMes = retirosMes.reduce((sum, r) => sum + (Number(r.monto) || 0), 0);

  const desglosePorCategoria = useMemo(() => {
    const totals = {};
    CATEGORIAS.forEach((c) => {
      totals[c] = 0;
    });
    retirosMes.forEach((r) => {
      const cat = CATEGORIAS.includes(r.categoria) ? r.categoria : "Otro";
      totals[cat] += Number(r.monto) || 0;
    });
    return totals;
  }, [retirosMes]);

  const arqueosOrdenDesc = [...arqueos].reverse();
  const retirosOrdenDesc = [...withDates].reverse();

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="font-semibold text-amber-900 mb-1">
            No se pudo cargar el arqueo de caja
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
      {/* ARQUEO DE CAJA */}
      <h2 className="text-xl font-bold text-gray-900 mb-1">Arqueo de caja</h2>
      <p className="text-sm text-gray-500 mb-6">
        Registra el conteo real de efectivo y cuenta, y compara contra lo esperado.
      </p>

      <form
        onSubmit={handleArqueoSubmit}
        className="bg-white border border-gray-200 rounded-2xl p-5 mb-4"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              type="date"
              value={arqueoForm.fecha}
              onChange={(e) => setArqueoForm({ ...arqueoForm, fecha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Efectivo contado
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={arqueoForm.efectivoContado}
              onChange={(e) =>
                setArqueoForm({ ...arqueoForm, efectivoContado: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cuenta contado
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={arqueoForm.cuentaContado}
              onChange={(e) =>
                setArqueoForm({ ...arqueoForm, cuentaContado: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={arqueoSubmitting}
              className="w-full px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: "#7f1d1d" }}
            >
              {arqueoSubmitting ? "Registrando..." : "Registrar arqueo"}
            </button>
          </div>
        </div>
        {arqueoError && <p className="text-sm text-red-700 mt-3">{arqueoError}</p>}
      </form>

      {ultimoArqueo && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Resultado del ultimo arqueo
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Efectivo esperado vs contado</p>
              <p className="text-gray-900">
                {formatCurrency(ultimoArqueo.efectivoEsperado)} →{" "}
                {formatCurrency(ultimoArqueo.efectivoContado)}
              </p>
              <Diferencia
                esperado={ultimoArqueo.efectivoEsperado}
                contado={ultimoArqueo.efectivoContado}
              />
            </div>
            <div>
              <p className="text-gray-500 mb-1">Cuenta esperada vs contado</p>
              <p className="text-gray-900">
                {formatCurrency(ultimoArqueo.cuentaEsperado)} →{" "}
                {formatCurrency(ultimoArqueo.cuentaContado)}
              </p>
              <Diferencia
                esperado={ultimoArqueo.cuentaEsperado}
                contado={ultimoArqueo.cuentaContado}
              />
            </div>
          </div>
        </div>
      )}

      {arqueos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center mb-10">
          <p className="font-medium text-gray-900">Aun no hay arqueos registrados</p>
          <p className="text-sm text-gray-500 mt-1">
            Usa el formulario de arriba para registrar tu primer arqueo.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600 whitespace-nowrap">
                    Fecha
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    Efectivo esperado
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    Efectivo contado
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    Diferencia efectivo
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    Cuenta esperada
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    Cuenta contado
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    Diferencia cuenta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {arqueosOrdenDesc.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                      {a.fecha}
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {formatCurrency(a.efectivoEsperado)}
                    </td>
                    <td className="px-5 py-4 text-gray-900 font-medium whitespace-nowrap">
                      {formatCurrency(a.efectivoContado)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Diferencia esperado={a.efectivoEsperado} contado={a.efectivoContado} />
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {formatCurrency(a.cuentaEsperado)}
                    </td>
                    <td className="px-5 py-4 text-gray-900 font-medium whitespace-nowrap">
                      {formatCurrency(a.cuentaContado)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Diferencia esperado={a.cuentaEsperado} contado={a.cuentaContado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RETIROS Y GASTOS */}
      <h2 className="text-xl font-bold text-gray-900 mb-1">Retiros y gastos</h2>
      <p className="text-sm text-gray-500 mb-6">
        Registra sueldos, renta, gas y otros retiros de efectivo o cuenta.
      </p>

      <form
        onSubmit={handleRetiroSubmit}
        className="bg-white border border-gray-200 rounded-2xl p-5 mb-6"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              type="date"
              value={retiroForm.fecha}
              onChange={(e) => setRetiroForm({ ...retiroForm, fecha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Concepto</label>
            <input
              type="text"
              placeholder="Ej. Renta de julio"
              value={retiroForm.concepto}
              onChange={(e) => setRetiroForm({ ...retiroForm, concepto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Categoria
            </label>
            <select
              value={retiroForm.categoria}
              onChange={(e) => setRetiroForm({ ...retiroForm, categoria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={retiroForm.monto}
              onChange={(e) => setRetiroForm({ ...retiroForm, monto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              De donde
            </label>
            <select
              value={retiroForm.deDonde}
              onChange={(e) => setRetiroForm({ ...retiroForm, deDonde: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            >
              {ORIGENES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={retiroSubmitting}
              className="w-full px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: "#7f1d1d" }}
            >
              {retiroSubmitting ? "Registrando..." : "Registrar retiro"}
            </button>
          </div>
        </div>
        {retiroError && <p className="text-sm text-red-700 mt-3">{retiroError}</p>}
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500 mb-1">Total retirado este mes</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalRetiradoMes)}
          </p>
        </div>
        {CATEGORIAS.map((c) => (
          <div key={c} className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm text-gray-500 mb-1">{c}</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(desglosePorCategoria[c])}
            </p>
          </div>
        ))}
      </div>

      {retiros.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="font-medium text-gray-900">Aun no hay retiros registrados</p>
          <p className="text-sm text-gray-500 mt-1">
            Usa el formulario de arriba para registrar tu primer retiro.
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
                    Concepto
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    Categoria
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    Monto
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                    De donde
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {retirosOrdenDesc.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                      {r.fecha}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">{r.concepto}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          CATEGORIA_ESTILOS[r.categoria] || CATEGORIA_ESTILOS.Otro
                        }`}
                      >
                        {r.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-900 font-medium whitespace-nowrap">
                      {formatCurrency(r.monto)}
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {r.deDonde}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
