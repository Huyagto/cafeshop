// components/ProductDetail/RelatedProducts.tsx - DÙNG FETCH TRỰC TIẾP
"use client";

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
  categorySlug?: string;
}

export default function RelatedProducts({ 
  categoryId,
  currentProductId,
  categorySlug
}: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadRelatedProducts() {
      try {
        setLoading(true);
        
        // DÙNG FETCH TRỰC TIẾP THAY VÌ productApi
        const response = await fetch('http://localhost:4000/api/products');
        const data = await response.json();
        
        console.log('Related products API response:', data);
        
        // Xử lý response
        let productsArray = [];
        
        if (data && data.success) {
          if (Array.isArray(data.data)) {
            productsArray = data.data;
          } else if (data.data && Array.isArray(data.data.products)) {
            productsArray = data.data.products;
          }
        }
        
        console.log('Products array:', productsArray);
        console.log('Filtering with categoryId:', categoryId);
        
        // Filter products
        const filtered = productsArray
          .filter((product: any) => {
            const matches = product.categoryId === categoryId && 
                           product.id !== currentProductId &&
                           product.available === true;
            console.log(`Product ${product.name}: categoryId=${product.categoryId}, matches=${matches}`);
            return matches;
          })
          .slice(0, 4)
          .map((product: any) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            category: product.category?.name?.toUpperCase() || 'OTHER',
            image: product.image,
            available: product.available,
          }));
        
        console.log('Filtered related products:', filtered);
        setRelatedProducts(filtered);
      } catch (error) {
        console.error('Error loading related products:', error);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadRelatedProducts();
  }, [categoryId, currentProductId]);
  
  if (loading) {
    return (
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm liên quan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (relatedProducts.length === 0) {
    console.log('No related products found');
    return null;
  }
  
  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sản phẩm liên quan</h2>
        {categorySlug && (
          <Link
            href={`/product?category=${categorySlug}`}
            className="text-[#8B4513] hover:text-[#7a3c12] font-medium flex items-center text-sm"
          >
            Xem tất cả
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {relatedProducts.map((product) => (
          <div key={product.id} className="transform transition-transform hover:-translate-y-1">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}