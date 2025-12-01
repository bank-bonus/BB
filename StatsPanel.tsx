
import React from 'react';
import { PlayerState, Car } from '../types';
import { Star, Zap, Crown } from 'lucide-react';
import { getPriorityLevel, getNextPriorityTarget } from '../constants';

interface StatsPanelProps {
  player: PlayerState;
  currentCar: Car;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ player, currentCar }) => {
  const priority = getPriorityLevel(player.totalRides);
  const PriorityConfig = priority.config;
  const nextTarget = getNextPriorityTarget(player.totalRides);

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pt-safe-top">
      <div className="bg-white/95 backdrop-blur-md mx-4 mt-4 p-3 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-2">
           {/* Rating */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-sm text-gray-800">{player.rating.toFixed(2)}</span>
          </div>

          {/* Money */}
          <div className="flex flex-col items-center">
               <div className="font-black text-xl leading-none">{Math.floor(player.money)} ₽</div>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
            <Zap size={16} className={player.energy < 20 ? "text-red-500 fill-red-500" : "text-gray-400 fill-gray-400"} />
            <span className={`font-bold text-sm ${player.energy < 20 ? "text-red-500" : "text-gray-800"}`}>{player.energy}</span>
          </div>
        </div>

        {/* Priority Bar */}
        <div className="flex items-center justify-between gap-3">
           <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wider shadow-sm w-full justify-between ${PriorityConfig.color}`}>
              <div className="flex items-center gap-1">
                <Crown size={12} />
                {PriorityConfig.label}
              </div>
              {nextTarget ? (
                 <span className="opacity-80 text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
                    {player.totalRides}/{nextTarget}
                 </span>
              ) : (
                <span className="opacity-80 text-[10px]">MAX</span>
              )}
           </div>
        </div>
      </div>
      
      {/* Day / Car Pill */}
      <div className="flex justify-center mt-2">
          <div className="bg-black/80 backdrop-blur text-white text-[10px] px-3 py-1 rounded-full font-medium shadow-md">
            День {player.day} • {currentCar.name}
          </div>
      </div>
    </div>
  );
};