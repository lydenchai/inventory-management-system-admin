import { api } from "./config";
export const getProducts = (params) => api.get("/products", { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const importProducts = (formData) => api.post("/products/import", formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getCategories = (params = {}) => api.get("/categories", { params });
export const createCategory = (data) => api.post("/categories", data);
export const updateCategory = (id, data) => api.patch(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
