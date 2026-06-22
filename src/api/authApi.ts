import { api } from "./config";
export const getProfile = () => api.get("/auth/profile");
