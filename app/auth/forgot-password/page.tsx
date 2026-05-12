'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await authService.forgotPassword(email); setSent(true); }
    catch { toast.error('Something went wrong.'); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="card p-8 max-w-sm w-full text-center">
        <Mail className="h-12 w-12 text-neb-400 mx-auto mb-4" />
        <h2 className="font-bold text-xl text-white mb-2">Check your inbox</h2>
        <p className="text-gray-400 text-sm">Reset link sent to <strong className="text-white">{email}</strong>. Expires in 15 min.</p>
        <Link href="/auth/login" className="block mt-6"><Button variant="secondary" className="w-full">Back to sign in</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-bold text-2xl text-white">Forgot password?</h1>
          <p className="text-gray-500 text-sm mt-1">We'll email you a reset link</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Button type="submit" isLoading={loading} size="lg" className="w-full">Send reset link</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/auth/login" className="text-neb-400 hover:text-neb-300">← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
