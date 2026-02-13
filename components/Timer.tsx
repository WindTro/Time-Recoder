
import React, { useState, useEffect, useCallback } from 'react';
import { PenTool, Save, X } from 'lucide-react';
import { TimeEntry } from '../types';

interface TimerProps {
  onSave: (entry: TimeEntry) => void;
  compact?: boolean;
}

const Timer: React.FC<TimerProps> = ({ onSave, compact }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDesc, setEntryDesc] = useState('');

  // Tick logic
  useEffect(() => {
    let interval: number;
    if (isRunning && startTime) {
      interval = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const handleMarkClick = useCallback(() => {
    if (!isRunning) {
      // Start
      setStartTime(Date.now());
      setIsRunning(true);
      setElapsed(0);
    } else {
      // Stop
      setIsRunning(false);
      setShowSaveDialog(true);
    }
  }, [isRunning]);

  const handleSave = () => {
    if (!startTime) return;
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      title: entryTitle.trim() || '未命名任务',
      description: entryDesc.trim(),
      startTime,
      endTime,
      duration,
    };

    onSave(newEntry);
    resetTimer();
  };

  const handleDiscard = () => {
    resetTimer();
  };

  const resetTimer = () => {
    setStartTime(null);
    setElapsed(0);
    setIsRunning(false);
    setShowSaveDialog(false);
    setEntryTitle('');
    setEntryDesc('');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (showSaveDialog) {
    return (
      <div className={`flex flex-col items-center bg-[#fdfbf7] p-5 rounded-xl shadow-hard border-2 border-[#1a1a1a] w-full animate-fade-in ${compact ? 'max-w-[280px]' : 'max-w-md'}`}>
        <h3 className="text-[#1a1a1a] text-xs font-bold mb-3 uppercase tracking-widest font-serif">记录时间条</h3>
        <input
          type="text"
          value={entryTitle}
          onChange={(e) => setEntryTitle(e.target.value)}
          placeholder="What did you do?"
          className="w-full bg-white border-2 border-[#1a1a1a] rounded-lg px-3 py-2 text-[#1a1a1a] mb-2 focus:ring-0 focus:border-[#d95638] outline-none text-sm transition-all placeholder:text-gray-400 font-serif"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <textarea
          value={entryDesc}
          onChange={(e) => setEntryDesc(e.target.value)}
          placeholder="Details (optional)..."
          className="w-full bg-white border-2 border-[#1a1a1a] rounded-lg px-3 py-2 text-[#1a1a1a] mb-4 focus:ring-0 focus:border-[#d95638] outline-none text-xs transition-all placeholder:text-gray-400 font-sans resize-none h-16"
        />
        <div className="flex gap-3 w-full">
          <button 
            onClick={handleDiscard}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white hover:bg-gray-100 text-[#1a1a1a] text-xs font-bold transition-colors border-2 border-[#1a1a1a]"
          >
            <X size={14} /> 放弃
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#333] text-white font-bold text-xs transition-colors border-2 border-[#1a1a1a] shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Save size={14} /> 保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Time Display */}
      <div className={`font-mono font-bold text-[#1a1a1a] tabular-nums tracking-wider mb-8 ${compact ? 'text-4xl' : 'text-7xl'}`}>
        {formatTime(elapsed)}
      </div>

      {/* MARK Button (Rounded Square) */}
      <button
        onClick={handleMarkClick}
        className={`
          relative group flex flex-col items-center justify-center rounded-2xl transition-all duration-200
          border-2 border-transparent shadow-none active:scale-95
          ${isRunning 
            ? 'bg-[#d95638] text-[#fdfbf7]' 
            : 'bg-[#1a1a1a] text-[#fdfbf7] hover:bg-[#333]'}
          ${compact ? 'w-32 h-20' : 'w-48 h-20 shadow-hard border-[#1a1a1a]'}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <PenTool 
               size={compact ? 20 : 24} 
               className={`fill-current ${isRunning ? 'animate-writing origin-bottom-left' : ''}`} 
               strokeWidth={2.5}
            />
          </div>
          <span className={`font-bold font-serif tracking-wide ${compact ? 'text-lg' : 'text-xl'}`}>
            {isRunning ? 'Stop' : 'Mark!'}
          </span>
        </div>
      </button>

      <div className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/60 font-bold">
        {isRunning ? 'FOCUS MODE ON' : 'READY TO TRACK'}
      </div>
    </div>
  );
};

export default Timer;
