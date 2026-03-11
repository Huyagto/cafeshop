// src/views/ToppingView.js

class ToppingView {
  /**
   * Format danh sách topping
   */
  list(toppings) {
    return {
      toppings: toppings.map(t => this.format(t)),
      total: toppings.length
    };
  }

  /**
   * Format chi tiết topping
   */
  detail(topping) {
    return this.format(topping);
  }

  /**
   * Format topping cơ bản
   */
  format(topping) {
    return {
      id: topping.id,
      name: topping.name,
      description: topping.description || '',
      price: Number(topping.price),
      image: topping.image || null,
      available: topping.available,
      categoryId: topping.categoryId,
      createdAt: topping.createdAt,
      updatedAt: topping.updatedAt
    };
  }

  /**
   * Format product-topping relationship
   */
  formatProductTopping(productTopping) {
    return {
      id: productTopping.id,
      productId: productTopping.productId,
      toppingId: productTopping.toppingId,
      isRequired: productTopping.isRequired,
      maxQuantity: productTopping.maxQuantity,
      topping: productTopping.topping ? this.format(productTopping.topping) : null
    };
  }

  /**
   * Format cart item topping
   */
  formatCartItemTopping(cartItemTopping) {
    return {
      id: cartItemTopping.id,
      cartItemId: cartItemTopping.cartItemId,
      toppingId: cartItemTopping.toppingId,
      quantity: cartItemTopping.quantity,
      price: Number(cartItemTopping.price),
      topping: cartItemTopping.topping ? this.format(cartItemTopping.topping) : null
    };
  }

  /**
   * Format order item topping
   */
  formatOrderItemTopping(orderItemTopping) {
    return {
      id: orderItemTopping.id,
      orderItemId: orderItemTopping.orderItemId,
      toppingId: orderItemTopping.toppingId,
      quantity: orderItemTopping.quantity,
      price: Number(orderItemTopping.price),
      topping: orderItemTopping.topping ? this.format(orderItemTopping.topping) : null
    };
  }

  /**
   * Format với pagination (nếu cần)
   */
  static listWithPagination(result) {
    return {
      data: result.data.map(topping => this.format(topping)),
      pagination: result.pagination
    };
  }
}

export default new ToppingView();