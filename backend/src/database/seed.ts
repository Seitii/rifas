import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

export const runSeed = async (): Promise<void> => {
  console.log('Executando seed...');
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rifa.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    const existing = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existing.rows.length > 0) {
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      [adminName, adminEmail, passwordHash]
    );
  } catch (error) {
    console.error('Erro no seed:', error);
    throw error;
  }
};
