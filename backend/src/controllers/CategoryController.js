import Category from '../models/Category.js';
import Product from '../models/Product.js';

class CategoryController {
  // Lấy tất cả danh mục
  static async getAllCategories(req, reply) {
    try {
      const includeProducts = req.query.includeProducts === 'true';
      const categories = await Category.findAll(includeProducts);
      
      return reply.send({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      console.error('Get categories error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Lỗi khi lấy danh sách danh mục'
      });
    }
  }

  // Lấy danh mục theo ID
  static async getCategoryById(req, reply) {
    try {
      const { id } = req.params;
      const includeProducts = req.query.includeProducts === 'true';
      
      const category = await Category.findById(id, includeProducts);
      
      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
      
      return reply.send({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Get category error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Lỗi khi lấy thông tin danh mục'
      });
    }
  }

  // Lấy danh mục theo slug
  static async getCategoryBySlug(req, reply) {
    try {
      const { slug } = req.params;
      const includeProducts = req.query.includeProducts === 'true';
      
      const category = await Category.findBySlug(slug, includeProducts);
      
      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
      
      return reply.send({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Get category by slug error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Lỗi khi lấy thông tin danh mục'
      });
    }
  }

  // Tạo danh mục mới
  static async createCategory(req, reply) {
    try {
      const { name, slug, image } = req.body;
      
      // Validate
      if (!name || !slug) {
        return reply.status(400).send({
          success: false,
          message: 'Vui lòng nhập đầy đủ tên và slug'
        });
      }
      
      // Kiểm tra slug đã tồn tại chưa
      const existingCategory = await Category.findBySlug(slug);
      if (existingCategory) {
        return reply.status(400).send({
          success: false,
          message: 'Slug đã tồn tại'
        });
      }
      
      const category = await Category.create({
        name,
        slug,
        image: image || null,
        active: true
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Tạo danh mục thành công',
        data: category
      });
    } catch (error) {
      console.error('Create category error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Lỗi khi tạo danh mục'
      });
    }
  }

  // Cập nhật danh mục
  static async updateCategory(req, reply) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Kiểm tra danh mục tồn tại
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        return reply.status(404).send({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
      
      // Nếu cập nhật slug, kiểm tra slug mới không trùng
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const slugExists = await Category.findBySlug(updateData.slug);
        if (slugExists) {
          return reply.status(400).send({
            success: false,
            message: 'Slug mới đã tồn tại'
          });
        }
      }
      
      const updatedCategory = await Category.update(id, updateData);
      
      return reply.send({
        success: true,
        message: 'Cập nhật danh mục thành công',
        data: updatedCategory
      });
    } catch (error) {
      console.error('Update category error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Lỗi khi cập nhật danh mục'
      });
    }
  }

  // Xóa danh mục
  static async deleteCategory(req, reply) {
    try {
      const { id } = req.params;
      
      // Kiểm tra danh mục tồn tại
      const existingCategory = await Category.findById(id, true);
      if (!existingCategory) {
        return reply.status(404).send({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
      
      // Kiểm tra xem danh mục có sản phẩm không
      if (existingCategory.products && existingCategory.products.length > 0) {
        return reply.status(400).send({
          success: false,
          message: 'Không thể xóa danh mục vì còn sản phẩm'
        });
      }
      
      // Xóa mềm (set active = false)
      await Category.softDelete(id);
      
      return reply.send({
        success: true,
        message: 'Xóa danh mục thành công'
      });
    } catch (error) {
      console.error('Delete category error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Lỗi khi xóa danh mục'
      });
    }
  }

  // Lấy sản phẩm theo danh mục (theo slug)
  static async getProductsByCategory(req, reply) {
    try {
      const { slug } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const category = await Category.findBySlug(slug);
      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
      
      const skip = (page - 1) * limit;
      
      const products = await Product.findByCategory(category.id, {
        skip: parseInt(skip),
        take: parseInt(limit)
      });
      
      const totalProducts = await Product.countByCategory(category.id);
      
      return reply.send({
        success: true,
        data: {
          category,
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalProducts,
            pages: Math.ceil(totalProducts / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get products by category error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Lỗi khi lấy sản phẩm theo danh mục'
      });
    }
  }
}

export default CategoryController;