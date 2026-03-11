import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // =====================
  // USERS
  // =====================
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      password: hashedPassword,
      name: 'Test User',
      phone: '0123456789',
      loyaltyPoints: 150
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      phone: '0987654321',
      role: 'ADMIN',
      loyaltyPoints: 500
    }
  });

  console.log('✅ Created users:', {
    user: user1.email,
    admin: admin.email
  });

  // =====================
  // CATEGORIES
  // =====================
  const categories = [
    { name: 'Coffee', slug: 'coffee' },
    { name: 'Tea', slug: 'tea' },
    { name: 'Smoothie', slug: 'smoothie' },
    { name: 'Food', slug: 'food' },
    { name: 'Dessert', slug: 'dessert' }
  ];

 const categoryMap = {};


  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug
      }
    });

    categoryMap[cat.slug.toUpperCase()] = category.id;
  }

  console.log('✅ Created categories:', Object.keys(categoryMap));

  // =====================
  // PRODUCTS
  // =====================
  const products = [
    {
      name: 'Espresso',
      description: 'Cà phê Espresso đậm đà',
      price: 35000,
      categoryKey: 'COFFEE',
      image: '/images/espresso.jpg'
    },
    {
      name: 'Cappuccino',
      description: 'Cappuccino béo ngậy với lớp foam mịn',
      price: 45000,
      categoryKey: 'COFFEE',
      image: '/images/cappuccino.jpg'
    },
    {
      name: 'Latte',
      description: 'Cà phê sữa Latte thơm ngon',
      price: 45000,
      categoryKey: 'COFFEE',
      image: '/images/latte.jpg'
    },
    {
      name: 'Americano',
      description: 'Cà phê Americano nhẹ nhàng',
      price: 40000,
      categoryKey: 'COFFEE',
      image: '/images/americano.jpg'
    },
    {
      name: 'Mocha',
      description: 'Cà phê Mocha với chocolate',
      price: 50000,
      categoryKey: 'COFFEE',
      image: '/images/mocha.jpg'
    },
    {
      name: 'Trà Xanh',
      description: 'Trà xanh nguyên chất',
      price: 30000,
      categoryKey: 'TEA',
      image: '/images/green-tea.jpg'
    },
    {
      name: 'Trà Đào',
      description: 'Trà đào cam sả',
      price: 40000,
      categoryKey: 'TEA',
      image: '/images/peach-tea.jpg'
    },
    {
      name: 'Sinh Tố Dâu',
      description: 'Sinh tố dâu tươi mát lạnh',
      price: 45000,
      categoryKey: 'SMOOTHIE',
      image: '/images/strawberry-smoothie.jpg'
    },
    {
      name: 'Croissant',
      description: 'Bánh croissant bơ thơm ngon',
      price: 35000,
      categoryKey: 'FOOD',
      image: '/images/croissant.jpg'
    },
    {
      name: 'Tiramisu',
      description: 'Bánh Tiramisu Ý',
      price: 55000,
      categoryKey: 'DESSERT',
      image: '/images/tiramisu.jpg'
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: {
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        available: true,
        categoryId: categoryMap[product.categoryKey]
      }
    });
  }

  console.log('✅ Created products:', products.length);

  // =====================
  // VOUCHERS
  // =====================
  const vouchers = [
    {
      code: 'WELCOME10',
      name: 'Giảm 10.000đ',
      description: 'Giảm 10.000đ cho đơn hàng đầu tiên',
      discount: 10000,
      type: 'FIXED',
      minPoints: 50,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'LOYAL20',
      name: 'Giảm 20%',
      description: 'Giảm 20% cho khách hàng thân thiết',
      discount: 20,
      type: 'PERCENTAGE',
      minPoints: 100,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'FREESHIP',
      name: 'Miễn phí giao hàng',
      description: 'Miễn phí giao hàng cho đơn từ 100.000đ',
      discount: 15000,
      type: 'FIXED',
      minPoints: 200,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const voucher of vouchers) {
    await prisma.voucher.upsert({
      where: { code: voucher.code },
      update: {},
      create: {
        ...voucher,
        validFrom: new Date(),
        active: true
      }
    });
  }

  console.log('✅ Created vouchers:', vouchers.length);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
