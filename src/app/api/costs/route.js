import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCostAnalysis } from "@/libs/google-sheets";

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

export async function GET(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const analysis = await getCostAnalysis({ desde, hasta });
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error al calcular el analisis de costos:", error);
    return NextResponse.json(
      { error: "No pudimos calcular los costos." },
      { status: 500 }
    );
  }
}
