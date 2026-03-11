import prisma from '../config/database.js';

class OrderModel {
  async create(orderData) {
  const orderNumber = `ORD-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;

  return await prisma.order.create({
    data: {
      ...orderData,
      orderNumber,
    },
    include: {
      items: {
        include: {
          product: true,
          toppings: {
            include: {
              topping: true, // 👈 BẮT BUỘC
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}


 async findById(id) {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          toppings: {
            include: {
              topping: true   // 👈 BẮT BUỘC: join sang bảng Topping
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}


  async findByUserId(userId, filters = {}) {
  const where = { userId };

  if (filters.status) {
    where.status = filters.status;
  }

  return await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          product: true,
          toppings: {
            include: {
              topping: true, // 👈 BẮT BUỘC
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}


  async findAll(filters = {}) {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.isKiosk !== undefined) {
    where.isKiosk = filters.isKiosk;
  }

  return await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          product: true,
          toppings: {
            include: {
              topping: true, // 👈 BẮT BUỘC
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
  });
}


  async findAllWithFilters(filters = {}) {
  const {
    search,
    status,
    startDate,
    endDate,
    isKiosk,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const where = {};

  if (search && search.trim() !== '') {
    where.OR = [
      { orderNumber: { contains: search } },
      {
        user: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        },
      },
    ];
  }

  if (status && status !== 'all') {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.createdAt.lte = end;
    }
  }

  if (isKiosk !== undefined) {
    where.isKiosk = isKiosk === 'true';
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            toppings: {
              include: {
                topping: true, // 👈 BẮT BUỘC
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}


  async updateStatus(id, status) {
    return await prisma.order.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    });
  }

}

export default new OrderModel();  