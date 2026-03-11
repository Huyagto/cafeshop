// src/models/ToppingModel.js
import prisma from '../config/database.js';

class ToppingModel {
  // =========================
  // CREATE
  // =========================
  static async create(data) {
    return prisma.topping.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        image: data.image,
        available: data.available !== undefined ? data.available : true,
        categoryId: data.categoryId || null
      }
    });
  }

  // =========================
  // READ
  // =========================
  static async findAll(filters = {}) {
    const { available, categoryId, search } = filters;
    
    const where = {};
    
    if (available !== undefined) {
      where.available = available === 'true';
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    return prisma.topping.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async findById(id) {
    return prisma.topping.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    });
  }

  // =========================
  // UPDATE
  // =========================
  static async update(id, data) {
    return prisma.topping.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price ? parseFloat(data.price) : undefined,
        image: data.image,
        available: data.available,
        categoryId: data.categoryId
      }
    });
  }

  // =========================
  // DELETE
  // =========================
  static async delete(id) {
    return prisma.topping.delete({
      where: { id }
    });
  }

  // =========================
  // PRODUCT-TOPPING RELATIONSHIPS
  // =========================
  static async addToppingToProduct(productId, toppingId, options = {}) {
    return prisma.productTopping.create({
      data: {
        productId,
        toppingId,
        isRequired: options.isRequired || false,
        maxQuantity: options.maxQuantity || 1
      }
    });
  }

  static async removeToppingFromProduct(productId, toppingId) {
    return prisma.productTopping.delete({
      where: {
        productId_toppingId: {
          productId,
          toppingId
        }
      }
    });
  }

  static async getToppingsByProduct(productId) {
    return prisma.productTopping.findMany({
      where: { productId },
      include: {
        topping: true
      }
    });
  }

  // =========================
  // CART ITEM TOPPINGS
  // =========================
  static async getCartItemToppings(cartItemId) {
    return prisma.cartItemTopping.findMany({
      where: { cartItemId },
      include: {
        topping: true
      }
    });
  }
}

export default ToppingModel;