
import React, { useEffect, useState } from 'react';
import { MascotState } from '../types';

interface MascotProps {
  state: MascotState;
  onAnimationEnd?: () => void;
}

const Mascot: React.FC<MascotProps> = ({ state, onAnimationEnd }) => {
  const [displayText, setDisplayText] = useState("Hi Super Parent!");

  useEffect(() => {
    switch (state) {
      case 'CHILD_SUCCESS':
        setDisplayText("Awesome job, kiddo! 🎉");
        break;
      case 'PARENT_SUCCESS':
        setDisplayText("Great role modeling! ⭐");
        break;
      case 'JOINT_SUCCESS':
        setDisplayText("Teamwork makes the dream work! 🤝");
        break;
      case 'STREAK_BOOST':
        setDisplayText("Wow! A new streak record! 🔥");
        break;
      case 'CHEER':
        setDisplayText("Keep going! You're doing great!");
        break;
      default:
        setDisplayText("Ready for today's goals?");
    }

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
