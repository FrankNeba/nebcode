import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null; isAuthenticated: boolean; isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (u: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, isAuthenticated: false, isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login/', { email, password });
          const cookieOptions = { 
            expires: 7, 
            path: '/', 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax' as const 
          };
          Cookies.set('access_token', data.access, cookieOptions);
          Cookies.set('refresh_token', data.refresh, cookieOptions);
          await get().fetchUser();
          // Force a full reload to synchronize cookies with middleware
          window.location.href = '/dashboard';
        } finally { set({ isLoading: false }); }
      },
      logout: async () => {
        try {
          const r = Cookies.get('refresh_token');
          if (r) await api.post('/auth/logout/', { refresh: r });
        } catch {}
        Cookies.remove('access_token'); Cookies.remove('refresh_token');
        set({ user: null, isAuthenticated: false });
      },
      fetchUser: async () => {
        try {
          const { data } = await api.get('/auth/profile/');
          set({ user: data, isAuthenticated: true });
        } catch { set({ user: null, isAuthenticated: false }); }
      },
      setUser: (user) => set({ user, isAuthenticated: true }),
    }),
    { name: 'nebcode-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);
