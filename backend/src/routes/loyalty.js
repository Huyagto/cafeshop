import LoyaltyController from '../controllers/LoyaltyController.js';
import { authenticate } from '../middleware/auth.js';

export default async function (fastify) {
  // GET /api/loyalty/points
  fastify.get('/points', {
    preHandler: authenticate
  }, (request, reply) => 
    LoyaltyController.getPoints(request, reply)
  );
}