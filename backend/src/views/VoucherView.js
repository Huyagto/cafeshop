class VoucherView {
  list(vouchers) {
    return {
      vouchers: vouchers.map(v => this.format(v)),
      total: vouchers.length
    };
  }

  detail(voucher) {
    return this.format(voucher);
  }

  format(voucher) {
    return {
      id: voucher.id,
      code: voucher.code,
      name: voucher.name,
      description: voucher.description,
      discount: Number(voucher.discount),
      type: voucher.type,
      minPoints: voucher.minPoints,
      validFrom: voucher.validFrom,
      validUntil: voucher.validUntil,
      active: voucher.active
    };
  }

  claimed(userVoucher) {
    return {
      success: true,
      message: 'Đổi voucher thành công',
      userVoucher: {
        id: userVoucher.id,
        voucher: this.format(userVoucher.voucher),
        claimedAt: userVoucher.claimedAt,
        used: userVoucher.used
      }
    };
  }

  myVouchers(userVouchers) {
    return {
      vouchers: userVouchers.map(uv => ({
        id: uv.id,
        voucher: this.format(uv.voucher),
        claimedAt: uv.claimedAt,
        used: uv.used,
        usedAt: uv.usedAt
      })),
      total: userVouchers.length
    };
  }
}

export default new VoucherView();