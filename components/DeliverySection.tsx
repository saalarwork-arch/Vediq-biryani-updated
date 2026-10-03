'use client';

import React from 'react';
import { Clock, ShieldCheck, Leaf } from 'lucide-react';
import { motion } from 'motion/react';

export default function DeliverySection() {
  const deliveryFeatures = [
    {
      icon: Leaf,
      title: 'Natural Banana Leaf Packaging',
      desc: 'Packed in fresh natural banana leaf (Kele ka Patta) for traditional earthy flavor and eco-friendly freshness.',
    },
    {
      icon: Clock,
      title: 'Traditional Dum Cooking',
      desc: 'Prepared using traditional dum cooking techniques to preserve the aroma, texture, and rich flavour of every grain.',
    },
    {
      icon: ShieldCheck,
      title: '100% Plastic-Free & Sealed',
      desc: '100% plastic-free food containers with tamper-evident royal security seals for pure dining peace of mind.',
    },
  ];

  return (
    <section className="py-10 sm:py-12 bg-[#07111F] border-b border-[#1C2D4A] w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="p-8 md:p-10 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-[0_8px_30px_rgba(0,0,0,0.4)] w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center w-full">
            {deliveryFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.12, ease: 'easeOut' }}
                  className="space-y-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 text-[#C9A24A] flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#F5F1E8]">{item.title}</h3>
                  <p className="text-xs text-[#AAB4C2] leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
