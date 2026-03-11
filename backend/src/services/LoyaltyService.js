import { UserModel, VoucherModel } from '../models/index.js';
import PushService from './PushService.js';

class LoyaltyService {
  async checkMilestones(userId, newPoints) {
    const milestones = [
      { points: 100, message: 'Chúc mừng! Bạn đã đạt 100 điểm!' },
      { points: 500, message: 'Tuyệt vời! Bạn đã đạt 500 điểm!' },
      { points: 1000, message: 'Xuất sắc! Bạn đã đạt 1000 điểm!' }
    ];

    for (const milestone of milestones) {
      if (newPoints >= milestone.points && newPoints - milestone.points < 10) {
        await PushService.sendToUser(userId, {
          title: 'Loyalty Milestone! 🎉',
          body: milestone.message,
          icon: '/icons/icon-192x192.png'
        });
      }
    }
  }

  async recommendVouchers(userId) {
    const user = await UserModel.findById(userId);
    const vouchers = await VoucherModel.findAll({
      active: true,
      validNow: true
    });

    return vouchers.filter(async (v) => {
      const isClaimed = await VoucherModel.isVoucherClaimed(userId, v.id);
      return v.minPoints <= user.loyaltyPoints && !isClaimed;
    });
  }
}

export default new LoyaltyService();