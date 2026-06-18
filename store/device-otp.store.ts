import { create } from 'zustand';
import { authService } from '@/services';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

interface DeviceOtpState {
  isOpen: boolean;
  isVerifying: boolean;
  deviceId: string;
  onVerifiedCallback: (() => void) | null;
  openModal: (deviceId: string, onVerified: () => void) => Promise<void>;
  closeModal: () => void;
  verifyOtp: (otp: string) => Promise<boolean>;
}

export const useDeviceOtpStore = create<DeviceOtpState>((set, get) => ({
  isOpen: false,
  isVerifying: false,
  deviceId: '',
  onVerifiedCallback: null,
  openModal: async (deviceId, onVerified) => {
    set({ isOpen: true, deviceId, onVerifiedCallback: onVerified, isVerifying: false });
    // Trigger the backend to generate and send OTP
    try {
      const { data } = await authService.verifyDeviceOtp(deviceId, '');
      if (data && data.detail) {
        toast.success(data.detail);
      } else {
        toast.success('Verification OTP sent to your email.');
      }
    } catch (err: any) {
      // Some endpoints might return error responses when OTP is missing.
      // If it throws an expected error, handle it gracefully.
      const msg = err.response?.data?.detail || 'Failed to trigger device authorization OTP.';
      toast.error(msg);
    }
  },
  closeModal: () => {
    set({ isOpen: false, onVerifiedCallback: null });
  },
  verifyOtp: async (otp) => {
    const { deviceId, onVerifiedCallback } = get();
    set({ isVerifying: true });
    try {
      const { data } = await authService.verifyDeviceOtp(deviceId, otp);
      
      // Save new JWT tokens that reflect the updated active_device_id
      const cookieOptions = {
        expires: 7, path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const
      };
      Cookies.set('access_token', data.access, cookieOptions);
      Cookies.set('refresh_token', data.refresh, cookieOptions);
      
      toast.success('Device authorized successfully!');
      set({ isOpen: false, isVerifying: false });
      
      if (onVerifiedCallback) {
        onVerifiedCallback();
      }
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid or expired OTP.');
      set({ isVerifying: false });
      return false;
    }
  }
}));
