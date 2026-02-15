import api from './axios';

const auditApi = {
  // الحصول على سجل التدقيق
  getLogs: (params) => api.get('/audit', { params }),
  getAuditLogs: (params) => api.get('/audit', { params }),

  // الحصول على سجل كيان معين
  getEntityLogs: (entityType, entityId, params) =>
    api.get(`/audit/entity/${entityType}/${entityId}`, { params }),

  // الحصول على نشاط مستخدم
  getUserActivity: (userId, params) =>
    api.get(`/audit/user/${userId}`, { params }),

  // آخر الأنشطة
  getRecentActivity: (params) => api.get('/audit/recent', { params }),

  // إحصائيات التدقيق
  getStats: (params) => api.get('/audit/stats', { params }),

  // البحث في السجل
  search: (params) => api.get('/audit/search', { params })
};

export default auditApi;
