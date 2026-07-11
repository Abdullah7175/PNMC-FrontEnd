'use client';

import { useEffect, useState } from 'react';
import PermissionGate from '@/components/PermissionGate';
import { api } from '@/lib/api';

interface AppliedFor {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = {
  name: '',
  code: '',
  description: '',
};

export default function AppliedForPage() {
  const [items, setItems] = useState<AppliedFor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () =>
    api.get('/admin/applied-for').then(({ data }) => setItems(data));

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: AppliedFor) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.patch(`/admin/applied-for/${editingId}`, form);
    } else {
      await api.post('/admin/applied-for', {
        ...form,
        sortOrder: items.length + 1,
      });
    }
    resetForm();
    load();
  };

  const toggleActive = async (item: AppliedFor) => {
    await api.patch(`/admin/applied-for/${item.id}`, {
      isActive: !item.isActive,
    });
    load();
  };

  const handleDelete = async (item: AppliedFor) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await api.delete(`/admin/applied-for/${item.id}`);
    load();
  };

  return (
    <PermissionGate permission="applied-for.view">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-pnmc-blue">Applied For</h1>
            <p className="text-muted">
              Categories field agents select on the inspection form (BSN, MSN,
              LHV, …)
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm) resetForm();
              else {
                setEditingId(null);
                setForm(emptyForm);
                setShowForm(true);
              }
            }}
            className="btn-primary"
          >
            {showForm && !editingId ? 'Cancel' : 'Add Category'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="card mb-6 grid md:grid-cols-3 gap-4"
          >
            <input
              className="input"
              placeholder="Display name (e.g. BSN)"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Code (e.g. BSN)"
              required
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
            />
            <input
              className="input"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Category' : 'Create'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-outline"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Code</th>
                <th className="text-left px-6 py-3">Description</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="px-6 py-3 font-medium">{item.name}</td>
                  <td className="px-6 py-3 font-mono text-xs">{item.code}</td>
                  <td className="px-6 py-3 text-muted">
                    {item.description || '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`badge ${item.isActive ? 'badge-approved' : 'badge-draft'}`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-pnmc-green text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(item)}
                      className="text-pnmc-blue text-sm hover:underline"
                    >
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted"
                  >
                    No categories yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGate>
  );
}
