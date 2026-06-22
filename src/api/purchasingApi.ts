import { api } from "./config";
import { PaginatedResponse, SingleResponse, Supplier, OrderRequest, PurchaseOrder } from "../types/models";
import { OrderStatus } from "../types/enums";

export const getSuppliers = (params: any) => api.get<PaginatedResponse<Supplier>>("/suppliers", { params });
export const getSupplier = (id: number | string) => api.get<SingleResponse<Supplier>>(`/suppliers/${id}`);
export const createSupplier = (data: Partial<Supplier>) => api.post<SingleResponse<Supplier>>("/suppliers", data);
export const updateSupplier = (id: number | string, data: Partial<Supplier>) => api.patch<SingleResponse<Supplier>>(`/suppliers/${id}`, data);
export const deleteSupplier = (id: number | string) => api.delete<SingleResponse<null>>(`/suppliers/${id}`);
export const importSuppliers = (formData: FormData) => api.post<SingleResponse<any>>("/suppliers/import", formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getOrderRequests = (params: any) => api.get<PaginatedResponse<OrderRequest>>("/order-requests", { params });
export const createOrderRequest = (data: Partial<OrderRequest>) => api.post<SingleResponse<OrderRequest>>("/order-requests", data);
export const updateOrderRequest = (id: number | string, data: Partial<OrderRequest>) => api.patch<SingleResponse<OrderRequest>>(`/order-requests/${id}`, data);
export const deleteOrderRequest = (id: number | string) => api.delete<SingleResponse<null>>(`/order-requests/${id}`);
export const cancelOrderRequest = (id: number | string) => api.patch<SingleResponse<OrderRequest>>(`/order-requests/${id}/status`, { status: OrderStatus.CANCELLED });
export const getPendingOrderRequestCount = () => api.get<SingleResponse<{ count: number }>>("/order-requests/pending/count");
export const confirmDeliveryAction = (id: number | string) => api.post<SingleResponse<any>>(`/order-requests/${id}/confirm`);

export const getApproveRequests = (params: any) => api.get<PaginatedResponse<OrderRequest>>("/approve-requests", { params });
export const updateApproveRequests = (id: number | string, data: Partial<OrderRequest>) => api.patch<SingleResponse<OrderRequest>>(`/approve-requests/${id}`, data);
export const deleteApproveRequest = (id: number | string) => api.delete<SingleResponse<null>>(`/approve-requests/${id}`);

export const createPurchaseOrder = (data: Partial<PurchaseOrder>) => api.post<SingleResponse<PurchaseOrder>>("/purchase-orders", data);
export const getPurchaseOrders = (params: any) => api.get<PaginatedResponse<PurchaseOrder>>("/purchase-orders", { params });
export const downloadPurchaseOrderPdf = (id: number | string) => api.get<Blob>(`/purchase-orders/${id}/pdf`, { responseType: 'blob' });
export const updatePurchaseOrderStatus = (id: number | string, status: OrderStatus) => api.put<SingleResponse<PurchaseOrder>>(`/purchase-orders/${id}/status`, { status });
