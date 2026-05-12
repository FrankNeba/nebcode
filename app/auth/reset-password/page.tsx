'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ new_password: '', new_password_confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirm) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await authService.resetPassword({ token, ...form });
      toast.success('Password reset! Please sign in.'); router.push('/auth/login');
    } catch (err: any) { toast.error(err?.response?.data?.detail || 'Reset failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-bold text-2xl text-white">Set new password</h1>
          <p className="text-gray-500 text-sm mt-1">Choose a strong password</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="New Password" type="password" placeholder="••••••••" value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} required />
            <Input label="Confirm Password" type="password" placeholder="••••••••" value={form.new_password_confirm} onChange={e => setForm(f => ({ ...f, new_password_confirm: e.target.value }))} required />
            <Button type="submit" isLoading={loading} size="lg" className="w-full">Reset password</Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-56px)] flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
