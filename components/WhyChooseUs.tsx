'use client';

import React from 'react';
import { Leaf, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function WhyChooseUs() {
  const pillars = [
    {
      icon: Leaf,
      title: 'Packed in Natural Banana Leaf',
      desc: 'Wrapped in fresh natural banana leaf (Kele ka Patta) to infuse authentic earthy aroma and enhance flavor.',
    },
    {
      icon: ShieldCheck,
      title: '100% Plastic-Free Packaging',
      desc: 'Eco-conscious, hygienic, non-toxic packaging crafted with zero single-use plastics.',
    },
    {
      icon: Sparkles,
      title: '2-Year Aged Basmati & Kesar',
      desc: 'Extra-long grains that absorb the aromatic saffron milk without turning sticky, slow-steamed on dum.',
    },
    {
      icon: Clock,
      title: 'From Our Kitchen to Your Door',
      desc: 'Carefully packed and delivered to your doorstep so your biryani arrives warm, aromatic, and ready to enjoy.',
    },
  ];

  return (
    <section id="craft" className="py-10 sm:py-14 bg-[#07111F] border-b border-[#1C2D4A] scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-1.5"
        >
          <div className="flex items-center justify-center gap-2 text-[#C9A24A]">
            <span className="w-6 h-[1px] bg-[#C9A24A]/70" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#E2C56B]">
              The Vediq Standards
            </span>
            <span className="w-6 h-[1px] bg-[#C9A24A]/70" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F1E8] tracking-tight">
            Why Royal Connoisseurs Choose Us
          </h2>
          <p className="text-[#AAB4C2] text-xs sm:text-sm leading-relaxed">
            We preserve age-old Awadhi and Nizami culinary traditions with uncompromising quality.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                className="p-6 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] hover:border-[#C9A24A]/50 hover:shadow-[0_10px_25px_-5px_rgba(201,162,74,0.15)] hover:-translate-y-0.5 transition-all duration-300 space-y-3.5"
              >
                <div className="w-12 h-12 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#C9A24A]">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#F5F1E8]">{p.title}</h3>
                <p className="text-xs text-[#AAB4C2] leading-relaxed">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
