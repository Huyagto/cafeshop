"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface SelectedItem {
  productId: string;
  quantity: number;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminCreateComboPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // LOAD PRODUCTS + CATEGORIES
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoryRes] = await Promise.all([
          adminApi.getProducts({ limit: 100 }),
          adminApi.getCategories(),
        ]);

        setProducts(productRes.data || []);
        setCategories(categoryRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu");
      }
    };

    fetchData();
  }, []);

  // Toggle chọn sản phẩm
  const toggleProduct = (productId: string) => {
    const exists = selectedItems.find((i) => i.productId === productId);

    if (exists) {
      setSelectedItems((prev) =>
        prev.filter((i) => i.productId !== productId)
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        { productId, quantity: 1 },
      ]);
    }
  };

  // Update quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setSelectedItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );
  };

  // SUBMIT
  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên combo");
      return;
    }

    if (!categoryId) {
      alert("Vui lòng chọn danh mục combo");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await adminApi.createCombo({
        name,
        description,
        price: Number(price),
        categoryId,
        comboItems: selectedItems, // ✅ ĐÚNG FIELD
      });

      alert("Tạo combo thành công");
      router.push("/admin/products");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể tạo combo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          🎁 Tạo combo mới
        </h1>

        <Link
          href="/admin/products"
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          ← Quay lại
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        {/* Name */}
        <div>
          <label className="block font-medium mb-1">Tên combo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-medium mb-1">
            Danh mục combo
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block font-medium mb-1">Giá combo</label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Products */}
        <div>
          <h2 className="font-semibold mb-2">Sản phẩm trong combo</h2>

          <div className="space-y-2 border rounded p-3 max-h-80 overflow-y-auto">
            {products.map((p) => {
              const selected = selectedItems.find(
                (i) => i.productId === p.id
              );

              return (
                <div key={p.id} className="flex gap-3 items-center">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <div className="flex-1">
                    {p.name} ({p.price.toLocaleString()}đ)
                  </div>
                  {selected && (
                    <input
                      type="number"
                      min={1}
                      value={selected.quantity}
                      onChange={(e) =>
                        updateQuantity(p.id, Number(e.target.value))
                      }
                      className="w-20 border rounded px-2 py-1"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded"
          >
            Hủy
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded"
          >
            {loading ? "Đang tạo..." : "Tạo combo"}
          </button>
        </div>
      </div>
    </div>
  );
}
