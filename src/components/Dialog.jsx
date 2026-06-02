import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiExclamation,
  HiInformationCircle,
  HiEye,
  HiEyeOff,
} from "react-icons/hi";

const Dialog = ({
  open,
  type = "success", // 'success' | 'confirm' | 'info' | 'error'
  title = "",
  message = "",
  onClose,
  onConfirm,
  confirmText = "Yes",
  cancelText = "No",
  showActions = false,
  showInput = false,
  inputType = "text",
  placeholder = "",
  children,
}) => {
  const [promptValue, setPromptValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setPromptValue(""), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open && type === "success") {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [open, type, onClose]);

  if (!open) return null;

  let icon, iconBg, iconColor, defaultTitle;
  // ... (switch case remains same, I will include it to match target)
  switch (type) {
    case "success":
      iconBg = "bg-[#e6f7ed]";
      iconColor = "text-[#22c55e]";
      icon = <HiCheckCircle className="w-8 h-8" />;
      defaultTitle = "Success";
      break;
    case "confirm":
      iconBg = "bg-[#e6f2ff]";
      iconColor = "text-[#1e3a5f]";
      icon = <HiExclamationCircle className="w-8 h-8" />;
      defaultTitle = "Confirm";
      break;
    case "error":
      iconBg = "bg-[#fee]";
      iconColor = "text-[#ef4444]";
      icon = <HiExclamationCircle className="w-8 h-8" />;
      defaultTitle = "Error";
      break;
    case "warning":
      iconBg = "bg-[#fef3e6]";
      iconColor = "text-[#f59e0b]";
      icon = <HiExclamation className="w-8 h-8" />;
      defaultTitle = "Warning";
      break;
    case "info":
      iconBg = "bg-[#e6f2ff]";
      iconColor = "text-[#0071e3]";
      icon = <HiInformationCircle className="w-8 h-8" />;
      defaultTitle = "Info";
      break;
    default:
      iconBg = "bg-gray-100";
      iconColor = "text-gray-500";
      icon = null;
      defaultTitle = "Info";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 min-w-100 max-w-100 flex flex-col items-center shadow-lg">
        <div className="mb-3">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-full ${iconBg}`}
          >
            <span className={`${iconColor}`}>{icon}</span>
          </div>
        </div>
        <h2 className="text-xl mb-2 text-center text-black">
          {title || defaultTitle}
        </h2>
        <p
          className={`${children || showInput ? "mb-3" : "mb-8"} text-center text-sm text-gray-500`}
        >
          {message}
        </p>
        {showInput && (
          <div className="relative w-full">
            {(() => {
              let resolvedInputType;
              if (inputType === "password" && !showPassword) {
                resolvedInputType = "password";
              } else if (inputType === "password") {
                resolvedInputType = "text";
              } else {
                resolvedInputType = inputType;
              }
              return (
                <input
                  type={resolvedInputType}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm mb-6"
                  placeholder={placeholder}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  minLength={8}
                />
              );
            })()}
            <button
              type="button"
              className="absolute inset-y-0 -top-5 right-0 pr-3 flex items-center text-gray-400 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <HiEyeOff className="w-5 h-5" />
              ) : (
                <HiEye className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
        {children}
        {showActions || showInput ? (
          <div className="flex gap-3">
            <button
              className="bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] px-6 py-2 rounded-full focus:outline-none border border-gray-100 cursor-pointer"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-full focus:outline-none cursor-pointer"
              onClick={() => onConfirm(promptValue)}
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <button
            className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-full focus:outline-none cursor-pointer"
            onClick={() => onConfirm(promptValue)}
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};

Dialog.propTypes = {
  open: PropTypes.bool,
  type: PropTypes.oneOf(["success", "confirm", "error", "warning", "info"]),
  title: PropTypes.string,
  message: PropTypes.string,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  showActions: PropTypes.bool,
  showInput: PropTypes.bool,
  inputType: PropTypes.string,
  placeholder: PropTypes.string,
  children: PropTypes.node,
};
export default Dialog;
