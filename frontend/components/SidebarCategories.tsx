// components/SidebarCategories.tsx - ĐÃ SỬA ĐƠN GIẢN
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  active: boolean;
}

export default function SidebarCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const API_BASE_URL = "http://localhost:4000/api";

  // Load categories từ backend API
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log("Loading categories from:", `${API_BASE_URL}/categories`);
      const response = await fetch(`${API_BASE_URL}/categories`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Categories API response:", data);

      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        console.warn("Unexpected API response format");
        setCategories([]);
      }
    } catch (error) {
      console.error("Error loading categories in sidebar:", error);
      // Fallback categories
      setCategories([
        { id: "1", name: "Coffee", slug: "coffee", active: true },
        { id: "2", name: "Tea", slug: "tea", active: true },
        { id: "3", name: "Food", slug: "food", active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý click category
  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/product?category=${categorySlug}`);
  };

  // Xử lý tìm kiếm
  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      console.log("Searching for:", query);
      router.push(`/product?search=${encodeURIComponent(query)}`);
    } else {
      alert("Vui lòng nhập từ khóa tìm kiếm");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Helper để lấy icon
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📁</span> Danh mục sản phẩm
        </h3>

        {/* Skeleton loading cho categories */}
        <ul className="space-y-2">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <div className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-100 animate-pulse">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gray-300 rounded mr-3"></div>
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-8"></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Tìm kiếm sản phẩm */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">🔍</span> Tìm kiếm sản phẩm
        </h3>
<div className="flex w-full">
  <input
    type="text"
    placeholder="Nhập tên sản phẩm..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    onKeyPress={handleKeyPress}
    className="flex-1 min-w-0 px-4 py-2
               border border-gray-300 rounded-l-lg
               focus:outline-none focus:ring-2
               focus:ring-[#8B4513] focus:border-[#8B4513]"
  />
  <button
    onClick={handleSearch}
    className="bg-[#8B4513] hover:bg-[#7a3c12]
               text-white px-4 py-2 rounded-r-lg
               transition-colors shrink-0 whitespace-nowrap"
  >
    Tìm
  </button>
</div>

        <p className="text-xs text-gray-500 mt-2">
          Tìm kiếm sản phẩm theo tên hoặc mô tả
        </p>
      </div>

      {/* Danh mục sản phẩm */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📁</span> Danh mục sản phẩm
        </h3>

        {categories.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Không có danh mục nào
          </div>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    selectedCategory === cat.slug
                      ? "bg-[#FDF8F6] text-[#8B4513] border-l-4 border-[#8B4513] shadow-sm"
                      : "hover:bg-gray-50 text-gray-700 hover:text-[#8B4513]"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">
                      {getCategoryIcon(cat.slug)}
                    </span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </li>
            ))}

            {/* Option xem tất cả */}
            <li>
              <button
                onClick={() => router.push("/product")}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                  !selectedCategory
                    ? "bg-[#FDF8F6] text-[#8B4513] border-l-4 border-[#8B4513] shadow-sm"
                    : "hover:bg-gray-50 text-gray-700 hover:text-[#8B4513]"
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg">📦</span>
                  <span className="font-medium">Tất cả sản phẩm</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </li>
          </ul>
        )}

        {/* Debug info */}
        <div className="mt-4 text-xs text-gray-500">
          <p>Đã tải {categories.length} danh mục</p>
          <p>Category API: {API_BASE_URL}/categories</p>
          <p>Selected: {selectedCategory || "(none)"}</p>
        </div>
      </div>

      {/* Ưu đãi đơn giản */}
      <div className="mt-8 bg-gradient-to-r from-[#FDF8F6] to-[#FEF3C7] border border-[#F59E0B]/20 rounded-lg p-4">
        <h4 className="font-bold text-[#92400E] mb-2 flex items-center">
          <span className="mr-2">🎁</span> Ưu đãi đặc biệt
        </h4>
        <p className="text-sm text-[#92400E] mb-3">
          Nhập mã{" "}
          <span className="font-bold bg-white/50 px-1 rounded">TANGĐK</span>{" "}
          giảm 15K
        </p>
      </div>
    </div>
  );
}
