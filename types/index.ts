export type RarityType = 'basico' | 'medio' | 'valioso' | 'muy-valioso' | 'legendario';

export type IdentifierType = 'numero' | 'letra' | 'alfanumerico' | 'imagen';

export interface BoxItem {
  id: string;
  identifier: string; // The actual identifier (number, letter, etc.)
  identifierType: IdentifierType;
  rarity: RarityType;
  percentage: number; // Probability percentage
  imageUrl?: string; // Optional image URL
  createdAt: Date;
}

export interface BoxList {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  items: BoxItem[];
  totalOpens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenResult {
  item: BoxItem;
  timestamp: Date;
  listId: string;
  listName: string;
}

export const RARITY_CONFIG: Record<RarityType, {
  label: string;
  color: string;
  glowColor: string;
  defaultPercentage: number;
}> = {
  'basico': {
    label: 'Básico',
    color: '#6b7280',
    glowColor: 'rgba(107, 114, 128, 0.5)',
    defaultPercentage: 50
  },
  'medio': {
    label: 'Medio',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    defaultPercentage: 30
  },
  'valioso': {
    label: 'Valioso',
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    defaultPercentage: 15
  },
  'muy-valioso': {
    label: 'Muy Valioso',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    defaultPercentage: 4
  },
  'legendario': {
    label: 'Legendario',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    defaultPercentage: 1
  }
};

export const MAX_BOXES = 100;
