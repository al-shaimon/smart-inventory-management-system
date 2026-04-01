'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const InviteSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).trim().lowercase(),
});

type InviteFormValues = z.infer<typeof InviteSchema>;

interface Manager {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface PendingInvite {
  _id: string;
  email: string;
  createdAt: string;
}

export default function TeamPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(InviteSchema),
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/invites');
      if (res.ok) {
        const data = await res.json();
        setManagers(data.managers);
        setInvites(data.invites);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onInvite = async (data: InviteFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Invitation sent successfully');
        reset();
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Invite error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      const res = await fetch(`/api/invites/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Invitation revoked');
        fetchData();
      } else {
        toast.error('Failed to revoke invitation');
      }
    } catch (error) {
      console.error('Revoke error:', error);
      toast.error('An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-[var(--muted-fg)] mt-1">Manage your store&apos;s managers and invitations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Invite Manager
            </h2>
            <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
              <div>
                <label className="input-label">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="manager@example.com"
                  className="input-field"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
            <p className="mt-4 text-xs text-[var(--muted-fg)] leading-relaxed">
              Invited users will join your store as managers once they sign up with this email.
            </p>
          </div>
        </div>

        {/* Team Lists */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Managers */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-semibold">Active Managers</h2>
            </div>
            {managers.length > 0 ? (
              <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-[var(--border)]">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {managers.map((m) => (
                    <tr key={m._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">{m.name}</td>
                      <td className="px-6 py-4 text-[var(--muted-fg)]">{m.email}</td>
                      <td className="px-6 py-4 text-sm text-[var(--muted-fg)]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--muted-fg)]">
                No managers added yet.
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-semibold">Pending Invitations</h2>
            </div>
            {invites.length > 0 ? (
              <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-[var(--border)]">
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Sent On</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {invites.map((i) => (
                    <tr key={i._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">{i.email}</td>
                      <td className="px-6 py-4 text-sm text-[var(--muted-fg)]">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onRevoke(i._id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Revoke invitation"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--muted-fg)]">
                No pending invitations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
