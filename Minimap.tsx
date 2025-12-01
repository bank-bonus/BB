
import React, { useMemo, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface MinimapProps {
  distance: number;
  isDriving?: boolean;
  onDriveComplete?: () => void;
  className?: string;
  isNightMode?: boolean;
}

export const Minimap: React.FC<MinimapProps> = ({ 
  distance, 
  isDriving = false,
  className = '',
  isNightMode = false
}) => {
  const [progress, setProgress] = useState(0);

  // Deterministic "random" map generation
  const seed = distance * 100;
  
  const route = useMemo(() => {
    // Generate simplified city block coordinates
    const start = { x: 50, y: 150 };
    const mid = { x: 150 + (seed % 50), y: 50 + (seed % 50) };
    const end = { x: 250 + (seed % 20), y: 150 + (seed % 60) };
    
    // Create a path string
    const pathD = `M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`;
    return { start, end, pathD };
  }, [seed]);

  // Handle driving animation
  useEffect(() => {
    if (isDriving) {
      setProgress(0);
      let startTimestamp: number;
      const duration = 2500; // 2.5s drive time

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const newProgress = Math.min(elapsed / duration, 1);
        
        setProgress(newProgress);

        if (newProgress < 1) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    } else {
      setProgress(0);
    }
  }, [isDriving]);

  // Calculate car position along the quadratic bezier curve
  const carPos = useMemo(() => {
    if (progress === 0) return route.start;
    if (progress === 1) return route.end;

    // Quadratic Bezier formula
    const t = progress;
    const p0 = route.start;
    const p1 = { x: 150 + (seed % 50), y: 50 + (seed % 50) }; // Re-calc mid for simplicity
    const p2 = route.end;

    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

    return { x, y };
  }, [progress, route, seed]);

  return (
    <div className={`w-full h-full relative overflow-hidden transition-colors duration-500 ${isNightMode ? 'bg-[#1a1b26]' : 'bg-[#f3f3f3]'} ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 300 250" preserveAspectRatio="xMidYMid slice">
        {/* City Blocks (Background) */}
        <defs>
          <pattern id="cityGrid" width="60" height="60" patternUnits="userSpaceOnUse">
             <rect width="50" height="50" fill={isNightMode ? '#24283b' : '#e5e7eb'} rx="2" ry="2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={isNightMode ? '#1a1b26' : '#ffffff'} />
        <rect width="100%" height="100%" fill="url(#cityGrid)" opacity="0.6" transform="rotate(15)" />

        {/* Route Outline */}
        <path 
          d={route.pathD} 
          stroke={isNightMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"} 
          strokeWidth="10" 
          fill="none" 
          strokeLinecap="round"
        />

        {/* Route Line */}
        <path 
          d={route.pathD} 
          stroke={isNightMode ? "#565f89" : "#212121"} 
          strokeWidth="6" 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray="10, 5"
        />

        {/* Driving Path (Green/Yellow) */}
        <path 
          d={route.pathD} 
          stroke={isNightMode ? "#FCE000" : "#FCE000"} 
          strokeWidth="6" 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray="1000"
          strokeDashoffset={1000 * (1 - progress)}
          className="transition-all duration-75 ease-linear"
        />

        {/* Start Point */}
        <circle cx={route.start.x} cy={route.start.y} r="8" fill={isNightMode ? "#fff" : "#212121"} />
        <circle cx={route.start.x} cy={route.start.y} r="3" fill={isNightMode ? "#000" : "white"} />
        
        {/* End Point (Pin) */}
        <g transform={`translate(${route.end.x - 12}, ${route.end.y - 24})`}>
             <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12zm0 16.2c-2.32 0-4.2-1.88-4.2-4.2s1.88-4.2 4.2-4.2 4.2 1.88 4.2 4.2-1.88 4.2-4.2 4.2z" fill={isNightMode ? "#FCE000" : "#000"} />
        </g>

        {/* The Taxi Car */}
        {(isDriving || progress === 0) && (
             <g transform={`translate(${carPos.x}, ${carPos.y})`}>
                <circle r="12" fill={isNightMode ? "rgba(252, 224, 0, 0.2)" : "rgba(252, 224, 0, 0.3)"} className="animate-ping" />
                <circle r="6" fill="#FCE000" stroke="#000" strokeWidth="2" />
             </g>
        )}
      </svg>
      
      {/* HUD Info */}
      <div className={`absolute top-4 right-4 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border flex items-center gap-2 ${isNightMode ? 'bg-black/60 border-white/10' : 'bg-white/90 border-gray-100'}`}>
         <span className={`text-xs font-semibold ${isNightMode ? 'text-gray-400' : 'text-gray-500'}`}>Маршрут</span>
         <span className={`text-sm font-bold ${isNightMode ? 'text-white' : 'text-black'}`}>{distance.toFixed(1)} км</span>
      </div>
    </div>
  );
};
