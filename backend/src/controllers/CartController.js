// src/controllers/CartController.js
import CartModel from '../models/Cart.js';
import ProductModel from '../models/Product.js';
import ToppingModel from '../models/ToppingModel.js';

class CartController {
  // Lấy giỏ hàng (với topping và tính tổng)
  async getCart(request, reply) {
    try {
      const userId = request.user.id;
      const cart = await CartModel.getCartWithTotal(userId);
      
      return reply.send({
        success: true,
        data: cart
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  }

  // Thêm/cập nhật item với topping
  async addOrUpdateItem(request, reply) {
  try {
    const userId = request.user.id;
    const { productId, quantity, toppings } = request.body;

    if (!productId || quantity === undefined) {
      return reply.status(400).send({
        success: false,
        message: 'Thiếu productId hoặc quantity'
      });
    }

    const product = await ProductModel.findById(productId);

    if (!product || !product.available) {
      return reply.status(404).send({
        success: false,
        message: 'Sản phẩm không tồn tại hoặc không khả dụng'
      });
    }

    // ⭐ FIX QUAN TRỌNG: NẾU LÀ COMBO
    if (product.type === "COMBO") {
      const cart = await CartModel.addItem(
        userId,
        product.id,
        quantity,
        product.price, // ✅ GIÁ COMBO
        []
      );

      return reply.send({
        success: true,
        message: 'Đã thêm combo vào giỏ hàng',
        data: cart
      });
    }

    // ======================
    // ⬇️ SẢN PHẨM THƯỜNG
    // ======================

    if (toppings && toppings.length > 0) {
      for (const topping of toppings) {
        const toppingInfo = await ToppingModel.findById(topping.toppingId);
        if (!toppingInfo || !toppingInfo.available) {
          return reply.status(400).send({
            success: false,
            message: `Topping ${topping.toppingId} không khả dụng`
          });
        }
      }
    }

    const cart = await CartModel.addItem(
      userId,
      product.id,
      quantity,
      product.price,
      toppings || []
    );

    return reply.send({
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      data: cart
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: error.message
    });
  }
}

  // Cập nhật số lượng item
  async updateItemQuantity(request, reply) {
    try {
      const userId = request.user.id;
      const { productId } = request.params;
      const { quantity } = request.body;

      if (quantity === undefined) {
        return reply.status(400).send({
          success: false,
          message: 'Thiếu quantity'
        });
      }

      // Lấy thông tin sản phẩm để lấy giá
      const product = await ProductModel.findById(productId);
      if (!product) {
        return reply.status(404).send({
          success: false,
          message: 'Sản phẩm không tồn tại'
        });
      }

      const cart = await CartModel.setItemQuantity(userId, productId, quantity, product.price);
      
      return reply.send({
        success: true,
        message: 'Đã cập nhật số lượng',
        data: cart
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  }

  // Cập nhật topping của item
  async updateItemToppings(request, reply) {
    try {
      const userId = request.user.id;
      const { cartItemId } = request.params;
      const { toppings } = request.body;

      // Kiểm tra cart item tồn tại và thuộc về user
      const cartItem = await CartModel.getCartItemById(userId, cartItemId);
      if (!cartItem) {
        return reply.status(404).send({
          success: false,
          message: 'Cart item không tồn tại'
        });
      }

      // Kiểm tra topping có hợp lệ không
      if (toppings && toppings.length > 0) {
        for (const topping of toppings) {
          const toppingInfo = await ToppingModel.findById(topping.toppingId);
          if (!toppingInfo || !toppingInfo.available) {
            return reply.status(400).send({
              success: false,
              message: `Topping ${topping.toppingId} không khả dụng`
            });
          }
        }
      }

      const cart = await CartModel.updateItemToppings(userId, cartItemId, toppings || []);
      
      return reply.send({
        success: true,
        message: 'Đã cập nhật topping',
        data: cart
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  }

  // Xóa item khỏi cart
  async removeItem(request, reply) {
    try {
      const userId = request.user.id;
      const { productId } = request.params;

      const cart = await CartModel.removeItem(userId, productId);
      
      return reply.send({
        success: true,
        message: 'Đã xóa sản phẩm khỏi giỏ hàng',
        data: cart
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  }

  // Xóa toàn bộ cart
  async clearCart(request, reply) {
    try {
      const userId = request.user.id;
      const cart = await CartModel.clearCart(userId);
      
      return reply.send({
        success: true,
        message: 'Đã xóa toàn bộ giỏ hàng',
        data: cart
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  }
}

export default new CartController();