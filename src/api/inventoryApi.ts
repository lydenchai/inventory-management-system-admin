import { api } from "./config";
import { PaginatedResponse, SingleResponse, Stock, Location, StockTransfer } from "../types/models";

export const getStocks = (params: any = {}) => api.get<PaginatedResponse<Stock>>("/stocks", { params });
export const getStockSummary = (params: any = {}) => api.get<SingleResponse<any>>("/stocks/summary", { params });
export const createStock = (data: Partial<Stock>) => api.post<SingleResponse<Stock>>("/stocks", data);
export const updateStock = (id: number | string, data: Partial<Stock>) => api.put<SingleResponse<Stock>>(`/stocks/${id}`, data);
export const deleteStock = (id: number | string) => api.delete<SingleResponse<null>>(`/stocks/${id}`);

export const getStockTransfers = (params: any = {}) => api.get<PaginatedResponse<StockTransfer>>("/stock-transfers", { params });
export const createStockTransfer = (data: Partial<StockTransfer>) => api.post<SingleResponse<StockTransfer>>("/stock-transfers", data);

export const createLocation = (data: Partial<Location>) => api.post<SingleResponse<Location>>("/locations", data);
export const getLocations = (params: any) => api.get<PaginatedResponse<Location>>("/locations", { params });
export const updateLocation = (id: number | string, data: Partial<Location>) => api.put<SingleResponse<Location>>(`/locations/${id}`, data);
export const deleteLocation = (id: number | string) => api.delete<SingleResponse<null>>(`/locations/${id}`);
