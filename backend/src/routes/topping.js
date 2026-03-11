import ToppingController from '../controllers/ToppingController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

export default async function toppingRoutes(fastify, options) {
  // Lấy tất cả topping (public)
  fastify.get('/', ToppingController.getAll);

  // Lấy topping theo ID (public)
  fastify.get('/:id', ToppingController.getById);

  // Lấy topping theo sản phẩm (public)
  fastify.get('/product/:productId', ToppingController.getByProduct);

  // Admin routes - cần xác thực và quyền ADMIN
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    ToppingController.create
  );

  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    ToppingController.update
  );

  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    ToppingController.delete
  );

  // Thêm topping vào sản phẩm (Admin only)
  fastify.post(
    '/product/:productId/:toppingId',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    ToppingController.addToProduct
  );

  // Xóa topping khỏi sản phẩm (Admin only)
  fastify.delete(
    '/product/:productId/:toppingId',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    ToppingController.removeFromProduct
  );
}