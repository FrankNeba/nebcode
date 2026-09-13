'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ambassadorService, authService } from '@/services';
import { GraduationCap } from 'lucide-react';

export default function AmbassadorApplyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [period, setPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    whatsapp_contact: '',
    school: '',
    current_level: 'Upper Sixth',
    reason: '',
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      // Fetch open period
      const periodRes = await ambassadorService.getCurrentApplicationPeriod();
      setPeriod(periodRes.data);

      // Check auth profile
      try {
        const profileRes = await authService.getProfile();
        setUser(profileRes.data);

        // Check if user already applied or is ambassador
        try {
          const ambRes = await ambassadorService.getMyAmbassadorProfile();
          if (ambRes.data) {
            router.push('/ambassador');
            return;
          }
        } catch (e) {
          try {
            const appRes = await ambassadorService.getMyApplication();
            if (appRes.data && appRes.data.status === 'pending') {
              router.push('/ambassador');
              return;
            }
          } catch (err) {}
        }
      } catch (authErr) {
        // Unauthenticated -> display login requirement message on page instead of auto-redirecting
        setUser(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client validation
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required.';
    if (!formData.phone_number.trim()) errors.phone_number = 'Phone number is required.';
    if (!formData.whatsapp_contact.trim()) errors.whatsapp_contact = 'WhatsApp contact is required.';
    if (!formData.school.trim()) errors.school = 'School name is required.';
    if (!formData.current_level.trim()) errors.current_level = 'Current level is required.';
    if (!formData.reason.trim()) errors.reason = 'Please state your reason for applying.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await ambassadorService.submitApplication({
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        whatsapp_contact: formData.whatsapp_contact.trim(),
        school: formData.school.trim(),
        current_level: formData.current_level,
        reason: formData.reason.trim(),
      });
      router.push('/ambassador');
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp) {
        if (resp.detail) {
          setError(resp.detail);
        } else {
          const formatted: Record<string, string> = {};
          Object.keys(resp).forEach(k => {
            formatted[k] = Array.isArray(resp[k]) ? resp[k][0] : resp[k];
          });
          setFieldErrors(formatted);
        }
      } else {
        setError('Failed to submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading Application Form...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-[#121220] border border-red-900/30 rounded-2xl p-8 text-center shadow-2xl shadow-red-950/20">
          <div className="w-16 h-16 bg-red-950/60 border border-red-800/40 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-white">Log in to Apply</h1>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            You need to be logged in with a Nebcode account before you can submit an Ambassador application.
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

  if (!period || !period.is_open) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121220] border border-red-900/30 rounded-2xl p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-2">Applications Closed</h1>
          <p className="text-gray-400 text-sm mb-6">
            Applications for the Nebcode School Ambassador program are currently closed.
          </p>
          <Link
            href="/ambassador"
            className="inline-block py-2.5 px-6 bg-red-800 hover:bg-red-700 text-white font-medium rounded-xl transition"
          >
            Back to Ambassador Info
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950 border border-red-800/40 rounded-full text-xs font-semibold text-red-400">
            <span>Nebcode School Ambassador Program</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Ambassador Application Form</h1>
          <p className="text-gray-400 text-sm">
            Fill out the form below to apply for the official Nebcode School Ambassador title for your school.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-[#121220] border border-red-900/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Application Year */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Application Year
            </label>
            <input
              type="text"
              readOnly
              value={period.year || ''}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-red-400 font-bold focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Nebcode Account Email (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Nebcode Account Email
            </label>
            <input
              type="text"
              readOnly
              value={user?.email || ''}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-300 focus:outline-none cursor-not-allowed font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              This email will be used to link your ambassador application to your Nebcode account.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={handleChange}
              className={`w-full bg-black/60 border ${
                fieldErrors.full_name ? 'border-red-500' : 'border-white/15'
              } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition`}
            />
            {fieldErrors.full_name && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.full_name}</p>
            )}
          </div>

          {/* Phone Number & WhatsApp Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone_number"
                placeholder="e.g. 677123456"
                value={formData.phone_number}
                onChange={handleChange}
                className={`w-full bg-black/60 border ${
                  fieldErrors.phone_number ? 'border-red-500' : 'border-white/15'
                } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition`}
              />
              {fieldErrors.phone_number && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                WhatsApp Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="whatsapp_contact"
                placeholder="e.g. 677123456"
                value={formData.whatsapp_contact}
                onChange={handleChange}
                className={`w-full bg-black/60 border ${
                  fieldErrors.whatsapp_contact ? 'border-red-500' : 'border-white/15'
                } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition`}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Provide the WhatsApp number where we can reach you.
              </p>
              {fieldErrors.whatsapp_contact && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.whatsapp_contact}</p>
              )}
            </div>
          </div>

          {/* School Name & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="school"
                placeholder="e.g. PSS Mankon"
                value={formData.school}
                onChange={handleChange}
                className={`w-full bg-black/60 border ${
                  fieldErrors.school ? 'border-red-500' : 'border-white/15'
                } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition`}
              />
              {fieldErrors.school && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.school}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Current Class / Level <span className="text-red-500">*</span>
              </label>
              <select
                name="current_level"
                value={formData.current_level}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 transition"
              >
                <option value="Lower Sixth">Lower Sixth</option>
                <option value="Upper Sixth">Upper Sixth</option>
                <option value="A Level">A Level</option>
                <option value="Other">Other</option>
              </select>
              {fieldErrors.current_level && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.current_level}</p>
              )}
            </div>
          </div>

          {/* Reason for Applying */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Why do you want to become a Nebcode School Ambassador? <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              rows={4}
              placeholder="Tell us why you want to represent Nebcode in your school..."
              value={formData.reason}
              onChange={handleChange}
              className={`w-full bg-black/60 border ${
                fieldErrors.reason ? 'border-red-500' : 'border-white/15'
              } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition resize-none`}
            />
            {fieldErrors.reason && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.reason}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-bold text-base shadow-xl shadow-red-950/40 transition duration-200"
          >
            {submitting ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
