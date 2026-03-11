import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

class UserController {
  
  // ==================== PUBLIC API ====================
  
  /**
   * [PUBLIC] Đăng ký user mới
   * POST /api/users/register
   */
  async register(request, reply) {
    try {
      const { email, password, name, phone } = request.body;
      
      // Validation
      if (!email || !password || !name) {
        return reply.status(400).send({
          success: false,
          error: 'Vui lòng nhập đầy đủ thông tin'
        });
      }
      
      // Check email exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: 'Email đã tồn tại'
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'CUSTOMER',
          loyaltyPoints: 0
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
      
      return reply.send({
        success: true,
        data: user,
        message: 'Đăng ký thành công'
      });
    } catch (error) {
      console.error('Register error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [PUBLIC] Đăng nhập
   * POST /api/users/login
   */
  async login(request, reply) {
    try {
      const { email, password } = request.body;
      
      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Vui lòng nhập email và mật khẩu'
        });
      }
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        });
      }
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.status(401).send({
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        });
      }
      
      // Create token (nếu dùng JWT)
      const token = request.jwtSign({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      });
      
      // Return user data (exclude password)
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
        role: user.role,
        createdAt: user.createdAt
      };
      
      return reply.send({
        success: true,
        data: {
          user: userData,
          token
        },
        message: 'Đăng nhập thành công'
      });
    } catch (error) {
      console.error('Login error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [PUBLIC] Lấy thông tin user hiện tại
   * GET /api/users/me
   */
  async getMe(request, reply) {
    try {
      const userId = request.user.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          loyaltyPoints: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Không tìm thấy người dùng'
        });
      }
      
      return reply.send({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get me error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  // ==================== ADMIN API ====================
  
  /**
   * [ADMIN] Lấy danh sách users
   * GET /api/admin/users
   */
  async getUsers(request, reply) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        role = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = request.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter
      const where = {};
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (role && role !== 'all') {
        where.role = role;
      }
      
      // Valid sort fields
      const validSortFields = ['createdAt', 'name', 'email', 'loyaltyPoints'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      
      // Get users with pagination
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            loyaltyPoints: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                orders: true
              }
            }
          },
          orderBy: {
            [sortField]: sortOrder
          }
        }),
        prisma.user.count({ where })
      ]);
      
      // Transform data
      const usersWithStats = users.map(user => ({
        ...user,
        totalOrders: user._count.orders
      }));
      
      return reply.send({
        success: true,
        data: usersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [ADMIN] Lấy chi tiết user
   * GET /api/admin/users/:id
   */
  async getUserById(request, reply) {
    try {
      const { id } = request.params;
      
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          loyaltyPoints: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              orders: true,
              vouchers: true
            }
          }
        }
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Không tìm thấy người dùng'
        });
      }
      
      return reply.send({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get user by id error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [ADMIN] Tạo user mới
   * POST /api/admin/users
   */
  async createUser(request, reply) {
    try {
      const { email, password, name, phone, role = 'CUSTOMER', loyaltyPoints = 0 } = request.body;
      
      // Validation
      if (!email || !password || !name) {
        return reply.status(400).send({
          success: false,
          error: 'Vui lòng nhập email, mật khẩu và tên'
        });
      }
      
      // Check email exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: 'Email đã tồn tại'
        });
      }
      
      // Validate role
      const validRoles = ['CUSTOMER', 'STAFF', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return reply.status(400).send({
          success: false,
          error: 'Role không hợp lệ'
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role,
          loyaltyPoints: parseInt(loyaltyPoints) || 0
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          loyaltyPoints: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return reply.status(201).send({
        success: true,
        data: user,
        message: 'Tạo người dùng thành công'
      });
    } catch (error) {
      console.error('Create user error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [ADMIN] Cập nhật user
   * PUT /api/admin/users/:id
   */
  async updateUser(request, reply) {
    try {
      const { id } = request.params;
      const { name, phone, role, loyaltyPoints, password } = request.body;
      
      // Check user exists
      const user = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Không tìm thấy người dùng'
        });
      }
      
      // Prevent updating self role/loyalty
      if (request.user.id === id && (role || loyaltyPoints)) {
        return reply.status(400).send({
          success: false,
          error: 'Không thể thay đổi role hoặc điểm của chính mình'
        });
      }
      
      // Validate role if provided
      if (role) {
        const validRoles = ['CUSTOMER', 'STAFF', 'ADMIN'];
        if (!validRoles.includes(role)) {
          return reply.status(400).send({
            success: false,
            error: 'Role không hợp lệ'
          });
        }
      }
      
      // Prepare update data
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;
      if (loyaltyPoints !== undefined) updateData.loyaltyPoints = parseInt(loyaltyPoints);
      
      // Update password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          loyaltyPoints: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return reply.send({
        success: true,
        data: updatedUser,
        message: 'Cập nhật thành công'
      });
    } catch (error) {
      console.error('Update user error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [ADMIN] Xóa user
   * DELETE /api/admin/users/:id
   */
  async deleteUser(request, reply) {
    try {
      const { id } = request.params;
      
      // Check user exists
      const user = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Không tìm thấy người dùng'
        });
      }
      
      // Prevent deleting self
      if (request.user.id === id) {
        return reply.status(400).send({
          success: false,
          error: 'Không thể xóa chính mình'
        });
      }
      
      // Prevent deleting last admin
      if (user.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN' }
        });
        
        if (adminCount <= 1) {
          return reply.status(400).send({
            success: false,
            error: 'Không thể xóa admin cuối cùng'
          });
        }
      }
      
      // Delete user (cascade will delete related records)
      await prisma.user.delete({
        where: { id }
      });
      
      return reply.send({
        success: true,
        message: 'Xóa người dùng thành công'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [ADMIN] Đổi role user
   * PATCH /api/admin/users/:id/role
   */
  async changeUserRole(request, reply) {
    try {
      const { id } = request.params;
      const { role } = request.body;
      
      if (!role) {
        return reply.status(400).send({
          success: false,
          error: 'Vui lòng cung cấp role mới'
        });
      }
      
      // Validate role
      const validRoles = ['CUSTOMER', 'STAFF', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return reply.status(400).send({
          success: false,
          error: 'Role không hợp lệ'
        });
      }
      
      // Check user exists
      const user = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Không tìm thấy người dùng'
        });
      }
      
      // Prevent changing self role
      if (request.user.id === id) {
        return reply.status(400).send({
          success: false,
          error: 'Không thể thay đổi role của chính mình'
        });
      }
      
      // Update role
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          loyaltyPoints: true,
          role: true,
          updatedAt: true
        }
      });
      
      return reply.send({
        success: true,
        data: updatedUser,
        message: `Đã đổi role thành ${role}`
      });
    } catch (error) {
      console.error('Change role error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [ADMIN] Reset mật khẩu user
   * POST /api/admin/users/:id/reset-password
   */
  async resetPassword(request, reply) {
    try {
      const { id } = request.params;
      const { newPassword } = request.body;
      
      if (!newPassword || newPassword.length < 6) {
        return reply.status(400).send({
          success: false,
          error: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }
      
      // Check user exists
      const user = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Không tìm thấy người dùng'
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });
      
      return reply.send({
        success: true,
        message: 'Đặt lại mật khẩu thành công'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [ADMIN] Cộng/trừ điểm loyalty
   * POST /api/admin/users/:id/loyalty-points
   */
  async updateLoyaltyPoints(request, reply) {
    try {
      const { id } = request.params;
      const { points, operation = 'add', reason } = request.body;
      
      if (!points || isNaN(points)) {
        return reply.status(400).send({
          success: false,
          error: 'Vui lòng cung cấp số điểm hợp lệ'
        });
      }
      
      const pointsNum = parseInt(points);
      
      // Check user exists
      const user = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Không tìm thấy người dùng'
        });
      }
      
      // Calculate new points
      let newPoints;
      if (operation === 'add') {
        newPoints = user.loyaltyPoints + pointsNum;
      } else if (operation === 'subtract') {
        newPoints = user.loyaltyPoints - pointsNum;
        if (newPoints < 0) newPoints = 0;
      } else {
        return reply.status(400).send({
          success: false,
          error: 'Operation phải là "add" hoặc "subtract"'
        });
      }
      
      // Update points
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { loyaltyPoints: newPoints },
        select: {
          id: true,
          email: true,
          name: true,
          loyaltyPoints: true,
          updatedAt: true
        }
      });
      
      // TODO: Log this action to a separate table
      console.log(`Admin ${request.user.id} updated user ${id} loyalty points: ${operation} ${pointsNum} points. Reason: ${reason}`);
      
      return reply.send({
        success: true,
        data: updatedUser,
        message: `Đã ${operation === 'add' ? 'cộng' : 'trừ'} ${pointsNum} điểm. Tổng điểm: ${newPoints}`
      });
    } catch (error) {
      console.error('Update loyalty points error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
  
  /**
   * [ADMIN] Thống kê users
   * GET /api/admin/users/stats
   */
  async getUserStats(request, reply) {
    try {
      const [
        totalUsers,
        totalAdmins,
        totalStaff,
        totalCustomers,
        vipUsers,
        totalLoyaltyPoints,
        newUsersToday,
        newUsersThisWeek
      ] = await Promise.all([
        // Total users
        prisma.user.count(),
        
        // Admins
        prisma.user.count({ where: { role: 'ADMIN' } }),
        
        // Staff
        prisma.user.count({ where: { role: 'STAFF' } }),
        
        // Customers
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        
        // VIP users (100k+ points)
        prisma.user.count({ where: { loyaltyPoints: { gte: 100000 } } }),
        
        // Total loyalty points
        prisma.user.aggregate({
          _sum: { loyaltyPoints: true }
        }),
        
        // New users today
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // New users this week
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);
      
      return reply.send({
        success: true,
        data: {
          totalUsers,
          byRole: {
            admins: totalAdmins,
            staff: totalStaff,
            customers: totalCustomers
          },
          vipUsers,
          totalLoyaltyPoints: totalLoyaltyPoints._sum.loyaltyPoints || 0,
          newUsers: {
            today: newUsersToday,
            thisWeek: newUsersThisWeek
          }
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
}

export default new UserController();