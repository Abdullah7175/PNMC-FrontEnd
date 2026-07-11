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
}

interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', permissionIds: [] as string[] });

  const load = () => {
    adminApi.roles().then(({ data }) => setRoles(data));
    adminApi.permissions().then(({ data }) => setPermissions(data));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await adminApi.updateRole(editingId, {
        name: form.name,
        description: form.description,
        permissionIds: form.permissionIds,
      });
    } else {
      await adminApi.createRole(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ code: '', name: '', description: '', permissionIds: [] });
    load();
  };

  const startEdit = (role: Role) => {
    setEditingId(role.id);
    setForm({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      permissionIds: role.permissions.map((p) => p.id),
    });
    setShowForm(true);
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) return;
    if (!confirm(`Delete role "${role.name}"?`)) return;
    await adminApi.deleteRole(role.id);
    load();
  };

  const groupedPerms = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.page] ??= []).push(p);
    return acc;
  }, {});

  return (
    <PermissionGate permission="roles.view">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-pnmc-blue">Roles</h1>
            <p className="text-muted">Create roles and assign page permissions</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ code: '', name: '', description: '', permissionIds: [] }); }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Create Role'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card mb-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {!editingId && (
                <input className="input" placeholder="Role code (e.g. registrar)" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              )}
              <input className="input" placeholder="Role name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <p className="text-sm font-medium mb-3">Permissions</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 max-h-64 overflow-y-auto">
              {Object.entries(groupedPerms).map(([page, perms]) => (
                <div key={page} className="border border-border rounded-lg p-3">
                  <p className="text-xs font-semibold text-pnmc-blue uppercase mb-2">{page}</p>
                  {perms.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={form.permissionIds.includes(p.id)}
                        onChange={(e) => {
                          setForm({
                            ...form,
                            permissionIds: e.target.checked
                              ? [...form.permissionIds, p.id]
                              : form.permissionIds.filter((id) => id !== p.id),
                          });
                        }}
                      />
                      {p.action}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <button type="submit" className="btn-primary">{editingId ? 'Update Role' : 'Create Role'}</button>
          </form>
        )}

        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{role.name}</h3>
                    <span className="text-xs font-mono text-muted">{role.code}</span>
                    {role.isSystem && <span className="badge badge-submitted">System</span>}
                  </div>
                  <p className="text-sm text-muted mt-1">{role.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {role.permissions.map((p) => (
                      <span key={p.id} className="badge badge-draft text-xs">{p.code}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(role)} className="text-sm text-pnmc-green hover:underline">Edit</button>
                  {!role.isSystem && (
                    <button onClick={() => handleDelete(role)} className="text-sm text-red-600 hover:underline">Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PermissionGate>
  );
}
