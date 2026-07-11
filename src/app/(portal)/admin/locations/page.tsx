'use client';

import { useEffect, useState } from 'react';
import PermissionGate from '@/components/PermissionGate';
import { api } from '@/lib/api';

interface District {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  provinceId: string;
}

interface Province {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  districts: District[];
}

export default function LocationsPage() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [provinceForm, setProvinceForm] = useState({ name: '', code: '' });
  const [districtForm, setDistrictForm] = useState({ name: '', code: '' });
  const [showProvinceForm, setShowProvinceForm] = useState(false);
  const [showDistrictForm, setShowDistrictForm] = useState(false);
  const [editingProvinceId, setEditingProvinceId] = useState<string | null>(
    null,
  );
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(
    null,
  );

  const load = async () => {
    const { data } = await api.get('/admin/provinces');
    setProvinces(data);
    if (!selectedId && data.length) setSelectedId(data[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  const selected = provinces.find((p) => p.id === selectedId) ?? null;

  const resetProvinceForm = () => {
    setProvinceForm({ name: '', code: '' });
    setEditingProvinceId(null);
    setShowProvinceForm(false);
  };

  const resetDistrictForm = () => {
    setDistrictForm({ name: '', code: '' });
    setEditingDistrictId(null);
    setShowDistrictForm(false);
  };

  const startEditProvince = (p: Province) => {
    setEditingProvinceId(p.id);
    setProvinceForm({ name: p.name, code: p.code ?? '' });
    setShowProvinceForm(true);
  };

  const startEditDistrict = (d: District) => {
    setEditingDistrictId(d.id);
    setDistrictForm({ name: d.name, code: d.code ?? '' });
    setShowDistrictForm(true);
  };

  const saveProvince = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProvinceId) {
      await api.patch(`/admin/provinces/${editingProvinceId}`, provinceForm);
    } else {
      await api.post('/admin/provinces', provinceForm);
    }
    resetProvinceForm();
    load();
  };

  const saveDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDistrictId) {
      await api.patch(`/admin/districts/${editingDistrictId}`, districtForm);
    } else {
      if (!selectedId) return;
      await api.post('/admin/districts', {
        provinceId: selectedId,
        ...districtForm,
      });
    }
    resetDistrictForm();
    load();
  };

  const deleteProvince = async (id: string) => {
    if (!confirm('Delete this province and all its districts?')) return;
    await api.delete(`/admin/provinces/${id}`);
    setSelectedId(null);
    load();
  };

  const deleteDistrict = async (id: string) => {
    if (!confirm('Delete this district?')) return;
    await api.delete(`/admin/districts/${id}`);
    load();
  };

  const toggleDistrictActive = async (d: District) => {
    await api.patch(`/admin/districts/${d.id}`, { isActive: !d.isActive });
    load();
  };

  return (
    <PermissionGate permission="locations.view">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-pnmc-blue">Locations</h1>
            <p className="text-muted">
              Province → District hierarchy for inspection forms
            </p>
          </div>
          <button
            onClick={() => {
              if (showProvinceForm) resetProvinceForm();
              else {
                setEditingProvinceId(null);
                setProvinceForm({ name: '', code: '' });
                setShowProvinceForm(true);
              }
            }}
            className="btn-primary"
          >
            {showProvinceForm && !editingProvinceId ? 'Cancel' : 'Add Province'}
          </button>
        </div>

        {showProvinceForm && (
          <form
            onSubmit={saveProvince}
            className="card mb-6 flex flex-wrap gap-3 items-end"
          >
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium mb-1 block">
                Province name
              </label>
              <input
                className="input"
                required
                value={provinceForm.name}
                onChange={(e) =>
                  setProvinceForm({ ...provinceForm, name: e.target.value })
                }
              />
            </div>
            <div className="w-32">
              <label className="text-sm font-medium mb-1 block">Code</label>
              <input
                className="input"
                value={provinceForm.code}
                onChange={(e) =>
                  setProvinceForm({ ...provinceForm, code: e.target.value })
                }
              />
            </div>
            <button type="submit" className="btn-primary">
              {editingProvinceId ? 'Update Province' : 'Save Province'}
            </button>
            {editingProvinceId && (
              <button
                type="button"
                onClick={resetProvinceForm}
                className="btn-outline"
              >
                Cancel
              </button>
            )}
          </form>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 bg-pnmc-blue text-white font-semibold text-sm">
              Provinces
            </div>
            <ul className="divide-y divide-border max-h-[60vh] overflow-y-auto">
              {provinces.map((p) => (
                <li key={p.id}>
                  <div
                    className={`flex items-start gap-2 px-4 py-3 text-sm transition ${
                      selectedId === p.id
                        ? 'bg-[#e8f0f8] text-pnmc-blue'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedId(p.id)}
                      className="flex-1 text-left"
                    >
                      <span className="block font-medium">{p.name}</span>
                      <span className="text-xs text-muted">
                        {p.districts?.length ?? 0} districts
                        {p.code ? ` · ${p.code}` : ''}
                      </span>
                    </button>
                    <button
                      onClick={() => startEditProvince(p)}
                      className="text-xs text-pnmc-green hover:underline shrink-0 mt-0.5"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
              {provinces.length === 0 && (
                <li className="px-4 py-8 text-center text-muted text-sm">
                  No provinces yet
                </li>
              )}
            </ul>
          </div>

          <div className="lg:col-span-2 card">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-pnmc-blue">
                      {selected.name}
                    </h2>
                    <p className="text-sm text-muted">
                      Districts under this province
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (showDistrictForm && !editingDistrictId)
                          resetDistrictForm();
                        else {
                          setEditingDistrictId(null);
                          setDistrictForm({ name: '', code: '' });
                          setShowDistrictForm(true);
                        }
                      }}
                      className="btn-primary text-sm"
                    >
                      {showDistrictForm && !editingDistrictId
                        ? 'Cancel'
                        : 'Add District'}
                    </button>
                    <button
                      onClick={() => startEditProvince(selected)}
                      className="btn-outline text-sm"
                    >
                      Edit Province
                    </button>
                    <button
                      onClick={() => deleteProvince(selected.id)}
                      className="btn-outline text-sm text-red-600 border-red-300"
                    >
                      Delete Province
                    </button>
                  </div>
                </div>

                {showDistrictForm && (
                  <form
                    onSubmit={saveDistrict}
                    className="flex flex-wrap gap-3 items-end mb-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-[160px]">
                      <input
                        className="input"
                        placeholder="District name"
                        required
                        value={districtForm.name}
                        onChange={(e) =>
                          setDistrictForm({
                            ...districtForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="w-28">
                      <input
                        className="input"
                        placeholder="Code"
                        value={districtForm.code}
                        onChange={(e) =>
                          setDistrictForm({
                            ...districtForm,
                            code: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button type="submit" className="btn-primary text-sm">
                      {editingDistrictId ? 'Update' : 'Save'}
                    </button>
                    {editingDistrictId && (
                      <button
                        type="button"
                        onClick={resetDistrictForm}
                        className="btn-outline text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </form>
                )}

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-3 py-2">District</th>
                      <th className="text-left px-3 py-2">Code</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.districts ?? []).map((d) => (
                      <tr key={d.id} className="border-b border-border">
                        <td className="px-3 py-2 font-medium">{d.name}</td>
                        <td className="px-3 py-2 text-muted">{d.code || '—'}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`badge ${d.isActive ? 'badge-approved' : 'badge-draft'}`}
                          >
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right space-x-3 whitespace-nowrap">
                          <button
                            onClick={() => startEditDistrict(d)}
                            className="text-pnmc-green text-xs hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleDistrictActive(d)}
                            className="text-pnmc-blue text-xs hover:underline"
                          >
                            {d.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteDistrict(d.id)}
                            className="text-red-600 text-xs hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(selected.districts ?? []).length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-8 text-center text-muted"
                        >
                          No districts — add one above
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-muted text-center py-12">
                Select a province to manage districts
              </p>
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
