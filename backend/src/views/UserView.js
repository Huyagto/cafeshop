class UserView {
  authResponse(user, token) {
    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
        role: user.role
      }
    };
  }

  profile(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      loyaltyPoints: user.loyaltyPoints,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}

export default new UserView();