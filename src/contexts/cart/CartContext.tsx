// @ts-nocheck
import React, { useState, useCallback } from "react";
import { CartContextBase } from "./CartContextBase";

const STORAGE_KEY = "ims_cart";

function loadCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadCart);

  const addToCart = useCallback((product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      let next;
      if (existing) {
        next = prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        next = [
          ...prev,
          {
            product,
            quantity: 1,
          },
        ];
      }
      saveCart(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => {
      const next = prev.filter((item) => item.product._id !== productId);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setCartItems((prev) => {
      const next = prev.map((item) =>
        item.product._id === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      );
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    saveCart([]);
  }, []);

  return (
    <CartContextBase.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContextBase.Provider>
  );
};

