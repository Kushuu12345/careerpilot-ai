import React from 'react';
import { Compass } from 'lucide-react';

interface LogoProps {
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const Logo: React.FC<LogoProps> = ({ onClick, size = 'md' }) => {
  const content = (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-[#0F172A] text-white ${
          size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
        }`}
      >
        <Compass className={size === 'sm' ? 'w-4 h-4 text-blue-400' : 'w-4.5 h-4.5 text-blue-400'} />
      </span>
      <span
        className={`font-bold tracking-tight text-[#0F172A] ${
          size === 'sm' ? 'text-base' : 'text-lg'
        }`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        CareerPilot <span className="text-[#2563EB]">AI</span>
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg"
      >
        {content}
      </button>
    );
  }

  return content;
};
