'use client';

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { authService } from '@/services';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth.store';

interface GoogleLoginButtonProps {
  onSuccess: (isNewUser: boolean) => void;
}

export default function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleCredentialResponse = async (response: any) => {
      try {
        const credential = response.credential;
        const { data } = await authService.googleAuth({ token: credential });
        
        const cookieOptions = {
          expires: 7,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const
        };
        
        Cookies.set('access_token', data.access, cookieOptions);
        Cookies.set('refresh_token', data.refresh, cookieOptions);
        
        await fetchUser();
        toast.success('Authenticated with Google!');
        onSuccess(data.is_new_user);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.detail || 'Google authentication failed.');
      }
    };

    const initGoogleSignIn = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1047195484803-r1v0nkr3bdf2d8i4a7f05h1s3990fbfg.apps.googleusercontent.com';
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });

        if (buttonRef.current) {
          (window as any).google.accounts.id.renderButton(buttonRef.current, {
            theme: 'dark',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }
      }
    };

    const interval = setInterval(() => {
      if ((window as any).google) {
        initGoogleSignIn();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [fetchUser, onSuccess]);

  return (
    <div className="w-full flex justify-center py-1">
      <div ref={buttonRef} className="w-full"></div>
    </div>
  );
}
