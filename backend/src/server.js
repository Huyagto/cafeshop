  import Fastify from "fastify";
  import cors from "@fastify/cors";
  import jwt from "@fastify/jwt";
  import routes from "./routes/index.js";  // 👈 Import duy nhất
  import { errorHandler } from "./middleware/errorHandler.js";
  import "dotenv/config";
  import staticFiles from "@fastify/static";
  import path from "path";
  import { fileURLToPath } from "url";
  import multipart from "@fastify/multipart";


  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const fastify = Fastify({
    logger:
      process.env.NODE_ENV === "development"
        ? {
            level: process.env.LOG_LEVEL || "info",
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
              },
            },
          }
        : {
            level: process.env.LOG_LEVEL || "info",
          },
  });

  await fastify.register(staticFiles, {
    root: path.join(process.cwd(), 'uploads'),  // Dùng process.cwd()
    prefix: '/uploads/',
    decorateReply: false
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  // JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "supersecret-change-in-production",
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 10
    },
    // attachFieldsToBody: true, // Quan trọng: attach fields to body
    // sharedSchemaId: 'MultipartFileType' // Optional: define schema
  });

  // Error handler
  fastify.setErrorHandler(errorHandler);

  // Health check
  fastify.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });


  // CHỈ register routes MỘT LẦN duy nhất
  await fastify.register(routes, { prefix: "/api" });  // 👈 Đây là duy nhất

  // Start server
  const start = async () => {
    try {
      const port = process.env.PORT || 4000;
      const host = process.env.HOST || "0.0.0.0";

      fastify.ready(() => {
    console.log('\n=== DEBUG: Checking Routes ===');
    
    // Cách 1: Dùng printRoutes (nếu Fastify hỗ trợ)
    if (fastify.printRoutes) {
      console.log('\nRegistered routes:');
      console.log(fastify.printRoutes());
    }
    
    // Cách 2: Dùng introspection
    console.log('\nChecking route tree...');
    
    try {
      // Fastify 4.x dùng fastify.routes
      if (fastify.routes) {
        console.log('Total routes:', fastify.routes.length);
        fastify.routes.forEach((route, i) => {
          console.log(`${i + 1}. ${route.method} ${route.url}`);
        });
      }
      
      // Hoặc dùng fastify.route
      const routes = fastify.route || fastify._routes || [];
      console.log('\nRoutes via fastify.route:');
      routes.forEach((route, i) => {
        console.log(`${i + 1}. ${route.method} ${route.url || route.path}`);
      });
      
    } catch (err) {
      console.log('Error getting routes:', err.message);
    }
    
    // Test trực tiếp bằng looking up
    console.log('\nTesting route lookup...');
    const testRoute = fastify.hasRoute({
      method: 'GET',
      url: '/api/admin/dashboard/stats'
    });
    console.log('Has /api/admin/dashboard/stats?', testRoute);
    
    console.log('\n=== END DEBUG ===\n');
  });

      await fastify.listen({ port, host });

      console.log(`
      ☕ Coffee Loyalty API Server
      🚀 Server running on http://localhost:${port}
      📊 Health check: http://localhost:${port}/health
      🔥 Environment: ${process.env.NODE_ENV || "development"}
      `);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };

  // Graceful shutdown
  const closeGracefully = async (signal) => {
    console.log(`\nReceived signal ${signal}, closing server...`);
    await fastify.close();
    process.exit(0);
  };

  process.on("SIGINT", closeGracefully);
  process.on("SIGTERM", closeGracefully);

  start();