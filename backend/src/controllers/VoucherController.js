import { VoucherModel, UserModel } from "../models/index.js";
import { VoucherView } from "../views/index.js";

class VoucherController {
  async getByCode(request, reply) {
    try {
      const { code } = request.params;

      const voucher = await VoucherModel.findByCode(code);

      if (!voucher) {
        return reply.status(404).send({
          error: "Không tìm thấy voucher",
        });
      }

      return VoucherView.detail(voucher);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Đã xảy ra lỗi khi lấy thông tin voucher",
      });
    }
  }

  async applyVoucher(request, reply) {
    try {
      const { code, orderAmount } = request.body;

      const voucher = await VoucherModel.findByCode(code);

      if (!voucher) {
        return reply.status(404).send({
          error: "Mã voucher không tồn tại",
        });
      }

      if (!voucher.active) {
        return reply.status(400).send({
          error: "Voucher đã hết hiệu lực",
        });
      }

      // Check thời gian (timezone-safe)
      const now = Date.now();
      const validFrom = new Date(voucher.validFrom).getTime();
      const validUntil = new Date(voucher.validUntil).getTime();

      if (now < validFrom || now > validUntil) {
        return reply.status(400).send({
          error: "Voucher không còn trong thời gian sử dụng",
        });
      }

      let discountAmount = 0;

      if (voucher.type === "FIXED") {
        discountAmount = Number(voucher.discount);
      } else if (voucher.type === "PERCENTAGE") {
        discountAmount = (orderAmount * Number(voucher.discount)) / 100;
      }

      return reply.send({
        success: true,
        data: {
          voucher: {
            id: voucher.id,
            code: voucher.code,
            name: voucher.name,
            type: voucher.type,
            discount: voucher.discount,
          },
          discountAmount,
          finalAmount: orderAmount - discountAmount,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Đã xảy ra lỗi khi áp dụng voucher",
      });
    }
  }

  async getAll(request, reply) {
    try {
      const vouchers = await VoucherModel.findAll(); // ❌ KHÔNG filter

      return VoucherView.list(vouchers);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Đã xảy ra lỗi khi lấy danh sách voucher",
      });
    }
  }

  async claim(request, reply) {
    try {
      const { voucherId } = request.body;
      const userId = request.user.id;

      const voucher = await VoucherModel.findById(voucherId);
      if (!voucher) {
        return reply.status(404).send({
          error: "Không tìm thấy voucher",
        });
      }

      if (!voucher.active) {
        return reply.status(400).send({
          error: "Voucher không còn khả dụng",
        });
      }

      const alreadyClaimed = await VoucherModel.isVoucherClaimed(
        userId,
        voucherId
      );
      if (alreadyClaimed) {
        return reply.status(400).send({
          error: "Bạn đã nhận voucher này rồi",
        });
      }

      const user = await UserModel.findById(userId);
      if (user.loyaltyPoints < voucher.minPoints) {
        return reply.status(400).send({
          error: `Bạn cần ${voucher.minPoints} điểm để đổi voucher này`,
        });
      }

      await UserModel.updateLoyaltyPoints(
        userId,
        voucher.minPoints,
        "decrement"
      );

      const userVoucher = await VoucherModel.claimVoucher(userId, voucherId);
      return VoucherView.claimed(userVoucher);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Đã xảy ra lỗi khi đổi voucher",
      });
    }
  }

  async getMyVouchers(request, reply) {
    try {
      const userId = request.user.id;
      const userVouchers = await VoucherModel.findUserVouchers(userId, true);

      return VoucherView.myVouchers(userVouchers);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Đã xảy ra lỗi khi lấy voucher của bạn",
      });
    }
  }

  async create(request, reply) {
    try {
      const {
        code,
        name,
        description,
        type,
        discount,
        minPoints = 0,
        validFrom,
        validUntil,
        maxUses = 1,
        active = true,
      } = request.body;

      // ❗ FIX validate: discount = 0 vẫn hợp lệ
      if (!code || !name || !type || discount == null || !validUntil) {
        return reply.status(400).send({
          error: "Thiếu dữ liệu bắt buộc",
        });
      }

      const existed = await VoucherModel.findByCode(code);
      if (existed) {
        return reply.status(400).send({
          error: "Voucher code đã tồn tại",
        });
      }

      const voucher = await VoucherModel.create({
        code,
        name,
        description,
        type,
        discount: Number(discount),
        minPoints,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: new Date(validUntil),
        maxUses,
        active,
      });

      return reply.send({
        success: true,
        data: voucher,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Không thể tạo voucher",
      });
    }
  }

  // ✅ THÊM – để khớp route PUT /api/vouchers/:id
  async update(request, reply) {
    try {
      const { id } = request.params;
      const data = request.body;

      const existed = await VoucherModel.findById(id);
      if (!existed) {
        return reply.status(404).send({
          error: "Voucher không tồn tại",
        });
      }

      const voucher = await VoucherModel.update(id, data);

      return reply.send({
        success: true,
        data: voucher,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Không thể cập nhật voucher",
      });
    }
  }

  async remove(request, reply) {
    try {
      const { id } = request.params;

      await VoucherModel.deleteById(id);

      return reply.send({
        success: true,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: "Không thể xóa voucher",
      });
    }
  }
}

export default new VoucherController();
