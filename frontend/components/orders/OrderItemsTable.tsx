// app/orders/components/OrderItemsTable.tsx
'use client';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image?: string;
  };
}

interface OrderItemsTableProps {
  items: OrderItem[];
}

export default function OrderItemsTable({ items }: OrderItemsTableProps) {
  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(value));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sản phẩm
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Đơn giá
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Số lượng
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thành tiền
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {item.product.image && (
                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={item.product.image}
                        alt={item.product.name}
                      />
                    </div>
                  )}
                  <div className="font-medium text-gray-900">{item.product.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(item.price)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.quantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatCurrency(Number(item.price) * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
              Tổng cộng
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
              {formatCurrency(
                items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}