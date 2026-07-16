export type PageType = 'landing' | 'main';

export interface FeedItem {
  id: string;
  name: string;
  emoji: string;
  category: 'food' | 'vehicle' | 'bizarre';
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}