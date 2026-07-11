'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/api';

export default function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && user && !hasPermission(user, permission)) {
      router.replace('/dashboard');
    }
  }, [user, loading, permission, router]);

  if (loading || !user || !hasPermission(user, permission)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
