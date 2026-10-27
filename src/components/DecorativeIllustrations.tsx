import React from 'react';

interface DecorativeHeroIllustrationsProps {
  className?: string;
}

export const DecorativeHeroIllustrations: React.FC<DecorativeHeroIllustrationsProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      {/* Top-Right Botanical Branch & Burgundy Flower */}
      <svg
        className="absolute -top-10 -right-10 w-72 h-72 text-[#C58C91]/35 transform rotate-12 transition-all"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 180C60 140 90 90 120 40C130 25 150 10 170 5"
          stroke="#722F37"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Leaves */}
        <path d="M90 100C110 90 120 70 110 60C100 50 80 70 90 100Z" fill="#B7A89A" opacity="0.5" />
        <path d="M60 130C80 120 90 100 80 90C70 80 50 100 60 130Z" fill="#C58C91" opacity="0.6" />
        <path d="M120 70C140 65 150 45 140 35C130 25 115 45 120 70Z" fill="#722F37" opacity="0.4" />
        {/* Blossoming Flower */}
        <circle cx="170" cy="15" r="12" fill="#722F37" opacity="0.7" />
        <circle cx="165" cy="10" r="6" fill="#C58C91" opacity="0.8" />
        <circle cx="175" cy="20" r="6" fill="#C58C91" opacity="0.8" />
      </svg>

      {/* Bottom-Left Botanical & Vintage Microphone / Speaker Motif */}
      <svg
        className="absolute -bottom-8 -left-8 w-64 h-64 text-[#B7A89A]/40 transform -rotate-12"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 20C50 70 90 120 150 170"
          stroke="#722F37"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path d="M60 80C80 90 90 110 80 120C70 130 50 110 60 80Z" fill="#C58C91" opacity="0.5" />
        <path d="M100 130C120 140 130 160 120 170C110 180 90 160 100 130Z" fill="#722F37" opacity="0.4" />
      </svg>

      {/* Center-Right Subtle Microphone & Speaker Line Art Accent */}
      <div className="absolute right-12 top-1/2 transform -translate-y-1/2 opacity-15 hidden xl:flex flex-col items-center gap-6 pointer-events-none">
        {/* Vintage Microphone Icon Art */}
        <svg className="w-16 h-16 text-[#722F37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="9" y="2" width="6" height="10" rx="3" fill="#C58C91" fillOpacity="0.3" />
          <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>

        {/* Speaker Icon Art */}
        <svg className="w-16 h-16 text-[#722F37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="2" width="16" height="20" rx="2" fill="#B7A89A" fillOpacity="0.3" />
          <circle cx="12" cy="8" r="3" fill="#722F37" fillOpacity="0.4" />
          <circle cx="12" cy="16" r="4" fill="#722F37" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
};

interface MusicEventDecorationsProps {
  className?: string;
}

export const MusicEventBadgeDecorations: React.FC<MusicEventDecorationsProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 text-[#722F37] ${className}`}>
      {/* Mini Microphone */}
      <svg className="w-4 h-4 text-[#722F37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="2" width="6" height="10" rx="3" fill="#C58C91" fillOpacity="0.4" />
        <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
        <line x1="12" y1="18" x2="12" y2="22" />
      </svg>
      {/* Mini Speaker */}
      <svg className="w-4 h-4 text-[#722F37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" fill="#B7A89A" fillOpacity="0.4" />
        <circle cx="12" cy="12" r="3" fill="#722F37" fillOpacity="0.5" />
      </svg>
    </div>
  );
};
