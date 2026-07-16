import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '../types';

export const useFaceLandmarker = () => {
  const [isReady, setIsReady] = useState(false);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initLandmarker = async () => {
      try {
        const wasmUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
        const modelUrl = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        const vision = await FilesetResolver.forVisionTasks(wasmUrl);
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: "CPU"
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

  const detectFace = (imageElement: HTMLImageElement): NormalizedLandmark[] | null => {
    if (!landmarkerRef.current) return null;
    const result = landmarkerRef.current.detect(imageElement);
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;
    
    // 전체 478개 랜드마크 포인트 반환
    return result.faceLandmarks[0];
  };

  return { isReady, detectFace };
};
