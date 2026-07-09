import Header from "@/components/Header";
import Footer from "@/components/Footer";

/*
 * Pagina legal generica: recibe el texto del documento (formato markdown
 * simple: #, ##, -, 1., --- y **negritas**) y lo muestra con el mismo
 * header/footer del sitio. El contenido de cada documento vive en su
 * page.jsx correspondiente dentro de src/app/.
 */

function renderInline(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ color: "#2E1B10" }}>
        {part}
      </strong>
    ) : (
      part
    )
  );
}

function parseBlocks(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let list = null;

  function flushList() {
    if (list) {
      blocks.push(list);
      list = null;
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }
    if (/^-{3,}$/.test(line)) {
      flushList();
      blocks.push({ type: "hr" });
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ type: "h3", text: line.slice(3) });
      return;
    }
    if (line.startsWith("# ")) {
      flushList();
      blocks.push({ type: "h2", text: line.slice(2) });
      return;
    }
    if (line.startsWith("- ")) {
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(line.slice(2));
      return;
    }
    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      return;
    }
    flushList();
    blocks.push({ type: "p", text: line });
  });
  flushList();
  return blocks;
}

const headingFont = { fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#2E1B10" };
const bodyText = { fontSize: 15.5, lineHeight: 1.75, color: "#6B5746" };

export default function LegalPage({ content }) {
  const blocks = parseBlocks(content);
  const firstHeadingIndex = blocks.findIndex((b) => b.type === "h2");

  return (
    <>
      <Header />
      <main style={{ background: "#FFF6EA" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 24,
              padding: "10px 20px",
              borderRadius: 999,
              border: "2px solid #EFE0C9",
              background: "#fff",
              color: "#6B5746",
              textDecoration: "none",
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 14.5,
            }}
          >
            ← Volver al inicio
          </a>

          <article
            style={{
              background: "#fff",
              border: "1px solid #F0E2CC",
              borderRadius: 26,
              padding: "clamp(24px, 5vw, 48px)",
              boxShadow: "0 14px 34px rgba(120,70,20,.06)",
            }}
          >
            {blocks.map((block, i) => {
              if (block.type === "hr") {
                return <hr key={i} style={{ border: "none", borderTop: "1px solid #F0E2CC", margin: "26px 0" }} />;
              }
              if (block.type === "h2") {
                if (i === firstHeadingIndex) {
                  return (
                    <h1 key={i} style={{ ...headingFont, fontSize: "clamp(26px, 4vw, 38px)", margin: "0 0 10px" }}>
                      {renderInline(block.text)}
                    </h1>
                  );
                }
                return (
                  <h2 key={i} style={{ ...headingFont, fontSize: 22, margin: "8px 0 10px" }}>
                    {renderInline(block.text)}
                  </h2>
                );
              }
              if (block.type === "h3") {
                return (
                  <h3 key={i} style={{ ...headingFont, fontSize: 18, margin: "8px 0 8px" }}>
                    {renderInline(block.text)}
                  </h3>
                );
              }
              if (block.type === "ul" || block.type === "ol") {
                const ListTag = block.type;
                return (
                  <ListTag key={i} style={{ ...bodyText, margin: "0 0 14px", paddingLeft: 26 }}>
                    {block.items.map((item, j) => (
                      <li key={j} style={{ marginBottom: 5 }}>
                        {renderInline(item)}
                      </li>
                    ))}
                  </ListTag>
                );
              }
              return (
                <p key={i} style={{ ...bodyText, margin: "0 0 14px" }}>
                  {renderInline(block.text)}
                </p>
              );
            })}
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
