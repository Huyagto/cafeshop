import prisma from '../config/database.js';

class ProductModel {
  // THÊM static vào TẤT CẢ methods
  static async findAll(filters = {}) {
  const where = {};

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.available !== undefined) {
    where.available = filters.available;
  }

  if (filters.search && filters.search.trim() !== "") {
    where.name = { contains: filters.search };
  }

  return await prisma.product.findMany({
    where,
    include: {
      category: true,
      comboItems: {
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
    orderBy: { createdAt: "desc" },
  });
}

  static async findByIdWithCombo(id) {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      comboItems: {
        include: {
          product: true
        }
      }
    }
  });
}

  static async findByCategory(categoryId, options = {}) {
    const { skip = 0, take = 10 } = options;

    return await prisma.product.findMany({
      where: {
        categoryId,
        available: true,
      },
      include: {
        category: true,

        // ⭐ include combo
        comboItems: {
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
      skip,
      take,
      orderBy: { name: 'asc' },
    });
  }


  static async countByCategory(categoryId) {
    return await prisma.product.count({
      where: {
        categoryId,
        available: true,
      },
    });
  }

  static async findById(id) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,

        // ⭐⭐ QUAN TRỌNG: INCLUDE COMBO ITEMS ⭐⭐
        comboItems: {
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
  }

  static async create(data) {
    return await prisma.product.create({
      data,
      include: {
        category: true,
      },
    });
  }

  static async update(id, data) {
    return await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  static async delete(id) {
    return await prisma.$transaction([
      prisma.cartItem.deleteMany({
        where: { productId: id },
      }),
      prisma.orderItem.deleteMany({
        where: { productId: id },
      }),
      prisma.product.delete({
        where: { id },
      }),
    ]);
  }
}


// QUAN TRỌNG: Export class, KHÔNG phải instance
export default ProductModel;