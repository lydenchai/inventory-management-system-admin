import { useContext } from "react";
import { NotificationContextBase } from "./NotificationContextBase";

export const useNotification = () => useContext(NotificationContextBase);
