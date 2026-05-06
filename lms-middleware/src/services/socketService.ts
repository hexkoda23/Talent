import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export const socketService = {
  init: (server: HttpServer) => {
    io = new Server(server, {
      cors: {
        origin: '*',
      },
    });

    io.on('connection', (socket) => {
      socket.on('audit:join', ({ sessionId }) => {
        if (sessionId) socket.join(`audit:${sessionId}`);
      });

      socket.on('audit:terminal', ({ sessionId, actor, command, output }) => {
        if (!sessionId) return;
        io?.to(`audit:${sessionId}`).emit('audit:terminal', {
          actor,
          command,
          output,
          at: new Date().toISOString(),
        });
      });
    });

    return io;
  },

  emitAuditEvent: (sessionId: number | string, event: string, payload: any) => {
    io?.to(`audit:${sessionId}`).emit(event, payload);
  },
};
