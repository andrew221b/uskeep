import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
// This file must live inside the website repository: Netlify builds the site
// as its own project and does not include sibling paths from the app repo.
const publisher = JSON.parse(await readFile(resolve(root, "src/data/publisher.json"), "utf8"));
const out = resolve(root, "dist");
const rawSiteUrl = process.env.SITE_URL?.trim();
if (!rawSiteUrl) {
  console.error("SITE_URL is required, e.g. SITE_URL=https://uskeep.example npm run build");
  process.exit(1);
}
const parsed = new URL(rawSiteUrl);
if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error("SITE_URL must be HTTP(S)");
if (parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) throw new Error("SITE_URL must be the origin only, without path, query or credentials");
if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
  throw new Error("Public SITE_URL must use HTTPS");
}
const siteUrl = parsed.origin;
const localPreview = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
const postalAddress = process.env.PUBLISHER_POSTAL_ADDRESS?.trim() || publisher.postalAddress;
const publisherName = process.env.PUBLISHER_NAME?.trim() || publisher.name;
const jurisdiction = process.env.GOVERNING_LAW?.trim() || "Ukraine";
const supportEmail = process.env.SUPPORT_EMAIL?.trim() || publisher.email;
const privacyEmail = process.env.PRIVACY_EMAIL?.trim() || publisher.email;
const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!localPreview && (process.env.LEGAL_APPROVED !== 'true' || !postalAddress)) {
  throw new Error("Public build requires LEGAL_APPROVED=true and PUBLISHER_POSTAL_ADDRESS after publisher/legal review");
}
if (!localPreview && (!supabaseUrl || !supabasePublishableKey || !supabaseUrl.startsWith('https://'))) {
  throw new Error("Public build requires VITE_SUPABASE_URL (HTTPS) and VITE_SUPABASE_PUBLISHABLE_KEY for secure account deletion requests");
}
if (!localPreview && supabaseUrl) {
  const supabaseOrigin = new URL(supabaseUrl);
  if (supabaseOrigin.protocol !== "https:" || supabaseOrigin.pathname !== "/" || supabaseOrigin.search || supabaseOrigin.hash) {
    throw new Error("VITE_SUPABASE_URL must be an HTTPS origin without a path, query or fragment");
  }
}
if (!localPreview && (supabasePublishableKey?.startsWith("sb_secret_") || /service[_-]?role/i.test(supabasePublishableKey || ""))) {
  throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY must not contain a Supabase secret/service-role key");
}
for (const [label, value] of [["SUPPORT_EMAIL", supportEmail], ["PRIVACY_EMAIL", privacyEmail]]) {
  if (value && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)) {
    throw new Error(`${label} must be a valid monitored email address`);
  }
}
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const storeUrl = (name) => {
  const value = process.env[name]?.trim();
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error(`${name} must be an HTTPS URL`);
  return escapeHtml(url.href);
};
const vars = {
  __SITE_URL__: siteUrl,
  __APP_STORE_URL__: storeUrl('APP_STORE_URL'),
  __PLAY_STORE_URL__: storeUrl('PLAY_STORE_URL'),
  __PUBLISHER_POSTAL_ADDRESS__: escapeHtml(postalAddress),
  __PUBLISHER_NAME__: escapeHtml(publisherName),
  __GOVERNING_LAW__: escapeHtml(jurisdiction),
  __SUPPORT_EMAIL__: escapeHtml(supportEmail),
  __SUPPORT_MAILTO__: `mailto:${escapeHtml(supportEmail)}`,
  __PRIVACY_EMAIL__: escapeHtml(privacyEmail),
  __PRIVACY_MAILTO__: `mailto:${escapeHtml(privacyEmail)}`,
  __SUPABASE_URL__: escapeHtml(supabaseUrl || ""),
  __SUPABASE_PUBLISHABLE_KEY__: escapeHtml(supabasePublishableKey || ""),
  __LEGAL_CALLOUT__: '',
};
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const page of ["index.html", "privacy/index.html", "terms/index.html", "support/index.html", "delete-account/index.html", "join/index.html"]) {
  const html = await readFile(resolve(root, page), "utf8");
  const rendered = Object.entries(vars).reduce((value, [key, replacement]) => value.replaceAll(key, replacement), html);
  const destination = resolve(out, page);
  await mkdir(resolve(destination, ".."), { recursive: true });
  await writeFile(destination, rendered);
}
for (const file of ["styles-v2.css", "editorial.css", "main.js", "theme-init.js", "delete-account.js", "join.js", "join.css", "_headers"]) await cp(resolve(root, file), resolve(out, file));
for (const file of [
  "assets/brand/uskeep-mark.png",
  "assets/photos/lisbon-memory.jpg", "assets/photos/everyday-together.jpg",
  "assets/screens/home-site.jpg", "assets/screens/memories-site.jpg",
]) {
  const destination = resolve(out, file);
  await mkdir(resolve(destination, ".."), { recursive: true });
  await cp(resolve(root, file), destination);
}
await mkdir(resolve(out, ".well-known"), { recursive: true });
await cp(resolve(root, ".well-known/apple-app-site-association"), resolve(out, ".well-known/apple-app-site-association"));
const fingerprints = (process.env.ANDROID_APP_SIGNING_SHA256 || "").split(",").map(value => value.trim().toUpperCase()).filter(Boolean);
if (fingerprints.some(value => !/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(value))) throw new Error("ANDROID_APP_SIGNING_SHA256 must be the SHA-256 App signing certificate from Google Play Console");
if (fingerprints.length) {
  await writeFile(resolve(out, ".well-known/assetlinks.json"), JSON.stringify([{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: "app.uskeep.vickand", sha256_cert_fingerprints: fingerprints },
  }]));
} else await cp(resolve(root, ".well-known/assetlinks.json"), resolve(out, ".well-known/assetlinks.json"));
const urls = ["/", "/privacy/", "/terms/", "/support/", "/delete-account/"];
await writeFile(resolve(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join("\n")}\n</urlset>\n`);
await writeFile(resolve(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log(`Built Uskeep website in ${out} for ${siteUrl}`);
