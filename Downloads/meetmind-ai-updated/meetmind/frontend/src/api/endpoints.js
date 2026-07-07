import api from "./client";

// ---------- Auth ----------
export const authApi = {
  signup: (data) => api.post("/auth/signup", data),
  signin: (data) => api.post("/auth/signin", data),
  google: (credential) => api.post("/auth/google", { credential }),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// ---------- Contacts ----------
export const contactsApi = {
  list: (params) => api.get("/contacts", { params }),
  get: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post("/contacts", data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  remove: (id) => api.delete(`/contacts/${id}`),
};

// ---------- Meetings ----------
export const meetingsApi = {
  list: (params) => api.get("/meetings", { params }),
  get: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post("/meetings", data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  remove: (id) => api.delete(`/meetings/${id}`),
  createFromVoice: (formData) =>
    api.post("/meetings/voice", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ---------- AI ----------
export const aiApi = {
  intelligence: (contactId) => api.get(`/ai/intelligence/${contactId}`),
  meetingPrep: (contactId) => api.get(`/ai/meeting-prep/${contactId}`),
  brief: (contactId) => api.get(`/ai/brief/${contactId}`),
  exportBriefPdf: (contactId) =>
    api.get(`/ai/brief/${contactId}/export`, { responseType: "blob" }),
  search: (query) => api.post("/ai/search", { query }),
};

// ---------- Commitments ----------
export const commitmentsApi = {
  list: (params) => api.get("/commitments", { params }),
  create: (data) => api.post("/commitments", data),
  update: (id, data) => api.patch(`/commitments/${id}`, data),
  remove: (id) => api.delete(`/commitments/${id}`),
};

// ---------- Reminders ----------
export const remindersApi = {
  list: () => api.get("/reminders"),
  create: (data) => api.post("/reminders", data),
  update: (id, data) => api.patch(`/reminders/${id}`, data),
  remove: (id) => api.delete(`/reminders/${id}`),
};

// ---------- Dashboard ----------
export const dashboardApi = {
  summary: () => api.get("/dashboard"),
};

// ---------- Notifications ----------
export const notificationsApi = {
  checkNow: () => api.post("/notifications/check-now"),
};