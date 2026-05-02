import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Cliente entra na sala da rifa para receber atualizações
    socket.on('join-raffle', (raffleId: string) => {
      socket.join(`raffle-${raffleId}`);
    });

    socket.on('leave-raffle', (raffleId: string) => {
      socket.leave(`raffle-${raffleId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

export const emitRaffleUpdate = (raffleId: string, data: {
  type: 'numbers-updated' | 'raffle-updated' | 'stats-updated';
  payload: any;
}): void => {
  if (io) {
    io.to(`raffle-${raffleId}`).emit('raffle-update', data);
  }
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO não inicializado');
  }
  return io;
};
