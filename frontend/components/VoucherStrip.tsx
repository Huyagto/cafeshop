// components/VoucherStrip.tsx
'use client';
import { Voucher } from "@/types/catalog";

type Props = {
  vouchers: Voucher[];
};

function formatVoucherAmount(v: Voucher): string {
  if (v.type === "FIXED") {
    return `${(v.discount / 1000).toFixed(0)}K`;
  }
  if (v.type === "PERCENTAGE") {
    return `${v.discount.toFixed(0)}%`;
  }
  return "QUÀ";
}

export function VoucherStrip({ vouchers }: Props) {
  if (!vouchers.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 mb-6">
      {vouchers.map((v) => (
        <div
          key={v.id}
          className="min-w-[260px] bg-white border border-gray-200 rounded-md shadow-sm flex items-center px-4 py-3"
        >
          <div className="text-center bg-primary text-white rounded-md px-3 py-2 mr-4">
            <p className="text-xs">TẶNG</p>
            <p className="text-2xl font-bold">{formatVoucherAmount(v)}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-700">
              NHẬP MÃ: {v.code}
            </p>
            <p className="text-xs text-gray-500 line-clamp-2">
              {v.description || v.name}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <button className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-md">
                Sao chép mã
              </button>
              <button className="text-xs text-primary underline">
                Điều kiện
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
