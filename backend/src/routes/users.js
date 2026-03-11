import UserController from '../controllers/UserController.js';

export default async function user(fastify) {
  console.log('👤 Loading public user routes...');
  
  // Public routes - không cần authentication
  fastify.post('/register', UserController.register);
  console.log('   ✅ POST /register');
  
  fastify.post('/login', UserController.login);
  console.log('   ✅ POST /login');
  
  // Protected routes - cần authentication
  fastify.get('/me', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({
          error: 'Unauthorized - Vui lòng đăng nhập'
        });
      }
    }
  }, UserController.getMe);
  console.log('   ✅ GET /me (authenticated)');
  
  console.log('👤 User routes loaded successfully!');
}