# SEO Plan — MTP Collective (October 2025)

## Goals
- Improve discovery for Sports, Music, Street, and Events galleries.
- Strong social sharing previews; clean URL structure; fast pages.

## On-page SEO
- Titles and meta descriptions per route (Home, Portfolio categories, Events, About, Contact).
- Canonical URLs; breadcrumbs where relevant (Events).
- Image alt text from photo titles; fallbacks from categories/events.

## Structured Data (JSON-LD)
- ImageObject for portfolio items and lightbox images.
- Event for event pages (name, startDate, location, image, description).

## OpenGraph / Twitter Cards
- OG/Twitter meta per page; large image previews for Events and featured photos.
- Default site OG image; per-route overrides.

## Sitemaps and robots
- Dynamic sitemap: include portfolio categories, events, articles.
- robots.txt allowing crawl; disallow admin and API.

## URL structure
- Portfolio categories: `/portfolio/sports`, `/portfolio/music`, `/portfolio/street`.
- Events: `/events/{slug}`.

## Performance
- Responsive `sizes`; sharp thumbnails; lazy loading; reduce JS.
- Preload above-the-fold hero when applicable.

## Internal linking
- Home strips link to categories and recent events.
- Event pages link to related categories and About/Contact.
- Header/footer include Instagram link: https://www.instagram.com (replace later).

## Analytics
- Track page views, scroll-depth, contact submits, outbound social links.
- Use Plausible or Vercel Analytics; respect Do Not Track.

## Implementation checklist
- [ ] Per-route metadata functions populated.
- [ ] JSON-LD components for ImageObject/Event/Article.
- [ ] OG/Twitter tags wired.
- [ ] Sitemap and robots generated.
- [ ] Analytics initialized and events tracked.
