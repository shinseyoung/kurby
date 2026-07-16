import { useMemo } from 'react';
import * as THREE from 'three';
import type { NormalizedLandmark } from '../types';

/**
 * 업로드된 이미지와 MediaPipe 랜드마크를 기반으로 얼굴 영역만 마스킹하여 3D 텍스처로 반환합니다.
 */
export const useFaceTexture = (imageElement: HTMLImageElement | null, landmarks: NormalizedLandmark[] | null) => {
  const texture = useMemo(() => {
    if (!imageElement || !landmarks) return null;

    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 얼굴 윤곽선(Face Oval) 랜드마크 인덱스
    const faceOvalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

    // 1. 얼굴 모양대로 마스크(클리핑 패스) 생성
    ctx.beginPath();
    faceOvalIndices.forEach((index, i) => {
      const lm = landmarks[index];
      const x = lm.x * canvas.width;
      const y = lm.y * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.clip();

    // 2. 마스킹된 영역에만 이미지 그리기
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // 3. Three.js Texture로 변환
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    
    return tex;
  }, [imageElement, landmarks]);

  return texture;
};