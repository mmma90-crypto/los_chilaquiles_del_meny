"use client";

import { siteConfig } from "@/config/site";

const ICON_MAP = {
  lightning: "🍳",
  mobile: "🌶️",
  settings: "👨‍👩‍👧",
};

const CARD_COLORS = [
  { bg: "#FCEAD2" },
  { bg: "#E8F0DB" },
  { bg: "#FCEAD2" },
];

export default function Features() {
  const { features } = siteConfig;

  return (
    <section id="features" style={{ background: "#FFF6EA" }}>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div data-reveal style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
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
            Nosotros
          </div>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(28px,4vw,44px)",
              margin: "0 0 12px",
              color: "#2E1B10",
            }}
          >
            {features.heading}
          </h2>
          <p style={{ fontSize: 18, color: "#6B5746", margin: 0 }}>
            {features.subheading}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.items.map((item, i) => (
            <div
              key={item.title}
              data-reveal
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 30,
                border: "1px solid #F0E2CC",
                boxShadow: "0 18px 40px rgba(120,70,20,.06)",
                transition: "transform .2s, box-shadow .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 26px 50px rgba(120,70,20,.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 18px 40px rgba(120,70,20,.06)";
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 27,
                  background: CARD_COLORS[i % CARD_COLORS.length].bg,
                  marginBottom: 18,
                }}
              >
                {ICON_MAP[item.icon] || "⭐"}
              </div>
              <h3
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  margin: "0 0 8px",
                  color: "#2E1B10",
                }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "#6B5746", margin: 0 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
