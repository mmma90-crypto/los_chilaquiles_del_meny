"use client";

// Acordeon compartido del panel de admin: encabezado clickeable con chevron,
// resumen corto visible cuando esta colapsado y contenido animado. Lo usan
// las pestañas Pedidos, Compras, Costos, Finanzas y Arqueo.
export default function Accordion({ title, summary, isOpen, onToggle, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-xs shrink-0 transition-transform duration-200"
            style={{
              color: "#7f1d1d",
              display: "inline-block",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
          <h3 className="text-sm font-semibold text-gray-700 truncate">{title}</h3>
        </div>
        {summary && (
          <span
            className={`text-xs text-gray-400 truncate shrink-0 transition-opacity duration-200 ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          >
            {summary}
          </span>
        )}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
