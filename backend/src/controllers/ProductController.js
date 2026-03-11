import ProductModel from "../models/Product.js";
import prisma from "../config/prisma.js";

class ProductController {
  // THÊM static vào TẤT CẢ methods
  // Helper function để format URL ảnh
  static formatProductWithImage(product) {
    if (!product) return null;

    const baseUrl = process.env.API_URL || "http://localhost:4000";

    let imageUrl = null;

    // ✅ CHỈ dùng ảnh từ DB nếu có
    if (product.image) {
      if (product.image.startsWith("http")) {
        imageUrl = product.image;
      } else {
        imageUrl = `${baseUrl}${product.image}`;
      }
    }

    return {
      ...product,
      price: product.price ? Number(product.price) : 0,
      image: imageUrl, // ✅ null hoặc ảnh thật
      category: product.category || null,
    };
  }

  static async getAll(request, reply) {
  try {
    const { categoryId, available, search } = request.query;

    const filters = {};

    // 📁 Filter theo categoryId
    if (categoryId) {
      filters.categoryId = categoryId;
    }

    // ✅ Filter theo available
    if (available !== undefined) {
      filters.available = available === "true";
    }

    // 🔍 SEARCH: name hoặc description
    if (search && search.trim() !== "") {
      filters.search = search.trim();
    }

    const products = await ProductModel.findAll(filters);

    // Format URL ảnh
    const formattedProducts = products.map((product) =>
      ProductController.formatProductWithImage(product)
    );

    return reply.send({
      success: true,
      data: formattedProducts,
      count: formattedProducts.length,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: "Đã xảy ra lỗi khi lấy danh sách sản phẩm",
    });
  }
}


  static async getById(request, reply) {
    try {
      const { id } = request.params;
      const product = await ProductModel.findById(id);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: "Không tìm thấy sản phẩm",
        });
      }

      const formattedProduct =
        ProductController.formatProductWithImage(product);

      return reply.send({
        success: true,
        data: formattedProduct,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Đã xảy ra lỗi khi lấy thông tin sản phẩm",
      });
    }
  }

  static async create(request, reply) {
    try {
      const productData = request.body;

      // Validate required fields
      if (!productData.name || !productData.categoryId) {
        return reply.status(400).send({
          success: false,
          error: "Vui lòng nhập đầy đủ tên và danh mục sản phẩm",
        });
      }

      const product = await ProductModel.create(productData);

      // Format response với URL ảnh
      const formattedProduct =
        ProductController.formatProductWithImage(product);

      return reply.status(201).send({
        success: true,
        message: "Tạo sản phẩm thành công",
        data: formattedProduct,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Đã xảy ra lỗi khi tạo sản phẩm",
      });
    }
  }

  static async update(request, reply) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const existingProduct = await ProductModel.findById(id);
      if (!existingProduct) {
        return reply.status(404).send({
          success: false,
          error: "Không tìm thấy sản phẩm",
        });
      }

      const product = await ProductModel.update(id, updateData);

      // Format response với URL ảnh
      const formattedProduct =
        ProductController.formatProductWithImage(product);

      return reply.send({
        success: true,
        message: "Cập nhật sản phẩm thành công",
        data: formattedProduct,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Đã xảy ra lỗi khi cập nhật sản phẩm",
      });
    }
  }

  static async delete(request, reply) {
    try {
      const { id } = request.params;

      const existingProduct = await ProductModel.findById(id);
      if (!existingProduct) {
        return reply.status(404).send({
          success: false,
          error: "Không tìm thấy sản phẩm",
        });
      }

      await ProductModel.delete(id);

      return reply.send({
        success: true,
        message: "Xóa sản phẩm thành công",
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Đã xảy ra lỗi khi xóa sản phẩm",
      });
    }
  }
    static async getProductToppings(request, reply) {
    try {
      const { productId } = request.params;

      const productToppings = await prisma.productTopping.findMany({
        where: {
          productId,
          topping: {
            available: true,
          },
        },
        include: {
          topping: true,
        },
      });

      return reply.send({
        success: true,
        data: productToppings.map((pt) => ({
          id: pt.topping.id,
          name: pt.topping.name,
          description: pt.topping.description,
          price: Number(pt.topping.price),
          image: pt.topping.image,
          maxQuantity: pt.maxQuantity,
          isRequired: pt.isRequired,
        })),
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Không thể lấy danh sách topping cho sản phẩm",
      });
    }
  }
}


// QUAN TRỌNG: Export class, KHÔNG phải instance
export default ProductController;
