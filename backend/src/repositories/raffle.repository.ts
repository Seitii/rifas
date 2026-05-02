import { PoolClient } from 'pg';
import { query, transaction } from '../config/database';
import { Raffle, CreateRaffleDto, PaginationParams, RaffleStats } from '../types';

export class RaffleRepository {
  async findAll(params?: Partial<PaginationParams> & { status?: string }): Promise<{
    data: Raffle[];
    total: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (params?.status) {
      conditions.push(`status = $${paramIdx++}`);
      values.push(params.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM raffles ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM raffles ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      values
    );

    const raffles: Raffle[] = result.rows;

    // Buscar imagens para cada rifa
    for (const r of raffles) {
      const imgs = await query('SELECT image_url FROM raffle_images WHERE raffle_id = $1 ORDER BY created_at', [r.id]);
      r.images = imgs.rows.map((row: any) => row.image_url);
    }

    return { data: raffles, total };
  }

  async findById(id: string): Promise<Raffle | null> {
    const result = await query('SELECT * FROM raffles WHERE id = $1', [id]);
    const raffle = result.rows[0] || null;
    if (!raffle) return null;
    const imgs = await query('SELECT image_url FROM raffle_images WHERE raffle_id = $1 ORDER BY created_at', [id]);
    raffle.images = imgs.rows.map((row: any) => row.image_url);
    return raffle;
  }

  async create(data: CreateRaffleDto & { image_url?: string; images?: string[]; created_by: string }): Promise<Raffle> {
    return transaction(async (client: PoolClient) => {
      const raffleResult = await client.query(
        `INSERT INTO raffles (title, description, image_url, draw_date, total_numbers, price_per_number, whatsapp_number, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.title,
          data.description,
          data.image_url || null,
          data.draw_date,
          data.total_numbers,
          data.price_per_number,
          data.whatsapp_number,
          data.created_by,
        ]
      );

      const raffle: Raffle = raffleResult.rows[0];

      // Inserir imagens associadas (se houver)
      if (data.images && data.images.length > 0) {
        const imgValues: string[] = [];
        const params: any[] = [];
        let paramIdx = 1;
        for (const img of data.images) {
          imgValues.push(`($${paramIdx++}, $${paramIdx++})`);
          params.push(raffle.id, img);
        }
        await client.query(
          `INSERT INTO raffle_images (raffle_id, image_url) VALUES ${imgValues.join(', ')}`,
          params
        );
        // refresh images into raffle object
        const imgs = await client.query('SELECT image_url FROM raffle_images WHERE raffle_id = $1 ORDER BY created_at', [raffle.id]);
        raffle.images = imgs.rows.map((r: any) => r.image_url);
      }

      // Gerar todos os números da rifa em batch
      const batchSize = 1000;
      for (let i = 1; i <= data.total_numbers; i += batchSize) {
        const end = Math.min(i + batchSize - 1, data.total_numbers);
        const values: string[] = [];
        const params: any[] = [];
        let paramIdx = 1;

        for (let n = i; n <= end; n++) {
          values.push(`($${paramIdx++}, $${paramIdx++})`);
          params.push(raffle.id, n);
        }

        await client.query(
          `INSERT INTO raffle_numbers (raffle_id, number) VALUES ${values.join(', ')}`,
          params
        );
      }

      return raffle;
    });
  }

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    image_url: string;
    images: string[];
    draw_date: string;
    status: string;
    winner_number: number;
    price_per_number: number;
    whatsapp_number: string;
  }>): Promise<Raffle | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIdx++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await query(
      `UPDATE raffles SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    const updated = result.rows[0] || null;

    // Se images estiver presente, substituir as entradas em raffle_images
    if (data.images) {
      await query('DELETE FROM raffle_images WHERE raffle_id = $1', [id]);
      if (data.images.length > 0) {
        const imgValues: string[] = [];
        const params: any[] = [];
        let paramIdx2 = 1;
        for (const img of data.images) {
          imgValues.push(`($${paramIdx2++}, $${paramIdx2++})`);
          params.push(id, img);
        }
        await query(
          `INSERT INTO raffle_images (raffle_id, image_url) VALUES ${imgValues.join(', ')}`,
          params
        );
      }
      const imgs = await query('SELECT image_url FROM raffle_images WHERE raffle_id = $1 ORDER BY created_at', [id]);
      if (updated) updated.images = imgs.rows.map((r: any) => r.image_url);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM raffles WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getStats(raffleId: string): Promise<RaffleStats> {
    const result = await query(
      `SELECT
         COUNT(*) as total_numbers,
         COUNT(*) FILTER (WHERE status = 'available') as available,
         COUNT(*) FILTER (WHERE status = 'reserved') as reserved,
         COUNT(*) FILTER (WHERE status = 'purchased') as purchased
       FROM raffle_numbers
       WHERE raffle_id = $1`,
      [raffleId]
    );

    const priceResult = await query(
      'SELECT price_per_number FROM raffles WHERE id = $1',
      [raffleId]
    );

    const stats = result.rows[0];
    const price = parseFloat(priceResult.rows[0]?.price_per_number || '0');

    return {
      total_numbers: parseInt(stats.total_numbers),
      available: parseInt(stats.available),
      reserved: parseInt(stats.reserved),
      purchased: parseInt(stats.purchased),
      revenue: parseInt(stats.purchased) * price,
    };
  }
}

export const raffleRepository = new RaffleRepository();
