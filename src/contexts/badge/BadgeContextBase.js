import { createContext } from "react";

export const BadgeContextBase = createContext({
  approveBadge: 0,
  fetchBadge: () => {},
});
