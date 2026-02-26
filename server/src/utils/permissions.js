/**
 * نظام الصلاحيات المخصصة
 * كل صلاحية بنمط: module.action
 */

// تعريف وحدات الصلاحيات (للعرض في الفرونت)
const PERMISSION_MODULES = [
  {
    key: 'appointments',
    label: 'المواعيد',
    icon: '📅',
    permissions: [
      { key: 'appointments.view', label: 'عرض' },
      { key: 'appointments.add', label: 'إضافة' },
      { key: 'appointments.edit', label: 'تعديل' },
      { key: 'appointments.delete', label: 'حذف' },
    ]
  },
  {
    key: 'customers',
    label: 'العملاء',
    icon: '👥',
    permissions: [
      { key: 'customers.view', label: 'عرض' },
      { key: 'customers.add', label: 'إضافة' },
      { key: 'customers.edit', label: 'تعديل' },
      { key: 'customers.delete', label: 'حذف' },
    ]
  },
  {
    key: 'finance',
    label: 'المالية',
    icon: '💰',
    permissions: [
      { key: 'finance.cashRegister', label: 'الصندوق' },
      { key: 'finance.receipts', label: 'الإيصالات' },
      { key: 'finance.transactions', label: 'المعاملات' },
      { key: 'finance.invoices', label: 'الفواتير' },
      { key: 'finance.cancelTransaction', label: 'إلغاء المعاملات' },
      { key: 'finance.reports', label: 'التقارير المالية' },
    ]
  },
  {
    key: 'departments',
    label: 'الأقسام',
    icon: '🏢',
    permissions: [
      { key: 'departments.view', label: 'عرض' },
      { key: 'departments.add', label: 'إضافة' },
      { key: 'departments.edit', label: 'تعديل' },
      { key: 'departments.delete', label: 'حذف' },
    ]
  },
  {
    key: 'tasks',
    label: 'المهام',
    icon: '✅',
    permissions: [
      { key: 'tasks.view', label: 'عرض' },
      { key: 'tasks.add', label: 'إضافة' },
      { key: 'tasks.edit', label: 'تعديل' },
    ]
  },
  {
    key: 'reports',
    label: 'التقارير',
    icon: '📈',
    permissions: [
      { key: 'reports.view', label: 'عرض التقارير' },
    ]
  },
  {
    key: 'settings',
    label: 'الإعدادات',
    icon: '⚙️',
    permissions: [
      { key: 'settings.view', label: 'عرض' },
      { key: 'settings.edit', label: 'تعديل' },
    ]
  },
  {
    key: 'employees',
    label: 'الموظفين',
    icon: '🧑‍💼',
    permissions: [
      { key: 'employees.manage', label: 'إدارة الموظفين' },
    ]
  },
  {
    key: 'audit',
    label: 'سجل التدقيق',
    icon: '🔍',
    permissions: [
      { key: 'audit.view', label: 'عرض سجل التدقيق' },
    ]
  },
];

// الصلاحيات الافتراضية لكل دور
const ROLE_DEFAULT_PERMISSIONS = {
  employee: {
    'appointments.view': true,
    'appointments.add': true,
    'appointments.edit': true,
    'appointments.delete': false,
    'customers.view': true,
    'customers.add': true,
    'customers.edit': true,
    'customers.delete': false,
    'finance.cashRegister': false,
    'finance.receipts': false,
    'finance.transactions': false,
    'finance.invoices': true,
    'finance.cancelTransaction': false,
    'finance.reports': false,
    'departments.view': true,
    'departments.add': true,
    'departments.edit': true,
    'departments.delete': false,
    'tasks.view': true,
    'tasks.add': true,
    'tasks.edit': true,
    'reports.view': false,
    'settings.view': true,
    'settings.edit': false,
    'employees.manage': false,
    'audit.view': false,
  },

  accountant: {
    'appointments.view': true,
    'appointments.add': false,
    'appointments.edit': false,
    'appointments.delete': false,
    'customers.view': true,
    'customers.add': false,
    'customers.edit': false,
    'customers.delete': false,
    'finance.cashRegister': true,
    'finance.receipts': true,
    'finance.transactions': true,
    'finance.invoices': true,
    'finance.cancelTransaction': true,
    'finance.reports': true,
    'departments.view': true,
    'departments.add': false,
    'departments.edit': false,
    'departments.delete': false,
    'tasks.view': true,
    'tasks.add': false,
    'tasks.edit': false,
    'reports.view': true,
    'settings.view': true,
    'settings.edit': false,
    'employees.manage': false,
    'audit.view': true,
  },

  user: {}
};

/**
 * الحصول على الصلاحيات الافتراضية لدور معين
 */
const getDefaultPermissions = (role) => {
  return { ...(ROLE_DEFAULT_PERMISSIONS[role] || {}) };
};

/**
 * الحصول على كل مفاتيح الصلاحيات
 */
const getAllPermissionKeys = () => {
  const keys = [];
  PERMISSION_MODULES.forEach(mod => {
    mod.permissions.forEach(p => keys.push(p.key));
  });
  return keys;
};

module.exports = {
  PERMISSION_MODULES,
  ROLE_DEFAULT_PERMISSIONS,
  getDefaultPermissions,
  getAllPermissionKeys,
};
