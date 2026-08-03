import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  addOrderToSheet,
  deleteOrder,
  getOrders,
  updateOrderPaymentMethod,
  updateOrderStatus,
  ORDER_STATUSES,
} from "@/libs/google-sheets";

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

// El carrito viaja en una sola fila: Base/Proteinas/Toppings/Precios/Notas
// concatenan cada orden con " | ". Aqui se separan para armar un bloque por
// orden, igual que ya hace splitPedidoOrdenes() en OrdersDashboard.
function splitPedidoOrdenes(pedido) {
  const split = (value) => String(value || "").split("|").map((s) => s.trim());
  const bases = split(pedido.base);
  const proteinas = split(pedido.proteinas);
  const toppings = split(pedido.toppings);
  const precios = split(pedido.precios);
  const notas = split(pedido.notas);
  const numOrdenes = Math.max(bases.length, proteinas.length, toppings.length);
  return Array.from({ length: numOrdenes }, (_, i) => ({
    detalle: [bases[i], proteinas[i]].filter(Boolean).join(" + "),
    toppings: toppings[i] || "",
    precio: precios[i] || "",
    nota: notas[i] || "",
  })).filter((o) => o.detalle);
}

// Avisa por Telegram cuando se guarda un pedido nuevo, sin depender de que el
// cliente llegue a mandar el WhatsApp de confirmacion. Corre del lado del
// servidor (nunca en el navegador) para no exponer el token del bot. El
// metodo de pago todavia no se conoce en este punto (se elige en la pantalla
// siguiente), asi que no aparece aqui.
async function notifyTelegram(pedido, rowNumber) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // Sin configurar: no truena, solo no avisa.

  const folio = rowNumber ? ` #${String(rowNumber).padStart(3, "0")}` : "";
  const bloquesOrdenes = splitPedidoOrdenes(pedido).map((o, i) => {
    const precio = o.precio ? ` — $${o.precio}` : "";
    return [
      `ORDEN ${i + 1}${precio}`,
      o.detalle,
      o.toppings ? `Toppings: ${o.toppings}` : null,
      o.nota ? `Notas: ${o.nota}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const texto = [
    `🔔 NUEVO PEDIDO${folio}`,
    `💰 Total: $${pedido.total ?? ""}`,
    "",
    bloquesOrdenes.join("\n\n"),
    "",
    `🙋 Nombre: ${pedido.nombre || "—"}`,
    `📱 WhatsApp cliente: ${pedido.telefono || "—"}`,
    `📍 ${pedido.direccion || "—"}`,
    pedido.ubicacion ? `🗺️ ${pedido.ubicacion}` : null,
    pedido.codigoAcceso ? `🔑 Código de acceso: ${pedido.codigoAcceso}` : null,
    pedido.referencia ? `ℹ️ Referencia: ${pedido.referencia}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto }),
    });
  } catch (error) {
    // No bloquea el guardado del pedido si Telegram falla.
    console.error("Error al avisar por Telegram:", error);
  }
}

// GET es solo para el admin: la lista de pedidos trae datos personales del
// cliente (telefono, direccion). El panel la usa para refrescar la lista de
// pedidos sin recargar la pagina (ver seguimiento de estado en vivo).
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const orders = await getOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error al leer los pedidos:", error);
    return NextResponse.json(
      { error: "No pudimos leer los pedidos." },
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
      { error: "El pedido enviado no tiene el formato correcto." },
      { status: 400 }
    );
  }

  const { base, nombre, telefono, direccion } = body;

  if (!base?.trim() || !nombre?.trim() || !telefono?.trim() || !direccion?.trim()) {
    return NextResponse.json(
      { error: "Faltan datos del pedido." },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await addOrderToSheet(body);
  } catch (error) {
    console.error("Error al guardar el pedido en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos registrar el pedido." },
      { status: 500 }
    );
  }

  // El aviso se manda ya con el pedido guardado, sin esperar a que el
  // cliente llegue a mandar el WhatsApp de confirmacion (que puede que nunca
  // mande). Se espera a que termine (aunque sea un momento) porque en un
  // entorno serverless la funcion puede cortarse justo despues de responder,
  // dejando el fetch a Telegram a medias.
  await notifyTelegram(body, result.rowNumber);

  return NextResponse.json({ success: true, rowNumber: result.rowNumber });
}

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Los datos enviados no tienen el formato correcto." },
      { status: 400 }
    );
  }

  const { rowNumber, metodoPago, estado } = body;

  if (!rowNumber) {
    return NextResponse.json(
      { error: "Faltan datos para actualizar el pedido." },
      { status: 400 }
    );
  }

  // Cambio de estado (pendiente/en camino/entregado): solo el admin desde el
  // panel. El metodo de pago (abajo) lo sigue mandando el cliente justo
  // despues de pagar, sin sesion, como ya funcionaba.
  if (estado !== undefined) {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    if (!ORDER_STATUSES.includes(estado)) {
      return NextResponse.json({ error: "Estado invalido." }, { status: 400 });
    }
    try {
      await updateOrderStatus(rowNumber, estado);
    } catch (error) {
      console.error("Error al actualizar el estado del pedido:", error);
      return NextResponse.json(
        { error: "No pudimos actualizar el estado del pedido." },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  }

  if (!metodoPago?.trim()) {
    return NextResponse.json(
      { error: "Faltan datos para actualizar el pedido." },
      { status: 400 }
    );
  }

  try {
    await updateOrderPaymentMethod(rowNumber, metodoPago);
  } catch (error) {
    console.error("Error al actualizar el metodo de pago en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos actualizar el metodo de pago." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// Elimina un pedido. Solo el admin, y solo con confirmacion ya resuelta del
// lado del panel (la accion no se puede deshacer).
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
      { error: "Falta el numero de fila del pedido." },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteOrder(rowNumber);
    if (!deleted) {
      return NextResponse.json(
        { error: "No encontramos ese pedido." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error al eliminar el pedido en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos eliminar el pedido." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
