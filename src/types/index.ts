export type PageType = 'landing' | 'main';

export interface FeedItem {
  id: string;
  name: string;
  emoji: string;
  category: 'food' | 'vehicle' | 'bizarre';
}

export interface MouthPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}