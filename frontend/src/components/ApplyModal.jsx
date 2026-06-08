import { useState } from 'react';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { safeError } from '../utils/errorUtils';

const ApplyModal = ({ job, isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Only PDF, DOC, and DOCX files are allowed');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      await api.post(`/applications/${job.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      if (onSuccess) onSuccess(job.id);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFile(null);
      }, 1500);
    } catch (err) {
      console.error('Detailed Error:', err);
      setError(safeError(err));
    } finally {
      setUploading(false);
    }
  };

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
          maxWidth: '500px',
          padding: '2rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
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
          }}
        >
          <X size={20} />
        </button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Application Submitted!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Your resume has been sent to the employer.</p>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>Apply for Job</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {job.title} at {job.company}
            </p>

            <form onSubmit={handleSubmit}>
              {/* File Upload */}
              <div
                style={{
                  border: '2px dashed var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  background: file ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  borderColor: file ? 'var(--success)' : 'var(--glass-border)',
                }}
              >
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                    <FileText size={24} />
                    <div>
                      <p style={{ fontWeight: '500' }}>{file.name}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Upload your resume (PDF, DOC, DOCX)
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  {file ? 'Change File' : 'Select Resume'}
                </label>
              </div>

              {error && (
                <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading || !file}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {uploading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplyModal;
