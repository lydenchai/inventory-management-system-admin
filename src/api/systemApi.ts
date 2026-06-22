import { api } from "./config";
import { PaginatedResponse, SingleResponse, User, Permission, Notification } from "../types/models";

export const getUsers = (params: any = {}) => api.get<PaginatedResponse<User>>("/users", { params });
export const getCustomers = () => api.get<PaginatedResponse<User>>("/users/customers");
export const getUser = (id: number | string) => api.get<SingleResponse<User>>(`/users/${id}`);
export const createUser = (data: Partial<User>) => api.post<SingleResponse<User>>("/users", data);
export const updateUser = (id: number | string, data: Partial<User>) => api.patch<SingleResponse<User>>(`/users/${id}`, data);
export const deleteUser = (id: number | string) => api.delete<SingleResponse<null>>(`/users/${id}`);
export const updateSelfProfile = (data: Partial<User>) => api.put<SingleResponse<User>>("/users/profile", data);
export const resetUserPassword = (id: number | string, password: string) => api.patch<SingleResponse<any>>(`/users/${id}/reset-password`, { password });

export const getPermissions = (params: any = {}) => api.get<PaginatedResponse<Permission>>("/permissions", { params });
export const createPermission = (data: Partial<Permission>) => api.post<SingleResponse<Permission>>("/permissions", data);
export const updatePermission = (id: number | string, data: Partial<Permission>) => api.patch<SingleResponse<Permission>>(`/permissions/${id}`, data);
export const deletePermission = (id: number | string) => api.delete<SingleResponse<null>>(`/permissions/${id}`);

export const getNotifications = () => api.get<PaginatedResponse<Notification>>("/notifications");
export const markNotificationRead = (id: number | string) => api.patch<SingleResponse<any>>(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch<SingleResponse<any>>("/notifications/read-all");
export const getUnreadNotificationCount = () => api.get<SingleResponse<{ count: number }>>("/notifications/unread/count");
