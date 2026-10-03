'use client';

import React from 'react';
import { motion } from 'motion/react';

export default function AboutSection() {
  const stats = [
    {
      stat: '100%',
      title: 'Natural Banana Leaf',
      desc: 'Infuses natural aroma and provides eco-friendly, plastic-free packaging.',
    },
    {
      stat: 'Zero',
      title: 'Artificial Flavors',
      desc: 'No synthetic colors or chemical preservatives. Only pure saffron and whole spices.',
    },
    {
      stat: 'Pure',
      title: 'Desi Cow Ghee',
      desc: 'Fragrant clarified butter used generously to enrich every single grain.',
    },
    {
      stat: '1k+',
      title: 'Happy Customers',
      desc: 'Delivered fresh and warm to biryani lovers and families across our service areas.',
    },
  ];

  return (
    <section id="about" className="py-10 sm:py-14 bg-[#0A1628] border-b border-[#1C2D4A] scroll-mt-20 sm:scroll-mt-24 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-4 sm:space-y-5 w-full"
          >
            <div className="flex items-center gap-2 text-[#C9A24A]">
              <span className="w-6 h-[1px] bg-[#C9A24A]/70" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#E2C56B]">
                Our Culinary Philosophy
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F1E8] leading-tight">
              Honoring India&apos;s Richest <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E2C56B] to-[#C9A24A] italic font-serif">
                Biryani Cooking Traditions
              </span>
            </h2>
            <p className="text-[#AAB4C2] text-sm sm:text-base leading-relaxed">
              At Vediq Biryani, we believe that royal biryani is not just food—it is an intricate art form. The traditional Dum Pukht method originated in the royal kitchens of Awadh, where meats and vegetables were gently simmered in earthen vessels sealed with kneaded dough to trap every drop of fragrant steam.
            </p>
            <p className="text-[#7E8B9B] text-sm leading-relaxed">
              We hold our kitchens to that same timeless standard. From sourcing pure Kashmiri saffron to grinding our garam masalas in small batches daily, every step guarantees an authentic, unhurried feast.
            </p>
          </motion.div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {stats.map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                className="p-6 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-2 hover:border-[#C9A24A]/50 transition"
              >
                <span className="font-serif text-3xl font-black text-[#E2C56B]">{s.stat}</span>
                <h4 className="text-sm font-bold text-[#F5F1E8]">{s.title}</h4>
                <p className="text-xs text-[#AAB4C2] leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
