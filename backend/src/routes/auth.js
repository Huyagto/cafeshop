import AuthController from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';

export default async function (fastify) {
  // POST /api/auth/register
  fastify.post('/register', (request, reply) => 
    AuthController.register(request, reply)
  );

  // POST /api/auth/login
  fastify.post('/login', (request, reply) => 
    AuthController.login(request, reply)
  );

  // GET /api/auth/profile
  fastify.get('/profile', {
    preHandler: authenticate
  }, (request, reply) => 
    AuthController.getProfile(request, reply)
  );

  fastify.put('/profile', {
    preHandler: authenticate
  }, (request, reply) =>
    AuthController.updateProfile(request, reply)
  );
}