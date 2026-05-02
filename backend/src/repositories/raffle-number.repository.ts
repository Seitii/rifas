import { PoolClient } from 'pg';
import { query, transaction, getClient } from '../config/database';
import { RaffleNumber } from '../types';

const RESERVATION_TIMEOUT_MINUTES = 15;

export class RaffleNumberRepository {
  async findByRaffleId(raffleId: string): Promise<RaffleNumber[]> {
    const result = await query(
      `SELECT * FROM raffle_numbers WHERE raffle_id = $1 ORDER BY number ASC`,
      [raffleId]
    );
    return result.rows;
  }

  async findByNumber(raffleId: string, number: number): Promise<RaffleNumber | null> {
    const result = await query(
      `SELECT * FROM raffle_numbers WHERE raffle_id = $1 AND number = $2`,
      [raffleId, number]
    );
    return result.rows[0] || null;
  }

  /**
   * Reserva múltiplos números com SELECT FOR UPDATE para evitar condição de corrida.
   * Esta é a operação crítica de controle de concorrência.
   */
  async reserveNumbers(
    raffleId: string,
    numbers: number[],
    buyerName: string,
    buyerPhone: string
  ): Promise<{ success: boolean; conflicted: number[]; reservedNumbers: RaffleNumber[] }> {
    return transaction(async (client: PoolClient) => {
      // Expirar reservas antigas antes de tentar reservar
      await client.query(
        `UPDATE raffle_numbers
         SET status = 'available', buyer_name = NULL, buyer_phone = NULL,
             reserved_at = NULL, reservation_expires_at = NULL, purchase_id = NULL
         WHERE raffle_id = $1
           AND status = 'reserved'
           AND reservation_expires_at < NOW()`,
        [raffleId]
      );

      // SELECT FOR UPDATE: bloqueia as linhas para leitura exclusiva
      const lockResult = await client.query(
        `SELECT * FROM raffle_numbers
         WHERE raffle_id = $1 AND number = ANY($2::int[])
         FOR UPDATE`,
        [raffleId, numbers]
      );

      const lockedNumbers: RaffleNumber[] = lockResult.rows;

      // Verificar se todos os números existem
      if (lockedNumbers.length !== numbers.length) {
        throw new Error('Um ou mais números não existem nesta rifa');
      }

      // Verificar conflitos (números não disponíveis)
      const conflicted = lockedNumbers
        .filter(n => n.status !== 'available')
        .map(n => n.number);

      if (conflicted.length > 0) {
        return { success: false, conflicted, reservedNumbers: [] };
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_TIMEOUT_MINUTES);

      // Reservar todos os números
      const updateResult = await client.query(
        `UPDATE raffle_numbers
         SET status = 'reserved',
             buyer_name = $3,
             buyer_phone = $4,
             reserved_at = NOW(),
             reservation_expires_at = $5
         WHERE raffle_id = $1 AND number = ANY($2::int[])
         RETURNING *`,
        [raffleId, numbers, buyerName, buyerPhone, expiresAt]
      );

      return {
        success: true,
        conflicted: [],
        reservedNumbers: updateResult.rows,
      };
    });
  }

  /**
   * Confirma a compra dos números reservados, vinculando ao purchase_id.
   */
  async confirmPurchase(
    raffleId: string,
    numbers: number[],
    purchaseId: string,
    buyerName: string,
    buyerPhone: string
  ): Promise<void> {
    await transaction(async (client: PoolClient) => {
      // Bloquear linhas para atualização
      const lockResult = await client.query(
        `SELECT * FROM raffle_numbers
         WHERE raffle_id = $1 AND number = ANY($2::int[])
         FOR UPDATE`,
        [raffleId, numbers]
      );

      const lockedNumbers: RaffleNumber[] = lockResult.rows;
      const notReservedByBuyer = lockedNumbers.filter(
        n => n.status !== 'reserved' || n.buyer_phone !== buyerPhone
      );

      if (notReservedByBuyer.length > 0) {
        throw new Error(
          `Números não reservados ou reservados por outro comprador: ${notReservedByBuyer.map(n => n.number).join(', ')}`
        );
      }

      await client.query(
        `UPDATE raffle_numbers
         SET status = 'purchased',
             buyer_name = $3,
             buyer_phone = $4,
             purchased_at = NOW(),
             reservation_expires_at = NULL,
             purchase_id = $5
         WHERE raffle_id = $1 AND number = ANY($2::int[])`,
        [raffleId, numbers, buyerName, buyerPhone, purchaseId]
      );
    });
  }

  /**
   * Libera reservas expiradas (job de limpeza).
   */
  async releaseExpiredReservations(): Promise<number> {
    const result = await query(
      `UPDATE raffle_numbers
       SET status = 'available',
           buyer_name = NULL,
           buyer_phone = NULL,
           reserved_at = NULL,
           reservation_expires_at = NULL,
           purchase_id = NULL
       WHERE status = 'reserved'
         AND reservation_expires_at < NOW()`
    );
    return result.rowCount ?? 0;
  }

  async releaseReservationByPhone(raffleId: string, buyerPhone: string): Promise<void> {
    await query(
      `UPDATE raffle_numbers
       SET status = 'available',
           buyer_name = NULL,
           buyer_phone = NULL,
           reserved_at = NULL,
           reservation_expires_at = NULL,
           purchase_id = NULL
       WHERE raffle_id = $1
         AND buyer_phone = $2
         AND status = 'reserved'`,
      [raffleId, buyerPhone]
    );
  }
}

export const raffleNumberRepository = new RaffleNumberRepository();
