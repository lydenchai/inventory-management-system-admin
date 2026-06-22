import { api } from "./config";
export const getInventorySummary = () => api.get("/reports/inventory-summary");
export const getOrderStats = (params) => api.get("/reports/order-stats", { params });
export const getTrends = (params) => api.get("/reports/trends", { params });
export const getFinancialSummary = (params) => api.get("/reports/financial-summary", { params });
export const getRecentOrders = () => api.get("/order-requests", { params: { limit: 5, page: 1, sort: "createdAt:desc" }});
export const getRecentActivity = () => api.get("/reports/activity-logs", { params: { limit: 5, page: 1 } });
export const getActivityLogs = (params = {}) => api.get("/reports/activity-logs", { params });
