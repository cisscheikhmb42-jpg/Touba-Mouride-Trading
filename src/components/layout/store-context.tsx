"use client";

import { createContext, useContext } from "react";

/** Informations publiques de la boutique utiles aux composants client. */
type StoreValue = { whatsappNumber: string };

const StoreContext = createContext<StoreValue>({ whatsappNumber: "221770941231" });

export function StoreProvider({ value, children }: { value: StoreValue; children: React.ReactNode }) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
