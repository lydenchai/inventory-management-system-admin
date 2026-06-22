import { api } from "./config";
export const getStocks = (params = {}) => api.get("/stocks", { params });
export const getStockSummary = (params = {}) => api.get("/stocks/summary", { params });
export const createStock = (data) => api.post("/stocks", data);
export const updateStock = (id, data) => api.put(`/stocks/${id}`, data);
export const deleteStock = (id) => api.delete(`/stocks/${id}`);

export const getStockTransfers = (params = {}) => api.get("/stock-transfers", { params });
export const createStockTransfer = (data) => api.post("/stock-transfers", data);

export const createLocation = (data) => api.post("/locations", data);
export const getLocations = (params) => api.get("/locations", { params });
export const updateLocation = (id, data) => api.put(`/locations/${id}`, data);
export const deleteLocation = (id) => api.delete(`/locations/${id}`);
