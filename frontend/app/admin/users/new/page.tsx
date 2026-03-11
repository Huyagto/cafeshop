// app/admin/users/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { userApi } from "@/lib/api";

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER" as "CUSTOMER" | "STAFF" | "ADMIN",
    loyaltyPoints: 0,
    sendWelcomeEmail: false,
    generateRandomPassword: false,
  });

  // Hàm xử lý quay lại
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin/users");
    }
  };

  // Hàm xử lý thay đổi input
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "loyaltyPoints") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Hàm tạo mật khẩu ngẫu nhiên
  const generateRandomPassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setFormData((prev) => ({
      ...prev,
      password,
      confirmPassword: password,
      generateRandomPassword: true,
    }));
  };

  // Hàm validate form
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.email.trim()) {
      errors.push("Email là bắt buộc");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Email không hợp lệ");
    }

    if (!formData.name.trim()) {
      errors.push("Tên là bắt buộc");
    }

    if (!formData.generateRandomPassword) {
      if (!formData.password) {
        errors.push("Mật khẩu là bắt buộc");
      } else if (formData.password.length < 6) {
        errors.push("Mật khẩu phải có ít nhất 6 ký tự");
      }

      if (formData.password !== formData.confirmPassword) {
        errors.push("Mật khẩu xác nhận không khớp");
      }
    }

    if (formData.loyaltyPoints < 0) {
      errors.push("Điểm tích lũy không được âm");
    }

    return errors;
  };

  // Hàm xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(", "));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dataToSend = {
        email: formData.email.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        role: formData.role,
        loyaltyPoints: formData.loyaltyPoints,
        sendWelcomeEmail: formData.sendWelcomeEmail,
      };

      await userApi.createUser(dataToSend);

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/users");
      }, 2000);
    } catch (err: any) {
      setError(
        err.message ||
          "Không thể tạo người dùng. Vui lòng kiểm tra lại thông tin."
      );
      console.error("Create user error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm reset form
  const handleReset = () => {
    setFormData({
      email: "",
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "CUSTOMER",
      loyaltyPoints: 0,
      sendWelcomeEmail: false,
      generateRandomPassword: false,
    });
    setError("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Thêm người dùng mới
          </h1>
          <p className="text-gray-600 mt-1">
            Tạo tài khoản người dùng mới trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>↩️</span>
            <span>Quay lại</span>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Thành công!
              </h3>
              <p className="text-green-700">
                Người dùng đã được tạo thành công. Đang chuyển hướng...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && !success && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0987654321"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CUSTOMER">Khách hàng</option>

                      <option value="ADMIN">Quản trị viên</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Mật khẩu
                  </h3>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                  >
                    🔐 Tạo mật khẩu ngẫu nhiên
                  </button>
                </div>

                {formData.generateRandomPassword ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800">
                      Mật khẩu đã được tạo tự động:{" "}
                      <code className="bg-yellow-100 px-2 py-1 rounded font-mono">
                        {formData.password}
                      </code>
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      Vui lòng lưu lại mật khẩu này để cung cấp cho người dùng.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Ít nhất 6 ký tự"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Xác nhận mật khẩu{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Cài đặt bổ sung
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điểm tích lũy ban đầu
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="loyaltyPoints"
                        value={formData.loyaltyPoints}
                        onChange={handleChange}
                        min="0"
                        max="1000000"
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">điểm</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Cấp điểm ban đầu cho người dùng (0-1,000,000 điểm)
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="sendWelcomeEmail"
                      id="sendWelcomeEmail"
                      checked={formData.sendWelcomeEmail}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="sendWelcomeEmail"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Gửi email chào mừng và hướng dẫn sử dụng
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span>👤</span>
                      <span>Tạo người dùng</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar - Information */}
        <div className="space-y-6">
          {/* Role Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Thông tin vai trò
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    👤 Khách hàng
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Có thể đặt hàng, tích điểm và sử dụng voucher
                </p>
              </div>


              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    👑 Quản trị viên
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Toàn quyền truy cập hệ thống và tất cả tính năng
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Mẹo hữu ích
            </h3>
            <ul className="text-blue-700 space-y-2 text-sm">
              <li>• Sử dụng email thật để người dùng có thể nhận thông báo</li>
              <li>• Nhân viên/quản trị viên nên có số điện thoại liên lạc</li>
              <li>
                • Gửi email chào mừng giúp người dùng làm quen với hệ thống
              </li>
              <li>• Cấp điểm tích lũy ban đầu để khuyến khích mua hàng</li>
              <li>• Lưu lại mật khẩu khi tạo tài khoản cho nhân viên</li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Hành động nhanh
            </h3>
            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="block p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="font-medium text-gray-800">
                  📋 Danh sách người dùng
                </div>
              </Link>

              <button
                onClick={handleGoBack}
                className="w-full p-3 border border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-100 transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>↩️</span>
                <span className="font-medium text-gray-800">
                  Quay lại danh sách
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
