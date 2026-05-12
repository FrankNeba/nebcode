'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ old_password: '', new_password: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { const { data } = await authService.updateProfile({ full_name: name }); setUser(data); toast.success('Saved!'); }
    catch { toast.error('Update failed.'); }
    finally { setSaving(false); }
  };

  const handlePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwLoading(true);
    try { await authService.changePassword(pw); toast.success('Password changed!'); setPw({ old_password: '', new_password: '' }); }
    catch (err: any) { toast.error(err?.response?.data?.detail || 'Failed.'); }
    finally { setPwLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-bold text-2xl text-white mb-8">Profile</h1>
      <div className="card p-5 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-neb-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
          {(user?.full_name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{user?.full_name || 'No name'}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="mt-1">{user?.is_verified ? <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge> : <Badge variant="warning">Unverified</Badge>}</div>
        </div>
      </div>
      <div className="card p-5 mb-4 flex flex-col gap-4">
        <h2 className="font-semibold text-white text-sm">Edit Info</h2>
        <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Email" value={user?.email || ''} disabled helperText="Cannot change email" />
        <Button onClick={handleSave} isLoading={saving} className="self-start" size="sm">Save</Button>
      </div>
      <div className="card p-5">
        <h2 className="font-semibold text-white text-sm mb-4">Change Password</h2>
        <form onSubmit={handlePw} className="flex flex-col gap-3">
          <Input label="Current password" type="password" value={pw.old_password} onChange={e => setPw(p => ({ ...p, old_password: e.target.value }))} required />
          <Input label="New password" type="password" value={pw.new_password} onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))} required />
          <Button type="submit" isLoading={pwLoading} variant="secondary" size="sm" className="self-start">Update</Button>
        </form>
      </div>
    </div>
  );
}
