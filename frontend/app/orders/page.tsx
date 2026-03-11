// app/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import { OrderCard } from "@/components/orders/OrderCard";
import { getCurrentUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TopNav from "@/components/TopNav";

interface Order {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  total: number | string;
  pointsEarned: number;
  isKiosk: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    productId: string;      
    productName: string; 
    price: number | string;
    product: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    console.log("📋 OrdersPage mounted");
    console.log("   Status filter:", statusFilter);
    setMounted(true);
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    console.log("🚀 Fetching orders...");
    try {
      setLoading(true);
      setError("");

      // Check authentication
      const user = getCurrentUser();
      setUserEmail(user?.email || "Not logged in");
      console.log("👤 Current user:", user);

      if (!user) {
        console.log("❌ No user, redirecting to login");
        alert("Vui lòng đăng nhập để xem đơn hàng");
        router.push("/login?redirect=/orders");
        return;
      }

      const token = localStorage.getItem("token");
      console.log("🔑 Token exists:", !!token);

      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập");
      }

      // Build URL with filter
      let url = "http://localhost:4000/api/orders/my";
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }

      console.log("📡 Calling API:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📊 Response status:", response.status);

      const responseText = await response.text();
      console.log("📦 Raw response:", responseText);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = JSON.parse(responseText);
      console.log("✅ Orders fetched:", data.length, "orders");
      const ordersArray = Array.isArray(data.orders) ? data.orders : [];
      setOrders(ordersArray);
    } catch (err: any) {
      console.error("❌ Fetch orders error:", err);
      setError(err.message || "Không thể tải danh sách đơn hàng");
    } finally {
      console.log("🏁 Finished fetching orders");
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "", label: "Tất cả đơn hàng" },
    { value: "PENDING", label: "Chờ xác nhận" },
    { value: "PREPARING", label: "Đang chuẩn bị" },
    { value: "READY", label: "Sẵn sàng" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  console.log(
    `🔄 OrdersPage render: loading=${loading}, error=${error}, orders=${orders.length}`
  );

  

  return (
  <>
    <TopNav />
    <Header />

    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            📦 Đơn Hàng Của Tôi
          </h1>
          <p className="text-gray-600 text-lg">
            Theo dõi và quản lý tất cả đơn hàng của bạn
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Lọc đơn hàng
              </h2>
              <p className="text-sm text-gray-600">
                Chọn trạng thái để xem các đơn hàng tương ứng
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full sm:w-56 rounded-xl border border-gray-300 bg-white py-3 px-4 shadow-sm focus:border-[#8B4513] focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 sm:text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchOrders}
                disabled={loading}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-[#8B4513] to-amber-800 hover:from-amber-800 hover:to-[#8B4513] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tải...
                  </>
                ) : (
                  "Áp dụng bộ lọc"
                )}
              </button>

              <button
                onClick={() => {
                  console.log("🔄 Refreshing orders...");
                  fetchOrders();
                }}
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
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
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-red-800">
                  Đã xảy ra lỗi
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchOrders}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !mounted && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8B4513] mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg">
              Đang tải danh sách đơn hàng...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Vui lòng đợi trong giây lát
            </p>
          </div>
        )}

        {/* Orders Grid */}
        {!loading && mounted && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="mx-auto w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-12 h-12 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Chưa có đơn hàng nào
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Bạn chưa đặt đơn hàng nào. Hãy khám phá menu và đặt những món
                  ngon đầu tiên!
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => router.push("/products")}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-[#8B4513] to-amber-800 hover:from-amber-800 hover:to-[#8B4513] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Khám phá menu
                  </button>
                  <button
                    onClick={() => router.push("/cart")}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Xem giỏ hàng
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {statusFilter
                        ? `Đơn hàng ${statusOptions
                            .find((o) => o.value === statusFilter)
                            ?.label?.toLowerCase()}`
                        : "Tất cả đơn hàng"}
                    </h2>
                    <p className="text-gray-600">
                      Tổng cộng {orders.length} đơn hàng
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-200">
                    <div className="text-2xl font-bold text-amber-800">
                      {orders.filter((o) => o.status === "PENDING").length}
                    </div>
                    <div className="text-sm text-amber-700">Chờ xác nhận</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-800">
                      {
                        orders.filter(
                          (o) =>
                            o.status === "PREPARING" || o.status === "READY"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-blue-700">Đang xử lý</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                    <div className="text-2xl font-bold text-green-800">
                      {orders.filter((o) => o.status === "COMPLETED").length}
                    </div>
                    <div className="text-sm text-green-700">Hoàn thành</div>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200">
                    <div className="text-2xl font-bold text-gray-800">
                      {orders.length}
                    </div>
                    <div className="text-sm text-gray-700">Tổng đơn hàng</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  

  </>
);
}
