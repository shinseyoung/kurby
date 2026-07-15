import type { FeedItem } from '../types';

export const FEED_ITEMS: FeedItem[] = [
  // 음식
  { id: 'f1', name: '바게트', emoji: '🥖', category: 'food' },
  { id: 'f2', name: '햄버거', emoji: '🍔', category: 'food' },
  { id: 'f3', name: '피자', emoji: '🍕', category: 'food' },
  { id: 'f4', name: '수박', emoji: '🍉', category: 'food' },
  { id: 'f5', name: '치킨', emoji: '🍗', category: 'food' },
  { id: 'f6', name: '도넛', emoji: '🍩', category: 'food' },
  
  // 탈것
  { id: 'v1', name: '자동차', emoji: '🚗', category: 'vehicle' },
  { id: 'v2', name: '버스', emoji: '🚌', category: 'vehicle' },
  { id: 'v3', name: '비행기', emoji: '✈️', category: 'vehicle' },
  { id: 'v4', name: '기차', emoji: '🚂', category: 'vehicle' },
  { id: 'v5', name: '우주선', emoji: '🚀', category: 'vehicle' },
  { id: 'v6', name: '경찰차', emoji: '🚓', category: 'vehicle' },

  // 병맛 사물
  { id: 'b1', name: '지구', emoji: '🌍', category: 'bizarre' },
  { id: 'b2', name: '에펠탑', emoji: '🗼', category: 'bizarre' },
  { id: 'b3', name: '벽돌', emoji: '🧱', category: 'bizarre' },
  { id: 'b4', name: '상어', emoji: '🦈', category: 'bizarre' },
  { id: 'b5', name: '소파', emoji: '🛋️', category: 'bizarre' },
  { id: 'b6', name: '변기', emoji: '🚽', category: 'bizarre' },
  { id: 'b7', name: '노트북', emoji: '💻', category: 'bizarre' },
  { id: 'b8', name: '모아이', emoji: '🗿', category: 'bizarre' },
];