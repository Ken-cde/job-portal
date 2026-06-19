import React, { useEffect } from 'react';
import GlassPanel from './GlassPanel';
import CinematicText from './CinematicText';
import { CheckCircle, AlertCircle, Lightbulb, X } from 'lucide-react';

const ResumeAnalysisResult = ({ analysis, onClose }) => {
  useEffect(() => {
    if (analysis) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [analysis]);

  if (!analysis) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={onClose}>
      <GlassPanel
        shape="rect"
        className="w-full max-w-2xl h-full max-h-[90vh] flex flex-col relative"
        glow={true}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <CinematicText variant="aggressive">AI Fit Analysis</CinematicText>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl">×</button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 min-h-0 space-y-8 custom-scrollbar" style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
          {/* Match Score */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="64" cy="64" r="60"
                  stroke="#00f2ff" strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * ((analysis.score || 0) / 100))}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-white italic tracking-tighter">{Math.round(analysis.score || 0)}%</span>
              </div>
            </div>
            <p className="mt-4 cinematic-text text-xs text-white/60 uppercase tracking-widest">Profile Compatibility Score</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 cinematic-text text-xs uppercase tracking-widest">
                <CheckCircle size={14} /> Strengths
              </div>
              <div className="space-y-2">
                {(analysis.strengths || []).map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-white/80 text-sm">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-400 cinematic-text text-xs uppercase tracking-widest">
                <AlertCircle size={14} /> Critical Gaps
              </div>
              <div className="space-y-2">
                {(analysis.gaps || []).map((g, i) => (
                  <div key={i} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-white/80 text-sm">
                    {g}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-p3cyan cinematic-text text-xs uppercase tracking-widest">
              <Lightbulb size={14} /> Strategic Improvements
            </div>
            <div className="space-y-3">
              {(analysis.suggestions || []).map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm leading-relaxed group hover:bg-white/10 transition-all">
                  <span className="text-p3cyan font-bold mr-2">{i + 1}.</span> {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default ResumeAnalysisResult;
