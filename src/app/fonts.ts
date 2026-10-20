import { Inter, Montserrat } from "next/font/google";

/** Montserrat : titres et nom de marque (proche du lettrage du logo). */
export const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

/** Inter : texte courant, très lisible sur mobile. */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});
