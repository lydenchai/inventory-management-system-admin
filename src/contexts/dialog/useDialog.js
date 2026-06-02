import { useContext } from "react";
import { DialogContextBase } from "./DialogContextBase.js";

export function useDialog() {
  return useContext(DialogContextBase);
}
