"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { userApi } from "@/lib/api"; // ← Thay đổi import này

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
}

interface UpdateUserData {
  name: string;
  phone: string;
  role: "ADMIN" | "CUSTOMER";
  loyaltyPoints?: number;
  password?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [formData, setFormData] = useState<UpdateUserData>({
    name: "",
    phone: "",
    role: "CUSTOMER",
  });

  // Password reset
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loyalty points adjustment
  const [pointsAdjustment, setPointsAdjustment] = useState({
    type: "add" as "add" | "subtract",
    amount: 0,
    reason: "",
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await userApi.getUserById(userId); // ← Thay đổi thành userApi
      const userData = response.data;
      setUser(userData);
      setFormData({
        name: userData.name || "",
        phone: userData.phone || "",
        role: userData.role || "CUSTOMER",
        loyaltyPoints: userData.loyaltyPoints,
      });
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin người dùng");
      console.error("Fetch user error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "loyaltyPoints" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Prepare update data
      const updateData: UpdateUserData = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
      };

      // Only include loyaltyPoints if changed
      if (formData.loyaltyPoints !== user.loyaltyPoints) {
        updateData.loyaltyPoints = formData.loyaltyPoints;
      }

      await userApi.updateUser(userId, updateData); // ← Thay đổi thành userApi
      
      setSuccess("Cập nhật thông tin thành công!");
      setTimeout(() => {
        router.push("/admin/users");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật thông tin người dùng");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await userApi.resetPassword(userId, newPassword); // ← Thay đổi thành userApi
      setSuccess("Đặt lại mật khẩu thành công!");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordReset(false);
    } catch (err: any) {
      setError(err.message || "Không thể đặt lại mật khẩu");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (pointsAdjustment.amount <= 0) {
      setError("Số điểm phải lớn hơn 0");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await userApi.updateLoyaltyPoints( // ← Thay đổi thành userApi
        userId,
        pointsAdjustment.amount,
        pointsAdjustment.type,
        pointsAdjustment.reason || undefined
      );
      setSuccess(`Đã ${pointsAdjustment.type === 'add' ? 'cộng' : 'trừ'} ${pointsAdjustment.amount} điểm thành công!`);
      setPointsAdjustment({ type: "add", amount: 0, reason: "" });
      fetchUser(); // Refresh user data
    } catch (err: any) {
      setError(err.message || "Không thể điều chỉnh điểm");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (newRole: "ADMIN" | "CUSTOMER") => {
    if (!confirm(`Bạn có chắc muốn đổi vai trò người dùng thành ${newRole === 'ADMIN' ? 'ADMIN' : 'KHÁCH HÀNG'}?`)) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await userApi.changeUserRole(userId, newRole); // ← Thay đổi thành userApi
      setSuccess(`Đã đổi vai trò thành ${newRole === 'ADMIN' ? 'ADMIN' : 'KHÁCH HÀNG'}`);
      fetchUser(); // Refresh user data
    } catch (err: any) {
      setError(err.message || "Không thể đổi vai trò");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?\nHành động này không thể hoàn tác.")) {
      return;
    }

    try {
      setSaving(true);
      await userApi.deleteUser(userId); // ← Thay đổi thành userApi
      alert("Xóa người dùng thành công!");
      router.push("/admin/users");
    } catch (err: any) {
      setError(err.message || "Không thể xóa người dùng");
    } finally {
      setSaving(false);
    }
  };

  // ... (phần còn lại của code giữ nguyên)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("vi-VN").format(points);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy người dùng</h2>
            <p className="text-gray-600 mb-6">Người dùng với ID này không tồn tại hoặc đã bị xóa</p>
            <Link
              href="/admin/users"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/users"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Quay lại"
            >
              ←
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Chỉnh sửa người dùng</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin cơ bản</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CUSTOMER">Khách hàng</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleChangeRole(formData.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Đổi ngay
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điểm tích lũy
                    </label>
                    <input
                      type="number"
                      name="loyaltyPoints"
                      value={formData.loyaltyPoints || 0}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/admin/users")}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>

            {/* Loyalty Points Adjustment */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Điều chỉnh điểm tích lũy</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điểm
                    </label>
                    <input
                      type="number"
                      value={pointsAdjustment.amount}
                      onChange={(e) => setPointsAdjustment(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                      min="0"
                      placeholder="Nhập số điểm"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại điều chỉnh
                    </label>
                    <select
                      value={pointsAdjustment.type}
                      onChange={(e) => setPointsAdjustment(prev => ({ ...prev, type: e.target.value as "add" | "subtract" }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="add">Cộng điểm</option>
                      <option value="subtract">Trừ điểm</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={pointsAdjustment.reason}
                    onChange={(e) => setPointsAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Ví dụ: Điểm thưởng khách hàng thân thiết"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleAdjustPoints}
                  disabled={saving || pointsAdjustment.amount <= 0}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {pointsAdjustment.type === 'add' ? 'Cộng điểm' : 'Trừ điểm'}
                </button>
                <p className="text-sm text-gray-500">
                  Điểm hiện tại: <strong>{formatPoints(user.loyaltyPoints)} điểm</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* User Summary */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin tài khoản</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID người dùng:</span>
                  <span className="font-mono text-sm text-gray-800">{user.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="text-gray-800">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vai trò:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role === 'ADMIN' ? '👑 Admin' : '👤 Khách hàng'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm tích lũy:</span>
                  <span className="font-semibold text-gray-800">{formatPoints(user.loyaltyPoints)} điểm</span>
                </div>
              </div>
            </div>

            {/* Password Reset */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Đặt lại mật khẩu</h3>
              
              {!showPasswordReset ? (
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="w-full px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🔑</span>
                  <span>Đặt lại mật khẩu</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetPassword}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordReset(false);
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">
                Mật khẩu mới sẽ được gửi đến email của người dùng và yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
              </p>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Khu vực nguy hiểm</h3>
              <p className="text-sm text-red-700 mb-4">
                Các hành động này không thể hoàn tác. Vui lòng cân nhắc kỹ trước khi thực hiện.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleDeleteUser}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>🗑️</span>
                  <span>Xóa người dùng này</span>
                </button>

                <button
                  onClick={() => handleChangeRole(user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>👑</span>
                  <span>Chuyển thành {user.role === 'ADMIN' ? 'Khách hàng' : 'Admin'}</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn đặt điểm tích lũy về 0?`)) {
                      setFormData(prev => ({ ...prev, loyaltyPoints: 0 }));
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  <span>Reset điểm về 0</span>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Hành động nhanh</h3>
              <div className="space-y-3">
                <Link
                  href={`/admin/orders?userId=${user.id}`}
                  className="block p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition-colors flex items-center gap-3"
                >
                  <span className="text-blue-600">📦</span>
                  <div>
                    <div className="font-medium text-gray-800">Xem đơn hàng</div>
                    <div className="text-xs text-gray-500">Lịch sử mua hàng</div>
                  </div>
                </Link>

                <Link
                  href={`/admin/users/new`}
                  className="block p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition-colors flex items-center gap-3"
                >
                  <span className="text-blue-600">👤</span>
                  <div>
                    <div className="font-medium text-gray-800">Thêm người dùng mới</div>
                    <div className="text-xs text-gray-500">Tạo tài khoản mới</div>
                  </div>
                </Link>

                <button
                  onClick={fetchUser}
                  className="w-full p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  <span>Tải lại thông tin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}