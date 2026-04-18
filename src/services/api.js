import axios from "axios";

const api = axios.create({ baseURL: process.env.REACT_APP_API_BASE_URL || "/api", headers: { "Content-Type": "application/json" } });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth (login only — no register) ──────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  getMe: ()     => api.get("/auth/me"),
};

// ── Host API (uses separate host token stored as hostToken) ───────────────────
const hostApi = axios.create({ baseURL: "/api/host", headers: { "Content-Type": "application/json" } });
hostApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("hostToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const hostAPI = {
  login:           (data)     => hostApi.post("/login", data),
  getAdmins:       ()         => hostApi.get("/admins"),
  createAdmin:     (data)     => hostApi.post("/admins", data),
  getAllUsers:      ()         => hostApi.get("/users"),
  toggleActive:    (id)       => hostApi.patch(`/users/${id}/toggle-active`),
  resetPassword:   (id, data) => hostApi.patch(`/users/${id}/reset-password`, data),
  updatePerms:     (id, data) => hostApi.patch(`/users/${id}/permissions`, data),
  deleteUser:      (id)       => hostApi.delete(`/users/${id}`),
};

// ── Admin API (manages own team) ──────────────────────────────────────────────
export const adminAPI = {
  getPermissions:  ()         => api.get("/admin/permissions"),
  getTeam:         ()         => api.get("/admin/team"),
  createMember:    (data)     => api.post("/admin/team", data),
  updateMember:    (id, data) => api.put(`/admin/team/${id}`, data),
  resetPassword:   (id, data) => api.patch(`/admin/team/${id}/password`, data),
  deleteMember:    (id)       => api.delete(`/admin/team/${id}`),
};

export const customerAPI = {
  getAll:  ()         => api.get("/customers"),
  getById: (id)       => api.get(`/customers/${id}`),
  create:  (data)     => api.post("/customers", data),
  update:  (id, data) => api.put(`/customers/${id}`, data),
  remove:  (id)       => api.delete(`/customers/${id}`),
};

export const folderAPI = {
  getAll:  ()     => api.get("/folders"),
  create:  (data) => api.post("/folders", data),
  remove:  (id)   => api.delete(`/folders/${id}`),
  addItem: (folderId, itemData, imageFile) => {
    const form = new FormData();
    ["name","weight","netWeight","purity","tone","gender","designedBy","desc"].forEach(k =>
      form.append(k, itemData[k] || "")
    );
    form.append("diamonds", JSON.stringify(itemData.diamonds || []));
    if (imageFile) form.append("image", imageFile);
    return api.post(`/folders/${folderId}/items`, form, { headers:{ "Content-Type":"multipart/form-data" } });
  },
  removeItem: (folderId, itemId) => api.delete(`/folders/${folderId}/items/${itemId}`),
};

export const orderAPI = {
  getAll:       ()     => api.get("/orders"),
  getById:      (id)   => api.get(`/orders/${id}`),
  create:       (data) => api.post("/orders", data),
  remove:       (id)   => api.delete(`/orders/${id}`),
  getWastage:   ()     => api.get("/orders/wastage"),
  saveBilling:  (id, data) => api.patch(`/orders/${id}/billing`, data),
  getOwner:     ()     => api.get("/orders/owner"),
  markSubStep:  (id, subStep)        => api.patch(`/orders/${id}/step`, { action:"substep", subStep }),
  castingStep:  (id, castingGrams)   => api.patch(`/orders/${id}/step`, { action:"casting", castingGrams }),
  completeStep: (id, remainingGrams) => api.patch(`/orders/${id}/step`, { action:"complete", remainingGrams }),
  updateStep:   (id, remainingGrams) => api.patch(`/orders/${id}/step`, { remainingGrams }),
};

export const diamondAPI = {
  getAll:  ()         => api.get("/diamonds"),
  create:  (data)     => api.post("/diamonds", data),
  update:  (id, data) => api.put(`/diamonds/${id}`, data),
  remove:  (id)       => api.delete(`/diamonds/${id}`),
};

export const diamondFolderAPI = {
  getAll:        ()                    => api.get("/diamond-folders"),
  create:        (data)                => api.post("/diamond-folders", data),
  remove:        (id)                  => api.delete(`/diamond-folders/${id}`),
  addDiamond:    (folderId, data)      => api.post(`/diamond-folders/${folderId}/diamonds`, data),
  updateDiamond: (folderId, dId, data) => api.put(`/diamond-folders/${folderId}/diamonds/${dId}`, data),
  removeDiamond: (folderId, dId)       => api.delete(`/diamond-folders/${folderId}/diamonds/${dId}`),
};

export const goldEntryAPI = {
  getByCustomer: (id) => api.get(`/gold-entries/customer/${id}`),
  getById:       (id) => api.get(`/gold-entries/${id}`),
  create:        (d)  => api.post("/gold-entries", d),
  delete:        (id) => api.delete(`/gold-entries/${id}`),
};

export const goldRecoveryAPI = {
  getAll: ()     => api.get("/gold-recovery"),
  create: (data) => api.post("/gold-recovery", data),
  remove: (id)   => api.delete(`/gold-recovery/${id}`),
};

export default api;
