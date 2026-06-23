/**
 * PaymentButton — Boton de pago con PayPal
 * =========================================
 * Uso basico (en cualquier componente):
 *
 *   import PaymentButton from "@/components/PaymentButton";
 *   <PaymentButton />                   // usa el monto de site.js
 *   <PaymentButton amount={49} />       // monto personalizado en dolares
 *
 * Para activarlo:
 *   1. Edita src/config/site.js
 *   2. Cambia payment.enabled a true
 *   3. Escribe tu usuario de PayPal.me en payment.paypalMeUsername
 */

import { siteConfig } from "@/config/site";

// ─── Icono de PayPal (SVG simplificado) ───────────────────────────────────────
function PayPalIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PaymentButton({ amount, className = "" }) {
  const { enabled, paypalMeUsername, defaultAmount, currency, buttonText } =
    siteConfig.payment;

  // Si el pago no esta habilitado o falta el usuario, no mostrar nada
  if (!enabled || !paypalMeUsername) return null;

  const finalAmount = amount ?? defaultAmount;

  // Construir la URL de PayPal.me
  // Con monto:    https://www.paypal.me/usuario/29USD
  // Sin monto:   https://www.paypal.me/usuario  (el comprador elige cuanto pagar)
  const paypalUrl =
    finalAmount > 0
      ? `https://www.paypal.me/${paypalMeUsername}/${finalAmount}${currency}`
      : `https://www.paypal.me/${paypalMeUsername}`;

  return (
    <a
      href={paypalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-salsa-700 hover:bg-salsa-800 active:bg-salsa-800 text-white font-medium rounded-full transition-colors shadow-md shadow-salsa-700/20 ${className}`}
    >
      <PayPalIcon />
      {buttonText}
    </a>
  );
}

/*
 * ─── INTEGRACION AVANZADA CON PAYPAL CHECKOUT SDK ────────────────────────────
 *
 * Cuando el alumno quiera cobrar directamente en la pagina (sin redirigir a PayPal.me),
 * puede usar el SDK oficial de PayPal. Pasos:
 *
 * 1. Crea una app en https://developer.paypal.com/dashboard/applications
 * 2. Copia el "Client ID" de la app
 * 3. Agrega en .env.local:
 *      NEXT_PUBLIC_PAYPAL_CLIENT_ID=AQ...
 * 4. Instala el paquete:
 *      npm install @paypal/react-paypal-js
 * 5. Reemplaza este componente con algo similar a:
 *
 *   import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
 *
 *   export default function PaymentButton({ amount }) {
 *     return (
 *       <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID }}>
 *         <PayPalButtons
 *           createOrder={(data, actions) =>
 *             actions.order.create({ purchase_units: [{ amount: { value: String(amount) } }] })
 *           }
 *           onApprove={(data, actions) => actions.order.capture()}
 *         />
 *       </PayPalScriptProvider>
 *     );
 *   }
 *
 * Documentacion: https://developer.paypal.com/sdk/js/
 * ─────────────────────────────────────────────────────────────────────────────
 */
