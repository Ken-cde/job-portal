import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';
import ApplyModal from '../components/ApplyModal';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/MotionSystem';
import GlassPanel from '../components/GlassPanel';
import CinematicText from '../components/CinematicText';
import { RippleButton } from '../components/MotionSystem';

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
    <PageTransition>
      <div className="relative min-h-screen w-full px-6 py-12">

        {/* CINEMATIC HERO SECTION */}
        <section className="relative h-[80vh] flex flex-col justify-center items-start mb-32">
          {/* Massive Background Typography */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full pointer-events-none overflow-hidden">
            <CinematicText variant="h1" className="left-[-5%] whitespace-nowrap">
              DISCOVER YOUR FUTURE
            </CinematicText>
          </div>

          {/* Main Floating Panel */}
          <GlassPanel
            angle={-2}
            className="relative z-10 p-12 max-w-3xl"
            glow={true}
          >
            <CinematicText variant="h2" className="mb-4">
              Find Your Dream Career
            </CinematicText>
            <p className="text-white/60 text-lg font-light mb-12 max-w-xl leading-relaxed">
              Step into a new era of professional discovery. Connect with global innovators and redefine your career trajectory in a dreamlike digital landscape.
            </p>

            <div className="relative flex gap-4 items-center group">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-p3cyan/40">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Enter role, keyword, or skill..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchJobs(); } }}
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/30 focus:outline-none focus:border-p3cyan/50 transition-all duration-500"
                />
              </div>
              <RippleButton onClick={fetchJobs} className="px-10">
                Search
              </RippleButton>
            </div>
          </GlassPanel>
        </section>

        {/* JOBS GRID SECTION */}
        <section className="relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div className="relative">
               <CinematicText variant="label">Available Opportunities</CinematicText>
               <CinematicText variant="h2" className="text-3xl">Latest Openings</CinematicText>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-3xl">
              <div className="w-12 h-12 border-4 border-p3cyan/20 border-t-p3cyan rounded-full animate-spin" />
              <p className="cinematic-text text-xs mt-4 text-p3cyan/60">Synchronizing data...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-24 text-center glass-panel rounded-3xl border-dashed border-white/10">
              <p className="cinematic-text text-white/40">No opportunities found in this sector.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        </section>

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
      </div>
    </PageTransition>
  );
};

export default Home;
