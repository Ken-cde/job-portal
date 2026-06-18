import React from 'react';
import GlassPanel from './GlassPanel';
import CinematicText from './CinematicText';
import { Users, Award, Zap, X } from 'lucide-react';

const AiScreeningResult = ({ results, onClose }) => {
  if (!results) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={onClose}>
      <GlassPanel
        shape="trapezoid"
        className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative"
        glow={true}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-p3cyan" />
            <CinematicText variant="aggressive">Neural Applicant Screening</CinematicText>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl">×</button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          <div className="text-center mb-8">
            <p className="text-white/40 cinematic-text text-xs uppercase tracking-widest">
              AI-Ranked Candidates based on Requirement Matching
            </p>
          </div>

          <div className="space-y-4">
            {(results || []).map((res, i) => (
              <div key={res.applicationId} className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-all flex items-center gap-6">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-p3cyan/10 border border-p3cyan/30 flex items-center justify-center text-p3cyan font-black text-xl italic">
                  {Math.round(res.score || 0)}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold truncate">{res.candidateName}</span>
                    {i === 0 && <Award size={14} className="text-yellow-400" />}
                  </div>
                  <p className="text-white/60 text-sm italic leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                    {res.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default AiScreeningResult;
