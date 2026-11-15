'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { paymentService } from '@/services';
import { cn } from '@/lib/utils';

interface LabAccessGateProps {
  labName: string;
  hideBanner?: boolean;
  children: React.ReactNode;
}

export function LabAccessGate({ labName, hideBanner = false, children }: LabAccessGateProps) {
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [daysUsed, setDaysUsed] = useState<number>(0);
  const freeLimit = 3;

  const isSubscribed = Boolean(user?.is_subscribed || user?.is_staff);

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      if (!isAuthenticated) {
        if (active) setChecking(false);
        return;
      }

      try {
        const res = await paymentService.checkLabAccess();
        if (!active) return;
        const data = res.data;
        setDaysUsed(typeof data.days_used === 'number' ? data.days_used : 0);
        setAccessDenied(data.has_access === false);
        fetchUser().catch(() => {});
      } catch (err: any) {
        if (!active) return;
        if (err?.response?.status === 403) {
          setAccessDenied(true);
          setDaysUsed(3);
        } else {
          // Fallback to local user.lab_access_days calculation
          const currentMonthPrefix = new Date().toISOString().slice(0, 7);
          const todayStr = new Date().toISOString().slice(0, 10);
          const labDays: string[] = Array.isArray(user?.lab_access_days) ? user!.lab_access_days : [];
          const monthDays = labDays.filter((d) => typeof d === 'string' && d.startsWith(currentMonthPrefix));
          setDaysUsed(monthDays.length);
          if (!isSubscribed && monthDays.length >= freeLimit && !monthDays.includes(todayStr)) {
            setAccessDenied(true);
          }
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    verifyAccess();
    return () => {
      active = false;
    };
  }, [isAuthenticated, isSubscribed]);

  // 1. Unauthenticated users must sign in so their 3 free days or subscription can be tracked
  if (!checking && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-116px)] md:h-[calc(100dvh-56px)] bg-dark-950 px-4 text-center">
        <div className="max-w-md w-full bg-dark-900 border border-dark-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-neb-600/15 border border-neb-500/30 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6 text-neb-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            Sign in to use the {labName}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-6">
            Your Nebcode account includes <strong>3 free practice lab days every month</strong> across all labs, or unlimited access with an active subscription or book access code.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/login"
              className="flex-1 py-2.5 px-4 rounded-xl bg-neb-600 hover:bg-neb-500 text-white text-xs sm:text-sm font-bold transition text-center shadow-lg"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="flex-1 py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-200 text-xs sm:text-sm font-semibold transition text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Free-tier exhausted (already used 3 distinct days this month and today is a new day)
  if (!checking && !isSubscribed && accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-116px)] md:h-[calc(100dvh-56px)] bg-dark-950 px-4 text-center">
        <div className="max-w-md w-full bg-dark-900 border border-red-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            3 Free Lab Days Exhausted
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-6">
            You have used all <strong>3 of your free practice lab days</strong> for this month. Upgrade your plan or redeem a 6-character code from your Nebcode book for unlimited access to the {labName} and all other labs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/pricing"
              className="flex-1 py-2.5 px-4 rounded-xl bg-neb-600 hover:bg-neb-500 text-white text-xs sm:text-sm font-bold transition text-center shadow-lg"
            >
              Upgrade Plan / Redeem Code ↗
            </Link>
            <Link
              href="/dashboard"
              className=" py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 text-xs sm:text-sm font-semibold transition text-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const remaining = Math.max(0, freeLimit - daysUsed);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Free-tier quota banner for non-subscribed users (hidden in fullscreen or for premium/staff) */}
      {!isSubscribed && !hideBanner && (
        <div
          className={cn(
            'px-3 py-1.5 border-b flex items-center justify-between gap-2 text-[11px] shrink-0',
            remaining === 0
              ? 'bg-amber-950/30 border-amber-900/40 text-amber-300'
              : 'bg-amber-950/20 border-amber-900/30 text-amber-400'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 truncate">
            <Star className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              Free plan:{' '}
              <strong>
                {remaining} of {freeLimit} free day{remaining !== 1 ? 's' : ''} remaining
              </strong>{' '}
              this month (active today). Upgrade for unlimited access.
            </span>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-2.5 py-1 rounded-md bg-neb-600 hover:bg-neb-500 text-white font-bold text-[10px] transition-all active:scale-95"
          >
            Upgrade ↗
          </Link>
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
