// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Gọi API đăng nhập
      const result = await authApi.login(email, password);

      if (result.success) {
        // Lưu token và user info
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        // Hiển thị thông báo thành công
        alert(`👋 Chào mừng ${result.user.name} quay trở lại!`);
        if (result.user.role === "ADMIN" || result.user.role === "STAFF") {
          router.push("/admin"); // Đến trang admin
        } else {
          router.push("/"); // Đến trang chủ user
        }
        router.refresh();
      } else {
        throw new Error(result.message || "Đăng nhập thất bại");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Đăng Nhập
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Đăng nhập để tích điểm và nhận ưu đãi
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                placeholder="Nhập email"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8B4513] hover:bg-[#7a3c12] text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng Nhập"
              )}
            </button>

            <div className="text-center">
              <Link
                href="/register"
                className="text-[#8B4513] hover:text-[#7a3c12] font-medium"
              >
                Chưa có tài khoản? Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
