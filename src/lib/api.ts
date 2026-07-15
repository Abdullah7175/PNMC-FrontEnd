import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get('refreshToken');
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });
    const secure =
      typeof window !== 'undefined' && window.location.protocol === 'https:';
    Cookies.set('accessToken', data.accessToken, {
      expires: 1,
      sameSite: 'strict',
      secure,
      path: '/',
    });
    if (data.refreshToken) {
      Cookies.set('refreshToken', data.refreshToken, {
        expires: 7,
        sameSite: 'strict',
        secure,
        path: '/',
      });
    }
    return data.accessToken as string;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('refreshToken', { path: '/' });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export interface User {
  id: string;
  email: string;
  fullName: string;
  employeeId?: string | null;
  phone?: string | null;
  nic?: string | null;
  designation?: string | null;
  address?: string | null;
  officeDetails?: string | null;
  province?: string | null;
  district?: string | null;
  provinceId?: string | null;
  districtId?: string | null;
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
  refresh: (refreshToken: string) =>
    api.post<LoginResponse>('/auth/refresh', { refreshToken }),
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

export function hasAnyPermission(
  user: User | null,
  permissions: string[],
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}
