import api from '@/lib/api';

export const authService = {
  register: (d: any) => api.post('/auth/register/', d),
  verifyEmail: (token: string) => api.post('/auth/verify-email/', { token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (d: any) => api.post('/auth/reset-password/', d),
  changePassword: (d: any) => api.post('/auth/change-password/', d),
  updateProfile: (d: any) => api.patch('/auth/profile/', d),
  getProfile: () => api.get('/auth/profile/'),
  getAdminUsers: () => api.get('/auth/admin/'),
  createAdminUser: (data: any) => api.post('/auth/admin/', data),
  updateAdminUser: (id: string, data: any) => api.patch(`/auth/admin/${id}/`, data),
  deleteAdminUser: (id: string) => api.delete(`/auth/admin/${id}/`),
  verifyDeviceOtp: (device_id: string, otp: string) => api.post('/auth/verify-device/', { device_id, otp }),
};

export const courseService = {
  getCourses: (params?: { category?: string }) => api.get('/courses/', { params }),
  getCourse: (id: string) => api.get(`/courses/${id}/`),
  getLesson: (id: string) => api.get(`/courses/lessons/${id}/`),
  submitExam: (id: string, answers: number[]) => api.post(`/courses/exams/${id}/submit/`, { answers }),
  downloadCertificate: (courseId: string) => api.get(`/courses/${courseId}/certificate/`, { responseType: 'blob' }),
  importCourse: (data: any) => api.post('/courses/import/', data),
  getAdminCourses: () => api.get('/courses/admin/'),
  createAdminCourse: (data: any) => api.post('/courses/admin/', data),
  updateAdminCourse: (id: string, data: any) => api.patch(`/courses/admin/${id}/`, data),
  deleteAdminCourse: (id: string) => api.delete(`/courses/admin/${id}/`),
  exportAdminCourseJson: (id: string) => api.get(`/courses/admin/${id}/export-json/`),
  updateAdminCourseJson: (id: string, data: any) => api.post(`/courses/admin/${id}/update-json/`, data),
  // Modules CRUD
  createAdminModule: (data: any) => api.post('/courses/admin/modules/', data),
  updateAdminModule: (id: string, data: any) => api.patch(`/courses/admin/modules/${id}/`, data),
  deleteAdminModule: (id: string) => api.delete(`/courses/admin/modules/${id}/`),
  // Lessons CRUD
  createAdminLesson: (data: any) => api.post('/courses/admin/lessons/', data),
  updateAdminLesson: (id: string, data: any) => api.patch(`/courses/admin/lessons/${id}/`, data),
  deleteAdminLesson: (id: string) => api.delete(`/courses/admin/lessons/${id}/`),
  // Sections CRUD
  createAdminSection: (data: any) => api.post('/courses/admin/sections/', data),
  updateAdminSection: (id: string, data: any) => api.patch(`/courses/admin/sections/${id}/`, data),
  deleteAdminSection: (id: string) => api.delete(`/courses/admin/sections/${id}/`),
};

export const executionService = {
  runC: (code: string, extra_files?: Record<string, string>) =>
    api.post('/execute/c/', { code, extra_files }),
  saveCode: (d: any) => api.post('/code-sessions/save/', d),
  getCode: (p: any) => api.get('/code-sessions/get/', { params: p }),
};

export const fileService = {
  listFiles: (lesson_id?: string) => api.get('/code-sessions/files/', { params: lesson_id ? { lesson_id } : {} }),
  createNode: (d: any) => api.post('/code-sessions/files/create/', d),
  updateNode: (id: string, d: any) => api.put(`/code-sessions/files/${id}/`, d),
  deleteNode: (id: string) => api.delete(`/code-sessions/files/${id}/`),
};

export const paymentService = {
  initiate: (course_id: string, phone_number: string, gateway?: string) =>
    api.post('/payments/initiate/', { course_id, phone_number, gateway }),
  getMyPurchases: () => api.get('/payments/my-purchases/'),
  getSubscriptionPrice: () => api.get('/payments/subscription/price/'),
  initiateSubscription: (phone: string, gateway: string) =>
    api.post('/payments/subscription/initiate/', { phone, gateway }),
  getSubscriptionStatus: () => api.get('/payments/subscription/status/'),
};


export const progressService = {
  markComplete: (lesson_id: string) => api.post(`/progress/lessons/${lesson_id}/complete/`),
  getCourseProgress: (course_id: string) => api.get(`/progress/courses/${course_id}/`),
  getMyProgress: () => api.get('/progress/mine/'),
};

export const mysqlLabService = {
  startSession: () => api.post('/mysql_lab/start/'),
  resetSession: () => api.post('/mysql_lab/reset/'),
  status: () => api.get('/mysql_lab/status/'),
};
