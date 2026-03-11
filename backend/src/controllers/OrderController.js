import { OrderModel } from "../models/index.js";
import { OrderView } from "../views/index.js";
import { prisma } from "../models/index.js";
import { VoucherModel } from "../models/index.js";


function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}

class OrderController {
  // ================= CREATE ORDER (GIỮ NGUYÊN – OK RỒI) =================
  async create(request, reply) {
  try {
    const { items, isKiosk, notes, voucherCode,finalAmount } = request.body;
    const userId = request.user.id;
    

    if (!items || items.length === 0) {
      return reply.status(400).send({
        error: "Đơn hàng phải có ít nhất 1 sản phẩm",
      });
    }

    // =============================
    // 1️⃣ TÍNH TỔNG GỐC (CHƯA GIẢM)
    // =============================
    let total = 0;

// fallback nếu frontend không gửi finalAmount
for (const item of items) {
  const base = Number(item.price) * item.quantity;
  const toppings = item.toppings || [];
  const toppingsTotal = toppings.reduce(
    (sum, t) => sum + Number(t.price) * (t.quantity || 1),
    0
  );
  total += base + toppingsTotal;
}

// ✅ ƯU TIÊN FINAL AMOUNT TỪ CART
if (typeof finalAmount === "number" && finalAmount >= 0) {
  total = finalAmount;
}

    // =============================
    // 2️⃣ XỬ LÝ VOUCHER (NẾU CÓ)
    // =============================
    let discountAmount = 0;
    let appliedUserVoucher = null;

   

    // =============================
    // 3️⃣ TẠO ORDER
    // =============================
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        total,
        pointsEarned: Math.floor(total / 10000),
        isKiosk: !!isKiosk,
        notes,

        items: {
          create: items.map((item) => {
            const rawToppings = item.toppings || item.selectedToppings || [];

            return {
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,

              toppings: rawToppings.length
                ? {
                    create: rawToppings.map((t) => ({
                      toppingId: t.toppingId,
                      price: t.price,
                      quantity: t.quantity || 1,
                    })),
                  }
                : undefined,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                comboItems: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            toppings: {
              include: {
                topping: true,
              },
            },
          },
        },
        user: true,
      },
    });

    // =============================
    // 4️⃣ ĐÁNH DẤU VOUCHER ĐÃ DÙNG
    // =============================
    if (appliedUserVoucher) {
      await VoucherModel.useVoucher(appliedUserVoucher.id);
    }

    return reply.send(OrderView.detail(order));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Đã xảy ra lỗi khi tạo đơn hàng",
      details: error.message,
    });
  }
}


  // ================= FIX CHÍNH Ở ĐÂY =================
  // 👉 ORDER DETAIL – HIỂN THỊ SẢN PHẨM TRONG COMBO
  async getById(request, reply) {
    try {
      const { id } = request.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  comboItems: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
              toppings: {
                include: { topping: true },
              },
            },
          },
          user: true,
        },
      });

      if (!order) {
        return reply.status(404).send({
          error: "Không tìm thấy đơn hàng",
        });
      }

      return OrderView.detail(order);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Đã xảy ra lỗi khi lấy thông tin đơn hàng",
      });
    }
  }

  // ================= FIX CHO DANH SÁCH ORDER =================
  async getMyOrders(request, reply) {
    try {
      const userId = request.user.id;

      const orders = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                include: {
                  comboItems: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
              toppings: {
                include: { topping: true },
              },
            },
          },
          user: true,
        },
      });

      return OrderView.list(orders);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Đã xảy ra lỗi khi lấy danh sách đơn hàng",
      });
    }
  }
}

export default new OrderController();
