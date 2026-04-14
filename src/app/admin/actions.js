"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// El token es la version en base64 de la contrasena.
// Nota: esto es suficiente para un proyecto de curso.
// En produccion real se usaria un JWT firmado o similar.
function makeToken(password) {
  return Buffer.from(password).toString("base64");
}

export async function loginAction(prevState, formData) {
  const password = formData.get("password");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!password || !adminPassword || password !== adminPassword) {
    return { error: "Contrasena incorrecta. Intentalo de nuevo." };
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_token", makeToken(adminPassword), {
    httpOnly: true,                                    // JS del navegador no puede leerla
    secure: process.env.NODE_ENV === "production",     // Solo HTTPS en produccion
    maxAge: 60 * 60 * 8,                               // Expira en 8 horas
    path: "/",
    sameSite: "lax",
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  redirect("/admin");
}
