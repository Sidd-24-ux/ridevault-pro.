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

// Stitch MCP Sandbox Integration APIs with Live Relay Configuration
const stitchConfigPath = path.join(__dirname, '../data/stitch_config.json');

const getStitchConfig = () => {
  if (fs.existsSync(stitchConfigPath)) {
    try {
      return JSON.parse(fs.readFileSync(stitchConfigPath, 'utf8'));
    } catch (e) {
      console.error('Error reading stitch config:', e);
    }
  }
  return {
    serverUrl: "https://stitch.googleapis.com/mcp",
    headers: {
      "X-Goog-Api-Key": process.env.STITCH_API_KEY || ""
    }
  };
};

app.get('/api/stitch/config', (req, res) => {
  const config = getStitchConfig();
  res.status(200).json(config);
});

app.post('/api/stitch/config', (req, res) => {
  const { serverUrl, headers } = req.body;
  if (!serverUrl) {
    return res.status(400).json({ message: 'serverUrl is required' });
  }
  const newConfig = { serverUrl, headers: headers || {} };
  
  const dir = path.dirname(stitchConfigPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(stitchConfigPath, JSON.stringify(newConfig, null, 2));
  
  res.status(200).json({ message: 'Stitch MCP config updated', config: newConfig });
});

app.get('/api/stitch/tools', async (req, res) => {
  const config = getStitchConfig();
  
  // Default mock fallback tools list
  const fallbackTools = [
    { name: 'stitch/list_models', description: 'Returns active Gemini developer models on Stitch instance', schema: '{}' },
    { name: 'stitch/query_index', description: 'Search the semantic code index of RideVault Pro', schema: '{"query": "string"}' },
    { name: 'stitch/apply_refactor', description: 'Execute automated styling refactoring', schema: '{"file": "string", "theme": "string"}' }
  ];

  try {
    // Attempt standard MCP JSON-RPC 2.0 call over HTTP POST to retrieve real tools
    const response = await fetch(`${config.serverUrl}/tools/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {}
      })
    });

    if (response.ok) {
      const data = await response.json();
      // Format results to client format
      if (data.result?.tools) {
        const toolsMapped = data.result.tools.map((t: any) => ({
          name: t.name,
          description: t.description || 'Stitch MCP Native Tool',
          schema: JSON.stringify(t.inputSchema || {}, null, 2)
        }));
        return res.status(200).json(toolsMapped);
      }
    }
    
    // Graceful fallback
    console.log('Stitch API response unauthorized or not standard. Falling back to sandbox mock tools.');
    return res.status(200).json(fallbackTools);
  } catch (err) {
    console.warn('Unable to connect to live Stitch MCP API. Falling back to sandbox mock tools.');
    return res.status(200).json(fallbackTools);
  }
});

app.post('/api/stitch/execute', async (req, res) => {
  const { toolName, args } = req.body;
  const config = getStitchConfig();

  db.auditLogs.create({
    userId: 'admin',
    action: 'STITCH_MCP_CALL',
    details: `Executed Stitch MCP tool '${toolName}'`
  });

  try {
    // Attempt live execute call relay to Stitch server URL
    const response = await fetch(`${config.serverUrl}/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        status: 'success',
        output: data.result || data
      });
    }

    const errText = await response.text();
    throw new Error(`Stitch returned code ${response.status}: ${errText}`);
  } catch (err: any) {
    console.warn('Live Stitch call failed. Running sandbox mock controller fallback:', err.message);
    
    // Mock controller fallbacks
    let output = {};
    if (toolName === 'stitch/list_models') {
      output = { models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-experimental'] };
    } else if (toolName === 'stitch/query_index') {
      output = { matches: ['backend/src/services/db.service.ts', 'backend/src/app.ts'], similarity: 0.94 };
    } else {
      output = { success: true, filesModified: ['frontend/src/index.css'], timestamp: new Date().toISOString() };
    }

    return res.status(200).json({
      status: 'success',
      output
    });
  }
});

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
