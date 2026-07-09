import { siteConfig } from "@/config/site";

export default function Footer() {
  const { name, footer } = siteConfig;

  return (
    <footer style={{ background: "#2E1B10", color: "#E9D7BE" }}>
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-wrap gap-6 items-center justify-between">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: "#FFF6EA",
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: 13, color: "#B79A78" }}>{footer.tagline}</div>
          </div>
        </div>

        <ul style={{ display: "flex", gap: 22, flexWrap: "wrap", listStyle: "none", padding: 0, margin: 0 }}>
          {footer.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                style={{
                  color: "#E9D7BE",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div
        style={{
          borderTop: "1px solid #4A3526",
          textAlign: "center",
          padding: "18px 24px",
          fontSize: 13,
          color: "#9C8265",
        }}
      >
        {footer.legalLinks?.length > 0 && (
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#8A7458", lineHeight: 1.9 }}>
            {footer.legalLinks.map((link, i) => (
              <span key={link.href}>
                {i > 0 && " · "}
                <a href={link.href} style={{ color: "#8A7458", textDecoration: "none" }}>
                  {link.label}
                </a>
              </span>
            ))}
          </p>
        )}
        © {new Date().getFullYear()} {name}. {footer.copyright}
      </div>
    </footer>
  );
}
