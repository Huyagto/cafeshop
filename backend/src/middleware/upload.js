// src/middleware/upload.js
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Kiểm tra loại file hợp lệ
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export async function handleFileUpload(request) {
  try {
    // 🚨 PHẢI đọc file TRƯỚC, không đụng request.body
    const data = await request.file();

    if (!data) {
      throw new Error('Không có file được upload');
    }

    // ✅ LẤY FOLDER TỪ MULTIPART FIELDS
    const folder = data.fields?.folder?.value || 'products';

    // Kiểm tra loại file
    if (!allowedMimeTypes.includes(data.mimetype)) {
      throw new Error('Chỉ cho phép file ảnh (jpeg, jpg, png, gif, webp)');
    }

    // Kiểm tra extension
    const ext = path.extname(data.filename).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error('Chỉ cho phép file ảnh (jpeg, jpg, png, gif, webp)');
    }

    // Tạo tên file duy nhất
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${random}${ext}`;

    // Tạo thư mục đích
    const destFolder = path.join(uploadDir, folder);
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const filepath = path.join(destFolder, filename);

    // Lưu file
    await pipeline(data.file, fs.createWriteStream(filepath));

    // Tạo URL
    const baseUrl = `${request.protocol}://${request.hostname}`;
    const port = request.server?.address()?.port || process.env.PORT || 4000;

    const fullUrl =
      process.env.NODE_ENV === 'production'
        ? `${baseUrl}/uploads/${folder}/${filename}`
        : `${baseUrl}:${port}/uploads/${folder}/${filename}`;

    return {
      success: true,
      data: {
        url: fullUrl,
        filename,
        originalname: data.filename,
        mimetype: data.mimetype,
        size: data.file.bytesRead || fs.statSync(filepath).size,
        path: `/uploads/${folder}/${filename}`,
      },
    };
  } catch (error) {
    console.error('Upload handler error:', error);
    throw error;
  }
}

export async function handleMultipleUpload(request, folder = 'products', maxFiles = 10) {
  try {
    const parts = request.parts();
    const files = [];
    
    for await (const part of parts) {
      if (part.type === 'file') {
        // Kiểm tra loại file
        if (!allowedMimeTypes.includes(part.mimetype)) {
          throw new Error('Chỉ cho phép file ảnh (jpeg, jpg, png, gif, webp)');
        }
        
        // Kiểm tra extension
        const ext = path.extname(part.filename).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          throw new Error('Chỉ cho phép file ảnh (jpeg, jpg, png, gif, webp)');
        }
        
        // Tạo tên file duy nhất
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        const filename = `${timestamp}-${random}${ext}`;
        
        // Tạo thư mục đích
        const destFolder = path.join(uploadDir, folder);
        if (!fs.existsSync(destFolder)) {
          fs.mkdirSync(destFolder, { recursive: true });
        }
        
        const filepath = path.join(destFolder, filename);
        
        // Lưu file
        await pipeline(part.file, fs.createWriteStream(filepath));
        
        // Tạo URL
        const baseUrl = `${request.protocol}://${request.hostname}`;
        const port = request.server?.address()?.port || process.env.PORT || 4000;
        const fullUrl = process.env.NODE_ENV === 'production' 
          ? `${baseUrl}/uploads/${folder}/${filename}`
          : `${baseUrl}:${port}/uploads/${folder}/${filename}`;
        
        files.push({
          url: fullUrl,
          filename,
          originalname: part.filename,
          mimetype: part.mimetype,
          size: part.file.bytesRead || fs.statSync(filepath).size,
          path: `/uploads/${folder}/${filename}`
        });
        
        if (files.length >= maxFiles) break;
      } else if (part.type === 'field') {
        // Lưu các field nếu cần
        request.body = request.body || {};
        request.body[part.fieldname] = part.value;
      }
    }
    
    return {
      success: true,
      data: files
    };
  } catch (error) {
    console.error('Multiple upload handler error:', error);
    throw error;
  }
}

export async function deleteImage(imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error('Vui lòng cung cấp URL ảnh');
    }
    
    // Lấy đường dẫn file từ URL
    let filePath;
    try {
      const url = new URL(imageUrl);
      const relativePath = url.pathname.replace('/uploads/', '');
      filePath = path.join(uploadDir, relativePath);
    } catch (error) {
      // Nếu không phải URL hợp lệ, coi như là đường dẫn tương đối
      const relativePath = imageUrl.replace(/^\/uploads\//, '');
      filePath = path.join(uploadDir, relativePath);
    }
    
    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      throw new Error('File không tồn tại');
    }
    
    // Xóa file
    fs.unlinkSync(filePath);
    
    return {
      success: true,
      message: 'Xóa ảnh thành công'
    };
  } catch (error) {
    console.error('Delete image error:', error);
    throw error;
  }
}