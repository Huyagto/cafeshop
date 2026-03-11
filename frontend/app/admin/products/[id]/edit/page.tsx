// app/admin/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi, uploadApi } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category?: Category;
  image: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    image: '',
    available: true,
  });

  useEffect(() => {
    if (id) {
      fetchProductAndCategories();
    }
  }, [id]);

  const fetchProductAndCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Cần thêm hàm getProduct vào adminApi
      const [productResponse, categoriesResponse] = await Promise.all([
        fetchProduct(id),
        adminApi.getCategories()
      ]);
      
      const productData = productResponse.data || productResponse;
      const categoriesData = categoriesResponse.data || categoriesResponse;
      
      setProduct(productData);
      setCategories(categoriesData);
      
      // Điền dữ liệu vào form
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        categoryId: productData.categoryId || '',
        image: productData.image || '',
        available: productData.available ?? true,
      });
      
      // Set image preview nếu có ảnh
      if (productData.image) {
        setImagePreview(productData.image);
      }
      
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Hàm tạm để fetch product - cần thêm vào adminApi
  const fetchProduct = async (productId: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products/${productId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể tải sản phẩm");
    }

    return response.json();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh tối đa là 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setSelectedFile(file);

      // Upload ảnh lên server
      const response = await uploadApi.uploadImage(file, 'products');
      
      if (response.success && response.data?.url) {
        setFormData(prev => ({ 
          ...prev, 
          image: response.data.url 
        }));
        console.log('Upload ảnh thành công:', response.data.url);
      } else {
        throw new Error('Không nhận được URL ảnh từ server');
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload ảnh thất bại. Vui lòng thử lại.');
      
      setImagePreview(null);
      setSelectedFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    // Chỉ xóa preview, giữ nguyên ảnh cũ
    setImagePreview(null);
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên sản phẩm');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Vui lòng nhập giá hợp lệ');
      return;
    }
    
    if (!formData.categoryId) {
      setError('Vui lòng chọn danh mục');
      return;
    }

    try {
      setUpdating(true);
      setError('');

      let imageUrl = formData.image;

      // Upload ảnh nếu có file mới
      if (selectedFile && !imageUrl) {
        try {
          setUploading(true);
          const uploadResponse = await uploadApi.uploadImage(selectedFile, 'products');
          if (uploadResponse.success && uploadResponse.data?.url) {
            imageUrl = uploadResponse.data.url;
          }
        } catch (uploadError: any) {
          console.error('Upload error in submit:', uploadError);
          setError('Lỗi upload ảnh: ' + uploadError.message);
          return;
        } finally {
          setUploading(false);
        }
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        image: imageUrl || undefined,
        available: formData.available,
      };

      await adminApi.updateProduct(id, productData);
      
      alert('✅ Cập nhật sản phẩm thành công!');
      router.push('/admin/products');
      router.refresh();
      
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Không thể cập nhật sản phẩm. Vui lòng thử lại.');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return numericValue;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPrice(e.target.value);
    setFormData(prev => ({ ...prev, price: formattedValue }));
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, image: url }));
    setImagePreview(url || null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Quay lại
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Chỉnh sửa sản phẩm</h1>
        {product && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            ID: {product.id.substring(0, 8)}...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Product name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Cà phê đen nguyên chất"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả sản phẩm
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá bán <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      đ
                    </span>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handlePriceChange}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm
                </label>

                {/* Current image info */}
                {product?.image && !formData.image && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Đang sử dụng ảnh hiện tại. Thay đổi ảnh mới sẽ ghi đè ảnh cũ.
                    </p>
                  </div>
                )}

                {/* Image preview */}
                {(imagePreview || formData.image) && (
                  <div className="mb-4">
                    <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden group">
                      <img
                        src={imagePreview || formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIHN0cm9rZT0iI0U1RTVFNSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik03MCAxMjBMMTAwIDkwTDEzMCAxMjAiIHN0cm9rZT0iI0U1RTVFNSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTkwIDgwSDEwMHYyMEg5MFoiIGZpbGw9IiNFNUU1RTUiLz4KPC9zdmc+';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                        title="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                    
                    {uploading && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Đang upload ảnh...
                      </div>
                    )}
                  </div>
                )}

                {/* Upload options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tải ảnh mới lên
                    </label>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading || updating}
                        className="w-full opacity-0 absolute z-10 h-12 cursor-pointer disabled:cursor-not-allowed"
                        id="file-upload"
                      />
                      <label 
                        htmlFor="file-upload"
                        className={`h-12 px-4 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
                          uploading 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                        }`}
                      >
                        {uploading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-gray-600">Đang upload...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">📁</span>
                            <span className="text-gray-700">
                              {selectedFile ? selectedFile.name : 'Chọn ảnh từ máy tính'}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Hỗ trợ JPG, PNG, GIF, WebP. Tối đa 5MB.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">HOẶC</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhập URL ảnh
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.image}
                        onChange={handleImageUrlChange}
                        placeholder="https://example.com/image.jpg"
                        disabled={uploading || !!selectedFile}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="available"
                  id="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="available" className="ml-2 text-sm text-gray-700">
                  Sản phẩm có sẵn để bán
                </label>
              </div>

              {/* Form actions */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật sản phẩm'
                  )}
                </button>
                
                <Link
                  href="/admin/products"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy bỏ
                </Link>
                
                <button
                  type="button"
                  onClick={() => {
                    // Reset về giá trị ban đầu
                    if (product) {
                      setFormData({
                        name: product.name || '',
                        description: product.description || '',
                        price: product.price?.toString() || '',
                        categoryId: product.categoryId || '',
                        image: product.image || '',
                        available: product.available ?? true,
                      });
                      setImagePreview(product.image || null);
                      setSelectedFile(null);
                    }
                    setError('');
                  }}
                  className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  Hoàn tác
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ℹ️ Thông tin sản phẩm</h3>
            
            {product && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-mono text-sm">{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span>{new Date(product.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cập nhật cuối:</span>
                  <span>{new Date(product.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Danh mục hiện tại:</span>
                  <span>{product.category?.name || 'Chưa có'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">👁️ Xem trước</h3>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {imagePreview || formData.image || product?.image ? (
                  <img
                    src={imagePreview || formData.image || product?.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIHN0cm9rZT0iI0U1RTVFNSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik03MCAxMjBMMTAwIDkwTDEzMCAxMjAiIHN0cm9rZT0iI0U1RTVFNSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTkwIDgwSDEwMHYyMEg5MFoiIGZpbGw9IiNFNUU1RTUiLz4KPC9zdmc+';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl text-gray-400">🛍️</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {formData.name || product?.name || 'Tên sản phẩm'}
                </h4>
                
                {(formData.description || product?.description) && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {formData.description || product?.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-gray-900">
                    {formData.price 
                      ? `${parseFloat(formData.price).toLocaleString()}đ` 
                      : product?.price 
                      ? `${product.price.toLocaleString()}đ`
                      : '0đ'}
                  </span>
                  
                  {!(formData.available ?? product?.available) && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Vùng nguy hiểm</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.')) {
                    adminApi.deleteProduct(id)
                      .then(() => {
                        alert('✅ Xóa sản phẩm thành công!');
                        router.push('/admin/products');
                      })
                      .catch((err) => {
                        alert('❌ Lỗi: ' + err.message);
                      });
                  }
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Xóa sản phẩm
              </button>
              
              <p className="text-sm text-red-700">
                <strong>Lưu ý:</strong> Xóa sản phẩm sẽ xóa tất cả thông tin liên quan và không thể khôi phục.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}