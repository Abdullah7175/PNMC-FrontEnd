'use client';

import { useEffect, useState } from 'react';
import PermissionGate from '@/components/PermissionGate';
import { supervisorApi } from '@/lib/api';
import { ClipboardList, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  total: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  changesRequested: number;
  resubmitted: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    supervisorApi.stats().then(({ data }) => setStats(data));
  }, []);

  const cards = [
    { label: 'Submitted', value: stats?.submitted ?? 0, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Under Review', value: stats?.underReview ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Changes Requested', value: stats?.changesRequested ?? 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <PermissionGate permission="dashboard.view">
      <div>
        <h1 className="text-2xl font-bold text-pnmc-blue mb-1">Dashboard</h1>
        <p className="text-muted mb-8">Inspection overview and queue status</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="card flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={card.color} size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/inspections?status=submitted" className="btn-primary">
              Review Submitted Reports
            </Link>
            <Link href="/inspections" className="btn-outline">
              View All Inspections
            </Link>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
