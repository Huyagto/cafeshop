// src/controllers/ToppingController.js
import ToppingModel from "../models/ToppingModel.js";
import ToppingView from "../views/ToppingView.js";

class ToppingController {
  // Lấy tất cả topping
  async getAll(request, reply) {
    try {
      const { available, categoryId, search } = request.query;
      const toppings = await ToppingModel.findAll({
        available,
        categoryId,
        search,
      });

      return reply.send({
        success: true,
        data: ToppingView.list(toppings)
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy topping theo ID
  async getById(request, reply) {
    try {
      const { id } = request.params;
      const topping = await ToppingModel.findById(id);

      if (!topping) {
        return reply.status(404).send({
          success: false,
          message: "Topping không tồn tại",
        });
      }

      return reply.send({
        success: true,
        data: ToppingView.detail(topping)
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy topping theo sản phẩm
  async getByProduct(request, reply) {
    try {
      const { productId } = request.params;
      const productToppings = await ToppingModel.getToppingsByProduct(productId);

      const toppings = productToppings.map(pt => 
        ToppingView.formatProductTopping(pt)
      );

      return reply.send({
        success: true,
        data: {
          toppings: toppings,
          total: toppings.length
        }
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Tạo topping mới (Admin only)
  async create(request, reply) {
    try {
      const { name, price } = request.body;

      if (!name || !price) {
        return reply.status(400).send({
          success: false,
          message: "Thiếu tên hoặc giá topping",
        });
      }

      const topping = await ToppingModel.create(request.body);

      return reply.status(201).send({
        success: true,
        message: "Đã tạo topping thành công",
        data: ToppingView.detail(topping)
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật topping (Admin only)
  async update(request, reply) {
    try {
      const { id } = request.params;

      const existingTopping = await ToppingModel.findById(id);
      if (!existingTopping) {
        return reply.status(404).send({
          success: false,
          message: "Topping không tồn tại",
        });
      }

      const topping = await ToppingModel.update(id, request.body);

      return reply.send({
        success: true,
        message: "Đã cập nhật topping",
        data: ToppingView.detail(topping)
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Xóa topping (Admin only)
  async delete(request, reply) {
    try {
      const { id } = request.params;

      const existingTopping = await ToppingModel.findById(id);
      if (!existingTopping) {
        return reply.status(404).send({
          success: false,
          message: "Topping không tồn tại",
        });
      }

      await ToppingModel.delete(id);

      return reply.send({
        success: true,
        message: "Đã xóa topping",
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Thêm topping vào sản phẩm (Admin only)
  async addToProduct(request, reply) {
    try {
      const { productId, toppingId } = request.params;
      const { isRequired, maxQuantity } = request.body;

      const productTopping = await ToppingModel.addToppingToProduct(
        productId,
        toppingId,
        { isRequired, maxQuantity }
      );

      return reply.status(201).send({
        success: true,
        message: "Đã thêm topping vào sản phẩm",
        data: ToppingView.formatProductTopping(productTopping)
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Xóa topping khỏi sản phẩm (Admin only)
  async removeFromProduct(request, reply) {
    try {
      const { productId, toppingId } = request.params;

      await ToppingModel.removeToppingFromProduct(productId, toppingId);

      return reply.send({
        success: true,
        message: "Đã xóa topping khỏi sản phẩm",
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new ToppingController();