import { useState } from 'react';
import { X, Briefcase, CheckCircle, Edit } from 'lucide-react';
import api from '../services/api';

const EMPTY_FORM = {
  title: '',
  description: '',
  company: '',
  location: '',
  salary: '',
  jobType: 'ONSITE',
  requirements: '',
  deadline: '',
};

const PostJobModal = ({ isOpen, onClose, onSuccess, job, isEdit = false }) => {
  const initialForm = isEdit && job ? {
    title: job.title || '',
    description: job.description || '',
    company: job.company || '',
    location: job.location || '',
    salary: job.salary || '',
    jobType: job.jobType || 'ONSITE',
    requirements: job.requirements || '',
    deadline: job.deadline || '',
  } : EMPTY_FORM;

  const [formData, setFormData] = useState(initialForm);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        deadline: formData.deadline || null,
      };

      if (isEdit && job) {
        await api.put(`/jobs/${job.id}`, payload);
      } else {
        await api.post('/jobs', payload);
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData(EMPTY_FORM);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'post'} job`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '90%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem', right: '1rem',
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem',
          }}
        >
          <X size={20} />
        </button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>
              {isEdit ? 'Job Updated!' : 'Job Posted!'}
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {isEdit ? 'Your changes have been saved.' : 'Your job is now live. Applicants will be notified.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {isEdit ? <Edit size={24} color="var(--primary)" /> : <Briefcase size={24} color="var(--primary)" />}
              <h2 style={{ margin: 0 }}>{isEdit ? 'Edit Job' : 'Post a New Job'}</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Job Title *</label>
                <input
                  type="text" name="title" value={formData.title} onChange={handleChange} required
                  placeholder="e.g. Senior React Developer"
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Company *</label>
                <input
                  type="text" name="company" value={formData.company} onChange={handleChange} required
                  placeholder="e.g. Tech Corp Inc."
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Location *</label>
                  <input
                    type="text" name="location" value={formData.location} onChange={handleChange} required
                    placeholder="e.g. New York, NY"
                    style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Salary ($/year)</label>
                  <input
                    type="number" name="salary" value={formData.salary} onChange={handleChange}
                    placeholder="e.g. 120000"
                    style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Job Type</label>
                  <select
                    name="jobType" value={formData.jobType} onChange={handleChange}
                    style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem' }}
                  >
                    <option value="ONSITE">ONSITE</option>
                    <option value="REMOTE">REMOTE</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Application Deadline</label>
                  <input
                    type="date" name="deadline" value={formData.deadline} onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Description</label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange} rows={3}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Requirements</label>
                <textarea
                  name="requirements" value={formData.requirements} onChange={handleChange} rows={3}
                  placeholder="List the required skills, experience, and qualifications..."
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}

              <button
                type="submit" className="btn btn-primary" disabled={uploading}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {uploading ? (isEdit ? 'Updating...' : 'Posting...') : (isEdit ? 'Update Job' : 'Post Job')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PostJobModal;
