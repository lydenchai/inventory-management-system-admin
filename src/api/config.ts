// @ts-nocheck
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const access_token = localStorage.getItem("_t");
  if (access_token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest.url === "/auth/refresh") return Promise.reject(error);

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await api.post("/auth/refresh");
        if (res.data && res.data.success && res.data.data.access_token) {
          localStorage.setItem("_t", res.data.data.access_token);
          return api(originalRequest);
        }
      } catch (err) {
        localStorage.removeItem("_t");
        localStorage.removeItem("_r");
        localStorage.removeItem("_u");
        sessionStorage.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const access_token = localStorage.getItem("_t");
  const headers = { "Content-Type": "multipart/form-data" };
  if (access_token) headers["Authorization"] = `Bearer ${access_token}`;
  return axios.post(`${API_BASE}/upload`, formData, { headers });
};
