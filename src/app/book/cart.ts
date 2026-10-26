"use client";

import { useEffect, useState } from "react";
import type { CartLine } from "@/lib/pricing";

const CART_KEY = "wb_cart";

function load(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** The visit's cart, kept in localStorage so it survives sign-in and page reloads. */
export function useCart() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCart(load()); // eslint-disable-line react-hooks/set-state-in-effect -- restoring client-only storage
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, loaded]);

  return { cart, setCart, loaded, clear: () => setCart([]) };
}
