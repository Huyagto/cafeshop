"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/api";

type VoucherType = "FIXED" | "PERCENTAGE" | "FREE_ITEM";

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: VoucherType;
  discount: number;
  minPoints: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

interface VouchersResponse {
  vouchers: Voucher[];
  total: number;
}

export default function AdminVouchersPage() {
  const router = useRouter();
  
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<VoucherType | "all">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response: VouchersResponse = await adminApi.getVouchers();
      
      console.log("Vouchers response:", response);
      
      if (response && response.vouchers && Array.isArray(response.vouchers)) {
        setVouchers(response.vouchers);
        setTotal(response.total || response.vouchers.length);
      } else {
        console.error("Invalid response structure:", response);
        setVouchers([]);
        setTotal(0);
      }
      
    } catch (err: any) {
      console.error("Fetch vouchers error:", err);
      setError(err.message || "Không thể tải danh sách voucher");
      setVouchers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    try {
      await adminApi.deleteVoucher(id);
      setVouchers(vouchers.filter(v => v.id !== id));
      setTotal(prev => prev - 1);
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || "Không thể xóa voucher");
    }
  };

  const toggleVoucherStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminApi.updateVoucher(id, { active: !currentStatus });
      setVouchers(vouchers.map(v => 
        v.id === id ? { ...v, active: !currentStatus } : v
      ));
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật trạng thái");
    }
  };

  const getTypeLabel = (type: VoucherType) => {
    switch (type) {
      case "FIXED": return "Giảm tiền";
      case "PERCENTAGE": return "Giảm %";
      case "FREE_ITEM": return "Miễn phí";
      default: return type;
    }
  };

  const getTypeColor = (type: VoucherType) => {
    switch (type) {
      case "FIXED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PERCENTAGE": return "bg-purple-100 text-purple-800 border-purple-200";
      case "FREE_ITEM": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusStyle = (active: boolean, validUntil: string) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    
    if (!active) {
      return { 
        badge: "bg-gray-100 text-gray-800 border border-gray-300", 
        label: "Đã tắt",
        color: "text-gray-500"
      };
    }
    if (expiry < now) {
      return { 
        badge: "bg-red-100 text-red-800 border border-red-300", 
        label: "Hết hạn",
        color: "text-red-600"
      };
    }
    return { 
      badge: "bg-green-100 text-green-800 border border-green-300", 
      label: "Đang hoạt động",
      color: "text-green-600"
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter(voucher => {
    if (!voucher) return false;
    
    const matchesSearch = 
      (voucher.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (voucher.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && voucher.active) ||
      (statusFilter === "inactive" && !voucher.active);
    
    const matchesType = 
      typeFilter === "all" || voucher.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeVouchers = vouchers.filter(v => v.active && new Date(v.validUntil) > new Date());
  const expiredVouchers = vouchers.filter(v => new Date(v.validUntil) < new Date());
  const fixedVouchers = vouchers.filter(v => v.type === "FIXED");
  const percentageVouchers = vouchers.filter(v => v.type === "PERCENTAGE");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Voucher</h1>
            <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Filter skeleton */}
        <div className="bg-white rounded-xl shadow p-4 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Voucher</h1>
          <p className="text-gray-600 mt-1">
            Tổng: {total} voucher | 
            Đang hoạt động: {activeVouchers.length} | 
            Hết hạn: {expiredVouchers.length}
          </p>
        </div>
        <Link
          href="/admin/vouchers/new"
          className="px-4 py-2 bg-[#8B4513] text-white rounded-lg hover:bg-[#7a3c12] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Thêm voucher mới</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Mã, tên voucher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tắt</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại voucher
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
            >
              <option value="all">Tất cả loại</option>
              <option value="FIXED">Giảm tiền</option>
              <option value="PERCENTAGE">Giảm %</option>
              <option value="FREE_ITEM">Miễn phí</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              onClick={fetchVouchers}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Tải lại</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Tổng voucher</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Đang hoạt động</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{activeVouchers.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Giảm tiền (FIXED)</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{fixedVouchers.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Giảm % (PERCENTAGE)</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{percentageVouchers.length}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Vouchers List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Danh sách voucher ({filteredVouchers.length})
          </h2>
          <div className="text-sm text-gray-500">
            Hiển thị {filteredVouchers.length} trên {total} voucher
          </div>
        </div>

        {filteredVouchers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Không tìm thấy voucher phù hợp" 
                : "Chưa có voucher nào"}
            </p>
            {searchTerm || statusFilter !== "all" || typeFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="text-[#8B4513] hover:underline"
              >
                Xóa bộ lọc
              </button>
            ) : (
              <Link
                href="/admin/vouchers/new"
                className="inline-flex items-center gap-2 text-[#8B4513] hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tạo voucher đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredVouchers.map((voucher) => {
              const statusStyle = getStatusStyle(voucher.active, voucher.validUntil);
              const isExpired = new Date(voucher.validUntil) < new Date();
              
              return (
                <div key={voucher.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left side: Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Code */}
                        <div className="flex-shrink-0">
                          <div className="bg-gray-900 text-white font-bold text-lg px-4 py-2 rounded-lg text-center min-w-[120px]">
                            {voucher.code}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{voucher.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(voucher.type)}`}>
                              {getTypeLabel(voucher.type)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.badge}`}>
                              {statusStyle.label}
                            </span>
                          </div>

                          {voucher.description && (
                            <p className="text-gray-600 mb-3">{voucher.description}</p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Giá trị:</span>
                              <span className="font-bold text-lg">
                                {voucher.type === "PERCENTAGE"
                                  ? `${voucher.discount}%`
                                  : formatCurrency(voucher.discount)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Điểm cần:</span>
                              <span className={`font-semibold ${voucher.minPoints > 0 ? "text-blue-600" : "text-gray-600"}`}>
                                {voucher.minPoints} điểm
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Thời hạn:</span>
                              <span className={isExpired ? "text-red-600 font-medium" : "text-gray-600"}>
                                {formatDate(voucher.validUntil)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Tạo từ:</span>
                              <span className="text-gray-600">
                                {formatDateTime(voucher.validFrom)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => toggleVoucherStatus(voucher.id, voucher.active)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                          voucher.active
                            ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
                            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {voucher.active ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                        {voucher.active ? "Tắt" : "Bật"}
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(voucher.id)}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Xác nhận xóa voucher
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa voucher này không? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn voucher khỏi hệ thống.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleDeleteVoucher(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">💡 Mẹo quản lý voucher hiệu quả</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <span className="font-medium">Giảm tiền (FIXED):</span> Phù hợp cho đơn hàng giá trị thấp</li>
              <li>• <span className="font-medium">Giảm % (PERCENTAGE):</span> Hiệu quả cho đơn hàng giá trị cao</li>
              <li>• Kiểm tra thời hạn voucher định kỳ để tránh để voucher hết hạn</li>
              <li>• Đặt mức điểm hợp lý để kích thích khách hàng tích điểm</li>
              <li>• Tắt voucher trước khi xóa để không làm ảnh hưởng đến khách hàng đang sử dụng</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}