import { createContext } from "react";
import api from "../../api";

export const AuthContextBase = createContext();

export const createUser = (data) => api.post("/users", data);
