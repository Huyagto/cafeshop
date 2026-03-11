// components/TopNav.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '@/lib/api';

export default function TopNav() {
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userData = getCurrentUser();
    setUser(userData);
    
    // Lắng nghe sự kiện storage change (khi login/logout ở tab khác)
    const handleStorageChange = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setShowDropdown(false);
  };

  // QUAN TRỌNG: Phải trả về JSX
  return (
    <nav className="bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Logo/Thương hiệu */}
          <div className="text-sm font-semibold">
            COFFEE LOYATY®
          </div>

          {/* Menu chính */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <Link href="/" className="hover:text-gray-300 transition">
              Trang chủ
            </Link>
            <Link href="/product" className="hover:text-gray-300 transition">
              Sản phẩm
            </Link>
            <Link href="/orders" className="hover:text-gray-300 transition">
              Đơn hàng
            </Link>
            <Link href="/account" className="hover:text-gray-300 transition">
              Tài khoản
            </Link>
            <Link href="/cart" className="hover:text-gray-300 transition">
              Giỏ hàng
            </Link>
          </div>

          {/* Auth section */}
          <div className="relative">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">Xin chào, {user.name}</span>
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-1 hover:text-gray-300"
                  >
                    <span>Tài khoản</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Thông tin tài khoản
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Đơn hàng của tôi
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4 text-sm">
                <Link href="/login" className="hover:text-gray-300 transition">
                  Đăng nhập
                </Link>
                <span>|</span>
                <Link href="/register" className="hover:text-gray-300 transition">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} // Đóng component với return statement