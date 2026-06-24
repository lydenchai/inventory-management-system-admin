// @ts-nocheck
import React, { useState, useCallback } from "react";
import Dialog from "../../components/ui/Dialog";
import { DialogContextBase } from "./DialogContextBase";

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState({ open: false });
  // Promise-based ask dialog
  const ask = useCallback((options) => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.location.pathname === "/login") {
        // Suppress dialog on login page
        resolve(false);
        return;
      }
      setDialog({
        open: true,
        type: options.type || "info",
        title: options.title,
        message: options.message,
        showActions:
          typeof options.showActions !== "undefined"
            ? options.showActions
            : ["confirm", "warning"].includes(options.type),
        confirmText: options.confirmText || "OK",
        cancelText: options.cancelText || "Cancel",
        onConfirm: () => {
          setDialog({ open: false });
          resolve(true);
        },
        onCancel: () => {
          setDialog({ open: false });
          resolve(false);
        },
        onClose: () => {
          setDialog({ open: false });
          resolve(false);
        },
      });
    });
  }, []);

  // Promise-based prompt dialog
  const prompt = useCallback((options) => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.location.pathname === "/login") {
        resolve(null);
        return;
      }
      setDialog({
        open: true,
        type: options.type || "info",
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || "OK",
        cancelText: options.cancelText || "Cancel",
        showActions: true,
        showInput: true,
        inputType: options.inputType || "text",
        placeholder: options.placeholder,
        onConfirm: (val) => {
          setDialog({ open: false });
          resolve(val);
        },
        onCancel: () => {
          setDialog({ open: false });
          resolve(null);
        },
        onClose: () => {
          setDialog({ open: false });
          resolve(null);
        },
      });
    });
  }, []);

  // Simple success/info/error dialogs
  const show = useCallback((type, message, title = "", confirmText = "OK") => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.location.pathname === "/login") {
        // Suppress dialog on login page
        resolve();
        return;
      }
      setDialog({
        open: true,
        type,
        title,
        message,
        showCancel: false,
        confirmText,
        onConfirm: () => {
          setDialog({ open: false });
          resolve();
        },
        onClose: () => {
          setDialog({ open: false });
          resolve();
        },
      });
    });
  }, []);

  const value = {
    ask,
    prompt,
    success: (msg, title, confirmText) =>
      show("success", msg, title, confirmText),
    error: (msg, title, confirmText) => show("error", msg, title, confirmText),
    info: (msg, title, confirmText) => show("info", msg, title, confirmText),
    warning: (msg, title, confirmText) =>
      show("warning", msg, title, confirmText),
  };

  return (
    <DialogContextBase.Provider value={value}>
      {children}
      <Dialog {...dialog} />
    </DialogContextBase.Provider>
  );
}

