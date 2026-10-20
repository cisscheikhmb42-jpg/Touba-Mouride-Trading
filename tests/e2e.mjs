/**
 * Test de bout en bout (navigateur réel) : administration + boutique.
 * Prérequis : site lancé (npm run build && npm start), Supabase avec les
 * migrations, un compte administrateur de TEST.
 *
 *   BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   IMAGES_DIR=/chemin/vers/images-de-test node tests/e2e.mjs
 *
 * ⚠️ Crée des produits « … test e2e » : à n'exécuter que sur une base de
 * test, jamais en production.
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const IMAGES = process.env.IMAGES_DIR;
const SHOTS = process.env.SCREENSHOTS_DIR;
if (!EMAIL || !PASSWORD) throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD sont requis");

const results = [];
/** Fait défiler la page pour déclencher les apparitions avant une capture pleine page. */
async function shot(page, name) {
  if (!SHOTS) return;
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
}
async function step(name, fn) {
  try {
    await fn();
    results.push(["OK", name]);
    console.log("✔", name);
  } catch (e) {
    results.push(["ÉCHEC", name, e.message]);
    console.log("✘", name, "\n   ", e.message.split("\n")[0]);
  }
}

const browser = await chromium.launch();
const consoleErrors = [];
let expectAuthFailure = false;
function track(page, label) {
  page.on("console", (m) => {
    // Le refus du mauvais mot de passe (test volontaire) n'est pas une erreur.
    if (m.type() === "error" && !(label === "admin" && expectAuthFailure)) consoleErrors.push(`${label}: ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`${label}: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !(expectAuthFailure && r.url().includes("/auth/v1/token"))) consoleErrors.push(`${label}: HTTP ${r.status()} ${r.url().replace(BASE, "")}`);
  });
}

// ------------------------------------------------------------------ ADMIN
const adminCtx = await browser.newContext();
const admin = await adminCtx.newPage();
track(admin, "admin");
const ids = {};

// Avec Cache Components, Next garde les pages déjà visitées montées mais
// masquées (<Activity>) : on ne cible que les éléments visibles.
const v = (locator) => locator.filter({ visible: true });

async function fillProduct(p, { name, category, price, sku, stock, track: trackStock }) {
  await v(p.getByLabel("Nom (français)")).fill(name);
  if (category) await v(p.getByLabel("Catégorie")).selectOption({ label: category });
  if (price !== undefined) await v(p.getByLabel("Prix (FCFA)", { exact: true })).fill(String(price));
  if (sku) await v(p.getByLabel("Référence (SKU)")).fill(sku);
  if (stock !== undefined) await v(p.getByLabel("Stock (sans variantes)")).fill(String(stock));
  if (trackStock) await v(p.getByLabel("Suivre le stock")).check();
  await v(p.getByLabel("Publié sur le site")).check();
}

await step("Admin : accès refusé sans connexion (redirection)", async () => {
  await admin.goto(`${BASE}/admin/commandes`);
  assert.match(admin.url(), /\/admin\/login/);
});

await step("Admin : mauvais mot de passe refusé", async () => {
  expectAuthFailure = true;
  await admin.getByLabel("E-mail").fill(EMAIL);
  await admin.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.getByText("E-mail ou mot de passe incorrect.").waitFor();
  expectAuthFailure = false;
});

await step("Admin : connexion", async () => {
  await admin.getByLabel("Mot de passe").fill(PASSWORD);
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.getByRole("heading", { name: "Tableau de bord" }).waitFor({ timeout: 15000 });
});

await step("Admin : créer un produit avec prix et stock suivi", async () => {
  await admin.goto(`${BASE}/admin/produits/nouveau`);
  await fillProduct(admin, { name: "Chapelet test e2e", category: "Chapelets", price: 15000, sku: "TEST-CHAP-1", stock: 3, track: true });
  await admin.getByRole("button", { name: "Créer le produit" }).click();
  await admin.waitForURL(/\/admin\/produits\/[0-9a-f-]{36}/, { timeout: 15000 });
  ids.chapelet = admin.url().match(/produits\/([0-9a-f-]{36})/)[1];
});

await step("Admin : téléverser deux photos (optimisées en WebP)", async () => {
  assert.ok(IMAGES, "IMAGES_DIR non défini");
  const files = ["test1.jpg", "test2.jpg"].map((f) => path.join(IMAGES, f));
  await admin.locator('input[type="file"]').setInputFiles(files);
  await admin.getByText("test2.jpg : ajoutée").waitFor({ timeout: 30000 });
  await admin.getByText("Monter").first().waitFor();
  assert.equal(await v(admin.getByRole("button", { name: "Supprimer la photo" })).count(), 2);
});

await step("Admin : réordonner une photo", async () => {
  await admin.getByRole("button", { name: "Descendre" }).first().click();
  await admin.waitForLoadState("networkidle");
});

await step("Admin : prix barré inférieur refusé (validation)", async () => {
  await v(admin.getByLabel("Prix barré (facultatif)")).fill("100");
  await v(admin.getByRole("button", { name: "Enregistrer le produit" })).click();
  await admin.getByText("Le prix barré doit être supérieur").waitFor();
  await v(admin.getByLabel("Prix barré (facultatif)")).fill("");
});

await step("Admin : créer un produit sans prix (Prix à confirmer)", async () => {
  await admin.goto(`${BASE}/admin/produits/nouveau`);
  await fillProduct(admin, { name: "Parfum test e2e", category: "Parfums" });
  await admin.getByRole("button", { name: "Créer le produit" }).click();
  await admin.waitForURL(/\/admin\/produits\/[0-9a-f-]{36}/, { timeout: 15000 });
});

await step("Admin : créer un produit à variantes", async () => {
  await admin.goto(`${BASE}/admin/produits/nouveau`);
  await fillProduct(admin, { name: "Jallabe test e2e", category: "Jallabe avec capuche", price: 20000, track: true });
  await admin.getByRole("button", { name: "Créer le produit" }).click();
  await admin.waitForURL(/\/admin\/produits\/[0-9a-f-]{36}/, { timeout: 15000 });
  ids.jallabe = admin.url().match(/produits\/([0-9a-f-]{36})/)[1];
  const add = async (size, price, stock) => {
    const box = admin.locator("li", { hasText: "Nouvelle variante" });
    await v(box.getByLabel("Taille / pointure")).fill(size);
    if (price) await v(box.getByLabel("Prix (FCFA)")).fill(String(price));
    await v(box.getByLabel("Stock")).fill(String(stock));
    const before = await v(admin.getByRole("button", { name: "Supprimer la variante" })).count();
    await v(box.getByRole("button", { name: "Ajouter la variante" })).click();
    await v(admin.getByRole("button", { name: "Supprimer la variante" })).nth(before).waitFor();
  };
  await add("M", null, 2);
  await add("XL", 22000, 5);
  assert.equal(await v(admin.getByRole("button", { name: "Supprimer la variante" })).count(), 2);
});

await step("Admin : fixer les frais de livraison de Dakar", async () => {
  await admin.goto(`${BASE}/admin/livraison`);
  const dakar = admin.locator("section", { has: admin.getByRole("heading", { name: "Dakar", exact: true }) });
  await v(dakar.getByLabel("Frais (FCFA)")).fill("2000");
  await dakar.getByRole("button", { name: "Enregistrer" }).click();
  await dakar.getByText("Zone enregistrée.").waitFor();
});

// ---------------------------------------------------------------- BOUTIQUE
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const shop = await ctx.newPage();
track(shop, "boutique");

await step("Boutique : les produits publiés apparaissent sur l'accueil", async () => {
  await shop.goto(`${BASE}/fr`);
  await shop.getByRole("link", { name: "Chapelet test e2e" }).first().waitFor({ timeout: 15000 });
  await shot(shop, "mobile-accueil.png");
});

await step("Boutique : recherche tolérante (djellaba → jallabe, sans accents)", async () => {
  await shop.goto(`${BASE}/fr/boutique?q=djellaba`);
  await shop.getByRole("link", { name: "Jallabe test e2e" }).waitFor();
  assert.equal(await shop.getByRole("link", { name: "Chapelet test e2e" }).count(), 0);
});

await step("Boutique : page catégorie", async () => {
  await shop.goto(`${BASE}/fr/categorie/chapelets`);
  await shop.getByRole("heading", { level: 1, name: "Chapelets" }).waitFor();
  await shop.getByRole("link", { name: "Chapelet test e2e" }).waitFor();
});

await step("Fiche produit : ajout au panier (quantité 2) et compteur", async () => {
  await shop.goto(`${BASE}/fr/produit/chapelet-test-e2e`);
  await shop.getByRole("heading", { level: 1, name: "Chapelet test e2e" }).waitFor();
  await shop.getByRole("button", { name: "Augmenter la quantité" }).click();
  await shop.getByRole("button", { name: "Ajouter au panier" }).click();
  await shop.getByRole("link", { name: "Panier, 2 article(s)" }).waitFor();
  await shot(shop, "mobile-fiche-produit.png");
});

await step("Fiche produit : variante obligatoire puis choix XL", async () => {
  await shop.goto(`${BASE}/fr/produit/jallabe-test-e2e`);
  await shop.getByRole("button", { name: "Ajouter au panier" }).click();
  await shop.getByText("Veuillez choisir une option.").waitFor();
  await shop.locator("label", { hasText: "XL" }).click();
  await shop.getByText("22 000").first().waitFor();
  await shop.getByRole("button", { name: "Ajouter au panier" }).click();
  await shop.getByRole("link", { name: "Panier, 3 article(s)" }).waitFor();
});

await step("Fiche produit : prix à confirmer", async () => {
  await shop.goto(`${BASE}/fr/produit/parfum-test-e2e`);
  await shop.getByText("Prix à confirmer").first().waitFor();
  await shop.getByRole("button", { name: "Ajouter au panier" }).click();
  await shop.getByRole("link", { name: "Panier, 4 article(s)" }).waitFor();
});

await step("Panier : persistance après rechargement + sous-total partiel", async () => {
  await shop.goto(`${BASE}/fr/panier`);
  await shop.reload();
  await shop.getByText("Sous-total (articles au prix confirmé)").waitFor({ timeout: 15000 });
  await shop.getByText("52 000 FCFA").first().waitFor();
  await shop.getByText("Total à confirmer sur WhatsApp").first().waitFor();
});

await step("Panier : quantité bornée au stock réel (3)", async () => {
  const qty = shop.getByLabel("Quantité — Chapelet test e2e");
  await shop.getByText("Plus que 3", { exact: false }).count(); // devis chargé
  await qty.fill("4");
  await shop.waitForTimeout(600);
  assert.equal(await qty.inputValue(), "3");
  const plus = shop.locator("li", { hasText: "Chapelet test e2e" }).getByRole("button", { name: "Augmenter la quantité" });
  assert.ok(await plus.isDisabled(), "le bouton + devrait être désactivé au stock maximum");
});

await step("Panier : suppression d'un article", async () => {
  await shop.getByRole("button", { name: "Retirer Parfum test e2e du panier" }).click();
  await shop.getByRole("link", { name: "Panier, 4 article(s)" }).waitFor();
  await shop.getByText("67 000 FCFA").first().waitFor({ timeout: 10000 });
});

await step("Panier : frais de livraison connus (Dakar) → total calculé", async () => {
  await shop.getByLabel("Zone de livraison").selectOption({ label: "Dakar" });
  await shop.getByText("69 000 FCFA").waitFor({ timeout: 10000 });
});

await step("Panier : frais inconnus (autres régions) → pas de total", async () => {
  await shop.getByLabel("Zone de livraison").selectOption({ label: "Autres régions du Sénégal" });
  await shop.getByText("Total à confirmer sur WhatsApp").waitFor({ timeout: 10000 });
  await shop.getByLabel("Zone de livraison").selectOption({ label: "Dakar" });
  await shop.getByText("69 000 FCFA").waitFor({ timeout: 10000 });
});

await step("Commande : validation du formulaire (téléphone invalide)", async () => {
  await shop.getByLabel("Nom complet").fill("Awa Test");
  await shop.getByLabel("Numéro de téléphone").fill("12ab");
  await shop.getByLabel("Adresse ou quartier").fill("Liberté 6, près du rond-point");
  await shop.getByRole("button", { name: "Préparer ma commande WhatsApp" }).click();
  await shop.getByText("Numéro de téléphone invalide.").waitFor();
});

let waUrl = "";
await step("Commande : enregistrement + lien WhatsApp prérempli", async () => {
  await shop.getByLabel("Numéro de téléphone").fill("77 123 45 67");
  await shop.getByLabel("Instructions (facultatif)").fill("Appeler avant — merci « é à ç »");
  await shop.getByRole("button", { name: "Préparer ma commande WhatsApp" }).click();
  await shop.getByRole("heading", { name: "Demande enregistrée" }).waitFor({ timeout: 20000 });
  waUrl = await shop.getByRole("link", { name: "Ouvrir WhatsApp et envoyer" }).getAttribute("href");
  assert.match(waUrl, /^https:\/\/wa\.me\/221770941231\?text=/);
  await shot(shop, "mobile-commande-enregistree.png");
});

await step("Message WhatsApp : contenu et encodage des accents", async () => {
  const text = decodeURIComponent(waUrl.split("?text=")[1]);
  for (const s of ["*TOUBA MOURIDE TRADING*", "*DEMANDE DE COMMANDE*", "Référence : TMT-", "Nom : Awa Test", "Téléphone : 771234567", "Zone de livraison : Dakar", "Chapelet test e2e (TEST-CHAP-1)", "Quantité : 3", "Prix unitaire : 15 000 FCFA", "Jallabe test e2e — XL", "Sous-total : 67 000 FCFA", "Frais de livraison : 2 000 FCFA", "*Total : 69 000 FCFA*", "« é à ç »"]) {
    assert.ok(text.includes(s), `absent du message : ${s}`);
  }
  assert.ok(!waUrl.includes(" "), "espaces non encodés");
});

await step("Commande : panier vidé après enregistrement", async () => {
  await shop.getByRole("link", { name: "Panier, 0 article(s)" }).waitFor();
});

// -------------------------------------------------- ADMIN : COMMANDE + STOCK
await step("Admin : la demande apparaît « en attente de confirmation »", async () => {
  await admin.goto(`${BASE}/admin/commandes`);
  await admin.getByText("Awa Test").first().waitFor();
  await admin.getByText("En attente de confirmation").first().waitFor();
});

await step("Admin : confirmation → stock décrémenté ; annulation → restitué", async () => {
  await admin.locator("a", { hasText: /^TMT-/ }).first().click();
  await v(admin.getByLabel("Nouveau statut")).selectOption("confirmed");
  await v(admin.getByRole("button", { name: "Mettre à jour le statut" })).click();
  await admin.getByText("Statut mis à jour.").waitFor();
  await admin.goto(`${BASE}/admin/produits?q=chapelet`);
  await admin.locator("tr", { hasText: "Chapelet test e2e" }).getByText("0", { exact: true }).waitFor();
  await admin.goBack();
  await v(admin.getByLabel("Nouveau statut")).selectOption("cancelled");
  await v(admin.getByRole("button", { name: "Mettre à jour le statut" })).click();
  await admin.getByText("Statut mis à jour.").waitFor();
  await admin.goto(`${BASE}/admin/produits?q=chapelet`);
  await admin.locator("tr", { hasText: "Chapelet test e2e" }).getByText("3", { exact: true }).waitFor();
});

await step("Panier : changement de prix signalé au client", async () => {
  await shop.goto(`${BASE}/fr/produit/chapelet-test-e2e`);
  await shop.getByRole("button", { name: "Ajouter au panier" }).click();
  await admin.goto(`${BASE}/admin/produits/${ids.chapelet}`);
  await v(admin.getByPlaceholder("Prix à confirmer")).fill("16000");
  await v(admin.getByRole("button", { name: "Enregistrer le produit" })).click();
  await admin.getByText("Produit enregistré.").waitFor();
  await shop.goto(`${BASE}/fr/panier`);
  await shop.getByText("15 000 FCFA → 16 000 FCFA", { exact: false }).waitFor({ timeout: 15000 });
});

// ------------------------------------------------------- LANGUE / MOBILE
await step("Langue : passage en wolof conservé pendant la navigation", async () => {
  await shop.goto(`${BASE}/fr/boutique`);
  await shop.getByRole("button", { name: "Ouvrir le menu" }).click();
  const seen = [];
  const onReq = (r) => {
    const h = r.headers();
    seen.push(`${h["rsc"] ? "rsc" : r.resourceType()}${h["next-router-prefetch"] ? "(prefetch)" : ""} ${r.url().replace(BASE, "").split("?")[0]}`);
  };
  shop.on("request", onReq);
  await shop.getByRole("dialog").getByRole("link", { name: "Wolof" }).click();
  await shop.waitForURL(/\/wo\/boutique/);
  const cookie = JSON.stringify((await ctx.cookies()).filter((c) => c.name === "tmt_lang").map((c) => [c.value, c.domain, c.path]));
  shop.off("request", onReq);
  if (process.env.DEBUG_LANG) console.log("cookie:", cookie, seen.filter((x) => !x.includes("(prefetch)") && !x.startsWith("image")));
  assert.equal(await shop.locator("html").getAttribute("lang"), "wo");
  await shop.goto(`${BASE}/`);
  await shop.waitForURL(/\/wo$/);
});

await step("Mobile : aucun débordement horizontal global", async () => {
  for (const p of ["/fr", "/fr/boutique", "/fr/produit/jallabe-test-e2e", "/fr/panier", "/fr/contact", "/wo", "/fr/faq"]) {
    await shop.goto(`${BASE}${p}`);
    await shop.waitForLoadState("load");
    await shop.waitForTimeout(500);
    const overflow = await shop.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `${p} déborde de ${overflow}px`);
  }
});

await step("Carrousel : boutons précédent/suivant (ordinateur)", async () => {
  const desk = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  track(desk, "desktop");
  await desk.goto(`${BASE}/fr`);
  const region = desk.getByRole("list", { name: "Nos catégories" });
  const before = await region.evaluate((el) => el.scrollLeft);
  await desk.locator("section", { has: region }).getByRole("button", { name: "Suivant" }).click();
  await desk.waitForTimeout(800);
  const after = await region.evaluate((el) => el.scrollLeft);
  assert.ok(after > before, "le carrousel n'a pas défilé");
  await shot(desk, "desktop-accueil.png");
  await desk.goto(`${BASE}/fr/produit/jallabe-test-e2e`);
  if (SHOTS) await desk.screenshot({ path: path.join(SHOTS, "desktop-fiche-produit.png"), fullPage: false });
  await desk.close();
});

await step("prefers-reduced-motion : bandeau défilant immobile", async () => {
  const p = await browser.newPage({ reducedMotion: "reduce" });
  await p.goto(`${BASE}/fr`);
  const anim = await p.locator(".marquee-track").first().evaluate((el) => getComputedStyle(el).animationName);
  assert.equal(anim, "none");
  await p.close();
});

await step("Aucune erreur dans la console", async () => {
  assert.deepEqual(consoleErrors, []);
});

await browser.close();
const failed = results.filter((r) => r[0] !== "OK");
console.log(`\n${results.length - failed.length}/${results.length} étapes réussies`);
if (SHOTS) fs.writeFileSync(path.join(SHOTS, "e2e-results.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
