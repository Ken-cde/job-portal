import { Briefcase, MapPin, Building2, Clock, Wifi, Home, Building, Eye } from 'lucide-react';

const getJobTypeIcon = (jobType) => {
  switch (jobType) {
    case 'REMOTE': return <Wifi size={14} />;
    case 'HYBRID': return <Building size={14} />;
    case 'ONSITE': return <Home size={14} />;
    default: return <Briefcase size={14} />;
  }
};

const getJobTypeColor = (jobType) => {
  switch (jobType) {
    case 'REMOTE': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    case 'HYBRID': return { bg: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed' };
    case 'ONSITE': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
    default: return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
  }
};

const JobCard = ({ job, onApply, onViewDetails, userRole, hasApplied }) => {
  const jobTypeStyle = getJobTypeColor(job.jobType);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'transform 0.2s',
        cursor: onViewDetails ? 'pointer' : 'default',
      }}
      onClick={() => onViewDetails && onViewDetails(job)}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div>
          <h3 style={{marginBottom: '0.25rem', fontSize: '1.25rem'}}>{job.title}</h3>
          <div style={{display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap'}}>
            <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><Building2 size={16} /> {job.company}</span>
            <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><MapPin size={16} /> {job.location}</span>
            <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><Briefcase size={16} /> ${job.salary.toLocaleString()}</span>
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end'}}>
          <div style={{background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '600'}}>
            Active
          </div>
          {job.jobType && (
            <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem', background: jobTypeStyle.bg, color: jobTypeStyle.color, padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600'}}>
              {getJobTypeIcon(job.jobType)} {job.jobType}
            </div>
          )}
        </div>
      </div>

      <p style={{color: 'var(--text-main)', fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
        {job.description}
      </p>

      <div style={{marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
            <Clock size={14} /> Posted recently
          </span>
          {onViewDetails && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(job); }}
              className="btn btn-secondary"
              style={{padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}
            >
              <Eye size={14} /> Details
            </button>
          )}
        </div>

        {userRole === 'CANDIDATE' && (
          <button
            onClick={(e) => { e.stopPropagation(); onApply(job.id); }}
            className="btn btn-primary"
            style={{padding: '0.5rem 1rem'}}
            disabled={hasApplied}
          >
            {hasApplied ? 'Applied' : 'Apply Now'}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
