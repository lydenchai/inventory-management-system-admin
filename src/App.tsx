// @ts-nocheck
import React from "react";
import { DialogProvider } from "./contexts/dialog/DialogContext.tsx";
import { BadgeProvider } from "./contexts/badge/BadgeContext.tsx";

import AppRoutes from "./routes/AppRoutes.tsx";

function App() {
  return (
    <DialogProvider>
      <BadgeProvider>
        <AppRoutes />
      </BadgeProvider>
    </DialogProvider>
  );
}

export default App;
