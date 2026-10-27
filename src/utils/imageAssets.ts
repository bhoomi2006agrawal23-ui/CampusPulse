/**
 * Curated high-fidelity campus event imagery and category fallbacks
 * Resolves images tastefully based on category name or slug.
 */

export interface CategoryVisualMeta {
  imageUrl: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  iconName: string;
}

export const CATEGORY_VISUALS: Record<string, CategoryVisualMeta> = {
  hackathons: {
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FBF7EF',
    badgeText: '#B58A3A',
    accentColor: '#C6A15B',
    iconName: 'Code2',
  },
  workshops: {
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FBF7EF',
    badgeText: '#71866F',
    accentColor: '#71866F',
    iconName: 'BookOpen',
  },
  cultural: {
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FBF7EF',
    badgeText: '#B58A3A',
    accentColor: '#C6A15B',
    iconName: 'Palette',
  },
  sports: {
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FBF7EF',
    badgeText: '#5A463B',
    accentColor: '#B58A3A',
    iconName: 'Trophy',
  },
  tech: {
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FBF7EF',
    badgeText: '#B58A3A',
    accentColor: '#C6A15B',
    iconName: 'Cpu',
  },
  general: {
    imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
    badgeBg: '#FBF7EF',
    badgeText: '#786B61',
    accentColor: '#C6A15B',
    iconName: 'Calendar',
  },
};

export function getEventImageUrl(event: { bannerUrl?: string; categoryId?: any; title?: string }): string {
  if (event.bannerUrl && event.bannerUrl.trim().startsWith('http')) {
    return event.bannerUrl;
  }

  const cat = typeof event.categoryId === 'object' ? event.categoryId : null;
  const slug = (cat?.slug || cat?.name || '').toLowerCase();

  if (slug.includes('hack') || slug.includes('code') || slug.includes('program')) {
    return CATEGORY_VISUALS.hackathons.imageUrl;
  }
  if (slug.includes('work') || slug.includes('seminar') || slug.includes('lecture') || slug.includes('masterclass')) {
    return CATEGORY_VISUALS.workshops.imageUrl;
  }
  if (slug.includes('cultur') || slug.includes('art') || slug.includes('music') || slug.includes('fest')) {
    return CATEGORY_VISUALS.cultural.imageUrl;
  }
  if (slug.includes('sport') || slug.includes('game') || slug.includes('esport') || slug.includes('athletic')) {
    return CATEGORY_VISUALS.sports.imageUrl;
  }

  return CATEGORY_VISUALS.general.imageUrl;
}
