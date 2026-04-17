import React from 'react';
import { motion } from 'framer-motion';

export default function Logo({ className = "", textClassName = "", iconSize = 36, withText = true, animated = true }) {
  const IconWrapper = animated ? motion.div : 'div';
  const iconProps = animated ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  } : {};

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Area */}
      <IconWrapper {...iconProps} className="relative flex items-center justify-center group cursor-pointer">
        {/* Glow behind the logo */}
        <div className="absolute inset-0 bg-linear-to-tr from-cyan-500 to-indigo-600 blur-md opacity-60 rounded-2xl group-hover:opacity-100 group-hover:blur-lg transition-all duration-500"></div>
        
        {/* Main Icon Box */}
        <div className="relative bg-linear-to-br from-slate-900 to-slate-800 p-2.5 rounded-2xl border border-slate-700/50 shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-transform duration-500 group-hover:rotate-3"
          >
            {/* Center Tower pole */}
            <path d="M12 21V5" stroke="url(#towerGlow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Top antenna */}
            <path d="M12 2V3" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Base */}
            <path d="M8 21H16" stroke="url(#towerGlow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            
            {/* Inner Signal Waves */}
            <path d="M7 14C5.5 12 5.5 8.5 7 6.5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 14C18.5 12 18.5 8.5 17 6.5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            
            {/* Outer Signal Waves */}
            <path d="M4 17C1.5 13.5 1.5 7.5 4 4" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 17C22.5 13.5 22.5 7.5 20 4" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            
            <defs>
              <linearGradient id="towerGlow" x1="12" y1="5" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22d3ee" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </IconWrapper>

      {/* Text Area */}
      {withText && (
        <div className={`flex flex-col justify-center ${textClassName}`}>
          <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-cyan-400 via-blue-400 to-indigo-500 drop-shadow-sm uppercase leading-none">
            Tower
          </span>
          <span className="text-[11px] font-bold tracking-[0.25em] text-slate-300 uppercase mt-1 leading-none ml-0.5">
            Monitor
          </span>
        </div>
      )}
    </div>
  );
}
