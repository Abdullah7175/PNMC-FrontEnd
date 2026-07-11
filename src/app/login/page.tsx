'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

/** Letters, digits, and only @ / . — e.g. admin@admin.com */
const EMAIL_REGEX =
  /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      next.email = 'Email is required';
    } else if (trimmed.length > 255) {
      next.email = 'Email is too long';
    } else if (!EMAIL_REGEX.test(trimmed)) {
      next.email =
        'Enter a valid email using only letters, numbers, @ and . (e.g. admin@admin.com)';
    }

    if (!password) {
      next.password = 'Password is required';
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    } else if (password.length > 128) {
      next.password = 'Password is too long';
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Invalid email or password',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f6f9]">
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-12 border-r border-border">
        <div className="max-w-md text-center">
          <Image
            src="/pnmc-logo.png"
            alt="Pakistan Nursing & Midwifery Council"
            width={220}
            height={220}
            className="mx-auto mb-8"
            priority
          />
          <h1 className="text-3xl font-bold text-pnmc-blue mb-3">PNMC</h1>
          <p className="text-muted text-base leading-relaxed">
            Pakistan Nursing & Midwifery Council — review and manage field
            inspection reports submitted by inspectors.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Image
              src="/pnmc-logo.png"
              alt="PNMC"
              width={120}
              height={120}
              className="mb-4"
              priority
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-pnmc-blue">Sign in</h2>
            <p className="text-muted mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                className={`input ${fieldErrors.email ? 'border-red-400' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email)
                    setFieldErrors((f) => ({ ...f, email: undefined }));
                }}
                placeholder="admin@pnmc.gov.pk"
                maxLength={255}
                required
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className={`input ${fieldErrors.password ? 'border-red-400' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors((f) => ({ ...f, password: undefined }));
                }}
                maxLength={128}
                required
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <p className="text-red-600 text-xs mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
