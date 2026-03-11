'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
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
    loyaltyPoints: number;
  };
  items: OrderItem[];
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50' },
  { value: 'PREPARING', label: 'Đang chuẩn bị', color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50' },
  { value: 'READY', label: 'Sẵn sàng', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800', bgColor: 'bg-red-50' },
];

const STATUS_FLOW = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const IMAGE_BASE_URL = "http://localhost:4000";

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getOrderDetails(orderId);
      setOrder(response.data);
      setNewStatus(response.data.status);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết đơn hàng');
      console.error('Order detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || newStatus === order.status) return;
    
    if (!confirm(`Bạn có chắc chắn muốn chuyển trạng thái đơn hàng #${order.orderNumber}?`)) {
      return;
    }

    try {
      setUpdating(true);
      await adminApi.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrder(prev => prev ? {
        ...prev,
        status: newStatus as any,
        updatedAt: new Date().toISOString()
      } : null);
      
      alert('Cập nhật trạng thái thành công!');
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const calculateSubtotal = () => {
    if (!order) return 0;
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Quay lại
          </Link>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order info skeleton */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 border-b flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          
          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded mb-2"></div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              {[1, 2].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded mb-2"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Quay lại
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-red-600 mb-4">{error || 'Đơn hàng không tồn tại hoặc đã bị xóa'}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={fetchOrderDetails}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
            <Link
              href="/admin/orders"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const subtotal = calculateSubtotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Quay lại
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Đơn hàng #{order.orderNumber}
            </h1>
            <p className="text-gray-500 text-sm">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 ${statusInfo.color} text-sm rounded-full`}>
            {statusInfo.label}
          </span>
          {order.isKiosk && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              🏪 KIOSK
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Order items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Sản phẩm đã đặt</h2>
            </div>
            
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="p-6 flex items-center">
                  <div className="flex items-center flex-1">
                    {item.product.image ? (
  <img
    src={
      item.product.image.startsWith("http")
        ? item.product.image
        : `${IMAGE_BASE_URL}${item.product.image}`
    }
    alt={item.product.name}
    className="h-16 w-16 rounded object-cover"
  />
) : (
                      <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">🛍️</span>
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">Đơn giá: {formatPrice(item.product.price)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.quantity} × {formatPrice(item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="space-y-3 max-w-md ml-auto">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium">{formatPrice(0)}</span>
                </div>
                {order.isKiosk && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giảm giá KIOSK:</span>
                    <span className="font-medium text-green-600">-{formatPrice(0)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-lg font-semibold text-gray-800">Tổng cộng:</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Điểm tích lũy:</span>
                  <span className="font-medium text-blue-600">+{order.pointsEarned} điểm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order notes */}
          {order.notes && (
            <div className={`bg-white rounded-xl shadow p-6 ${statusInfo.bgColor}`}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">📝 Ghi chú đặc biệt</h2>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-gray-700 whitespace-pre-line">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Status timeline */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">📋 Tiến trình đơn hàng</h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {STATUS_FLOW.map((status, index) => {
                const isCompleted = STATUS_FLOW.indexOf(order.status) >= STATUS_FLOW.indexOf(status);
                const isCurrent = order.status === status;
                const statusOpt = STATUS_OPTIONS.find(s => s.value === status);
                
                return (
                  <div key={status} className="relative flex items-start mb-8 last:mb-0">
                    {/* Circle */}
                    <div className={`z-10 flex-shrink-0 w-8 h-8 rounded-full border-4 border-white ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                    
                    {/* Content */}
                    <div className="ml-6 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`font-medium ${
                            isCurrent ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {statusOpt?.label}
                          </h3>
                          {isCurrent && (
                            <p className="text-sm text-gray-500 mt-1">
                              Đang ở trạng thái này
                            </p>
                          )}
                          {status === order.status && order.updatedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Cập nhật: {formatDate(order.updatedAt)}
                            </p>
                          )}
                        </div>
                        
                        {isCompleted && status !== order.status && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Đã hoàn thành
                          </span>
                        )}
                      </div>
                      
                      {/* Status description */}
                      {index < STATUS_FLOW.length - 1 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {status === 'PENDING' && 'Đơn hàng đã được đặt và đang chờ xác nhận'}
                          {status === 'PREPARING' && 'Đơn hàng đang được chuẩn bị'}
                          {status === 'READY' && 'Đơn hàng đã sẵn sàng để giao/đem đi'}
                          {status === 'COMPLETED' && 'Đơn hàng đã được giao thành công'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Cancelled status (outside normal flow) */}
              {order.status === 'CANCELLED' && (
                <div className="relative flex items-start mt-8">
                  <div className="z-10 flex-shrink-0 w-8 h-8 rounded-full border-4 border-white bg-red-500"></div>
                  <div className="ml-6">
                    <h3 className="font-medium text-red-700">Đã hủy</h3>
                    <p className="text-sm text-gray-500 mt-1">Đơn hàng đã bị hủy</p>
                    {order.updatedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Hủy lúc: {formatDate(order.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">👤 Thông tin khách hàng</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Họ tên</p>
                <p className="font-medium text-gray-900">{order.user.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{order.user.email}</p>
              </div>
              
              {order.user.phone && (
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium text-gray-900">{order.user.phone}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Điểm tích lũy hiện có</p>
                <p className="font-medium text-blue-600">{order.user.loyaltyPoints.toLocaleString()} điểm</p>
              </div>
              
              <div className="pt-4 border-t">
                <Link
                  href={`/admin/users`}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm inline-block"
                >
                  Xem tất cả đơn hàng của khách
                </Link>
              </div>
            </div>
          </div>

          {/* Update status */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🔄 Cập nhật trạng thái</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái mới
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.filter(opt => opt.value !== 'all').map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === order.status}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
              </button>
              
              {newStatus !== order.status && (
                <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded">
                  <p className="font-medium">Thay đổi:</p>
                  <p className="mt-1">
                    <span className={`px-2 py-1 ${statusInfo.color} text-xs rounded mr-2`}>
                      {statusInfo.label}
                    </span>
                    → 
                    <span className={`px-2 py-1 ${getStatusInfo(newStatus).color} text-xs rounded ml-2`}>
                      {getStatusInfo(newStatus).label}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order metadata */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📄 Thông tin bổ sung</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-mono font-medium">#{order.orderNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Cập nhật cuối:</span>
                <span className="font-medium">{formatDate(order.updatedAt)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Loại đơn hàng:</span>
                <span className="font-medium">
                  {order.isKiosk ? 'Tại quán (KIOSK)' : 'Online'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">ID đơn hàng:</span>
                <span className="font-mono text-xs text-gray-500">{order.id}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">⚡ Thao tác nhanh</h3>
            
            <div className="space-y-2">
              <Link
                href={`/admin/orders?search=${order.orderNumber}`}
                className="block px-3 py-2 bg-white text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
              >
                🔍 Tìm đơn hàng tương tự
              </Link>
              
              <Link
                href={`/admin/orders?search=${order.user.email}`}
                className="block px-3 py-2 bg-white text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
              >
                👤 Xem tất cả đơn của khách
              </Link>
              
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(order.orderNumber);
                    alert('Đã copy mã đơn hàng!');
                  }
                }}
                className="w-full text-left px-3 py-2 bg-white text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
              >
                📋 Copy mã đơn hàng
              </button>
              
              <Link
                href="/admin/orders"
                className="block px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm text-center"
              >
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}