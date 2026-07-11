export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    permission: 'dashboard.view',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Inspections',
    href: '/inspections',
    permission: 'inspections.view',
    icon: 'ClipboardList',
  },
  {
    label: 'Locations',
    href: '/admin/locations',
    permission: 'locations.view',
    icon: 'MapPin',
  },
  {
    label: 'Applied For',
    href: '/admin/applied-for',
    permission: 'applied-for.view',
    icon: 'GraduationCap',
  },
  {
    label: 'Users',
    href: '/admin/users',
    permission: 'users.view',
    icon: 'Users',
  },
  {
    label: 'Roles',
    href: '/admin/roles',
    permission: 'roles.view',
    icon: 'Shield',
  },
  {
    label: 'Permissions',
    href: '/admin/permissions',
    permission: 'permissions.view',
    icon: 'Key',
  },
  {
    label: 'Audit Logs',
    href: '/audit-logs',
    permission: 'audit-logs.view',
    icon: 'FileText',
  },
] as const;
