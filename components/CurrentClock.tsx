
import React, { useState, useEffect } from 'react';

const CurrentClock: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
  
  const dateString = time.toLocaleDateString('zh-CN', { 
    month: 'short', 
    day: 'numeric',
    weekday: 'short'
  });

  if (compact) {
    return (
      <div className="flex flex-col items-center text-[#1a1a1a] gap-1">
        <div className="text-3xl font-serif font-black tracking-tight">{timeString}</div>
        <div className="text-xs font-bold text-gray-500">{dateString}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start border-l-4 border-[#d95638] pl-4">
      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-[#1a1a1a]/60 mb-1 font-sans">
        Current Time
      </div>
      <div className="text-5xl md:text-6xl font-serif font-black text-[#1a1a1a] tracking-tight leading-none">
        {timeString}
      </div>
      <div className="text-[#1a1a1a] font-bold mt-2 text-sm tracking-widest uppercase font-mono">
        {dateString}
      </div>
    </div>
  );
};

export default CurrentClock;
