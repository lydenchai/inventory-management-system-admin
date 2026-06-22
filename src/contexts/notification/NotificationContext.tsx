// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from "../../api";
import { useAuth } from "../auth/useAuth";
import { NotificationContextBase } from "./NotificationContextBase";

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res.data.data?.count || 0);
    } catch {
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    // Optionally, poll every 30s
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  const markAsRead = async (id) => {
    await markNotificationRead(id);
    fetchNotifications();
    fetchUnreadCount();
  };

  const markAllAsRead = async () => {
    await markAllNotificationsRead();
    fetchNotifications();
    fetchUnreadCount();
  };

  return (
    <NotificationContextBase.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContextBase.Provider>
  );
};

