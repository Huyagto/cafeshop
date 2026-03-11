import prisma from '../config/database.js';

class VoucherModel {
  async findUserVoucherByCode(userId, code) {
  return await prisma.userVoucher.findFirst({
    where: {
      userId,
      voucher: {
        code: code
      }
    },
    include: {
      voucher: true
    }
  });
}
  async findAll(filters = {}) {
    const where = {};
    
    if (filters.active !== undefined) {
      where.active = filters.active;
    }
    
    if (filters.validNow) {
      where.validUntil = {
        gte: new Date()
      };
      where.validFrom = {
        lte: new Date()
      };
    }

    return await prisma.voucher.findMany({
      where,
      orderBy: { minPoints: 'asc' }
    });
  }

  async findById(id) {
    return await prisma.voucher.findUnique({
      where: { id }
    });
  }

  async findByCode(code) {
    return await prisma.voucher.findUnique({
      where: { code }
    });
  }

  async claimVoucher(userId, voucherId) {
    return await prisma.userVoucher.create({
      data: {
        userId,
        voucherId
      },
      include: {
        voucher: true
      }
    });
  }

  async findUserVouchers(userId, onlyUnused = true) {
    const where = { userId };
    
    if (onlyUnused) {
      where.used = false;
    }

    return await prisma.userVoucher.findMany({
      where,
      include: {
        voucher: true
      },
      orderBy: { claimedAt: 'desc' }
    });
  }

  async useVoucher(userVoucherId) {
    return await prisma.userVoucher.update({
      where: { id: userVoucherId },
      data: {
        used: true,
        usedAt: new Date()
      }
    });
  }

  async isVoucherClaimed(userId, voucherId) {
    const userVoucher = await prisma.userVoucher.findUnique({
      where: {
        userId_voucherId: {
          userId,
          voucherId
        }
      }
    });
    
    return !!userVoucher;
  }

  create(data) {
    return prisma.voucher.create({
      data
    });
  }

  delete(id) {
    return prisma.voucher.delete({
      where: { id }
    });
  }

  deleteById(id) {
    return this.delete(id);
  }

  update(id, data) {
    return prisma.voucher.update({
      where: { id },
      data
    });
  }


}

export default new VoucherModel();