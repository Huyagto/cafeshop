// src/routes/cart.js
import CartController from '../controllers/CartController.js';
import { authenticate } from '../middleware/auth.js';
// nếu cần role:
// import { requireRole } from '../middleware/auth.js';

export default async function cartRoutes(fastify, options) {
  // Lấy cart hiện tại của user
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    CartController.getCart
  );

  // Thêm / cập nhật item
  fastify.post(
    '/items',
    { preHandler: [authenticate] },
    CartController.addOrUpdateItem  
  );

  // Cập nhật số lượng item
  fastify.patch(
    '/items/:productId',
    { preHandler: [authenticate] },
    CartController.updateItemQuantity
  );

  // Cập nhật topping của item
  fastify.put(
    '/items/:cartItemId/toppings',
    { preHandler: [authenticate] },
    CartController.updateItemToppings
  );

  // Xoá item khỏi cart
  fastify.delete(
    '/items/:productId',
    { preHandler: [authenticate] },
    CartController.removeItem
  );

  // Xoá toàn bộ cart
  fastify.delete(
    '/',
    { preHandler: [authenticate] },
    CartController.clearCart
  );
}
