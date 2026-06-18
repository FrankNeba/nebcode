'use client';
import { useState } from 'react';
import { useDeviceOtpStore } from '@/store/device-otp.store';
import { X, ShieldAlert, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DeviceOtpModal() {
  const { isOpen, isVerifying, closeModal, verifyOtp } = useDeviceOtpStore();
  const [otp, setOtp] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    await verifyOtp(otp);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-2xl relative">
        <button 
          type="button"
          onClick={closeModal} 
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="h-12 w-12 rounded-full bg-neb-500/10 border border-neb-500/20 flex items-center justify-center text-neb-400 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">New Device Detected</h3>
          <p className="text-xs text-gray-400 mb-6 max-w-sm">
            To ensure your account is secure, we need to verify this device. We sent a 6-digit verification code (OTP) to your registered email.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full pl-10 pr-4 py-3 bg-dark-950 border border-dark-800 focus:border-neb-500 focus:ring-1 focus:ring-neb-500 rounded-xl text-sm font-semibold tracking-widest text-center text-white placeholder:text-gray-600 outline-none transition"
                required
                maxLength={6}
                disabled={isVerifying}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-xs bg-neb-600 hover:bg-neb-500 text-white font-bold rounded-xl shadow-neb transition"
              isLoading={isVerifying}
              disabled={otp.length < 6}
            >
              Verify & Authorize Device
            </Button>

            <button
              type="button"
              onClick={closeModal}
              className="text-[10px] text-gray-500 hover:text-gray-300 underline font-semibold transition"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
