'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', password_confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({}); setLoading(true);
    if (form.password !== form.password_confirm) {
      setErrors({ password_confirm: "Passwords don't match" });
      setLoading(false);
      return;
    }
    try {
      await authService.register(form);
      setDone(true);
    } catch (err: any) {
      const d = err?.response?.data || {};
      if (d.email) setErrors(p => ({ ...p, email: Array.isArray(d.email) ? d.email[0] : d.email }));
      if (d.password) setErrors(p => ({ ...p, password: Array.isArray(d.password) ? d.password[0] : d.password }));
      if (!d.email && !d.password) toast.error(d.detail || 'Registration failed.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-dark-950">
      <div className="card p-10 max-w-md w-full text-center shadow-2xl border-emerald-500/20 bg-dark-900/50 backdrop-blur-sm animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="font-bold text-2xl text-white mb-3">Check your email</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          We've sent a verification link to <br/>
          <strong className="text-neb-400">{form.email}</strong>.
          Please click the link to activate your account.
        </p>
        <Link href="/auth/login" className="block mt-8">
          <Button variant="secondary" className="w-full py-6">Return to Sign In</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12 bg-dark-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-4xl font-bold text-neb-500 mb-2">Join Nebcode</div>
          <p className="text-gray-400 text-sm">Start your journey into MySQL and C programming</p>
        </div>
        <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50 animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input label="Full Name" placeholder="Ada Lovelace" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} required />
            <Input 
              label="Password" 
              type={showPw ? 'text' : 'password'} 
              placeholder="Min. 8 characters" 
              value={form.password} 
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              error={errors.password} 
              required 
              suffix={
                <button type="button" className="text-gray-500 hover:text-gray-300" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <Input 
              label="Confirm Password" 
              type={showPw ? 'text' : 'password'} 
              placeholder="Repeat password" 
              value={form.password_confirm} 
              onChange={e => setForm(f => ({ ...f, password_confirm: e.target.value }))} 
              error={errors.password_confirm}
              required 
            />
            <Button type="submit" isLoading={loading} size="lg" className="w-full py-6 text-base font-semibold shadow-neb mt-2">Create account</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account? <Link href="/auth/login" className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
