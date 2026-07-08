import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPlatillosSummary } from "@/libs/google-sheets";

function makeToken(password) {
  return Buffer.from(password).toString("base64");
}

async function isAuthenticated() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token === makeToken(adminPassword);
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { platillos, totalGeneral } = await getPlatillosSummary();
    return NextResponse.json({ platillos, totalGeneral });
  } catch (error) {
    console.error("Error al leer las ventas por platillo de Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos leer las ventas por platillo." },
      { status: 500 }
    );
  }
}
