"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { useScrollReveal } from "@/components/useScrollReveal";

export default function Header() {
  useScrollReveal();
  const [menuOpen, setMenuOpen] = useState(false);
  const { name, nav } = siteConfig;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "rgba(255,246,234,0.88)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #F0E2CC",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-4 px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#D6452B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              boxShadow: "0 6px 16px rgba(214,69,43,.32)",
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: "#2E1B10",
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#B19A82",
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              Sabor casero los domingos
            </div>
          </div>
        </div>

        {/* Nav desktop */}
        <nav className="ml-auto hidden md:flex items-center gap-6">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                color: "#6B5746",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            style={{
              background: "#D6452B",
              color: "#fff",
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 15,
              padding: "10px 20px",
              borderRadius: 999,
              textDecoration: "none",
              boxShadow: "0 8px 18px rgba(214,69,43,.28)",
              whiteSpace: "nowrap",
            }}
          >
            Pedir ahora
          </a>
        </nav>

        {/* Hamburger mobile */}
        <button
          className="ml-auto md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menú"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
        >
          <span
            style={{
              display: "block",
              width: 24,
              height: 2,
              background: "#2E1B10",
              marginBottom: 5,
              transition: "transform .2s",
              transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none",
            }}
          />
          <span
            style={{
              display: "block",
              width: 24,
              height: 2,
              background: "#2E1B10",
              marginBottom: 5,
              opacity: menuOpen ? 0 : 1,
              transition: "opacity .2s",
            }}
          />
          <span
            style={{
              display: "block",
              width: 24,
              height: 2,
              background: "#2E1B10",
              transition: "transform .2s",
              transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "#FFF6EA",
            borderTop: "1px solid #F0E2CC",
            padding: "16px 24px 20px",
          }}
        >
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                color: "#6B5746",
                fontWeight: 700,
                fontSize: 17,
                textDecoration: "none",
                padding: "12px 0",
                borderBottom: "1px solid #F0E2CC",
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "block",
              marginTop: 16,
              textAlign: "center",
              background: "#D6452B",
              color: "#fff",
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 17,
              padding: "13px",
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            Pedir ahora
          </a>
        </div>
      )}
    </header>
  );
}
