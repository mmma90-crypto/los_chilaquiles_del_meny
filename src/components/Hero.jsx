"use client";

import Image from "next/image";
import { siteConfig } from "@/config/site";

export default function Hero() {
  const { hero, hours } = siteConfig;
  const schedule = hours.schedule[0];

  return (
    <section
      id="hero"
      style={{ background: "#FFF6EA", overflow: "hidden", position: "relative" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        {/* Texto */}
        <div data-reveal>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              background: "#FCEAD2",
              color: "#B5611A",
              fontWeight: 800,
              fontSize: 13,
              padding: "8px 15px",
              borderRadius: 999,
              marginBottom: 22,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#5E8C3A",
                display: "inline-block",
              }}
            />
            {schedule.day}s · {schedule.open} a {schedule.close}
          </div>

          <h1
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(38px, 5.4vw, 66px)",
              lineHeight: 1.02,
              margin: "0 0 18px",
              color: "#2E1B10",
            }}
          >
            {hero.title}{" "}
            <span style={{ color: "#D6452B" }}>{hero.titleHighlight}</span>
          </h1>

          <p
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: "#6B5746",
              maxWidth: "34ch",
              margin: "0 0 28px",
            }}
          >
            {hero.subtitle}
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <a
              href={hero.ctaPrimaryUrl}
              style={{
                background: "#D6452B",
                color: "#fff",
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                padding: "15px 28px",
                borderRadius: 999,
                textDecoration: "none",
                boxShadow: "0 12px 26px rgba(214,69,43,.3)",
              }}
            >
              {hero.ctaPrimary}
            </a>
            <a
              href={hero.ctaSecondaryUrl}
              style={{
                background: "#fff",
                color: "#2E1B10",
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                padding: "15px 28px",
                borderRadius: 999,
                border: "2px solid #EAD9BF",
                textDecoration: "none",
              }}
            >
              {hero.ctaSecondary}
            </a>
          </div>

          <div
            style={{
              display: "flex",
              gap: 26,
              marginTop: 34,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 19,
                  color: "#2E1B10",
                }}
              >
                Hechos al momento
              </div>
              <div style={{ fontSize: 13, color: "#A8917A", fontWeight: 700 }}>
                crujientes y recién salseados
              </div>
            </div>
            <div style={{ width: 1, background: "#EAD9BF", alignSelf: "stretch" }} />
            <div>
              <div
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 19,
                  color: "#2E1B10",
                }}
              >
                Verdes o rojos
              </div>
              <div style={{ fontSize: 13, color: "#A8917A", fontWeight: 700 }}>
                picosos o suaves, tú eliges
              </div>
            </div>
          </div>
        </div>

        {/* Imagen circular */}
        <div data-reveal style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: "-6% -4% -10% -4%",
              background:
                "radial-gradient(circle at 50% 45%, #FCE2B6 0%, #F7D49A 45%, rgba(247,212,154,0) 72%)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1/1",
              borderRadius: "50%",
              overflow: "hidden",
              border: "10px solid #fff",
              boxShadow: "0 30px 60px rgba(120,70,20,.2)",
              background: "#FCEAD2",
            }}
          >
            <Image
              src="/chilaquiles-hero.jpeg"
              alt="Chilaquiles verdes de Los Chilaquiles del Meny"
              fill
              sizes="(max-width: 768px) 90vw, 45vw"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "-2%",
              left: "12%",
              background: "#2E1B10",
              color: "#FFE7B3",
              borderRadius: 999,
              padding: "12px 20px",
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 17,
              boxShadow: "0 14px 30px rgba(46,27,16,.3)",
            }}
          >
            desde $100
          </div>
        </div>
      </div>

      {/* Strip */}
      <div className="max-w-6xl mx-auto px-6 pb-10">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            background: "#FBEAD0",
            borderRadius: 20,
            padding: "14px 16px",
          }}
        >
          {[
            "🫓 Tortilla frita a mano",
            "🧀 Queso y crema de la casa",
            "👨‍👩‍👧 Domingos en familia",
          ].map((item) => (
            <span
              key={item}
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "#8a6a3f",
                padding: "6px 14px",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
