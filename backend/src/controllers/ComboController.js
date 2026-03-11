import { prisma } from "../models/index.js";

class ComboController {
  // =========================
  // GET /admin/combos
  // =========================
  static async getCombos(request, reply) {
    try {
      const combos = await prisma.product.findMany({
        where: {
          type: "COMBO",
        },
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
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.send({
        success: true,
        data: combos,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Không thể lấy danh sách combo",
      });
    }
  }

  // =========================
  // POST /admin/combos
  // =========================
  static async createCombo(request, reply) {
    try {
      const { name, description, price, categoryId, comboItems } = request.body;

      // Validate
      if (
        !name ||
        !price ||
        !categoryId ||
        !Array.isArray(comboItems) ||
        comboItems.length === 0
      ) {
        return reply.status(400).send({
          error: "Thiếu dữ liệu tạo combo",
        });
      }

      const combo = await prisma.$transaction(async (tx) => {
        // 1. Tạo product COMBO
        const createdCombo = await tx.product.create({
          data: {
            name,
            description,
            price,
            type: "COMBO",
            categoryId,
            available: true,
          },
        });

        // 2. Tạo combo items
        for (const item of comboItems) {
          await tx.comboItem.create({
            data: {
              comboId: createdCombo.id,
              productId: item.productId,
              quantity: item.quantity ?? 1,
            },
          });
        }

        return createdCombo;
      });

      return reply.status(201).send({
        success: true,
        message: "Tạo combo thành công",
        data: combo,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Không thể tạo combo",
      });
    }
  }

  // =========================
  // GET /combos/:id (PUBLIC)
  // =========================
  static async getComboById(request, reply) {
    try {
      const { id } = request.params;

      const combo = await prisma.product.findFirst({
        where: {
          id,
          type: "COMBO",
        },
        include: {
          category: true,
          comboItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!combo) {
        return reply.status(404).send({
          error: "Không tìm thấy combo",
        });
      }

      return reply.send({
        success: true,
        data: combo,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Không thể lấy chi tiết combo",
      });
    }
  }
}

export default ComboController;
