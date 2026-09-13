'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ambassadorService } from '@/services';

export default function AdminAmbassadorsOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await ambassadorService.getAdminAmbassadors();
      setData(res.data);
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
          <p className="text-gray-400">Loading Ambassadors Overview...</p>
        </div>
      </div>
    );
  }

  const schools = data?.schools || [];
  const totalAmbassadors = data?.total_ambassadors || 0;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950 border border-red-800/40 rounded-full text-xs font-semibold text-red-400 mb-2">
              <span>Admin Dashboard</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Ambassador Management</h1>
            <p className="text-sm text-gray-400">Overview of Nebcode School Ambassadors grouped by school</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/ambassadors/applications"
              className="px-4 py-2.5 bg-red-900/60 hover:bg-red-800 text-white rounded-xl text-sm font-semibold border border-red-700/50 transition shadow-lg shadow-red-950/30"
            >
              Manage Applications
            </Link>
            <Link
              href="/admin/ambassadors/application-periods"
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-sm font-semibold border border-white/10 transition"
            >
              Configure Periods
            </Link>
          </div>
        </div>

        {/* Total Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121220] border border-white/5 rounded-2xl p-6">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Ambassadors</span>
            <p className="text-4xl font-extrabold text-white mt-2">{totalAmbassadors}</p>
          </div>
          <div className="bg-[#121220] border border-white/5 rounded-2xl p-6">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Participating Schools</span>
            <p className="text-4xl font-extrabold text-red-400 mt-2">{schools.length}</p>
          </div>
          <div className="bg-[#121220] border border-white/5 rounded-2xl p-6">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Referrals Generated</span>
            <p className="text-4xl font-extrabold text-emerald-400 mt-2">
              {schools.reduce((acc: number, s: any) => acc + (s.total_referrals || 0), 0)}
            </p>
          </div>
        </div>

        {/* Grouped by School */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-200">Ambassadors by School</h2>

          {schools.length === 0 ? (
            <div className="bg-[#121220] border border-white/5 rounded-2xl p-12 text-center text-gray-400">
              No approved ambassadors found yet.
            </div>
          ) : (
            schools.map((schoolObj: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#121220] border border-red-900/30 rounded-2xl p-6 space-y-4 shadow-xl"
              >
                {/* School Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{schoolObj.school}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {schoolObj.ambassador_count} ambassador{schoolObj.ambassador_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs block">Total Referrals</span>
                      <span className="font-bold text-white text-base">{schoolObj.total_referrals}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Subscribed Referrals</span>
                      <span className="font-bold text-emerald-400 text-base">{schoolObj.subscribed_referrals}</span>
                    </div>
                  </div>
                </div>

                {/* Table of Ambassadors in this school */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-white/5">
                        <th className="pb-3 font-semibold">Ambassador</th>
                        <th className="pb-3 font-semibold">Email / Contact</th>
                        <th className="pb-3 font-semibold">Referrals</th>
                        <th className="pb-3 font-semibold">Subscribed</th>
                        <th className="pb-3 font-semibold">Total Earnings</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {schoolObj.ambassadors.map((amb: any) => (
                        <tr key={amb.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 font-semibold text-white">{amb.full_name}</td>
                          <td className="py-3 text-gray-300">
                            <span className="block font-mono text-xs text-gray-400">{amb.email}</span>
                            <span className="text-xs text-gray-500">WA: {amb.whatsapp_contact}</span>
                          </td>
                          <td className="py-3 font-bold text-white">{amb.total_referrals}</td>
                          <td className="py-3 font-bold text-emerald-400">{amb.subscribed_referrals}</td>
                          <td className="py-3 font-bold text-red-400">
                            {(amb.total_earnings || 0).toLocaleString()} XAF
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={`/admin/ambassadors/${amb.id}`}
                              className="text-xs bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/40 px-3 py-1.5 rounded-lg transition inline-block font-medium"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
