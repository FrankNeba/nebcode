'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ambassadorService, authService } from '@/services';

import { GraduationCap, Star, Clock, XCircle } from 'lucide-react';

export default function AmbassadorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ambassador, setAmbassador] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [period, setPeriod] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const periodRes = await ambassadorService.getCurrentApplicationPeriod();
      setPeriod(periodRes.data);

      try {
        const profileRes = await authService.getProfile();
        setUser(profileRes.data);

        // Check if already an ambassador
        try {
          const ambRes = await ambassadorService.getMyAmbassadorProfile();
          setAmbassador(ambRes.data);
        } catch (e) {
          // Not an ambassador, check application
          try {
            const appRes = await ambassadorService.getMyApplication();
            setApplication(appRes.data);
          } catch (err) {
            setApplication(null);
          }
        }
      } catch (authErr) {
        setUser(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (ambassador?.referral_code) {
      navigator.clipboard.writeText(ambassador.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading Ambassador Details...</p>
        </div>
      </div>
    );
  }

  // State 1: Unauthenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-[#121220] border border-red-900/30 rounded-2xl p-8 text-center shadow-2xl shadow-red-950/20">
          <div className="w-16 h-16 bg-red-950/60 border border-red-800/40 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-white">Become a Nebcode School Ambassador</h1>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            You need a Nebcode account to apply for the School Ambassador program and represent your school.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login?redirect=/ambassador/apply"
              className="w-full py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 text-center shadow-lg shadow-red-900/30"
            >
              Log In
            </Link>
            <Link
              href="/auth/register?redirect=/ambassador/apply"
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl font-semibold transition-all duration-200 text-center"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 2: User is Approved Ambassador
  if (ambassador) {
    const stats = ambassador.referral_stats || {};
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-950 via-[#181222] to-[#121220] border border-red-800/40 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/50 border border-red-700/40 rounded-full text-xs font-semibold text-red-400 mb-3">
                  <Star className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                  <span>Official Ambassador</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white">{ambassador.full_name}</h1>
                <p className="text-lg text-gray-300 font-medium mt-1">{ambassador.school}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Ambassador since {new Date(ambassador.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Referral Code Box */}
              <div className="bg-[#0e0e18] border border-red-900/40 rounded-xl p-4 min-w-[260px]">
                <span className="text-xs text-gray-400 font-medium block mb-1">Your Referral Code</span>
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                  <span className="font-mono text-lg font-bold text-red-400">{ambassador.referral_code || 'N/A'}</span>
                  <button
                    onClick={copyReferralCode}
                    className="text-xs bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded font-medium transition"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-200">Referral Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#121220] border border-white/5 rounded-xl p-5">
                <p className="text-3xl font-extrabold text-white">{stats.total_referrals || 0}</p>
                <p className="text-xs font-medium text-gray-400 mt-1">Total Referrals</p>
              </div>

              <div className="bg-[#121220] border border-white/5 rounded-xl p-5">
                <p className="text-3xl font-extrabold text-emerald-400">{stats.subscribed_referrals || 0}</p>
                <p className="text-xs font-medium text-gray-400 mt-1">Subscribed Referrals</p>
              </div>

              <div className="bg-[#121220] border border-white/5 rounded-xl p-5">
                <p className="text-3xl font-extrabold text-blue-400">{stats.monthly_subscriptions || 0}</p>
                <p className="text-xs font-medium text-gray-400 mt-1">Monthly Subscriptions</p>
              </div>

              <div className="bg-[#121220] border border-white/5 rounded-xl p-5">
                <p className="text-3xl font-extrabold text-purple-400">{stats.yearly_subscriptions || 0}</p>
                <p className="text-xs font-medium text-gray-400 mt-1">Yearly Subscriptions</p>
              </div>
            </div>
          </div>

          {/* Earnings Section */}
          <div className="bg-[#121220] border border-red-900/30 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-200">Referral Earnings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <span className="text-xs text-gray-400 block mb-1">Monthly Earnings (500 XAF 1st / 300 XAF renew)</span>
                <p className="text-lg font-bold text-gray-200">{(stats.monthly_earnings || 0).toLocaleString()} XAF</p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <span className="text-xs text-gray-400 block mb-1">Yearly &amp; Book Code Earnings (1,000 XAF each)</span>
                <p className="text-lg font-bold text-gray-200">{(stats.yearly_earnings || 0).toLocaleString()} XAF</p>
              </div>
              <div className="bg-gradient-to-r from-red-950/60 to-red-900/40 border border-red-700/50 rounded-xl p-4">
                <span className="text-xs text-red-300 block mb-1">Total Referral Earnings</span>
                <p className="text-2xl font-extrabold text-white">{(stats.total_earnings || 0).toLocaleString()} XAF</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Pending Application
  if (application && application.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#121220] border border-amber-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-6 text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Application Submitted</h1>
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            Your Nebcode School Ambassador application is currently under review by our administration team.
          </p>

          <div className="space-y-3 bg-black/40 border border-white/5 rounded-xl p-4 text-sm mb-6">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Application Year</span>
              <span className="font-semibold text-white">{application.application_year}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Applicant Name</span>
              <span className="font-semibold text-white">{application.full_name}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">School</span>
              <span className="font-semibold text-white">{application.school}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">WhatsApp Contact</span>
              <span className="font-semibold text-white">{application.whatsapp_contact}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-400">Status</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold uppercase">
                {application.status}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You will receive an email once your application review is complete.
          </p>
        </div>
      </div>
    );
  }

  // State 4: Rejected Application
  if (application && application.status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#121220] border border-red-900/40 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-red-950/60 border border-red-800/40 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
            <XCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Application Not Approved</h1>
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            Your previous application was not approved. You can submit a new application when applications open for a future program year.
          </p>

          {period && period.is_open ? (
            <Link
              href="/ambassador/apply"
              className="inline-block w-full py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-semibold transition"
            >
              Apply Again
            </Link>
          ) : (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400">
              Applications for current periods are currently closed. Check back soon for future program updates.
            </div>
          )}
        </div>
      </div>
    );
  }

  // State 5: No Application yet (Check if Period is Open or Closed)
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-xl w-full bg-[#121220] border border-red-900/30 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-950/60 border border-red-800/40 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <GraduationCap className="w-8 h-8" />
        </div>

        {period && period.is_open ? (
          <>
            <h1 className="text-3xl font-bold mb-3 text-white">Become a Nebcode School Ambassador</h1>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Represent Nebcode in your school and help other Computer Science students discover better ways to practice and learn.
            </p>

            <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left text-sm mb-8 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Program Year:</span>
                <span className="font-semibold text-red-400">{period.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Applications Open:</span>
                <span className="text-gray-200">{new Date(period.opens_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Applications Close:</span>
                <span className="text-gray-200">{new Date(period.closes_at).toLocaleDateString()}</span>
              </div>
            </div>

            <Link
              href="/ambassador/apply"
              className="block w-full py-3.5 bg-red-700 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-950/50 transition text-center"
            >
              Apply Now
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-3 text-white">Applications Closed</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Applications for the Nebcode School Ambassador program are currently closed.
            </p>
            <p className="text-xs text-gray-500">
              Please check back when applications open for the next program year.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
