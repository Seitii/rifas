import { query } from '../config/database';

const createExtensions = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
`;

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

const createRafflesTable = `
  CREATE TABLE IF NOT EXISTS raffles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(1000),
    draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_numbers INTEGER NOT NULL CHECK (total_numbers > 0 AND total_numbers <= 100000),
    price_per_number DECIMAL(10, 2) NOT NULL CHECK (price_per_number > 0),
    whatsapp_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'drawn')),
    winner_number INTEGER,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

const createRaffleImagesTable = `
  CREATE TABLE IF NOT EXISTS raffle_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

const createPurchasesTable = `
  CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE RESTRICT,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20) NOT NULL,
    numbers INTEGER[] NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

const createRaffleNumbersTable = `
  CREATE TABLE IF NOT EXISTS raffle_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'purchased')),
    buyer_name VARCHAR(255),
    buyer_phone VARCHAR(20),
    reserved_at TIMESTAMP WITH TIME ZONE,
    purchased_at TIMESTAMP WITH TIME ZONE,
    reservation_expires_at TIMESTAMP WITH TIME ZONE,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(raffle_id, number)
  );
`;

const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_raffles_status ON raffles(status);
  CREATE INDEX IF NOT EXISTS idx_raffles_draw_date ON raffles(draw_date);
  CREATE INDEX IF NOT EXISTS idx_raffle_numbers_raffle_id ON raffle_numbers(raffle_id);
  CREATE INDEX IF NOT EXISTS idx_raffle_numbers_status ON raffle_numbers(status);
  CREATE INDEX IF NOT EXISTS idx_raffle_numbers_purchase_id ON raffle_numbers(purchase_id);
  CREATE INDEX IF NOT EXISTS idx_purchases_raffle_id ON purchases(raffle_id);
  CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
  CREATE INDEX IF NOT EXISTS idx_purchases_buyer_phone ON purchases(buyer_phone);
`;

const createUpdateTrigger = `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_raffles_updated_at ON raffles;
  CREATE TRIGGER update_raffles_updated_at
    BEFORE UPDATE ON raffles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
  CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export const runMigrations = async (): Promise<void> => {
  console.log('Executando migrations...');
  try {
    await query(createExtensions);
    await query(createUsersTable);
    await query(createRafflesTable);
    await query(createRaffleImagesTable);
    await query(createPurchasesTable);
    await query(createRaffleNumbersTable);
    await query(createIndexes);
    await query(createUpdateTrigger);
    console.log('Migrations concluídas com sucesso!');
  } catch (error) {
    console.error('Erro nas migrations:', error);
    throw error;
  }
};
