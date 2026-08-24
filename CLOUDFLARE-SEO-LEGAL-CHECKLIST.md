# ReducePix launch checklist

This project is a static Cloudflare-hosted Site. The current public hostname is `https://reducepix.lurassica.chatgpt.site/`; replace it everywhere if a custom domain is selected.

## Cloudflare Pages

1. Create a Pages project named `reducepix`.
2. Choose either Git integration or Direct Upload. Cloudflare documents that a Git-integrated project cannot later be switched to Direct Upload, so choose the deployment model before launch.
3. For Direct Upload, run from this folder:

```powershell
npx wrangler pages deploy . --project-name=reducepix
```

4. For a custom subdomain, add the domain in Pages first, then create the documented CNAME to `<project>.pages.dev`. An apex domain requires the domain to be a Cloudflare zone with Cloudflare nameservers.
5. Confirm `_headers` is served, then test `/`, `/privacy.html`, `/terms.html`, `/robots.txt` and `/sitemap.xml` over HTTPS.

No build command, framework, runtime secret or image-processing backend is needed. All image processing runs in the browser.

## Legal launch gate

The current pages are honest technical notices, not a complete jurisdiction-specific legal package. Before public promotion, replace the launch placeholders in `privacy.html` and `terms.html` with:

- operator name and monitored privacy/contact address;
- applicable business identity, governing law and consumer terms;
- actual Cloudflare data-processing and retention details for the chosen plan;
- a data map covering request logs, security events, support messages, analytics, ads and any future third-party scripts;
- a consent mechanism before adding non-essential cookies, behavioral analytics, advertising or embedded third-party content where required;
- deletion/access/objection request handling and any age or restricted-use rules relevant to the audience.

“No upload” means image pixels do not leave the user's browser. It does not mean the site processes no personal data: ordinary hosting and security requests can still produce technical data. Keep this distinction in privacy copy and advertising claims.

## Google promotion

- Verify the final property in Google Search Console, submit the sitemap, and inspect the canonical HTTPS URL after deployment.
- Keep one canonical hostname and redirect or consistently link alternate hostnames.
- Keep the tool usable without an account and make the primary purpose, supported formats and local-processing behavior visible in HTML.
- Add future tool pages only when each page has a real working tool and useful original content. Do not mass-generate near-duplicate keyword pages, fake reviews or doorway pages.
- Validate JSON-LD with Rich Results Test and URL Inspection. Current markup uses `WebSite`, `WebPage` and visible FAQ content; it does not invent ratings. Google FAQ rich results are generally limited to authoritative government and health sites, so do not plan traffic around FAQ rich-result expansion.

## Bing promotion

- Verify the final property in Bing Webmaster Tools and submit the sitemap.
- Use IndexNow only after creating and safely storing its key. Submit changed public URLs after real content changes; do not submit every tool interaction or every generated output.
- Review crawl errors, canonical selection and mobile rendering after launch.

## Official references

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Google structured-data guidance: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google FAQ change: https://developers.google.com/search/blog/2023/08/howto-faq-changes
- Bing IndexNow guidance: https://blogs.bing.com/webmaster/September-2024/IndexNow-When-and-How-Websites-Should-Notify-Search-Engines
- Cloudflare Pages Git integration: https://developers.cloudflare.com/pages/get-started/git-integration/
- Cloudflare Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- European Commission privacy/cookies overview: https://commission.europa.eu/privacy-policy-websites-managed-european-commission_en
