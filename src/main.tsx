// @ts-nocheck
import { createRoot } from "react-dom/client";
import App from "./App.js";
import { AuthProvider } from "./contexts/auth/AuthContext.jsx";
import { NotificationProvider } from "./contexts/notification/NotificationContext.jsx";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </AuthProvider>,
);

