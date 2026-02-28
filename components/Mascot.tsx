
import React, { useEffect, useState } from 'react';
import { MascotState } from '../types';

interface MascotProps {
  state: MascotState;
  onAnimationEnd?: () => void;
}

const Mascot: React.FC<MascotProps> = ({ state, onAnimationEnd }) => {
  const getDisplayText = (s: MascotState) => {
    switch (s) {
      case 'CHILD_SUCCESS': return "Awesome job, kiddo! 🎉";
      case 'PARENT_SUCCESS': return "Great role modeling! ⭐";
      case 'JOINT_SUCCESS': return "Teamwork makes the dream work! 🤝";
      case 'STREAK_BOOST': return "Wow! A new streak record! 🔥";
      case 'CHEER': return "Keep going! You're doing great!";
      default: return "Ready for today's goals?";
    }
  };

  const displayText = getDisplayText(state);

  useEffect(() => {
    if (state !== 'IDLE' && onAnimationEnd) {
      const timer = setTimeout(onAnimationEnd, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, onAnimationEnd]);

  return (
    <div className="flex flex-col items-center justify-center p-4 transition-all duration-500 ease-in-out">
      <div className={`text-6xl mb-2 transition-transform duration-300 ${state !== 'IDLE' ? 'scale-125' : 'scale-100'}`}>
        {state === 'IDLE' && '🐶'}
        {state === 'CHILD_SUCCESS' && '🥳'}
        {state === 'PARENT_SUCCESS' && '😎'}
        {state === 'JOINT_SUCCESS' && '🤩'}
        {state === 'STREAK_BOOST' && '🔥'}
        {state === 'CHEER' && '🐕'}
      </div>
      <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 relative">
        <p className="text-sm font-medium text-slate-700 text-center">{displayText}</p>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-l border-t border-slate-100"></div>
      </div>
    </div>
  );
};

export default Mascot;
