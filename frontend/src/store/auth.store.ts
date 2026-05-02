import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../services/raffle.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('rifa_token'),
  isAuthenticated: !!localStorage.getItem('rifa_token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password });
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('rifa_token', token);
        localStorage.setItem('rifa_user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error(response.message || 'Erro ao fazer login');
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || error.message || 'Erro ao fazer login');
    }
  },

  logout: () => {
    localStorage.removeItem('rifa_token');
    localStorage.removeItem('rifa_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('rifa_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const response = await authApi.me();
      if (response.success && response.data) {
        set({ user: response.data, isAuthenticated: true });
      }
    } catch {
      localStorage.removeItem('rifa_token');
      localStorage.removeItem('rifa_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
