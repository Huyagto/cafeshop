// app/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import Header from "@/components/Header";
import TopNav from "@/components/TopNav";

interface OrderItemTopping {
  id: string;
  toppingId: string;
  price: number;
  quantity: number;
  topping: {
    id: string;
    name: string;
  };
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  price: number;

  // ✅ THÊM ĐOẠN NÀY
  comboItems?: {
    productId: string;
    name: string;
    image?: string | null;
    price: number;
    quantity: number;
  }[];

  toppings?: {
    id: string;
    topping: {
      name: string;
    };
    price: number;
    quantity: number;
  }[];
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  total: number | string;
  pointsEarned: number;
  isKiosk: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface TimelineStep {
  status: Order["status"];
  label: string;
  description: string;
  icon: string;
  completed: boolean;
  active: boolean;
  date?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const orderId = params.id as string;
    console.log("📦 OrderDetailPage mounted");
    console.log("   Order ID:", orderId);
    setMounted(true);
    fetchOrder(orderId);
  }, [params.id]);

  const fetchOrder = async (orderId: string) => {
    console.log("🚀 Fetching order details...");
    try {
      setLoading(true);
      setError("");

      // Check authentication
      const user = getCurrentUser();
      setCurrentUser(user);
      console.log("👤 Current user:", user);

      if (!user) {
        console.log("❌ No user, redirecting to login");
        alert("Vui lòng đăng nhập để xem chi tiết đơn hàng");
        router.push(`/login?redirect=/orders/${orderId}`);
        return;
      }

      const token = localStorage.getItem("token");
      console.log("🔑 Token exists:", !!token);

      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập");
      }

      const url = `http://localhost:4000/api/orders/${orderId}`;
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
      console.log("✅ Order fetched:", data);
      console.log("   Items count:", data.items?.length || 0);
      console.log("   Status:", data.status);
      setOrder(data);
    } catch (err: any) {
      console.error("❌ Fetch order error:", err);
      setError(err.message || "Không thể tải thông tin đơn hàng");
    } finally {
      console.log("🏁 Finished fetching order");
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    const confirmCancel = confirm(
      "Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
    );
    if (!confirmCancel) return;

    console.log("🚫 Cancelling order:", order.id);

    try {
      setCancelling(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập");
      }

      // Call update status API
      const url = `http://localhost:4000/api/orders/${order.id}/status`;
      console.log("📡 Calling PATCH:", url);

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
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

      const updatedOrder = JSON.parse(responseText);
      console.log("✅ Order cancelled response:", updatedOrder);

      // 👈 SỬA Ở ĐÂY: Nếu API không trả về items, giữ items cũ
      const mergedOrder = {
        ...order, // Giữ data cũ
        ...updatedOrder, // Cập nhật data mới
        items: updatedOrder.items || order.items || [], // Ưu tiên items mới, nếu không có thì giữ cũ
      };

      console.log("🔄 Merged order:", mergedOrder);
      setOrder(mergedOrder);
      alert("Đã hủy đơn hàng thành công!");
    } catch (err: any) {
      console.error("❌ Cancel order error:", err);
      alert(`Lỗi: ${err.message || "Không thể hủy đơn hàng"}`);
    } finally {
      setCancelling(false);
    }
  };

  const handlePrintReceipt = () => {
    console.log("🖨️ Printing receipt for order:", order?.orderNumber);
    window.print();
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(value));
  };

  const formatDate = (dateString: string, showTime: boolean = true) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };

    if (showTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    return date.toLocaleDateString("vi-VN", options);
  };

  const calculateItemTotal = (quantity: number, price: number | string) => {
    return Number(price) * quantity;
  };

  const getTimelineSteps = (order: Order): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        status: "PENDING",
        label: "Chờ xác nhận",
        description: "Đơn hàng đang chờ xác nhận",
        icon: "⏳",
        completed: ["PREPARING", "READY", "COMPLETED", "CANCELLED"].includes(
          order.status
        ),
        active: order.status === "PENDING",
      },
      {
        status: "PREPARING",
        label: "Đang chuẩn bị",
        description: "Đang chuẩn bị đồ uống của bạn",
        icon: "👨‍🍳",
        completed: ["READY", "COMPLETED"].includes(order.status),
        active: order.status === "PREPARING",
      },
      {
        status: "READY",
        label: "Sẵn sàng",
        description: order.isKiosk ? "Sẵn sàng tại quầy" : "Sẵn sàng giao hàng",
        icon: order.isKiosk ? "🏪" : "🚚",
        completed: order.status === "COMPLETED",
        active: order.status === "READY",
      },
      {
        status: "COMPLETED",
        label: "Hoàn thành",
        description: "Đơn hàng đã hoàn thành",
        icon: "✅",
        completed: order.status === "COMPLETED",
        active: order.status === "COMPLETED",
      },
    ];

    // Add CANCELLED step if needed
    if (order.status === "CANCELLED") {
      steps.push({
        status: "CANCELLED",
        label: "Đã hủy",
        description: "Đơn hàng đã bị hủy",
        icon: "❌",
        completed: true,
        active: false,
      });
    }

    return steps;
  };

  console.log(
    `🔄 OrderDetailPage render: loading=${loading}, error=${error}, order=${order?.orderNumber}`
  );

  // Loading State
  if (loading && !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8B4513] mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg">
              Đang tải chi tiết đơn hàng...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Vui lòng đợi trong giây lát
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/orders"
              className="inline-flex items-center text-sm text-[#8B4513] hover:text-amber-800 font-medium"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Quay lại danh sách đơn hàng
            </Link>
          </div>

          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
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
                <h3 className="text-lg font-medium text-red-800">
                  Không thể tải đơn hàng
                </h3>
                <div className="mt-2 text-red-700">
                  <p>
                    {error ||
                      "Đơn hàng không tồn tại hoặc bạn không có quyền xem"}
                  </p>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => router.push("/orders")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                  >
                    Quay lại danh sách
                  </button>
                  <button
                    onClick={() => fetchOrder(params.id as string)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(order);

  return (
    <>
      <TopNav />
      <Header />

      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <Link
                  href="/orders"
                  className="inline-flex items-center text-sm text-[#8B4513] hover:text-amber-800 font-medium mb-4"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Quay lại danh sách đơn hàng
                </Link>

                <div className="flex items-center gap-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Đơn hàng #{order.orderNumber}
                  </h1>
                  <OrderStatusBadge status={order.status} size="lg" />
                </div>

                <p className="mt-2 text-gray-600">
                  Đặt vào {formatDate(order.createdAt)} • Cập nhật:{" "}
                  {formatDate(order.updatedAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 print:hidden"
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  In hóa đơn
                </button>

                {(order.status === "PENDING" ||
                  order.status === "PREPARING") && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
                  >
                    {cancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang hủy...
                      </>
                    ) : (
                      <>
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Hủy đơn hàng
                      </>
                    )}
                  </button>
                )}

                {order.status === "READY" && !order.isKiosk && (
                  <button
                    onClick={() => alert("Chức năng đang phát triển")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 print:hidden"
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Xác nhận đã nhận hàng
                  </button>
                )}
              </div>
            </div>

            {/* Order Type */}
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span
                className={`inline-flex items-center ${
                  order.isKiosk ? "text-amber-700" : "text-blue-700"
                }`}
              >
                {order.isKiosk ? (
                  <>
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Đặt tại quầy • Nhận hàng trực tiếp
                  </>
                ) : (
                  <>
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Giao hàng tận nơi
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Tiến trình đơn hàng
                </h2>

                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {timelineSteps.map((step, index) => (
                    <div
                      key={step.status}
                      className="relative flex items-start mb-8 last:mb-0"
                    >
                      {/* Icon */}
                      <div
                        className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10
                      ${
                        step.completed
                          ? "bg-green-100 border-2 border-green-500"
                          : step.active
                          ? "bg-blue-100 border-2 border-blue-500 animate-pulse"
                          : "bg-gray-100 border-2 border-gray-300"
                      }
                    `}
                      >
                        <span
                          className={`text-sm ${
                            step.completed
                              ? "text-green-700"
                              : step.active
                              ? "text-blue-700"
                              : "text-gray-500"
                          }`}
                        >
                          {step.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="ml-4 flex-grow">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`text-lg font-semibold ${
                              step.completed
                                ? "text-green-800"
                                : step.active
                                ? "text-blue-800"
                                : "text-gray-600"
                            }`}
                          >
                            {step.label}
                          </h3>
                          {step.completed && (
                            <span className="inline-flex items-center text-sm text-green-600">
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
                              Hoàn thành
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{step.description}</p>

                        {step.active && order.status !== "CANCELLED" && (
                          <div className="mt-3">
                            <div className="flex items-center text-sm text-blue-600">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                              Đang xử lý...
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Indicator */}
                      {index < timelineSteps.length - 1 && (
                        <div className="absolute -bottom-4 left-4 w-0.5 h-4 bg-gray-200"></div>
                      )}
                    </div>
                  ))}
                </div>

                {order.status === "CANCELLED" && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-500 mr-2"
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
                      <span className="text-red-800 font-medium">
                        Đơn hàng đã bị hủy
                      </span>
                    </div>
                    <p className="text-red-600 text-sm mt-1">
                      Đơn hàng này đã bị hủy và không thể tiếp tục xử lý.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-900">
                    Chi tiết sản phẩm
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {order.items.length} sản phẩm trong đơn hàng
                  </p>
                </div>

                <div className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center">
                            {item.productName ? (
                              <img
                                src={
                                  item.productImage
                                    ? `http://localhost:4000${item.productImage}`
                                    : undefined
                                }
                              />
                            ) : (
                              <div className="w-12 h-12 text-amber-400">
                                <svg
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.productName}
                              </h3>
                              {item.productName && (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full mt-1">
                                  {item.productName}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-[#8B4513]">
                                {formatCurrency(
                                  calculateItemTotal(item.quantity, item.price)
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(item.price)} × {item.quantity}
                              </div>
                            </div>
                          </div>

                          {item.productName && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                              {item.productName}
                            </p>
                          )}
                        </div>
                      </div>

                      {item.toppings && item.toppings.length > 0 && (
                        <div className="mt-3 ml-1">
                          <p className="text-sm text-gray-600 mb-1">
                            Topping đã chọn:
                          </p>
                          <ul className="ml-4 text-sm text-gray-700 space-y-1">
                            {item.toppings.map((t) => (
                              <li key={t.id}>
                                + {t.topping.name} ({t.price.toLocaleString()}đ)
                                {t.quantity > 1 && ` × ${t.quantity}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* ✅ COMBO ITEMS – CHỈ HIỂN THỊ */}
                      {item.comboItems && item.comboItems.length > 0 && (
                        <div className="mt-3 ml-1">
                          <p className="text-sm text-gray-600 mb-1">
                            Sản phẩm trong combo:
                          </p>

                          <ul className="ml-4 text-sm text-gray-700 space-y-1">
                            {item.comboItems.map((ci, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>
                                  • {ci.name} × {ci.quantity}
                                </span>

                                {/* ❌ KHÔNG cộng tiền – chỉ xem */}
                                <span className="text-gray-400">
                                  {ci.price.toLocaleString()}đ
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Debug Item Info */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
                        <div className="font-medium mb-1">Item Debug Info:</div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>Item ID: {item.id.substring(0, 8)}...</div>
                          <div>
                            Product ID: {item.productId.substring(0, 8)}...
                          </div>
                          <div>Quantity: {item.quantity}</div>
                          <div>Price: {formatCurrency(item.price)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng tiền hàng</span>
                      <span className="font-medium">
                        {formatCurrency(
                          order.items.reduce(
                            (sum, item) =>
                              sum +
                              calculateItemTotal(item.quantity, item.price),
                            0
                          )
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí giao hàng</span>
                      <span className="font-medium">
                        {order.isKiosk ? "Miễn phí" : formatCurrency(0)}
                      </span>
                    </div>

                    {order.notes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ghi chú đặc biệt</span>
                        <span className="font-medium text-blue-600">Có</span>
                      </div>
                    )}

                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">
                          Tổng thanh toán
                        </span>
                        <span className="text-xl font-bold text-[#8B4513]">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                      <span className="text-gray-600">Điểm tích lũy</span>
                      <span className="text-lg font-bold text-blue-600">
                        +{order.pointsEarned} điểm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              {order.notes && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    📝 Ghi chú của bạn
                  </h2>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {order.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Tóm tắt đơn hàng
                </h2>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Mã đơn hàng
                    </div>
                    <div className="font-mono font-bold text-gray-900 text-lg">
                      #{order.orderNumber}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Ngày đặt</div>
                    <div className="font-medium">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Trạng thái</div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Hình thức</div>
                    <div className="font-medium flex items-center">
                      {order.isKiosk ? (
                        <>
                          <svg
                            className="w-4 h-4 mr-2 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          Đặt tại quầy
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Giao hàng
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-600 mb-1">
                      Tổng thanh toán
                    </div>
                    <div className="text-2xl font-bold text-[#8B4513]">
                      {formatCurrency(order.total)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Điểm nhận được
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      +{order.pointsEarned} điểm
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => router.push("/product")}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-[#8B4513] to-amber-800 hover:from-amber-800 hover:to-[#8B4513] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Đặt đơn mới
                  </button>

                  <button
                    onClick={() => router.push("/orders")}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Xem tất cả đơn hàng
                  </button>

                  <button
                    onClick={() =>
                      alert("Liên hệ: 1900 1234 • support@coffee.com")
                    }
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Cần hỗ trợ?
                  </button>
                </div>
              </div>

              {/* Receipt for Printing */}
              <div className="hidden print:block bg-white p-8">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    HÓA ĐƠN THANH TOÁN
                  </h1>
                  <p className="text-gray-600">Coffee Loyalty Shop</p>
                  <p className="text-gray-600 text-sm">
                    Số: {order.orderNumber}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span>Ngày:</span>
                    <span>{formatDate(order.createdAt, false)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Giờ:</span>
                    <span>
                      {new Date(order.createdAt).toLocaleTimeString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Khách hàng:</span>
                    <span>{getCurrentUser()?.name || "Khách hàng"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hình thức:</span>
                    <span>{order.isKiosk ? "Tại quầy" : "Giao hàng"}</span>
                  </div>
                </div>

                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Sản phẩm</th>
                      <th className="text-center py-2">SL</th>
                      <th className="text-right py-2">Đơn giá</th>
                      <th className="text-right py-2">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.productName}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(
                            calculateItemTotal(item.quantity, item.price)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-bold">
                        Tổng cộng:
                      </td>
                      <td className="text-right py-2 font-bold">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right py-2">
                        Điểm tích lũy:
                      </td>
                      <td className="text-right py-2">
                        +{order.pointsEarned} điểm
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="text-center text-sm text-gray-600 mt-8">
                  <p>Cảm ơn quý khách!</p>
                  <p>Hotline: 1900 1234</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
