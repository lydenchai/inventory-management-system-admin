// @ts-nocheck
import { useContext } from "react";
import { AuthContextBase } from "./AuthContextBase";

export const useAuth = () => useContext(AuthContextBase);

