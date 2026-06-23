"use client";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { useScrollAnimation } from "@/components/useScrollAnimation";

function FAQItem({ question, answer, index, visible }) {
  const [isOpen, setIsOpen] = useState(false);
  const delayClass = ["delay-0", "delay-100", "delay-200", "delay-300", "delay-400"][index] ?? "delay-0";

  return (
    <div className={`border-b border-crema-200 transition-all duration-500 ${delayClass} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <button
        className="w-full py-5 flex items-center justify-between text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-base font-medium text-stone-900">{question}</span>
        <svg
          className={`w-5 h-5 text-salsa-600 shrink-0 ml-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="pb-5 text-stone-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const { heading, subheading, items } = siteConfig.faq;
  const { ref, visible } = useScrollAnimation(0.1);

  return (
    <section id="faq" className="py-20 px-6 bg-crema-100/50">
      <div className="max-w-3xl mx-auto">
        <div ref={ref} className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">{heading}</h2>
          <p className="text-lg text-stone-600">{subheading}</p>
        </div>
        <div ref={ref}>
          {items.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
