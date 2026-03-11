"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi, categoryApi } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCategories();
      setCategories(response.data || response);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh mục");
      console.error("Categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa danh mục này? Tất cả sản phẩm trong danh mục sẽ bị ảnh hưởng."
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(id);
      // Note: Cần endpoint DELETE /admin/categories/:id
      // Tạm thời chỉ alert
      alert(
        "Chức năng xóa danh mục đang được phát triển. Vui lòng ẩn danh mục thay vì xóa."
      );
      // await adminApi.deleteCategory(id);
      // fetchCategories();
    } catch (err: any) {
      alert(err.message || "Không thể xóa danh mục");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      setToggleLoading(id);
      // Note: Cần endpoint PATCH /admin/categories/:id
      // Tạm thời chỉ update local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, active: !currentActive } : cat
        )
      );
      alert(`Đã ${currentActive ? "ẩn" : "kích hoạt"} danh mục thành công!`);
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật danh mục");
      fetchCategories(); // Refresh on error
    } finally {
      setToggleLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter client-side since API might not support search
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Filter categories
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      search === "" ||
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      category.slug.toLowerCase().includes(search.toLowerCase());

    const matchesActive = showActiveOnly ? category.active : true;

    return matchesSearch && matchesActive;
  });

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.active).length,
    inactive: categories.filter((c) => !c.active).length,
    withProducts: categories.filter((c) => (c._count?.products || 0) > 0)
      .length,
  };

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý danh mục</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Search skeleton */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="h-12 bg-gray-100"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 border-b animate-pulse">
              <div className="h-full flex items-center px-6">
                <div className="h-12 w-12 bg-gray-200 rounded"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16 ml-4"></div>
                <div className="h-6 bg-gray-200 rounded w-16 ml-4"></div>
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
        <h1 className="text-3xl font-bold text-gray-800">Quản lý danh mục</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Tổng danh mục</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Đang hoạt động</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {stats.active}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Đã ẩn</p>
          <p className="text-2xl font-bold mt-1 text-gray-400">
            {stats.inactive}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Có sản phẩm</p>
          <p className="text-2xl font-bold mt-1">{stats.withProducts}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm danh mục
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên hoặc slug..."
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

            {/* Active filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={showActiveOnly.toString()}
                onChange={(e) => setShowActiveOnly(e.target.value === "true")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Đang hoạt động</option>
                <option value="false">Tất cả</option>
              </select>
            </div>

            {/* Sort by */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sắp xếp
              </label>
              <select
                onChange={(e) => {
                  const sorted = [...filteredCategories];
                  if (e.target.value === "name") {
                    sorted.sort((a, b) => a.name.localeCompare(b.name));
                  } else if (e.target.value === "newest") {
                    sorted.sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
                  } else if (e.target.value === "oldest") {
                    sorted.sort(
                      (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    );
                  }
                  setCategories(sorted);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Tên A-Z</option>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
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
                setShowActiveOnly(true);
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
            onClick={fetchCategories}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Categories Grid/List */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-4xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Không tìm thấy danh mục
          </h3>
          <p className="text-gray-600 mb-6">
            {search || !showActiveOnly
              ? "Thử thay đổi tiêu chí tìm kiếm"
              : "Bắt đầu bằng cách tạo danh mục đầu tiên"}
          </p>
          <Link
            href="/admin/categories/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <span>➕</span>
            <span>Tạo danh mục đầu tiên</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`bg-white rounded-xl shadow border-2 transition-all hover:shadow-lg ${
                  category.active ? "border-transparent" : "border-gray-200"
                } ${!category.active ? "opacity-70" : ""}`}
              >
                {/* Category image/header */}
                <div className="relative h-48 overflow-hidden rounded-t-xl bg-gray-100">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl text-gray-400">📂</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    {category.active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Đang hiển thị
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Đã ẩn
                      </span>
                    )}
                  </div>
                </div>

                {/* Category info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Slug: <span className="font-mono">{category.slug}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {category._count?.products || 0}
                      </div>
                      <div className="text-xs text-gray-500">sản phẩm</div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <div className="flex justify-between">
                      <span>Ngày tạo:</span>
                      <span>{formatDate(category.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cập nhật:</span>
                      <span>{formatDate(category.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Link
                      href={`/admin/products?categoryId=${category.id}`}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm text-center"
                    >
                      Xem sản phẩm
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 text-center">
              Hiển thị {filteredCategories.length} trong tổng số{" "}
              {categories.length} danh mục
              {search && ` (tìm kiếm: "${search}")`}
              {!showActiveOnly && " (bao gồm danh mục đã ẩn)"}
            </p>
          </div>
        </>
      )}

      {/* Management Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            💡 Mẹo quản lý danh mục
          </h3>
          <ul className="text-blue-700 space-y-2">
            <li>
              • <strong>Slug duy nhất:</strong> Dùng cho URL, không dấu, cách
              nhau bằng gạch ngang
            </li>
            <li>
              • <strong>Ẩn thay vì xóa:</strong> Ẩn danh mục khi không dùng, giữ
              sản phẩm
            </li>
            <li>
              • <strong>Hình ảnh đại diện:</strong> Giúp danh mục nổi bật trên
              website
            </li>
            <li>
              • <strong>Phân cấp rõ ràng:</strong> Mỗi sản phẩm chỉ thuộc 1 danh
              mục
            </li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🚀 Best Practices
          </h3>
          <ul className="text-green-700 space-y-2">
            <li>• Tối đa 8-10 danh mục chính để dễ quản lý</li>
            <li>• Đặt tên ngắn gọn, dễ hiểu cho khách hàng</li>
            <li>• Kiểm tra slug trùng lặp trước khi tạo mới</li>
            <li>• Cập nhật hình ảnh theo mùa/khuyến mãi</li>
          </ul>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          ⚡ Hành động hàng loạt
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (confirm("Kích hoạt tất cả danh mục?")) {
                setCategories((prev) =>
                  prev.map((cat) => ({ ...cat, active: true }))
                );
              }
            }}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            Kích hoạt tất cả
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  "Ẩn tất cả danh mục? Sản phẩm sẽ không hiển thị trên website."
                )
              ) {
                setCategories((prev) =>
                  prev.map((cat) => ({ ...cat, active: false }))
                );
              }
            }}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            Ẩn tất cả
          </button>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Thêm sản phẩm mới
          </Link>
          <button
            onClick={fetchCategories}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔄 Tải lại danh sách
          </button>
        </div>
      </div>
    </div>
  );
}
