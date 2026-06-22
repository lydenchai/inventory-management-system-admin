import { api } from "./config";
import { PaginatedResponse, SingleResponse, Sale, Expense, Return } from "../types/models";

export const getSales = (params: any = {}) => api.get<PaginatedResponse<Sale>>("/sales", { params });
export const createSale = (data: Partial<Sale>) => api.post<SingleResponse<Sale>>("/sales", data);
export const updateSale = (id: number | string, data: Partial<Sale>) => api.patch<SingleResponse<Sale>>(`/sales/${id}`, data);
export const deleteSale = (id: number | string) => api.delete<SingleResponse<null>>(`/sales/${id}`);
export const getSalesSummary = () => api.get<SingleResponse<any>>("/sales/summary");

export const createReturn = (data: Partial<Return>) => api.post<SingleResponse<Return>>("/returns", data);
export const getReturns = (params: any) => api.get<PaginatedResponse<Return>>("/returns", { params });

export const getExpenses = (params: any = {}) => api.get<PaginatedResponse<Expense>>("/expenses", { params });
export const createExpense = (data: Partial<Expense>) => api.post<SingleResponse<Expense>>("/expenses", data);
export const updateExpense = (id: number | string, data: Partial<Expense>) => api.patch<SingleResponse<Expense>>(`/expenses/${id}`, data);
export const deleteExpense = (id: number | string) => api.delete<SingleResponse<null>>(`/expenses/${id}`);
