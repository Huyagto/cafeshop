import prisma from "../config/database.js";

class Category {
  // Tạo danh mục mới
  static async create(data) {
    return await prisma.category.create({
      data,
    });
  }

  // Lấy tất cả danh mục
  static async findAll(includeProducts = false) {
  return await prisma.category.findMany({
    where: { active: true },
    ...(includeProducts && {
      include: { products: true },
    }),
    orderBy: { createdAt: "desc" },
  });
}


  // Lấy danh mục theo ID
  static async findById(id, includeProducts = false) {
  return await prisma.category.findUnique({
    where: { id },
    ...(includeProducts && {
      include: { products: true },
    }),
  });
}


  // Lấy danh mục theo slug
  static async findBySlug(slug, includeProducts = false) {
  return await prisma.category.findUnique({
    where: { slug },
    ...(includeProducts && {
      include: { products: true },
    }),
  });
}


  // Cập nhật danh mục
  static async update(id, data) {
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  // Xóa mềm danh mục (set active = false)
  static async softDelete(id) {
    return await prisma.category.update({
      where: { id },
      data: { active: false },
    });
  }

  // Xóa cứng danh mục
  static async delete(id) {
    return await prisma.category.delete({
      where: { id },
    });
  }

  // Tìm kiếm danh mục
  static async search(searchTerm) {
    return await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { slug: { contains: searchTerm, mode: "insensitive" } },
        ],
        active: true,
      },
    });
  }

  // Đếm số danh mục
  static async count() {
    return await prisma.category.count({
      where: { active: true },
    });
  }
}

export default Category;