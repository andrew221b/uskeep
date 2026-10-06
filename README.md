# Uskeep website

Standalone, dependency-free static marketing site. DayDraft informed the section rhythm and navigation; Uskeep copy, palette, and illustrations are original to this project, while the current logo artwork is supplied by the product owner. The screenshots are from the local iOS Simulator with demo content.

The editorial image is generated, not a real customer photo; its prompt and provenance are in [ASSET_NOTES.md](ASSET_NOTES.md). The production bundle uses optimized JPEGs and contains no build-time JavaScript dependency.

The page moves from scattered everyday details to their place in Uskeep: an interactive desk introduces the problem, then Everyday, Money, Memories, Details, and Care chapters show the tools through illustrative records. Sample entries are not customer evidence or the app's initial state. This handoff covers local builds and previews; it does not establish production readiness for accounts, shared data, notifications, or purchases. The current sign-in and store limitations are recorded in [AUTH_AND_PURCHASES_CHECK.md](../docs/AUTH_AND_PURCHASES_CHECK.md).

Searchable feature pages cover shared planning, memories, and care records at `/shared-planner/`, `/memories/`, and `/care/`. Each page has its own title, description, canonical URL, breadcrumb markup, and links back into the rest of the site. The sitemap lists the public pages; `/join/` and `/delete-account/` are deliberately excluded. The home page answers common product questions in visible text.

The website's Modern Keepsake surface is documented in [marketing-website.md](../.impeccable/surfaces/marketing-website.md). `styles-v2.css` provides the base and `editorial.css` follows it with the active editorial overrides. These website values do not replace the native app system in `DESIGN.md` or `.impeccable/design.json`.

Two brand-colored stars resolve into the Uskeep mark on eligible first arrivals. The word “scattered” keeps slightly offset letters with a gentle drift; it never straightens. The phones sit on the open page with grounded shadows and exchange position and front/back layer every five seconds while eligible. Each screen stays attached to its own device, and the connecting lines move with the exchange. Manual selection remains available. Autoplay pauses offscreen, in a hidden tab, on hover or keyboard focus within the preview, and with explicit Pause motion, reduced motion, or Save-Data. Hardware hints select an economy treatment with fewer particles, lower canvas resolution, simpler shadows, and a shorter device exchange. Users can gather the desk fragments, navigate feature tabs with arrow keys or Home/End, and replay the intro. All feature chapters remain readable without JavaScript.

Light/dark choice persists across pages. Native cross-document View Transitions preserve header continuity and animate page content where supported; links and browser history remain native. The shared header has one **Legal** destination; legal documents retain their inner Privacy/Terms switch, and the footer links to both documents.

The app extension is documented in [onboarding-commerce.md](../.impeccable/surfaces/onboarding-commerce.md). Current captures and checks are in `.impeccable/review/onboarding-commerce/`: native iPhone/iPad Simulator, app browser widths 320/390/820, and website widths 1440/390. Performance results are local laboratory measurements with the limits described in the auth/purchases report; they are not physical-device or production Web Vitals results.

## Local preview

```sh
cd website
npm run dev
```

Open `http://localhost:4178`. To produce a deploy artifact:

```sh
SITE_URL=https://YOUR_DOMAIN \
VITE_SUPABASE_URL='https://YOUR_PROJECT.supabase.co' \
VITE_SUPABASE_PUBLISHABLE_KEY='sb_publishable_…' \
LEGAL_APPROVED=true npm run build
npm run check
```

Deploy the `website/dist` folder as static files. Publisher defaults come from this repository's [src/data/publisher.json](src/data/publisher.json). Keep it consistent with the app's publisher record when updating publisher details. Environment overrides remain available through `PUBLISHER_NAME`, `PUBLISHER_POSTAL_ADDRESS`, `SUPPORT_EMAIL`, and `PRIVACY_EMAIL`.

A public build still requires `LEGAL_APPROVED=true`, a populated postal address, and the HTTPS Supabase URL/public publishable key used by the secure account-deletion flow. Configured identity does not grant legal approval or establish backend readiness. Never use a service-role key. `APP_STORE_URL` and `PLAY_STORE_URL` configure the lower store links; the hero uses the current store listing URLs. After launch, set the app's `VITE_PRIVACY_POLICY_URL`, `VITE_TERMS_URL`, and `VITE_SUPPORT_URL` to this site's public paths and rebuild the app.

For Yandex Webmaster, add the verification token as `YANDEX_VERIFICATION` in Netlify's site environment once a domain you control is attached. For optional Yandex Metrica, add the numeric counter ID as `YANDEX_METRIKA_ID`. The site then shows a consent choice and loads Metrica only after the visitor allows it; the privacy page gets a matching disclosure. No counter or verification token is currently hardcoded into the site. The build does not add Google Analytics, Tag Manager, or conversion tracking.

The earlier local-preview legal callout is omitted from both local and public page output. The public build gates above still apply; removing a visual callout is not legal approval.

## Release review required

- The shared publisher record is **Andrii Plashevskyi**, **173 Victor Lewis Dr, Winnipeg, MB R3P 1Z9, Canada**, with **shapeinc25@gmail.com** for support and privacy. The existing governing-law default remains **Ukraine**; updating publisher identity/address did not change jurisdiction.
- Review Privacy/Terms for the actual launch regions and confirm governing law and monitored contacts before public release. Do not claim legal clearance from this website build alone.
- Confirm the actual Supabase region, active subprocessors, retention/backup windows and notification payloads before publishing the privacy text. Keep it consistent with `src/data/legal.ts` in the app.
- Replace demo screenshots if the release UI changes. Never publish screenshots containing real users' child or medicine data.
- Set final domain, Supabase public config and store URLs; verify the secure `/delete-account/` flow after deployment, then submit this page and the public HTTPS Privacy/Terms URLs in App Store Connect and Google Play Console.
# uskeep
