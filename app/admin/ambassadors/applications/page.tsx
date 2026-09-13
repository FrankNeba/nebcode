'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ambassadorService } from '@/services';
import { CheckCircle, XCircle, X, Calendar, Video, Send, ExternalLink } from 'lucide-react';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [modalType, setModalType] = useState<'view' | 'approve' | 'reject' | 'schedule' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Schedule Interview state
  const [scheduleMeetLink, setScheduleMeetLink] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, yearFilter, searchQuery]);

  const fetchPeriods = async () => {
    try {
      const res = await ambassadorService.getAdminApplicationPeriods();
      setPeriods(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await ambassadorService.getAdminApplications({
        status: statusFilter || undefined,
        year: yearFilter || undefined,
        search: searchQuery || undefined,
      });
      setApplications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await ambassadorService.approveAdminApplication(selectedApp.id);
      closeModal();
      fetchApplications();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to approve application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await ambassadorService.rejectAdminApplication(selectedApp.id);
      closeModal();
      fetchApplications();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to reject application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (!scheduleMeetLink.trim()) {
      setActionError('Google Meet link is required.');
      return;
    }
    if (!scheduleTime.trim()) {
      setActionError('Interview date & time is required.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await ambassadorService.scheduleInterviewAdminApplication(selectedApp.id, {
        meet_link: scheduleMeetLink.trim(),
        interview_time: scheduleTime.trim(),
        notes: scheduleNotes.trim() || undefined,
      });
      toast.success(`Interview invitation sent to ${selectedApp.full_name}!`);
      closeModal();
      fetchApplications();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to schedule interview.');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (app: any, type: 'view' | 'approve' | 'reject' | 'schedule') => {
    setSelectedApp(app);
    setModalType(type);
    setActionError(null);
    if (type === 'schedule') {
      setScheduleMeetLink(app.interview_meet_link || '');
      setScheduleTime('');
      setScheduleNotes(app.interview_notes || '');
    }
  };

  const closeModal = () => {
    setSelectedApp(null);
    setModalType(null);
    setActionError(null);
    setScheduleMeetLink('');
    setScheduleTime('');
    setScheduleNotes('');
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
            <h1 className="text-3xl font-extrabold text-white">Ambassador Applications</h1>
            <p className="text-sm text-gray-400">Review and manage student ambassador applications</p>
          </div>

          <Link
            href="/admin/ambassadors/application-periods"
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-sm font-semibold border border-white/10 transition self-start md:self-auto"
          >
            Manage Application Periods
          </Link>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-[#121220] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          {/* Status Tabs */}
          <div className="flex items-center bg-black/40 p-1 border border-white/10 rounded-xl w-full md:w-auto">
            {[
              { id: '', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-red-700 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Year Select */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="w-full sm:w-auto bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
            >
              <option value="">All Application Years</option>
              {periods.map(p => (
                <option key={p.id} value={p.year}>
                  {p.year} Program
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search name, email, school..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-[#121220] border border-red-900/30 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading Applications...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No applications match your filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-black/40 text-xs text-gray-400 border-b border-white/10 uppercase tracking-wider">
                    <th className="py-4 px-6 font-semibold">Applicant</th>
                    <th className="py-4 px-4 font-semibold">Year</th>
                    <th className="py-4 px-4 font-semibold">School</th>
                    <th className="py-4 px-4 font-semibold">Level</th>
                    <th className="py-4 px-4 font-semibold">Phone / WhatsApp</th>
                    <th className="py-4 px-4 font-semibold">Status</th>
                    <th className="py-4 px-4 font-semibold">Applied</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{app.full_name}</div>
                        <div className="text-xs font-mono text-gray-400">{app.email}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-red-400">{app.application_year}</td>
                      <td className="py-4 px-4 text-gray-300">{app.school}</td>
                      <td className="py-4 px-4 text-gray-300">{app.current_level}</td>
                      <td className="py-4 px-4 text-xs text-gray-400">
                        <div>Ph: {app.phone_number}</div>
                        <div>WA: {app.whatsapp_contact}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                            app.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : app.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(app, 'view')}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium rounded-lg transition"
                          >
                            View
                          </button>
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openModal(app, 'schedule')}
                                className="px-2.5 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                {app.interview_meet_link ? 'Reschedule' : 'Schedule Interview'}
                              </button>
                              <button
                                onClick={() => openModal(app, 'approve')}
                                className="px-2.5 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 text-xs font-medium rounded-lg transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openModal(app, 'reject')}
                                className="px-2.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/40 text-xs font-medium rounded-lg transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Application Modal */}
      {modalType === 'view' && selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121220] border border-red-900/40 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Ambassador Application</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block">Application Year</span>
                  <span className="font-bold text-red-400">{selectedApp.application_year}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Status</span>
                  <span className="font-bold uppercase text-amber-400">{selectedApp.status}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-400 block">Applicant Full Name</span>
                <span className="font-bold text-white text-base">{selectedApp.full_name}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block">Nebcode Account Email</span>
                <span className="font-mono text-gray-200">{selectedApp.email}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block">Phone Number</span>
                  <span className="text-gray-200">{selectedApp.phone_number}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">WhatsApp Contact</span>
                  <span className="text-gray-200">{selectedApp.whatsapp_contact}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block">School</span>
                  <span className="text-gray-200">{selectedApp.school}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Current Level</span>
                  <span className="text-gray-200">{selectedApp.current_level}</span>
                </div>
              </div>

              {selectedApp.interview_meet_link && (
                <div className="p-3 bg-blue-950/40 border border-blue-700/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                    <Video className="h-4 w-4" /> Interview Scheduled
                  </div>
                  <div className="text-xs text-gray-300">
                    <span className="text-gray-400">Date/Time:</span> {selectedApp.interview_scheduled_at ? new Date(selectedApp.interview_scheduled_at).toLocaleString() : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-300">
                    <span className="text-gray-400">Meet Link:</span>{' '}
                    <a href={selectedApp.interview_meet_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">
                      {selectedApp.interview_meet_link} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs text-gray-400 block mb-1">Reason for Applying</span>
                <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedApp.reason}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={closeModal} className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-semibold">
                Close
              </button>
              {selectedApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => setModalType('schedule')}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Calendar className="h-4 w-4" />
                    {selectedApp.interview_meet_link ? 'Reschedule Interview' : 'Schedule Interview'}
                  </button>
                  <button
                    onClick={() => setModalType('approve')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => setModalType('reject')}
                    className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Reject Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {modalType === 'schedule' && selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121220] border border-blue-600/40 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3 text-blue-400">
                <Video className="h-6 w-6" />
                <h2 className="text-lg font-bold text-white">Schedule Online Interview</h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-950 border border-red-700 rounded-lg text-red-200 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-gray-300 text-sm">
              Schedule a Google Meet interview for <strong>{selectedApp.full_name}</strong>. An email invite and in-app notification will be sent automatically.
            </p>

            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Google Meet Link <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={scheduleMeetLink}
                  onChange={(e) => setScheduleMeetLink(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Date & Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Notes / Preparation Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Please join 5 mins early and bring your student ID..."
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  {actionLoading ? 'Sending Invite...' : (
                    <>
                      <Send className="h-4 w-4" /> Send Interview Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {modalType === 'approve' && selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121220] border border-emerald-600/40 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle className="h-6 w-6" />
              <h2 className="text-lg font-bold text-white">Approve Ambassador Application?</h2>
            </div>

            {actionError && (
              <div className="p-3 bg-red-950 border border-red-700 rounded-lg text-red-200 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-gray-300 text-sm leading-relaxed">
              Approve <strong>{selectedApp.full_name}</strong> as an official Nebcode School Ambassador?
            </p>
            <p className="text-xs text-gray-400 bg-black/40 border border-white/5 rounded-xl p-3">
              Approving this application will create an Ambassador profile and grant the user one year of free Nebcode access. An approval email will be sent automatically.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {modalType === 'reject' && selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121220] border border-red-800/40 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <XCircle className="h-6 w-6" />
              <h2 className="text-lg font-bold text-white">Reject Ambassador Application?</h2>
            </div>

            {actionError && (
              <div className="p-3 bg-red-950 border border-red-700 rounded-lg text-red-200 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-gray-300 text-sm leading-relaxed">
              Are you sure you want to reject <strong>{selectedApp.full_name}</strong>’s application?
            </p>
            <p className="text-xs text-gray-400 bg-black/40 border border-white/5 rounded-xl p-3">
              This will update the application status to rejected. The student will be notified by email and will be able to apply again during future program periods.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
