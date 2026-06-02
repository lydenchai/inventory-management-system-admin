import React, { useState, useEffect, useCallback } from "react";
import { getPendingOrderRequestCount } from "../../api";
import { BadgeContextBase } from "./BadgeContextBase";
import { useAuth } from "../auth/useAuth";

export const BadgeProvider = ({ children }) => {
  const { user } = useAuth();
  const [approveBadge, setApproveBadge] = useState(0);

  const fetchBadge = useCallback(() => {
    if (!user) {
      setApproveBadge(0);
      return;
    }

    const userRole = user.role?.toLowerCase();
    if (
      (user.permission?.permissions?.includes("view_order_request") &&
        user.permission?.permissions?.includes("view_approve_request")) ||
      user.permission?.permissions?.includes("update_approve_request") ||
      userRole === "admin"
    ) {
      getPendingOrderRequestCount()
        .then((res) => {
          if (res.data && res.data.count >= 0) {
            setApproveBadge(res.data.count);
          }
        })
        .catch(() => setApproveBadge(0));
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      fetchBadge();
    })();
    const interval = setInterval(fetchBadge, 15000);
    return () => clearInterval(interval);
  }, [fetchBadge]);

  return (
    <BadgeContextBase.Provider value={{ approveBadge, fetchBadge }}>
      {children}
    </BadgeContextBase.Provider>
  );
};
