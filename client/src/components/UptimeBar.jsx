import React, { useState } from 'react';

const UptimeBar = ({ history = [] }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Fallback to 90 operational days if empty
  const displayHistory = history.length > 0 ? history : Array.from({ length: 90 }).map((_, i) => ({
    date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0],
    uptime: 100,
  }));

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex items-end gap-[1px] sm:gap-[2px] h-10 w-full mt-2 overflow-hidden">
        {displayHistory.map((day, index) => {
          let bgClass = 'bg-[#39FF14] hover:shadow-[0_0_8px_#39FF14]';
          if (day.uptime < 100 && day.uptime >= 90) {
            bgClass = 'bg-[#FCE205] hover:shadow-[0_0_8px_#FCE205]';
          } else if (day.uptime < 90) {
            bgClass = 'bg-[#FF3131] hover:shadow-[0_0_8px_#FF3131]';
          }

          // Calculate height proportion (min 30% for visual balance)
          const barHeight = day.uptime === 0 ? '25%' : `${Math.max(day.uptime, 40)}%`;

          return (
            <div
              key={index}
              className={`flex-1 rounded-sm cursor-pointer transition-all duration-150 ${bgClass}`}
              style={{ height: barHeight }}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            />
          );
        })}
      </div>

      {hoveredDay && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-[#0B0F19] text-white text-xs px-3 py-1.5 rounded-lg shadow-2xl border border-slate-700 whitespace-nowrap z-20 pointer-events-none flex items-center gap-2">
          <span className="text-slate-400 font-mono">{hoveredDay.date}</span>
          <span className="font-bold text-white">:</span>
          <span
            className={`font-bold ${
              hoveredDay.uptime === 100
                ? 'text-[#39FF14]'
                : hoveredDay.uptime >= 90
                ? 'text-[#FCE205]'
                : 'text-[#FF3131]'
            }`}
          >
            {hoveredDay.uptime}% Uptime
          </span>
        </div>
      )}
    </div>
  );
};

export default UptimeBar;
