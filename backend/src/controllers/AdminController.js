import { prisma } from "../models/index.js";

const AdminController = {
  // === DASHBOARD STATS ===
  async getDashboardStats(request, reply) {
    try {
      const [
        totalOrders,
        pendingOrders,
        totalProducts,
        totalUsers,
        revenueResult,
        todayOrders,
      ] = await Promise.all([
        // Tổng đơn hàng
        prisma.order.count(),

        // Đơn hàng chờ xử lý (PENDING)
        prisma.order.count({
          where: { status: "PENDING" },
        }),

        // Tổng sản phẩm
        prisma.product.count(),

        // Tổng người dùng
        prisma.user.count(),

        // Tổng doanh thu
        prisma.order.aggregate({
          _sum: { total: true },
          where: {
            status: { in: ["COMPLETED", "READY"] },
          },
        }),

        // Đơn hàng hôm nay
        prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

      return reply.send({
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          totalProducts,
          totalUsers,
          totalRevenue: revenueResult._sum.total || 0,
          todayOrders,
        },
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return reply.status(500).send({
        error: "Không thể lấy thống kê dashboard",
      });
    }
  },

  // === PRODUCTS ===
  async getProducts(request, reply) {
    try {
      const { page = 1, limit = 10, search = "", categoryId } = request.query;
      const skip = (page - 1) * limit;

      const where = {};

      if (search) {
        where.name = { contains: search };
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get admin products error:", error);
      return reply.status(500).send({
        error: "Không thể lấy danh sách sản phẩm",
      });
    }
  },

  async createProduct(request, reply) {
    try {
      const {
        name,
        description,
        price,
        categoryId,
        image,
        available = true,
      } = request.body;

      // Validate required fields
      if (!name || !price || !categoryId) {
        return reply.status(400).send({
          error: "Thiếu thông tin bắt buộc: name, price, categoryId",
        });
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          categoryId,
          image,
          available,
        },
        include: {
          category: true,
        },
      });

      return reply.send({
        success: true,
        data: product,
        message: "Tạo sản phẩm thành công",
      });
    } catch (error) {
      console.error("Create product error:", error);
      return reply.status(500).send({
        error: "Không thể tạo sản phẩm",
      });
    }
  },

  async updateProduct(request, reply) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      // Nếu có price, convert sang number
      if (updateData.price) {
        updateData.price = parseFloat(updateData.price);
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      return reply.send({
        success: true,
        data: product,
        message: "Cập nhật sản phẩm thành công",
      });
    } catch (error) {
      console.error("Update product error:", error);
      return reply.status(500).send({
        error: "Không thể cập nhật sản phẩm",
      });
    }
  },

  async deleteProduct(request, reply) {
    try {
      const { id } = request.params;

      await prisma.product.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: "Xóa sản phẩm thành công",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      return reply.status(500).send({
        error: "Không thể xóa sản phẩm",
      });
    }
  },

  // === ORDERS ===
  async getOrders(request, reply) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        startDate,
        endDate,
      } = request.query;

      const skip = (page - 1) * limit;

      const where = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
            items: {
              include: {
                product: {
                  select: { id: true, name: true, price: true },
                },
              },
            },
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get admin orders error:", error);
      return reply.status(500).send({
        error: "Không thể lấy danh sách đơn hàng",
      });
    }
  },

  async getOrderDetails(request, reply) {
    try {
      const { id } = request.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              loyaltyPoints: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return reply.status(404).send({
          error: "Không tìm thấy đơn hàng",
        });
      }

      return reply.send({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("Get order details error:", error);
      return reply.status(500).send({
        error: "Không thể lấy chi tiết đơn hàng",
      });
    }
  },

  async updateOrderStatus(request, reply) {
    try {
      const { id } = request.params;
      const { status } = request.body;

      // Validate status
      const validStatuses = [
        "PENDING",
        "PREPARING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({
          error: "Trạng thái không hợp lệ",
        });
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: order,
        message: "Cập nhật trạng thái thành công",
      });
    } catch (error) {
      console.error("Update order status error:", error);
      return reply.status(500).send({
        error: "Không thể cập nhật trạng thái đơn hàng",
      });
    }
  },

  // === CATEGORIES ===
  async getCategories(request, reply) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });

      return reply.send({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Get categories error:", error);
      return reply.status(500).send({
        error: "Không thể lấy danh mục",
      });
    }
  },

  async createCategory(request, reply) {
    try {
      const { name, slug, image, active = true } = request.body;

      if (!name || !slug) {
        return reply.status(400).send({
          error: "Thiếu thông tin bắt buộc: name, slug",
        });
      }

      const category = await prisma.category.create({
        data: {
          name,
          slug: slug.toLowerCase(),
          image,
          active,
        },
      });

      return reply.send({
        success: true,
        data: category,
        message: "Tạo danh mục thành công",
      });
    } catch (error) {
      console.error("Create category error:", error);
      return reply.status(500).send({
        error: "Không thể tạo danh mục",
      });
    }
  },

  // === USERS ===
async getUsers(request, reply) {
  try {
    let { page = "1", limit = "10", search = "", role } = request.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // 🔍 SEARCH
    if (search && search.trim() !== "") {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // 👤 ROLE
    if (role && role !== "all") {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          loyaltyPoints: true,
          role: true,
          createdAt: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return reply.status(500).send({
      error: error.message || "Không thể lấy danh sách người dùng",
    });
  }
}

};

export default AdminController;
