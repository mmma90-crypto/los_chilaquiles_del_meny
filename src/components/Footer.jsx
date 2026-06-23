import { siteConfig } from "@/config/site";

export default function Footer() {
  const { name } = siteConfig;
  const { tagline, links, copyright } = siteConfig.footer;

  return (
    <footer className="border-t border-crema-200 bg-white/60 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <span className="text-lg font-bold text-stone-900">{name}</span>
          <p className="text-sm text-stone-500 mt-1">{tagline}</p>
        </div>

        <ul className="flex items-center gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-stone-500 hover:text-verde-600 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <p className="text-sm text-stone-400">
          &copy; {new Date().getFullYear()} {name}. {copyright}
        </p>
      </div>
    </footer>
  );
}
