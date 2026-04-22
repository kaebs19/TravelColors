import axios from './axios';

export const getAppointments = (params) => axios.get('/appointments', { params });

export const getAppointment = (id) => axios.get(`/appointments/${id}`);

export const createAppointment = (data) => {
  // إذا كان هناك ملفات جديدة، إرسال FormData
  if (data.newFiles && data.newFiles.length > 0) {
    const formData = new FormData();

    // إضافة الحقول النصية
    const fields = [
      'type', 'customerName', 'customer', 'phone', 'personsCount',
      'isSubmission', 'isVIP', 'appointmentDate', 'appointmentTime',
      'duration', 'dateFrom', 'dateTo', 'reminderDate', 'reminderTime',
      'department', 'city', 'notes', 'paymentType', 'totalAmount',
      'paidAmount', 'visibility', 'reminderEnabled', 'createdBy',
      'reminderType', 'emailNotification'
    ];

    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        formData.append(field, data[field]);
      }
    });

    // المهام الفرعية — ترسل كـ JSON string لأنها مصفوفة
    if (Array.isArray(data.subTasks)) {
      formData.append('subTasks', JSON.stringify(data.subTasks));
    }

    // إضافة الملفات
    data.newFiles.forEach(file => {
      formData.append('attachments', file);
    });

    return axios.post('/appointments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  // بدون ملفات، إرسال JSON عادي
  const cleanData = { ...data };
  delete cleanData.newFiles;
  delete cleanData.existingAttachments;
  return axios.post('/appointments', cleanData);
};

export const updateAppointment = (id, data) => axios.put(`/appointments/${id}`, data);

export const deleteAppointment = (id) => axios.delete(`/appointments/${id}`);

export const changeStatus = (id, status) => axios.put(`/appointments/${id}/status`, { status });

export const getTodayAppointments = () => axios.get('/appointments/today');

export const getStats = () => axios.get('/appointments/stats');

export const getDashboardStats = () => axios.get('/appointments/dashboard-stats');

export const logQuickUpdate = (id, data) => axios.post(`/appointments/${id}/log-quick-update`, data);

export const getOverdueElectronic = () => axios.get('/appointments/overdue-electronic');

export const addAttachments = (id, formData) =>
  axios.post(`/appointments/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteAttachment = (id, attachmentId) =>
  axios.delete(`/appointments/${id}/attachments/${attachmentId}`);

export const addPayment = (id, data) => axios.post(`/appointments/${id}/payment`, data);

export default {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  changeStatus,
  getTodayAppointments,
  getStats,
  getDashboardStats,
  logQuickUpdate,
  addAttachments,
  deleteAttachment,
  addPayment
};
