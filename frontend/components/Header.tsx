// components/Header.tsx
'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="bg-[#8B4513] text-white p-2 rounded-lg">
              <span className="text-xl">☕</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#8B4513]">
                COFFEE LOYATY
              </h1>
              <p className="text-sm text-gray-600">Since 1999</p>
            </div>
          </Link>

          {/* Contact */}
          <div className="text-center">
            <div className="text-lg font-bold text-[#8B4513]">1900 1755</div>
            <div className="text-sm text-gray-600">Hỗ trợ 24/7</div>
          </div>
        </div>
      </div>
    </header>
  );
}
