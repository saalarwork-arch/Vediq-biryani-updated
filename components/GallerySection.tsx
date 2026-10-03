'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useData } from '@/context/DataContext';
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from '@/lib/storageUpload';

export default function GallerySection() {
  const { galleryItems } = useData();
  const visibleGallery = galleryItems.filter((item) => item.is_active !== false);

  return (
    <section className="py-10 sm:py-14 bg-[#07111F] border-b border-[#1C2D4A]">
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
              Visual Glimpses
            </span>
            <span className="w-6 h-[1px] bg-[#C9A24A]/70" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F1E8] tracking-tight">
            Crafted for the Royal Palate
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {visibleGallery.map((img, idx) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: (idx % 4) * 0.08, ease: 'easeOut' }}
              className="aspect-square rounded-2xl overflow-hidden relative group border border-[#1C2D4A] shadow-xs hover:shadow-md bg-[#0A1628]"
            >
              <img
                src={resolveImageUrl(img.image_url)}
                alt={img.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                    target.src = DEFAULT_FALLBACK_IMAGE;
                  }
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-xs font-bold text-[#F5F1E8]">{img.title}</span>
                {img.caption && <span className="text-[11px] text-[#AAB4C2] line-clamp-1">{img.caption}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
