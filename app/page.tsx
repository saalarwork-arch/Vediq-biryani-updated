'use client';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import BiryaniCatalog from '@/components/BiryaniCatalog';
import JainSpecialSection from '@/components/JainSpecialSection';
import WhyChooseUs from '@/components/WhyChooseUs';
import CustomerReviews from '@/components/CustomerReviews';
import AboutSection from '@/components/AboutSection';
import DeliverySection from '@/components/DeliverySection';
import GallerySection from '@/components/GallerySection';
import Footer from '@/components/Footer';
import OrderingSystem from '@/components/OrderingSystem';
import FloatingWhatsAppCTA from '@/components/FloatingWhatsAppCTA';
import PWAInstallButton from '@/components/PWAInstallButton';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#07111F] text-[#F5F1E8] relative transition-colors duration-200">
      <Navbar />
      <HeroSection />
      <BiryaniCatalog />
      <JainSpecialSection />
      <WhyChooseUs />
      <AboutSection />
      <DeliverySection />
      <CustomerReviews />
      <GallerySection />
      <Footer />
      <OrderingSystem />
      <FloatingWhatsAppCTA />
      <PWAInstallButton />
    </main>
  );
}
