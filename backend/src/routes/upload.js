// src/routes/upload.js - CODE MỚI 100%
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

export default async function uploadRoutes(fastify, options) {
  console.log('📤 Loading upload routes...');

  // Helper function để kiểm tra admin
  const requireAdmin = async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        throw new Error('Vui lòng đăng nhập');
      }
      
      const decoded = await fastify.jwt.verify(token);
      request.user = decoded;
      
      if (decoded.role !== 'ADMIN') {
        throw new Error('Chỉ admin mới được thực hiện hành động này');
      }
    } catch (error) {
      reply.code(401).send({
        success: false,
        error: error.message || 'Token không hợp lệ'
      });
      throw error;
    }
  };

  // ========== UPLOAD SINGLE IMAGE - SIMPLE & WORKING ==========
  fastify.post('/', 
    {
      preHandler: [requireAdmin]
    },
    async (request, reply) => {
      console.log('\n📤 ========== UPLOAD REQUEST ==========');
      
      try {
        // Kiểm tra multipart
        if (!request.isMultipart()) {
          return reply.code(400).send({
            success: false,
            error: 'Request phải là multipart/form-data'
          });
        }

        // Sử dụng cách đơn giản nhất: request.file()
        console.log('📤 Calling request.file()...');
        const data = await request.file();
        
        if (!data) {
          console.log('❌ request.file() returned null');
          
          // Thử cách khác: duyệt qua tất cả parts
          console.log('🔄 Trying to iterate through request.parts()...');
          const parts = request.parts();
          let fileData = null;
          let folder = 'products';
          
          try {
            for await (const part of parts) {
              console.log('📦 Part found:', {
                type: part.type,
                fieldname: part.fieldname,
                filename: part.filename || '(field)'
              });
              
              if (part.type === 'file') {
                fileData = part;
                console.log('✅ Found file:', part.filename);
              } else if (part.type === 'field' && part.fieldname === 'folder') {
                folder = part.value;
              }
            }
          } catch (iterError) {
            console.error('❌ Error iterating parts:', iterError.message);
          }
          
          if (!fileData) {
            return reply.code(400).send({
              success: false,
              error: 'Không tìm thấy file trong request. Kiểm tra: 1) Field name là "image", 2) File đã được chọn'
            });
          }
          
          // Xử lý file tìm được
          return await processUpload(fileData, folder, reply);
        }
        
        console.log('✅ Got file from request.file():', data.filename);
        
        // Lấy folder
        let folder = 'products';
        if (data.fields && data.fields.folder && data.fields.folder.value) {
          folder = data.fields.folder.value;
        }
        
        return await processUpload(data, folder, reply);
        
      } catch (error) {
        console.error('❌ Upload error:', error);
        
        if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
          return reply.code(400).send({
            success: false,
            error: 'File quá lớn. Tối đa 5MB'
          });
        }
        
        return reply.code(500).send({
          success: false,
          error: error.message || 'Lỗi server khi upload ảnh'
        });
      }
    }
  );

  // ========== HELPER FUNCTION ==========
  async function processUpload(filePart, folder, reply) {
    try {
      console.log('🔄 Processing upload...');
      console.log('📁 File:', filePart.filename);
      console.log('📁 Type:', filePart.mimetype);
      console.log('📁 Folder:', folder);

      // Kiểm tra định dạng
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(filePart.mimetype)) {
        return reply.code(400).send({
          success: false,
          error: `Chỉ chấp nhận file ảnh. Loại file của bạn: ${filePart.mimetype}`
        });
      }

      // Tạo thư mục
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      await fs.mkdir(uploadDir, { recursive: true });

      // Tạo tên file
      const timestamp = Date.now();
      const random = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(filePart.filename) || '.jpg';
      const fileName = `img_${timestamp}_${random}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      console.log('💾 Saving as:', fileName);

      // CÁCH 1: Dùng stream pipeline (tốt nhất)
      try {
        await pipeline(filePart.file, fs.createWriteStream(filePath));
      } catch (pipeError) {
        console.error('❌ Pipeline error:', pipeError);
        // CÁCH 2: Dùng buffer nếu pipeline fail
        console.log('🔄 Trying buffer method...');
        const buffer = await filePart.toBuffer();
        await fs.writeFile(filePath, buffer);
      }

      // Kiểm tra file đã lưu
      const stats = await fs.stat(filePath);
      const fileUrl = `/uploads/${folder}/${fileName}`;

      console.log('✅ File saved!');
      console.log('📊 Size:', `${(stats.size / 1024).toFixed(2)} KB`);
      console.log('🔗 URL:', fileUrl);

      return reply.send({
        success: true,
        message: 'Upload ảnh thành công',
        data: {
          url: fileUrl,
          filename: fileName,
          originalname: filePart.filename,
          size: stats.size,
          mimetype: filePart.mimetype,
          folder: folder
        }
      });

    } catch (error) {
      console.error('❌ Process upload error:', error);
      throw error;
    }
  }

  // ========== TEST ENDPOINT - CỰC KỲ ĐƠN GIẢN ==========
  fastify.post('/test-simple', async (request, reply) => {
    console.log('\n🧪 ========== SIMPLE TEST ==========');
    
    try {
      if (!request.isMultipart()) {
        return reply.send({ success: false, message: 'Not multipart' });
      }
      
      // Chỉ cần test xem có lấy được file không
      const data = await request.file();
      
      if (data) {
        console.log('🧪 File received!', data.filename);
        
        // Đọc một ít để xác nhận
        try {
          const buffer = await data.toBuffer({ limit: 100 }); // Chỉ đọc 100 byte đầu
          console.log('🧪 First 100 bytes:', buffer.length);
        } catch (e) {
          console.log('🧪 Could not read buffer (normal for stream)');
        }
        
        return reply.send({
          success: true,
          message: 'File received',
          filename: data.filename,
          mimetype: data.mimetype,
          fieldname: data.fieldname
        });
      } else {
        console.log('🧪 No file received');
        return reply.send({
          success: false,
          message: 'No file in request'
        });
      }
    } catch (error) {
      console.error('🧪 Test error:', error);
      return reply.send({
        success: false,
        error: error.message
      });
    }
  });

  // ========== MINIMAL WORKING UPLOAD ==========
  fastify.post('/minimal', 
    {
      preHandler: [requireAdmin]
    },
    async (request, reply) => {
      console.log('\n⚡ ========== MINIMAL UPLOAD ==========');
      
      try {
        // Cách đơn giản nhất, chỉ dùng request.file()
        const file = await request.file();
        
        if (!file) {
          return reply.code(400).send({ error: 'No file' });
        }
        
        console.log('⚡ File:', file.filename);
        
        // Lưu đơn giản
        const uploadDir = path.join(process.cwd(), 'uploads', 'minimal');
        await fs.mkdir(uploadDir, { recursive: true });
        
        const fileName = `min_${Date.now()}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        
        // Lưu file
        const buffer = await file.toBuffer();
        await fs.writeFile(filePath, buffer);
        
        return reply.send({
          success: true,
          url: `/uploads/minimal/${fileName}`,
          filename: fileName
        });
        
      } catch (error) {
        console.error('⚡ Error:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  // ========== CÁC ENDPOINTS KHÁC ==========
  
  fastify.get('/test', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Upload API v2',
      time: new Date().toISOString()
    });
  });

  console.log('✅ Upload routes loaded (simplified version)');
}