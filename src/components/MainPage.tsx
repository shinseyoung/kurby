import React from 'react';
import { FEED_ITEMS } from '../constants/items';

const MainPage: React.FC = () => {
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
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg text-sm transition">
            녹화 / 공유하기
          </button>
        </div>

        {/* 캔버스 (사진 표시 영역) */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl aspect-video bg-white rounded-2xl shadow-inner border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-lg font-medium">📷 업로드된 사진 영역 (준비 중)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;