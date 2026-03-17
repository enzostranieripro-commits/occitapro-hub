export type SectorId = 'restauration' | 'btp' | 'transport' | 'commerce' | 'sante' | 'immobilier' | 'tourisme' | 'hotellerie';

export interface SectorConfig {
  id: SectorId;
  label: string;
  emoji: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontImport: string;
  cssClass: string;
}

export const SECTORS: SectorConfig[] = [
  {
    id: 'restauration',
    label: 'Restauration',
    emoji: '🍽️',
    description: 'Gestion de restaurant, traiteur, bar',
    primaryColor: '#8B0000',
    secondaryColor: '#D4A017',
    fontFamily: "'Playfair Display', serif",
    fontImport: 'Playfair+Display:wght@400;600;700',
    cssClass: 'sector-restauration',
  },
  {
    id: 'btp',
    label: 'BTP',
    emoji: '🏗️',
    description: 'Bâtiment, travaux publics, artisanat',
    primaryColor: '#2D2D2D',
    secondaryColor: '#F5A623',
    fontFamily: "'Roboto Condensed', sans-serif",
    fontImport: 'Roboto+Condensed:wght@400;600;700',
    cssClass: 'sector-btp',
  },
  {
    id: 'transport',
    label: 'Transport',
    emoji: '🚛',
    description: 'Logistique, livraison, transport routier',
    primaryColor: '#1A2C4E',
    secondaryColor: '#FF6B00',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontImport: 'Barlow+Condensed:wght@400;600;700',
    cssClass: 'sector-transport',
  },
  {
    id: 'commerce',
    label: 'Commerce',
    emoji: '🛒',
    description: 'Commerce de détail, épicerie, boutique',
    primaryColor: '#3A7D44',
    secondaryColor: '#FFF3CD',
    fontFamily: "'Nunito', sans-serif",
    fontImport: 'Nunito:wght@400;600;700',
    cssClass: 'sector-commerce',
  },
  {
    id: 'sante',
    label: 'Santé / Beauté',
    emoji: '💆',
    description: 'Institut, salon, cabinet paramédical',
    primaryColor: '#7C3AED',
    secondaryColor: '#F9E4E4',
    fontFamily: "'Raleway', sans-serif",
    fontImport: 'Raleway:wght@400;600;700',
    cssClass: 'sector-sante',
  },
  {
    id: 'immobilier',
    label: 'Immobilier',
    emoji: '🏡',
    description: 'Agence immobilière, gestion locative',
    primaryColor: '#006D77',
    secondaryColor: '#EDE8DC',
    fontFamily: "'Montserrat', sans-serif",
    fontImport: 'Montserrat:wght@400;600;700',
    cssClass: 'sector-immobilier',
  },
  {
    id: 'tourisme',
    label: 'Tourisme',
    emoji: '🌿',
    description: 'Agence de voyage, activités, séjours',
    primaryColor: '#2D6A4F',
    secondaryColor: '#F4A261',
    fontFamily: "'Poppins', sans-serif",
    fontImport: 'Poppins:wght@400;600;700',
    cssClass: 'sector-tourisme',
  },
  {
    id: 'hotellerie',
    label: 'Hôtellerie',
    emoji: '🏨',
    description: 'Hôtel, chambre d\'hôtes, résidence',
    primaryColor: '#1B2A4A',
    secondaryColor: '#F5E6C8',
    fontFamily: "'Cormorant Garamond', serif",
    fontImport: 'Cormorant+Garamond:wght@400;600;700',
    cssClass: 'sector-hotellerie',
  },
];

export const getSector = (id: SectorId): SectorConfig => {
  return SECTORS.find(s => s.id === id) || SECTORS[0];
};
