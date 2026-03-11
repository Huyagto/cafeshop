// lib/api.ts - Service để gọi API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ==================== AUTH API ====================
export const authApi = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Đăng nhập thất bại");
    }

    return response.json();
  },

  async register(userData: {
    email: string;
    name: string;
    phone: string;
    password: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Đăng ký thất bại");
    }

    return response.json();
  },

  async getProfile() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể tải thông tin người dùng");
    }

    return response.json();
  },

  async updateProfile(data: { name: string; phone: string }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Không thể cập nhật thông tin");
    }

    // ⚠️ Backend trả thẳng user object
    return response.json();
  },
};

// ==================== PRODUCT API ====================
export const productApi = {
  async getProducts(params?: { category?: string; search?: string }) {
    const url = new URL(`${API_BASE_URL}/products`);

    if (params?.category) {
      url.searchParams.append("category", params.category);
    }

    if (params?.search) {
      url.searchParams.append("search", params.search);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Không thể tải sản phẩm");
    }

    const json = await response.json();

    return {
      ...json,
      data: json.data.map((p: any) => ({
        ...p,
        price: Number(p.price) || 0,
        comboItems: p.comboItems || [], // ⭐ QUAN TRỌNG CHO COMBO
      })),
    };
  },

  async getProductById(id: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      const data = await res.json();

      if (!data.success || !data.data) return null;

      // TRẢ VỀ ĐÚNG NHƯ API, chỉ parse price
      return {
        ...data.data,
        price: parseFloat(data.data.price) || 0,
        // KHÔNG thay đổi category - giữ nguyên { id, name, slug, ... }
      };
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  },

  async getProductToppings(productId: string) {
    const response = await fetch(
      `${API_BASE_URL}/toppings/product/${productId}`
    );

    if (!response.ok) {
      throw new Error("Không thể tải danh sách topping");
    }

    return response.json();
  },

  async createProductWithImage(productData: any, imageFile?: File) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    let imageUrl = productData.image;

    // Nếu có file ảnh, upload trước
    if (imageFile) {
      // Tạo hàm upload inline để tránh circular dependency
      const uploadResult = await uploadApi.uploadImage(imageFile, "products");
      imageUrl = uploadResult.data.url;
    }

    // Tạo sản phẩm với URL ảnh
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...productData,
        image: imageUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tạo sản phẩm");
    }

    return await response.json();
  },
};
// ==================== CATEGORY API ====================
export const categoryApi = {
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error("Không thể tải danh mục");
    }

    return response.json();
  },

  async getCategoryBySlug(slug: string) {
    const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}`);

    if (!response.ok) {
      throw new Error("Không thể tải thông tin danh mục");
    }

    return response.json();
  },

  // SỬA: Endpoint chính xác theo backend
  async getProductsByCategory(slug: string) {
    const response = await fetch(
      `${API_BASE_URL}/categories/slug/${slug}/products`
    );

    if (!response.ok) {
      throw new Error("Không thể tải sản phẩm theo danh mục");
    }

    return response.json();
  },
};

// ==================== CART API ====================
export const cartApi = {
  // 🔥 Cập nhật cart item + topping
  async updateCartItemWithToppings(
    cartItemId: string,
    quantity: number,
    toppings: { toppingId: string; quantity: number }[]
  ) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(
      `${API_BASE_URL}/cart/items/${cartItemId}/toppings`,
      {
        method: "PUT", // 🔥 ĐÚNG METHOD
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity,
          toppings,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Không thể cập nhật topping");
    }

    return response.json();
  },

  // Lấy giỏ hàng
  async getCart() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Không thể tải giỏ hàng");
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  },

  // Thêm vào giỏ hàng (backend sẽ tự động cộng dồn)
  async addToCart(productId: string, quantity: number = 1) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    try {
      console.log(`POST /cart/items: ${productId}, qty: ${quantity}`);

      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: Number(quantity),
        }),
      });

      console.log("POST Cart status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `Lỗi ${response.status}`
        );
      }

      const data = await response.json();
      console.log("POST Cart response:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("addToCart error:", error);
      throw error;
    }
  },

  // Cập nhật số lượng (ghi đè quantity mới)
  async updateCartItem(productId: string, quantity: number) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    try {
      console.log(`PATCH /cart/items/${productId}: qty=${quantity}`);

      const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: Number(quantity) }),
      });

      console.log("PATCH Cart status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `Lỗi ${response.status}`
        );
      }

      const data = await response.json();
      console.log("PATCH Cart response:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("updateCartItem error:", error);
      throw error;
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  async removeCartItem(productId: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    try {
      console.log(`DELETE /cart/items/${productId}`);

      const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DELETE Cart status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `Lỗi ${response.status}`
        );
      }

      const data = await response.json();
      console.log("DELETE Cart response:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("removeCartItem error:", error);
      throw error;
    }
  },

  // Xóa toàn bộ giỏ hàng
  async clearCart() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    try {
      console.log("DELETE /cart (clear all)");

      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DELETE Cart (clear) status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `Lỗi ${response.status}`
        );
      }

      const data = await response.json();
      console.log("DELETE Cart (clear) response:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("clearCart error:", error);
      throw error;
    }
  },

  // 🔥 HÀM MỚI: Thêm sản phẩm thông minh (tự động check và cộng dồn)
  async smartAddToCart(productId: string, quantity: number = 1) {
    console.log(`smartAddToCart: ${productId}, qty: ${quantity}`);

    // Chỉ cần gọi addToCart, backend đã xử lý cộng dồn
    return this.addToCart(productId, quantity);
  },
};

// ==================== ORDER API ====================
export const orderApi = {
  async createOrder(orderData: any) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể tạo đơn hàng");
    }

    return response.json();
  },

  async getMyOrders() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể tải đơn hàng");
    }

    return response.json();
  },

  async getOrderById(id: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể tải thông tin đơn hàng");
    }

    return response.json();
  },
};

// ==================== LOYALTY API ====================
export const loyaltyApi = {
  async getPoints() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/loyalty/points`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể tải điểm tích lũy");
    }

    return response.json();
  },
};

// ==================== VOUCHER API ====================
export const voucherApi = {
  async getVouchers() {
    const response = await fetch(`${API_BASE_URL}/vouchers`);

    if (!response.ok) {
      throw new Error("Không thể tải voucher");
    }

    return response.json();
  },

  async claimVoucher(voucherId: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/vouchers/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ voucherId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể nhận voucher");
    }

    return response.json();
  },

  async getMyVouchers() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/vouchers/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể tải voucher của bạn");
    }

    return response.json();
  },

  async getVoucherByCode(code: string) {
    const response = await fetch(`${API_BASE_URL}/vouchers/${code}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải thông tin voucher");
    }

    return response.json();
  },

  async applyVoucher(code: string, orderAmount: number) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/vouchers/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, orderAmount }),
    });

    const result = await response.json();

    // ❌ Chỉ check HTTP STATUS
    if (!response.ok) {
      throw new Error(result?.error || "Không thể áp dụng voucher");
    }

    // ✅ Backend đã trả success: true thì TIN LUÔN
    return result;
  },
};

// ==================== HELPER FUNCTIONS ====================
export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem("user");

  if (!userStr || userStr === "undefined") {
    localStorage.removeItem("user");
    return null;
  }

  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error("Invalid user in localStorage:", userStr);
    localStorage.removeItem("user");
    return null;
  }
};

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

// ==================== ADMIN API ====================
export const adminApi = {

  async getVouchers() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/vouchers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải danh sách voucher");
    }

    const data = await response.json();
    
    // Log để debug cấu trúc response
    console.log("Vouchers API Response:", data);
    
    return data;
  },

  async getVoucher(id: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/vouchers/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải thông tin voucher");
    }

    return response.json();
  },

  async updateVoucher(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      discount: number;
      minPoints: number;
      validFrom: string;
      validUntil: string;
      maxUses: number;
      active: boolean;
    }>
  ) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/vouchers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể cập nhật voucher");
    }

    return response.json();
  },

  async deleteVoucher(id: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Vui lòng đăng nhập");

  const response = await fetch(`${API_BASE_URL}/vouchers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ KHÔNG set Content-Type
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Không thể xóa voucher");
  }

  return true;
},

  async getProduct(id: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải sản phẩm");
    }

    return response.json();
  },

  async createCombo(data: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    comboItems: { productId: string; quantity: number }[];
  }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/combos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tạo combo");
    }

    return response.json();
  },

  createVoucher: async (data: any) => {
    const response = await fetch('/api/vouchers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create voucher');
    }
    
    return response.json();
  },

  // === DASHBOARD STATS ===
  async getDashboardStats() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải thống kê");
    }

    return response.json();
  },

  // === PRODUCTS ===
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
  }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const url = new URL(`${API_BASE_URL}/admin/products`);
    if (params) {
      if (params.page) url.searchParams.append("page", params.page.toString());
      if (params.limit)
        url.searchParams.append("limit", params.limit.toString());
      if (params.search) url.searchParams.append("search", params.search);
      if (params.categoryId)
        url.searchParams.append("categoryId", params.categoryId);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải sản phẩm");
    }

    return response.json();
  },

  async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    image?: string;
    available?: boolean;
  }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tạo sản phẩm");
    }

    return response.json();
  },

  async updateProduct(id: string, productData: any) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể cập nhật sản phẩm");
    }

    return response.json();
  },

  async deleteProduct(id: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể xóa sản phẩm");
    }

    return response.json();
  },

  // === ORDERS ===
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    isKiosk?: boolean;
  }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const url = new URL(`${API_BASE_URL}/admin/orders`);
    if (params) {
      if (params.page) url.searchParams.append("page", params.page.toString());
      if (params.limit)
        url.searchParams.append("limit", params.limit.toString());
      if (params.status) url.searchParams.append("status", params.status);
      if (params.search) url.searchParams.append("search", params.search);
      if (params.startDate)
        url.searchParams.append("startDate", params.startDate);
      if (params.endDate) url.searchParams.append("endDate", params.endDate);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải đơn hàng");
    }

    return response.json();
  },

  async getOrderDetails(id: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải chi tiết đơn hàng");
    }

    return response.json();
  },

  async updateOrderStatus(id: string, status: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể cập nhật trạng thái");
    }

    return response.json();
  },

  // === CATEGORIES ===
  async getCategories() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải danh mục");
    }

    return response.json();
  },

  async createCategory(categoryData: {
    name: string;
    slug: string;
    image?: string;
    active?: boolean;
  }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tạo danh mục");
    }

    return response.json();
  },

  // === USERS ===
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const url = new URL(`${API_BASE_URL}/admin/users`);
    if (params) {
      if (params.page) url.searchParams.append("page", params.page.toString());
      if (params.limit)
        url.searchParams.append("limit", params.limit.toString());
      if (params.search) url.searchParams.append("search", params.search);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải người dùng");
    }

    return response.json();
  },

  async deleteUser(id: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể xóa người dùng");
    }

    return response.json();
  },
};
export const userApi = {
  // Admin: Lấy danh sách users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const url = new URL(`${API_BASE_URL}/admin/users`);

    if (params) {
      if (params.page) url.searchParams.append("page", params.page.toString());
      if (params.limit)
        url.searchParams.append("limit", params.limit.toString());
      if (params.search) url.searchParams.append("search", params.search);
      if (params.role) url.searchParams.append("role", params.role);
      if (params.sortBy) url.searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder)
        url.searchParams.append("sortOrder", params.sortOrder);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải người dùng");
    }

    return response.json();
  },

  // Admin: Lấy thống kê users
  async getUserStats() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/users/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải thống kê");
    }

    return response.json();
  },

  // Admin: Lấy chi tiết user
  async getUserById(id: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải thông tin người dùng");
    }

    return response.json();
  },

  // Admin: Tạo user mới
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
    loyaltyPoints?: number;
  }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Không thể tạo người dùng"
      );
    }

    return response.json();
  },

  // Admin: Cập nhật user
  async updateUser(
    id: string,
    userData: {
      name?: string;
      phone?: string;
      role?: string;
      loyaltyPoints?: number;
      password?: string;
    }
  ) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Không thể cập nhật người dùng"
      );
    }

    return response.json();
  },

  // Admin: Xóa user
  async deleteUser(id: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Không thể xóa người dùng"
      );
    }

    return response.json();
  },

  // Admin: Đổi role user
  async changeUserRole(id: string, role: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Không thể đổi role");
    }

    return response.json();
  },

  // Admin: Reset password
  async resetPassword(id: string, newPassword: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(
      `${API_BASE_URL}/admin/users/${id}/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Không thể reset mật khẩu"
      );
    }

    return response.json();
  },

  // Admin: Cập nhật điểm loyalty
  async updateLoyaltyPoints(
    id: string,
    points: number,
    operation: "add" | "subtract",
    reason?: string
  ) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(
      `${API_BASE_URL}/admin/users/${id}/loyalty-points`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points, operation, reason }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Không thể cập nhật điểm"
      );
    }

    return response.json();
  },
};
// ==================== UPLOAD API ====================
export const uploadApi = {
  // Upload ảnh đơn
  async uploadImage(file: File, folder = "products") {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Upload ảnh thất bại");
    }

    return await response.json();
  },

  // Upload nhiều ảnh
  async uploadMultipleImages(files: File[], folder = "products") {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("folder", folder);

    const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Upload ảnh thất bại");
    }

    return await response.json();
  },

  // Xóa ảnh
  async deleteImage(imageUrl: string) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Xóa ảnh thất bại");
    }

    return await response.json();
  },
};
