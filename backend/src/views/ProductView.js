class ProductView {
  list(products) {
    return {
      products: products.map(p => this.format(p)),
      total: products.length
    };
  }

  detail(product) {
    return this.format(product);
  }

  format(product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      image: product.image,
      available: product.available
    };
  }
}

export default new ProductView();