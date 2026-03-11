import OrderController from '../controllers/OrderController.js';
// CÁCH 1: Import riêng lẻ - CHỌN CÁCH NÀY
import authenticate from '../middleware/auth.js';
import { checkRole } from '../middleware/auth.js';

export default async function (fastify) {
  // POST /api/orders
  fastify.post('/', {
    preHandler: authenticate
  }, (request, reply) => 
    OrderController.create(request, reply)
  );

  // GET /api/orders/my
  fastify.get('/my', {
    preHandler: authenticate
  }, (request, reply) => 
    OrderController.getMyOrders(request, reply)
  );

  // GET /api/orders/:id
  fastify.get('/:id', {
    preHandler: authenticate
  }, (request, reply) => 
    OrderController.getById(request, reply)
  );

  // PATCH /api/orders/:id/status
  fastify.patch('/:id/status', (request, reply) => 
    OrderController.updateStatus(request, reply)
  );

  // GET /api/orders (Admin only)
  fastify.get('/', {
    preHandler: [authenticate, checkRole(['admin'])]
  }, (request, reply) => 
    OrderController.getAllOrders(request, reply)
  );
}