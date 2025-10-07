# Security & Rate Limiting Plan — MTP Collective (October 2025)

## Objectives
- Protect API endpoints from abuse.
- Reduce attack surface for admin area.
- Preserve user privacy and content rights.

## Authentication & Authorization
- NextAuth (JWT) with `ADMIN` role required for `/admin/*`.
- Short session maxAge; secure cookies; HTTPS only.

## API Rate Limiting
- Per-IP limits for all API routes (e.g., 60 req/min default; tighter for mutation routes).
- Bursty allowance with token bucket; 429 on exceed.
- Separate keys for authenticated admin vs public.

## Admin IP Allowlist (Optional)
- Env var list of allowed CIDRs.
- Middleware check on `/admin/*`; currently disabled (empty list) per decision.

## Storage & Secrets
- Server-side uploads to Cloudflare R2 only; no secrets in client.
- Minimum privileges on R2 tokens; rotate periodically.

## Content Protection
- Disable right-click `contextmenu` on public images.
- Terms statement: images are property of the photographer; no use/repost without consent.

## Logging & Monitoring
- Log auth events, rate limit breaches (sampled to avoid noise).
- Alerting on repeated 401/429 spikes.

## Implementation Checklist
- [ ] Add rate-limiting utility and wrap all API handlers.
- [ ] Add optional admin IP allowlist middleware.
- [ ] Ensure server-side-only R2 uploads and secure env handling.
- [ ] Add site-wide right-click disable for images.
- [ ] Add Terms/Usage notice to footer/About.
