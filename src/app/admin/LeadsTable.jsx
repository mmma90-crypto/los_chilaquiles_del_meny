"use client";

import { useState } from "react";

export default function LeadsTable({ leads, error }) {
  const [search, setSearch] = useState("");

  const filtered = leads.filter((lead) =>
    Object.values(lead).some((v) =>
      String(v || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const withPhone = leads.filter((l) => l.telefono).length;
  const lastLead = leads[leads.length - 1];

  return (
    <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Tarjetas de resumen */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm text-gray-500 mb-1">Total de leads</p>
            <p className="text-3xl font-bold text-gray-900">{leads.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm text-gray-500 mb-1">Con telefono</p>
            <p className="text-3xl font-bold text-gray-900">{withPhone}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm text-gray-500 mb-1">Ultimo registro</p>
            <p className="text-base font-semibold text-gray-900 mt-1 truncate">
              {lastLead ? lastLead.fecha : "—"}
            </p>
          </div>
        </div>

        {/* Mensaje de error de Google Sheets */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <p className="font-semibold text-amber-900 mb-1">
              No se pudieron cargar los leads
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
            {/* Buscador */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o mensaje..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-72"
                />
              </div>
              {search && (
                <span className="text-sm text-gray-500">
                  {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Estado vacio */}
            {leads.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Aun no hay leads</p>
                <p className="text-sm text-gray-500 mt-1">
                  Cuando alguien llene el formulario de contacto apareceran aqui.
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
                          Nombre
                        </th>
                        <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                          Email
                        </th>
                        <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                          Telefono
                        </th>
                        <th className="text-left px-5 py-3.5 font-medium text-gray-600">
                          Mensaje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((lead, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                            {lead.fecha}
                          </td>
                          <td className="px-5 py-4 font-medium text-gray-900">
                            {lead.nombre}
                          </td>
                          <td className="px-5 py-4">
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-indigo-600 hover:underline"
                            >
                              {lead.email}
                            </a>
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {lead.telefono || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            <span
                              className="block max-w-xs truncate"
                              title={lead.mensaje}
                            >
                              {lead.mensaje}
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
