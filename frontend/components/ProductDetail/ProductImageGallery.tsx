// components/ProductDetail/ProductImageGallery.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';

interface ProductImageGalleryProps {
  mainImage: string;
  productName: string;
}

export default function ProductImageGallery({ 
  mainImage, 
  productName 
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(mainImage);
  
  // Mock additional images
  const additionalImages = [
    mainImage,
    mainImage.replace('.jpg', '-2.jpg'),
    mainImage.replace('.jpg', '-3.jpg')
  ].filter(Boolean);
  
  const allImages = [...new Set(additionalImages)]; // Remove duplicates
  
  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-200 h-[400px] md:h-[450px] lg:h-[500px] shadow-sm">
        <Image
          src={selectedImage}
          alt={productName}
          fill
          className="object-contain p-6"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          priority
        />
        
        {/* Badge for new products */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-sm font-medium rounded-full shadow-sm border border-gray-100">
            🔥 Bán chạy
          </span>
        </div>
      </div>
      
      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((image, index) => (
            <button
              key={index}
              className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === image 
                  ? 'border-[#8B4513] scale-105 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedImage(image)}
              aria-label={`Xem ảnh ${index + 1} của ${productName}`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={image}
                  alt={`${productName} - Ảnh ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}