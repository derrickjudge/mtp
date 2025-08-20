import { placeholderImages } from './placeholderImages';

export const imageUrls = {
  hero: placeholderImages.hero,
  about: placeholderImages.about,
  contact: placeholderImages.contact,
  portfolio: placeholderImages.portfolio,
  services: placeholderImages.services,
  featured: {
    1: placeholderImages.featured1,
    2: placeholderImages.featured2,
    3: placeholderImages.featured3,
  },
  specialties: {
    concert: placeholderImages.concert,
    automotive: placeholderImages.automotive,
    nature: placeholderImages.nature,
  },
  team: {
    photographer1: placeholderImages.team1,
    photographer2: placeholderImages.team2,
    photographer3: placeholderImages.team3,
  },
} as const; 