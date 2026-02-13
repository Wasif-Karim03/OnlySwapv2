import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { dirname, join } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Import utilities
import { validateEnv } from './utils/envValidator.js';
import logger from './utils/logger.js';

// Validate environment variables before proceeding
validateEnv();

// Import routes
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminProductRoutes from './routes/adminProductRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import emailTestRoutes from './routes/emailTestRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import passwordResetRoutes from './routes/passwordResetRoutes.js';
import productRoutes from './routes/productRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';

// Import services and models for Socket.IO handlers
import ChatThread from './models/ChatThread.js';
import { createAndEmitMessage } from './services/threadService.js';

const app = express();

// Request ID middleware for tracking requests across logs
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// HTTP request logging with Morgan
const morganFormat = process.env.NODE_ENV === 'production'
  ? 'combined'
  : 'dev';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

// Additional request logging for debugging file uploads
app.use((req, res, next) => {
  // Log ALL requests for debugging
  const requestId = req.id || 'unknown';
  logger.info(`📥 [${requestId}] ${req.method} ${req.path}`);
  logger.info(`📥 [${requestId}] Content-Type: ${req.headers['content-type'] || 'none'}`);
  logger.info(`📥 [${requestId}] Content-Length: ${req.headers['content-length'] || 'unknown'}`);
  logger.info(`📥 [${requestId}] Authorization: ${req.headers['authorization'] ? 'Present' : 'Missing'}`);
  logger.info(`📥 [${requestId}] User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'unknown'}`);
  logger.info(`📥 [${requestId}] Origin: ${req.headers['origin'] || 'none'}`);

  // Special logging for POST to /api/products
  if (req.method === 'POST' && req.path.includes('/api/products')) {
    logger.info(`📥 [${requestId}] ⚠️ POST to /api/products detected - this should trigger multer`);
  }
  next();
});

// Middleware - CORS configuration for React Native
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || '*'
    : '*', // Allow all in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-ID'],
  exposedHeaders: ['Content-Type', 'X-Request-ID'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Body parsing middleware
// Note: For multipart/form-data (file uploads), we don't use these parsers
// Multer handles multipart/form-data separately
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with size limit (increased for large payloads)
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies

// Request timeout middleware - increased for file uploads
app.use((req, res, next) => {
  // Much longer timeout for file uploads (5 minutes for large images)
  const timeout = req.path.includes('/api/products') && req.method === 'POST' ? 300000 : 30000; // 5 minutes for uploads, 30s for others
  req.setTimeout(timeout);
  res.setTimeout(timeout);
  next();
});

// Create HTTP server early (before routes, so we can attach io)
const httpServer = createServer(app);

// Initialize Socket.IO early
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, specify your React Native app's URL
    methods: ['GET', 'POST'],
  },
});

// Attach io to requests for use in controllers (must be before routes)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
import { existsSync, mkdirSync } from 'fs';
const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
  logger.info('✅ Created uploads directory');
} else {
  logger.info('✅ Uploads directory exists');
}

// Serve product images publicly (they're already filtered by university in the API)
// Profile pictures and other sensitive files should use signed URLs or separate protected endpoint
app.use('/uploads', express.static(uploadsDir, {
  // Security headers for static files
  setHeaders: (res, path) => {
    // Only allow images to be displayed inline
    if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    }
  },
}));

// MongoDB connection with connection pooling
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

const mongooseOptions = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections in the pool
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long to wait for a socket connection
  family: 4, // Use IPv4, skip trying IPv6
};

mongoose
  .connect(mongoURI, mongooseOptions)
  .then(() => {
    logger.info('✅ Connected to MongoDB');
    logger.info(`📊 Connection pool: min=${mongooseOptions.minPoolSize}, max=${mongooseOptions.maxPoolSize}`);
  })
  .catch((error) => {
    logger.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error('❌ MongoDB error:', error);
});

// API Versioning - v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin/users', adminUserRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1', verificationRoutes);
app.use('/api/v1', passwordResetRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/bids', bidRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/email', emailTestRoutes);

// Legacy routes (backward compatibility) - redirect to v1
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api', verificationRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/email', emailTestRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OnlySwap API is running!',
    version: '1.0.0',
  });
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
    },
  };

  // If database is not connected, return 503
  const statusCode = health.database.status === 'connected' ? 200 : 503;
  health.status = statusCode === 200 ? 'healthy' : 'unhealthy';

  res.status(statusCode).json(health);
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log full error details
  logger.error('Error occurred:', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      status: err.status || 500,
    },
  });

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' && err.status >= 500
    ? 'An internal server error occurred. Please try again later.'
    : err.message || 'Internal server error';

  res.status(err.status || 500).json({
    success: false,
    message,
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 New client connected: ${socket.id}`);

  // Handle user registration (store socket ID with user ID and join user room)
  socket.on('register', (userId) => {
    socket.userId = userId;
    // Join user's personal room for receiving messages and notifications
    socket.join(userId);
    logger.info(`👤 User ${userId} registered with socket ${socket.id} and joined user room`);
  });

  // Handle joining a thread room
  socket.on('joinThread', (threadId) => {
    socket.join(threadId);
    logger.debug(`🏠 Socket ${socket.id} joined thread room: ${threadId}`);
  });

  // Handle leaving a thread room
  socket.on('leaveThread', (threadId) => {
    socket.leave(threadId);
    logger.debug(`🚪 Socket ${socket.id} left thread room: ${threadId}`);
  });

  // Handle sending a message via socket
  socket.on('sendMessage', async (messageData) => {
    try {
      const { threadId, senderId, receiverId, message } = messageData;

      if (!threadId || !senderId || !receiverId || !message) {
        socket.emit('error', { message: 'Missing required message fields' });
        return;
      }

      // Verify thread exists
      const thread = await ChatThread.findById(threadId);
      if (!thread) {
        socket.emit('error', { message: 'Thread not found' });
        return;
      }

      // Verify sender is part of thread
      const isParticipant =
        thread.buyerId.toString() === senderId ||
        thread.sellerId.toString() === senderId;

      if (!isParticipant) {
        socket.emit('error', { message: 'Not authorized to send messages in this thread' });
        return;
      }

      // Persist and emit message
      const savedMessage = await createAndEmitMessage({
        io,
        thread,
        senderId,
        receiverId,
        text: message.trim(),
        kind: 'user',
      });

      logger.info('✅ Socket message saved:', {
        threadId,
        messageId: savedMessage._id,
        senderId,
      });
    } catch (error) {
      logger.error('❌ Socket sendMessage error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Legacy support for old joinRoom/leaveRoom
  socket.on('joinRoom', (chatId) => {
    socket.join(chatId);
    logger.debug(`🏠 Socket ${socket.id} joined room (legacy): ${chatId}`);
  });

  socket.on('leaveRoom', (chatId) => {
    socket.leave(chatId);
    logger.debug(`🚪 Socket ${socket.id} left room (legacy): ${chatId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
// Listen on all network interfaces (0.0.0.0) so physical devices can connect
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📡 API URL: http://localhost:${PORT}`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 MongoDB: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
  logger.info(`📝 Log level: ${process.env.LOG_LEVEL || 'info'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`👋 ${signal} received. Shutting down gracefully...`);

  httpServer.close(() => {
    logger.info('✅ HTTP server closed');

    mongoose.connection.close(false, () => {
      logger.info('✅ MongoDB connection closed');
      logger.info('👋 Shutdown complete');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
