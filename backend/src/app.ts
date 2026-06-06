import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';

// Configure environment
dotenv.config();

// Imports routers
import authRouter from './api/routes/auth.routes';
import productRouter from './api/routes/product.routes';
import orderRouter from './api/routes/order.routes';
import adminRouter from './api/routes/admin.routes';
import aiRouter from './api/routes/ai.routes';

// Import DB seed
import { seedDefaults, db } from './services/db.service';

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Local Uploads static folder mapping (for Cloudinary fallback uploads)
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Seed default warehouses & config
seedDefaults();

// Mount Routes
app.get('/', (req, res) => {
  res.status(200).send(`
    <div style="font-family: sans-serif; text-align: center; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0;">
      <div style="padding: 40px; border: 1px solid #334155; border-radius: 20px; background: #1e293b; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <h1 style="color: #f97316; margin: 0 0 10px 0; font-size: 28px;">RIDEVAULT PRO</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Backend Sandbox Engine is active and running.</p>
        <div style="display: flex; gap: 15px; justify-content: center;">
          <a href="/api/health" style="color: #ffffff; background: #f97316; text-decoration: none; font-weight: bold; padding: 8px 16px; border-radius: 8px; font-size: 12px; text-transform: uppercase;">API Health</a>
          <a href="http://localhost:3000" style="color: #38bdf8; border: 1px solid #38bdf8; text-decoration: none; font-weight: bold; padding: 8px 16px; border-radius: 8px; font-size: 12px; text-transform: uppercase;">Storefront</a>
        </div>
      </div>
    </div>
  `);
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'RideVault Pro Backend API is active',
    timestamp: new Date().toISOString()
  });
});

// Endpoint to fetch client notifications
app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const list = db.notifications.find({ userId });
  res.status(200).json(list);
});

// Endpoint to dismiss client notifications
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const updated = db.notifications.findByIdAndUpdate(id, { isRead: true });
  res.status(200).json(updated);
});

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);


// Global Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Global Error:', err);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Create HTTP and Socket.IO Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket connection coordinator
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Clients join a private room based on their userId
  socket.on('join_room', (userId: string) => {
    socket.join(userId);
    console.log(`Client ID ${userId} registered socket channel: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Set global Socket instance for easy triggers in controllers
(global as any).io = io;

// Wrap notification creation to trigger live socket broadcasts
const originalCreateNotification = db.notifications.create.bind(db.notifications);
db.notifications.create = (item: any) => {
  const notification = originalCreateNotification(item);
  try {
    if (notification.userId === 'admin') {
      io.to('admin').emit('new_alert', notification);
    } else {
      io.to(notification.userId).emit('new_alert', notification);
    }
  } catch (err) {
    console.error('Failed to emit WebSocket alert event:', err);
  }
  return notification;
};

// Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 RideVault Pro server running on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket channels initialized`);
  console.log(`====================================================`);
});
