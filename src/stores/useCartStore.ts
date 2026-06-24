import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product: any; // We can use the Product interface if available
  quantity: number;
}

export interface CartState {
  cartItems: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartItems: [],
      addToCart: (product) =>
        set((state) => {
          const existing = state.cartItems.find(
            (item) => item.product._id === product._id
          );
          if (existing) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.product._id === product._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { cartItems: [...state.cartItems, { product, quantity: 1 }] };
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cartItems: state.cartItems.filter(
            (item) => item.product._id !== productId
          ),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.product._id === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        })),
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: "ims_cart", // Storage key
    }
  )
);
