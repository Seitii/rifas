export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  images?: string[];
  draw_date: Date;
  total_numbers: number;
  price_per_number: number;
  whatsapp_number: string;
  status: 'active' | 'closed' | 'drawn';
  winner_number: number | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface RaffleNumber {
  id: string;
  raffle_id: string;
  number: number;
  status: 'available' | 'reserved' | 'purchased';
  buyer_name: string | null;
  buyer_phone: string | null;
  reserved_at: Date | null;
  purchased_at: Date | null;
  reservation_expires_at: Date | null;
  purchase_id: string | null;
  created_at: Date;
}

export interface Purchase {
  id: string;
  raffle_id: string;
  buyer_name: string;
  buyer_phone: string;
  numbers: number[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface RaffleStats {
  total_numbers: number;
  available: number;
  reserved: number;
  purchased: number;
  revenue: number;
}

export interface CreateRaffleDto {
  title: string;
  description: string;
  draw_date: string;
  total_numbers: number;
  price_per_number: number;
  whatsapp_number: string;
}

export interface ReserveNumbersDto {
  raffle_id: string;
  numbers: number[];
  buyer_name: string;
  buyer_phone: string;
}

export interface ConfirmPurchaseDto {
  purchase_id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
