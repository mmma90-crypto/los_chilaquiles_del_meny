import { cookies } from "next/headers";
import { getLeads } from "@/libs/google-sheets";
import LoginForm from "./LoginForm";
import LeadsTable from "./LeadsTable";

export const metadata = {
  title: "Admin",
  robots: "noindex, nofollow", // Que Google no indexe esta pagina
};

function makeToken(password) {
  return Buffer.from(password).toString("base64");
}

export default async function AdminPage() {
  // Si no hay contrasena configurada, mostrar instrucciones de configuracion
  if (!process.env.ADMIN_PASSWORD) {
    return <SetupInstructions />;
  }

  // Verificar si el usuario ya inicio sesion (revisar la cookie)
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const isAuthenticated = token === makeToken(process.env.ADMIN_PASSWORD);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <LoginForm />
      </div>
    );
  }

  // Cargar los leads desde Google Sheets
  let leads = [];
  let error = null;
  try {
    leads = await getLeads();
  } catch (e) {
    error = e.message || "Error desconocido al conectar con Google Sheets.";
  }

  return <LeadsTable leads={leads} error={error} />;
}

// Pagina que ve el alumno si no tiene ADMIN_PASSWORD en .env.local
function SetupInstructions() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-amber-200 p-8 shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-5">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Panel no configurado
        </h1>
        <p className="text-gray-600 mb-7">
          Para activar este panel necesitas definir una contrasena en tu archivo{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.env.local</code>.
        </p>
        <ol className="space-y-5 text-sm text-gray-700">
          <li className="flex gap-3 items-start">
            <span className="shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">
              1
            </span>
            <span>
              Abre el archivo{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env.local</code>
              {" "}en la raiz del proyecto.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">
              2
            </span>
            <span>
              Agrega esta linea (elige tu propia contrasena):
              <code className="block mt-2 bg-gray-100 px-3 py-2.5 rounded text-gray-800 font-mono">
                ADMIN_PASSWORD=micontrasena123
              </code>
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">
              3
            </span>
            <span>
              Reinicia el servidor:{" "}
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 font-sans text-xs">
                Ctrl+C
              </kbd>{" "}
              y luego{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded">npm run dev</code>.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">
              4
            </span>
            <span>Recarga esta pagina.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
