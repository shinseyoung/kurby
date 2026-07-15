import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-100 p-4">
      <div className="text-center space-y-6 max-w-lg p-8 bg-white rounded-3xl shadow-xl">
        <div className="text-6xl mb-4">😮</div>
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
          Feed Anything
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          친구 사진을 올리고<br/>무엇이든 입에 넣어보세요!
        </p>
        
        <div className="pt-6">
          <button
            onClick={onStart}
            className="w-full py-4 px-6 bg-pink-500 hover:bg-pink-600 text-white text-xl font-bold rounded-2xl shadow-lg transform transition active:scale-95"
          >
            📸 사진 업로드 하고 시작하기
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          * 사진은 서버에 저장되지 않고 브라우저에서만 처리됩니다.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;