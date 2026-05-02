import { query } from '../config/database';
import { Purchase } from '../types';

export class PurchaseRepository {
  async create(data: {
    raffle_id: string;
    buyer_name: string;
    buyer_phone: string;
    numbers: number[];
    total_amount: number;
  }): Promise<Purchase> {
    const result = await query(
      `INSERT INTO purchases (raffle_id, buyer_name, buyer_phone, numbers, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        data.raffle_id,
        data.buyer_name,
        data.buyer_phone,
        data.numbers,
        data.total_amount,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Purchase | null> {
    const result = await query('SELECT * FROM purchases WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByRaffleId(raffleId: string): Promise<Purchase[]> {
    const result = await query(
      'SELECT * FROM purchases WHERE raffle_id = $1 ORDER BY created_at DESC',
      [raffleId]
    );
    return result.rows;
  }

  async findAll(params?: { raffle_id?: string; status?: string; page?: number; limit?: number }): Promise<{
    data: Purchase[];
    total: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (params?.raffle_id) {
      conditions.push(`p.raffle_id = $${paramIdx++}`);
      values.push(params.raffle_id);
    }

    if (params?.status) {
      conditions.push(`p.status = $${paramIdx++}`);
      values.push(params.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM purchases p ${where}`,
      values
    );

    const total = parseInt(countResult.rows[0].count);

    values.push(limit, offset);
    const result = await query(
      `SELECT p.*, r.title as raffle_title, r.price_per_number
       FROM purchases p
       JOIN raffles r ON r.id = p.raffle_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      values
    );

    return { data: result.rows, total };
  }

  async updateStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<Purchase | null> {
    const result = await query(
      `UPDATE purchases SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }

  async findByBuyerPhone(phone: string): Promise<Purchase[]> {
    const result = await query(
      `SELECT p.*, r.title as raffle_title
       FROM purchases p
       JOIN raffles r ON r.id = p.raffle_id
       WHERE p.buyer_phone = $1
       ORDER BY p.created_at DESC`,
      [phone]
    );
    return result.rows;
  }
}

export const purchaseRepository = new PurchaseRepository();
