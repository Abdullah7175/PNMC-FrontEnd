'use client';

import { useEffect, useState } from 'react';
import PermissionGate from '@/components/PermissionGate';
import { adminApi } from '@/lib/api';
import clsx from 'clsx';

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  source: string;
  description: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [sourceFilter, setSourceFilter] = useState('');

  const load = () => {
    const params: Record<string, string> = { limit: '200' };
    if (sourceFilter) params.source = sourceFilter;
    adminApi.auditLogs(params).then(({ data }) => setLogs(data));
  };

  useEffect(() => {
    load();
  }, [sourceFilter]);

  return (
    <PermissionGate permission="audit-logs.view">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-pnmc-blue mb-1">
              Audit Logs
            </h1>
            <p className="text-muted">
              Every portal and mobile app action is recorded here
            </p>
          </div>
          <select
            className="input w-auto"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">All sources</option>
            <option value="portal">Portal</option>
            <option value="mobile">Mobile</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted"
                  >
                    No audit logs yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border align-top">
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'badge',
                          log.source === 'mobile'
                            ? 'badge-submitted'
                            : log.source === 'portal'
                              ? 'badge-approved'
                              : 'badge-draft',
                        )}
                      >
                        {log.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {log.actorName || '—'}
                      </p>
                      <p className="text-xs text-muted">
                        {log.actorEmail || ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-muted">
                        {log.entityType}
                        {log.entityId
                          ? ` · ${log.entityId.slice(0, 8)}…`
                          : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted max-w-md">
                      {log.description || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGate>
  );
}
