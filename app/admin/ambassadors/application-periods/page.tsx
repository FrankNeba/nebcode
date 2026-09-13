'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ambassadorService } from '@/services';
import { X } from 'lucide-react';

export default function AdminApplicationPeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear() + 1,
    title: '',
    description: '',
    opens_at: '',
    closes_at: '',
    enabled: true,
  });

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await ambassadorService.getAdminApplicationPeriods();
      setPeriods(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPeriod(null);
    const nextYear = new Date().getFullYear();
    setFormData({
      year: nextYear,
      title: `Nebcode School Ambassador Program ${nextYear}`,
      description: 'Represent Nebcode in your school and mentor fellow CS students.',
      opens_at: `${nextYear}-01-10T00:00`,
      closes_at: `${nextYear}-02-28T23:59`,
      enabled: true,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (period: any) => {
    setEditingPeriod(period);
    // Format ISO string for datetime-local input
    const formatDt = (dtStr: string) => {
      if (!dtStr) return '';
      const d = new Date(dtStr);
      return d.toISOString().slice(0, 16);
    };

    setFormData({
      year: period.year,
      title: period.title || '',
      description: period.description || '',
      opens_at: formatDt(period.opens_at),
      closes_at: formatDt(period.closes_at),
      enabled: period.enabled,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPeriod(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end validation
    if (!formData.opens_at || !formData.closes_at) {
      setError('Both opening and closing dates are required.');
      return;
    }
    if (new Date(formData.closes_at) <= new Date(formData.opens_at)) {
      setError('Closing date must be after the opening date.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        opens_at: new Date(formData.opens_at).toISOString(),
        closes_at: new Date(formData.closes_at).toISOString(),
      };

      if (editingPeriod) {
        await ambassadorService.updateAdminApplicationPeriod(editingPeriod.id, payload);
      } else {
        await ambassadorService.createAdminApplicationPeriod(payload);
      }

      closeModal();
      fetchPeriods();
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp) {
        if (resp.detail) {
          setError(resp.detail);
        } else if (resp.closes_at) {
          setError(Array.isArray(resp.closes_at) ? resp.closes_at[0] : resp.closes_at);
        } else if (resp.enabled) {
          setError(Array.isArray(resp.enabled) ? resp.enabled[0] : resp.enabled);
        } else {
          setError(JSON.stringify(resp));
        }
      } else {
        setError('Failed to save application period.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin/ambassadors" className="text-xs text-red-400 hover:underline">
                ← Ambassadors Overview
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Application Periods Configuration</h1>
            <p className="text-sm text-gray-400">Configure program open/close dates for current and future years</p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-red-950/40 self-start md:self-auto"
          >
            + Create New Period
          </button>
        </div>

        {/* Periods List Grid */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading Application Periods...</div>
        ) : periods.length === 0 ? (
          <div className="bg-[#121220] border border-white/5 rounded-2xl p-12 text-center text-gray-400">
            No application periods created yet. Click "+ Create New Period" to set up your first program year.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {periods.map(period => (
              <div
                key={period.id}
                className="bg-[#121220] border border-red-900/30 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-3xl font-extrabold text-white">{period.year}</span>
                      {period.title && (
                        <h3 className="text-sm font-semibold text-gray-300 mt-1">{period.title}</h3>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          period.is_open
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {period.is_open ? 'OPEN' : 'CLOSED'}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {period.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {period.description && (
                    <p className="text-xs text-gray-400 leading-relaxed">{period.description}</p>
                  )}

                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Opens:</span>
                      <span className="font-semibold text-gray-200">
                        {new Date(period.opens_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Closes:</span>
                      <span className="font-semibold text-gray-200">
                        {new Date(period.closes_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-2">
                      <span className="text-gray-400">Total Applications:</span>
                      <span className="font-bold text-red-400">{period.application_count || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => openEditModal(period)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-xs font-semibold transition"
                  >
                    Edit Period
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121220] border border-red-900/40 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingPeriod ? `Edit Period (${editingPeriod.year})` : 'Create Application Period'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {error && (
              <div className="p-3 bg-red-950 border border-red-700/60 rounded-xl text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Program Year
                </label>
                <input
                  type="number"
                  required
                  disabled={!!editingPeriod}
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-red-600 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nebcode School Ambassador Program 2027"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description for students..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-600 resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Opens At
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.opens_at}
                    onChange={e => setFormData({ ...formData, opens_at: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Closes At
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.closes_at}
                    onChange={e => setFormData({ ...formData, closes_at: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 text-red-600 focus:ring-red-600 bg-black"
                />
                <label htmlFor="enabled" className="text-xs font-semibold text-gray-200">
                  Enabled (Allow submissions during open date window)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                >
                  {saving ? 'Saving...' : 'Save Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
