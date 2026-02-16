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
  removeItemsFromList: boolean; // Whether to remove items from the list after being drawn
  drawnItemIds: string[]; // List of IDs that have been opened
  history: BoxItem[]; // Last 10 opened items
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
    color: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    defaultPercentage: 50
  },
  'medio': {
    label: 'Medio',
    color: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.4)',
    defaultPercentage: 30
  },
  'valioso': {
    label: 'Valioso',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    defaultPercentage: 15
  },
  'muy-valioso': {
    label: 'Muy Valioso',
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    defaultPercentage: 4
  },
  'legendario': {
    label: 'Legendario',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    defaultPercentage: 1
  }
};

export const MAX_BOXES = 100;
