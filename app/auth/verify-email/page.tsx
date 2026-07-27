'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Cookies from 'js-cookie';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { fetchUser } = useAuthStore();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMsg('No verification token found in the link.');
      return;
    }

    authService.verifyEmail(token)
      .then(async (res) => {
        const { access, refresh } = res.data;

        // Store tokens (same cookie config used everywhere else)
        const cookieOptions = {
          expires: 7,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
        };
        Cookies.set('access_token', access, cookieOptions);
        Cookies.set('refresh_token', refresh, cookieOptions);

        // Hydrate auth store so navbar / guards know the user is logged in
        await fetchUser();

        setStatus('success');
        setMsg('Your email has been verified! Signing you in…');

        // Brief pause so the user can see the success message, then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 1800);
      })
      .catch((err) => {
        setStatus('error');
        setMsg(err?.response?.data?.detail || 'Verification failed. The link may have expired.');
      });
  }, [token, fetchUser, router]);

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-dark-950">
      <div className="card p-10 max-w-sm w-full text-center shadow-2xl bg-dark-900/50 backdrop-blur-sm animate-in zoom-in-95 duration-500">

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-neb-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="font-bold text-2xl text-white mb-2">Verified!</h2>
            <p className="text-gray-400 text-sm mb-4">{msg}</p>
            <div className="flex items-center justify-center gap-2 text-neb-400 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Redirecting to dashboard…</span>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="font-bold text-2xl text-white mb-2">Verification Failed</h2>
            <p className="text-gray-400 text-sm mb-6">{msg}</p>
            <div className="flex flex-col gap-3">
              <Link href="/auth/register">
                <Button variant="secondary" className="w-full">Back to Register</Button>
              </Link>
              <Link href="/auth/login">
                <Button className="w-full">Sign In Instead</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neb-400" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
