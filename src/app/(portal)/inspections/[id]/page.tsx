'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PermissionGate from '@/components/PermissionGate';
import { supervisorApi, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface Requirement {
  id: string;
  number: number;
  flag: string;
  category: string;
  title: string;
  provision: string;
  regulationRef: string | null;
  hasFeeDetails?: boolean;
  status: string;
  comments: { author: string; text: string; timestamp: string }[];
  attachments: { id: string; fileName: string; url: string; mimeType?: string }[];
}

interface FeeDetails {
  lineItems: {
    code: string;
    label: string;
    amount: number | null;
    remainingFee: number | null;
    selected?: boolean;
  }[];
  totalPayable: string | null;
  paidAmount: string | null;
  challanReference: string | null;
  bankAccount: string | null;
  notes: string | null;
}

interface InspectionDetail {
  id: string;
  inspectionCode: string;
  instituteName: string;
  district: string;
  province: string;
  type: string;
  appliedFor: string;
  inspectionDate: string;
  principalName: string;
  principalRegNo: string;
  principalQualification: string;
  inspectorName: string | null;
  finalRemarks: string;
  status: string;
  signatureUrl: string | null;
  supervisorRemarks: string | null;
  feeDetails: FeeDetails | null;
  progress: { okCount: number; rejectCount: number; percent: number };
  requirements: Requirement[];
}

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    supervisorApi.inspection(id).then(({ data }) => setInspection(data));
  };

  useEffect(() => {
    load();
  }, [id]);

  const categories = inspection
    ? [...new Set(inspection.requirements.map((r) => r.category))]
    : [];

  const handleReview = async (action: string) => {
    setSubmitting(true);
    setMessage('');
    try {
      await supervisorApi.review(id, action, remarks);
      setMessage(
        action === 'request_changes'
          ? 'Sent back for changes'
          : `Report ${action}d successfully`,
      );
      load();
    } catch {
      setMessage('Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canReview =
    hasPermission(user, 'inspections.review') &&
    inspection &&
    ['submitted', 'under_review', 'resubmitted'].includes(inspection.status);

  if (!inspection) {
    return (
      <PermissionGate permission="inspections.view">
        <div className="animate-pulse text-muted">Loading inspection...</div>
      </PermissionGate>
    );
  }

  return (
    <PermissionGate permission="inspections.view">
      <div>
        <Link
          href="/inspections"
          className="text-pnmc-green text-sm hover:underline mb-4 inline-block"
        >
          ← Back to inspections
        </Link>

        <div className="card mb-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-muted font-mono">
                {inspection.inspectionCode}
              </p>
              <h1 className="text-2xl font-bold text-pnmc-blue mt-1">
                {inspection.instituteName}
              </h1>
              <p className="text-muted mt-1">
                {[inspection.district, inspection.province]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
            <div className="text-right">
              <span
                className={clsx(
                  'badge text-sm',
                  inspection.status.includes('approved')
                    ? 'badge-approved'
                    : inspection.status.includes('reject')
                      ? 'badge-rejected'
                      : inspection.status.includes('changes')
                        ? 'badge-changes'
                        : 'badge-submitted',
                )}
              >
                {inspection.status.replace(/_/g, ' ')}
              </span>
              <p className="text-sm text-muted mt-2">
                {inspection.progress.okCount} OK ·{' '}
                {inspection.progress.rejectCount} N/A ·{' '}
                {inspection.progress.percent}%
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border text-sm">
            <div>
              <p className="text-muted">Applied for</p>
              <p className="font-medium">{inspection.appliedFor || '—'}</p>
            </div>
            <div>
              <p className="text-muted">Inspection type</p>
              <p className="font-medium capitalize">
                {inspection.type?.replace(/([A-Z])/g, ' $1').trim() || '—'}
              </p>
            </div>
            <div>
              <p className="text-muted">Inspection date</p>
              <p className="font-medium">
                {inspection.inspectionDate
                  ? new Date(inspection.inspectionDate).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted">Field inspector</p>
              <p className="font-medium">{inspection.inspectorName || '—'}</p>
            </div>
            <div>
              <p className="text-muted">Principal</p>
              <p className="font-medium">{inspection.principalName || '—'}</p>
            </div>
            <div>
              <p className="text-muted">Reg. No.</p>
              <p className="font-medium">{inspection.principalRegNo || '—'}</p>
            </div>
            <div>
              <p className="text-muted">Qualification</p>
              <p className="font-medium">
                {inspection.principalQualification || '—'}
              </p>
            </div>
          </div>
        </div>

        {inspection.feeDetails && (
          <div className="card mb-6">
            <h3 className="font-semibold text-pnmc-blue mb-1">
              Fee Payment (Flag – J)
            </h3>
            <p className="text-xs text-muted mb-4">
              Bank: Habib Metropolitan · Account:{' '}
              {inspection.feeDetails.bankAccount || 'PK44MPBL9737477140108727'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2">Degree / Fee</th>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="text-right px-3 py-2">Remaining</th>
                    <th className="text-center px-3 py-2">Selected</th>
                  </tr>
                </thead>
                <tbody>
                  {inspection.feeDetails.lineItems?.map((item) => (
                    <tr key={item.code} className="border-b border-border">
                      <td className="px-3 py-2">{item.label}</td>
                      <td className="px-3 py-2 text-right">
                        {item.amount != null
                          ? Number(item.amount).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.remainingFee != null
                          ? Number(item.remainingFee).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.selected ? '✓' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-muted">Total payable</p>
                <p className="font-medium">
                  {inspection.feeDetails.totalPayable ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-muted">Paid amount</p>
                <p className="font-medium">
                  {inspection.feeDetails.paidAmount ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-muted">Challan reference</p>
                <p className="font-medium">
                  {inspection.feeDetails.challanReference || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {categories.map((cat) => {
              const items = inspection.requirements.filter(
                (r) => r.category === cat,
              );
              const isOpen = expanded[cat] ?? true;
              return (
                <div key={cat} className="card p-0 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition text-left"
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [cat]: !isOpen }))
                    }
                  >
                    <span className="font-semibold text-pnmc-blue">{cat}</span>
                    {isOpen ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-border">
                      {items.map((req) => (
                        <div key={req.id} className="px-6 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs text-muted">
                                {req.flag} · #{req.number}
                              </p>
                              <p className="font-medium">{req.title}</p>
                              <p className="text-sm text-muted mt-1">
                                {req.provision}
                              </p>
                            </div>
                            <span
                              className={clsx(
                                'badge shrink-0',
                                req.status === 'ok'
                                  ? 'badge-approved'
                                  : req.status === 'reject'
                                    ? 'badge-rejected'
                                    : 'badge-draft',
                              )}
                            >
                              {req.status === 'reject'
                                ? 'N/A'
                                : req.status === 'ok'
                                  ? 'OK'
                                  : 'Pending'}
                            </span>
                          </div>
                          {req.comments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {req.comments.map((c, i) => (
                                <div
                                  key={i}
                                  className="bg-gray-50 rounded-lg px-3 py-2 text-sm"
                                >
                                  <p className="font-medium text-xs text-muted">
                                    {c.author}
                                  </p>
                                  <p>{c.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {req.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {req.attachments.map((a) =>
                                a.mimeType?.includes('pdf') ? (
                                  <a
                                    key={a.id}
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-50"
                                  >
                                    <FileText size={16} />
                                    {a.fileName}
                                  </a>
                                ) : (
                                  <a
                                    key={a.id}
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <img
                                      src={a.url}
                                      alt={a.fileName}
                                      className="w-20 h-20 object-cover rounded-lg border border-border"
                                    />
                                  </a>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold mb-3">Final Remarks</h3>
              <p className="text-sm">
                {inspection.finalRemarks || 'No remarks provided.'}
              </p>
            </div>

            {inspection.signatureUrl && (
              <div className="card">
                <h3 className="font-semibold mb-3">Digital Signature</h3>
                <img
                  src={inspection.signatureUrl}
                  alt="Signature"
                  className="max-w-full border border-border rounded"
                />
              </div>
            )}

            {inspection.supervisorRemarks && (
              <div className="card">
                <h3 className="font-semibold mb-3">Supervisor Remarks</h3>
                <p className="text-sm">{inspection.supervisorRemarks}</p>
              </div>
            )}

            {canReview && (
              <div className="card">
                <h3 className="font-semibold mb-3">Supervisor Action</h3>
                <textarea
                  className="input mb-3"
                  rows={4}
                  placeholder="Add your remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                {message && (
                  <p className="text-sm text-pnmc-green mb-3">{message}</p>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleReview('approve')}
                    disabled={submitting}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    Approve Report
                  </button>
                  <button
                    onClick={() => handleReview('request_changes')}
                    disabled={submitting}
                    className="btn-outline w-full border-amber-400 text-amber-700 disabled:opacity-50"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleReview('reject')}
                    disabled={submitting}
                    className="btn-outline w-full border-red-400 text-red-700 disabled:opacity-50"
                  >
                    Reject Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
