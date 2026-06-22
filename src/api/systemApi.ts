import { api } from "./config";
export const getUsers = (params = {}) => api.get("/users", { params });
export const getCustomers = () => api.get("/users/customers");
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post("/users", data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const updateSelfProfile = (data) => api.put("/users/profile", data);
export const resetUserPassword = (id, password) => api.patch(`/users/${id}/reset-password`, { password });

export const getPermissions = (params = {}) => api.get("/permissions", { params });
export const createPermission = (data) => api.post("/permissions", data);
export const updatePermission = (id, data) => api.patch(`/permissions/${id}`, data);
export const deletePermission = (id) => api.delete(`/permissions/${id}`);

export const getNotifications = () => api.get("/notifications");
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch("/notifications/read-all");
export const getUnreadNotificationCount = () => api.get("/notifications/unread/count");
