/**
 * Informations commerciales CONFIRMÉES par le propriétaire.
 * Servent de valeurs par défaut si les paramètres Supabase sont
 * indisponibles. Les valeurs modifiables vivent dans la table
 * public.store_settings (Administration > Paramètres).
 */
export const siteDefaults = {
  businessName: "TOUBA MOURIDE TRADING",
  phoneDisplay: "77 094 12 31",
  phoneInternational: "+221770941231",
  whatsappNumber: "221770941231",
  email: "pbsking98@gmail.com",
  locations: ["Liberté 5, Dakar", "Keur Massar"],
  instagramUrl: "https://www.instagram.com/touba__mouride__trading",
  tiktokUrl: "https://www.tiktok.com/@touba_mouride_trading",
} as const;

export const CURRENCY = "XOF";
