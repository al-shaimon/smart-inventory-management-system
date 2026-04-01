'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signup } from '@/app/actions/auth';

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="glass-card p-8 animate-scale-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-accent mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
          Get started with your inventory management
        </p>
      </div>

      {/* Error message */}
      {state?.message && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="name" className="input-label">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            className="input-field"
            required
          />
          {state?.errors?.name && (
            <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="input-label">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="input-field"
            required
          />
          {state?.errors?.email && (
            <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="input-label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="input-field"
            required
          />
          {state?.errors?.password && (
            <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{state.errors.password[0]}</p>
          )}
        </div>

        <button type="submit" disabled={pending} className="btn btn-primary w-full btn-lg">
          {pending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </span>
          ) : 'Create account'}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-fg)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium" style={{ color: 'var(--accent-hover)' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
