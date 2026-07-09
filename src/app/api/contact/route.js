import { NextResponse } from "next/server";
import { resend } from "@/libs/resend";
import { addRowToSheet } from "@/libs/google-sheets";
import { siteConfig } from "@/config/site";

// Escapa caracteres especiales de HTML para evitar inyeccion en el email
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Valida que el email tenga formato correcto
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  // 1. Leer y validar los datos del formulario
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El formulario enviado no tiene el formato correcto." },
      { status: 400 }
    );
  }

  const { name, email, phone, message, aceptaTerminos } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "El nombre es requerido." },
      { status: 400 }
    );
  }
  if (!email?.trim()) {
    return NextResponse.json(
      { error: "El email es requerido." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "El email no tiene un formato valido." },
      { status: 400 }
    );
  }
  if (!message?.trim()) {
    return NextResponse.json(
      { error: "El mensaje es requerido." },
      { status: 400 }
    );
  }

  // 2. Guardar en Google Sheets
  try {
    await addRowToSheet({ name, email, phone, message, aceptaTerminos });
  } catch (error) {
    console.error("Error al guardar en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos guardar tu mensaje. Intentalo de nuevo en unos minutos." },
      { status: 500 }
    );
  }

  // 3. Enviar email de confirmacion al lead
  // Si el email falla, igual devolvemos exito porque el lead ya quedo guardado
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || siteConfig.email.from,
      to: email,
      subject: siteConfig.email.subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <h2 style="color: #4f46e5;">Hola ${escapeHtml(name)},</h2>
          <p>Hemos recibido tu mensaje y nos pondremos en contacto contigo pronto.</p>
          ${phone ? `<p style="color: #666;">Tu telefono: <strong>${escapeHtml(phone)}</strong></p>` : ""}
          <p style="color: #666; margin-top: 24px;">Tu mensaje:</p>
          <blockquote style="border-left: 3px solid #4f46e5; padding-left: 16px; color: #444; margin: 8px 0;">
            ${escapeHtml(message)}
          </blockquote>
          <p style="color: #999; font-size: 14px; margin-top: 32px;">
            — ${escapeHtml(siteConfig.email.teamSignature)}
          </p>
        </div>
      `,
    });
  } catch (error) {
    // El lead quedo guardado aunque el email falle; solo lo registramos
    console.error("Error al enviar email de confirmacion:", error);
  }

  return NextResponse.json({ success: true });
}
