import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "dist");
const pages = ["index.html", "shared-planner/index.html", "memories/index.html", "care/index.html", "privacy/index.html", "terms/index.html", "support/index.html", "delete-account/index.html"];
for (const page of pages) {
  const html = await readFile(resolve(root, page), "utf8");
  if (/__[A-Z_]+__/.test(html)) throw new Error(`Unreplaced variable: ${page}`);
  if (!html.includes('name="description"') || !html.includes('rel="canonical"')) throw new Error(`Missing SEO metadata: ${page}`);
  if (!html.includes('href="/privacy/"') || !html.includes('href="/terms/"')) throw new Error(`Missing legal links: ${page}`);
  for (const match of html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)) {
    const pathname = new URL(match[1], 'https://uskeep.example').pathname;
    const file = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    await stat(resolve(root, '.' + file));
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(match[1]);
  }
  if (page === "delete-account/index.html") {
    for (const expected of ["delete-request-form", "delete-confirm-form", "data-supabase-config", "/privacy/", "/terms/"]) {
      if (!html.includes(expected)) throw new Error(`Account deletion page is missing ${expected}`);
    }
  }
  if (page === "support/index.html" && !html.includes('href="/delete-account/"')) {
    throw new Error("Support page must clearly link to the account-deletion request flow.");
  }
}
for (const file of ["sitemap.xml", "robots.txt", "styles-v2.css", "discover.css", "main.js", "404.html"]) await stat(resolve(root, file));
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
if (sitemap.includes('/delete-account/') || sitemap.includes('/join/')) throw new Error('Private or utility pages must not appear in the sitemap.');
const headers = await readFile(resolve(root, '_headers'), 'utf8');
if (headers.includes('__METRICA_ORIGIN__')) throw new Error('Unrendered CSP variable in _headers.');
const deletionScript = await readFile(resolve(root, "delete-account.js"), "utf8");
for (const expected of ["code_challenge_method: \"s256\"", "grant_type=pkce", "/functions/v1/delete-account", "confirm: \"DELETE\""]) {
  if (!deletionScript.includes(expected)) throw new Error(`Secure account-deletion flow is missing ${expected}`);
}
console.log("PASS: pages, SEO tags, legal links, assets, sitemap, robots");
