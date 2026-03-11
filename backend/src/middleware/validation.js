export const validateOrder = {
  body: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['productId', 'quantity', 'price'],
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
            price: { type: 'number', minimum: 0 }
          }
        }
      },
      isKiosk: { type: 'boolean' },
      notes: { type: 'string' }
    }
  }
};

export const validateAuth = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      name: { type: 'string', minLength: 2 },
      phone: { type: 'string' }
    }
  }
};