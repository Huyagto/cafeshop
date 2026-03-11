'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import { authApi, getCurrentUser } from '@/lib/api';

export default function EditAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
  });

  // Load dữ liệu cũ
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setForm({
      name: user.name || '',
      phone: user.phone || '',
    });
  }, [router]);

  // Submit cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const updatedUser = await authApi.updateProfile(form);

      // Lưu user mới
      localStorage.setItem('user', JSON.stringify(updatedUser));

      alert('✅ Cập nhật thông tin thành công');
      router.push('/account');
    } catch (err: any) {
      alert(err.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8 max-w-xl">
          <h1 className="text-2xl font-bold mb-6">Chỉnh sửa thông tin</h1>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-sm border space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Họ và tên
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full px-4 py-3 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Số điện thoại
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gray-900 text-white py-3 rounded-lg"
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 border py-3 rounded-lg"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
