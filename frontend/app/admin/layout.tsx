// app/admin/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Sản phẩm', icon: '🛍️' },
  { href: '/admin/categories', label: 'Danh mục', icon: '📁' },
  { href: '/admin/users', label: 'Người dùng', icon: '👥' },
  { href: '/admin/orders', label: 'Đơn hàng', icon: '📦' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Coffee Loyalty</p>
        </div>
        
        <nav className="mt-6 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
}