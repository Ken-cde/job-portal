import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';
import ApplyModal from '../components/ApplyModal';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.role === 'CANDIDATE') {
      fetchMyApplications();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const endpoint = search ? `/jobs/search?keyword=${search}` : '/jobs';
      const res = await api.get(endpoint);
      setJobs(res.data.content || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await api.get('/applications/my');
      const appliedJobIds = res.data.map(app => app.jobId).filter(Boolean);
      setAppliedJobs(new Set(appliedJobIds));
    } catch (err) {
      console.error('Failed to fetch my applications', err);
    }
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const handleApply = (job) => {
    if (!user) {
      alert('Please login to apply for jobs');
      return;
    }
    setSelectedJob(job);
    setShowDetailModal(false);
    setShowApplyModal(true);
  };

  const handleApplySuccess = (jobId) => {
    setAppliedJobs(prev => new Set([...prev, jobId]));
    setShowApplyModal(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onApply={handleApply}
        hasApplied={selectedJob ? appliedJobs.has(selectedJob.id) : false}
      />

      {/* Apply Modal */}
      {selectedJob && (
        <ApplyModal
          job={selectedJob}
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* Hero Section */}
      <div className="glass-panel" style={{padding: '4rem 2rem', textAlign: 'center', marginBottom: '3rem', background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.1) 0%, rgba(255,255,255,0.02) 100%)'}}>
        <h1 style={{fontSize: '3rem', marginBottom: '1rem'}}>Find Your Dream <span style={{color: 'var(--primary)'}}>Job</span> Today</h1>
        <p style={{color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem'}}>
          Connect with top employers and discover opportunities that match your skills. Your next big career move starts here.
        </p>

        <div style={{maxWidth: '500px', margin: '0 auto', position: 'relative', display: 'flex', gap: '0.5rem'}}>
          <input
            type="text"
            placeholder="Search by job title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchJobs(); } }}
            style={{flex: 1, paddingLeft: '3rem', borderRadius: '2rem', height: '50px', fontSize: '1rem', background: 'var(--bg-secondary)'}}
          />
          <button
            onClick={fetchJobs}
            className="btn btn-primary"
            style={{borderRadius: '2rem', padding: '0 1.5rem', height: '50px'}}
          >
            Search
          </button>
        </div>
      </div>

      {/* Jobs Feed */}
      <h2 style={{marginBottom: '1.5rem'}}>Latest Opportunities</h2>
      {loading ? (
        <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel" style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
          No jobs found matching your search.
        </div>
      ) : (
        <div className="grid-container">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              userRole={user?.role}
              onApply={handleApply}
              onViewDetails={handleViewDetails}
              hasApplied={appliedJobs.has(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
