import ProductController from "../controllers/ProductController.js";
import { authenticate } from "../middleware/auth.js";
import ComboController from "../controllers/ComboController.js";

async function productRoutes(fastify, options) {
  // Public routes
  fastify.get("/", ProductController.getAll);
  fastify.get("/:id", ProductController.getById);
  fastify.get("/combos/:id", ComboController.getComboById);
  // fastify.get("/products/search", ProductController.search);
  fastify.get(
  '/:productId/toppings',
  ProductController.getProductToppings
);
  // Protected routes
  fastify.post(
    "/",
    {
      preHandler: [authenticate],
    },
    ProductController.create
  );

  fastify.put(
    "/:id",
    {
      preHandler: [authenticate],
    },
    ProductController.update
  );

  fastify.delete(
    "/:id",
    {
      preHandler: [authenticate],
    },
    ProductController.delete
  );
}

export default productRoutes;