// @ts-nocheck
import axios from "axios";

// NOTE
// _t = access_token
// _r = refresh_token
// _u = user info

// Base API URL from environment variables
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with base URL and auth header
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send cookies with requests
});

// Request interceptor to add auth token (fallback for localStorage if cookies fail)
api.interceptors.request.use((config) => {
  // Only add Authorization header if not using cookies
  // Cookies are sent automatically with withCredentials: true
  const access_token = localStorage.getItem("_t");
  if (access_token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

// Response interceptor for auto-refresh and auto logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop if the refresh token request itself fails with 401
    if (originalRequest.url === "/auth/refresh") {
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // Try to refresh token using cookies (server handles refresh)
        const res = await api.post("/auth/refresh");

        if (res.data && res.data.success && res.data.data.access_token) {
          // Store new access token in localStorage as backup
          localStorage.setItem("_t", res.data.data.access_token);

          // Retry original request (cookies will be sent automatically)
          return api(originalRequest);
        }
      } catch (err) {
        // Refresh failed, auto logout
        localStorage.removeItem("_t");
        localStorage.removeItem("_r");
        localStorage.removeItem("_u");
        sessionStorage.clear();

        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);

const profile = "/auth/profile";
const products = "/products";
const categories = "/categories";
const suppliers = "/suppliers";
const stocks = "/stocks";
const orderRequests = "/order-requests";
const approveRequests = "/approve-requests";
const sales = "/sales";
const inventorySummary = "/reports/inventory-summary";
const orderStats = "/reports/order-stats";
const activityLogs = "/reports/activity-logs";
const trends = "/reports/trends";
const permissions = "/permissions";
const users = "/users";
const stockTransfers = "/stock-transfers";

// Notifications
const notifications = "/notifications";
export const getNotifications = () => api.get(notifications);
export const markNotificationRead = (id) => api.patch(`${notifications}/${id}/read`);
export const markAllNotificationsRead = () => api.patch(`${notifications}/read-all`);
export const getUnreadNotificationCount = () => api.get(`${notifications}/unread/count`);

// Get current user profile
export const getProfile = () => api.get(profile);

// Dashboard Report
export const getInventorySummary = () => api.get(inventorySummary);
export const getOrderStats = (params) => api.get(orderStats, { params });
export const getTrends = (params) => api.get(trends, { params });
export const getFinancialSummary = (params) => api.get("/reports/financial-summary", { params });
export const getRecentOrders = () => api.get(orderRequests, { params: { limit: 5, page: 1, sort: "createdAt:desc" }});
export const getRecentActivity = () => api.get(activityLogs, { params: { limit: 5, page: 1 } });

// Product CRUD
export const getProducts = (params) => api.get(products, { params });
export const getProduct = (id) => api.get(`${products}/${id}`);
export const createProduct = (data) => api.post(products, data);
export const updateProduct = (id, data) => api.patch(`${products}/${id}`, data);
export const deleteProduct = (id) => api.delete(`${products}/${id}`);
export const importProducts = (formData) => api.post(`${products}/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Category CRUD
export const getCategories = (params = {}) => api.get(categories, { params });
export const createCategory = (data) => api.post(categories, data);
export const updateCategory = (id, data) => api.patch(`${categories}/${id}`, data);
export const deleteCategory = (id) => api.delete(`${categories}/${id}`);

// Get Supplier
export const getSuppliers = (params) => api.get(suppliers, { params });
export const getSupplier = (id) => api.get(`${suppliers}/${id}`);
export const createSupplier = (data) => api.post(suppliers, data);
export const updateSupplier = (id, data) => api.patch(`${suppliers}/${id}`, data);
export const deleteSupplier = (id) => api.delete(`${suppliers}/${id}`);
export const importSuppliers = (formData) => api.post(`${suppliers}/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Order request CRUD for current user
export const getOrderRequests = (params) => api.get(orderRequests, { params });
export const createOrderRequest = (data) => api.post(orderRequests, data);
export const updateOrderRequest = (id, data) => api.patch(`${orderRequests}/${id}`, data);
export const deleteOrderRequest = (id) => api.delete(`${orderRequests}/${id}`);
export const cancelOrderRequest = (id) => api.patch(`${orderRequests}/${id}/status`, { status: "cancelled" });

// Get count of order requests needing approval (pending or rejected)
export const getPendingOrderRequestCount = () => api.get(`${orderRequests}/pending/count`);

// Approve order requests
export const getApproveRequests = (params) => api.get(approveRequests, { params });
export const updateApproveRequests = (id, data) => api.patch(`${approveRequests}/${id}`, data);
export const deleteApproveRequest = (id) => api.delete(`${approveRequests}/${id}`);

// Confirm delivery (via Order Requests)
// getConfirmDeliveries is replaced by getOrderRequests with status filtering in the component
export const confirmDeliveryAction = (id) => api.post(`${orderRequests}/${id}/confirm`);

// Sales
export const getSales = (params = {}) => api.get(sales, { params });
export const createSale = (data) => api.post(sales, data);
export const updateSale = (id, data) => api.patch(`/sales/${id}`, data);
export const deleteSale = (id) => api.delete(`/sales/${id}`);
export const getSalesSummary = () => api.get("/sales/summary");

// Stocks
export const getStocks = (params = {}) => api.get(stocks, { params });
export const getStockSummary = (params = {}) => api.get(`${stocks}/summary`, { params });
export const createStock = (data) => api.post(stocks, data);
export const updateStock = (id, data) => api.put(`${stocks}/${id}`, data);
export const deleteStock = (id) => api.delete(`${stocks}/${id}`);

// Locations
export const createLocation = (data) => api.post("/locations", data);
export const getLocations = (params) => api.get("/locations", { params });
export const updateLocation = (id, data) => api.put(`/locations/${id}`, data);
export const deleteLocation = (id) => api.delete(`/locations/${id}`);

// Purchase Orders
export const createPurchaseOrder = (data) => api.post("/purchase-orders", data);
export const getPurchaseOrders = (params) => api.get("/purchase-orders", { params });
export const downloadPurchaseOrderPdf = (id) => api.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' });
export const updatePurchaseOrderStatus = (id, status) => api.put(`/purchase-orders/${id}/status`, { status });

// Returns
export const createReturn = (data) => api.post("/returns", data);
export const getReturns = (params) => api.get("/returns", { params });

// Stock Transfers
export const getStockTransfers = (params = {}) => api.get(stockTransfers, { params });
export const createStockTransfer = (data) => api.post(stockTransfers, data);

// Activity Logs
export const getActivityLogs = (params = {}) => api.get(activityLogs, { params });

// Permission CRUD
export const getPermissions = (params = {}) => api.get(permissions, { params });
export const createPermission = (data) => api.post(permissions, data);
export const updatePermission = (id, data) => api.patch(`${permissions}/${id}`, data);
export const deletePermission = (id) => api.delete(`${permissions}/${id}`);

// User CRUD
export const getUsers = (params = {}) => api.get(users, { params });
export const getCustomers = () => api.get(`${users}/customers`);
export const getUser = (id) => api.get(`${users}/${id}`);
export const createUser = (data) => api.post(users, data);
export const updateUser = (id, data) => api.patch(`${users}/${id}`, data);
export const deleteUser = (id) => api.delete(`${users}/${id}`);
export const updateSelfProfile = (data) => api.put("/users/profile", data);
export const resetUserPassword = (id, password) => api.patch(`/users/${id}/reset-password`, { password });

// Expense CRUD
const expenses = "/expenses";
export const getExpenses = (params = {}) => api.get(expenses, { params });
export const createExpense = (data) => api.post(expenses, data);
export const updateExpense = (id, data) => api.patch(`${expenses}/${id}`, data);
export const deleteExpense = (id) => api.delete(`${expenses}/${id}`);

// Upload File — uses plain axios (no auth interceptors) so unauthenticated
// callers (e.g. the Register page) don't trigger the auto-logout on errors.
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const access_token = localStorage.getItem("_t");
  const headers = { "Content-Type": "multipart/form-data" };
  if (access_token) headers["Authorization"] = `Bearer ${access_token}`;
  return axios.post(`${API_BASE}/upload`, formData, { headers });
};
export default api;

