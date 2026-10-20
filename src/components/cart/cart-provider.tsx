"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Panier conservé dans localStorage. Les prix enregistrés ici ne servent
 * qu'à l'affichage immédiat et à détecter un changement de prix : la
 * source de vérité reste Supabase (devis recalculé côté serveur).
 */
export type CartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  snapshot: {
    nameFr: string;
    nameWo: string;
    slug: string;
    imageUrl: string | null;
    unitPrice: number | null;
    variantLabel: string | null;
  };
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  add: (item: CartItem) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
  updateSnapshots: (updates: { productId: string; variantId: string | null; unitPrice: number | null }[]) => void;
};

const STORAGE_KEY = "tmt_cart_v1";
const MAX_QTY = 99;
const MAX_LINES = 50;

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: { productId: string; variantId: string | null }, productId: string, variantId: string | null) {
  return a.productId === productId && (a.variantId ?? null) === (variantId ?? null);
}

function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (i): i is CartItem =>
        !!i &&
        typeof i.productId === "string" &&
        (i.variantId === null || typeof i.variantId === "string") &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0 &&
        typeof i.snapshot === "object",
    )
    .map((i) => ({ ...i, quantity: Math.min(i.quantity, MAX_QTY) }))
    .slice(0, MAX_LINES);
}

function read(): CartItem[] {
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Lecture différée : le rendu serveur ne connaît pas le panier.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(read());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Stockage indisponible (navigation privée) : panier en mémoire.
      }
      return next;
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      add: (item) =>
        persist((prev) => {
          const existing = prev.find((i) => sameLine(i, item.productId, item.variantId));
          if (existing) {
            return prev.map((i) =>
              i === existing
                ? { ...i, snapshot: item.snapshot, quantity: Math.min(MAX_QTY, i.quantity + item.quantity) }
                : i,
            );
          }
          if (prev.length >= MAX_LINES) return prev;
          return [...prev, { ...item, quantity: Math.min(MAX_QTY, item.quantity) }];
        }),
      setQuantity: (productId, variantId, quantity) =>
        persist((prev) =>
          quantity <= 0
            ? prev.filter((i) => !sameLine(i, productId, variantId))
            : prev.map((i) =>
                sameLine(i, productId, variantId) ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i,
              ),
        ),
      remove: (productId, variantId) => persist((prev) => prev.filter((i) => !sameLine(i, productId, variantId))),
      clear: () => persist(() => []),
      updateSnapshots: (updates) =>
        persist((prev) =>
          prev.map((i) => {
            const u = updates.find((x) => sameLine(i, x.productId, x.variantId));
            return u && u.unitPrice !== i.snapshot.unitPrice
              ? { ...i, snapshot: { ...i.snapshot, unitPrice: u.unitPrice } }
              : i;
          }),
        ),
    }),
    [items, hydrated, persist],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
