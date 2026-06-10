import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types';
import api from '@/lib/api';

// Persist a stable device ID in localStorage
function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('nebcode_device_id');
  if (!id) { id = uuidv4(); localStorage.setItem('nebcode_device_id', id); }
  return id;
}

interface AuthState {
  user: User | null; isAuthenticated: boolean; isLoading: boolean;
  login: (email: string, password: string, otp?: string) => Promise<{ otp_required?: boolean }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (u: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, isAuthenticated: false, isLoading: false,
      login: async (email, password, otp) => {
        set({ isLoading: true });
        try {
          const device_id = getOrCreateDeviceId();
          const payload: Record<string, string> = { email, password, device_id };
          if (otp) payload.otp = otp;
          const { data } = await api.post('/auth/login/', payload);
          if (data.otp_required) {
            return { otp_required: true };
          }
          const cookieOptions = {
            expires: 7, path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const
          };
          Cookies.set('access_token', data.access, cookieOptions);
          Cookies.set('refresh_token', data.refresh, cookieOptions);
          await get().fetchUser();
          window.location.href = '/dashboard';
          return {};
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

