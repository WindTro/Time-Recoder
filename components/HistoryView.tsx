import React, { useState, useMemo } from 'react';
import { TimeEntry } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import DayTimeline from './DayTimeline';

interface HistoryViewProps {
  entries: TimeEntry[];
  onDelete: (id: string) => void;
}

type ViewType = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

const HistoryView: React.FC<HistoryViewProps> = ({ entries, onDelete }) => {
  const [viewType, setViewType] = useState<ViewType>('WEEK');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); 
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(date.setDate(diff));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = direction === 'next' ? 1 : -1;

    switch (viewType) {
      case 'DAY': newDate.setDate(newDate.getDate() + val); break;
      case 'WEEK': newDate.setDate(newDate.getDate() + (val * 7)); break;
      case 'MONTH': newDate.setMonth(newDate.getMonth() + val); break;
      case 'YEAR': newDate.setFullYear(newDate.getFullYear() + val); break;
    }
    setCurrentDate(newDate);
  };

  const data = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewType === 'YEAR') {
      const months = Array.from({ length: 12 }, (_, i) => ({
        name: `${i + 1}月`,
        monthIndex: i,
        seconds: 0
      }));
      entries.forEach(e => {
        const d = new Date(e.startTime);
        if (d.getFullYear() === year) months[d.getMonth()].seconds += e.duration;
      });
      return months.map(m => ({ ...m, value: parseFloat((m.seconds / 3600).toFixed(1)) }));
    }

    if (viewType === 'MONTH') {
      const daysInMonth = getDaysInMonth(year, month);
      const weeks: { name: string; weekIndex: number; seconds: number; startDate: Date }[] = [];
      let currentDay = 1;
      let weekCount = 1;
      while (currentDay <= daysInMonth) {
         weeks.push({ name: `W${weekCount}`, weekIndex: weekCount, seconds: 0, startDate: new Date(year, month, currentDay) });
         currentDay += 7;
         weekCount++;
      }
      entries.forEach(e => {
        const d = new Date(e.startTime);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const bucketIndex = Math.floor((d.getDate() - 1) / 7);
          if (weeks[bucketIndex]) weeks[bucketIndex].seconds += e.duration;
        }
      });
      return weeks.map(w => ({ ...w, value: parseFloat((w.seconds / 3600).toFixed(1)) }));
    }

    if (viewType === 'WEEK') {
      const start = getStartOfWeek(currentDate);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return {
          name: d.toLocaleDateString('zh-CN', { weekday: 'short' }).replace('周', ''),
          fullDate: d,
          seconds: 0
        };
      });
      entries.forEach(e => {
        const d = new Date(e.startTime);
        const match = days.find(dayItem => 
           dayItem.fullDate.getDate() === d.getDate() && 
           dayItem.fullDate.getMonth() === d.getMonth() &&
           dayItem.fullDate.getFullYear() === d.getFullYear()
        );
        if (match) match.seconds += e.duration;
      });
      return days.map(d => ({ ...d, value: parseFloat((d.seconds / 3600).toFixed(1)) }));
    }
    return [];
  }, [viewType, currentDate, entries]);

  const handleBarClick = (data: any) => {
    if (!data) return;
    if (viewType === 'YEAR') {
      setCurrentDate(new Date(currentDate.getFullYear(), data.monthIndex, 1));
      setViewType('MONTH');
    } else if (viewType === 'MONTH') {
      setCurrentDate(data.startDate);
      setViewType('WEEK');
    } else if (viewType === 'WEEK') {
      setCurrentDate(data.fullDate);
      setViewType('DAY');
    }
  };

  const renderHeader = () => {
    let title = '';
    if (viewType === 'DAY') title = currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    else if (viewType === 'WEEK') {
        const start = getStartOfWeek(currentDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        title = `${start.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
    }
    else if (viewType === 'MONTH') title = currentDate.toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' });
    else if (viewType === 'YEAR') title = `${currentDate.getFullYear()}年`;

    return (
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex bg-[#e5e2db] p-1 rounded-lg border border-[#1a1a1a]">
          {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as ViewType[]).map((type) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-5 py-1.5 rounded-md text-xs font-bold transition-all border border-transparent ${
                viewType === type 
                ? 'bg-[#1a1a1a] text-white shadow-sm' 
                : 'text-[#1a1a1a] hover:bg-white hover:border-[#1a1a1a]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border-2 border-[#1a1a1a] shadow-hard-sm">
          <button onClick={() => navigate('prev')} className="text-[#1a1a1a] hover:bg-[#e5e2db] rounded p-1 transition-colors">
            <ChevronLeft size={18} strokeWidth={3} />
          </button>
          <span className="text-sm font-bold text-[#1a1a1a] min-w-[160px] text-center font-mono">{title}</span>
          <button onClick={() => navigate('next')} className="text-[#1a1a1a] hover:bg-[#e5e2db] rounded p-1 transition-colors">
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      <div className="flex-1 min-h-[400px] bg-white rounded-xl border-2 border-[#1a1a1a] p-6 relative overflow-hidden shadow-hard-sm">
        {viewType === 'DAY' ? (
          <DayTimeline entries={entries} targetDate={currentDate} />
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-[#1a1a1a] text-xs font-black uppercase tracking-wider pl-2 border-l-4 border-[#d95638]">
                <BarChart3 size={14} /> 
                STATS OVERVIEW
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={data} onClick={(data) => data && handleBarClick(data.activePayload?.[0]?.payload)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#1a1a1a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={{ stroke: '#1a1a1a', strokeWidth: 2 }}
                  dy={10}
                  fontFamily="JetBrains Mono"
                  fontWeight={700}
                />
                <Tooltip 
                  cursor={{fill: '#f4f1ea'}}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', color: '#f8fafc', borderRadius: '4px' }}
                  itemStyle={{ color: '#d95638', fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value} hrs`, 'Duration']}
                  labelStyle={{ color: '#9ca3af', marginBottom: '0.25rem', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 0, 0, 0]} maxBarSize={50}>
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="#1a1a1a" 
                      className="cursor-pointer hover:fill-[#d95638] transition-colors"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;