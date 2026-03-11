"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, categoryApi } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  image: string | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page, selectedCategory, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search) {
        params.search = search;
      }

      if (selectedCategory && selectedCategory !== "all") {
        params.categoryId = selectedCategory;
      }

      const response = await adminApi.getProducts(params);
      setProducts(response.data);
      setPagination(
        response.pagination || {
          page: 1,
          limit: 10,
          total: response.data.length,
          pages: 1,
        }
      );
    } catch (err: any) {
      setError(err.message || "Không thể tải sản phẩm");
      console.error("Products error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      setCategories(response.data || response);
    } catch (err) {
      console.error("Categories error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      setDeleteLoading(id);
      await adminApi.deleteProduct(id);
      alert("Xóa sản phẩm thành công!");
      fetchProducts(); // Refresh list
    } catch (err: any) {
      alert(err.message || "Không thể xóa sản phẩm");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusBadge = (available: boolean) => {
    if (available) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Có sẵn
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
        Hết hàng
      </span>
    );
  };

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý sản phẩm</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Search bar skeleton */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="h-12 bg-gray-100"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-b animate-pulse">
              <div className="h-full flex items-center px-6">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý sản phẩm</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Thêm sản phẩm</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Tổng sản phẩm</p>
          <p className="text-2xl font-bold mt-1">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Đang hoạt động</p>
          <p className="text-2xl font-bold mt-1">
            {products.filter((p) => p.available).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Hết hàng</p>
          <p className="text-2xl font-bold mt-1">
            {products.filter((p) => !p.available).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Danh mục</p>
          <p className="text-2xl font-bold mt-1">{categories.length}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm sản phẩm
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên sản phẩm..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hiển thị
              </label>
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit: parseInt(e.target.value),
                    page: 1,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 sản phẩm</option>
                <option value="20">20 sản phẩm</option>
                <option value="50">50 sản phẩm</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đặt lại
            </button>
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-2">🛍️</div>
                      <p className="text-lg">Không tìm thấy sản phẩm nào</p>
                      <p className="text-sm mt-2">
                        {search || selectedCategory !== "all"
                          ? "Thử thay đổi tiêu chí tìm kiếm"
                          : "Bắt đầu bằng cách thêm sản phẩm mới"}
                      </p>
                      {!search && selectedCategory === "all" && (
                        <Link
                          href="/admin/products/new"
                          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Thêm sản phẩm đầu tiên
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.image ? (
                          <img
                            src={`http://localhost:4000${product.image}`}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400">🛍️</span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description || "Không có mô tả"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {product.category?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product.available)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleteLoading === product.id}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                        >
                          {deleteLoading === product.id ? "Đang xóa..." : "Xóa"}
                        </button>
                        <Link
                          href={`/product/${product.id}`}
                          target="_blank"
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                        >
                          Xem
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Hiển thị {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}
                trong tổng số {pagination.total} sản phẩm
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← Trước
                </button>

                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded ${
                          pagination.page === pageNum
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Mẹo quản lý
        </h3>
        <ul className="text-blue-700 space-y-1">
          <li>• Cập nhật trạng thái "Có sẵn" khi nhập hàng mới</li>
          <li>• Thêm hình ảnh sản phẩm để tăng tỉ lệ chuyển đổi</li>
          <li>• Sử dụng bộ lọc danh mục để quản lý dễ dàng hơn</li>
          <li>• Kiểm tra giá thường xuyên để cạnh tranh</li>
        </ul>
      </div>
    </div>
  );
}
