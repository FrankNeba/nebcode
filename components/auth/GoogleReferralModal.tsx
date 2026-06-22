'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface GoogleReferralModalProps {
  onClose: () => void;
}

export default function GoogleReferralModal({ onClose }: GoogleReferralModalProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Please enter a referral code or click Skip.');
      return;
    }
    setLoading(true);
    try {
      await authService.claimReferral(code.trim());
      toast.success('Referral code applied successfully!');
      onClose();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid referral code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast.success('Welcome to Nebcode!');
    onClose();
    router.push('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card p-8 max-w-md w-full shadow-2xl border border-neb-600/30 bg-dark-900/90 text-center animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-white mb-2">Got a Referral Code?</h3>
        <p className="text-gray-400 text-sm mb-6">
          If someone referred you to Nebcode, enter their referral code below. Otherwise, you can skip this step.
        </p>
        
        <div className="flex flex-col gap-4 mb-6">
          <Input
            label="Referral Code"
            placeholder="e.g. NEB100"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleSkip}
            className="flex-1 py-3"
            disabled={loading}
          >
            Skip
          </Button>
          <Button
            onClick={handleApply}
            isLoading={loading}
            className="flex-1 py-3 shadow-neb"
          >
            Apply Code
          </Button>
        </div>
      </div>
    </div>
  );
}
