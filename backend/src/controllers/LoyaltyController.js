import { UserModel } from '../models/index.js';

class LoyaltyController {
  async getPoints(request, reply) {
    try {
      const userId = request.user.id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return reply.status(404).send({
          error: 'Không tìm thấy người dùng'
        });
      }

      return {
        points: user.loyaltyPoints,
        userId: user.id,
        userName: user.name
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Đã xảy ra lỗi khi lấy điểm thưởng'
      });
    }
  }
}

export default new LoyaltyController();