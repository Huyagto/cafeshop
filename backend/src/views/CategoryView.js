class CategoryView {
  static formatCategory(category) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      active: category.active,
      productCount: category.products ? category.products.length : 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
  }

  static formatCategoryWithProducts(category) {
    const formattedCategory = this.formatCategory(category);
    
    if (category.products) {
      formattedCategory.products = category.products.map(product => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        available: product.available
      }));
    }
    
    return formattedCategory;
  }

  static formatCategoryList(categories) {
    return categories.map(category => this.formatCategory(category));
  }

  static formatCategoryDetail(category) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      ...(category.products && {
        products: category.products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          image: product.image,
          available: product.available
        }))
      })
    };
  }
}

export default CategoryView;    