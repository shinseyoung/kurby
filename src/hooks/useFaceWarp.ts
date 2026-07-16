import { useState, useRef } from 'react';
import { PanInfo, animate } from 'framer-motion';
import type { FeedItem } from '../types';

/**
 * 음식 드래그에 따른 입 벌어짐 계산 및 먹기 성공/복원 애니메이션 상태를 관리합니다.
 */
export const useFaceWarp = () => {
  const warpProgress = useRef(0);
  const [swallowingItem, setSwallowingItem] = useState<{ emoji: string, startX: number, startY: number } | null>(null);

  const playEatSound = () => {
    const gulp = new Audio('https://cdn.freesound.org/previews/412/412068_7527634-lq.mp3');
    const bite = new Audio('https://cdn.freesound.org/previews/234/234244_4111354-lq.mp3');
    bite.volume = 0.5;
    gulp.volume = 0.8;
    bite.play().catch(() => {});
    setTimeout(() => gulp.play().catch(() => {}), 300);
  };

  const handleDrag = (info: PanInfo, targetCenter: { x: number, y: number }) => {
    if (swallowingItem) return;
    const distance = Math.hypot(targetCenter.x - info.point.x, targetCenter.y - info.point.y);
    
    // 150px 이내부터 입이 서서히 벌어지기 시작 (최대 1.0)
    warpProgress.current = Math.max(0, 1 - (distance / 150));
  };

  const handleDragEnd = (info: PanInfo, item: FeedItem, targetCenter: { x: number, y: number }) => {
    const distance = Math.hypot(targetCenter.x - info.point.x, targetCenter.y - info.point.y);
    
    if (distance < 80) { // 80px 이내면 먹기 판정
      playEatSound();
      setSwallowingItem({ emoji: item.emoji, startX: info.point.x, startY: info.point.y });
      
      // 순간적으로 크게 입을 벌림 (Warp 극대화)
      animate(warpProgress.current, 2.5, {
        duration: 0.15,
        onUpdate: (v) => { warpProgress.current = v; },
      });

      // 흡수 후 원래대로 입 복원
      setTimeout(() => {
        setSwallowingItem(null);
        animate(warpProgress.current, 0, {
          duration: 0.4,
          ease: "easeOut",
          onUpdate: (v) => { warpProgress.current = v; },
        });
      }, 500);

    } else { // 못 먹고 드래그를 놨을 때 자연스럽게 닫힘
      animate(warpProgress.current, 0, {
        duration: 0.3,
        onUpdate: (v) => { warpProgress.current = v; },
      });
    }
  };

  return { warpProgress, swallowingItem, handleDrag, handleDragEnd };
};