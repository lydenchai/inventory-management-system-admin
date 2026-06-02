import { useContext } from "react";
import { BadgeContextBase } from "./BadgeContextBase";

export const useBadge = () => useContext(BadgeContextBase);
