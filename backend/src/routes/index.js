import authRoutes from "./auth.js";
import orderRoutes from "./orders.js";
import productRoutes from "./products.js";
import loyaltyRoutes from "./loyalty.js";
import voucherRoutes from "./vouchers.js";
import cartRoutes from "./cart.js";
import categoryRoutes from "./categories.js";
import adminRoutes from "./admin.js";
import userRoutes from "./users.js";

import uploadRoutes from "./upload.js";
import toppingRoutes from "./topping.js";


export default async function (fastify) {
  // BỎ '/api' trong prefix, chỉ giữ path riêng
  fastify.register(authRoutes, { prefix: "/auth" });
  fastify.register(orderRoutes, { prefix: "/orders" });
  fastify.register(productRoutes, { prefix: "/products" });
  fastify.register(loyaltyRoutes, { prefix: "/loyalty" });
  fastify.register(voucherRoutes, { prefix: "/vouchers" });
  fastify.register(cartRoutes, { prefix: "/cart" });
  fastify.register(categoryRoutes, { prefix: "/categories" });
  fastify.register(adminRoutes, { prefix: "/admin" });
  fastify.register(userRoutes, { prefix: "/users" });
  fastify.register(uploadRoutes, { prefix: "/upload" });
  fastify.register(toppingRoutes, { prefix: "/toppings" });
}
