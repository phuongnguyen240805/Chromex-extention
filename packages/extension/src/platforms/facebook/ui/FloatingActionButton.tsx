import React from 'react';

export const FloatingActionButton: React.FC = () => {
  return (
    <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
       <span className="text-white text-2xl">FB</span>
    </button>
  );
};
