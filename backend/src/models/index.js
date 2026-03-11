import { PrismaClient } from '@prisma/client';
import UserModel from './User.js';
import ProductModel from './Product.js';
import OrderModel from './Order.js';
import VoucherModel from './Voucher.js';
import CartModel from './Cart.js';
import CategoryModel from './Category.js';


const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export {
  prisma,
  UserModel,
  ProductModel,
  OrderModel,
  VoucherModel,
  CartModel,
  CategoryModel,
  
};