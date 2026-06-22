import { api } from "./config";
import { PaginatedResponse, SingleResponse, Product, Category } from "../types/models";

export const getProducts = (params: any) => api.get<PaginatedResponse<Product>>("/products", { params });
export const getProduct = (id: number | string) => api.get<SingleResponse<Product>>(`/products/${id}`);
export const createProduct = (data: Partial<Product>) => api.post<SingleResponse<Product>>("/products", data);
export const updateProduct = (id: number | string, data: Partial<Product>) => api.patch<SingleResponse<Product>>(`/products/${id}`, data);
export const deleteProduct = (id: number | string) => api.delete<SingleResponse<null>>(`/products/${id}`);
export const importProducts = (formData: FormData) => api.post<SingleResponse<any>>("/products/import", formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getCategories = (params: any = {}) => api.get<PaginatedResponse<Category>>("/categories", { params });
export const createCategory = (data: Partial<Category>) => api.post<SingleResponse<Category>>("/categories", data);
export const updateCategory = (id: number | string, data: Partial<Category>) => api.patch<SingleResponse<Category>>(`/categories/${id}`, data);
export const deleteCategory = (id: number | string) => api.delete<SingleResponse<null>>(`/categories/${id}`);
