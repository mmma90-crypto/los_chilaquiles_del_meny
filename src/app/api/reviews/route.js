import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addReview, approveReview, deleteReview, getApprovedReviews } from "@/libs/google-sheets";

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

// Publico: solo reseñas ya aprobadas por el admin.
export async function GET() {
  try {
    const reviews = await getApprovedReviews();
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error al leer las reseñas:", error);
    return NextResponse.json(
      { error: "No pudimos cargar las reseñas." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El formulario enviado no tiene el formato correcto." },
      { status: 400 }
    );
  }

  const { name, rating, comment } = body;
  const ratingNum = Number(rating);

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "El nombre es requerido." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json(
      { error: "La calificación debe ser de 1 a 5 estrellas." },
      { status: 400 }
    );
  }
  if (!comment?.trim()) {
    return NextResponse.json(
      { error: "El comentario es requerido." },
      { status: 400 }
    );
  }
  if (comment.length > 500) {
    return NextResponse.json(
      { error: "El comentario es demasiado largo (máximo 500 caracteres)." },
      { status: 400 }
    );
  }

  try {
    await addReview({ name: name.trim(), rating: ratingNum, comment: comment.trim() });
  } catch (error) {
    console.error("Error al guardar la reseña:", error);
    return NextResponse.json(
      { error: "No pudimos guardar tu reseña. Inténtalo de nuevo en unos minutos." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// Aprobar una reseña pendiente. Solo el admin.
export async function PATCH(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Los datos enviados no tienen el formato correcto." },
      { status: 400 }
    );
  }

  const { rowNumber } = body;
  if (!rowNumber) {
    return NextResponse.json(
      { error: "Falta el numero de fila de la reseña." },
      { status: 400 }
    );
  }

  try {
    const approved = await approveReview(rowNumber);
    if (!approved) {
      return NextResponse.json({ error: "No encontramos esa reseña." }, { status: 404 });
    }
  } catch (error) {
    console.error("Error al aprobar la reseña:", error);
    return NextResponse.json(
      { error: "No pudimos aprobar la reseña." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// Eliminar una reseña (pendiente o ya aprobada). Solo el admin.
export async function DELETE(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Los datos enviados no tienen el formato correcto." },
      { status: 400 }
    );
  }

  const { rowNumber } = body;
  if (!rowNumber) {
    return NextResponse.json(
      { error: "Falta el numero de fila de la reseña." },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteReview(rowNumber);
    if (!deleted) {
      return NextResponse.json({ error: "No encontramos esa reseña." }, { status: 404 });
    }
  } catch (error) {
    console.error("Error al eliminar la reseña:", error);
    return NextResponse.json(
      { error: "No pudimos eliminar la reseña." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
