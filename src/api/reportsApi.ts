import { api } from "./config";
import { PaginatedResponse, SingleResponse, ActivityLog, OrderRequest } from "../types/models";

export const getInventorySummary = () => api.get<SingleResponse<any>>("/reports/inventory-summary");
export const getOrderStats = (params: any) => api.get<SingleResponse<any>>("/reports/order-stats", { params });
export const getTrends = (params: any) => api.get<SingleResponse<any>>("/reports/trends", { params });
export const getFinancialSummary = (params: any) => api.get<SingleResponse<any>>("/reports/financial-summary", { params });
export const getRecentOrders = () => api.get<PaginatedResponse<OrderRequest>>("/order-requests", { params: { limit: 5, page: 1, sort: "createdAt:desc" }});
export const getRecentActivity = () => api.get<PaginatedResponse<ActivityLog>>("/reports/activity-logs", { params: { limit: 5, page: 1 } });
export const getActivityLogs = (params: any = {}) => api.get<PaginatedResponse<ActivityLog>>("/reports/activity-logs", { params });
