'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    // Clear any stale state when arriving at login
    logout();
  }, [logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12 bg-dark-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-4xl font-bold text-neb-500 mb-2">Nebcode</div>
          <p className="text-gray-400 text-sm">Sign in to continue your learning journey</p>
        </div>
        <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50 animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            
            <div className="flex flex-col gap-1.5">
              <Input 
                label="Password" 
                type={showPw ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                required 
                suffix={
                  <button type="button" className="text-gray-500 hover:text-gray-300 transition-colors focus:outline-none" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="flex justify-end mt-1">
                <Link href="/auth/forgot-password" className="text-xs text-neb-400 hover:text-neb-300 transition-colors">Forgot password?</Link>
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} size="lg" className="w-full py-6 text-base font-semibold shadow-neb">Sign in</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-8">
            No account? <Link href="/auth/register" className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
