// components/ProductDetail/AddToCartSection.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithCategory } from '@/types/catalog';
import { getCurrentUser } from '@/lib/api';

interface AddToCartSectionProps {
  product: ProductWithCategory;
  quantity: number;
  selectedSize: string;
  selectedSweetness: string;
  onQuantityChange: (quantity: number) => void;
}

export default function AddToCartSection({
  product,
  quantity,
  selectedSize,
  selectedSweetness,
  onQuantityChange,
}: AddToCartSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  
  const totalPrice = product.price * quantity;
  
  const handleAddToCart = async () => {
    console.log("🛒 Add to cart clicked (Detail Page)!");
    console.log("Product:", { 
      id: product.id, 
      name: product.name,
      quantity,
      size: selectedSize,
      sweetness: selectedSweetness
    });

    // Kiểm tra user
    const user = getCurrentUser();
    console.log("User from localStorage:", user);

    if (!user) {
      console.log("❌ No user, redirecting to login");
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
      router.push("/login?redirect=/product/" + product.id);
      return;
    }

    console.log("✅ User found:", user.email);

    // Kiểm tra sản phẩm có available không
    if (!product.available) {
      console.log("❌ Product not available");
      setError("Sản phẩm đã hết hàng");
      return;
    }

    try {
      console.log("🚀 Starting API call...");
      setLoading(true);
      setError("");

      // Lấy token từ localStorage
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập");
      }

      // Gọi API thêm vào giỏ hàng
      console.log("Calling POST /api/cart/items...");
      const response = await fetch("http://localhost:4000/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          // Có thể thêm options nếu backend hỗ trợ
          // options: { size: selectedSize, sweetness: selectedSweetness }
        }),
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = JSON.parse(responseText);
      console.log("✅ Success! Response data:", data);

      alert(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng thành công! 🎉`);

      // Cập nhật UI
      window.dispatchEvent(new Event("cart-updated"));

    } catch (err: any) {
      console.error("❌ Add to cart error:", err);

      // Hiển thị lỗi chi tiết
      const errorMsg = err.message || "Không thể thêm vào giỏ hàng";
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });

      setError(`Lỗi: ${errorMsg}`);
      alert(`Lỗi: ${errorMsg}`);
    } finally {
      console.log("🏁 Finished add to cart attempt");
      setLoading(false);
    }
  };
  
  const handleBuyNow = async () => {
    // Thêm vào giỏ hàng trước
    await handleAddToCart();
    
    // Nếu thành công, chuyển đến trang giỏ hàng
    if (!error && !loading) {
      router.push("/cart");
    }
  };
  
  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-6 border border-gray-200">
      {/* Quantity Selector */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Số lượng</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Giảm số lượng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <div className="w-12 h-10 flex items-center justify-center border-y border-gray-300 text-lg font-medium">
              {quantity}
            </div>
            
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={quantity >= 99}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Tăng số lượng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* Total Price */}
          <div className="text-right">
            <div className="text-sm text-gray-600">Thành tiền:</div>
            <div className="text-2xl font-bold text-[#8B4513]">
              {new Intl.NumberFormat('vi-VN').format(totalPrice)}đ
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected Options */}
      <div className="text-sm text-gray-600">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">Tùy chọn:</span>
          <span className="bg-gray-100 px-2 py-1 rounded">{selectedSize}</span>
          {selectedSweetness && (
            <span className="bg-gray-100 px-2 py-1 rounded">{selectedSweetness}</span>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.available || loading}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition flex items-center justify-center ${
            product.available && !loading
              ? 'bg-white border-2 border-[#8B4513] text-[#8B4513] hover:bg-amber-50 hover:border-[#7a3c12]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang thêm...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {product.available ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!product.available || loading}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${
            product.available && !loading
              ? 'bg-[#8B4513] text-white hover:bg-[#7a3c12]'
              : 'bg-gray-300 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Đang xử lý...' : 'Mua ngay'}
        </button>
      </div>
      
      {/* Shipping Info */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Miễn phí vận chuyển cho đơn từ 150.000đ
        </div>
      </div>
    </div>
  );
}