import { UserModel } from '../models/index.js';
import { UserView } from '../views/index.js';
import prisma from '../config/database.js';


class AuthController {
  
 async updateProfile(request, reply) {
  try {
    console.log('👉 request.user:', request.user);
    console.log('👉 request.body:', request.body);

    const userId = request.user?.id;

    if (!userId) {
      return reply.code(401).send({ message: 'Unauthorized: missing user id' });
    }

    const { name, phone } = request.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone },
    });

    return reply.send(user);
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return reply
      .code(500)
      .send({ message: 'Không thể cập nhật thông tin' });
  }
}

  async register(request, reply) {
    try {
      const { email, password, name, phone } = request.body;

      // Validate input
      if (!email || !password || !name) {
        return reply.status(400).send({
          error: 'Email, password và tên là bắt buộc'
        });
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return reply.status(400).send({
          error: 'Email đã được sử dụng'
        });
      }

      // Create user
      const user = await UserModel.create({ email, password, name, phone });

      // Generate token
      const token = request.server.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      });

      return UserView.authResponse(user, token);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Đã xảy ra lỗi khi đăng ký'
      });
    }
  }

  async login(request, reply) {
    try {
      const { email, password } = request.body;

      // Validate input
      if (!email || !password) {
        return reply.status(400).send({
          error: 'Email và password là bắt buộc'
        });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return reply.status(401).send({
          error: 'Email hoặc mật khẩu không đúng'
        });
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return reply.status(401).send({
          error: 'Email hoặc mật khẩu không đúng'
        });
      }

      // Generate token
      const token = request.server.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      });

      return UserView.authResponse(user, token);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Đã xảy ra lỗi khi đăng nhập'
      });
    }
  }

  async getProfile(request, reply) {
    try {
      const userId = request.user.id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return reply.status(404).send({
          error: 'Không tìm thấy người dùng'
        });
      }

      return UserView.profile(user);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Đã xảy ra lỗi khi lấy thông tin'
      });
    }
  }
}

export default new AuthController();