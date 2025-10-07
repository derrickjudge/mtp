# Detailed Website Specification for MTP Collective Photography — v2 (October 2025)

## Introduction
This specification updates the plan to focus the brand and IA on Sports, Music, and Street photography with Events as curated sets. The site reflects an edgy but professional aesthetic (dark UI with a pop accent), prioritizes speed, infinite scroll, and clean contact paths.

## Requirements

### Functional Requirements
- **Portfolio:**
  - Categories limited to Sports, Music, Street.
  - Infinite-scroll, masonry-like grid preserving image aspect ratios (no forced crops).
  - Lightbox for detail view; search/filter by category and tags.
- **Events:**
  - Event detail page: brief writeup + curated photo set.
  - Manual ordering of photos per event (`position`), and `is_top_selection` to prioritize.
- **Admin:**
  - Bulk uploads; auto-categorization by folder name.
  - Quick-apply tag presets (e.g., athletics, D1, night game).
  - CRUD for photos, categories (Sports/Music/Street), tags, events; drag-and-drop event ordering.
- **Privacy/UX:**
  - Disable right-click downloads; keep EXIF but never display publicly.
- **Articles:** Disabled for now to focus on photography and events.

### Non-Functional Requirements
- **Performance:** sharp-based resizing, responsive `sizes`, lazy loading, intersection observers; high Lighthouse perf.
- **Scalability:** Cloudflare R2 object storage; server-side uploads only.
- **Security:** NextAuth JWT auth, API rate limiting, optional admin IP allowlist; HTTPS.
- **SEO:** Route metadata, OpenGraph, JSON-LD (`ImageObject`, `Event`, `Article`), sitemap/robots; clean URLs.
- **Accessibility:** Reasonable defaults and reduced-motion support.

### Design Requirements
- **Aesthetic:** Edgy, youthful vibe with dark themes, vibrant accents, and bold typography.
- **Branding:** Incorporate MTP Collective or Monkey Take Photo logo and branding elements.
- **Inspiration:** Draw from sites like Morrison Hotel Gallery (music-focused photography), Elia Locardi (travel photography), and Brett Stanley (underwater photography) for bold, image-heavy layouts.

## Website Architecture

### Pages
| Page         | Description                                                                 |
|--------------|-----------------------------------------------------------------------------|
| **Home**     | Hero; latest/featured strips per category; CTA to About/Contact.           |
| **Portfolio**| Categories: Sports, Music, Street; infinite-scroll masonry grid + lightbox. |
| **Events**   | List of events; detail pages with writeup and curated ordered set.          |
| **About**    | Bio + “What I provide when shooting your event”; social links.              |
| **Contact**  | Simple contact form; spam protection; social links.                         |


### Data Model (PostgreSQL, native SQL at runtime)

- Use existing tables (`Photo`, `Category`, `Tag`, `Event`, `User`) as in codebase.
- Add join table enhancements for event ordering and top picks:
  ```sql
  -- EventPhotos join table extension
  ALTER TABLE "_EventToPhoto" ADD COLUMN position INT DEFAULT 0; -- if custom join table exists, otherwise create one
  ALTER TABLE "_EventToPhoto" ADD COLUMN is_top_selection BOOLEAN DEFAULT FALSE;
  ```

- Tags: continue many-to-many with simple presets managed in admin.

## Technical Stack

### Frontend
- Next.js (App Router) + React
- Tailwind CSS
- Lightbox and masonry-like layout using CSS columns + IntersectionObserver

### Backend
- Next.js API routes; NextAuth (JWT) with admin role
- Native SQL via `nativeDB`

### Storage
- Cloudflare R2 via AWS SDK S3-compatible client
- Image processing with `sharp` for responsive sizes and thumbnails

### Deployment
- Vercel; Cloudflare R2
- Environment variables per env; sitemap/robots

## Design Guidelines
- **Color Scheme:** Dark background (e.g., black or charcoal) with vibrant accents (e.g., neon red, electric blue) to reflect concert energy and nature’s vibrancy.
- **Typography:** Bold, sans-serif fonts like Montserrat or Futura for headings; clean fonts like Roboto for body text.
- **Layout:** Asymmetrical or dynamic layouts with subtle animations (e.g., hover effects, parallax scrolling).
- **Imagery:** Use high-quality photos as hero images or backgrounds, optimized for web with tools like TinyPNG ([TinyPNG](https://tinypng.com/)).

## Development Plan (Docs-focused excerpt)

### Phase 1: Planning
- **Define Scope:** Confirm desired features (e.g., blog, shop) and design preferences.
- **Wireframes:** Create mockups for each page using tools like Figma ([Figma](https://www.figma.com/)).
- **Tech Setup:** Confirm R2 env, ensure native SQL consolidation, remove Prisma runtime.

### Phase 2: Frontend Development
- Set up Next.js project and Tailwind CSS.
- Build reusable components (header, footer, gallery, lightbox).
- Implement responsive layouts with media queries.
- Integrate with backend APIs for dynamic content.

### Phase 3: Backend Development
- Develop/confirm API endpoints for photos/events/tags/categories/users.
- Ensure server-side-only R2 uploads; sharp processing; accept `tagIds`.
- Add rate limiting utility; optional admin IP allowlist.

### Phase 4: Admin Interface
- Create a protected admin page for photo management.
- Enable photo uploads, category assignment, and metadata editing.
- Ensure secure access with login functionality.

### Phase 5: Optimization
- Lazy loading and responsive `sizes`; sharp variants; CDN via Vercel/Cloudflare.

### Phase 6: Testing
- Test on multiple devices (desktop, tablet, mobile) and browsers (Chrome, Firefox, Safari).
- Verify functionality of uploads, gallery, and contact form.
- Address performance bottlenecks and accessibility issues.

### Phase 7: Deployment
- Deploy to Vercel or AWS.
- Configure domain and SSL certificate.
- Set up analytics with Google Analytics ([Google Analytics](https://analytics.google.com/)).

### Phase 8: Maintenance
- Regularly update content with new photos.
- Monitor performance and security.
- Add features based on user feedback (e.g., shop, client galleries).

## Sample Code
Below is a basic example of a React component for the gallery page, demonstrating photo display and filtering.

<xaiArtifact artifact_id="5e386430-edcc-4733-bc32-f59ef386fd47" artifact_version_id="39d77224-a5a6-4745-ac67-b30b6fa8cb2e" title="Gallery.js" contentType="text/jsx">
import React, { useState, useEffect } from 'react';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import 'tailwindcss/tailwind.css';

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [category, setCategory] = useState('All');
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    // Fetch photos from API
    fetch(`/api/photos?category=${category}`)
      .then(res => res.json())
      .then(data => setPhotos(data));
  }, [category]);

  const categories = ['All', 'Concerts', 'Cars', 'Nature'];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-white mb-4">Portfolio</h1>
      <div className="mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            className={`mr-2 p-2 ${category === cat ? 'bg-blue-500' : 'bg-gray-700'} text-white rounded`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <img
            key={photo.id}
            src={photo.thumbnailUrl}
            alt={photo.title}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => {
              setPhotoIndex(index);
              setIsOpen(true);
            }}
          />
        ))}
      </div>
      {isOpen && (
        <Lightbox
          mainSrc={photos[photoIndex].fileUrl}
          nextSrc={photos[(photoIndex + 1) % photos.length].fileUrl}
          prevSrc={photos[(photoIndex + photos.length - 1) % photos.length].fileUrl}
          onCloseRequest={() => setIsOpen(false)}
          onMovePrevRequest={() => setPhotoIndex((photoIndex + photos.length - 1) % photos.length)}
          onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % photos.length)}
          imageTitle={photos[photoIndex].title}
          imageCaption={photos[photoIndex].description}
        />
      )}
    </div>
  );
};

export default Gallery;