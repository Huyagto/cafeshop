// components/orders/OrderCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
    total: number | string;
    pointsEarned: number;
    isKiosk: boolean;
    createdAt: string;
    items: Array<{
      id: string;
      productId: string;
      productName: string; 
      quantity: number;
      price: number | string;
      subtotal?: number | string;
    }>;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log(`📦 OrderCard mounted: ${order.orderNumber}`);
    setMounted(true);
  }, [order]);

  const formatCurrency = (value: number | string) => {
    if (value === undefined || value === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLinkClick = () => {
    console.log('🔗 Link clicked for order:', order.orderNumber);
    setLoading(true);
  };

  console.log(`🔄 OrderCard render: ${order.orderNumber}, loading: ${loading}`);

  return (
    <Link 
      href={`/orders/${order.id}`}
      className="block" // 👈 Thêm block để fill chiều rộng
      onClick={handleLinkClick}
    >
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-[#8B4513] h-full flex flex-col group relative">
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B4513]"></div>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#8B4513] transition-colors">
                Đơn hàng #{order.orderNumber}
              </h3>
              <p className="text-sm text-gray-600">
                📅 {formatDate(order.createdAt)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Debug Info - Remove in production */}
          <div className="mb-3 p-2 bg-gray-50 rounded-lg text-xs">
            <div className="font-medium mb-1">Debug Info:</div>
            <div>Order ID: {order.id.substring(0, 8)}...</div>
            <div>Items: {order.items.length} sản phẩm</div>
            <div>Is Kiosk: {order.isKiosk.toString()}</div>
          </div>
        </div>

        {/* Items Preview */}
        <div className="p-5 flex-grow">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm:</h4>
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-700">{item.quantity}</span>
                  </div>
                  <span className="text-sm text-gray-800 truncate">
                    {item.productName || 'Sản phẩm không xác định'}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{order.items.length - 3} sản phẩm khác...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Tổng tiền</div>
              <div className="text-xl font-bold text-[#8B4513]">
                {formatCurrency(order.total)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Điểm tích lũy</div>
              <div className="text-lg font-bold text-blue-600">
                +{order.pointsEarned} điểm
              </div>
            </div>
          </div>

          {/* View Details Text (not a button) */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[#8B4513] font-medium group-hover:text-amber-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Xem chi tiết</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Delivery Type */}
          <div className="mt-3 text-center">
            <span className="inline-flex items-center text-sm text-gray-600">
              {order.isKiosk ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Đặt tại quầy
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Giao hàng tận nơi
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}