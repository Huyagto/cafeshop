// types/catalog.ts - CẬP NHẬT LẠI
export type CategoryCode = "COFFEE" | "TEA" | "FOOD" | string;
export type ProductType = "SINGLE" | "COMBO";


// Cập nhật Product type để phù hợp với backend
// types/catalog.ts

export type ComboItem = {
  id?: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string | null;
  };
  quantity: number;
};


export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;

  // ✅ THÊM
  type?: ProductType;          // SINGLE | COMBO

  category: CategoryCode | Category;
  categoryId?: string;

  image: string | null;
  available: boolean;

  // ✅ THÊM – CHỈ COMBO MỚI CÓ
  comboItems?: ComboItem[];
};



export type ProductDetailResponse = {
  success: boolean;
  data: {
    id: string;
    name: string;
    description: string;
    price: string;  // Backend trả về string
    categoryId: string;
    image: string;
    available: boolean;
    createdAt: string;
    updatedAt: string;
    category: {
      id: string;
      name: string;
      slug: string;
      image: string | null;
      active: boolean;
    };
  };
};

export type ProductDetailFromAPI = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  categoryId: string;
  image: string | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;

  // ✅ THÊM
  type?: ProductType;

  category: Category;

  // ✅ THÊM
  comboItems?: ComboItem[];
};




export type ProductWithCategory = Product & {
  categoryDetail?: {
    id: string;
    name: string;
    slug: string;
  };
};


export type CartItem = {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image: string | null;
  category: CategoryCode;
};

// THÊM Type cho Category từ backend
export type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  products?: Product[]; 
};


export type VoucherType = "PERCENTAGE" | "FIXED" | "FREE_ITEM";

export type Voucher = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount: number;
  type: VoucherType;
  minPoints: number;
};

export type CategoryItem = {
  code: CategoryCode;
  label: string;
};
export interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  total: number | string;
  pointsEarned: number;
  isKiosk: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: any;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;  // 👈 Cập nhật
  quantity: number;
  price: number | string;
  subtotal?: number | string;
}
