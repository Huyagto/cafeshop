// components/BannerSlider.tsx
'use client';

import { useState, useEffect } from 'react';

const banners = [
  {
    id: 1,
    title: 'ƯU ĐÃI ĐẶC BIỆT',
    subtitle: 'Giảm 30%',
    description: 'Cho tất cả các sản phẩm cà phê',
    bgColor: 'bg-gradient-to-r from-[#8B4513] to-[#D2691E]',
  },
  {
    id: 2,
    title: 'TÍCH ĐIỂM THÀNH VIÊN',
    subtitle: '1 điểm = 1.000đ',
    description: 'Đổi điểm lấy quà hấp dẫn',
    bgColor: 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6]',
  },
  {
    id: 3,
    title: 'MÙA HÈ RỰC RỠ',
    subtitle: 'Trà đào cam sả',
    description: 'Best-seller chỉ 45.000đ',
    bgColor: 'bg-gradient-to-r from-[#DC2626] to-[#F97316]',
  },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-8">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${banner.bgColor} ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center px-4">
              <div className="inline-block bg-white/20 backdrop-blur-sm text-sm font-semibold px-3 py-1 rounded-full mb-4">
                {banner.subtitle}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">{banner.title}</h2>
              <p className="text-lg mb-6">{banner.description}</p>
              <button className="bg-white text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-100">
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full ${
              index === current ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}