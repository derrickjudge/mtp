# Detailed Website Specification for MTP Collective Photography

## Introduction
This specification outlines the plan for building a custom website for MTP Collective or Monkey Take Photo, a photography business focused on concerts, cars, and nature. The site will reflect the edgy, youthful style of a male photographer in his early 20s, allow photo uploads and categorization, and ensure a seamless experience on desktop and mobile devices. Built from scratch without platforms like WordPress, the site will leverage modern web technologies and AI-assisted coding to meet your technical preferences.

## Requirements

### Functional Requirements
- **Photo Management:**
  - Upload photos with metadata (title, description, category, tags).
  - Categorize photos by themes (Concerts, Cars, Nature) or specific events.
  - Search or filter photos by category, event, or tags.
- **Gallery Display:**
  - Grid-based gallery with thumbnails for each category.
  - Lightbox or modal for viewing full-size images with descriptions.
  - Responsive layout adapting to different screen sizes.
- **User Interface:**
  - Admin interface for photo uploads and management, secured with authentication.
  - Public-facing gallery with intuitive navigation and filtering options.
- **Additional Features (Optional):**
  - Blog section for sharing shoot stories or tips.
  - Shop for selling prints, integrated with payment gateways like Stripe.
  - Client area for private galleries, if needed.

### Non-Functional Requirements
- **Performance:** Fast-loading images using lazy loading and optimization techniques.
- **Scalability:** Cloud storage for photos to handle growing collections.
- **Security:** Secure admin access and HTTPS for data protection.
- **SEO:** Optimized for search engines with meta tags and alt texts.
- **Accessibility:** Basic accessibility features like keyboard navigation and alt texts.

### Design Requirements
- **Aesthetic:** Edgy, youthful vibe with dark themes, vibrant accents, and bold typography.
- **Branding:** Incorporate MTP Collective or Monkey Take Photo logo and branding elements.
- **Inspiration:** Draw from sites like Morrison Hotel Gallery (music-focused photography), Elia Locardi (travel photography), and Brett Stanley (underwater photography) for bold, image-heavy layouts.

## Website Architecture

### Pages
| Page        | Description                                                                 |
|-------------|-----------------------------------------------------------------------------|
| **Home**    | Hero section with a striking photo or slideshow, intro text, and category links. |
| **Portfolio**| Subdivided into Concerts, Cars, Nature; grid of thumbnails with lightbox view. |
| **About**   | Photographer’s bio, style, and behind-the-scenes photos.                     |
| **Contact** | Contact form, email, phone, and social media links.                          |
| **Blog**    | Optional; for sharing stories or updates (if desired).                       |
| **Shop**    | Optional; for selling prints with payment integration (if desired).          |

### Data Model
- **Photos:**
  - ID (unique identifier)
  - Title (e.g., “Rock Concert 2025”)
  - Description (e.g., “Shot at XYZ Festival”)
  - Category (e.g., Concerts, Cars, Nature)
  - Tags (e.g., “live music,” “vintage cars”)
  - Upload Date
  - File URL (AWS S3 link)
  - Thumbnail URL
- **Categories:**
  - ID
  - Name (e.g., Concerts)
  - Description
- **Users (if authentication is used):**
  - ID
  - Username
  - Password (hashed)
  - Role (e.g., admin)

## Technical Stack

### Frontend
- **Framework:** React.js with Next.js for server-side rendering and SEO benefits ([Next.js](https://nextjs.org/)).
- **Styling:** Tailwind CSS for rapid, responsive design ([Tailwind CSS](https://tailwindcss.com/)).
- **Libraries:**
  - React Photo Gallery for gallery grids.
  - React Lightbox for full-size image views.
  - React Dropzone for file uploads.

### Backend
- **Framework:** Node.js with Express.js or Next.js API routes for simplicity.
- **Database:** MongoDB for flexible, schema-less storage ([MongoDB](https://www.mongodb.com/)).
- **Authentication:** JSON Web Tokens (JWT) for secure admin access.

### Storage
- **Cloud Storage:** AWS S3 for scalable photo storage ([AWS S3](https://aws.amazon.com/s3/)).
- **Thumbnails:** Generate and store smaller images for faster loading.

### Deployment
- **Hosting:** Vercel for Next.js apps or AWS for full control ([Vercel](https://vercel.com/)).
- **CDN:** Cloudflare for faster asset delivery ([Cloudflare](https://www.cloudflare.com/)).
- **Domain:** Purchase a custom domain and set up SSL for security.

## Design Guidelines
- **Color Scheme:** Dark background (e.g., black or charcoal) with vibrant accents (e.g., neon red, electric blue) to reflect concert energy and nature’s vibrancy.
- **Typography:** Bold, sans-serif fonts like Montserrat or Futura for headings; clean fonts like Roboto for body text.
- **Layout:** Asymmetrical or dynamic layouts with subtle animations (e.g., hover effects, parallax scrolling).
- **Imagery:** Use high-quality photos as hero images or backgrounds, optimized for web with tools like TinyPNG ([TinyPNG](https://tinypng.com/)).

## Development Plan

### Phase 1: Planning
- **Define Scope:** Confirm desired features (e.g., blog, shop) and design preferences.
- **Wireframes:** Create mockups for each page using tools like Figma ([Figma](https://www.figma.com/)).
- **Tech Setup:** Initialize project with Next.js, MongoDB, and AWS S3.

### Phase 2: Frontend Development
- Set up Next.js project and Tailwind CSS.
- Build reusable components (header, footer, gallery, lightbox).
- Implement responsive layouts with media queries.
- Integrate with backend APIs for dynamic content.

### Phase 3: Backend Development
- Develop API endpoints for photo upload, retrieval, and categorization.
- Connect to MongoDB for data persistence.
- Set up AWS S3 for photo storage and thumbnail generation.
- Implement JWT-based authentication for admin interface.

### Phase 4: Admin Interface
- Create a protected admin page for photo management.
- Enable photo uploads, category assignment, and metadata editing.
- Ensure secure access with login functionality.

### Phase 5: Optimization
- Implement lazy loading for images using React libraries.
- Optimize images with compression tools.
- Use caching for static assets via CDN.

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