// src/controllers/uploadController.js
import { handleFileUpload, handleMultipleUpload, deleteImage } from '../middleware/upload.js';

export async function uploadImage(request, reply) {
  try {
    const { folder = 'products' } = request.body || {};
    
    const result = await handleFileUpload(request, folder);
    
    return reply.status(200).send({
      success: true,
      message: 'Upload ảnh thành công',
      data: result.data
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Xử lý lỗi cụ thể
    if (error.message.includes('Chỉ cho phép file ảnh')) {
      return reply.status(400).send({
        success: false,
        error: error.message
      });
    }
    
    if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(400).send({
        success: false,
        error: 'File quá lớn. Tối đa 5MB'
      });
    }
    
    return reply.status(500).send({
      success: false,
      error: error.message || 'Lỗi server khi upload ảnh'
    });
  }
}

export async function uploadMultipleImages(request, reply) {
  try {
    const { folder = 'products' } = request.body || {};
    
    const result = await handleMultipleUpload(request, folder, 10);
    
    return reply.status(200).send({
      success: true,
      message: `Upload ${result.data.length} ảnh thành công`,
      data: result.data
    });
  } catch (error) {
    console.error('Upload multiple error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Lỗi server khi upload ảnh'
    });
  }
}

export async function deleteImageHandler(request, reply) {
  try {
    const { imageUrl } = request.body;
    
    if (!imageUrl) {
      return reply.status(400).send({
        success: false,
        error: 'Vui lòng cung cấp URL ảnh'
      });
    }
    
    const result = await deleteImage(imageUrl);
    
    return reply.status(200).send(result);
  } catch (error) {
    console.error('Delete image error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Lỗi server khi xóa ảnh'
    });
  }
}