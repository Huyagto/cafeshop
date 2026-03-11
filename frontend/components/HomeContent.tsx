// components/HomeContent.tsx - Phiên bản sử dụng ProductCard component
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { Product as ProductType } from "@/types/catalog";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  categoryId: string;
  category?: Category; // Thêm trường category
  createdAt?: string;
  updatedAt?: string;
}



export default function HomeContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({
    categories: true,
    products: true,
  });
  const [error, setError] = useState("");

  const API_BASE_URL = "http://localhost:4000/api";

  // Helper để lấy icon cho category
  const getCategoryIcon = (slug: string): string => {
    const iconMap: Record<string, string> = {
      coffee: "☕",
      tea: "🍵",
      "milk-tea": "🧋",
      smoothie: "🥤",
      food: "🥐",
      dessert: "🍰",
      "cold-brew": "🧊",
    };
    return iconMap[slug] || "📦";
  };

  // Convert từ Product interface của API sang ProductType của catalog
  const mapToCatalogProduct = (product: Product): ProductType => {
    // Xử lý ảnh: kiểm tra nếu chỉ là filename thì thêm base URL
    let imageUrl = product.image;

    if (imageUrl && !imageUrl.startsWith("http")) {
      // Nếu là filename (vd: banana-smoothie.jpg) hoặc path
      if (imageUrl.includes("/")) {
        // Đã có path
        imageUrl = `http://localhost:4000${imageUrl}`;
      } else {
        // Chỉ là filename
        imageUrl = `http://localhost:4000/uploads/products/${imageUrl}`;
      }
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category?.name || "Khác",
      image: imageUrl, // Đã xử lý URL
      available: product.available,
      
    };
  };

  // Helper để lấy category slug từ sản phẩm
  const getProductCategorySlug = (product: Product): string => {
    return product.category?.slug || "other";
  };

  // Helper để map category slug sang category code (nếu cần)
  const mapCategoryCode = (slug: string): string => {
    const slugMap: Record<string, string> = {
      coffee: "COFFEE",
      tea: "TEA",
      "milk-tea": "MILK_TEA",
      smoothie: "SMOOTHIE",
      food: "FOOD",
      dessert: "DESSERT",
      "cold-brew": "COLD_BREW",
    };
    return slugMap[slug] || "OTHER";
  };

  // Load categories từ API
  const loadCategories = async () => {
    try {
      setLoading((prev) => ({ ...prev, categories: true }));

      const response = await fetch(`${API_BASE_URL}/categories`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Categories loaded:", data.data?.length || 0);

      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("Không thể tải danh mục");
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  // Load products từ API THỰC
  const loadProducts = async () => {
    try {
      setLoading((prev) => ({ ...prev, products: true }));

      const response = await fetch(`${API_BASE_URL}/products`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Products loaded:", data.data?.length || 0);

      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError("Không thể tải sản phẩm");
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  // Tìm số lượng sản phẩm trong mỗi category
  const getProductCountByCategory = (categorySlug: string): number => {
    return products.filter((product) => {
      const productCategorySlug = getProductCategorySlug(product);
      return productCategorySlug === categorySlug;
    }).length;
  };



  // Render bestseller section SỬ DỤNG ProductCard
  const renderBestsellerSection = () => {
    const bestsellers = products.slice(0, 4);

    return (
      <div className="mb-16">
        <div className="flex items-center mb-10">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 py-3 rounded-full font-bold mr-5 shadow-lg">
            🔥 BÁN CHẠY NHẤT!
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
        </div>

        {loading.products ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="h-60 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-5 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bestsellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bestsellers.map((product) => {
              const catalogProduct = mapToCatalogProduct(product);
              return <ProductCard key={product.id} product={catalogProduct} />;
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <p className="text-gray-500 text-lg">
              {error || "Chưa có sản phẩm bán chạy"}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render all products section SỬ DỤNG ProductCard
  const renderAllProductsSection = () => {
    if (loading.products) {
      return (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#8B4513] mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải sản phẩm...</p>
          </div>
        </div>
      );
    }

    if (error && products.length === 0) {
      return (
        <div className="text-center py-16 bg-red-50 rounded-2xl">
          <div className="text-red-600 text-lg font-medium mb-4">
            ⚠️ {error}
          </div>
          <button
            onClick={loadProducts}
            className="px-6 py-3 bg-[#8B4513] text-white rounded-xl hover:bg-[#7a3c12] font-medium shadow-md"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Tất cả sản phẩm
            </h2>
            <p className="text-gray-600 mt-2">
              Đang hiển thị{" "}
              <span className="font-bold text-[#8B4513]">
                {products.length}
              </span>{" "}
              sản phẩm
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Sắp xếp:</span>
            <select className="border-2 border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-[#8B4513] focus:outline-none focus:ring-2 focus:ring-amber-100">
              <option>Phổ biến nhất</option>
              <option>Giá thấp đến cao</option>
              <option>Giá cao đến thấp</option>
              <option>Mới nhất</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => {
              const catalogProduct = mapToCatalogProduct(product);
              return <ProductCard key={product.id} product={catalogProduct} />;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* 2. Bestseller section */}
      {renderBestsellerSection()}

      {/* 3. Promo banner */}
      {/* <div className="bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#D2691E] rounded-2xl p-8 text-white mb-16 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="mb-6 lg:mb-0 lg:mr-10">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🎉</span>
              <h3 className="text-3xl font-bold">Ưu đãi đặc biệt!</h3>
            </div>
            <p className="text-xl mb-2">
              Nhập mã:{" "}
              <span className="font-bold text-2xl bg-white/20 px-3 py-1 rounded-lg">
                HIGHCOFFEE15
              </span>
            </p>
            <p className="text-amber-200 text-lg">
              Giảm ngay 15% cho đơn hàng đầu tiên!
            </p>
            <p className="text-gray-300 text-sm mt-3">
              Áp dụng cho đơn từ 100.000đ
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1">
              <input
                type="text"
                defaultValue="HIGHCOFFEE15"
                className="w-full px-5 py-4 rounded-xl text-gray-900 text-lg font-medium pr-12"
                readOnly
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText("HIGHCOFFEE15");
                  alert("✅ Đã sao chép mã giảm giá!");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                title="Sao chép"
              >
                📋
              </button>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText("HIGHCOFFEE15");
                alert("✅ Đã sao chép mã giảm giá!");
              }}
              className="bg-white text-[#8B4513] font-bold px-8 py-4 rounded-xl hover:bg-gray-100 whitespace-nowrap shadow-lg hover:shadow-xl transition-shadow text-lg"
            >
              Sao chép mã
            </button>
          </div>
        </div>
      </div> */}

      {/* 4. All products section */}
      {renderAllProductsSection()}
    </div>
  );
}
