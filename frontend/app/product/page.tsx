// app/product/page.tsx - SỬA ĐÚNG VỚI BACKEND ENDPOINT
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SidebarCategories from "@/components/SidebarCategories";
import { ProductCard } from "@/components/ProductCard";
import { Product as ProductType } from "@/types/catalog";
import { productApi, categoryApi } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Note: price là string trong response, nhưng bạn đang dùng number
  image: string | null;
  available: boolean;
  categoryId: string;
  // THÊM 2 DÒNG NÀY
  category?: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    active: boolean;
  };
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Lưu tất cả sản phẩm
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("default");
  const [error, setError] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const slug = searchParams.get("category");
    const search = searchParams.get("search");
    setSelectedCategory(slug ? slug : "all");
    loadProducts(slug, search);
  }, [searchParams]);

  const loadProducts = async (slug: string | null, search: string | null) => {
    try {
      // 🔍 SEARCH MODE
if (search && search.trim() !== "") {
  console.log("🔍 Searching products:", search);

  const response = await productApi.getProducts({
    search: search.trim(),
  });

  if (response?.success && response.data) {
    const productsData = Array.isArray(response.data)
      ? response.data
      : response.data.products || [];

    setProducts(productsData);
    setAllProducts(productsData);
  } else {
    setProducts([]);
  }

  return; // ⛔ BẮT BUỘC – tránh chạy tiếp category logic
}
      setLoading(true);
      setError("");

      let productsData: Product[] = [];

      if (slug) {
        console.log(`Loading products for category: ${slug}`);
        const response = await categoryApi.getProductsByCategory(slug);

        // DEBUG: Log response
        console.log("📦 API Response:", response);

        if (response && response.success && response.data) {
          // Lấy products từ response.data.products
          if (response.data.products && Array.isArray(response.data.products)) {
            productsData = response.data.products;
            console.log(
              `✅ Loaded ${productsData.length} products with category data`
            );

            // Debug category info của sản phẩm đầu tiên
            if (productsData.length > 0) {
              const firstProduct = productsData[0];
              console.log("🔍 First product category:", {
                name: firstProduct.name,
                categorySlug: firstProduct.category?.slug,
                categoryName: firstProduct.category?.name,
              });
            }
          } else {
            console.warn("⚠️ No products array in response:", response.data);
            productsData = [];
          }
        } else {
          console.error("❌ API response error:", response);
          productsData = [];
        }

        // Load all products nếu cần
        if (allProducts.length === 0) {
          const allResponse = await productApi.getProducts();
          if (allResponse && allResponse.success && allResponse.data) {
            const allData = Array.isArray(allResponse.data)
              ? allResponse.data
              : allResponse.data.products || [];
            setAllProducts(allData);
          }
        }
      } else {
        // Không có slug: lấy tất cả sản phẩm
        const response = await productApi.getProducts();

        if (response && response.success && response.data) {
          // Xử lý cả 2 trường hợp: array trực tiếp hoặc object có products
          if (Array.isArray(response.data)) {
            productsData = response.data;
          } else if (
            response.data.products &&
            Array.isArray(response.data.products)
          ) {
            productsData = response.data.products;
          } else {
            productsData = [];
          }
          setAllProducts(productsData);
        } else {
          productsData = [];
        }
      }

      setProducts(productsData);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Không thể tải sản phẩm");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Map category slug từ product name (chỉ dùng khi cần phân loại thêm)
  const getProductCategorySlug = (productName: string): string => {
    const categoryMap: Record<string, string> = {
      // Coffee
      espresso: "coffee",
      cappuccino: "coffee",
      latte: "coffee",
      mocha: "coffee",
      americano: "coffee",
      phin: "coffee",
      "cold brew": "coffee",
      đá: "coffee",
      nóng: "coffee",

      // Tea
      trà: "tea",
      "trà sữa": "tea",
      matcha: "tea",

      // Food
      bánh: "food",
      croissant: "food",
      sandwich: "food",
      mặn: "food",

      // Dessert
      tiramisu: "dessert",
      cheesecake: "dessert",
      kem: "dessert",
      ngọt: "dessert",

      // Smoothie
      "sinh tố": "smoothie",
      smoothie: "smoothie",
    };

    const nameLower = productName.toLowerCase();
    const sortedKeys = Object.keys(categoryMap).sort(
      (a, b) => b.length - a.length
    );

    for (const key of sortedKeys) {
      if (nameLower.includes(key)) {
        return categoryMap[key];
      }
    }

    return "other";
  };

  // SORT FUNCTION
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name, "vi-VN");
      case "name-desc":
        return b.name.localeCompare(a.name, "vi-VN");
      case "popular":
        return 0;
      default:
        return 0;
    }
  });

  // Map API Product sang ProductType cho component ProductCard
  const mapToCatalogProduct = (product: Product): ProductType => {
    // Lấy category từ product.category (API đã trả về)
    const categorySlug = product.category?.slug || "other";

    // Map slug sang code cho component ProductCard
    const categoryCodeMap: Record<string, string> = {
      coffee: "COFFEE",
      tea: "TEA",
      food: "FOOD",
      smoothie: "SMOOTHIE",
      dessert: "DESSERT",
      other: "OTHER",
    };

    const categoryCode = categoryCodeMap[categorySlug] || "OTHER";

    // Debug nếu có vấn đề
    if (categorySlug === "other" && product.category?.slug) {
      console.warn(
        `⚠️ Product "${product.name}" should be "${product.category.slug}" but mapped to "other"`
      );
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price:
        typeof product.price === "string"
          ? parseInt(product.price)
          : product.price,
      category: categoryCode,
      image: product.image,
      available: product.available,
    };
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleCategoryClick = (category: string) => {
    if (category === "all") {
      router.push("/product");
    } else {
      router.push(`/product?category=${category}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B4513]"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <svg
                className="w-6 h-6 text-red-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-red-800">
                Lỗi tải sản phẩm
              </h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Thử lại
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Tính toán thống kê
  const getCategoryStats = () => {
    if (allProducts.length === 0) return {};

    const stats: Record<string, number> = {};
    allProducts.forEach((product) => {
      const category = getProductCategorySlug(product.name);
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  };

  const categoryStats = getCategoryStats();
  const categoryNames: Record<string, string> = {
    all: "Tất cả",
    coffee: "Cà phê",
    tea: "Trà",
    food: "Đồ ăn",
    smoothie: "Sinh tố",
    dessert: "Tráng miệng",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <SidebarCategories />
          </div>

          {/* Product list */}
          <div className="lg:w-3/4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {selectedCategory === "all"
                  ? "Tất cả sản phẩm"
                  : `${categoryNames[selectedCategory] || selectedCategory}`}
              </h1>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  Hiển thị {sortedProducts.length} sản phẩm
                  {selectedCategory !== "all" && (
                    <button
                      onClick={() => handleCategoryClick("all")}
                      className="ml-3 text-[#8B4513] hover:text-[#7a3c12] text-sm font-medium"
                    >
                      ✕ Xem tất cả
                    </button>
                  )}
                </p>
                <div className="flex items-center space-x-4">
                  <div className="text-gray-700 font-medium">Sắp xếp:</div>
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="border-2 border-gray-300 rounded-xl px-4 py-2 bg-white focus:border-[#8B4513] focus:outline-none focus:ring-2 focus:ring-amber-100 min-w-[160px]"
                  >
                    <option value="default">Mặc định</option>
                    <option value="price-asc">Giá: Thấp đến cao</option>
                    <option value="price-desc">Giá: Cao đến thấp</option>
                    <option value="name-asc">Tên: A → Z</option>
                    <option value="name-desc">Tên: Z → A</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category pills với số lượng */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.keys(categoryNames).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                    selectedCategory === cat
                      ? "bg-[#8B4513] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{categoryNames[cat]}</span>
                  {cat !== "all" && categoryStats[cat] && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedCategory === cat
                          ? "bg-amber-200 text-amber-900"
                          : "bg-gray-300 text-gray-700"
                      }`}
                    >
                      {categoryStats[cat]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Thông tin category */}
            {selectedCategory !== "all" && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-amber-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-amber-800">
                    Đang xem sản phẩm thuộc danh mục{" "}
                    <span className="font-semibold">
                      "{categoryNames[selectedCategory]}"
                    </span>
                    {categoryStats[selectedCategory] && (
                      <span className="ml-2 text-amber-600">
                        ({sortedProducts.length}/
                        {categoryStats[selectedCategory]} sản phẩm)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Danh sách sản phẩm */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="text-gray-500 text-lg mb-4">
                  {selectedCategory === "all"
                    ? "Không có sản phẩm nào"
                    : `Không tìm thấy sản phẩm trong danh mục "${categoryNames[selectedCategory]}"`}
                </div>
                <button
                  onClick={() => handleCategoryClick("all")}
                  className="px-4 py-2 bg-[#8B4513] text-white rounded-lg hover:bg-[#7a3c12] transition"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : (
              <>
                {/* Thông báo sắp xếp */}
                {sortBy !== "default" && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                        />
                      </svg>
                      <p className="text-blue-800">
                        Đang sắp xếp theo:{" "}
                        <span className="font-semibold">
                          {sortBy === "price-asc" && "Giá thấp đến cao"}
                          {sortBy === "price-desc" && "Giá cao đến thấp"}
                          {sortBy === "name-asc" && "Tên A → Z"}
                          {sortBy === "name-desc" && "Tên Z → A"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Grid sản phẩm */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product, index) => {
                    const catalogProduct = mapToCatalogProduct(product);
                    const showOrder = sortBy !== "default";

                    return (
                      <div key={product.id} className="group">
                        {showOrder && (
                          <div className="absolute -top-2 -left-2 z-10 bg-[#8B4513] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transform group-hover:scale-110 transition">
                            {index + 1}
                          </div>
                        )}
                        <ProductCard product={catalogProduct} />
                      </div>
                    );
                  })}
                </div>

                {/* Thống kê cuối trang */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">📊 Thống kê:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Hiển thị:</span>{" "}
                          <span className="font-semibold">
                            {sortedProducts.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tổng sản phẩm:</span>{" "}
                          <span className="font-semibold">
                            {allProducts.length}
                          </span>
                        </div>
                        {sortedProducts.length > 0 && (
                          <>
                            <div>
                              <span className="text-gray-500">
                                Giá thấp nhất:
                              </span>{" "}
                              <span className="font-semibold text-green-600">
                                {Math.min(
                                  ...sortedProducts.map((p) => p.price)
                                ).toLocaleString()}
                                đ
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Giá cao nhất:
                              </span>{" "}
                              <span className="font-semibold text-green-600">
                                {Math.max(
                                  ...sortedProducts.map((p) => p.price)
                                ).toLocaleString()}
                                đ
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-600 mb-2">🎯 Danh mục khác:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(categoryStats)
                          .filter(
                            ([cat]) =>
                              cat !== selectedCategory &&
                              cat !== "other" &&
                              categoryStats[cat] > 0
                          )
                          .map(([cat, count]) => (
                            <button
                              key={cat}
                              onClick={() => handleCategoryClick(cat)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs transition"
                            >
                              {categoryNames[cat]} ({count})
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
