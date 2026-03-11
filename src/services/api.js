import axios from "axios";

const api = axios.create({ 
  baseURL: process.env.REACT_APP_API_BASE_URL || "/api", 
  headers: { "Content-Type": "application/json" } 
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:  (data) => api.post("/auth/register",   data),
  verifyOTP: (data) => api.post("/auth/verify-otp", data),
  resendOTP: (data) => api.post("/auth/resend-otp", data),
  login:     (data) => api.post("/auth/login",      data),
  getMe:     ()     => api.get("/auth/me"),
};

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export const customerAPI = {
  getAll:  ()         => api.get("/customers"),
  getById: (id)       => api.get(`/customers/${id}`),
  create:  (data)     => api.post("/customers", data),
  update:  (id, data) => api.put(`/customers/${id}`, data),
  remove:  (id)       => api.delete(`/customers/${id}`),
};

// ─── FOLDERS & ITEMS ──────────────────────────────────────────────────────────
export const folderAPI = {
  getAll:  ()    => api.get("/folders"),
  create:  (data) => api.post("/folders", data),
  remove:  (id)   => api.delete(`/folders/${id}`),
  addItem: (folderId, itemData, imageFile) => {
    const form = new FormData();
    form.append("name",   itemData.name);
    form.append("weight", itemData.weight || "");
    form.append("desc",   itemData.desc   || "");
    if (imageFile) form.append("image", imageFile);
    return api.post(`/folders/${folderId}/items`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  removeItem: (folderId, itemId) => api.delete(`/folders/${folderId}/items/${itemId}`),
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orderAPI = {
  getAll:      ()                   => api.get("/orders"),
  getById:     (id)                 => api.get(`/orders/${id}`),
  create:      (data)               => api.post("/orders", data),
  updateStep:  (id, remainingGrams) => api.patch(`/orders/${id}/step`, { remainingGrams }),
  remove:      (id)                 => api.delete(`/orders/${id}`),
  getWastage:  ()                   => api.get("/orders/wastage"),
  saveBilling: (id, data)           => api.patch(`/orders/${id}/billing`, data),  // ← NEW
};

// ─── DIAMOND SHAPES ───────────────────────────────────────────────────────────
export const diamondAPI = {
  getAll:  ()         => api.get("/diamonds"),
  create:  (data)     => api.post("/diamonds", data),
  update:  (id, data) => api.put(`/diamonds/${id}`, data),
  remove:  (id)       => api.delete(`/diamonds/${id}`),
};

// ─── GOLD ENTRIES ─────────────────────────────────────────────────────────────
export const goldEntryAPI = {
  getByCustomer: (customerId) => api.get(`/gold-entries/customer/${customerId}`),
  getById:       (id)         => api.get(`/gold-entries/${id}`),
  create:        (data)       => api.post("/gold-entries", data),
  delete:        (id)         => api.delete(`/gold-entries/${id}`),
  pdfUrl:        (id)         => `/api/gold-entries/${id}/pdf`,
};

export default api;
