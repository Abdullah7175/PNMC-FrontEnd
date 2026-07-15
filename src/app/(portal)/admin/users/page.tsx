'use client';

import { useEffect, useMemo, useState } from 'react';
import PermissionGate from '@/components/PermissionGate';
import { adminApi, api } from '@/lib/api';

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
  provinceId: string | null;
  districtId: string | null;
  isActive: boolean;
  isMobileUser: boolean;
  roles: { id: string; name: string; code: string }[];
}

interface Role {
  id: string;
  name: string;
  code: string;
}

interface DistrictOpt {
  id: string;
  name: string;
  provinceId: string;
}

interface ProvinceOpt {
  id: string;
  name: string;
  districts: DistrictOpt[];
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
  provinceId: '',
  districtId: '',
  isMobileUser: false,
  roleIds: [] as string[],
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [provinces, setProvinces] = useState<ProvinceOpt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const districts = useMemo(() => {
    const p = provinces.find((x) => x.id === form.provinceId);
    return p?.districts ?? [];
  }, [provinces, form.provinceId]);

  const load = () => {
    adminApi.users().then(({ data }) => setUsers(data));
    adminApi.roles().then(({ data }) => setRoles(data));
    api.get('/admin/provinces').then(({ data }) => setProvinces(data));
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
      provinceId: user.provinceId ?? '',
      districtId: user.districtId ?? '',
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
    provinceId: form.provinceId || null,
    districtId: form.districtId || null,
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

  const needsProvince =
    form.isMobileUser ||
    form.roleIds.some(
      (id) => roles.find((r) => r.id === id)?.code === 'supervisor',
    );

  return (
    <PermissionGate permission="users.view">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-pnmc-blue">Users</h1>
            <p className="text-muted">
              Supervisors are assigned a province; mobile inspectors a district
              under that province
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
            <select
              className="input"
              value={form.provinceId}
              onChange={(e) =>
                setForm({
                  ...form,
                  provinceId: e.target.value,
                  districtId: '',
                })
              }
              required={needsProvince}
            >
              <option value="">Province (assignment)…</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={form.districtId}
              onChange={(e) => setForm({ ...form, districtId: e.target.value })}
              disabled={!form.provinceId}
              required={form.isMobileUser}
            >
              <option value="">
                {form.isMobileUser
                  ? 'District (required for mobile)…'
                  : 'District (optional for supervisors)…'}
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
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
                  Field inspector — assign a district under their province
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
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? 'Save Changes' : 'Create User'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Assignment</th>
                <th className="py-3 pr-4">Roles</th>
                <th className="py-3 pr-4">Mobile</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium">{u.fullName}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4 text-muted">
                    {[u.district, u.province].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="py-3 pr-4">
                    {u.roles?.map((r) => r.name).join(', ')}
                  </td>
                  <td className="py-3 pr-4">
                    {u.isMobileUser ? 'Yes' : 'No'}
                  </td>
                  <td className="py-3 pr-4">
                    {u.isActive ? 'Active' : 'Inactive'}
                  </td>
                  <td className="py-3 flex flex-wrap gap-2">
                    <button
                      className="text-pnmc-blue text-xs underline"
                      onClick={() => startEdit(u)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs underline"
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="text-red-600 text-xs underline"
                      onClick={() => handleDelete(u)}
                    >
                      Deactivate
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
