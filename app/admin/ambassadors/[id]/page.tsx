'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ambassadorService } from '@/services';

export default function AdminAmbassadorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [ambassador, setAmbassador] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAmbassador();
    }
  }, [id]);

  const fetchAmbassador = async () => {
    setLoading(true);
    try {
      const res = await ambassadorService.getAdminAmbassadorDetail(id);
      setAmbassador(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading Ambassador Profile...</p>
        </div>
      </div>
    );
  }

  if (!ambassador) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white p-8">
        <div className="max-w-md mx-auto bg-[#121220] border border-red-900/30 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Ambassador Not Found</h1>
          <Link href="/admin/ambassadors" className="inline-block text-sm text-red-400 hover:underline">
            ← Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  const stats = ambassador.referral_stats || {};

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Back Link & Action */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href="/admin/ambassadors" className="text-xs text-red-400 hover:underline flex items-center gap-1 font-medium">
            ← Back to Ambassadors Overview
          </Link>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
            Status: Active
          </span>
        </div>

        {/* Profile Banner */}
        <div className="bg-gradient-to-r from-red-950 via-[#181222] to-[#121220] border border-red-800/40 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/50 border border-red-700/40 rounded-full text-xs font-semibold text-red-400 mb-3">
              <span>Nebcode School Ambassador</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">{ambassador.full_name}</h1>
            <p className="text-lg text-gray-300 font-medium mt-1">School: {ambassador.school}</p>
            <p className="text-xs text-gray-400 mt-2">
              Joined: {new Date(ambassador.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 min-w-[220px]">
            <span className="text-xs text-gray-400 block mb-1">Referral Code</span>
            <span className="font-mono text-xl font-extrabold text-red-400">{ambassador.referral_code || 'N/A'}</span>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="bg-[#121220] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Account Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Full Name</span>
              <span className="font-semibold text-white">{ambassador.full_name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Nebcode Email</span>
              <span className="font-mono text-gray-200">{ambassador.user_email}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Phone Number</span>
              <span className="text-gray-200">{ambassador.phone_number}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">WhatsApp Contact</span>
              <span className="text-gray-200">{ambassador.whatsapp_contact}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Account Creation Date</span>
              <span className="text-gray-200">
                {ambassador.user_created_at
                  ? new Date(ambassador.user_created_at).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Referral Statistics Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Referral Statistics</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#121220] border border-white/5 rounded-xl p-5">
              <span className="text-3xl font-extrabold text-white">{stats.total_referrals || 0}</span>
              <span className="text-xs font-medium text-gray-400 block mt-1">Total Referrals</span>
            </div>

            <div className="bg-[#121220] border border-white/5 rounded-xl p-5">
              <span className="text-3xl font-extrabold text-emerald-400">{stats.subscribed_referrals || 0}</span>
              <span className="text-xs font-medium text-gray-400 block mt-1">Subscribed Referrals</span>
            </div>

            <div className="bg-[#121220] border border-white/5 rounded-xl p-5">
              <span className="text-3xl font-extrabold text-blue-400">{stats.monthly_subscriptions || 0}</span>
              <span className="text-xs font-medium text-gray-400 block mt-1">Monthly Subscriptions</span>
            </div>

            <div className="bg-[#121220] border border-white/5 rounded-xl p-5">
              <span className="text-3xl font-extrabold text-purple-400">{stats.yearly_subscriptions || 0}</span>
              <span className="text-xs font-medium text-gray-400 block mt-1">Yearly Subscriptions</span>
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-[#121220] border border-red-900/30 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Referral Earnings Calculation</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-4">
              <span className="text-gray-300">Monthly Subscriptions Earnings:</span>
              <span className="font-mono font-bold text-gray-200">
                {stats.monthly_subscriptions || 0} × 500 XAF = {(stats.monthly_earnings || 0).toLocaleString()} XAF
              </span>
            </div>

            <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-4">
              <span className="text-gray-300">Yearly Subscriptions Earnings:</span>
              <span className="font-mono font-bold text-gray-200">
                {stats.yearly_subscriptions || 0} × 1,000 XAF = {(stats.yearly_earnings || 0).toLocaleString()} XAF
              </span>
            </div>

            <div className="flex justify-between items-center bg-gradient-to-r from-red-950/80 to-red-900/50 border border-red-700/60 rounded-xl p-5">
              <span className="font-bold text-white">Total Referral Earnings:</span>
              <span className="text-2xl font-extrabold text-white">
                {(stats.total_earnings || 0).toLocaleString()} XAF
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
