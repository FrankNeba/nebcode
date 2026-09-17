'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import GoogleReferralModal from '@/components/auth/GoogleReferralModal';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { login, logout, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showGoogleRefModal, setShowGoogleRefModal] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    logout();
    if (redirectParam && redirectParam.startsWith('/')) {
      localStorage.setItem('auth_redirect', redirectParam);
    }
  }, [logout, redirectParam]);

  const getRedirectTarget = () => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('auth_redirect') : null;
    const target = redirectParam || saved || '/dashboard';
    return target.startsWith('/') ? target : '/dashboard';
  };

  const handleResendVerification = async () => {
    if (!form.email) {
      toast.error('Please enter your email address.');
      return;
    }
    setIsResending(true);
    try {
      await authService.resendVerification(form.email);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to resend verification link.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnverified(false);
    try {
      const result = await login(form.email, form.password, otpRequired ? otp : undefined);
      if (result?.otp_required) {
        setOtpRequired(true);
        toast.success('An OTP has been sent to your email to verify this device.');
      } else {
        const target = getRedirectTarget();
        if (typeof window !== 'undefined') localStorage.removeItem('auth_redirect');
        toast.success('Welcome back!');
        router.push(target);
      }
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.is_verified === false) {
        setIsUnverified(true);
      }
      toast.error(err?.response?.data?.detail || 'Invalid credentials or OTP.');
    }
  };

  if (showGoogleRefModal) {
    return <GoogleReferralModal onClose={() => setShowGoogleRefModal(false)} />;
  }

  const redirectTarget = getRedirectTarget();
  const registerHref = redirectTarget !== '/dashboard'
    ? `/auth/register?redirect=${encodeURIComponent(redirectTarget)}`
    : '/auth/register';

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12 bg-dark-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-4xl font-bold text-neb-500 mb-2">Nebcode</div>
          <p className="text-gray-400 text-sm">Sign in to continue your learning journey</p>
        </div>
        <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50 animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {isUnverified && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex flex-col gap-2 animate-in fade-in duration-300">
                <span>Your email address has not been verified yet. Please check your inbox for the activation link before signing in.</span>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-left font-semibold text-amber-400 hover:text-amber-200 underline transition-colors w-fit disabled:opacity-50"
                >
                  {isResending ? 'Sending verification email…' : 'Didn’t receive an email? Resend verification link'}
                </button>
              </div>
            )}
            {!otpRequired ? (
              <>
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
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-sm text-gray-300 bg-neb-950/30 border border-neb-800/30 rounded-lg p-3 text-center">
                  A verification code has been sent to <strong className="text-neb-400">{form.email}</strong> because you are logging in from a new device.
                </div>
                <Input
                  label="Verification Code (OTP)"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setOtpRequired(false)}
                  className="text-xs text-left text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ← Back to Email / Password
                </button>
              </div>
            )}

            <Button type="submit" isLoading={isLoading} size="lg" className="w-full py-6 text-base font-semibold shadow-neb">
              {otpRequired ? 'Verify & Sign in' : 'Sign in'}
            </Button>
          </form>

          {!otpRequired && (
            <>
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-dark-700"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase font-medium">Or</span>
                <div className="flex-grow border-t border-dark-700"></div>
              </div>

              <GoogleLoginButton onSuccess={(isNew) => {
                const target = getRedirectTarget();
                if (isNew) {
                  setShowGoogleRefModal(true);
                } else {
                  if (typeof window !== 'undefined') localStorage.removeItem('auth_redirect');
                  router.push(target);
                }
              }} />
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            No account? <Link href={registerHref} className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <Spinner className="h-8 w-8 text-neb-500" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
