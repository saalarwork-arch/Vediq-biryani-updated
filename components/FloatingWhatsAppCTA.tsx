'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function FloatingWhatsAppCTA() {
  const whatsappUrl = 'https://wa.me/918744044994?text=Hello%20Vediq%20Biryani%2C%20I%20would%20like%20to%20inquire%20about%20ordering%20fresh%20royal%20dum%20biryani';

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20BA59] text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group font-bold text-xs"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
      <span className="hidden sm:inline font-semibold">Order via WhatsApp</span>
    </a>
  );
}
