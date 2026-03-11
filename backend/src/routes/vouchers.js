import VoucherController from '../controllers/VoucherController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

export default async function (fastify) {

  // GET /api/vouchers
  fastify.get('/', (request, reply) =>
    VoucherController.getAll(request, reply)
  );

  // POST /api/vouchers/claim
  fastify.post('/claim', {
    preHandler: authenticate
  }, (request, reply) =>
    VoucherController.claim(request, reply)
  );

  // GET /api/vouchers/my
  fastify.get('/my', {
    preHandler: authenticate
  }, (request, reply) =>
    VoucherController.getMyVouchers(request, reply)
  );

  // POST /api/vouchers/apply
  fastify.post('/apply', {
    preHandler: authenticate
  }, (request, reply) =>
    VoucherController.applyVoucher(request, reply)
  );

  // POST /api/vouchers (ADMIN tạo voucher)
  fastify.post('/', {
    preHandler: [authenticate, isAdmin]
  }, (request, reply) =>
    VoucherController.create(request, reply)
  );

  // ✅ PUT /api/vouchers/:id (ADMIN cập nhật voucher)
  fastify.put('/:id', {
    preHandler: [authenticate, isAdmin]
  }, (request, reply) =>
    VoucherController.update(request, reply)
  );

  // DELETE /api/vouchers/:id (ADMIN xóa voucher)
  fastify.delete('/:id', {
    preHandler: [authenticate, isAdmin]
  }, (request, reply) =>
    VoucherController.remove(request, reply)
  );

  // ⚠️ GET /api/vouchers/:code — LUÔN ĐỂ CUỐI
  fastify.get('/:code', (request, reply) =>
    VoucherController.getByCode(request, reply)
  );
}
