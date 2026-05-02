import api from './api';
import {
  Raffle, RaffleNumber, RaffleStats, Purchase,
  ApiResponse, PaginatedResponse, LoginCredentials,
  ReserveNumbersPayload, ReserveResult, CreateRafflePayload, User
} from '../types';

// ---- AUTH ----
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials);
    return res.data;
  },
  me: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.put<ApiResponse<null>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },
};

// ---- RAFFLES ----
export const raffleApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await api.get<ApiResponse<PaginatedResponse<Raffle>>>('/raffles', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Raffle & { stats: RaffleStats }>>(`/raffles/${id}`);
    return res.data;
  },

  getNumbers: async (id: string) => {
    const res = await api.get<ApiResponse<RaffleNumber[]>>(`/raffles/${id}/numbers`);
    return res.data;
  },

  getStats: async (id: string) => {
    const res = await api.get<ApiResponse<RaffleStats>>(`/raffles/${id}/stats`);
    return res.data;
  },

  create: async (payload: CreateRafflePayload) => {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('draw_date', payload.draw_date);
    formData.append('total_numbers', String(payload.total_numbers));
    formData.append('price_per_number', String(payload.price_per_number));
    formData.append('whatsapp_number', payload.whatsapp_number);
    if (payload.images && payload.images.length > 0) {
      for (const f of payload.images) formData.append('images', f);
    }

    const res = await api.post<ApiResponse<Raffle>>('/raffles', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  update: async (id: string, payload: Partial<CreateRafflePayload> & { status?: string }) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && key !== 'image') {
        formData.append(key, String(value));
      }
    });
    if (payload.images && payload.images.length > 0) {
      for (const f of payload.images) formData.append('images', f);
    }

    const res = await api.put<ApiResponse<Raffle>>(`/raffles/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/raffles/${id}`);
    return res.data;
  },
};

// ---- PURCHASES ----
export const purchaseApi = {
  reserve: async (payload: ReserveNumbersPayload) => {
    const res = await api.post<ApiResponse<ReserveResult>>('/purchases/reserve', payload);
    return res.data;
  },

  getAll: async (params?: { raffle_id?: string; status?: string; page?: number; limit?: number }) => {
    const res = await api.get<ApiResponse<PaginatedResponse<Purchase>>>('/purchases', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Purchase>>(`/purchases/${id}`);
    return res.data;
  },

  cancel: async (id: string) => {
    const res = await api.delete<ApiResponse<Purchase>>(`/purchases/${id}/cancel`);
    return res.data;
  },
};
