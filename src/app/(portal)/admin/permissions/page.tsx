'use client';

import { useEffect, useState } from 'react';
import PermissionGate from '@/components/PermissionGate';
import { adminApi } from '@/lib/api';

interface Permission {
  id: string;
  code: string;
  name: string;
  page: string;
  action: string;
  description: string;
}

const emptyForm = {
  code: '',
  name: '',
  page: '',
  action: '',
  description: '',
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () =>
    adminApi.permissions().then(({ data }) => setPermissions(data));
  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (p: Permission) => {
    setEditingId(p.id);
    setForm({
      code: p.code,
      name: p.name,
      page: p.page,
      action: p.action,
      description: p.description ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await adminApi.updatePermission(editingId, form);
    } else {
      await adminApi.createPermission(form);
    }
    resetForm();
    load();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete permission "${code}"?`)) return;
    await adminApi.deletePermission(id);
    load();
  };

  const grouped = permissions.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      (acc[p.page] ??= []).push(p);
      return acc;
    },
    {},
  );

  return (
    <PermissionGate permission="permissions.view">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-pnmc-blue">Permissions</h1>
            <p className="text-muted">
              Define page-level access controls. Add new permissions when pages
              are added.
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
            {showForm && !editingId ? 'Cancel' : 'Add Permission'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="card mb-6 grid md:grid-cols-2 gap-4"
          >
            <input
              className="input"
              placeholder="Code (e.g. reports.export)"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <input
              className="input"
              placeholder="Display name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Page (e.g. reports)"
              required
              value={form.page}
              onChange={(e) => setForm({ ...form, page: e.target.value })}
            />
            <input
              className="input"
              placeholder="Action (view, create, update, delete)"
              required
              value={form.action}
              onChange={(e) => setForm({ ...form, action: e.target.value })}
            />
            <input
              className="input md:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Permission' : 'Create Permission'}
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

        <div className="space-y-6">
          {Object.entries(grouped).map(([page, perms]) => (
            <div key={page} className="card p-0 overflow-hidden">
              <div className="px-6 py-3 bg-pnmc-blue text-white font-semibold capitalize">
                {page}
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-2">Code</th>
                    <th className="text-left px-6 py-2">Name</th>
                    <th className="text-left px-6 py-2">Action</th>
                    <th className="px-6 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {perms.map((p) => (
                    <tr key={p.id} className="border-b border-border">
                      <td className="px-6 py-3 font-mono text-xs">{p.code}</td>
                      <td className="px-6 py-3">{p.name}</td>
                      <td className="px-6 py-3">{p.action}</td>
                      <td className="px-6 py-3 text-right space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-pnmc-green text-sm hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.code)}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </PermissionGate>
  );
}
