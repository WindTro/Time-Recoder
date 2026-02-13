
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TimeEntry } from '../types';
import { Trash2, Save, X, Clock, AlignLeft } from 'lucide-react';

interface DayTimelineProps {
  entries: TimeEntry[];
  targetDate?: Date;
  onSave?: (entry: TimeEntry) => void;
  onDelete?: (id: string) => void;
}

const PIXELS_PER_MINUTE = 1.5;
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;
const TOTAL_HEIGHT = 24 * HOUR_HEIGHT;

const DayTimeline: React.FC<DayTimelineProps> = ({ entries, targetDate, onSave, onDelete }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartTime, setFormStartTime] = useState(''); // HH:mm
  const [formEndTime, setFormEndTime] = useState('');   // HH:mm

  const displayDate = useMemo(() => targetDate || new Date(), [targetDate]);
  
  const isToday = useMemo(() => {
    const today = new Date();
    return displayDate.getDate() === today.getDate() &&
           displayDate.getMonth() === today.getMonth() &&
           displayDate.getFullYear() === today.getFullYear();
  }, [displayDate]);

  const dayEntries = useMemo(() => {
    const startOfDay = new Date(displayDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(displayDate);
    endOfDay.setHours(23, 59, 59, 999);

    return entries.filter(e => 
      e.startTime >= startOfDay.getTime() && 
      e.startTime <= endOfDay.getTime()
    );
  }, [entries, displayDate]);

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setNow(new Date()), 60000);
    
    if (scrollRef.current && !isDragging && !showModal) {
      const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      // Only scroll initially or if user isn't interacting
      if (!dragStartY) {
          const scrollPos = (currentMinutes * PIXELS_PER_MINUTE) - (scrollRef.current.clientHeight / 2);
          scrollRef.current.scrollTop = scrollPos;
      }
    }
    return () => clearInterval(interval);
  }, [isToday]);

  const getPositionStyle = (startTime: number, duration: number) => {
    const date = new Date(startTime);
    const startMinutes = date.getHours() * 60 + date.getMinutes();
    const top = startMinutes * PIXELS_PER_MINUTE;
    const height = Math.max(duration / 60 * PIXELS_PER_MINUTE, 20); 
    return { top: `${top}px`, height: `${height}px` };
  };

  // --- Interaction Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onSave || !containerRef.current) return;
    // Calculate Y relative to the container content, accounting for scroll automatically via getBoundingClientRect
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top; // Corrected: Removed + scrollTop
    
    setIsDragging(true);
    setDragStartY(y);
    setDragCurrentY(y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || dragStartY === null) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top; // Corrected: Removed + scrollTop
    setDragCurrentY(y);
  };

  const handleMouseUp = () => {
    if (!isDragging || dragStartY === null || dragCurrentY === null) return;
    
    const startY = Math.min(dragStartY, dragCurrentY);
    const endY = Math.max(dragStartY, dragCurrentY);
    const height = endY - startY;

    // Minimum drag threshold to trigger create (e.g., 10px)
    if (height > 10) {
      openCreateModal(startY, endY);
    }

    setIsDragging(false);
    setDragStartY(null);
    setDragCurrentY(null);
  };

  const openCreateModal = (startY: number, endY: number) => {
    const startMinutes = Math.floor(startY / PIXELS_PER_MINUTE);
    const endMinutes = Math.floor(endY / PIXELS_PER_MINUTE);
    
    // Convert to time strings
    const sH = Math.floor(startMinutes / 60);
    const sM = startMinutes % 60;
    const eH = Math.floor(endMinutes / 60);
    const eM = endMinutes % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    setEditingEntry(null);
    setFormTitle('');
    setFormDesc('');
    setFormStartTime(`${pad(sH)}:${pad(sM)}`);
    setFormEndTime(`${pad(eH)}:${pad(eM)}`);
    setShowModal(true);
  };

  const handleEntryClick = (e: React.MouseEvent, entry: TimeEntry) => {
    e.stopPropagation(); // Prevent drag start
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormDesc(entry.description || '');
    setFormStartTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
    setFormEndTime(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
    setShowModal(true);
  };

  const saveModal = () => {
    if (!onSave) return;
    
    const [sH, sM] = formStartTime.split(':').map(Number);
    const [eH, eM] = formEndTime.split(':').map(Number);
    
    const start = new Date(displayDate);
    start.setHours(sH, sM, 0, 0);
    
    const end = new Date(displayDate);
    end.setHours(eH, eM, 0, 0);
    
    // Strict validation: End time must be later than start time
    if (end <= start) {
        // Auto-correct to start + 15 minutes if invalid
        end.setTime(start.getTime() + 15 * 60000);
        
        // Update form visually to reflect the auto-correction
        const pad = (n: number) => n.toString().padStart(2, '0');
        setFormEndTime(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
    }

    const duration = (end.getTime() - start.getTime()) / 1000;

    const entry: TimeEntry = {
        id: editingEntry ? editingEntry.id : crypto.randomUUID(),
        title: formTitle || 'New Entry',
        description: formDesc,
        startTime: start.getTime(),
        endTime: end.getTime(),
        duration: duration
    };

    onSave(entry);
    setShowModal(false);
  };

  const deleteFromModal = () => {
      if (editingEntry && onDelete) {
          onDelete(editingEntry.id);
          setShowModal(false);
      }
  };

  // Ghost Element for Dragging
  const renderGhost = () => {
      if (!isDragging || dragStartY === null || dragCurrentY === null) return null;
      const top = Math.min(dragStartY, dragCurrentY);
      const height = Math.abs(dragCurrentY - dragStartY);
      return (
          <div 
            className="absolute left-14 right-4 bg-[#d95638]/30 border-2 border-[#d95638] rounded-sm z-40 pointer-events-none flex items-center justify-center"
            style={{ top: `${top}px`, height: `${height}px` }}
          >
              <span className="text-[#d95638] font-bold text-xs bg-white/80 px-2 py-1 rounded">Release to Create</span>
          </div>
      );
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeTop = currentMinutes * PIXELS_PER_MINUTE;

  return (
    <>
        <div className="h-full flex flex-col bg-white rounded-lg border-2 border-[#1a1a1a] overflow-hidden relative shadow-hard-sm select-none">
        <div className="absolute top-0 left-0 right-0 h-12 bg-[#f4f1ea] z-20 border-b-2 border-[#1a1a1a] flex items-center justify-center">
            <span className="text-sm font-black text-[#1a1a1a] uppercase tracking-[0.2em] font-serif">
            {isToday ? "TODAY'S SCHEDULE" : displayDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
        </div>
        
        <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto relative custom-scrollbar pt-12 bg-[#fff] cursor-crosshair"
        >
            <div 
                ref={containerRef}
                className="relative w-full" 
                style={{ height: `${TOTAL_HEIGHT}px` }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
            
            {/* Grid Lines - Notebook Style */}
            {Array.from({ length: 25 }).map((_, i) => (
                <div 
                key={i} 
                className="absolute w-full border-t border-dashed border-gray-300 flex items-center pointer-events-none"
                style={{ top: `${i * HOUR_HEIGHT}px` }}
                >
                <span className="text-[10px] text-[#1a1a1a] font-mono font-bold w-12 text-right pr-3 -mt-2.5 bg-white z-10">
                    {i.toString().padStart(2, '0')}:00
                </span>
                </div>
            ))}

            {/* Current Time Line */}
            {isToday && (
                <div 
                className="absolute left-12 right-0 border-t-2 border-[#d95638] z-10 flex items-center pointer-events-none"
                style={{ top: `${currentTimeTop}px` }}
                >
                <div className="absolute -left-1.5 w-3 h-3 bg-[#d95638] rounded-full border border-white" />
                <span className="text-[10px] text-white font-bold ml-2 -mt-6 bg-[#d95638] px-1.5 py-0.5 rounded shadow-sm">
                    {now.toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})}
                </span>
                </div>
            )}

            {/* Time Entries */}
            {dayEntries.map(entry => {
                const style = getPositionStyle(entry.startTime, entry.duration);
                return (
                <div
                    key={entry.id}
                    style={style}
                    onClick={(e) => handleEntryClick(e, entry)}
                    className="absolute left-14 right-4 bg-[#1a1a1a] border-2 border-[#1a1a1a] rounded-sm group transition-all cursor-pointer z-10 hover:z-30 hover:bg-[#d95638] hover:border-[#d95638] shadow-sm"
                >
                    {/* Content */}
                    <div className="w-full h-full overflow-hidden px-3 py-1 flex flex-col justify-center">
                    <div className="font-bold text-[#fdfbf7] text-xs truncate font-mono leading-tight group-hover:text-white">{entry.title}</div>
                    {entry.description && (
                         <div className="text-[#fdfbf7]/60 text-[10px] truncate font-sans group-hover:text-white/80">{entry.description}</div>
                    )}
                    <div className="text-gray-400 text-[10px] font-mono leading-tight group-hover:text-white/80 mt-0.5">
                        {Math.floor(entry.duration / 60)}m
                    </div>
                    </div>
                </div>
                );
            })}

            {renderGhost()}

            {dayEntries.length === 0 && !isDragging && (
                <div className="absolute top-1/2 left-0 right-0 text-center text-gray-400 text-sm font-serif italic pointer-events-none">
                Drag to create task
                </div>
            )}

            </div>
        </div>
        </div>

        {/* Edit/Create Modal */}
        {showModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/20 backdrop-blur-[1px] p-4">
                <div className="bg-[#fdfbf7] w-full max-w-sm rounded-xl border-2 border-[#1a1a1a] shadow-hard flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b-2 border-[#1a1a1a] bg-[#f4f1ea] flex justify-between items-center">
                        <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider font-serif">
                            {editingEntry ? 'Edit Entry' : 'New Entry'}
                        </h3>
                        <button onClick={() => setShowModal(false)} className="text-[#1a1a1a] hover:bg-[#e5e2db] rounded p-1">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="p-4 flex flex-col gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 mb-1">Title</label>
                            <input 
                                className="w-full bg-white border-2 border-[#1a1a1a] rounded p-2 text-sm font-serif focus:border-[#d95638] outline-none"
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                autoFocus
                                placeholder="Task Name"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 mb-1 flex items-center gap-1"><Clock size={10} /> Start</label>
                                <input 
                                    type="time"
                                    className="w-full bg-white border-2 border-[#1a1a1a] rounded p-2 text-sm font-mono focus:border-[#d95638] outline-none"
                                    value={formStartTime}
                                    onChange={e => setFormStartTime(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 mb-1 flex items-center gap-1"><Clock size={10} /> End</label>
                                <input 
                                    type="time"
                                    className="w-full bg-white border-2 border-[#1a1a1a] rounded p-2 text-sm font-mono focus:border-[#d95638] outline-none"
                                    value={formEndTime}
                                    onChange={e => setFormEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 mb-1 flex items-center gap-1"><AlignLeft size={10} /> Description</label>
                            <textarea 
                                className="w-full bg-white border-2 border-[#1a1a1a] rounded p-2 text-sm font-sans focus:border-[#d95638] outline-none resize-none h-20"
                                value={formDesc}
                                onChange={e => setFormDesc(e.target.value)}
                                placeholder="Details..."
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                             {editingEntry && (
                                 <button 
                                    onClick={deleteFromModal}
                                    className="p-2 border-2 border-[#1a1a1a] rounded bg-white hover:bg-red-50 text-red-600 transition-colors"
                                    title="Delete"
                                 >
                                     <Trash2 size={18} />
                                 </button>
                             )}
                             <button 
                                onClick={saveModal}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] rounded font-bold text-sm hover:bg-[#333] transition-colors shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none py-2"
                             >
                                 <Save size={16} /> SAVE
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default DayTimeline;
