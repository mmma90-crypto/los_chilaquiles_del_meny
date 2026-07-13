"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canjearPin } from "@/libs/google-sheets";

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

// Login de invitado con PIN de un solo uso (pestaña "Pines" de Google Sheets).
// Si el PIN es valido se marca como USADO y se crea una cookie que dura 1 hora;
// para volver a entrar despues, el administrador debe generar otro PIN.
export async function loginWithPinAction(prevState, formData) {
  const pin = formData.get("pin");

  let result;
  try {
    result = await canjearPin(pin);
  } catch {
    return { error: "No se pudo verificar el PIN. Intentalo de nuevo." };
  }
  if (!result.ok) {
    return { error: result.error };
  }

  const cookieStore = await cookies();
  cookieStore.set("guest_token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // Expira en 1 hora, igual que el token en la hoja
    path: "/",
    sameSite: "lax",
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  cookieStore.delete("guest_token");
  redirect("/admin");
}
