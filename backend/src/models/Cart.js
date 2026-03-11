// src/models/CartModel.js
import prisma from '../config/database.js';

class CartModel {
  // =========================
  // Helpers
  // =========================
  static async _getOrCreateCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  static async _getFullCart(cartId) {
    return prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: { 
            product: {
              include: {
                category: true
              }
            },
            toppings: {
              include: {
                topping: true
              }
            }
          },
        },
      },
    });
  }

  // =========================
  // Read
  // =========================
  static async getCartByUserId(userId) {
  return prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              comboItems: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
          toppings: {
            include: {
              topping: true,
            },
          },
        },
      },
    },
  });
}


  // =========================
  // ADD ITEM (CỘNG DỒN) với topping
  // =========================
 static async addItem(userId, productId, quantity, price, toppings = []) {
  const cart = await CartModel._getOrCreateCart(userId);

  // 🔥 LẤY THÔNG TIN PRODUCT (để biết có phải COMBO không)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      type: true,      // "SINGLE" | "COMBO"
      price: true,
    }
  });

  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // 🔥 COMBO: ép giá = product.price, bỏ topping
  const isCombo = product.type === "COMBO";
  const unitPrice = product.price;

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    include: {
      toppings: true,
    },
  });

  const newQuantity = existingItem
    ? existingItem.quantity + quantity
    : quantity;

  // 🔥 UPSERT CART ITEM – GIÁ LUÔN LÀ GIÁ COMBO (NẾU COMBO)
  const cartItem = await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    update: {
      quantity: newQuantity,
      price: unitPrice,
    },
    create: {
      cartId: cart.id,
      productId,
      quantity: newQuantity,
      price: unitPrice,
    },
  });

  // 🔥 COMBO → KHÔNG CÓ TOPPING → XÓA & RETURN LUÔN
  if (isCombo) {
    // đảm bảo không còn topping cũ
    await prisma.cartItemTopping.deleteMany({
      where: { cartItemId: cartItem.id },
    });

    return CartModel._getFullCart(cart.id);
  }

  // ==========================
  // ⬇️ PHẦN DƯỚI CHỈ DÀNH CHO SINGLE
  // ==========================

  // Xóa topping cũ nếu có
  if (existingItem && existingItem.toppings.length > 0) {
    await prisma.cartItemTopping.deleteMany({
      where: { cartItemId: cartItem.id },
    });
  }

  // Thêm topping mới
  for (const topping of toppings) {
    const toppingInfo = await prisma.topping.findUnique({
      where: {
        id: topping.toppingId,
        available: true,
      },
    });

    if (toppingInfo) {
      await prisma.cartItemTopping.create({
        data: {
          cartItemId: cartItem.id,
          toppingId: topping.toppingId,
          quantity: topping.quantity || 1,
          price: toppingInfo.price,
        },
      });
    }
  }

  return CartModel._getFullCart(cart.id);
}


  // =========================
  // SET QUANTITY (GHI ĐÈ) - giữ nguyên topping
  // =========================
  static async setItemQuantity(userId, productId, quantity, price) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) return null;

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId,
        },
      });
    } else {
      await prisma.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        data: {
          quantity,
          price,
        },
      });
    }

    return CartModel._getFullCart(cart.id);
  }

  // =========================
  // UPDATE ITEM TOPPINGS (Cập nhật topping cho cart item)
  // =========================
  static async updateItemToppings(userId, cartItemId, toppings = []) {
    // Tìm cart của user
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true
      }
    });

    if (!cart) return null;

    // Kiểm tra cartItem có thuộc về cart của user không
    const cartItem = cart.items.find(item => item.id === cartItemId);
    if (!cartItem) {
      throw new Error('Cart item không tồn tại hoặc không thuộc về user');
    }

    // Xóa topping cũ
    await prisma.cartItemTopping.deleteMany({
      where: { cartItemId }
    });

    // Thêm topping mới
    for (const topping of toppings) {
      const toppingInfo = await prisma.topping.findUnique({
        where: { 
          id: topping.toppingId,
          available: true 
        }
      });

      if (toppingInfo) {
        await prisma.cartItemTopping.create({
          data: {
            cartItemId,
            toppingId: topping.toppingId,
            quantity: topping.quantity || 1,
            price: toppingInfo.price
          }
        });
      }
    }

    return CartModel._getFullCart(cart.id);
  }

  // =========================
  // UPDATE ITEM WITH TOPPINGS (Cập nhật cả quantity và topping)
  // =========================
  static async updateItemWithToppings(userId, productId, quantity, price, toppings = []) {
    const cart = await CartModel._getOrCreateCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!existingItem) {
      throw new Error('Sản phẩm không có trong giỏ hàng');
    }

    // Cập nhật quantity và price
    const cartItem = await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      data: {
        quantity,
        price,
      },
    });

    // Xóa topping cũ
    await prisma.cartItemTopping.deleteMany({
      where: { cartItemId: cartItem.id }
    });

    // Thêm topping mới
    for (const topping of toppings) {
      const toppingInfo = await prisma.topping.findUnique({
        where: { 
          id: topping.toppingId,
          available: true 
        }
      });

      if (toppingInfo) {
        await prisma.cartItemTopping.create({
          data: {
            cartItemId: cartItem.id,
            toppingId: topping.toppingId,
            quantity: topping.quantity || 1,
            price: toppingInfo.price
          }
        });
      }
    }

    return CartModel._getFullCart(cart.id);
  }

  // =========================
  // REMOVE SINGLE ITEM
  // =========================
  static async removeItem(userId, productId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) return null;

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    return CartModel._getFullCart(cart.id);
  }

  // =========================
  // CLEAR CART
  // =========================
  static async clearCart(userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) return null;

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return CartModel._getFullCart(cart.id);
  }

  // =========================
  // GET CART WITH CALCULATED TOTAL
  // =========================
 static async getCartWithTotal(userId) {
  const cart = await this.getCartByUserId(userId);

  if (!cart) {
    const newCart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                comboItems: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            toppings: {
              include: { topping: true },
            },
          },
        },
      },
    });

    return {
      ...newCart,
      total: 0,
      items: [],
    };
  }

  let total = 0;

  const itemsWithSubtotal = cart.items.map((item) => {
    const isCombo = item.product?.type === "COMBO";

    let subtotal = 0;

    if (isCombo) {
      // ✅ COMBO: chỉ lấy giá combo * quantity
      subtotal = Number(item.price) * item.quantity;
    } else {
      // ✅ SẢN PHẨM THƯỜNG
      const baseTotal = Number(item.price) * item.quantity;

      const toppingTotal = item.toppings.reduce(
        (sum, topping) =>
          sum + Number(topping.price) * topping.quantity,
        0
      );

      subtotal = baseTotal + toppingTotal;
    }

    total += subtotal;

    return {
      ...item,
      subtotal,
    };
  });

  return {
    ...cart,
    items: itemsWithSubtotal,
    total,
  };
}



  // =========================
  // GET CART ITEM BY ID (với kiểm tra user)
  // =========================
  static async getCartItemById(userId, cartItemId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { id: cartItemId },
          include: {
            toppings: {
              include: {
                topping: true
              }
            }
          }
        }
      }
    });

    if (!cart || !cart.items.length) {
      return null;
    }

    return cart.items[0];
  }

  // =========================
  // GET AVAILABLE TOPPINGS FOR PRODUCT
  // =========================
  static async getAvailableToppingsForProduct(productId) {
    return prisma.productTopping.findMany({
      where: { productId },
      include: {
        topping: true
      }
    });
  }
}

export default CartModel;