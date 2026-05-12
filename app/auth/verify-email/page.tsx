'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('No token found.'); return; }
    authService.verifyEmail(token)
      .then(() => { setStatus('success'); setMsg('Your email has been verified!'); })
      .catch(err => { setStatus('error'); setMsg(err?.response?.data?.detail || 'Verification failed.'); });
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="card p-8 max-w-sm w-full text-center">
        {status === 'loading' && <><Loader2 className="h-12 w-12 text-neb-400 animate-spin mx-auto mb-4" /><p className="text-gray-400">Verifying…</p></>}
        {status === 'success' && <><CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" /><h2 className="font-bold text-xl text-white mb-2">Verified!</h2><p className="text-gray-400 text-sm mb-6">{msg}</p><Link href="/auth/login"><Button className="w-full">Sign in</Button></Link></>}
        {status === 'error' && <><XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" /><h2 className="font-bold text-xl text-white mb-2">Failed</h2><p className="text-gray-400 text-sm mb-6">{msg}</p><Link href="/auth/register"><Button variant="secondary" className="w-full">Back to register</Button></Link></>}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-56px)] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-neb-400" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
