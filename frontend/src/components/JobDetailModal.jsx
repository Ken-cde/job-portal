import { X, MapPin, Building2, Briefcase, DollarSign, Wifi, Home, Building, CheckCircle } from 'lucide-react';

const getJobTypeIcon = (jobType) => {
  switch (jobType) {
    case 'REMOTE': return <Wifi size={16} />;
    case 'HYBRID': return <Building size={16} />;
    case 'ONSITE': return <Home size={16} />;
    default: return <Briefcase size={16} />;
  }
};

const getJobTypeLabel = (jobType) => {
  switch (jobType) {
    case 'REMOTE': return 'Remote';
    case 'HYBRID': return 'Hybrid';
    case 'ONSITE': return 'On-site';
    default: return jobType;
  }
};

const JobDetailModal = ({ job, isOpen, onClose, onApply, hasApplied }) => {
  if (!isOpen || !job) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          padding: '0',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--glass-border)',
          background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.15) 0%, rgba(255,255,255,0.02) 100%)',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.5rem',
              fontSize: '1.5rem',
              lineHeight: 1,
            }}
          >
            <X size={20} />
          </button>

          <h2 style={{ marginBottom: '0.5rem', paddingRight: '2rem' }}>{job.title}</h2>

          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={16} /> {job.company}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={16} /> {job.location}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
              padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '600'
            }}>
              <DollarSign size={14} /> ${job.salary?.toLocaleString()}/year
            </span>
            {job.jobType && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed',
                padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '600'
              }}>
                {getJobTypeIcon(job.jobType)} {getJobTypeLabel(job.jobType)}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Job Description</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Requirements & Qualifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {job.requirements.split('\n').map((req, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <CheckCircle size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.15rem' }} />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Type Info */}
          <div style={{
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Work Type</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {job.jobType === 'REMOTE' && 'This position allows you to work entirely from home/anywhere.'}
              {job.jobType === 'HYBRID' && 'This position offers a mix of remote and on-site work.'}
              {job.jobType === 'ONSITE' && 'This position requires working physically at our office location.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 1.5rem' }}
          >
            Close
          </button>
          {onApply && (
            <button
              onClick={() => onApply(job)}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.5rem' }}
              disabled={hasApplied}
            >
              {hasApplied ? 'Already Applied' : 'Apply Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
