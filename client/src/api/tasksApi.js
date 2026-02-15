import api from './axios';

const tasksApi = {
  // جلب جميع المهام مع فلاتر
  getTasks: (params = {}) => api.get('/tasks', { params }),

  // جلب مهمة واحدة
  getTask: (id) => api.get(`/tasks/${id}`),

  // جلب إحصائيات المهام
  getStats: () => api.get('/tasks/stats'),

  // جلب إحصائيات المهام للوحة التحكم
  getDashboardStats: () => api.get('/tasks/dashboard-stats'),

  // جلب مهام الموظف الحالي
  getMyTasks: (params = {}) => api.get('/tasks/my-tasks', { params }),

  // جلب المهمة المرتبطة بموعد
  getTaskByAppointment: (appointmentId) => api.get(`/tasks/by-appointment/${appointmentId}`),

  // بدء العمل على مهمة
  startTask: (id) => api.put(`/tasks/${id}/start`),

  // إكمال مهمة
  completeTask: (id) => api.put(`/tasks/${id}/complete`),

  // إلغاء مهمة
  cancelTask: (id, reason) => api.put(`/tasks/${id}/cancel`, { reason }),

  // تحويل مهمة لموظف آخر
  transferTask: (id, data) => api.put(`/tasks/${id}/transfer`, data),

  // إضافة ملاحظة للمهمة
  addNote: (id, content) => api.post(`/tasks/${id}/notes`, { content }),

  // إضافة مرفق للمهمة
  addAttachment: (id, formData) => api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // جلب النشاطات الأخيرة للمهام
  getRecentActivities: (limit = 10) => api.get('/tasks/recent-activities', { params: { limit } })
};

export default tasksApi;
