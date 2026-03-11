// components/orders/OrderStatusBadge.tsx
'use client';

import { useState, useEffect } from 'react';

interface OrderStatusBadgeProps {
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  size?: 'sm' | 'md' | 'lg';
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log(`🏷️ OrderStatusBadge mounted: ${status}`);
    setMounted(true);
  }, [status]);

  const statusConfig = {
    PENDING: {
      label: 'Chờ xác nhận',
      textColor: 'text-yellow-800',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
    },
    PREPARING: {
      label: 'Đang chuẩn bị',
      textColor: 'text-blue-800',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
    },
    READY: {
      label: 'Sẵn sàng',
      textColor: 'text-green-800',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
    },
    COMPLETED: {
      label: 'Hoàn thành',
      textColor: 'text-purple-800',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
    },
    CANCELLED: {
      label: 'Đã hủy',
      textColor: 'text-red-800',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[status];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  console.log(`🔄 OrderStatusBadge render: ${status}, size: ${size}`);

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
    >
      {/* Debug dot */}
      {mounted && (
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {config.label}
    </span>
  );
}