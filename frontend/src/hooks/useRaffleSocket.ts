import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { RaffleNumber, RaffleStats } from '../types';

interface RaffleUpdatePayload {
  type: 'numbers-updated' | 'raffle-updated' | 'stats-updated';
  payload: any;
}

interface UseRaffleSocketOptions {
  raffleId: string | null;
  onNumbersUpdated?: (numbers: RaffleNumber[]) => void;
  onStatsUpdated?: (stats: RaffleStats) => void;
}

export const useRaffleSocket = ({
  raffleId,
  onNumbersUpdated,
  onStatsUpdated,
}: UseRaffleSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!raffleId) return;

    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket conectado:', socket.id);
      socket.emit('join-raffle', raffleId);
    });

    socket.on('raffle-update', (data: RaffleUpdatePayload) => {
      if (data.type === 'numbers-updated' && onNumbersUpdated) {
        onNumbersUpdated(data.payload);
      }
      if (data.type === 'stats-updated' && onStatsUpdated) {
        onStatsUpdated(data.payload);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket desconectado');
    });

    socket.on('connect_error', (err) => {
      console.warn('Erro de conexão socket:', err.message);
    });

    return () => {
      socket.emit('leave-raffle', raffleId);
      socket.disconnect();
    };
  }, [raffleId]);

  return { socket: socketRef.current };
};
