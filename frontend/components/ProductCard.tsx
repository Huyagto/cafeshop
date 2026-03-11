// components/ProductCard.tsx - Phiên bản debug đầy đủ
"use client";

import { Product } from "@/types/catalog";
import { useState, useEffect } from "react";
import { cartApi, getCurrentUser } from "@/lib/api";
import { useRouter } from "next/navigation";

const isCategoryObject = (
  category: any
): category is {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
} => {
  return (
    typeof category === "object" && category !== null && "name" in category
  );
};

const isCategoryString = (category: any): category is string => {
  return typeof category === "string";
};

// Helper để lấy category name
const getCategoryName = (category: any): string => {
  if (isCategoryObject(category)) {
    return category.name;
  }
  if (isCategoryString(category)) {
    return category;
  }
  return "Khác";
};

// Helper để lấy category type (COFFEE, TEA, etc.)
const getCategoryType = (category: any): string => {
  const name = getCategoryName(category).toUpperCase();

  if (name.includes("COFFEE")) return "COFFEE";
  if (name.includes("TEA")) return "TEA";
  if (name.includes("FOOD")) return "FOOD";
  if (name.includes("DRINK")) return "DRINK";

  return "OTHER";
};

interface ProductCardProps {
  product: Product;
}

const buildImageUrl = (image: string | null | undefined): string | null => {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `http://localhost:4000${image}`;
};

export function ProductCard({ product }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const handleViewDetail = () => {
    router.push(`/product/${product.id}`);
  };

  // Debug mount
  useEffect(() => {
    console.log(`📦 ProductCard mounted: ${product.name}`);
    console.log(`   Available: ${product.available}`);
    console.log(`   Price: ${product.price}`);
  }, [product]);

  const handleAddToCart = async () => {
    console.log("🛒 Add to cart clicked!");
    console.log("Product:", { id: product.id, name: product.name });

    // Kiểm tra user
    const user = getCurrentUser();
    console.log("User from localStorage:", user);

    if (!user) {
      console.log("❌ No user, redirecting to login");
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
      router.push("/login?redirect=/product");
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

      // Thử call API trực tiếp để debug
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập");
      }

      console.log("Calling POST /api/cart/items...");
      const response = await fetch("http://localhost:4000/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response status text:", response.statusText);

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

      alert(`Đã thêm "${product.name}" vào giỏ hàng thành công! 🎉`);

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

  // Debug hiển thị
  console.log(
    `🔄 ProductCard render: ${product.name}, loading: ${loading}, error: ${error}`
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 h-full flex flex-col">
      {/* Product Image */}
      {/* CLICKABLE AREA – XEM CHI TIẾT */}
      <div onClick={handleViewDetail} className="cursor-pointer">
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {buildImageUrl(product.image) && (
            <img
              src={buildImageUrl(product.image)!}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          )}

          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
            <svg
              className="w-16 h-16 text-amber-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
          </div>

          {/* Availability Badge */}
          {!product.available && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Hết hàng
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 flex-grow flex flex-col">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {product.description}
            </p>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-[#8B4513]">
                {product.price.toLocaleString()}đ
              </div>
              {product.available ? (
                <div className="text-sm text-green-600 font-medium flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Còn hàng
                </div>
              ) : (
                <div className="text-sm text-red-500 font-medium">Hết hàng</div>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          {product.available && (
            <div className="relative group">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ⛔ chặn click lan lên card
                  handleAddToCart();
                }}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#7a3c12] hover:to-[#8B4513] text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <div className="relative">
                  {loading ? (
                    <div className="w-5 h-5">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    </div>
                  ) : (
                    <svg
                      className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  )}
                </div>
                <span className="font-semibold text-sm tracking-wide">
                  {loading ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                </span>
              </button>

              {/* Hiệu ứng hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300 -z-10"></div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
