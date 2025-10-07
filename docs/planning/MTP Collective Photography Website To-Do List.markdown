# To-Do List for MTP Collective Photography Website — v2 (October 2025)

## Introduction
This to-do list updates priorities to reflect the Sports/Music/Street focus, Events curation with ordering/top selections, server-side R2 uploads, rate limiting, and SEO.

## To-Do List

### Foundation
- [ ] Consolidate data layer on native SQL (`nativeDB`); remove Prisma from runtime if unused.
- [ ] Confirm Cloudflare R2 envs in dev/test/prod; document in `docs/technical/setup-r2.md`.
- [ ] Decide and enforce server-side uploads only; remove any client-direct upload paths.
- [ ] Add API rate limiting utility; wire into all API routes; add admin IP allowlist (optional).

### Backend and Data Model
- [ ] Upload API accepts `tagIds`; server-side sharp processing; thumbnails + metadata (width/height/aspect).
- [ ] Add `position` and `is_top_selection` to event-photo join; write SQL migration.
- [ ] Bulk upload endpoint: support directory uploads, auto-categorize by folder, apply tag presets.
- [ ] Ensure categories are fixed to Sports, Music, Street in admin.

### Auth and Security
- [ ] Verify NextAuth JWT + middleware; enforce `ADMIN` role on `/admin/*`.
- [ ] Implement global API rate limit; add IP allowlist check for admin.
- [ ] Disable right-click downloads globally; audit for no secrets in client.

### Admin UX
- [ ] Bulk upload UI: folder-based auto-categorization and tag presets.
- [ ] Event editor: drag-and-drop reorder photos; toggle top selections; save ordering.
- [ ] Photo editor: category selection (Sports/Music/Street), tags, events.

### Frontend — Pages
- [ ] Home: hero, latest per category strips, CTA to About/Contact.
- [ ] Portfolio: masonry-like column grid preserving aspect; infinite scroll; lightbox.
- [ ] Events: list and detail pages; respect ordering and top selections.
- [ ] About: add “What I provide when shooting your event”; social links.
- [ ] Contact: simple form with spam protection; social links.
 - [ ] Articles: keep disabled for now (omit nav/routes); remove legacy links.

### Frontend — Components
- [ ] Fix `PhotoCollage` initializer and helper; ensure lazy reveal and skeletons.
- [ ] Add reusable GalleryGrid with `sizes`; contextmenu disable on images.
- [ ] Lightbox slides with titles/descriptions; keyboard nav.

### SEO & Analytics
- [ ] Add per-route metadata; OpenGraph; Twitter cards.
- [ ] Add JSON-LD for Image and Event; add sitemap/robots.
- [ ] Add analytics (Plausible or Vercel Analytics) and event tracking for CTAs.

### QA
- [ ] Unit tests for critical API routes (uploads, events ordering, rate limiting).
- [ ] Component tests for gallery grid and lightbox interactions.
- [ ] Manual flows: bulk upload, event ordering, category filters, contact form.

### Cross-Platform & Perf
- [ ] Validate responsive behavior across devices; refine `sizes` and priorities.
- [ ] Measure LCP/INP; ensure lazy loading thresholds are tuned.

### Deployment
- [ ] Verify R2 envs; rotate keys if needed; test uploads in non-prod.
- [ ] Deploy to Vercel; verify API rate limiting and admin access.
- [ ] Final content pass; announce.

## Notes
- **Task Management:** Use a tool like Trello, Notion, or a simple text file to track task completion.
- **AI Assistance:** Leverage AI tools (e.g., GitHub Copilot) to generate code, but manually review for accuracy, especially for security-critical components like authentication.
- **Dependencies:** Ensure tasks are completed in order, as later tasks depend on earlier ones (e.g., frontend relies on backend APIs).
- **Flexibility:** If a task takes longer than expected, split it across days or prioritize critical features to stay on schedule.
- **Documentation:** Update the README with setup, API, and deployment details as tasks are completed.

## Best Practices
- **Code Quality:** Follow consistent naming conventions and organize code into reusable components.
- **Version Control:** Commit changes after each task with descriptive messages (e.g., “Implemented photo upload API”).
- **Testing:** Test incrementally after each major feature to catch issues early.
- **Optimization:** Use lazy loading, image compression, and a CDN to ensure fast performance.
- **Security:** Verify HTTPS is enabled and sensitive data (e.g., passwords) is securely handled.

## Conclusion
This to-do list provides a clear, actionable set of tasks to build the MTP Collective photography website in 10 days. By checking off each task, you’ll create a professional, responsive, and visually striking site that showcases your portfolio. Start with project setup, use AI tools to streamline coding, and ensure thorough testing before deployment. Track progress to stay on schedule, and adjust as needed to deliver a high-quality website.