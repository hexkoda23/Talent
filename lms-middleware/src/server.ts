import app from './app';
import { config } from './config/env';
import { giteaCliService } from './services/giteaCliService';
import { dbService } from './services/dbService';
import { socketService } from './services/socketService';
import http from 'http';

const PORT = config.server.port;

const startServer = async () => {
  try {
    await giteaCliService.bootstrap();
  } catch (error: any) {
    console.error(`[Gitea Bootstrap] ${error.message}`);
  }

  await dbService.ensureAuditSchema();

  const server = http.createServer(app);
  socketService.init(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    LMS Middleware is running!
    Listening on port ${PORT}
    Base URL: http://localhost:${PORT}/api/v1
    `);
  });
};

startServer();
