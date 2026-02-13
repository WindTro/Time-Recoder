
import React, { useState, useEffect, useRef } from 'react';
import { Columns, Maximize2, Calendar as CalendarIcon, X, Minus } from 'lucide-react';
import Timer from './components/Timer';
import HistoryView from './components/HistoryView';
import AnalysisPanel from './components/AnalysisPanel';
import DayTimeline from './components/DayTimeline';
import CurrentClock from './components/CurrentClock';
import { ViewMode, TimeEntry } from './types';
import { saveEntry, getEntries, deleteEntry } from './services/storage';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WINDOW);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  // Timer ref for smooth sidebar collapsing
  const sidebarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  const handleSaveEntry = (entry: TimeEntry) => {
    const updated = saveEntry(entry);
    setEntries(updated);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = deleteEntry(id);
    setEntries(updated);
  };

  const toggleSidebarMode = () => {
    if (viewMode === ViewMode.WINDOW) {
      setViewMode(ViewMode.SIDEBAR);
      setIsSidebarExpanded(false); // Start collapsed
      if (window.electron) window.electron.setMode('sidebar');
    } else {
      setViewMode(ViewMode.WINDOW);
      setIsSidebarExpanded(false);
      if (window.electron) window.electron.setMode('window');
    }
  };

  const handleMinimize = () => {
    window.electron?.minimizeApp();
  };

  const handleClose = () => {
    window.electron?.closeApp();
  };

  // Handlers for Desktop hover expansion with debounce
  const handleSidebarMouseEnter = () => {
    // Cancel any pending collapse
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
      sidebarTimeoutRef.current = null;
    }

    if (isSidebar) {
      setIsSidebarExpanded(true);
      if (window.electron) window.electron.expandSidebar();
    }
  };

  const handleSidebarMouseLeave = () => {
    if (isSidebar) {
      // Add delay to prevent jittery collapsing when mouse briefly leaves
      sidebarTimeoutRef.current = setTimeout(() => {
        setIsSidebarExpanded(false);
        if (window.electron) window.electron.collapseSidebar();
      }, 300);
    }
  };

  const isSidebar = viewMode === ViewMode.SIDEBAR;

  return (
    <div className={`min-h-screen transition-all duration-500 ease-in-out font-sans flex flex-col ${isSidebar ? 'p-0 bg-transparent' : 'p-4 md:p-8'}`}>
      
      {/* Custom Window Controls (Visible in Window Mode) */}
      {!isSidebar && (
        <div className="absolute top-0 left-0 right-0 h-10 app-drag z-50 flex items-start justify-end p-4 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
             <button 
               onClick={handleMinimize}
               className="p-1.5 bg-white border-2 border-[#1a1a1a] rounded hover:bg-[#e5e2db] text-[#1a1a1a] transition-colors shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
             >
               <Minus size={14} strokeWidth={3} />
             </button>
             <button 
               onClick={handleClose}
               className="p-1.5 bg-[#1a1a1a] border-2 border-[#1a1a1a] rounded hover:bg-[#333] text-white transition-colors shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
             >
               <X size={14} strokeWidth={3} />
             </button>
          </div>
        </div>
      )}

      <div 
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className={`
          relative mx-auto bg-[#fdfbf7] border-2 border-[#1a1a1a] transition-all duration-500 ease-in-out
          ${isSidebar 
            ? `fixed top-0 bottom-0 w-full overflow-hidden group border-y-0 shadow-none z-40 right-0 border-r-0` 
            : 'w-full max-w-7xl min-h-[850px] rounded-xl shadow-hard grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden h-[90vh] mt-4'} 
        `}
      >
        {/* === Sidebar / Compact Mode View === */}
        {isSidebar && (
          // flex-row-reverse allows the Spine (1st in DOM, Last in Visual) to act as the right anchor.
          // Layout: [Content] [Spine] (Right Edge)
          <div className="h-full w-full flex flex-row-reverse relative overflow-hidden bg-[#fdfbf7]">
             
             {/* 1. SPINE (Visual Right Edge) - Always Visible */}
             <div className="w-[24px] h-full bg-[#1a1a1a] flex flex-col items-center justify-center gap-4 shrink-0 z-50 relative cursor-pointer hover:bg-[#333] transition-colors">
                 <div className="w-[1px] h-12 bg-white/20"></div>
                 <span className="text-[10px] text-white/40 font-mono tracking-widest rotate-90 whitespace-nowrap origin-center select-none">CHRONOMARK</span>
                 <div className="w-[1px] h-12 bg-white/20"></div>
             </div>

             {/* 2. MAIN CONTENT (Visual Left of Spine) - Fades in/out */}
             <div className={`
                w-[316px] shrink-0 flex flex-col h-full overflow-hidden border-r-2 border-[#1a1a1a] bg-[#fdfbf7]
                transition-opacity duration-300 delay-75
                ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
             `}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#1a1a1a] bg-[#f4f1ea] app-drag shrink-0">
                    <span className="font-serif font-black text-[#1a1a1a] text-2xl tracking-tight truncate">
                      TASKS
                    </span>
                    <button 
                      onClick={toggleSidebarMode} // Toggle back to window
                      className="p-1 hover:bg-[#1a1a1a] hover:text-white rounded-md text-[#1a1a1a] transition-colors app-no-drag"
                      title="Expand to Window"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                  
                  {/* Main Sidebar Content */}
                  <div className="flex-1 flex flex-col items-center pt-10 px-6 gap-6 w-full overflow-hidden">
                    <div className="shrink-0 w-full flex justify-center">
                      <CurrentClock compact={true} />
                    </div>
                    
                    <div className="shrink-0 w-full flex justify-center mb-4">
                      <Timer onSave={handleSaveEntry} compact={true} />
                    </div>
                    
                    {/* Spacer to push list to bottom or just fill space */}
                    <div className="flex-1 w-full"></div>
                    
                    {/* List Section */}
                    <div className="w-full shrink-0">
                        <div className="w-full bg-[#e5e2db] border-y-2 border-[#1a1a1a] py-3 px-4 flex items-center">
                            <span className="text-xs font-bold text-[#1a1a1a]">今日记录</span>
                        </div>
                        <div className="w-full max-h-[200px] overflow-y-auto custom-scrollbar">
                           {entries.slice(0, 5).map(e => (
                             <div key={e.id} className="text-xs text-[#1a1a1a] px-4 py-3 truncate border-b border-dashed border-[#1a1a1a]/30 hover:bg-[#f4f1ea] transition-colors flex items-center">
                               <span className="text-[#d95638] mr-2 font-mono font-bold shrink-0">
                                   {new Date(e.startTime).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})}
                               </span>
                               <span className="truncate">{e.title}</span>
                             </div>
                           ))}
                           {entries.length === 0 && (
                             <div className="p-4 text-center text-[10px] text-gray-400 italic">
                               No tasks yet.
                             </div>
                           )}
                        </div>
                    </div>
                  </div>
             </div>
          </div>
        )}

        {/* === Window / Dashboard Mode View === */}
        {!isSidebar && (
          <>
            {/* Left Panel: Controls & Analysis */}
            <div className="lg:col-span-5 bg-[#fdfbf7] p-8 flex flex-col border-b-2 lg:border-b-0 lg:border-r-2 border-[#1a1a1a] relative overflow-y-auto custom-scrollbar">
              {/* Drag Handle for Panel */}
              <div className="absolute top-0 left-0 right-0 h-8 app-drag z-10" />

              <header className="flex items-center justify-between mb-10 relative z-20 pt-4">
                <CurrentClock />
                <div className="flex gap-3 app-no-drag">
                   <button 
                    onClick={toggleSidebarMode}
                    className="p-2.5 text-[#1a1a1a] bg-white border-2 border-[#1a1a1a] rounded-lg shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-[#e5e2db]"
                    title="切换至侧边栏模式"
                   >
                     <Columns size={20} strokeWidth={2.5} />
                   </button>
                   <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-2.5 text-[#1a1a1a] bg-white border-2 border-[#1a1a1a] rounded-lg shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-[#e5e2db]"
                    title="查看历史日历"
                   >
                     <CalendarIcon size={20} strokeWidth={2.5} />
                   </button>
                </div>
              </header>

              <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                <Timer onSave={handleSaveEntry} />
              </div>

              <div className="mt-8">
                 <AnalysisPanel entries={entries} />
              </div>
            </div>

            {/* Right Panel: Vertical Timeline */}
            <div className="lg:col-span-7 bg-[#f4f1ea] p-4 h-full overflow-hidden relative">
               {/* Drag Handle for Panel */}
              <div className="absolute top-0 left-0 right-0 h-8 app-drag z-10" />
              
              {/* Notebook binding effect (visual) */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] opacity-10 z-0"></div>
              <div className="relative z-20 h-full pt-4">
                 <DayTimeline 
                    entries={entries} 
                    onSave={handleSaveEntry}
                    onDelete={handleDeleteEntry}
                  />
              </div>
            </div>
          </>
        )}
      </div>

      {/* History Modal Overlay */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#fdfbf7] w-full max-w-5xl max-h-[85vh] rounded-xl border-2 border-[#1a1a1a] shadow-hard flex flex-col overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b-2 border-[#1a1a1a] bg-[#f4f1ea] app-drag">
              <h2 className="text-xl font-serif font-black text-[#1a1a1a] flex items-center gap-3">
                <CalendarIcon className="text-[#d95638]" size={24} strokeWidth={2.5} />
                HISTORY & STATS
              </h2>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-[#1a1a1a] hover:text-white rounded-lg text-[#1a1a1a] transition-colors border-2 border-transparent hover:border-[#1a1a1a] app-no-drag"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar bg-[#fdfbf7]">
              <HistoryView entries={entries} onDelete={handleDeleteEntry} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
