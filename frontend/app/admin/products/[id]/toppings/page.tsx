"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Topping {
  id: string;
  name: string;
  price: number;
}

export default function ProductToppingsAdminPage() {
  const { id: productId } = useParams();

  const [allToppings, setAllToppings] = useState<Topping[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // 1) Tất cả topping
        const allRes = await fetch("http://localhost:4000/api/toppings");
        const allJson = await allRes.json();
        setAllToppings(allJson.data.toppings || []);

        // 2) Topping đã gán cho product
        const assignedRes = await fetch(
          `http://localhost:4000/api/toppings/product/${productId}`
        );
        const assignedJson = await assignedRes.json();

        // API trả: { data: { toppings: [{ topping: { id } }, ...] } }
        const ids =
          assignedJson?.data?.toppings?.map((pt: any) => pt.topping.id) || [];
        setAssignedIds(ids);
      } catch (e) {
        setError("Không tải được dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [productId]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">
        Gán topping cho sản phẩm: {productId}
      </h1>

      <div className="space-y-2">
       {allToppings.map((t) => {
  const checked = assignedIds.includes(t.id);

  return (
    <label
      key={t.id}
      className="border rounded p-3 flex items-center gap-3"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={async (e) => {
          const isChecked = e.target.checked;

          try {
            if (isChecked) {
              // ➕ GÁN TOPPING
              await fetch(
                `http://localhost:4000/api/toppings/product/${productId}/${t.id}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                  body: JSON.stringify({
                    isRequired: false,
                    maxQuantity: 3,
                  }),
                }
              );

              setAssignedIds((prev) => [...prev, t.id]);
            } else {
              // ➖ GỠ TOPPING
              await fetch(
                `http://localhost:4000/api/toppings/product/${productId}/${t.id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );

              setAssignedIds((prev) =>
                prev.filter((id) => id !== t.id)
              );
            }
          } catch (err) {
            alert("Thao tác thất bại");
          }
        }}
      />

      <span className="flex-1">{t.name}</span>
      <span>{t.price.toLocaleString()}đ</span>
    </label>
  );
})}

      </div>
    </div>
  );
}
