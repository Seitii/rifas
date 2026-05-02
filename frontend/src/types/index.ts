export interface Raffle {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  images?: string[];
  draw_date: string;
  total_numbers: number;
  price_per_number: number;
  whatsapp_number: string;
  status: 'active' | 'closed' | 'drawn';
  winner_number: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  stats?: RaffleStats;
}

export interface RaffleNumber {
  id: string;
  raffle_id: string;
  number: number;
  status: 'available' | 'reserved' | 'purchased';
  buyer_name: string | null;
  buyer_phone: string | null;
  reserved_at: string | null;
  purchased_at: string | null;
  reservation_expires_at: string | null;
  purchase_id: string | null;
}

export interface RaffleStats {
  total_numbers: number;
  available: number;
  reserved: number;
  purchased: number;
  revenue: number;
}

export interface Purchase {
  id: string;
  raffle_id: string;
  raffle_title?: string;
  buyer_name: string;
  buyer_phone: string;
  numbers: number[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ReserveNumbersPayload {
  raffle_id: string;
  numbers: number[];
  buyer_name: string;
  buyer_phone: string;
}

export interface ReserveResult {
  purchase: Purchase;
  whatsappUrl: string;
}

export interface CreateRafflePayload {
  title: string;
  description: string;
  draw_date: string;
  total_numbers: number;
  price_per_number: number;
  whatsapp_number: string;
  images?: File[];
}
