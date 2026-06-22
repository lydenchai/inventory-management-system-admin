import { api } from "./config";
import { SingleResponse, User } from "../types/models";

export const getProfile = () => api.get<SingleResponse<User>>("/auth/profile");
