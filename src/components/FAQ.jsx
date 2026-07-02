"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";

export default function FAQ() {
  const { faq } = siteConfig;
  const [openIndex, setOpenIndex] = useState(-1);

  function toggle(i) {
    setOpenIndex((prev) => (prev === i ? -1 : i));
  }

  return (
    <section id="faq" style={{ background: "#FFF6EA" }}>
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div data-reveal style={{ textAlign: "center", marginBottom: 38 }}>
          <div
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: ".12em",
              color: "#D6452B",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            FAQ
          </div>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(28px,4vw,44px)",
              margin: "0 0 10px",
              color: "#2E1B10",
            }}
          >
            {faq.heading}
          </h2>
          <p style={{ fontSize: 18, color: "#6B5746", margin: 0 }}>{faq.subheading}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faq.items.map((item, i) => (
            <div
              key={item.question}
              data-reveal
              style={{
                background: "#fff",
                border: "1px solid #F0E2CC",
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggle(i)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "left",
                  padding: "20px 24px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#2E1B10",
                }}
              >
                {item.question}
                <span
                  style={{
                    fontSize: 24,
                    color: "#D6452B",
                    lineHeight: 1,
                    transition: "transform .25s ease",
                    transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)",
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
              </button>
              {openIndex === i && (
                <div
                  style={{
                    padding: "0 24px 22px",
                    fontSize: 15.5,
                    lineHeight: 1.6,
                    color: "#6B5746",
                  }}
                >
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
