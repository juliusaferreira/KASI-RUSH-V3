import React, { useEffect, useState } from 'react';
import { ComicSplashEvent } from '../types/game';

interface ComicSplashOverlayProps {
  events: ComicSplashEvent[];
  onRemoveEvent: (id: string) => void;
}

export const ComicSplashOverlay: React.FC<ComicSplashOverlayProps> = ({ events, onRemoveEvent }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {events.map((ev) => (
        <ComicSplashBurst key={ev.id} event={ev} onDone={() => onRemoveEvent(ev.id)} />
      ))}
    </div>
  );
};

interface ComicSplashBurstProps {
  event: ComicSplashEvent;
  onDone: () => void;
}

const ComicSplashBurst: React.FC<ComicSplashBurstProps> = ({ event, onDone }) => {
  const [animStage, setAnimStage] = useState<'enter' | 'pop' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStage('pop'), 20);
    const t2 = setTimeout(() => setAnimStage('exit'), 550);
    const t3 = setTimeout(() => onDone(), 750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  // Style configs for different comic burst types
  const styleConfig = {
    boom: {
      starFill: '#ef4444',
      innerFill: '#facc15',
      textColor: '#ffffff',
      shadowColor: '#7f1d1d',
      tag: 'IMPACT!',
    },
    pow: {
      starFill: '#f97316',
      innerFill: '#fef08a',
      textColor: '#ffffff',
      shadowColor: '#9a3412',
      tag: 'KAPOW!',
    },
    wow: {
      starFill: '#facc15',
      innerFill: '#ffffff',
      textColor: '#dc2626',
      shadowColor: '#854d0e',
      tag: 'BONANZA!',
    },
    zoom: {
      starFill: '#06b6d4',
      innerFill: '#a5f3fc',
      textColor: '#0f172a',
      shadowColor: '#164e63',
      tag: 'SPEED!',
    },
    kapow: {
      starFill: '#dc2626',
      innerFill: '#fde047',
      textColor: '#ffffff',
      shadowColor: '#000000',
      tag: 'CRASH!',
    },
    power: {
      starFill: '#8b5cf6',
      innerFill: '#fef08a',
      textColor: '#ffffff',
      shadowColor: '#4c1d95',
      tag: 'BOOST!',
    },
  }[event.style] || {
    starFill: '#facc15',
    innerFill: '#ffffff',
    textColor: '#ef4444',
    shadowColor: '#000000',
    tag: 'COMIC!',
  };

  // Randomized slight offsets around player action area
  const posX = event.x ?? (window.innerWidth / 2 + (Math.random() - 0.5) * 120);
  const posY = event.y ?? (window.innerHeight * 0.52 + (Math.random() - 0.5) * 80);

  return (
    <div
      className="absolute transition-all duration-300 ease-out select-none"
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        transform: `translate(-50%, -50%) rotate(${event.rotation}deg) scale(${
          animStage === 'enter' ? 0.2 : animStage === 'pop' ? 1.15 : 0.95
        })`,
        opacity: animStage === 'exit' ? 0 : 1,
      }}
    >
      {/* Comic Halftone / Starburst Burst SVG Graphic */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 260 160"
          className="w-48 sm:w-60 h-28 sm:h-36 drop-shadow-[5px_5px_0px_#000000] filter"
        >
          {/* Outer Comic Starburst (Jagged Points) */}
          <polygon
            points="
              130,5  150,35 185,15 180,50 215,40 200,75 
              245,80 205,100 235,125 195,130 205,155 170,140 
              150,158 130,140 105,158 90,138 55,155 65,128 
              20,122 55,98 15,75 55,62 30,35 70,45 75,12 110,35
            "
            fill={styleConfig.starFill}
            stroke="#000000"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Inner Layer Starburst */}
          <polygon
            points="
              130,20 146,45 174,28 170,56 198,48 186,76 
              222,80 190,96 214,116 182,120 190,140 162,128 
              146,142 130,128 110,142 98,126 70,140 78,118 
              42,114 70,95 38,76 70,66 50,45 82,52 86,26 114,45
            "
            fill={styleConfig.innerFill}
            stroke="#000000"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Action Impact Speed Lines / Comic puffs */}
          <line x1="20" y1="20" x2="45" y2="40" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
          <line x1="240" y1="25" x2="215" y2="45" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="140" x2="42" y2="125" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
          <line x1="245" y1="135" x2="220" y2="120" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
        </svg>

        {/* Action Onomatopoeia Comic Text ("BOOM!", "POW!", "WOW!", "ZOOM!") */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-arcade text-3xl sm:text-4xl tracking-wider uppercase font-black"
            style={{
              color: styleConfig.textColor,
              WebkitTextStroke: '2.5px #000000',
              textShadow: '3px 3px 0px #000000',
            }}
          >
            {event.text}
          </span>
        </div>
      </div>
    </div>
  );
};
