"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";

type VoucherType = "FIXED" | "PERCENTAGE" | "FREE_ITEM";

interface VoucherFormData {
  code: string;
  name: string;
  description: string;
  type: VoucherType;
  discount: number;
  minPoints: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  active: boolean;
}

export default function AdminCreateVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Định dạng ngày giờ cho input datetime-local
  useEffect(() => {
    const now = new Date();
    // Đặt thời gian thành giờ phút hiện tại
    const formatted = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setCurrentDateTime(formatted);
  }, []);

  const [form, setForm] = useState<VoucherFormData>({
    code: "",
    name: "",
    description: "",
    type: "FIXED",
    discount: 0,
    minPoints: 0,
    validFrom: "", // Không bắt buộc, để trống sẽ dùng mặc định now()
    validUntil: "",
    maxUses: 1,
    active: true,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, code }));
  };

  const validateForm = (): boolean => {
    if (!form.code.trim()) {
      setError("Vui lòng nhập mã voucher");
      return false;
    }
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên voucher");
      return false;
    }
    if (!form.validUntil) {
      setError("Vui lòng chọn thời hạn sử dụng");
      return false;
    }
    if (form.discount <= 0) {
      setError("Giá trị giảm phải lớn hơn 0");
      return false;
    }
    if (form.maxUses <= 0) {
      setError("Số lần sử dụng tối đa phải lớn hơn 0");
      return false;
    }

    // Kiểm tra thời gian hợp lệ
    const validFrom = form.validFrom ? new Date(form.validFrom) : new Date();
    const validUntil = new Date(form.validUntil);
    if (validUntil <= validFrom) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return false;
    }

    // Kiểm tra discount theo loại
    if (form.type === "PERCENTAGE" && form.discount > 100) {
      setError("Phần trăm giảm không được vượt quá 100%");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Chuẩn bị data gửi lên API
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        discount: Number(form.discount),
        minPoints: Number(form.minPoints),
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil,
        maxUses: Number(form.maxUses),
        active: form.active,
      };

      await adminApi.createVoucher(payload);

      alert("Tạo voucher thành công!");
      router.push("/admin/vouchers"); // Hoặc /admin nếu bạn muốn
    } catch (err: any) {
      console.error("Create voucher error:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Không thể tạo voucher. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // Các loại voucher theo schema
  const voucherTypes = [
    { value: "FIXED", label: "Giảm tiền cố định" },
    { value: "PERCENTAGE", label: "Giảm theo phần trăm" },
    { value: "FREE_ITEM", label: "Miễn phí sản phẩm" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Tạo voucher mới
          </h1>
          <p className="text-gray-600 mt-1">
            Tạo mã giảm giá cho khách hàng
          </p>
        </div>

        <Link
          href="/admin/vouchers"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mã voucher */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã voucher <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                placeholder="VD: SUMMER2024"
                required
              />
              <button
                type="button"
                onClick={generateRandomCode}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Tạo mã
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mã phải là duy nhất, viết hoa không dấu
            </p>
          </div>

          {/* Tên voucher */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên voucher <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
              placeholder="VD: Giảm 20% mùa hè"
              required
            />
          </div>

          {/* Mô tả */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
              placeholder="Mô tả chi tiết về voucher..."
            />
          </div>

          {/* Loại voucher */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại voucher <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
            >
              {voucherTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Giá trị giảm */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá trị giảm <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="discount"
                value={form.discount}
                onChange={handleChange}
                min="0"
                step={form.type === "PERCENTAGE" ? "1" : "1000"}
                className="w-full border rounded-lg px-4 py-2 pl-12 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                required
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {form.type === "PERCENTAGE" ? "%" : "₫"}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {form.type === "PERCENTAGE"
                ? "Nhập số phần trăm (0-100)"
                : "Nhập số tiền giảm"}
            </p>
          </div>

          {/* Điểm loyalty cần thiết */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Điểm loyalty cần thiết
            </label>
            <input
              type="number"
              name="minPoints"
              value={form.minPoints}
              onChange={handleChange}
              min="0"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Số điểm cần để đổi voucher (0 = không cần)
            </p>
          </div>

          {/* Số lần sử dụng tối đa */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lần sử dụng tối đa <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="maxUses"
              value={form.maxUses}
              onChange={handleChange}
              min="1"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Số lần voucher có thể được sử dụng
            </p>
          </div>

          {/* Thời gian bắt đầu */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian bắt đầu
            </label>
            <input
              type="datetime-local"
              name="validFrom"
              value={form.validFrom}
              onChange={handleChange}
              min={currentDateTime}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Để trống để bắt đầu ngay lập tức
            </p>
          </div>

          {/* Thời gian kết thúc */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="validUntil"
              value={form.validUntil}
              onChange={handleChange}
              min={form.validFrom || currentDateTime}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
              required
            />
          </div>

          {/* Trạng thái */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="h-5 w-5 text-[#8B4513] rounded"
              />
              <div>
                <label htmlFor="active" className="font-medium text-gray-700">
                  Kích hoạt voucher ngay
                </label>
                <p className="text-sm text-gray-500">
                  Voucher sẽ có hiệu lực ngay sau khi tạo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Link
            href="/admin/vouchers"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#8B4513] text-white rounded-lg hover:bg-[#7a3c12] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Đang tạo...</span>
              </>
            ) : (
              "Tạo voucher"
            )}
          </button>
        </div>
      </form>

      {/* Thông tin hướng dẫn */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">
          💡 Lưu ý khi tạo voucher
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Mã voucher phải là duy nhất trong hệ thống</li>
          <li>• Voucher dạng FIXED: giảm số tiền cố định</li>
          <li>• Voucher dạng PERCENTAGE: giảm theo phần trăm đơn hàng</li>
          <li>• Voucher dạng FREE_ITEM: tặng sản phẩm miễn phí</li>
          <li>• Thời gian kết thúc phải sau thời gian bắt đầu</li>
          <li>• Điểm loyalty: số điểm tối thiểu khách cần để đổi voucher</li>
        </ul>
      </div>
    </div>
  );
}