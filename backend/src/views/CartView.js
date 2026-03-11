// src/views/CartView.js
import ToppingView from './ToppingView.js';

class CartView {
  detail(cart) {
    return this.format(cart);
  }

  format(cart) {
    let total = 0;
    
    const items = cart.items?.map(item => {
      const itemPrice = Number(item.product?.price || item.price);
      const itemSubtotal = itemPrice * item.quantity;
      
      // Tính tổng topping
      const toppingSubtotal = item.toppings?.reduce((sum, topping) => {
        return sum + (Number(topping.price) * topping.quantity);
      }, 0) || 0;
      
      const subtotal = itemSubtotal + toppingSubtotal;
      total += subtotal;
      
      return {
        id: item.id,
        productId: item.productId,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          price: itemPrice,
          image: item.product.image,
          category: item.product.category ? {
            id: item.product.category.id,
            name: item.product.category.name
          } : null
        } : null,
        quantity: item.quantity,
        price: itemPrice,
        toppings: item.toppings?.map(topping => 
          ToppingView.formatCartItemTopping(topping)
        ) || [],
        subtotal: subtotal
      };
    }) || [];

    return {
      id: cart.id,
      userId: cart.userId,
      items: items,
      total: total,
      itemCount: items.length,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };
  }
}

export default new CartView();