'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, ArrowRight, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import GoogleReferralModal from '@/components/auth/GoogleReferralModal';

type LoginStep = 'gmail_check' | 'google_auth' | 'email_password';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { login, logout, isLoading } = useAuthStore();
  const [step, setStep] = useState<LoginStep>('gmail_check');
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showGoogleRefModal, setShowGoogleRefModal] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('/auth')) {
      localStorage.setItem('auth_redirect', redirectParam);
    }
  }, [redirectParam]);

  const getRedirectTarget = () => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('auth_redirect') : null;
    const target = redirectParam || saved || '/dashboard';
    if (!target.startsWith('/') || target.startsWith('/auth')) {
      return '/dashboard';
    }
    return target;
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
        window.location.href = target;
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

        {/* ── STEP 1: Ask if user has a Gmail account ── */}
        {step === 'gmail_check' && (
          <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neb-700/40 to-neb-900/40 border border-neb-700/40 flex items-center justify-center">
                <Mail className="h-7 w-7 text-neb-400" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-white text-center mb-2">
              Do you have a <span className="text-neb-400">Gmail</span> account?
            </h2>
            <p className="text-gray-500 text-xs text-center mb-8 leading-relaxed">
              Choose how you would like to sign in to your Nebcode account.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setStep('google_auth')}
                className="group w-full flex items-center justify-between px-5 py-4 rounded-xl bg-neb-900/40 border border-neb-700/50 hover:bg-neb-800/50 hover:border-neb-600 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.68-5.17 3.68-9.09z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09C3.26 21.3 7.35 24 12 24z" />
                      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.28C.46 8.24 0 10.06 0 12s.46 3.76 1.28 5.38l3.99-3.09z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.7 1.28 6.62l3.99 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Yes, I have a Gmail account</p>
                    <p className="text-xs text-neb-400 mt-0.5">Sign in with Google</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neb-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setStep('email_password')}
                className="group w-full flex items-center justify-between px-5 py-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:bg-dark-800 hover:border-dark-600 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dark-700/60 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-300">No, I don't have a Gmail account</p>
                    <p className="text-xs text-gray-500 mt-0.5">Enter email and password</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              No account? <Link href={registerHref} className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Create one free</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2A: Sign in with Google only ── */}
        {step === 'google_auth' && (
          <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50 animate-in fade-in zoom-in-95 duration-300 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Sign in with Google</h2>
            <p className="text-gray-400 text-sm mb-6">Click below to continue with your Google account</p>

            <div className="py-4">
              <GoogleLoginButton onSuccess={(isNew) => {
                const target = getRedirectTarget();
                if (typeof window !== 'undefined') localStorage.removeItem('auth_redirect');
                if (isNew) {
                  setShowGoogleRefModal(true);
                } else {
                  window.location.href = target;
                }
              }} />
            </div>

            <div className="mt-6 pt-6 border-t border-dark-700 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setStep('email_password')}
                className="text-xs text-neb-400 hover:text-neb-300 transition-colors"
              >
                Prefer to enter email & password? Click here →
              </button>
              <button
                type="button"
                onClick={() => setStep('gmail_check')}
                className="flex items-center justify-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors mt-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              No account? <Link href={registerHref} className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Create one free</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2B: Sign in with Email and Password ── */}
        {step === 'email_password' && (
          <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Sign in with Email</h2>
              <p className="text-gray-400 text-sm">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {isUnverified && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex flex-col gap-2 animate-in fade-in duration-300">
                  <span>Your email address has not been verified yet. Please check your inbox for the activation link before signing in.</span>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="text-left font-semibold text-amber-400 hover:text-amber-200 underline transition-colors w-fit disabled:opacity-50"
                    >
                      {isResending ? 'Sending verification email…' : 'Didn’t receive an email? Resend verification link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('google_auth')}
                      className="text-left font-semibold text-neb-400 hover:text-neb-300 underline transition-colors w-fit"
                    >
                      Have a Gmail account? Sign in with Google to verify automatically →
                    </button>
                  </div>
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

            <div className="mt-6 pt-4 border-t border-dark-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('gmail_check')}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep('google_auth')}
                className="text-xs text-neb-400 hover:text-neb-300 transition-colors"
              >
                Sign in with Google instead →
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              No account? <Link href={registerHref} className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Create one free</Link>
            </p>
          </div>
        )}
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
