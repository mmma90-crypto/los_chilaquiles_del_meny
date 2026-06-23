"use client";
import { siteConfig } from "@/config/site";
import { useScrollAnimation } from "@/components/useScrollAnimation";

const iconMap = {
  lightning: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  mobile: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
};

const delays = ["delay-0", "delay-150", "delay-300"];

export default function Features() {
  const { heading, subheading, items } = siteConfig.features;
  const { ref, visible } = useScrollAnimation(0.1);

  return (
    <section id="features" className="py-20 px-6 bg-crema-100/50">
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">{heading}</h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">{subheading}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((feature, index) => (
            <div
              key={index}
              className={`bg-white p-8 rounded-2xl border border-crema-200 hover:shadow-lg hover:shadow-salsa-700/5 hover:-translate-y-1 transition-all duration-500 ${delays[index]} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="w-12 h-12 bg-verde-50 text-verde-600 rounded-xl flex items-center justify-center mb-5">
                {iconMap[feature.icon] ?? iconMap.settings}
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">{feature.title}</h3>
              <p className="text-stone-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
