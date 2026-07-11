'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
          <h1 className="text-3xl font-bold text-pnmc-blue mb-3">
            PNMC
          </h1>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pnmc.gov.pk"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
