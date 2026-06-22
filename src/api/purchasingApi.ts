import { api } from "./config";
export const getSuppliers = (params) => api.get("/suppliers", { params });
export const getSupplier = (id) => api.get(`/suppliers/${id}`);
export const createSupplier = (data) => api.post("/suppliers", data);
export const updateSupplier = (id, data) => api.patch(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);
export const importSuppliers = (formData) => api.post("/suppliers/import", formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getOrderRequests = (params) => api.get("/order-requests", { params });
export const createOrderRequest = (data) => api.post("/order-requests", data);
export const updateOrderRequest = (id, data) => api.patch(`/order-requests/${id}`, data);
export const deleteOrderRequest = (id) => api.delete(`/order-requests/${id}`);
export const cancelOrderRequest = (id) => api.patch(`/order-requests/${id}/status`, { status: "cancelled" });
export const getPendingOrderRequestCount = () => api.get("/order-requests/pending/count");
export const confirmDeliveryAction = (id) => api.post(`/order-requests/${id}/confirm`);

export const getApproveRequests = (params) => api.get("/approve-requests", { params });
export const updateApproveRequests = (id, data) => api.patch(`/approve-requests/${id}`, data);
export const deleteApproveRequest = (id) => api.delete(`/approve-requests/${id}`);

export const createPurchaseOrder = (data) => api.post("/purchase-orders", data);
export const getPurchaseOrders = (params) => api.get("/purchase-orders", { params });
export const downloadPurchaseOrderPdf = (id) => api.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' });
export const updatePurchaseOrderStatus = (id, status) => api.put(`/purchase-orders/${id}/status`, { status });
