"use client";

import { useEffect, useState } from "react";

export default function PlatillosSection({ initialPlatillos, error }) {
  const [platillos, setPlatillos] = useState(initialPlatillos || []);
  const [loadError, setLoadError] = useState(null);

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

  const top = platillos[0];

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Platillos más vendidos
      </h3>

      {error || loadError ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm text-amber-700">
            No pudimos cargar los platillos más vendidos.
          </p>
        </div>
      ) : (
        <>
          {top && top.total > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <p className="text-sm text-gray-500 mb-1">Más vendido históricamente</p>
              <p className="text-2xl font-bold text-gray-900">{top.categoria}</p>
              <p className="text-sm font-medium mt-1" style={{ color: "#7f1d1d" }}>
                {top.porcentaje.toFixed(1)}% de las piezas vendidas
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
      )}
    </div>
  );
}
