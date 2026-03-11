import AdminController from "../controllers/AdminController.js";
import UserController from "../controllers/UserController.js"; // THÊM IMPORT
import { authenticate } from "../middleware/auth.js";
import ComboController from "../controllers/ComboController.js";

export default async function (fastify) {
  console.log("📁 Loading admin routes module...");

  // BỎ { prefix: '/admin' } ở đây!
  fastify.register(async (adminRoutes) => {
    console.log("   Setting up admin routes...");

    // Tất cả routes trong này đều cần authentication VÀ role ADMIN/STAFF
    adminRoutes.addHook("preHandler", async (request, reply) => {
      // 1. Kiểm tra authentication
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({
          error: "Unauthorized - Vui lòng đăng nhập",
        });
      }

      // 2. Kiểm tra role
      if (!["ADMIN", "STAFF"].includes(request.user.role)) {
        return reply.status(403).send({
          error: "Forbidden - Bạn không có quyền truy cập",
        });
      }
    });

    // === DASHBOARD ===
    adminRoutes.get("/dashboard/stats", AdminController.getDashboardStats);
    console.log("   ✅ GET /dashboard/stats");

    // === PRODUCTS ===
    adminRoutes.get("/products", AdminController.getProducts);
    console.log("   ✅ GET /products");
    adminRoutes.post("/products", AdminController.createProduct);
    console.log("   ✅ POST /products");
    adminRoutes.put("/products/:id", AdminController.updateProduct);
    console.log("   ✅ PUT /products/:id");
    adminRoutes.delete("/products/:id", AdminController.deleteProduct);
    console.log("   ✅ DELETE /products/:id");

    // === COMBOS ===
    adminRoutes.get("/combos", ComboController.getCombos);
    adminRoutes.post("/combos", ComboController.createCombo);

    // === ORDERS ===
    adminRoutes.get("/orders", AdminController.getOrders);
    console.log("   ✅ GET /orders");
    adminRoutes.get("/orders/:id", AdminController.getOrderDetails);
    console.log("   ✅ GET /orders/:id");
    adminRoutes.patch("/orders/:id/status", AdminController.updateOrderStatus);
    console.log("   ✅ PATCH /orders/:id/status");

    // === CATEGORIES ===
    adminRoutes.get("/categories", AdminController.getCategories);
    console.log("   ✅ GET /categories");
    adminRoutes.post("/categories", AdminController.createCategory);
    console.log("   ✅ POST /categories");

    // === USERS === (GIỮ LẠI CÁI CŨ NẾU CÓ)
    adminRoutes.get(
      "/users",
      AdminController.getUsers || UserController.getUsers
    );
    console.log("   ✅ GET /users");

    // === THÊM CÁC USER ROUTES MỚI ===
    console.log("   👥 Adding new user management routes...");

    // User stats
    adminRoutes.get("/users/stats", UserController.getUserStats);
    console.log("   ✅ GET /users/stats");

    // Get user by ID
    adminRoutes.get("/users/:id", UserController.getUserById);
    console.log("   ✅ GET /users/:id");

    // Create new user (admin only)
    adminRoutes.post(
      "/users",
      {
        preHandler: async (request, reply) => {
          // Only ADMIN can create users
          if (request.user.role !== "ADMIN") {
            return reply.status(403).send({
              error: "Forbidden - Chỉ ADMIN có thể tạo người dùng mới",
            });
          }
        },
      },
      UserController.createUser
    );
    console.log("   ✅ POST /users (admin only)");

    // Update user
    adminRoutes.put("/users/:id", UserController.updateUser);
    console.log("   ✅ PUT /users/:id");

    // Delete user (admin only)
    adminRoutes.delete(
      "/users/:id",
      {
        preHandler: async (request, reply) => {
          // Only ADMIN can delete users
          if (request.user.role !== "ADMIN") {
            return reply.status(403).send({
              error: "Forbidden - Chỉ ADMIN có thể xóa người dùng",
            });
          }
        },
      },
      UserController.deleteUser
    );
    console.log("   ✅ DELETE /users/:id (admin only)");

    // Change user role (admin only)
    adminRoutes.patch(
      "/users/:id/role",
      {
        preHandler: async (request, reply) => {
          // Only ADMIN can change roles
          if (request.user.role !== "ADMIN") {
            return reply.status(403).send({
              error: "Forbidden - Chỉ ADMIN có thể thay đổi role",
            });
          }
        },
      },
      UserController.changeUserRole
    );
    console.log("   ✅ PATCH /users/:id/role (admin only)");

    // Reset password (admin only)
    adminRoutes.post(
      "/users/:id/reset-password",
      {
        preHandler: async (request, reply) => {
          // Only ADMIN can reset passwords
          if (request.user.role !== "ADMIN") {
            return reply.status(403).send({
              error: "Forbidden - Chỉ ADMIN có thể reset mật khẩu",
            });
          }
        },
      },
      UserController.resetPassword
    );
    console.log("   ✅ POST /users/:id/reset-password (admin only)");

    // Update loyalty points
    adminRoutes.post(
      "/users/:id/loyalty-points",
      UserController.updateLoyaltyPoints
    );
    console.log("   ✅ POST /users/:id/loyalty-points");

    console.log("   🎯 Total admin routes: 20 (+9 new user routes)");
  }); // <-- BỎ { prefix: '/admin' } Ở ĐÂY!

  console.log("📁 Admin routes loaded successfully!");
}
