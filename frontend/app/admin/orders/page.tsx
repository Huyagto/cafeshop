"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  total: number;
  pointsEarned: number;
  isKiosk: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      price: number;
    };
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  {
    value: "PENDING",
    label: "Chờ xử lý",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "PREPARING",
    label: "Đang chuẩn bị",
    color: "bg-blue-100 text-blue-800",
  },
  { value: "READY", label: "Sẵn sàng", color: "bg-green-100 text-green-800" },
  {
    value: "COMPLETED",
    label: "Hoàn thành",
    color: "bg-gray-100 text-gray-800",
  },
  { value: "CANCELLED", label: "Đã hủy", color: "bg-red-100 text-red-800" },
];

// Component dropdown chọn trạng thái
const StatusDropdown = ({
  order,
  onUpdate,
  updating,
}: {
  order: Order;
  onUpdate: (orderId: string, status: string) => void;
  updating: string | null;
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={updating === order.id}
        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
      >
        <span>Chuyển trạng thái</span>
        <span>▼</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-48">
            {STATUS_OPTIONS.filter(
              (option) =>
                option.value !== "all" && option.value !== order.status
            ).map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onUpdate(order.id, option.value);
                  setShowDropdown(false);
                }}
                disabled={updating === order.id}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    option.color?.split(" ")[0] || "bg-gray-200"
                  }`}
                ></span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, selectedStatus, startDate, endDate]);

  const fetchOrders = async () => {
  try {
    setLoading(true);
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
    };

    // CHỈ gửi search nếu đã clean và không rỗng
    if (search && search.trim() !== "") {
      const cleanSearch = search.replace(/^#/, '').trim();
      if (cleanSearch) {
        params.search = cleanSearch;
      }
    }

    // CHỈ gửi status nếu không phải "all"
    if (selectedStatus && selectedStatus !== "all") {
      params.status = selectedStatus;
    }

    // Date filters
    if (startDate) {
      params.startDate = startDate;
    }

    if (endDate) {
      params.endDate = endDate;
    }

    console.log('🔍 Search value:', search);
    console.log('📤 Params sent to API:', params);
    
    const response = await adminApi.getOrders(params);
    
    console.log('✅ API Response:', response);
    
    
    
    setOrders(response.data);
    setPagination(
      response.pagination || {
        page: 1,
        limit: 10,
        total: response.data.length,
        pages: 1,
      }
    );
  } catch (err: any) {
    console.error('❌ Orders error:', err);
    setError(err.message || "Không thể tải đơn hàng");
  } finally {
    setLoading(false);
  }
};

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn chuyển trạng thái sang "${
          STATUS_OPTIONS.find((s) => s.value === newStatus)?.label
        }"?`
      )
    ) {
      return;
    }

    try {
      setUpdatingOrder(orderId);
      await adminApi.updateOrderStatus(orderId, newStatus);

      // Update local state immediately
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus as any,
                updatedAt: new Date().toISOString(),
              }
            : order
        )
      );

      alert("Cập nhật trạng thái thành công!");
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSearch = search.replace(/^#/, "").trim();
    if (search !== cleanSearch) {
      setSearch(cleanSearch); // Update UI
    }
    fetchOrders();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    if (!statusOption) return null;

    return (
      <span className={`px-2 py-1 ${statusOption.color} text-xs rounded-full`}>
        {statusOption.label}
      </span>
    );
  };

  const calculateItemsCount = (items: Order["items"]) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Tính toán stats từ orders hiện tại
  const stats = {
    pending: orders.filter((o) => o.status === "PENDING").length,
    preparing: orders.filter((o) => o.status === "PREPARING").length,
    ready: orders.filter((o) => o.status === "READY").length,
    completed: orders.filter((o) => o.status === "COMPLETED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
  };

  // Set default date range to last 30 days
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

    const today = new Date();
    setEndDate(today.toISOString().split("T")[0]);
  }, []);

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý đơn hàng</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Filter skeleton */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="h-12 bg-gray-100"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 border-b animate-pulse">
              <div className="h-full flex items-center px-6">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-24 ml-4"></div>
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
        <h1 className="text-3xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        <div className="text-sm text-gray-500">
          Tổng: <span className="font-bold">{pagination.total}</span> đơn hàng
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Chờ xử lý</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Đang chuẩn bị</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {stats.preparing}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Sẵn sàng</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {stats.ready}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Hoàn thành</p>
          <p className="text-2xl font-bold mt-1 text-gray-600">
            {stats.completed}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Đã hủy</p>
          <p className="text-2xl font-bold mt-1 text-red-600">
            {stats.cancelled}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mã đơn hàng, tên, email..."
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

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                setSelectedStatus("all");
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

                const today = new Date();
                setEndDate(today.toISOString().split("T")[0]);
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
            onClick={fetchOrders}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-2">📦</div>
                      <p className="text-lg">Không tìm thấy đơn hàng nào</p>
                      <p className="text-sm mt-2">
                        {search || selectedStatus !== "all"
                          ? "Thử thay đổi tiêu chí tìm kiếm"
                          : "Chưa có đơn hàng nào được tạo"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        #{order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.isKiosk && (
                          <span className="px-1 bg-gray-100 text-gray-600 text-xs">
                            KIOSK
                          </span>
                        )}
                        {order.notes && (
                          <div className="mt-1 text-xs text-gray-400 truncate max-w-xs">
                            📝 {order.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user.email}
                        </div>
                        {order.user.phone && (
                          <div className="text-sm text-gray-500">
                            📞 {order.user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <div className="font-medium">
                          {calculateItemsCount(order.items)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.items.length} sản phẩm
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatPrice(order.total)}
                      <div className="text-xs text-gray-500 mt-1">
                        +{order.pointsEarned} điểm
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm text-center"
                        >
                          Chi tiết
                        </Link>

                        <StatusDropdown
                          order={order}
                          onUpdate={handleUpdateStatus}
                          updating={updatingOrder}
                        />

                        {/* Chỉ hiện nút hủy khi chưa hủy */}
                        {order.status !== "CANCELLED" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, "CANCELLED")
                            }
                            disabled={updatingOrder === order.id}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                          >
                            Hủy đơn
                          </button>
                        )}
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
                trong tổng số {pagination.total} đơn hàng
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
                    let pageNum: number;
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

      {/* Order Processing Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            📋 Quy trình xử lý đơn hàng
          </h3>
          <ol className="text-yellow-700 space-y-2 list-decimal list-inside">
            <li>
              Đơn hàng mới → <span className="font-medium">Chờ xử lý</span>
            </li>
            <li>
              Xác nhận đơn → <span className="font-medium">Đang chuẩn bị</span>
            </li>
            <li>
              Hoàn thành món → <span className="font-medium">Sẵn sàng</span>
            </li>
            <li>
              Khách nhận hàng → <span className="font-medium">Hoàn thành</span>
            </li>
            <li>
              Hủy đơn → <span className="font-medium">Đã hủy</span> (chỉ khi
              cần)
            </li>
          </ol>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            ⚡ Chức năng mới
          </h3>
          <ul className="text-blue-700 space-y-1">
            <li>
              • <strong>Chuyển trạng thái tự do</strong>: Click "Chuyển trạng
              thái" để chọn bất kỳ trạng thái nào
            </li>
            <li>
              • <strong>Stats tự động update</strong>: Số liệu cập nhật ngay khi
              chuyển trạng thái
            </li>
            <li>
              • <strong>Hủy đơn bất kỳ lúc nào</strong>: Nút hủy cho tất cả đơn
              chưa hủy
            </li>
            <li>
              • <strong>Xác nhận an toàn</strong>: Luôn có popup xác nhận trước
              khi thay đổi
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
