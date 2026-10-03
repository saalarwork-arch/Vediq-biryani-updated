import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center p-6 text-center text-[#F5F1E8]">
      <div className="w-16 h-16 rounded-3xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B] mb-6 shadow-xl">
        <Sparkles className="w-8 h-8 text-[#C9A24A]" />
      </div>
      <h1 className="font-serif text-4xl sm:text-5xl font-extrabold mb-3 text-[#F5F1E8]">404 - Page Not Found</h1>
      <p className="text-sm text-[#AAB4C2] max-w-md mb-8">
        The royal feast you were looking for seems to have moved or does not exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] font-bold text-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Royal Menu</span>
      </Link>
    </div>
  );
}
