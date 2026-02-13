import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { analyzeTimeUsage } from '../services/geminiService';
import { TimeEntry } from '../types';
import ReactMarkdown from 'react-markdown';

interface AnalysisPanelProps {
  entries: TimeEntry[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ entries }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeTimeUsage(entries);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-[#1a1a1a] p-6 shadow-hard-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-[#1a1a1a]/20">
        <h2 className="text-sm font-black text-[#1a1a1a] flex items-center gap-2 uppercase tracking-wide font-serif">
          <Sparkles className="text-[#d95638]" size={16} fill="currentColor" />
          AI Insights
        </h2>
        <button
          onClick={handleAnalyze}
          disabled={loading || entries.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#f4f1ea] hover:bg-[#e5e2db] rounded border border-[#1a1a1a] text-xs font-bold text-[#1a1a1a] transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={14} /> : 'ANALYZE'}
        </button>
      </div>

      <div className="min-h-[100px] text-sm text-[#1a1a1a] leading-relaxed bg-[#fdfbf7] p-4 font-serif">
        {!analysis && !loading && (
          <div className="text-gray-500 italic text-center py-4 text-xs font-sans">
            Ready to analyze your productivity patterns.
          </div>
        )}
        {loading && (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className="w-2 h-2 bg-[#d95638] rounded-full animate-bounce"></div>
            <div className="text-xs text-gray-500 font-bold uppercase">Thinking...</div>
          </div>
        )}
        {analysis && (
           <div className="prose prose-stone prose-sm max-w-none text-[#1a1a1a]">
             <ReactMarkdown>{analysis}</ReactMarkdown>
           </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;