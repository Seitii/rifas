import { query } from '../config/database';
import { User } from '../types';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data: {
    name: string;
    email: string;
    password_hash: string;
    role?: string;
  }): Promise<User> {
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.email, data.password_hash, data.role || 'admin']
    );
    return result.rows[0];
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );
  }
}

export const userRepository = new UserRepository();
