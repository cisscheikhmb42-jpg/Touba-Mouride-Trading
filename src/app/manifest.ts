import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TOUBA MOURIDE TRADING",
    short_name: "TMT",
    description: "Boutique d'articles et accessoires mourides au Sénégal.",
    start_url: "/fr",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0fbddf",
    lang: "fr",
    icons: [{ src: "/brand/icon-256.png", sizes: "256x256", type: "image/png" }],
  };
}
