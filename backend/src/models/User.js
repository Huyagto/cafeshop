import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

class UserModel {
  async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        loyaltyPoints: true,
        role: true,
        createdAt: true
      }
    });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        loyaltyPoints: true,
        role: true,
        createdAt: true
      }
    });
  }

  async updateLoyaltyPoints(userId, points, operation = 'increment') {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        loyaltyPoints: {
          [operation]: points
        }
      }
    });
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export default new UserModel();