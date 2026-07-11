import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export interface User {
  id: string;
  email: string;
  fullName: string;
  employeeId?: string;
  province?: string;
  district?: string;
  isMobileUser?: boolean;
  roles: { id: string; code: string; name: string }[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', {
      email,
      password,
      client: 'portal',
    }),
  me: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const supervisorApi = {
  stats: () => api.get('/supervisor/dashboard/stats'),
  inspections: (params?: Record<string, string>) =>
    api.get('/supervisor/inspections', { params }),
  inspection: (id: string) => api.get(`/supervisor/inspections/${id}`),
  review: (id: string, action: string, remarks?: string) =>
    api.patch(`/supervisor/inspections/${id}/review`, { action, remarks }),
};

export const adminApi = {
  users: () => api.get('/admin/users'),
  createUser: (data: Record<string, unknown>) => api.post('/admin/users', data),
  updateUser: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  roles: () => api.get('/admin/roles'),
  createRole: (data: Record<string, unknown>) => api.post('/admin/roles', data),
  updateRole: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/roles/${id}`, data),
  deleteRole: (id: string) => api.delete(`/admin/roles/${id}`),
  permissions: () => api.get('/admin/permissions'),
  createPermission: (data: Record<string, unknown>) =>
    api.post('/admin/permissions', data),
  updatePermission: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/permissions/${id}`, data),
  deletePermission: (id: string) => api.delete(`/admin/permissions/${id}`),
  auditLogs: (params?: Record<string, string>) =>
    api.get('/admin/audit-logs', { params }),
};

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (user.roles.some((r) => r.code === 'admin')) return true;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}
