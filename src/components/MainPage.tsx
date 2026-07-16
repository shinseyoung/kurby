import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { PanInfo, motion, AnimatePresence } from 'framer-motion';

import { FEED_ITEMS } from '../constants/items';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { useFaceTexture } from '../hooks/useFaceTexture';
import { useFaceWarp } from '../hooks/useFaceWarp';
import DraggableItem from './DraggableItem';
import { Character3D } from './Character3D';

import type { NormalizedLandmark } from '../types';

const MainPage: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [globalMouthTarget, setGlobalMouthTarget] = useState({ x: 0, y: 0 });

  const hiddenImageRef = useRef<HTMLImageElement>(null);
  
  // Custom Hooks 활용
  const { isReady, detectFace } = useFaceLandmarker();
  const faceTexture = useFaceTexture(hiddenImageRef.current, landmarks);
  const { warpProgress, swallowingItem, handleDrag, handleDragEnd } = useFaceWarp();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUrl(URL.createObjectURL(file));
      setLandmarks(null);
    }
  };

  const handleHiddenImageLoad = () => {
    if (hiddenImageRef.current && isReady) {
      const detected = detectFace(hiddenImageRef.current);
      setLandmarks(detected);
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden relative">
      
      {/* 랜드마크 추출용 보이지 않는 원본 이미지 */}
      {imageUrl && (
        <img 
          ref={hiddenImageRef} 
          src={imageUrl} 
          alt="hidden" 
          className="hidden" 
          onLoad={handleHiddenImageLoad} 
        />
      )}

      {/* 음식 흡수 애니메이션 뷰포트 레이어 */}
      <AnimatePresence>
        {swallowingItem && (
          <motion.div
            initial={{ left: swallowingItem.startX, top: swallowingItem.startY, x: "-50%", y: "-50%", scale: 1.5, rotate: 0 }}
            animate={{ left: globalMouthTarget.x, top: globalMouthTarget.y, scale: 0, rotate: 720 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeIn" }}
            className="fixed z-50 text-6xl pointer-events-none drop-shadow-xl"
          >
            {swallowingItem.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 좌측 사이드바: 아이템 리스트 */}
      <div className="w-24 md:w-32 bg-white shadow-md flex flex-col h-full overflow-y-auto border-r border-gray-200 z-20">
        <div className="p-4 text-center font-bold text-gray-700 text-sm md:text-base border-b border-gray-100 bg-white sticky top-0">
          먹이감
        </div>
        <div className="flex flex-col items-center p-2 space-y-2">
          {FEED_ITEMS.map((item) => (
            <DraggableItem 
              key={item.id} 
              item={item} 
              onDrag={(e, info) => handleDrag(info, globalMouthTarget)} 
              onDragEnd={(e, info, item) => handleDragEnd(info, item, globalMouthTarget)} 
            />
          ))}
        </div>
      </div>

      {/* 메인 3D 렌더링 뷰포트 */}
      <div className="flex-1 flex flex-col relative bg-gray-100">
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <h2 className="text-xl font-bold text-gray-800">Feed Anything 3D</h2>
          <div className="space-x-2 flex items-center">
            <label className={`cursor-pointer px-4 py-2 text-white font-semibold rounded-lg text-sm transition ${isReady ? 'bg-pink-500 hover:bg-pink-600' : 'bg-gray-400 cursor-not-allowed'}`}>
              {isReady ? '사진 업로드' : 'AI 모델 로딩 중...'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={!isReady} />
            </label>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative cursor-move">
          {!imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <span className="text-gray-400 font-medium bg-white/80 px-4 py-2 rounded-xl">📷 우측 상단에서 사진을 업로드해주세요</span>
            </div>
          )}
          
          {/* React Three Fiber 3D 캔버스 */}
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Environment preset="city" />
            
            {/* 향후 확장(얼굴 회전 등)을 위해 OrbitControls 추가 */}
            <OrbitControls enableZoom={false} enablePan={false} />

            <React.Suspense fallback={null}>
              <Character3D 
                texture={faceTexture} 
                landmarks={landmarks} 
                warpProgress={warpProgress} 
                onMouthPositionUpdate={setGlobalMouthTarget}
              />
            </React.Suspense>
          </Canvas>

        </div>
      </div>
    </div>
  );
};

export default MainPage;