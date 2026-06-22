// @ts-nocheck
import { useContext } from "react";
import { CartContextBase } from "./CartContextBase";

export const useCart = () => useContext(CartContextBase);

