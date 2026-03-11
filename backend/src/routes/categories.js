// src/routes/categories.js
import CategoryController from '../controllers/CategoryController.js';
import { authenticate } from '../middleware/auth.js';

export default async function categoryRoutes(fastify) {

  // Public
  fastify.get('/', CategoryController.getAllCategories);
  fastify.get('/id/:id', CategoryController.getCategoryById);
  fastify.get('/slug/:slug', CategoryController.getCategoryBySlug);
  fastify.get('/slug/:slug/products', CategoryController.getProductsByCategory);

  // Protected
  fastify.post('/', {
    preHandler: [authenticate]
  }, CategoryController.createCategory);

  fastify.put('/:id', {
    preHandler: [authenticate]
  }, CategoryController.updateCategory);

  fastify.delete('/:id', {
    preHandler: [authenticate]
  }, CategoryController.deleteCategory);
}
