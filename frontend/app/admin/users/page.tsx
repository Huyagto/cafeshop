"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Hàm xử lý quay lại
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search) {
        params.search = search;
      }

      if (roleFilter && roleFilter !== "all") {
        params.role = roleFilter;
      }

      const response = await adminApi.getUsers(params);
      setUsers(response.data || []);
      setPagination(
        response.pagination || {
          page: 1,
          limit: 10,
          total: response.data?.length || 0,
          pages: 1,
        }
      );
      setSelectedUsers([]); // Reset selection khi tải lại
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách người dùng");
      console.error("Users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa người dùng này?\nHành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(id);
      await adminApi.deleteUser(id);
      alert("Xóa người dùng thành công!");
      fetchUsers(); // Refresh list
    } catch (err: any) {
      alert(err.message || "Không thể xóa người dùng");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  const handleBulkAction = async (action: "delete" | "role") => {
    if (selectedUsers.length === 0) {
      alert("Vui lòng chọn ít nhất một người dùng");
      return;
    }

    if (action === "delete") {
      if (
        !confirm(
          `Bạn có chắc muốn xóa ${selectedUsers.length} người dùng đã chọn?`
        )
      ) {
        return;
      }

      try {
        // Gọi API xóa nhiều user
        await Promise.all(selectedUsers.map((id) => adminApi.deleteUser(id)));
        alert(`Đã xóa ${selectedUsers.length} người dùng thành công!`);
        fetchUsers();
      } catch (err: any) {
        alert(err.message || "Không thể xóa người dùng");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("vi-VN").format(points);
  };

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN") {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
          👑 Admin
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
        👤 Khách hàng
      </span>
    );
  };

  const getPointsBadge = (points: number) => {
    if (points >= 100000) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          🏆 VIP ({formatPoints(points)})
        </span>
      );
    } else if (points >= 10000) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          ⭐ Thành viên ({formatPoints(points)})
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
        🔹 Mới ({formatPoints(points)})
      </span>
    );
  };

  // Tính toán thống kê
  const stats = {
    total: pagination.total,
    admins: users.filter((u) => u.role === "ADMIN").length,
    customers: users.filter((u) => u.role === "CUSTOMER").length,
    vipUsers: users.filter((u) => u.loyaltyPoints >= 100000).length,
    totalPoints: users.reduce((sum, user) => sum + user.loyaltyPoints, 0),
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý Người dùng
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý tài khoản người dùng và khách hàng
            </p>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Search skeleton */}
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
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16 mr-4"></div>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Quản lý Người dùng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý tài khoản người dùng và khách hàng
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>↩️</span>
            <span>Quay lại</span>
          </button>

          <Link
            href="/admin/users/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>👤</span>
            <span>Thêm người dùng</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Tổng người dùng</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Admin</p>
          <p className="text-2xl font-bold mt-1">{stats.admins}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Khách hàng</p>
          <p className="text-2xl font-bold mt-1">{stats.customers}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Tổng điểm tích lũy</p>
          <p className="text-2xl font-bold mt-1">
            {formatPoints(stats.totalPoints)}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm người dùng
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên, email hoặc số điện thoại..."
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

            {/* Role filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="CUSTOMER">Khách hàng</option>
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
                <option value="10">10 người dùng</option>
                <option value="20">20 người dùng</option>
                <option value="50">50 người dùng</option>
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
                setRoleFilter("all");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đặt lại
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-yellow-800 font-medium">
                Đã chọn {selectedUsers.length} người dùng
              </span>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-sm text-yellow-700 hover:text-yellow-900"
              >
                Bỏ chọn
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                🗑️ Xóa đã chọn
              </button>
              <button
                onClick={() => handleBulkAction("role")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                👑 Đổi vai trò
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === users.length && users.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm tích lũy
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-2">👥</div>
                      <p className="text-lg">Không tìm thấy người dùng nào</p>
                      <p className="text-sm mt-2">
                        {search || roleFilter !== "all"
                          ? "Thử thay đổi tiêu chí tìm kiếm"
                          : "Chưa có người dùng nào trong hệ thống"}
                      </p>
                      {!search && roleFilter === "all" && (
                        <Link
                          href="/admin/users/new"
                          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Thêm người dùng đầu tiên
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          📱 {user.phone || "Chưa có số điện thoại"}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getPointsBadge(user.loyaltyPoints)}
                        <div className="text-xs text-gray-500">
                          {formatPoints(user.loyaltyPoints)} điểm
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deleteLoading === user.id}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                        >
                          {deleteLoading === user.id ? "Đang xóa..." : "Xóa"}
                        </button>
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
                trong tổng số {pagination.total} người dùng
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

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Mẹo quản lý người dùng
          </h3>
          <ul className="text-blue-700 space-y-2">
            <li>
              • <strong>VIP Users</strong> (100,000+ điểm): Ưu tiên chăm sóc và
              có chính sách đặc biệt
            </li>
            <li>
              • <strong>Admin accounts</strong>: Chỉ cấp cho nhân viên quản trị
              hệ thống
            </li>
            <li>
              • <strong>Reset mật khẩu</strong>: Nếu người dùng quên mật khẩu,
              có thể reset từ đây
            </li>
            <li>
              • <strong>Xem lịch sử đơn hàng</strong>: Click "Đơn hàng" để xem
              toàn bộ lịch sử mua hàng
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Hành động nhanh
          </h3>
          <div className="space-y-3">
            <Link
              href="/admin/users/new"
              className="block p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="font-medium text-gray-800">
                👤 Thêm người dùng mới
              </div>
            </Link>

            <button
              onClick={handleGoBack}
              className="w-full p-3 border border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-100 transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <span>↩️</span>
              <span className="font-medium text-gray-800">
                Quay lại Dashboard
              </span>
            </button>

            <button
              onClick={fetchUsers}
              className="w-full p-3 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span className="font-medium text-gray-800">
                Tải lại danh sách
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
