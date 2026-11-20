import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { registerF1Backend } from './src/games/f1-aysen/f1Server.ts';
import { registerNexRacingBackend } from './src/games/nexracing/nexracingServer.ts';
import { registerPortalAuthBackend } from './src/portalAuthServer.ts';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const httpServer = http.createServer(app);

  // Register NexPlay portal optional auth, F1 Simulador Aysén (/api/*, /ws), and NexRacing (/api/nexracing/*, /ws-nexracing)
  registerPortalAuthBackend(app);
  const f1Wss = registerF1Backend(app);
  const nexracingWss = registerNexRacingBackend(app);

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    if (pathname === '/ws') {
      f1Wss.handleUpgrade(request, socket, head, (ws) => {
        f1Wss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws-nexracing') {
      nexracingWss.handleUpgrade(request, socket, head, (ws) => {
        nexracingWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`NexPlay server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NexPlay server:', err);
  process.exit(1);
});
