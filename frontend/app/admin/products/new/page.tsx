'use client';

import { useState, useEffect, } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, categoryApi } from '@/lib/api';
import { useRef } from 'react';
import { uploadApi } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await adminApi.getCategories();
      setCategories(response.data || response);
      
      // Auto-select first category if available
      if (response.data?.[0]?.id && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: response.data[0].id }));
      }
    } catch (err) {
      console.error('Categories error:', err);
    } finally {
      setCategoriesLoading(false);
    }
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

  // Kiểm tra loại file
  if (!file.type.startsWith('image/')) {
    setError('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP)');
    return;
  }

  // Kiểm tra kích thước file (5MB)
  if (file.size > 5 * 1024 * 1024) {
    setError('Kích thước ảnh tối đa là 5MB');
    return;
  }

  try {
    setUploading(true);
    setError('');

    // 1. Tạo preview ngay lập tức
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);

    // 2. Upload ảnh lên server
    const response = await uploadApi.uploadImage(file, 'products');
    
    if (response.success && response.data?.url) {
      setFormData(prev => ({ 
        ...prev, 
        image: response.data.url 
      }));
      // Không cần alert, có thể hiển thị thông báo nhẹ nhàng
      console.log('Upload ảnh thành công:', response.data.url);
    } else {
      throw new Error('Không nhận được URL ảnh từ server');
    }
    
  } catch (err: any) {
    console.error('Upload error:', err);
    setError(err.message || 'Upload ảnh thất bại. Vui lòng thử lại.');
    
    // Reset preview nếu upload thất bại
    setImagePreview(null);
    setSelectedFile(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  } finally {
    setUploading(false);
  }
};

const handleRemoveImage = async () => {
  if (formData.image && formData.image.startsWith('http')) {
    try {
      // Xóa ảnh từ server (tùy chọn)
      await uploadApi.deleteImage(formData.image);
      console.log('Đã xóa ảnh từ server');
    } catch (err) {
      console.error('Delete image error:', err);
      // Vẫn tiếp tục xóa preview nếu xóa server thất bại
    }
  }
  
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
    setLoading(true);
    setError('');

    let imageUrl = formData.image;

    // Upload ảnh nếu có file mới được chọn nhưng chưa upload
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

    const response = await adminApi.createProduct(productData);
    
    alert('✅ Tạo sản phẩm thành công!');
    router.push('/admin/products');
    router.refresh();
    
  } catch (err: any) {
    console.error('Create product error:', err);
    setError(err.message || 'Không thể tạo sản phẩm. Vui lòng thử lại.');
  } finally {
    setLoading(false);
  }
};

  const formatPrice = (value: string) => {
    // Remove non-numeric characters except dot
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one dot
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
        <h1 className="text-3xl font-bold text-gray-800">Thêm sản phẩm mới</h1>
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
                <p className="text-xs text-gray-500 mt-1">
                  Tên sản phẩm sẽ hiển thị trên website và ứng dụng
                </p>
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
                <p className="text-xs text-gray-500 mt-1">
                  Mô tả hấp dẫn giúp tăng tỉ lệ chuyển đổi
                </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Giá tính bằng VND
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  {categoriesLoading ? (
                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
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
                  )}
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Chưa có danh mục. 
                      <Link href="/admin/categories/new" className="text-blue-600 hover:underline ml-1">
                        Tạo danh mục mới
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Hình ảnh sản phẩm
  </label>

  {/* Image preview với chức năng xoá */}
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
      
      {/* Thông báo upload */}
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
    {/* File upload - ĐÃ HOẠT ĐỘNG */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tải ảnh lên từ máy tính
      </label>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading || loading}
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

    {/* Divider */}
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">HOẶC</span>
      </div>
    </div>

    {/* URL input (dự phòng) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Nhập URL ảnh từ internet
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
        <button
          type="button"
          onClick={() => {
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          disabled={!selectedFile}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Bỏ chọn file
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Dán URL ảnh từ internet (Flickr, Imgur, etc.)
      </p>
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
                  disabled={loading || categoriesLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo sản phẩm'
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
                    setFormData({
                      name: '',
                      description: '',
                      price: '',
                      categoryId: categories[0]?.id || '',
                      image: '',
                      available: true,
                    });
                    setImagePreview(null);
                    setError('');
                  }}
                  className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  Đặt lại form
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar - Tips & Preview */}
        <div className="space-y-6">
          {/* Product Preview */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">👁️ Xem trước</h3>
            
            <div className="border border-gray-200 rounded-lg p-4">
              {/* Product image preview */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {imagePreview || formData.image ? (
                  <img
                    src={imagePreview || formData.image}
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
              
              {/* Product info preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {formData.name || 'Tên sản phẩm'}
                </h4>
                
                {formData.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {formData.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-gray-900">
                    {formData.price 
                      ? `${parseFloat(formData.price).toLocaleString()}đ` 
                      : '0đ'}
                  </span>
                  
                  {!formData.available && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>Đây là cách sản phẩm sẽ hiển thị trên website.</p>
            </div>
          </div>

          {/* Tips & Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Mẹo tạo sản phẩm hiệu quả</h3>
            
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>Tên sản phẩm:</strong> Ngắn gọn, dễ hiểu, có từ khóa</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>Giá cả:</strong> Cạnh tranh, có thể làm tròn (29,000đ thay vì 29,500đ)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>Hình ảnh:</strong> Chất lượng cao, nền trắng, tỉ lệ 1:1</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>Mô tả:</strong> Nêu rõ đặc điểm, lợi ích, hướng dẫn sử dụng</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>Danh mục:</strong> Chọn đúng để khách dễ tìm kiếm</span>
              </li>
            </ul>
          </div>

          {/* Required Fields */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Thông tin bắt buộc</h3>
            
            <ul className="space-y-2 text-yellow-700">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Tên sản phẩm</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Giá bán (VND)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Danh mục</span>
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <p className="text-sm text-gray-600">
                <strong>Lưu ý:</strong> Sản phẩm sẽ không hiển thị nếu chưa có đủ thông tin bắt buộc.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">⚡ Thao tác nhanh</h3>
            
            <div className="space-y-2">
              <Link
                href="/admin/categories/new"
                className="block px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                ➕ Tạo danh mục mới
              </Link>
              
              <Link
                href="/admin/products"
                className="block px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                📋 Xem tất cả sản phẩm
              </Link>
              
              <Link
                href="/admin/categories"
                className="block px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                📂 Quản lý danh mục
              </Link>
              
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full text-left px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                🔼 Lên đầu trang
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile preview (hidden on desktop) */}
      <div className="lg:hidden bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📱 Xem trước trên mobile</h3>
        
        <div className="max-w-xs mx-auto border-2 border-gray-300 rounded-2xl p-4 bg-gray-50">
          {/* Mock mobile screen */}
          <div className="h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
            {imagePreview || formData.image ? (
              <img
                src={imagePreview || formData.image}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl text-gray-400">🛍️</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {formData.name || 'Tên sản phẩm'}
            </h4>
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">
                {formData.price 
                  ? `${parseFloat(formData.price).toLocaleString()}đ` 
                  : '0đ'}
              </span>
              
              <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}