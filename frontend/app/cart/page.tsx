// app/cart/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cartApi, orderApi, productApi, voucherApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/api";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string | null;
  quantity: number;
  totalPrice: number;
  toppings: CartItemTopping[];
  product?: {
    type?: "SINGLE" | "COMBO";
    comboItems?: {
      id: string;
      quantity: number;
      product: {
        id: string;
        name: string;
      };
    }[];
  };
}

interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

interface Topping {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  available: boolean;
}

interface ProductTopping {
  id: string;
  maxQuantity: number;
  topping: {
    id: string;
    name: string;
    price: number;
  };
}

interface CartItemTopping {
  id: string;
  toppingId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  expiresAt: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderNote, setOrderNote] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const user = getCurrentUser();

  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [availableToppings, setAvailableToppings] = useState<ProductTopping[]>(
    []
  );
  const [selectedToppings, setSelectedToppings] = useState<Map<string, number>>(
    new Map()
  );

  const [toppingModalOpen, setToppingModalOpen] = useState(false);
  const [loadingToppings, setLoadingToppings] = useState(false);

  const [voucherCode, setVoucherCode] = useState(""); // Input mã voucher
  const [voucherError, setVoucherError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const FILE_BASE_URL = "http://localhost:4000";

  const getImageUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/uploads")) return `${FILE_BASE_URL}${path}`;
    return `${FILE_BASE_URL}/${path}`;
  };

  useEffect(() => {
    loadCart();

    // 🔥 Listen for cart update events
    const handleCartUpdated = () => {
      console.log("Cart updated event received, reloading cart...");
      loadCart();
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }

    if (!cart) return;

    try {
      setValidatingVoucher(true);
      setVoucherError("");

      // 👉 voucherApi.applyVoucher đã return { success, data }
      const result = await voucherApi.applyVoucher(
        voucherCode,
        cart.totalAmount
      );

      // ✅ CHỈ CHECK 1 LẦN DUY NHẤT
      if (!result?.success) {
        throw new Error(result?.error || "Áp dụng voucher thất bại");
      }

      setAppliedVoucher(result.data);
      setDiscountAmount(result.data.discountAmount);

      alert(
        `Áp dụng voucher thành công! Giảm ${result.data.discountAmount.toLocaleString()}đ`
      );
    } catch (err: any) {
      setVoucherError(err.message || "Mã voucher không hợp lệ");
      setAppliedVoucher(null);
      setDiscountAmount(0);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setVoucherCode("");
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherError("");
  };

  const loadCart = async () => {
    try {
      setLoading(true);

      const response = await cartApi.getCart();

      if (response?.success && response.data?.data) {
        const cartData = response.data.data; // 🔥 FIX QUAN TRỌNG

        const cart: Cart = {
          id: cartData.id,
          userId: cartData.userId,

          items: (cartData.items || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,

            productName: item.product?.name || "",
            productImage: item.product?.image || null,

            productPrice: Number(item.price) || 0,
            quantity: item.quantity,
            totalPrice: Number(item.subtotal) || 0,

            toppings: (item.toppings || []).map((topping: any) => ({
              id: topping.id,
              toppingId: topping.toppingId,
              name: topping.topping?.name || topping.name,
              price: Number(topping.price) || 0,
              quantity: topping.quantity || 1,
            })),
            product: item.product,
          })),

          totalAmount: Number(cartData.total) || 0,
          itemCount: cartData.items?.length || 0,
        };

        setCart(cart);
      } else {
        setCart(null);
      }
    } catch (err) {
      console.error("Error loading cart:", err);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const openToppingModal = async (item: CartItem) => {
    setEditingItem(item);
    setToppingModalOpen(true);

    // 🔥 Reset trước để không dính state cũ
    const initialSelected = new Map<string, number>();
    item.toppings.forEach((topping) => {
      initialSelected.set(topping.toppingId, topping.quantity);
    });
    setSelectedToppings(initialSelected);

    try {
      setLoadingToppings(true);

      const response = await productApi.getProductToppings(item.productId);

      // 🔥 ÉP KIỂU AN TOÀN – LUÔN RA MẢNG
      const toppings: ProductTopping[] = response?.data?.toppings || [];
      setAvailableToppings(toppings);
    } catch (err) {
      console.error("Error loading toppings:", err);
      setError("Không thể load danh sách topping");
      setAvailableToppings([]); // 🔥 đảm bảo không crash UI
    } finally {
      setLoadingToppings(false);
    }
  };

  const updateItemToppings = async () => {
    if (!editingItem) return;

    try {
      setUpdating(editingItem.productId);

      // Chuyển Map thành mảng {toppingId, quantity}
      const toppingsArray = Array.from(selectedToppings.entries()).map(
        ([toppingId, quantity]) => ({
          toppingId,
          quantity,
        })
      );

      // Gọi API cập nhật cart item với topping
      const result = await cartApi.updateCartItemWithToppings(
        editingItem.id,
        editingItem.quantity,
        toppingsArray
      );

      if (result?.success) {
        await loadCart();
        setToppingModalOpen(false);
        setEditingItem(null);
        setSelectedToppings(new Map());
      }
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật topping");
    } finally {
      setUpdating(null);
    }
  };

  const calculateItemTotal = (item: CartItem) => {
    const basePrice = item.productPrice * item.quantity;
    const toppingsPrice = item.toppings.reduce(
      (sum, topping) => sum + topping.price * topping.quantity,
      0
    );
    return basePrice + toppingsPrice;
  };

  const calculateCartTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // Cập nhật quantity của topping
  const updateToppingQuantity = (toppingId: string, quantity: number) => {
    if (quantity < 0) return;

    const newSelected = new Map(selectedToppings);
    if (quantity === 0) {
      newSelected.delete(toppingId);
    } else {
      newSelected.set(toppingId, quantity);
    }
    setSelectedToppings(newSelected);
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(productId);
      await cartApi.updateCartItem(productId, newQuantity);
      await loadCart(); // Reload cart
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật số lượng");
    } finally {
      setUpdating(null);
    }
  };

  // app/cart/page.tsx - Sửa hàm removeItem
  const removeItem = async (productId: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) return;

    try {
      setUpdating(productId);
      console.log(`Removing item ${productId}...`);

      const result = await cartApi.removeCartItem(productId);
      console.log("Remove item result:", result);

      // Reload cart sau khi xóa
      await loadCart();

      // Hiển thị thông báo
      alert("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (err: any) {
      console.error("Remove item error details:", err);
      setError(err.message || "Không thể xóa sản phẩm");
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    if (!cart || cart.items.length === 0) return;
    if (!confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) return;

    try {
      await cartApi.clearCart();
      setCart(null);
    } catch (err: any) {
      setError(err.message || "Không thể xóa giỏ hàng");
    }
  };

  const handleCheckout = async () => {
  if (!user) {
    router.push("/login?redirect=/cart");
    return;
  }

  if (!cart || cart.items.length === 0) {
    setError("Giỏ hàng trống");
    return;
  }

  try {
    setCheckoutLoading(true);
    setError("");

    const orderData: any = {
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.productPrice,
        toppings: item.toppings.map((t) => ({
          toppingId: t.toppingId,
          price: t.price,
          quantity: t.quantity,
        })),
      })),
      
      finalAmount,
      notes: orderNote || null,
    };

    // ✅ CHỈ GỬI voucherCode KHI CÓ
    if (appliedVoucher?.voucher?.code) {
      orderData.voucherCode = appliedVoucher.voucher.code;
    }

    const response = await orderApi.createOrder(orderData);

    // ✅ backend trả order object trực tiếp
    const orderId = response?.id || response?.data?.id;

    await cartApi.clearCart();

    if (orderId) {
      router.push(`/orders/${orderId}`);
    } else {
      router.push("/orders");
    }
  } catch (err: any) {
    setError(err.message || "Không thể tạo đơn hàng");
  } finally {
    setCheckoutLoading(false);
  }
};


  const finalAmount = cart ? cart.totalAmount - discountAmount : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B4513]"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Giỏ hàng của bạn trống
            </h2>
            <p className="text-gray-600 mb-6">
              Vui lòng đăng nhập để xem giỏ hàng
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/login?redirect=/cart")}
                className="w-full bg-[#8B4513] text-white py-3 rounded-lg hover:bg-[#7a3c12] transition"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => router.push("/product")}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Giỏ hàng của bạn trống
            </h2>
            <p className="text-gray-600 mb-6">
              Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm
            </p>
            <button
              onClick={() => router.push("/product")}
              className="w-full bg-[#8B4513] text-white py-3 rounded-lg hover:bg-[#7a3c12] transition"
            >
              Mua sắm ngay
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Giỏ hàng của tôi
          </h1>
          <p className="text-gray-600">
            Bạn có {cart.itemCount} sản phẩm trong giỏ hàng
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sản phẩm
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Xóa tất cả
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.items.map((item) => {
                  const isCombo = item.product?.type === "COMBO";

                  return (
                    <div
                      key={item.id}
                      className="p-6 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={getImageUrl(item.productImage)}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900 mb-1">
                                {item.productName}
                              </h3>

                              {/* ===== COMBO ITEMS – CHỈ HIỂN THỊ ===== */}
                              {isCombo &&
                                item.product?.comboItems &&
                                item.product.comboItems.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-amber-200">
                                    <p className="text-sm text-gray-600 mb-1">
                                      Sản phẩm trong combo:
                                    </p>
                                    <ul className="space-y-1">
                                      {item.product.comboItems.map(
                                        (ci: any) => (
                                          <li
                                            key={ci.id}
                                            className="text-sm text-gray-700 flex items-center gap-2"
                                          >
                                            <span className="text-amber-600">
                                              •
                                            </span>
                                            <span>{ci.product.name}</span>
                                            <span className="text-gray-400">
                                              (x{ci.quantity})
                                            </span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {/* TOPPING CHỈ HIỆN CHO SẢN PHẨM THƯỜNG */}
                              {!isCombo &&
                                item.toppings &&
                                item.toppings.length > 0 && (
                                  <div className="mb-2 mt-2">
                                    <p className="text-sm text-gray-600 mb-1">
                                      Topping đã chọn:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {item.toppings.map((topping) => (
                                        <span
                                          key={topping.id}
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800"
                                        >
                                          {topping.name} (+
                                          {topping.price.toLocaleString()}đ)
                                          {topping.quantity > 1 &&
                                            ` x${topping.quantity}`}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              <p className="text-xl font-bold text-[#8B4513] mb-1">
                                {item.productPrice.toLocaleString()}đ
                              </p>

                              {isCombo && (
                                <p className="text-xs text-gray-500">
                                  Giá combo
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => removeItem(item.productId)}
                              disabled={updating === item.productId}
                              className="text-gray-400 hover:text-red-500 transition"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* ===== NÚT TOPPING: ẨN VỚI COMBO ===== */}
                          {!isCombo && (
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => openToppingModal(item)}
                                className="flex items-center text-sm text-[#8B4513] hover:text-[#7a3c12]"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                {item.toppings && item.toppings.length > 0
                                  ? "Đổi topping"
                                  : "Thêm topping"}
                              </button>
                            </div>
                          )}

                          {/* Quantity + Total */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity - 1
                                  )
                                }
                                disabled={
                                  item.quantity <= 1 ||
                                  updating === item.productId
                                }
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg"
                              >
                                −
                              </button>

                              <div className="w-12 h-10 flex items-center justify-center font-medium">
                                {item.quantity}
                              </div>

                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                                disabled={updating === item.productId}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-lg font-bold text-gray-900">
                              {item.totalPrice.toLocaleString()}đ
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <button
                onClick={() => router.push("/product")}
                className="flex items-center text-[#8B4513] hover:text-[#7a3c12] font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Tiếp tục mua sắm
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Voucher Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Áp dụng voucher</h3>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã voucher"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:border-[#8B4513] focus:outline-none"
                  />

                  <button
                    onClick={applyVoucher}
                    disabled={validatingVoucher}
                    className="px-4 py-3 bg-[#8B4513] text-white rounded-lg hover:bg-[#7a3c12]"
                  >
                    {validatingVoucher ? "Đang áp dụng..." : "Áp dụng"}
                  </button>
                </div>

                {voucherError && (
                  <p className="text-sm text-red-600">{voucherError}</p>
                )}

                {appliedVoucher && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      Đã áp dụng voucher <b>{voucherCode}</b>
                    </p>
                    <p className="text-sm text-green-600">
                      Giảm {discountAmount.toLocaleString()}đ
                    </p>

                    <button
                      onClick={removeVoucher}
                      className="text-xs text-red-500 mt-1 underline"
                    >
                      Gỡ voucher
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  Thông tin đơn hàng
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Order Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú đơn hàng (tùy chọn)
                  </label>
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-[#8B4513] focus:outline-none focus:ring-2 focus:ring-amber-100"
                    placeholder="Ví dụ: Không đường, ít đá, giao giờ hành chính..."
                  />
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{cart.totalAmount.toLocaleString()}đ</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá voucher</span>
                      <span>-{discountAmount.toLocaleString()}đ</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>Tổng cộng</span>
                    <span>{finalAmount.toLocaleString()}đ</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-[#8B4513] hover:bg-[#7a3c12] text-white font-semibold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Thanh toán
                    </>
                  )}
                </button>

                {/* Security Info */}
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                  <p className="flex items-center mb-1">
                    <svg
                      className="w-4 h-4 mr-1 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Thanh toán an toàn
                  </p>
                  <p className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Miễn phí vận chuyển cho đơn từ 100.000đ
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  Thông tin khách hàng
                </h3>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-gray-900">{user.phone}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => router.push("/account")}
                  className="mt-4 text-sm text-[#8B4513] hover:text-[#7a3c12] font-medium flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Cập nhật thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* ================= TOPPING MODAL ================= */}
      {toppingModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">
              Chọn topping cho {editingItem.productName}
            </h3>

            {loadingToppings ? (
              <div className="text-center py-6">Đang tải topping...</div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Array.isArray(availableToppings) &&
                  availableToppings.map((pt) => {
                    // ✅ DÙNG topping.id (ID THẬT) để lưu quantity
                    const qty = selectedToppings.get(pt.topping.id) || 0;

                    return (
                      <div
                        key={pt.id} // ✅ key là ProductTopping.id
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium">{pt.topping.name}</p>
                          <p className="text-sm text-gray-500">
                            +{Number(pt.topping.price).toLocaleString()}đ
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateToppingQuantity(pt.topping.id, qty - 1)
                            }
                            className="w-8 h-8 border rounded"
                            disabled={qty === 0}
                          >
                            −
                          </button>

                          <span className="w-6 text-center">{qty}</span>

                          <button
                            onClick={() =>
                              updateToppingQuantity(pt.topping.id, qty + 1)
                            }
                            className="w-8 h-8 border rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setToppingModalOpen(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Hủy
              </button>

              <button
                onClick={updateItemToppings}
                className="px-4 py-2 bg-[#8B4513] text-white rounded-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
