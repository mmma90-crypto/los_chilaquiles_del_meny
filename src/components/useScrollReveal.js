"use client";
import { useEffect, useRef } from "react";

/**
 * Asigna data-shown a todos los elementos [data-reveal] que entren al viewport.
 * Úsalo en el componente raíz o en cada sección grande.
 */
export function useScrollReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current || document.body;

    function scan() {
      const vh = window.innerHeight || 800;
      root.querySelectorAll("[data-reveal]:not([data-shown])").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) {
          el.setAttribute("data-shown", "1");
        }
      });
    }

    let raf = null;
    function tick() { scan(); raf = requestAnimationFrame(tick); }
    raf = requestAnimationFrame(tick);

    return () => { if (raf) cancelAnimationFrame(raf); };
  }, []);

  return ref;
}
