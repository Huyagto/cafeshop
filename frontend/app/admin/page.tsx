"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  todayOrders: number;
  totalVouchers?: number;
  activeVouchers?: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      let dashboardData = response.data;
      
      // Gọi API để lấy thông tin voucher nếu dashboard API không có
      if (dashboardData.totalVouchers === undefined) {
        try {
          const voucherRes = await adminApi.getVouchers();
          const vouchers = voucherRes?.vouchers ?? [];
          const totalVouchers = voucherRes?.total ?? 0;
          
          // Tính số voucher đang hoạt động (active và trong khoảng thời gian hợp lệ)
          const now = new Date();
          const activeVouchers = vouchers.filter((v: any) => {
            return (
              v.active === true &&
              new Date(v.validFrom) <= now &&
              new Date(v.validUntil) >= now
            );
          }).length;

          // Cập nhật thông tin voucher vào dashboard data
          dashboardData = {
            ...dashboardData,
            totalVouchers,
            activeVouchers
          };
        } catch (voucherErr) {
          console.error("Failed to fetch vouchers", voucherErr);
          // Nếu không lấy được voucher, đặt giá trị mặc định
          dashboardData = {
            ...dashboardData,
            totalVouchers: 0,
            activeVouchers: 0
          };
        }
      }
      
      setStats(dashboardData);
    } catch (err: any) {
      setError(err.message || "Không thể tải thống kê");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back(); // Quay lại trang trước
    } else {
      router.push("/admin"); // Nếu không có trang trước, về dashboard
    }
  };

  const statCards = [
    {
      title: "Tổng voucher",
      value: stats?.totalVouchers?.toLocaleString() || "0",
      icon: "🎟️",
      color: "bg-pink-500",
      link: "/admin/vouchers",
    },
    {
      title: "Voucher đang hoạt động",
      value: stats?.activeVouchers?.toLocaleString() || "0",
      icon: "✅",
      color: "bg-teal-500",
      link: "/admin/vouchers?active=true",
    },
    {
      title: "Tổng đơn hàng",
      value: stats?.totalOrders.toLocaleString() || "0",
      icon: "📊",
      color: "bg-blue-500",
      link: "/admin/orders",
    },
    {
      title: "Đơn chờ xử lý",
      value: stats?.pendingOrders.toLocaleString() || "0",
      icon: "⏳",
      color: "bg-yellow-500",
      link: "/admin/orders?status=PENDING",
    },
    {
      title: "Sản phẩm",
      value: stats?.totalProducts.toLocaleString() || "0",
      icon: "🛍️",
      color: "bg-green-500",
      link: "/admin/products",
    },
    {
      title: "Người dùng",
      value: stats?.totalUsers.toLocaleString() || "0",
      icon: "👥",
      color: "bg-purple-500",
      link: "/admin/users",
    },
    {
      title: "Doanh thu",
      value: `${(stats?.totalRevenue || 0).toLocaleString()}đ`,
      icon: "💰",
      color: "bg-green-600",
    },
    {
      title: "Đơn hôm nay",
      value: stats?.todayOrders.toLocaleString() || "0",
      icon: "📅",
      color: "bg-indigo-500",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <span>↩️</span>
            <span>Quay lại</span>
          </button>
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl shadow p-6 border-l-4 ${card.color} border-opacity-50 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold mt-2 text-gray-800">
                  {card.value}
                </p>
              </div>
              <div
                className={`${card.color} p-3 rounded-full text-white text-2xl`}
              >
                {card.icon}
              </div>
            </div>
            {card.link && (
              <Link
                href={card.link}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 inline-block"
              >
                Xem chi tiết →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Hành động nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/admin/products/new"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">➕</div>
            <h3 className="font-medium text-gray-800">Thêm sản phẩm</h3>
            <p className="text-sm text-gray-500 mt-1">Tạo sản phẩm mới</p>
          </Link>

          <Link
            href="/admin/orders?status=PENDING"
            className="p-4 border border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-medium text-gray-800">Xử lý đơn hàng</h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.pendingOrders || 0} đơn chờ
            </p>
          </Link>

          <Link
            href="/admin/combos/new"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">🎁</div>
            <h3 className="font-medium text-gray-800">Tạo combo</h3>
            <p className="text-sm text-gray-500 mt-1">Combo sản phẩm</p>
          </Link>

          <Link
            href="/admin/vouchers/new"
            className="p-4 border border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">🎟️</div>
            <h3 className="font-medium text-gray-800">Tạo voucher</h3>
            <p className="text-sm text-gray-500 mt-1">Khuyến mãi & ưu đãi</p>
          </Link>
        </div>
      </div>

      {/* Recent Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Thống kê nhanh
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Tỉ lệ đơn chờ</span>
              <span className="font-bold">
                {stats && stats.totalOrders > 0
                  ? `${(
                      (stats.pendingOrders / stats.totalOrders) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Doanh thu trung bình</span>
              <span className="font-bold">
                {stats && stats.totalOrders > 0
                  ? `${(
                      stats.totalRevenue / stats.totalOrders
                    ).toLocaleString()}đ/đơn`
                  : "0đ"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Tỉ lệ hoàn thành</span>
              <span className="font-bold">
                {stats && stats.totalOrders > 0
                  ? `${(
                      ((stats.totalOrders - stats.pendingOrders) /
                        stats.totalOrders) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Hệ thống</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Trạng thái API</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Hoạt động
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Thời gian hoạt động</span>
              <span className="font-bold">24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}