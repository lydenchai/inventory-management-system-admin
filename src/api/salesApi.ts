import { api } from "./config";
export const getSales = (params = {}) => api.get("/sales", { params });
export const createSale = (data) => api.post("/sales", data);
export const updateSale = (id, data) => api.patch(`/sales/${id}`, data);
export const deleteSale = (id) => api.delete(`/sales/${id}`);
export const getSalesSummary = () => api.get("/sales/summary");

export const createReturn = (data) => api.post("/returns", data);
export const getReturns = (params) => api.get("/returns", { params });

export const getExpenses = (params = {}) => api.get("/expenses", { params });
export const createExpense = (data) => api.post("/expenses", data);
export const updateExpense = (id, data) => api.patch(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
