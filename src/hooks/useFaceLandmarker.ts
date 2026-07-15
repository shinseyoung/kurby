import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { MouthPosition } from '../types';

export const useFaceLandmarker = () => {
  const [isReady, setIsReady] = useState(false);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "[https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm](https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm)"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "[https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task)",
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "IMAGE",
          numFaces: 1
        });
        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        }
      } catch (error) {
        console.error("FaceLandmarker 초기화 실패:", error);
      }
    };
    initLandmarker();
    return () => { isMounted = false; };
  }, []);

  const detectMouth = (imageElement: HTMLImageElement): MouthPosition | null => {
    if (!landmarkerRef.current) return null;

    const result = landmarkerRef.current.detect(imageElement);
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;

    const landmarks = result.faceLandmarks[0];
    
    // 입술 랜드마크 인덱스 (MediaPipe 기준)
    // 61: 입꼬리 좌측, 291: 입꼬리 우측, 0: 윗입술 중앙, 17: 아랫입술 중앙
    const left = landmarks[61];
    const right = landmarks[291];
    const top = landmarks[0];
    const bottom = landmarks[17];

    // 화면상 렌더링된 이미지의 실제 픽셀 크기 기준 계산
    const imageWidth = imageElement.clientWidth;
    const imageHeight = imageElement.clientHeight;

    const x = ((left.x + right.x) / 2) * imageWidth;
    const y = ((top.y + bottom.y) / 2) * imageHeight;
    const width = Math.abs(right.x - left.x) * imageWidth;
    const height = Math.abs(bottom.y - top.y) * imageHeight;

    return { x, y, width, height };
  };

  return { isReady, detectMouth };
};