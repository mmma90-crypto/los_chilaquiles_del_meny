"use client";

import { useState } from "react";
import { logoutAction } from "./actions";
import OrdersDashboard from "./OrdersDashboard";
import PurchasesSection from "./PurchasesSection";
import CostsSection from "./CostsSection";
import FinancesSection from "./FinancesSection";
import CashCountSection from "./CashCountSection";
import LeadsTable from "./LeadsTable";

const SECTIONS = [
  { id: "pedidos", label: "Pedidos" },
  { id: "compras", label: "Compras" },
  { id: "costos", label: "Costos" },
  { id: "finanzas", label: "Finanzas" },
  { id: "arqueo", label: "Arqueo" },
  { id: "leads", label: "Leads" },
];

export default function AdminTabs({
  orders,
  ordersError,
  purchases,
  deudas,
  purchasesError,
  costAnalysis,
  costAnalysisError,
  platillos,
  platillosError,
  finances,
  financesError,
  arqueos,
  retiros,
  cashCountError,
  leads,
  leadsError,
}) {
  const [section, setSection] = useState("pedidos");

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  section === s.id
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={section === s.id ? { backgroundColor: "#7f1d1d" } : undefined}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {section === "pedidos" && <OrdersDashboard orders={orders} error={ordersError} />}

      {section === "compras" && (
        <PurchasesSection
          initialPurchases={purchases}
          initialDeudas={deudas}
          error={purchasesError}
        />
      )}

      {section === "costos" && (
        <CostsSection
          initialAnalysis={costAnalysis}
          error={costAnalysisError}
          initialPlatillos={platillos}
          platillosError={platillosError}
        />
      )}

      {section === "finanzas" && (
        <FinancesSection initialFinances={finances} error={financesError} />
      )}

      {section === "arqueo" && (
        <CashCountSection
          initialArqueos={arqueos}
          initialRetiros={retiros}
          error={cashCountError}
        />
      )}

      {section === "leads" && (
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Leads de contacto
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Contactos recibidos desde el formulario.
          </p>
          <LeadsTable leads={leads} error={leadsError} />
        </div>
      )}
    </div>
  );
}
