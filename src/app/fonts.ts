import { Plus_Jakarta_Sans } from "next/font/google";

/** Plus Jakarta Sans : titres et texte (géométrique et lisible, proche du lettrage du logo). */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
