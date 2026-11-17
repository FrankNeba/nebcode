'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle2, Eye, EyeOff, BookOpen, ArrowRight, X, ChevronLeft, Sparkles, KeyRound, AlertTriangle, Check, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authService, paymentService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

// Steps:
//  'book'   = "Do you own the handbook?" question
//  'code'   = Enter 6-char access code (only if handbook owner)
//  'gmail'  = "Do you have a Gmail account?" question
//  'google' = Just sign in with Google
//  'details'= Full signup form with email & password

type Step = 'book' | 'code' | 'gmail' | 'google' | 'details';

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { logout } = useAuthStore();
  const [step, setStep] = useState<Step>('book');

  // Access code state (step 'code')
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  // Form state (step 'details')
  const [form, setForm] = useState({
    email: '', full_name: '', password: '', password_confirm: '',
    referral_code: '', access_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);

  // Google-auth post-sign-in flow: if user was a handbook owner we redeem the code
  const [googleNewUser, setGoogleNewUser] = useState(false);
  const pendingCodeRef = useRef(''); // stores the access code to redeem after Google sign-in

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

  // Pre-fill referral code from ?ref= URL param
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setForm(f => ({ ...f, referral_code: ref.toUpperCase() }));
  }, [searchParams]);

  // ── Step 'book' → 'code' (Yes, I own the handbook) ──────────────────────────
  const handleOwnsBook = () => setStep('code');

  // ── Step 'book' → 'gmail' (No, I don't own the handbook) ─────────────────────
  const handleNoBook = () => setStep('gmail');

  // ── Step 'code': Validate the 6-char code live ──────────────────────────────
  const handleCodeInput = (val: string) => {
    setAccessCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
    setCodeError('');
    setCodeVerified(false);
  };

  const handleVerifyCode = async () => {
    const clean = accessCode.trim().toUpperCase();
    if (clean.length !== 6) {
      setCodeError('Please enter a 6-character code.');
      return;
    }
    setValidatingCode(true);
    setCodeError('');
    try {
      setCodeVerified(true);
      pendingCodeRef.current = clean;
      setForm(f => ({ ...f, access_code: clean }));
      setStep('gmail');
      toast.success('Code accepted! Next, choose your sign up method.');
    } catch {
      setCodeError('Invalid or already used code. Please try again.');
    } finally {
      setValidatingCode(false);
    }
  };

  // ── Step 'details': Form submission ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
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
      if (d.referral_code) setErrors(p => ({ ...p, referral_code: Array.isArray(d.referral_code) ? d.referral_code[0] : d.referral_code }));
      if (d.access_code) {
        setErrors(p => ({ ...p, access_code: Array.isArray(d.access_code) ? d.access_code[0] : d.access_code }));
        // Drop back to code entry step so user can correct it
        if (pendingCodeRef.current) setStep('code');
      }
      if (!d.email && !d.password && !d.referral_code && !d.access_code) {
        toast.error(d.detail || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign-in success handler ──────────────────────────────────────────
  const handleGoogleSuccess = async (isNewUser: boolean) => {
    const codeToRedeem = pendingCodeRef.current;

    if (codeToRedeem) {
      try {
        await paymentService.redeemAccessCode(codeToRedeem);
        toast.success('Premium access activated via your handbook code!');
      } catch (err: any) {
        if (!err?.response?.data?.detail?.includes('already')) {
          toast.error(err?.response?.data?.detail || 'Code could not be applied. You can redeem it from your dashboard.');
        }
      }
    }

    if (isNewUser) {
      // Show referral code prompt (GoogleReferralModal equivalent inline)
      setGoogleNewUser(true);
    } else {
      const target = getRedirectTarget();
      if (typeof window !== 'undefined') localStorage.removeItem('auth_redirect');
      window.location.href = target;
    }
  };

  // ── Google new-user referral inline modal ───────────────────────────────────
  const [refCode, setRefCode] = useState('');
  const [refLoading, setRefLoading] = useState(false);

  const handleApplyReferral = async () => {
    const target = getRedirectTarget();
    if (typeof window !== 'undefined') localStorage.removeItem('auth_redirect');
    if (!refCode.trim()) {
      window.location.href = target;
      return;
    }
    setRefLoading(true);
    try {
      await authService.claimReferral(refCode.trim());
      toast.success('Referral code applied!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid referral code.');
    } finally {
      setRefLoading(false);
      window.location.href = target;
    }
  };

  // ── Render: Google referral overlay ────────────────────────────────────────
  if (googleNewUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="card p-8 max-w-md w-full shadow-2xl border border-neb-600/30 bg-dark-900/90 text-center animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-neb-900/60 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-neb-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {pendingCodeRef.current ? 'Welcome, Premium Member!' : 'Welcome to Nebcode!'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {pendingCodeRef.current
              ? 'Your handbook code was applied. You have 1 year of premium access. Got a referral code too?'
              : 'If someone referred you, enter their code below for both of you to benefit. Otherwise skip.'}
          </p>
          <div className="flex flex-col gap-4 mb-6">
            <Input
              label="Referral Code (Optional)"
              placeholder="e.g. NEB100"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                const target = getRedirectTarget();
                if (typeof window !== 'undefined') localStorage.removeItem('auth_redirect');
                window.location.href = target;
              }}
              className="flex-1 py-3"
              disabled={refLoading}
            >
              Skip
            </Button>
            <Button
              onClick={handleApplyReferral}
              isLoading={refLoading}
              className="flex-1 py-3 shadow-neb"
            >
              Apply & Go
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const redirectTarget = getRedirectTarget();
  const loginHref = redirectTarget !== '/dashboard'
    ? `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`
    : '/auth/login';

  // ── Render: Done (verification email sent) ─────────────────────────────────
  if (done) return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-dark-950">
      <div className="card p-10 max-w-md w-full text-center shadow-2xl border-emerald-500/20 bg-dark-900/50 backdrop-blur-sm animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="font-bold text-2xl text-white mb-3">Check your email</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          We've sent a verification link to <br />
          <strong className="text-neb-400">{form.email}</strong>.
          {form.access_code && (
            <span className="block mt-2 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1">
              <Check className="h-3.5 w-3.5" /> Premium access will be activated once you verify your email.
            </span>
          )}
        </p>

        {/* Spam notice — prominent callout */}
        <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-600/40 rounded-xl px-4 py-3 text-left mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300 text-xs leading-relaxed">
            <span className="font-bold block mb-0.5">Don't see it?</span>
            Please check your <span className="font-bold">spam</span> or <span className="font-bold">junk</span> folder — our verification emails sometimes end up there. Mark it as "Not Spam" to ensure future emails reach your inbox.
          </p>
        </div>

        <Link href={loginHref} className="block">
          <Button variant="secondary" className="w-full py-6">Return to Sign In</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12 bg-dark-950 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-neb-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Progress dots */}
        {step !== 'book' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-1.5 w-8 rounded-full bg-neb-500" />
            <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${(step === 'code' || step === 'gmail' || step === 'google' || step === 'details') ? 'bg-neb-500' : 'bg-dark-700'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${(step === 'google' || step === 'details') ? 'bg-neb-500' : 'bg-dark-700'}`} />
          </div>
        )}

        {/* ── STEP BOOK: Handbook question ── */}
        {step === 'book' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-neb-500 mb-2">Join Nebcode</div>
              <p className="text-gray-400 text-sm">Let's get you started</p>
            </div>

            <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50">
              {/* Book illustration */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-24 rounded-lg bg-gradient-to-br from-neb-700 to-neb-900 shadow-2xl flex items-center justify-center border border-neb-600/40">
                    <BookOpen className="h-9 w-9 text-neb-300" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <KeyRound className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-bold text-white text-center mb-2">
                Do you own the<br />
                <span className="text-neb-400">Nebcode Practical Handbook</span>?
              </h2>
              <p className="text-gray-500 text-xs text-center mb-8 leading-relaxed">
                The <em>Advanced Level Computer Science</em> handbook comes with a 6-letter premium access code on its first page that unlocks 1 year of free premium access.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleOwnsBook}
                  className="group w-full flex items-center justify-between px-5 py-4 rounded-xl bg-neb-900/40 border border-neb-700/50 hover:bg-neb-800/50 hover:border-neb-600 transition-all duration-200 text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-white">Yes, I have the handbook</p>
                    <p className="text-xs text-neb-400 mt-0.5">Enter my code → unlock 1 year free</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neb-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleNoBook}
                  className="group w-full flex items-center justify-between px-5 py-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:bg-dark-800 hover:border-dark-600 transition-all duration-200 text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-300">No, I don't have it</p>
                    <p className="text-xs text-gray-500 mt-0.5">Continue to sign up</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-500 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link href={loginHref} className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Sign in</Link>
              </p>
            </div>
          </div>
        )}

        {/* ── STEP CODE: Enter access code ── */}
        {step === 'code' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-neb-500 mb-2">Enter Your Code</div>
              <p className="text-gray-400 text-sm">Find the 6-character code on the first page of your handbook</p>
            </div>

            <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neb-700/40 to-neb-900/40 border border-neb-700/40 flex items-center justify-center">
                  <KeyRound className="h-7 w-7 text-neb-400" />
                </div>
              </div>

              <p className="text-center text-xs text-gray-500 mb-6 leading-relaxed">
                Your <strong className="text-gray-300">Nebcode Practical Handbook for Advanced Level Computer Science</strong> contains a unique 6-character alphanumeric code on its first page.
              </p>

              {/* Big OTP-style code input */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-400 mb-2 text-center uppercase tracking-wider">
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={e => handleCodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                  maxLength={6}
                  placeholder="A1B2C3"
                  className={`w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-4 px-4 rounded-xl border bg-dark-950 text-white outline-none transition-all
                    ${codeError ? 'border-red-500 focus:border-red-400' : 'border-dark-700 focus:border-neb-500'}
                    placeholder:tracking-normal placeholder:text-dark-600 placeholder:text-base placeholder:font-normal`}
                  autoComplete="off"
                  autoFocus
                />
                {codeError && (
                  <p className="text-red-400 text-xs mt-2 text-center">{codeError}</p>
                )}
                <p className="text-gray-600 text-[11px] text-center mt-2">Letters and numbers only • case-insensitive</p>
              </div>

              <Button
                onClick={handleVerifyCode}
                isLoading={validatingCode}
                disabled={accessCode.length !== 6}
                className="w-full py-4 text-sm font-bold shadow-neb mb-4"
              >
                Verify Code & Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              <button
                type="button"
                onClick={() => setStep('book')}
                className="w-full flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors py-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          </div>
        )}

        {/* ── STEP GMAIL: Ask if user has a Gmail account ── */}
        {step === 'gmail' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-neb-500 mb-2">Create Account</div>
              <p className="text-gray-400 text-sm">Choose how you want to sign up</p>
            </div>

            <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neb-700/40 to-neb-900/40 border border-neb-700/40 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-neb-400" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-white text-center mb-2">
                Do you have a <span className="text-neb-400">Gmail</span> account?
              </h2>
              <p className="text-gray-500 text-xs text-center mb-8 leading-relaxed">
                If you have a Google / Gmail account, you can sign up with one click. Otherwise, you can fill in your details manually.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setStep('google')}
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
                      <p className="text-xs text-neb-400 mt-0.5">Sign up with Google</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neb-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="group w-full flex items-center justify-between px-5 py-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:bg-dark-800 hover:border-dark-600 transition-all duration-200 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-dark-700/60 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-300">No, I don't have a Gmail account</p>
                      <p className="text-xs text-gray-500 mt-0.5">Fill in details manually</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-500 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(pendingCodeRef.current ? 'code' : 'book')}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </button>
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link href={loginHref} className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP GOOGLE: Just sign in with Google ── */}
        {step === 'google' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-neb-500 mb-1">Sign up with Google</div>
              {(form.access_code || pendingCodeRef.current) && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Handbook code attached
                </div>
              )}
              <p className="text-gray-400 text-sm mt-2">Click below to continue with your Google account</p>
            </div>

            <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50 text-center">
              <div className="py-6">
                <GoogleLoginButton onSuccess={handleGoogleSuccess} />
              </div>

              <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-xs text-neb-400 hover:text-neb-300 transition-colors"
                >
                  Prefer to enter details manually? Fill out form →
                </button>

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setStep('gmail')}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href={loginHref} className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Sign in</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP DETAILS: Full signup form ── */}
        {step === 'details' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-neb-500 mb-1">Create Account</div>
              {form.access_code && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Premium code applied
                </div>
              )}
              {!form.access_code && <p className="text-gray-400 text-sm mt-1">Start your journey into MySQL and C programming</p>}
            </div>

            <div className="card p-8 shadow-2xl border-dark-700 backdrop-blur-sm bg-dark-900/50">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  placeholder="Ada Lovelace"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  error={errors.email}
                  required
                />
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
                <Input
                  label="Referral Code (Optional)"
                  placeholder="e.g. NEB100"
                  value={form.referral_code}
                  onChange={e => setForm(f => ({ ...f, referral_code: e.target.value }))}
                  error={errors.referral_code}
                />

                {/* Access code — shown as locked/verified if from handbook flow */}
                {form.access_code ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">Premium Access Code</label>
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-700/40 bg-emerald-950/30">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-mono font-bold tracking-widest text-sm flex-1">{form.access_code}</span>
                      <button
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, access_code: '' })); pendingCodeRef.current = ''; setStep('code'); }}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove code"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {errors.access_code && <p className="text-red-400 text-xs">{errors.access_code}</p>}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  isLoading={loading}
                  size="lg"
                  className="w-full py-6 text-base font-semibold shadow-neb mt-1"
                >
                  Create account
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-dark-700 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setStep('google')}
                  className="text-xs text-neb-400 hover:text-neb-300 transition-colors text-center"
                >
                  Have a Gmail account? Sign up with Google instead →
                </button>

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setStep('gmail')}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href={loginHref} className="text-neb-400 hover:text-neb-300 font-medium transition-colors">Sign in</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <Spinner className="h-8 w-8 text-neb-500" />
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  );
}
