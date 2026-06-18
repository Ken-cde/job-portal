import React from 'react';
import GlassPanel from './GlassPanel';
import CinematicText from './CinematicText';
import { BookOpen, Target, X, ChevronRight } from 'lucide-react';

const AiInterviewGuideResult = ({ guide, onClose }) => {
  if (!guide) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={onClose}>
      <GlassPanel
        shape="trapezoid"
        className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
        glow={true}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-p3cyan" />
            <CinematicText variant="aggressive">AI Interview Architect</CinematicText>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl">×</button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          <div className="space-y-1">
            <p className="text-white/40 cinematic-text text-xs uppercase tracking-widest">Target Candidate</p>
            <h3 className="text-2xl font-black text-white italic tracking-tighter">{guide.candidateName} <span className="text-p3cyan">/ {guide.jobTitle}</span></h3>
          </div>

          <div className="p-6 rounded-2xl bg-p3cyan/10 border border-p3cyan/20 space-y-3">
            <div className="flex items-center gap-2 text-p3cyan cinematic-text text-xs uppercase tracking-widest">
              <Target size={14} /> Strategic Evaluation Focus
            </div}
            <p className="text-white/80 text-sm leading-relaxed italic">
              {guide.evaluationFocus}
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-white/40 cinematic-text text-xs uppercase tracking-widest mb-4">Tailored Probing Questions</div>
            <div className="space-y-3">
              {(guide.targetedQuestions || []).map((q, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-all flex items-start gap-4">
                  <div className="text-p3cyan font-black text-sm mt-0.5">{i + 1}.</div>
                  <div className="text-white/70 text-sm leading-relaxed group-hover:text-white transition-colors">
                    {q}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default AiInterviewGuideResult;
