// src/views/OrderView.js
import ToppingView from './ToppingView.js';

class OrderView {
  list(orders) {
    return {
      orders: orders.map(o => this.format(o)),
      total: orders.length
    };
  }

  detail(order) {
    return this.format(order);
  }

  format(order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      pointsEarned: order.pointsEarned,
      isKiosk: order.isKiosk,
      notes: order.notes,

      items: (order.items || []).map(item => {
        const product = item.product || {};
        const isCombo = product.type === 'COMBO';

        return {
          id: item.id,
          productId: item.productId,
          productName: product.name || '',
          productImage: product.image || null,
          quantity: item.quantity,
          price: Number(item.price),

          // ✅ subtotal: COMBO chỉ tính giá combo
          subtotal: Number(item.price) * item.quantity,

          // ✅ HIỂN THỊ combo items – KHÔNG TÍNH TIỀN
          comboItems: isCombo
            ? (product.comboItems || []).map(ci => ({
                productId: ci.product?.id,
                name: ci.product?.name,
                image: ci.product?.image,
                price: Number(ci.product?.price || 0),
                quantity: ci.quantity
              }))
            : [],

          // Topping như cũ
          toppings: (item.toppings || []).map(t =>
            ToppingView.formatOrderItemTopping(t)
          )
        };
      }),

      user: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email
          }
        : null,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  static listWithPagination(result) {
    return {
      data: result.data.map(order => this.format(order)),
      pagination: result.pagination
    };
  }
}

export default new OrderView();
