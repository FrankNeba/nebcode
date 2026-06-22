'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ old_password: '', new_password: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // Referral states
  const [copied, setCopied] = useState(false);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoName, setMomoName] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await authService.updateProfile({ full_name: name });
      setUser(data);
      toast.success('Saved!');
    } catch {
      toast.error('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handlePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwLoading(true);
    try {
      await authService.changePassword(pw);
      toast.success('Password changed!');
      setPw({ old_password: '', new_password: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleCopy = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momoNumber.trim() || !momoName.trim()) {
      toast.error('Both Mobile Money details are required.');
      return;
    }
    setWithdrawing(true);
    try {
      const { data } = await authService.withdrawReferral(momoNumber, momoName);
      toast.success(data.detail || 'Withdrawal request submitted successfully!');
      setUser(data.user); // updates local balance to 0
      setShowWithdrawModal(false);
      setMomoNumber('');
      setMomoName('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Withdrawal failed.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-bold text-2xl text-white mb-8">Profile</h1>
      
      {/* Profile Header Card */}
      <div className="card p-5 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-neb-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
          {(user?.full_name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{user?.full_name || 'No name'}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="mt-1">
            {user?.is_verified ? (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3 mr-1" />Verified
              </Badge>
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="card p-5 mb-4 flex flex-col gap-4 border border-neb-600/20 bg-dark-900/40">
        <h2 className="font-bold text-white text-lg flex items-center gap-2">
          <span>Refer & Earn</span>
          <Badge variant="secondary" className="text-xs">1,000 FRS / Friend</Badge>
        </h2>
        <p className="text-sm text-gray-400">
          Share your referral code. You earn <strong>1,000 FRS</strong> for every referral who signs up and subscribes.
        </p>

        {/* Referral code displaying */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Your Referral Code"
              value={user?.referral_code || ''}
              disabled
              className="bg-dark-950 border-dark-800 text-white font-mono text-center font-bold tracking-wider"
            />
          </div>
          <Button onClick={handleCopy} variant="secondary" className="h-[42px] shrink-0">
            {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-400" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        {/* Balance & Withdraw action */}
        <div className="mt-2 p-4 rounded-lg bg-dark-950/60 border border-dark-850 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Referral Balance</p>
            <p className="text-2xl font-extrabold text-neb-400 mt-1">{user?.referral_balance || 0} FRS</p>
          </div>
          <Button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!user?.referral_balance || user.referral_balance <= 0}
            size="sm"
            className="shadow-neb"
          >
            Withdraw All
          </Button>
        </div>
      </div>

      {/* Edit Info Card */}
      <div className="card p-5 mb-4 flex flex-col gap-4">
        <h2 className="font-semibold text-white text-sm">Edit Info</h2>
        <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Email" value={user?.email || ''} disabled helperText="Cannot change email" />
        <Button onClick={handleSave} isLoading={saving} className="self-start" size="sm">Save</Button>
      </div>

      {/* Change Password Card */}
      <div className="card p-5">
        <h2 className="font-semibold text-white text-sm mb-4">Change Password</h2>
        <form onSubmit={handlePw} className="flex flex-col gap-3">
          <Input label="Current password" type="password" value={pw.old_password} onChange={e => setPw(p => ({ ...p, old_password: e.target.value }))} required />
          <Input label="New password" type="password" value={pw.new_password} onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))} required />
          <Button type="submit" isLoading={pwLoading} variant="secondary" size="sm" className="self-start">Update</Button>
        </form>
      </div>

      {/* Withdrawal Form Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="card p-6 max-w-md w-full shadow-2xl border border-neb-600/30 bg-dark-900 text-left animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Request Withdrawal</h3>
            <p className="text-gray-400 text-xs mb-4">
              Enter your Mobile Money details to receive your total referral earnings of <strong className="text-neb-400">{user?.referral_balance} FRS</strong>.
            </p>
            <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
              <Input
                label="Mobile Money Number"
                placeholder="e.g. 67XXXXXXX or 68XXXXXXX"
                value={momoNumber}
                onChange={e => setMomoNumber(e.target.value)}
                required
              />
              <Input
                label="Mobile Money Name"
                placeholder="Name registered on the MOMO account"
                value={momoName}
                onChange={e => setMomoName(e.target.value)}
                required
              />
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1"
                  disabled={withdrawing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={withdrawing}
                  className="flex-1 shadow-neb"
                >
                  Withdraw
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
