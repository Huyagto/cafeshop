export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      error: 'Unauthorized - Vui lòng đăng nhập'
    });
  }
}

export function requireRole(roles = []) {
  // TRẢ VỀ FUNCTION, KHÔNG PHẢI async function trực tiếp
  return async (request, reply) => {
    try {
      await authenticate(request, reply);
      
      if (!roles.includes(request.user.role)) {
        return reply.status(403).send({
          error: 'Forbidden - Bạn không có quyền truy cập'
        });
      }
    } catch (error) {
      // Đã xử lý trong authenticate
    }
  };
}
export function checkRole(roles = []) {
  return async function (request, reply) {
    // THÊM LOG ĐỂ DEBUG
    console.log('🔐 Middleware checkRole called');
    console.log('👤 Request user:', request.user);
    console.log('👤 User role:', request.user?.role);
    console.log('🎯 Required roles:', roles);
    
    // Fix: Kiểm tra user tồn tại
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    
    // Fix: So sánh case-insensitive
    const userRole = (request.user.role || '').toUpperCase();
    const requiredRoles = roles.map(r => r.toUpperCase());
    
    console.log(`🔍 Comparing: ${userRole} in ${requiredRoles}`);
    
    if (!requiredRoles.includes(userRole)) {
      console.log(`❌ Access denied for role: ${userRole}`);
      return reply.status(403).send({
        error: 'Forbidden - Bạn không có quyền truy cập',
        details: `Your role: ${userRole}, Required: ${roles}`
      });
    }
    
    console.log(`✅ Access granted for ${userRole}`);
  };
  
}
// ✅ THÊM isAdmin (DÙNG CHUNG)
// ==========================
export async function isAdmin(request, reply) {
  // authenticate PHẢI chạy trước
  if (!request.user) {
    return reply.status(401).send({
      error: 'Unauthorized'
    });
  }

  if (request.user.role !== 'ADMIN') {
    return reply.status(403).send({
      error: 'Forbidden - Chỉ ADMIN mới được phép'
    });
  }
}
export default authenticate;