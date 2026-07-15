import React, { useState, useRef } from 'react';
import { FEED_ITEMS } from '../constants/items';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import type { MouthPosition } from '../types';

const MainPage: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mouthPos, setMouthPos] = useState<MouthPosition | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // 2단계: AI 훅 사용
  const { isReady, detectMouth } = useFaceLandmarker();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setMouthPos(null); // 사진 변경 시 기존 입 좌표 초기화
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current && isReady) {
      // 사진 렌더링이 완료되면 입 좌표 감지
      const pos = detectMouth(imageRef.current);
      setMouthPos(pos);
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      
      {/* 왼쪽: 사물 리스트 (Sidebar) */}
      <div className="w-24 md:w-32 bg-white shadow-md flex flex-col h-full overflow-y-auto border-r border-gray-200">
        <div className="p-4 text-center font-bold text-gray-700 text-sm md:text-base border-b border-gray-100 bg-white sticky top-0">
          먹이감
        </div>
        <div className="flex flex-col items-center p-2 space-y-4">
          {FEED_ITEMS.map((item) => (
            <div 
              key={item.id} 
              className="w-16 h-16 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 rounded-xl transition"
              title={item.name}
            >
              <span className="text-3xl select-none">{item.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽: 사진 및 캔버스 영역 (Main Area) */}
      <div className="flex-1 flex flex-col relative bg-gray-100">
        {/* 상단 툴바 */}
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <h2 className="text-xl font-bold text-gray-800">Feed Anything</h2>
          <div className="space-x-2 flex items-center">
            {/* 사진 업로드 버튼 */}
            <label className={`cursor-pointer px-4 py-2 text-white font-semibold rounded-lg text-sm transition ${isReady ? 'bg-pink-500 hover:bg-pink-600' : 'bg-gray-400 cursor-not-allowed'}`}>
              {isReady ? '사진 변경' : 'AI 로딩중...'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={!isReady} />
            </label>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg text-sm transition">
              녹화 / 공유하기
            </button>
          </div>
        </div>

        {/* 캔버스 (사진 표시 영역) */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div className="relative w-full max-w-3xl aspect-video bg-white rounded-2xl shadow-inner border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
            {!imageUrl ? (
              <div className="text-center">
                <span className="text-gray-400 text-lg font-medium block mb-2">📷 아직 사진이 없습니다</span>
                <label className="cursor-pointer text-pink-500 hover:underline">
                  클릭하여 사진 업로드
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={!isReady} />
                </label>
              </div>
            ) : (
              <div className="relative inline-flex max-w-full max-h-full">
                <img 
                  ref={imageRef}
                  src={imageUrl} 
                  alt="Uploaded" 
                  className="max-w-full max-h-full object-contain block"
                  onLoad={handleImageLoad}
                />
                
                {/* 2단계: AI가 감지한 입 위치 시각화 박스 */}
                {mouthPos && (
                  <div 
                    className="absolute border-4 border-green-500 bg-green-500/30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl"
                    style={{
                      left: mouthPos.x,
                      top: mouthPos.y,
                      width: mouthPos.width * 1.5, // 가시성을 위해 약간 크게 표시
                      height: mouthPos.height * 1.5
                    }}
                  >
                    <span className="text-xs text-white font-bold bg-green-600 px-1 rounded-sm absolute -top-5">입 발견!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;