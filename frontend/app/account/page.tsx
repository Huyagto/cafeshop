// app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { authApi, getCurrentUser, logout } from "@/lib/api"; // Sửa import

// Định nghĩa kiểu dữ liệu User
interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
  role: string;
  createdAt: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // Kiểm tra xem user đã đăng nhập chưa
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }

        // Sửa: gọi API đúng cách từ authApi
        const profileData = await authApi.getProfile();
        setUser(profileData);

        // Cập nhật localStorage với thông tin mới nhất
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(profileData));
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin tài khoản");
        console.error("Error fetching profile:", err);

        // Nếu lỗi 401 hoặc "Chưa đăng nhập", chuyển hướng về login
        if (err.message === "Chưa đăng nhập" || err.message.includes("401")) {
          logout();
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <TopNav />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopNav />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-red-500 mr-3"
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
                <p className="text-red-700">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <TopNav />

      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Tài khoản của tôi
            </h1>
            <p className="text-gray-600 mt-2">
              Quản lý thông tin tài khoản và theo dõi điểm tích lũy
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Thông tin chính */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Thông tin cá nhân
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Tên */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-300">
                      <svg
                        className="w-5 h-5 text-gray-500 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="text-gray-900 font-medium">
                        {user.name}
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-300">
                      <svg
                        className="w-5 h-5 text-gray-500 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-300">
                      <svg
                        className="w-5 h-5 text-gray-500 mr-3"
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
                      <span className="text-gray-900">
                        {user.phone || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  {/* Thành viên từ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thành viên từ
                    </label>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-300">
                      <svg
                        className="w-5 h-5 text-gray-500 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-900">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => router.push("/account/edit")}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                  >
                    Chỉnh sửa thông tin
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar - Điểm tích lũy */}
            <div className="space-y-6">
              {/* Card Điểm tích lũy */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Điểm Highlands</h3>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold mb-2">
                      {user.loyaltyPoints}
                    </div>
                    <p className="text-amber-100">điểm</p>
                  </div>

                  <div className="text-sm text-amber-100">
                    <p>• 100 điểm = 10.000đ giảm giá</p>
                    <p>• Tích điểm khi mua hàng</p>
                  </div>
                </div>
              </div>

              {/* Menu phụ */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Tài khoản</h3>
                </div>

                <nav className="p-2">
                  <button
                    onClick={() => router.push("/order")}
                    className="flex items-center w-full p-3 text-left hover:bg-gray-50 rounded-lg transition"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500 mr-3"
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
                    <span>Đơn hàng của tôi</span>
                  </button>

                  <button
                    onClick={() => router.push("/account/address")}
                    className="flex items-center w-full p-3 text-left hover:bg-gray-50 rounded-lg transition"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500 mr-3"
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
                    <span>Sổ địa chỉ</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full p-3 text-left hover:bg-gray-50 rounded-lg transition text-red-600"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
