// components/ProductDetail/ProductDetailClient.tsx
"use client";

import { useState } from "react";
import { cartApi } from "@/lib/api";
import { useRouter } from "next/navigation";

// Sửa interface để match API response
interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
    image: string;
    available: boolean;
    category: {
      id: string;
      name: string;
      slug: string;
      image: string | null;
      active: boolean;
    };
  } | null;
}

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Sản phẩm không tồn tại</h2>
      </div>
    );
  }

  console.log("Product in component:", product);

  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await cartApi.smartAddToCart(product.id, quantity);
      alert("Đã thêm sản phẩm vào giỏ hàng");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(err.message || "Vui lòng đăng nhập");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị đơn giản để test
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600">
        <span>Trang chủ / Thực đơn / {product.category?.name} / </span>
        <span className="font-medium">{product.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image */}
        <div className="lg:w-1/2">
          <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400">No image</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="lg:w-1/2">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              {product.category?.name || "Unknown"}
            </span>
          </div>

          <div className="text-3xl font-bold text-[#8B4513] mb-6">
            {product.price.toLocaleString()}đ
          </div>

          <div className="prose mb-6">
            <p className="text-gray-700">{product.description}</p>
          </div>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  product.available ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span
                className={
                  product.available ? "text-green-600" : "text-red-600"
                }
              >
                {product.available ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border rounded-lg">
              <button
                className="px-4 py-2"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -
              </button>
              <span className="px-4 py-2">{quantity}</span>
              <button
                className="px-4 py-2"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>
            <div className="text-lg font-semibold">
              Tổng: {(product.price * quantity).toLocaleString()}đ
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="flex-1 py-3 bg-[#8B4513] text-white rounded-lg font-medium disabled:opacity-60"
            >
              {loading ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
