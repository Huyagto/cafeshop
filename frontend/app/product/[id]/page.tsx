// app/product/[id]/page.tsx - VIẾT LẠI PHÙ HỢP VỚI CẤU TRÚC CỦA BẠN
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopNav from '@/components/TopNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetailClient from '@/components/ProductDetail/ProductDetailClient';
import { productApi } from '@/lib/api';

// Tắt cache cho dynamic routes
export const dynamic = 'force-dynamic';

// Generate static paths nếu muốn SSG
export async function generateStaticParams() {
  try {
    const res = await fetch('http://localhost:4000/api/products');
    const data = await res.json();
    
    if (data.success && Array.isArray(data.data)) {
      return data.data.map((product: any) => ({
        id: product.id,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;
  const product = await productApi.getProductById(id);
  
  if (!product) {
    return {
      title: 'Không tìm thấy sản phẩm',
      description: 'Sản phẩm không tồn tại hoặc đã bị xóa',
    };
  }
  
  return {
    title: `${product.name} | Coffee Shop`,
    description: product.description || 'Sản phẩm chất lượng cao',
    openGraph: {
      title: product.name,
      description: product.description || '',
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const product = await productApi.getProductById(id);
  
  if (!product) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <ProductDetailClient product={product} />
      </main>
      
      <Footer />
    </div>
  );
}