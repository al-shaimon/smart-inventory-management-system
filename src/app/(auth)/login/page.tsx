'use client';

import { useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Focus email field on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleDemoLogin = () => {
    if (emailRef.current) emailRef.current.value = 'demo@inventory.com';
    if (passwordRef.current) passwordRef.current.value = 'Demo@1234';
  };

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
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
          Sign in to your inventory management account
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
          <label htmlFor="email" className="input-label">Email address</label>
          <input
            ref={emailRef}
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
            ref={passwordRef}
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
              Signing in...
            </span>
          ) : 'Sign in'}
        </button>
      </form>

      {/* Demo Login */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleDemoLogin}
          className="btn btn-secondary w-full"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Fill Demo Credentials
        </button>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-fg)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium" style={{ color: 'var(--accent-hover)' }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
