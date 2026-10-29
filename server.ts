/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { store } from './src/core/store.ts';
import { UserRole } from './src/types/index.ts';

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = express();
  app.use(express.json());

  // Health probe
  app.get('/api/health', (_req: Request, res: Response) => {
    const mem = process.memoryUsage();
    res.json({
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memoryRssMb: Math.round(mem.rss / (1024 * 1024)),
      database: {
        status: 'CONNECTED',
        activeTables: store.getTables().length,
        activeOrders: store.getOrders().length,
        totalMenuItems: store.getItems().length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Public Table Resolution
  app.get('/api/v1/public/qr/:token', (req: Request, res: Response) => {
    const table = store.getTableByToken(req.params.token);
    if (!table) {
      res.status(404).json({ success: false, error: 'Table not found or QR token expired.' });
      return;
    }
    res.json({
      success: true,
      data: {
        table,
        restaurant: store.getRestaurant(),
        activeOrderId: table.currentOrderId || null,
      },
    });
  });

  // Public Menu
  app.get('/api/v1/public/menu', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        categories: store.getCategories(),
        items: store.getItems(),
      },
    });
  });

  // Submit Customer Order
  app.post('/api/v1/public/orders', (req: Request, res: Response) => {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
    const result = store.submitOrder({
      qrToken: req.body.qrToken,
      customerName: req.body.customerName,
      paymentMethod: req.body.paymentMethod || 'ONLINE_GATEWAY',
      tipCents: req.body.tipCents || 0,
      notes: req.body.notes,
      items: req.body.items || [],
      idempotencyKey,
    });

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, data: result.order });
  });

  // Get Orders
  app.get('/api/v1/orders', (_req: Request, res: Response) => {
    res.json({ success: true, data: store.getOrders() });
  });

  // Update Order Status (State Machine transition)
  app.patch('/api/v1/orders/:orderId/status', (req: Request, res: Response) => {
    const role = (req.headers['x-user-role'] as UserRole) || 'MANAGER';
    const { status, cancellationReason } = req.body;
    const result = store.updateOrderStatus(req.params.orderId, status, role, cancellationReason);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.message });
      return;
    }
    res.json({ success: true, data: result.order });
  });

  // Cash Collection Confirmation
  app.post('/api/v1/payments/cash-collect', (req: Request, res: Response) => {
    const role = (req.headers['x-user-role'] as UserRole) || 'CASHIER';
    const { orderId, staffUserId } = req.body;
    const result = store.collectCashPayment(orderId, staffUserId || 'cashier_terminal', role);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.message });
      return;
    }
    res.json({ success: true, data: result.order });
  });

  // Toggle 86 / Item Availability
  app.patch('/api/v1/menu/items/:itemId/toggle-availability', (req: Request, res: Response) => {
    const role = (req.headers['x-user-role'] as UserRole) || 'MANAGER';
    const result = store.toggleItemAvailability(req.params.itemId, role);
    if (!result.success) {
      res.status(403).json({ success: false, error: result.message });
      return;
    }
    res.json({ success: true });
  });

  // Rotate QR Token
  app.post('/api/v1/tables/:tableId/rotate-qr', (req: Request, res: Response) => {
    const role = (req.headers['x-user-role'] as UserRole) || 'MANAGER';
    const result = store.rotateTableToken(req.params.tableId, role);
    if (!result.success) {
      res.status(403).json({ success: false, error: result.message });
      return;
    }
    res.json({ success: true, data: result.table });
  });

  // Server-Sent Events (SSE) live updates
  app.get('/api/v1/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const unsubscribe = store.subscribe((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    // Heartbeat every 20s
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  // Mount Vite middleware in development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QR Dine OS] Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
