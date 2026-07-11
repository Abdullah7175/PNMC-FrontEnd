'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PermissionGate from '@/components/PermissionGate';
import { supervisorApi } from '@/lib/api';
import clsx from 'clsx';

interface Inspection {
  id: string;
  inspectionCode: string;
  instituteName: string;
  district: string;
  province: string;
  status: string;
  submittedAt: string | null;
  progress: { okCount: number; rejectCount: number; percent: number };
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    submitted: 'badge-submitted',
    under_review: 'badge-submitted',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    changes_requested: 'badge-changes',
    draft: 'badge-draft',
    in_progress: 'badge-draft',
    resubmitted: 'badge-submitted',
  };
  return map[status] ?? 'badge-draft';
}

function InspectionsContent() {
  const searchParams = useSearchParams();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    supervisorApi.inspections(params).then(({ data }) => setInspections(data));
  }, [statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-pnmc-blue">Inspections</h1>
          <p className="text-muted">Review submitted field inspection reports</p>
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="changes_requested">Changes Requested</option>
          <option value="resubmitted">Resubmitted</option>
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Code</th>
              <th className="text-left px-6 py-3 font-medium">Institute</th>
              <th className="text-left px-6 py-3 font-medium">Location</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Progress</th>
              <th className="text-left px-6 py-3 font-medium">Submitted</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {inspections.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted">
                  No inspections found
                </td>
              </tr>
            ) : (
              inspections.map((insp) => (
                <tr key={insp.id} className="border-b border-border hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">{insp.inspectionCode}</td>
                  <td className="px-6 py-4 font-medium">{insp.instituteName}</td>
                  <td className="px-6 py-4 text-muted">
                    {[insp.district, insp.province].filter(Boolean).join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('badge', statusBadge(insp.status))}>
                      {insp.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-600">{insp.progress.okCount} OK</span>
                    {' / '}
                    <span className="text-red-600">{insp.progress.rejectCount} N/A</span>
                    <span className="text-muted ml-2">({insp.progress.percent}%)</span>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {insp.submittedAt
                      ? new Date(insp.submittedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/inspections/${insp.id}`}
                      className="text-pnmc-green font-medium hover:underline"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InspectionsPage() {
  return (
    <PermissionGate permission="inspections.view">
      <Suspense fallback={<div className="animate-pulse text-muted">Loading...</div>}>
        <InspectionsContent />
      </Suspense>
    </PermissionGate>
  );
}
