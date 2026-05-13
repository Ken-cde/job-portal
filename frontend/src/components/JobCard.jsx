import { Briefcase, MapPin, Building2, Clock, Wifi, Home, Building, Eye } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import { WateryCard } from '../components/MotionSystem';
import GlassPanel from '../components/GlassPanel';
import CinematicText from '../components/CinematicText';
import { RippleButton } from '../components/MotionSystem';

const getJobTypeIcon = (jobType) => {
  switch (jobType) {
    case 'REMOTE': return <Wifi size={14} />;
    case 'HYBRID': return <Building size={14} />;
    case 'ONSITE': return <Home size={14} />;
    default: return <Briefcase size={14} />;
  }
};

const JobCard = ({ job, onApply, onViewDetails, userRole, hasApplied }) => {
  return (
    <WateryCard angle={Math.random() * 2 - 1}>
      <GlassPanel
        className="p-6 flex flex-col gap-6 h-full group cursor-pointer"
        glow={false}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CinematicText variant="h3" className="text-white group-hover:text-p3cyan transition-colors">
              {job.title}
            </CinematicText>
            <div className="flex gap-4 text-white/40 text-xs mt-2 flex-wrap">
              <span className="flex items-center gap-1"><Building2 size={12} /> {job.company}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
              <span className="flex items-center gap-1 text-p3cyan/80 font-medium">
                <Briefcase size={12} /> {getCurrencySymbol(job.currency)}{job.salary?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="px-3 py-1 rounded-full text-[10px] cinematic-text bg-p3cyan/10 text-p3cyan border border-p3cyan/20">
              Active
            </div>
            {job.jobType && (
              <div className="px-2 py-0.5 rounded-full text-[10px] cinematic-text bg-white/5 text-white/60 border border-white/10 flex items-center gap-1">
                {getJobTypeIcon(job.jobType)} {job.jobType}
              </div>
            )}
          </div>
        </div>

        <p className="text-white/50 font-light text-sm line-clamp-3 leading-relaxed">
          {job.description}
        </p>

        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-[10px] cinematic-text flex items-center gap-1">
              <Clock size={10} /> Recent
            </span>
            {onViewDetails && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(job); }}
                className="text-xs cinematic-text text-white/60 hover:text-p3cyan transition-colors flex items-center gap-1"
              >
                <Eye size={12} /> Details
              </button>
            )}
          </div>

          {userRole === 'CANDIDATE' && (
            <RippleButton
              onClick={(e) => { e.stopPropagation(); onApply(job.id); }}
              variant="primary"
              className="py-1.5 px-4 text-xs"
            >
              {hasApplied ? 'Applied' : 'Apply'}
            </RippleButton>
          )}
        </div>
      </GlassPanel>
    </WateryCard>
  );
};

export default JobCard;
