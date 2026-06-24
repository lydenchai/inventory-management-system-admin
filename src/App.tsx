// @ts-nocheck
import React from "react";
import { DialogProvider } from "./contexts/dialog/DialogContext.tsx";
import { BadgeProvider } from "./contexts/badge/BadgeContext.tsx";
import { CartProvider } from "./contexts/cart/CartContext.tsx";
import AppRoutes from "./routes/AppRoutes.tsx";

function App() {
  return (
    <DialogProvider>
      <CartProvider>
        <BadgeProvider>
          <AppRoutes />
        </BadgeProvider>
      </CartProvider>
    </DialogProvider>
  );
}

export default App;
