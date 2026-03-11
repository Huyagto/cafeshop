export function errorHandler(error, request, reply) {
  request.log.error(error);

  // Prisma errors
  if (error.code === 'P2002') {
    return reply.status(400).send({
      error: 'Dữ liệu đã tồn tại'
    });
  }

  if (error.code === 'P2025') {
    return reply.status(404).send({
      error: 'Không tìm thấy dữ liệu'
    });
  }

  // JWT errors
  if (error.name === 'UnauthorizedError') {
    return reply.status(401).send({
      error: 'Token không hợp lệ'
    });
  }

  // Default error
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal Server Error'
  });
}