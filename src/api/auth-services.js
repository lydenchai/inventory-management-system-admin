import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const auth = "auth";

// Create axios instance for auth with credentials
const authApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Login API
export const login = async (email, password) => {
  const response = await authApi.post(`${auth}/login`, { email, password });

  // Store tokens in localStorage as backup (cookies are httpOnly)
  if (response.data?.success && response.data.data) {
    localStorage.setItem("_t", response.data.data.access_token);
    localStorage.setItem("_r", response.data.data.refresh_token);
  }

  return response;
};

// Logout API
export const logout = () => authApi.post(`${auth}/logout`);

// Register API
export const register = (data) => authApi.post(`${auth}/register`, data);

// Refresh token API (now uses cookies)
export const refreshToken = () => authApi.post(`${auth}/refresh`);
