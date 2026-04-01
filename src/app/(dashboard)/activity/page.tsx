'use client';

import { useState, useEffect, useCallback } from 'react';

interface Activity {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/activity');
      if (res.ok) setActivities(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const entityIcon = (type: string) => {
    switch (type) {
      case 'Order':
        return (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
        );
      case 'Product':
        return (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
        );
      case 'Restock':
        return (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
        );
      case 'Category':
        return (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>Recent system actions and changes</p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl animate-pulse" style={{ background: 'var(--surface-hover)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--surface-hover)' }} />
                  <div className="h-3 w-1/4 rounded animate-pulse" style={{ background: 'var(--surface-hover)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium mb-1">No activity yet</p>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>Actions will appear here as you use the system.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {activities.map((activity, index) => (
              <div
                key={activity._id}
                className="flex items-start gap-4 p-4 transition-colors hover:bg-[var(--surface-hover)]"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {entityIcon(activity.entityType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{activity.action}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      {new Date(activity.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--surface-hover)',
                        color: 'var(--muted-fg)',
                      }}
                    >
                      {activity.entityType}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
