"use client";
import { siteConfig } from "@/config/site";
import { useScrollAnimation } from "@/components/useScrollAnimation";

export default function Hero() {
  const { badge, title, titleHighlight, subtitle, ctaPrimary, ctaSecondary, ctaPrimaryUrl, ctaSecondaryUrl } = siteConfig.hero;
  const { ref, visible } = useScrollAnimation(0.1);

  return (
    <section id="hero" className="pt-32 pb-20 px-6">
      <div
        ref={ref}
        className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-amber-800 bg-crema-100 rounded-full border border-crema-200">
          {badge}
        </span>
        <h1 className="text-5xl md:text-6xl font-bold text-stone-900 leading-tight mb-6">
          {title}
          <span className="text-verde-600"> {titleHighlight}</span>
        </h1>
        <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={ctaPrimaryUrl}
            className="w-full sm:w-auto px-8 py-3.5 bg-salsa-700 text-white font-medium rounded-full hover:bg-salsa-800 transition-colors text-center shadow-md shadow-salsa-700/20"
          >
            {ctaPrimary}
          </a>
          <a
            href={ctaSecondaryUrl}
            className="w-full sm:w-auto px-8 py-3.5 border border-salsa-700 text-salsa-800 font-medium rounded-full hover:bg-salsa-50 transition-colors text-center"
          >
            {ctaSecondary}
          </a>
        </div>
      </div>
    </section>
  );
}
