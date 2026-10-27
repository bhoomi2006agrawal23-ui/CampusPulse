/**
 * CampusPulse Curated High-Fidelity Event Imagery & Fallback System
 * Provides categorized banners for college fests, competitions, seminars, and activities.
 */

export interface CategoryVisualMeta {
  imageUrl: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  iconName: string;
  categoryLabel: string;
}

export const FALLBACK_IMAGE_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%235A1E2D;stop-opacity:0.95' /%3E%3Cstop offset='100%25' style='stop-color:%23742A3D;stop-opacity:0.95' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)'/%3E%3Ccircle cx='400' cy='180' r='60' fill='%23D8C3A5' fill-opacity='0.25'/%3E%3Cpath d='M380 160h40v40h-40z' fill='%23FFF8E7' fill-opacity='0.9'/%3E%3Ctext x='400' y='270' font-family='sans-serif' font-size='22' font-weight='bold' fill='%23FFF8E7' text-anchor='middle'%3ECampusPulse Event%3C/text%3E%3Ctext x='400' y='300' font-family='sans-serif' font-size='14' fill='%23D8C3A5' text-anchor='middle'%3EInstitutional Campus Activity%3C/text%3E%3C/svg%3E";

export const CATEGORY_VISUALS: Record<string, CategoryVisualMeta> = {
  // 1. Technical Fests & Hackathons
  hackathons: {
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FFF8E7',
    badgeText: '#5A1E2D',
    accentColor: '#5A1E2D',
    iconName: 'Code2',
    categoryLabel: 'Technical Fest & Hackathon',
  },

  // 2. Coding Competitions & Development Sprints
  coding: {
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FFF8E7',
    badgeText: '#5A1E2D',
    accentColor: '#5A1E2D',
    iconName: 'Terminal',
    categoryLabel: 'Coding Competition',
  },

  // 3. Workshops & Hands-on Technical Deep Dives
  workshops: {
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FFF8E7',
    badgeText: '#5A1E2D',
    accentColor: '#742A3D',
    iconName: 'BookOpen',
    categoryLabel: 'Hands-on Workshop',
  },

  // 4. Seminars, Guest Lectures & Keynotes
  seminars: {
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FFF8E7',
    badgeText: '#5A1E2D',
    accentColor: '#5A1E2D',
    iconName: 'Presentation',
    categoryLabel: 'Seminar & Guest Lecture',
  },

  // 5. Cultural Festivals, Music, Dance & Theatre
  cultural: {
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FFF8E7',
    badgeText: '#5A1E2D',
    accentColor: '#5A1E2D',
    iconName: 'Palette',
    categoryLabel: 'Cultural & Arts Festival',
  },

  // 6. Sports Tournaments & Athletics Meets
  sports: {
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FFF8E7',
    badgeText: '#5A1E2D',
    accentColor: '#5A1E2D',
    iconName: 'Trophy',
    categoryLabel: 'Sports & Athletics',
  },

  // 7. College Conferences & Student Activities
  conferences: {
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FFF8E7',
    badgeText: '#5A1E2D',
    accentColor: '#5A1E2D',
    iconName: 'Users',
    categoryLabel: 'College Conference',
  },

  // Fallback / General Campus Event
  general: {
    imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FFF8E7',
    badgeText: '#5A1E2D',
    accentColor: '#5A1E2D',
    iconName: 'Calendar',
    categoryLabel: 'Campus Event',
  },
};

/**
 * Resolves high-fidelity image URL for any event, respecting custom bannerUrl
 * or matching category/title semantics, with resilient fallback.
 */
export function getEventImageUrl(event: {
  bannerUrl?: string;
  categoryId?: any;
  title?: string;
  description?: string;
}): string {
  if (event.bannerUrl && event.bannerUrl.trim().startsWith('http')) {
    return event.bannerUrl;
  }

  const cat = typeof event.categoryId === 'object' ? event.categoryId : null;
  const slug = (cat?.slug || cat?.name || '').toLowerCase();
  const title = (event.title || '').toLowerCase();
  const desc = (event.description || '').toLowerCase();
  const combined = `${slug} ${title} ${desc}`;

  if (combined.includes('hack') || combined.includes('tech fest') || combined.includes('hardware')) {
    return CATEGORY_VISUALS.hackathons.imageUrl;
  }
  if (
    combined.includes('code') ||
    combined.includes('coding') ||
    combined.includes('programming') ||
    combined.includes('algorithm') ||
    combined.includes('contest')
  ) {
    return CATEGORY_VISUALS.coding.imageUrl;
  }
  if (
    combined.includes('seminar') ||
    combined.includes('lecture') ||
    combined.includes('keynote') ||
    combined.includes('talk') ||
    combined.includes('speaker')
  ) {
    return CATEGORY_VISUALS.seminars.imageUrl;
  }
  if (
    combined.includes('workshop') ||
    combined.includes('masterclass') ||
    combined.includes('hands-on') ||
    combined.includes('bootcamp') ||
    combined.includes('architecture')
  ) {
    return CATEGORY_VISUALS.workshops.imageUrl;
  }
  if (
    combined.includes('cultural') ||
    combined.includes('music') ||
    combined.includes('theater') ||
    combined.includes('theatre') ||
    combined.includes('dance') ||
    combined.includes('art') ||
    combined.includes('showcase')
  ) {
    return CATEGORY_VISUALS.cultural.imageUrl;
  }
  if (
    combined.includes('sport') ||
    combined.includes('athletics') ||
    combined.includes('game') ||
    combined.includes('tournament') ||
    combined.includes('championship') ||
    combined.includes('cricket') ||
    combined.includes('football')
  ) {
    return CATEGORY_VISUALS.sports.imageUrl;
  }
  if (
    combined.includes('conference') ||
    combined.includes('symposium') ||
    combined.includes('summit') ||
    combined.includes('council') ||
    combined.includes('activity')
  ) {
    return CATEGORY_VISUALS.conferences.imageUrl;
  }

  return CATEGORY_VISUALS.general.imageUrl;
}

/**
 * Image error handler fallback to ensure images never break or display broken-image icons.
 */
export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>): void {
  const target = e.currentTarget;
  if (target.src !== FALLBACK_IMAGE_DATA_URI) {
    target.src = FALLBACK_IMAGE_DATA_URI;
  }
}
