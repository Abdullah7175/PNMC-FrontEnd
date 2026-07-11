'use client';

import { useEffect, useState } from 'react';
import PermissionGate from '@/components/PermissionGate';
import { adminApi } from '@/lib/api';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  employeeId: string | null;
  phone: string | null;
  nic: string | null;
  designation: string | null;
  address: string | null;
  officeDetails: string | null;
  province: string | null;
  district: string | null;
  isActive: boolean;
  isMobileUser: boolean;
  roles: { id: string; name: string; code: string }[];
}

interface Role {
  id: string;
  name: string;
  code: string;
}

const emptyForm = {
  email: '',
  password: '',
  fullName: '',
  employeeId: '',
  phone: '',
  nic: '',
  designation: '',
  address: '',
  officeDetails: '',
  province: '',
  district: '',
  isMobileUser: false,
  roleIds: [] as string[],
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    adminApi.users().then(({ data }) => setUsers(data));
    adminApi.roles().then(({ data }) => setRoles(data));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setForm({
      email: user.email,
      password: '',
      fullName: user.fullName,
      employeeId: user.employeeId ?? '',
      phone: user.phone ?? '',
      nic: user.nic ?? '',
      designation: user.designation ?? '',
      address: user.address ?? '',
      officeDetails: user.officeDetails ?? '',
      province: user.province ?? '',
      district: user.district ?? '',
      isMobileUser: user.isMobileUser,
      roleIds: user.roles?.map((r) => r.id) ?? [],
    });
    setShowForm(true);
  };

  const profilePayload = () => ({
    fullName: form.fullName,
    employeeId: form.employeeId || null,
    phone: form.phone || null,
    nic: form.nic || null,
    designation: form.designation || null,
    address: form.address || null,
    officeDetails: form.officeDetails || null,
    province: form.province || null,
    district: form.district || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldRole = roles.find((r) => r.code === 'field_inspector');
    const roleIds =
      form.isMobileUser && fieldRole && !form.roleIds.includes(fieldRole.id)
        ? [...form.roleIds, fieldRole.id]
        : form.roleIds;

    if (editingId) {
      const payload: Record<string, unknown> = {
        ...profilePayload(),
        isMobileUser: form.isMobileUser,
        roleIds,
      };
      if (form.password) payload.password = form.password;
      await adminApi.updateUser(editingId, payload);
    } else {
      await adminApi.createUser({
        email: form.email,
        password: form.password,
        ...profilePayload(),
        isMobileUser: form.isMobileUser,
        roleIds,
      });
    }
    resetForm();
    load();
  };

  const toggleActive = async (user: UserRow) => {
    await adminApi.updateUser(user.id, { isActive: !user.isActive });
    load();
  };

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`Deactivate user "${user.fullName}"?`)) return;
    await adminApi.deleteUser(user.id);
    load();
  };

  return (
    <PermissionGate permission="users.view">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-pnmc-blue">Users</h1>
            <p className="text-muted">
              Manage portal users, supervisors, and mobile field inspectors
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
            {showForm && !editingId ? 'Cancel' : 'Add User'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="card mb-6 grid md:grid-cols-2 gap-4"
          >
            <input
              className="input"
              placeholder="Email"
              type="email"
              required
              disabled={!!editingId}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input"
              placeholder={
                editingId
                  ? 'New password (leave blank to keep)'
                  : 'Password'
              }
              type="password"
              required={!editingId}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <input
              className="input"
              placeholder="Full Name"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <input
              className="input"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="NIC / CNIC (e.g. 42101-1234567-1)"
              value={form.nic}
              onChange={(e) => setForm({ ...form, nic: e.target.value })}
            />
            <input
              className="input"
              placeholder="Work / Employee ID"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            />
            <input
              className="input"
              placeholder="Position / Designation"
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Province"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
            <input
              className="input"
              placeholder="District"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
            <input
              className="input md:col-span-2"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <input
              className="input md:col-span-2"
              placeholder="Office details (name, location, etc.)"
              value={form.officeDetails}
              onChange={(e) =>
                setForm({ ...form, officeDetails: e.target.value })
              }
            />

            <label className="md:col-span-2 flex items-center gap-3 p-3 rounded-lg border border-border bg-[#f8fafc]">
              <input
                type="checkbox"
                checked={form.isMobileUser}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const fieldRole = roles.find(
                    (r) => r.code === 'field_inspector',
                  );
                  setForm({
                    ...form,
                    isMobileUser: checked,
                    roleIds:
                      checked && fieldRole
                        ? Array.from(new Set([...form.roleIds, fieldRole.id]))
                        : form.roleIds.filter((id) => id !== fieldRole?.id),
                  });
                }}
              />
              <span>
                <span className="font-medium text-pnmc-blue">
                  Is Mobile User
                </span>
                <span className="block text-xs text-muted">
                  Field inspector for the Flutter app — can create and submit
                  inspections via mobile APIs
                </span>
              </span>
            </label>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Roles</label>
              <div className="flex flex-wrap gap-3">
                {roles.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.roleIds.includes(r.id)}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          roleIds: e.target.checked
                            ? [...form.roleIds, r.id]
                            : form.roleIds.filter((id) => id !== r.id),
                          isMobileUser:
                            r.code === 'field_inspector'
                              ? e.target.checked
                              : form.isMobileUser,
                        });
                      }}
                    />
                    {r.name}
                    {r.code === 'field_inspector' && (
                      <span className="badge badge-submitted text-[10px]">
                        mobile
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update User' : 'Create User'}
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
                <th className="text-left px-6 py-3">Phone / NIC</th>
                <th className="text-left px-6 py-3">Designation</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border">
                  <td className="px-6 py-4">
                    <p className="font-medium">{u.fullName}</p>
                    <p className="text-xs text-muted">
                      {u.employeeId || '—'}
                      {u.roles?.length
                        ? ` · ${u.roles.map((r) => r.name).join(', ')}`
                        : ''}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    <p>{u.phone || '—'}</p>
                    <p className="text-xs">{u.nic || ''}</p>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {u.designation || '—'}
                  </td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    {u.isMobileUser ? (
                      <span className="badge badge-submitted">Mobile User</span>
                    ) : (
                      <span className="badge badge-draft">Portal</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${u.isActive ? 'badge-approved' : 'badge-rejected'}`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => startEdit(u)}
                      className="text-sm text-pnmc-green hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className="text-sm text-pnmc-blue hover:underline"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGate>
  );
}
