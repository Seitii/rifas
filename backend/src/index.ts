import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import { initializeSocket } from './config/socket';
import { runMigrations } from './database/migrate';
import { runSeed } from './database/seed';
import { raffleNumberRepository } from './repositories/raffle-number.repository';
import authRoutes from './routes/auth.routes';
import raffleRoutes from './routes/raffle.routes';
import purchaseRoutes from './routes/purchase.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app = express();
const httpServer = http.createServer(app);

// Inicializar Socket.IO
initializeSocket(httpServer);

// Middlewares globais
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos de upload
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use(`/${uploadDir}`, express.static(path.join(process.cwd(), uploadDir)));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/raffles', raffleRoutes);
app.use('/api/purchases', purchaseRoutes);

// 404
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3001');

const startServer = async (): Promise<void> => {
  try {
    // Aguardar o banco ficar disponível
    let retries = 10;
    while (retries > 0) {
      try {
        const { query } = await import('./config/database');
        await query('SELECT 1');
        console.log('Conectado ao banco de dados');
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`Aguardando banco de dados... (${retries} tentativas restantes)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Executar migrations
    await runMigrations();

    // Executar seed
    await runSeed();

    // Iniciar job de limpeza de reservas expiradas
    setInterval(async () => {
      try {
        const released = await raffleNumberRepository.releaseExpiredReservations();
        if (released > 0) {
          console.log(`🧹 ${released} reserva(s) expirada(s) liberada(s)`);

          // Emitir atualização via socket para todas as rifas ativas
          // (simplificado: o frontend pode requisitar atualização após timeout)
        }
      } catch (err) {
        console.error('Erro ao liberar reservas expiradas:', err);
      }
    }, 60 * 1000); // A cada 1 minuto

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor...');
  httpServer.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Encerrando servidor...');
  httpServer.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});
