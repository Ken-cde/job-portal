import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import ApplyModal from '../components/ApplyModal';
import JobDetailModal from '../components/JobDetailModal';
import PostJobModal from '../components/PostJobModal';
import ResumeAnalysisResult from '../components/ResumeAnalysisResult';
import AiScreeningResult from '../components/AiScreeningResult';
import AiInterviewGuideResult from '../components/AiInterviewGuideResult';
import { Briefcase, Users, FileText, CheckCircle, Clock, XCircle, Eye, Pencil, Trash, Sparkles } from 'lucide-react';
import { PageTransition, WateryCard, RippleButton, P3Slam } from '../components/MotionSystem';
import { AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import CinematicText from '../components/CinematicText';
import { safeError } from '../utils/errorUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!user?.role) return;
    setLoading(true);
    setError(null);
    try {
      const roleMap = {
        'CANDIDATE': '/dashboard/candidate',
        'EMPLOYER': '/dashboard/employer',
        'ADMIN': '/dashboard/admin'
      };

      const endpoint = roleMap[user.role];
      if (!endpoint) {
        setError('Unknown role: ' + user.role);
        setLoading(false);
        return;
      }

      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setError(safeError(err));
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user) return;
    fetchDashboard();
  }, [user, fetchDashboard]);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-p3cyan/20 border-t-p3cyan rounded-full animate-spin" />
        <p className="cinematic-text text-xs text-p3cyan/60">Synchronizing neural link...</p>
      </div>
    </div>
  );
  if (error) return <div className="flex h-screen w-full items-center justify-center text-red-400 cinematic-text">Error: {error}</div>;
  if (!user) return <div className="flex h-screen w-full items-center justify-center cinematic-text">Access Denied.</div>;
  if (!data) return <div className="flex h-screen w-full items-center justify-center cinematic-text">No data received.</div>;

  return (
    <PageTransition>
      <div className="relative min-h-screen w-full px-6 py-12 overflow-x-hidden">
        {/* Atmospheric Accents */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-p3cyan/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-p3cyan/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-p3cyan/20 to-transparent rotate-[-15deg]" />
          <div className="absolute top-0 left-1/3 w-[1px] h-full bg-gradient-to-b from-transparent via-p3cyan/10 to-transparent rotate-[20deg]" />
        </div>

        {/* Cinematic Header */}
        <header className="relative mb-20 flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
          <P3Slam direction="left">
            <div className="relative">
              <CinematicText variant="label">Welcome Back</CinematicText>
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter italic skew-x-[-2deg] md:skew-x-[-5deg]">
                {user.username}<span className="text-p3cyan">.</span>
              </h1>
              <p className="text-white/40 cinematic-text text-xs mt-2 uppercase tracking-widest italic">
                {user.role} Interface Activated
              </p>
            </div>
          </P3Slam>

          <P3Slam direction="right">
            <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 text-xs cinematic-text text-white/60 border-p3cyan/20">
              <div className="w-2 h-2 bg-p3cyan rounded-full animate-pulse" />
              System Online: {new Date().toLocaleDateString()}
            </div>
          </P3Slam>
        </header>

        <AnimatePresence mode="wait">
          {user.role === 'CANDIDATE' && <CandidateView key="candidate" data={data} />}
          {user.role === 'EMPLOYER' && <EmployerView key="employer" data={data} />}
          {user.role === 'ADMIN' && <AdminView key="admin" data={data} />}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

const StatCard = ({ title, value, icon, color, onClick, active }) => (
  <P3Slam direction="bottom" delay={0.1}>
    <WateryCard angle={active ? 2 : 0}>
      <GlassPanel
        shape={active ? 'rect' : 'trapezoid'}
        className={`p-6 flex items-center gap-6 transition-all duration-500 cursor-pointer group ${active ? 'glass-panel-bright border-p3cyan/50 shadow-[0_0_30px_rgba(120,232,255,0.2)] scale-105' : 'hover:bg-white/10'}`}
        onClick={onClick}
      >
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-p3cyan shadow-[0_0_15px_rgba(120,232,255,0.8)]" />
        )}
        <div className="p-4 rounded-xl bg-white/5 text-p3cyan border border-white/10 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="transition-transform group-hover:translate-x-1">
          <div className="text-white/40 cinematic-text text-[10px] uppercase tracking-tighter">{title}</div>
          <div className="text-2xl md:text-4xl font-black text-white italic tracking-tighter">{value}</div>
        </div>
      </GlassPanel>
    </WateryCard>
  </P3Slam>
);

const getFilenameFromHeaders = (headers) => {
  const disposition = headers['content-disposition'];
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^";]+)"?/);
  return match ? match[1] : null;
};

const CandidateView = ({ data }) => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [popupStatus, setPopupStatus] = useState(null);
  const [appPage, setAppPage] = useState(0);
  const [appTotalPages, setAppTotalPages] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const APP_PAGE_SIZE = 5;
  const toast = useToast();

  const fetchBrowseJobs = async () => {
    setLoadingJobs(true);
    try {
      const endpoint = search ? `/jobs/search?keyword=${search}` : '/jobs';
      const res = await api.get(endpoint);
      setJobs(res.data.content || []);
    } catch (err) { console.error(err); } finally { setLoadingJobs(false); }
  };

  const fetchMyApplications = async (page = 0) => {
    if (loadingApps) return;
    setLoadingApps(true);
    try {
      const res = await api.get(`/applications/my?page=${page}&size=${APP_PAGE_SIZE}`);
      setApplications(res.data.content || []);
      setAppTotalPages(res.data.totalPages || 0);
      setAppPage(page);
      setAppliedJobs(new Set(res.data.content.map(app => app.jobId).filter(Boolean)));
    } catch (err) { console.error(err); } finally { setLoadingApps(false); }
  };

  useEffect(() => {
    fetchMyApplications(0);
    fetchBrowseJobs();
  }, []);

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const handleApplyFromModal = (job) => {
    setShowDetailModal(false);
    setShowApplyModal(true);
  };

  const handleApplySuccess = (jobId) => {
    setAppliedJobs(prev => new Set([...prev, jobId]));
    fetchMyApplications(0);
  };

      const optimizeResume = async (appId) => {
        setIsAnalyzing(true);
        try {
          const res = await api.get(`/applications/analyze-fit?applicationId=${appId}`);
          setAnalysisResult(res.data);
        } catch (err) {
          toast.error('AI analysis failed: ' + safeError(err));
        } finally {
          setIsAnalyzing(false);
        }
      };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'REJECTED': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      case 'INTERVIEWING': return { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
      case 'REVIEWED': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
      default: return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
    }
  };

  const getStatusCount = (status) => {
    if (status === 'ALL') return applications.length;
    return applications.filter(a => a.status === status).length;
  };

  const popupApplications = popupStatus === 'ALL' ? applications : (popupStatus ? applications.filter(a => a.status === popupStatus) : []);
  const popupTitle = { 'ACCEPTED': 'Accepted', 'REJECTED': 'Rejected', 'APPLIED': 'Pending', 'ALL': 'All' }[popupStatus] || '';
  const filteredApplications = applications.filter(app => statusFilter === 'ALL' || app.status === statusFilter);

  const getCurrencySymbol = (curr) => curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr || '$';

  return (
    <>
      {selectedJob && <ApplyModal job={selectedJob} isOpen={showApplyModal} onClose={() => { setShowApplyModal(false); setSelectedJob(null); }} onSuccess={handleApplySuccess} />}
      <JobDetailModal job={selectedJob} isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} onApply={handleApplyFromModal} hasApplied={selectedJob ? appliedJobs.has(selectedJob.id) : false} />
      <ResumeAnalysisResult analysis={analysisResult} onClose={() => setAnalysisResult(null)} />

      {popupStatus && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setPopupStatus(null)}>
          <GlassPanel shape="trapezoid" className="w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden" glow={true} onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <CinematicText variant="aggressive">{popupTitle}</CinematicText>
              <button onClick={() => setPopupStatus(null)} className="text-white/40 hover:text-white transition-colors text-2xl">×</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 gap-2 flex flex-col">
              {loadingApps ? (
                <div className="text-center py-12 cinematic-text text-white/30">Loading...</div>
              ) : popupApplications.length === 0 ? (
                <div className="text-center py-12 cinematic-text text-white/30">No records found.</div>
              ) : (
                popupApplications.map((app, idx) => {
                  const s = getStatusColor(app.status);
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-white">{app.jobTitle}</div>
                        <div className="text-xs text-white/40">{app.company}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] cinematic-text" style={{background: s.bg, color: s.color}}>{app.status}</span>
                    </div>
                  );
                })
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Applications" value={getStatusCount('ALL')} icon={<FileText size={20}/>} color="59, 130, 246" onClick={() => setPopupStatus('ALL')} active={popupStatus === 'ALL'} />
        <StatCard title="Accepted" value={getStatusCount('ACCEPTED')} icon={<CheckCircle size={20}/>} color="16, 185, 129" onClick={() => setPopupStatus('ACCEPTED')} active={popupStatus === 'ACCEPTED'} />
        <StatCard title="Pending" value={getStatusCount('APPLIED')} icon={<Clock size={20}/>} color="245, 158, 11" onClick={() => setPopupStatus('APPLIED')} active={popupStatus === 'APPLIED'} />
        <StatCard title="Rejected" value={getStatusCount('REJECTED')} icon={<XCircle size={20}/>} color="239, 68, 68" onClick={() => setPopupStatus('REJECTED')} active={popupStatus === 'REJECTED'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
        <P3Slam direction="left">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <CinematicText variant="aggressive">My Application Feed</CinematicText>
              <button className="cinematic-text text-[10px] text-p3cyan border border-p3cyan/30 px-3 py-1 rounded-full hover:bg-p3cyan/20 transition-all" onClick={() => fetchMyApplications()}>Refresh</button>
            </div>

            <div className="flex gap-2 mb-4">
              {['ALL', 'APPLIED', 'ACCEPTED', 'REJECTED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-[10px] cinematic-text transition-all ${statusFilter === s ? 'bg-p3cyan text-p3midnight' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <GlassPanel className="p-4 min-h-fit md:min-h-[400px] space-y-2">
              {loadingApps ? <div className="py-12 text-center cinematic-text text-white/30">Loading...</div> :
               filteredApplications.length === 0 ? <div className="py-12 text-center cinematic-text text-white/30">No records.</div> :
               filteredApplications.map((app, idx) => {
                 const s = getStatusColor(app.status);
                 return (
                   <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                     <div className="flex-1 min-w-0 pr-4">
                       <div className="text-sm font-medium text-white group-hover:text-p3cyan transition-colors">{app.jobTitle}</div>
                       <div className="text-xs text-white/40">{app.company}</div>
                     </div>
                     <div className="flex items-center gap-3">
                       <RippleButton
                         onClick={() => optimizeResume(app.applicationId)}
                         disabled={isAnalyzing}
                         className="py-1 px-3 text-[10px] bg-p3cyan/10 text-p3cyan border border-p3cyan/30 hover:bg-p3cyan/20 transition-all flex items-center gap-1"
                       >
                         <Sparkles size={10} /> {isAnalyzing ? 'Analyzing...' : 'Analyze Fit'}
                       </RippleButton>
                       <span className="px-2 py-0.5 rounded-full text-[10px] cinematic-text" style={{background: s.bg, color: s.color}}>{app.status}</span>
                     </div>
                   </div>
                 );
               })}
            </GlassPanel>
          </div>
        </P3Slam>

        <P3Slam direction="right">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <CinematicText variant="aggressive">Neural Job Search</CinematicText>
              <button className="cinematic-text text-[10px] text-p3cyan border border-p3cyan/30 px-3 py-1 rounded-full hover:bg-p3cyan/20 transition-all" onClick={fetchBrowseJobs}>Refresh</button>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <div className="p3-unskew">
                  <input
                    type="text"
                    placeholder="Filter potential roles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') fetchBrowseJobs(); }}
                    className="w-full pl-4 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-p3cyan/50 transition-all"
                  />
                </div>
              </div>
              <RippleButton onClick={fetchBrowseJobs} className="text-xs px-6">Search</RippleButton>
            </div>
            <GlassPanel className="p-4 min-h-fit md:min-h-[400px] space-y-3">
              {loadingJobs ? <div className="py-12 text-center cinematic-text text-white/30">Loading...</div> :
               jobs.length === 0 ? <div className="py-12 text-center cinematic-text text-white/30">No results.</div> :
               jobs.map(job => {
                 const color = job.jobType === 'REMOTE' ? '#10b981' : job.jobType === 'HYBRID' ? '#7c3aed' : job.jobType === 'ONSITE' ? '#3b82f6' : '#f59e0b';
                 return (
                   <div key={job.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                     <div className="min-w-0">
                       <div className="text-sm font-medium text-white group-hover:text-p3cyan transition-colors truncate">{job.title}</div>
                       <div className="text-xs text-white/40 flex gap-2 flex-wrap">
                         <span>{job.company}</span><span>·</span><span>{job.location}</span>
                         <span className="px-1 rounded-sm" style={{color: color}}>{job.jobType}</span>
                         <span className="text-p3cyan/80">{getCurrencySymbol(job.currency)}{job.salary?.toLocaleString()}</span>
                       </div>
                     </div>
                     <div className="flex gap-2 shrink-0">
                       <button className="p-1.5 rounded-full bg-white/5 text-white/60 hover:text-p3cyan transition-colors" onClick={() => handleViewDetails(job)}><Eye size={12} /></button>
                       <RippleButton onClick={() => handleApply(job)} variant="primary" className="py-1 px-3 text-[10px]">{appliedJobs.has(job.id) ? 'Applied' : 'Apply'}</RippleButton>
                     </div>
                   </div>
                 );
               })}
            </GlassPanel>
          </div>
        </P3Slam>
      </div>
    </>
  );
};

const EmployerView = ({ data }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [appFilter, setAppFilter] = useState('ALL');
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [appPage, setAppPage] = useState(0);
  const [appTotalPages, setAppTotalPages] = useState(0);
  const [screeningResult, setScreeningResult] = useState(null);
  const [guideResult, setGuideResult] = useState(null);
  const [isScreening, setIsScreening] = useState(false);
  const [isGuiding, setIsGuiding] = useState(false);
  const APP_PAGE_SIZE = 5;

  const filteredByJob = (() => {
    const apps = appFilter === 'ALL' ? applications
      : appFilter === 'ACTIVE' ? applications.filter(a => a.status !== 'REJECTED')
      : applications.filter(a => a.status === 'REJECTED');

    const grouped = {};
    apps.forEach(app => {
      if (!grouped[app.jobId]) {
        grouped[app.jobId] = { jobId: app.jobId, jobTitle: app.jobTitle, applications: [] };
      }
      grouped[app.jobId].applications.push(app);
    });
    return Object.values(grouped);
  })();

  const fetchMyJobs = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/jobs/my');
      setJobs(res.data || []);
    } catch (err) { console.error(err); } finally { setLoadingList(false); }
  };

  const fetchMyApplications = async (page = 0) => {
    setLoadingList(true);
    try {
      const res = await api.get(`/applications/my-applicants?page=${page}&size=${APP_PAGE_SIZE}`);
      setApplications(res.data.content || []);
      setAppTotalPages(res.data.totalPages || 0);
      setAppPage(page);
    } catch (err) { console.error(err); } finally { setLoadingList(false); }
  };

  const handleCardClick = (tab) => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
      if (tab === 'myjobs') fetchMyJobs();
      if (tab === 'myapplicants') fetchMyApplications(0);
    }
  };

  const updateStatus = async (appId, action) => {
    setActionLoading(prev => ({ ...prev, [appId]: action }));
    try {
      await api.put(`/applications/${appId}/${action}`);
      fetchMyApplications();
    } catch (err) {
      toast.error('Failed to update application status');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
    }
  };

  const removeApplication = async (appId) => {
    if (!window.confirm('Remove this application? This cannot be undone.')) return;
    try {
      await api.delete(`/applications/${appId}`);
      fetchMyApplications();
    } catch (err) {
      toast.error('Failed to remove application');
    }
  };

  const downloadResume = async (appId) => {
    try {
      const res = await api.get(`/applications/${appId}/resume`, { responseType: 'blob' });
      const filename = getFilenameFromHeaders(res.headers) || `resume_${appId}`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download resume');
    }
  };

  const runAiScreening = async (jobId) => {
    setIsScreening(true);
    try {
      const res = await api.get(`/applications/job/${jobId}/screen`);
      setScreeningResult(res.data);
    } catch (err) {
      toast.error('AI Screening failed: ' + safeError(err));
    } finally {
      setIsScreening(false);
    }
  };

  const generateGuide = async (appId) => {
    setIsGuiding(true);
    try {
      const res = await api.get(`/applications/${appId}/interview-guide`);
      setGuideResult(res.data);
    } catch (err) {
      toast.error('AI Guide generation failed: ' + safeError(err));
    } finally {
      setIsGuiding(false);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowPostJobModal(true);
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      toast.success('Job deleted');
      fetchMyJobs();
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'ACCEPTED') return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
    if (status === 'REJECTED') return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
    if (status === 'INTERVIEWING') return { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
    if (status === 'REVIEWED') return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
    return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
  };

  return (
    <>
      <PostJobModal
        isOpen={showPostJobModal}
        onClose={() => { setShowPostJobModal(false); setEditingJob(null); }}
        onSuccess={() => { fetchMyJobs(); setActiveTab('myjobs'); setEditingJob(null); }}
        job={editingJob}
        isEdit={!!editingJob}
      />
      <AiScreeningResult results={screeningResult} onClose={() => setScreeningResult(null)} />
      <AiInterviewGuideResult guide={guideResult} onClose={() => setGuideResult(null)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
        <StatCard title="Active Job Postings" value={data.totalJobsPosted} icon={<Briefcase size={20}/>} color="124, 58, 237" onClick={() => handleCardClick('myjobs')} active={activeTab === 'myjobs'} />
        <StatCard title="Total Applicants" value={data.totalApplicationsReceived} icon={<Users size={20}/>} color="59, 130, 246" onClick={() => handleCardClick('myapplicants')} active={activeTab === 'myapplicants'} />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'myjobs' && (
          <P3Slam key="myjobs" direction="left">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <CinematicText variant="aggressive">Management Sector: Postings</CinematicText>
              <RippleButton onClick={() => setShowPostJobModal(true)} className="text-xs">+ Post New Job</RippleButton>
            </div>
            <GlassPanel className="p-4 min-h-fit md:min-h-[400px] space-y-3">
              {loadingList ? (
                <div className="py-12 text-center cinematic-text text-white/30">Loading...</div>
              ) : jobs.length === 0 ? (
                <div className="py-12 text-center cinematic-text text-white/30">No postings found.</div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white group-hover:text-p3cyan transition-colors truncate">{job.title}</div>
                      <div className="text-xs text-white/40">{job.company} · {job.location}</div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-p3cyan font-medium text-sm">${job.salary?.toLocaleString()}</div>
                       <div className="flex gap-2">
                        <RippleButton onClick={() => runAiScreening(job.id)} disabled={isScreening} className="py-1 px-3 text-[10px] bg-p3cyan/10 text-p3cyan border border-p3cyan/30 hover:bg-p3cyan/20 transition-all flex items-center gap-1">
                          <Sparkles size={10} /> {isScreening ? 'Scanning...' : 'AI Screen'}
                        </RippleButton>
                        <button className="p-1.5 rounded-full bg-white/5 text-white/60 hover:text-white transition-colors" onClick={() => handleEditJob(job)}><Pencil size={12} /></button>
                        <button className="p-1.5 rounded-full bg-white/5 text-red-400 hover:bg-red-400/20 transition-colors" onClick={() => handleDeleteJob(job)}><Trash size={12} /></button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </GlassPanel>
          </div>
        </P3Slam>
      )}

      {activeTab === 'myapplicants' && (
        <P3Slam direction="right">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <CinematicText variant="aggressive">Applicant Neural Feed</CinematicText>
              <div className="flex gap-2">
                {['ALL', 'ACTIVE', 'REJECTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setAppFilter(f)}
                    className={`px-3 py-1 rounded-full text-[10px] cinematic-text transition-all ${appFilter === f ? 'bg-p3cyan text-p3midnight' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <GlassPanel className="p-6 space-y-8">
              {loadingList ? (
                <div className="py-12 text-center cinematic-text text-white/30">Loading...</div>
              ) : filteredByJob.length === 0 ? (
                <div className="py-12 text-center cinematic-text text-white/30">No applicants.</div>
              ) : (
                filteredByJob.map(group => (
                  <div key={group.jobId} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="text-sm font-medium text-white italic uppercase tracking-wide">{group.jobTitle}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] cinematic-text bg-white/5 text-white/40 border border-white/10">
                        {group.applications.length} candidates
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {group.applications.map(app => {
                        const s = getStatusStyle(app.status);
                        return (
                          <div key={app.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                            <div>
                              <div className="text-xs font-medium text-white group-hover:text-p3cyan transition-colors">{app.candidateName}</div>
                              <div className="text-[10px] text-white/40">{app.candidateEmail}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded-full text-p3cyan text-[10px] cinematic-text" style={{background: s.bg, color: s.color}}>{app.status}</span>
                              <div className="flex gap-1">
                                {app.status === 'APPLIED' && <RippleButton onClick={() => updateStatus(app.id, 'review')} className="py-1 px-2 text-[10px]">Review</RippleButton>}
                                {app.status === 'REVIEWED' && <RippleButton onClick={() => updateStatus(app.id, 'interview')} className="py-1 px-2 text-[10px]">Interview</RippleButton>}
                                {app.status === 'INTERVIEWING' && <RippleButton onClick={() => updateStatus(app.id, 'accept')} className="py-1 px-2 text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Accept</RippleButton>}
                                {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && <RippleButton onClick={() => updateStatus(app.id, 'reject')} className="py-1 px-2 text-[10px] bg-red-500/20 text-red-400 border-red-500/30">Reject</RippleButton>}
                                <RippleButton onClick={() => generateGuide(app.id)} disabled={isGuiding} className="py-1 px-2 text-[10px] bg-p3cyan/10 text-p3cyan border-p3cyan/30 flex items-center gap-1">
                                  <Sparkles size={10} /> {isGuiding ? '...' : 'AI Guide'}
                                </RippleButton>
                                <button className="p-1.5 rounded-full bg-white/5 text-white/60 hover:text-white transition-colors" onClick={() => downloadResume(app.id)}><FileText size={12} /></button>
                                <button className="p-1.5 rounded-full bg-white/5 text-red-400/60 hover:bg-red-400/20 transition-colors" onClick={() => removeApplication(app.id)}><Trash size={12} /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </GlassPanel>
          </div>
        </P3Slam>
      )}
    </AnimatePresence>
    </>
  );
};

const AdminView = ({ data }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminAppActionLoading, setAdminAppActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [adminAppFilter, setAdminAppFilter] = useState('ALL');

  const adminFilteredByJob = (() => {
    const apps = adminAppFilter === 'ALL' ? applications
      : adminAppFilter === 'ACTIVE' ? applications.filter(a => a.status !== 'REJECTED')
      : applications.filter(a => a.status === 'REJECTED');

    const grouped = {};
    apps.forEach(app => {
      if (!grouped[app.jobId]) {
        grouped[app.jobId] = { jobId: app.jobId, jobTitle: app.jobTitle, applications: [] };
      }
      grouped[app.jobId].applications.push(app);
    });
    return Object.values(grouped);
  })();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) { console.error(err); } finally { setLoadingUsers(false); }
  };

  const fetchJobs = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/jobs');
      setJobs(res.data.content || []);
    } catch (err) { console.error(err); } finally { setLoadingList(false); }
  };

  const fetchApplications = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/applications');
      setApplications(res.data || []);
    } catch (err) { console.error(err); } finally { setLoadingList(false); }
  };

  const handleCardClick = (tab) => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
      if (tab === 'jobs') fetchJobs();
      if (tab === 'applications') fetchApplications();
    }
  };

  const promoteUser = async (userId) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/promote`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to promote user');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAdminApplication = async (appId) => {
    if (!window.confirm('Remove this application?')) return;
    try {
      await api.delete(`/applications/${appId}`);
      fetchApplications();
    } catch (err) {
      toast.error('Failed to remove application');
    }
  };

  const updateAdminAppStatus = async (appId, action) => {
    setAdminAppActionLoading(prev => ({ ...prev, [appId]: action }));
    try {
      await api.put(`/applications/${appId}/${action}`);
      fetchApplications();
    } catch (err) {
      toast.error('Failed to update application status');
    } finally {
      setAdminAppActionLoading(prev => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
    }
  };

  const downloadAdminResume = async (appId) => {
    try {
      const res = await api.get(`/applications/${appId}/resume`, { responseType: 'blob' });
      const filename = getFilenameFromHeaders(res.headers) || `resume_${appId}`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download resume');
    }
  };

  const getAdminStatusStyle = (status) => {
    if (status === 'ACCEPTED') return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
    if (status === 'REJECTED') return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
    if (status === 'INTERVIEWING') return { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
    if (status === 'REVIEWED') return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
    return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Users" value={data.totalUsers} icon={<Users size={20}/>} color="59, 130, 246" onClick={() => handleCardClick('users')} active={activeTab === 'users'} />
        <StatCard title="Total Jobs" value={data.totalJobs} icon={<Briefcase size={20}/>} color="124, 58, 237" onClick={() => handleCardClick('jobs')} active={activeTab === 'jobs'} />
        <StatCard title="Total Applications" value={data.totalApplications} icon={<FileText size={20}/>} color="16, 185, 129" onClick={() => handleCardClick('applications')} active={activeTab === 'applications'} />
      </div>

      <AnimatePresence mode="wait">

      {activeTab === 'users' && (
        <P3Slam direction="left">
          <div className="space-y-6">
            <CinematicText variant="aggressive">System User Directory</CinematicText>
            <GlassPanel>
              {loadingUsers ? <div className="py-12 text-center cinematic-text text-white/30">Loading users...</div> : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {users.map(user => (
                    <div key={user.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                      <div>
                        <div className="text-sm font-medium text-white">{user.username}</div>
                        <div className="text-xs text-white/40">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] cinematic-text border ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' : user.role === 'EMPLOYER' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                          {user.role}
                        </span>
                        {user.role === 'CANDIDATE' && (
                          <RippleButton onClick={() => promoteUser(user.id)} variant="primary" className="py-1 px-3 text-[10px]" disabled={actionLoading === user.id}>
                            {actionLoading === user.id ? '...' : 'Promote'}
                          </RippleButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </div>
        </P3Slam>
      )}

      {activeTab === 'jobs' && (
        <P3Slam direction="right">
          <div className="space-y-6">
            <CinematicText variant="aggressive">Global Job Index</CinematicText>
            <GlassPanel>
              {loadingList ? <div className="py-12 text-center cinematic-text text-white/30">Loading jobs...</div> : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {jobs.map(job => (
                    <div key={job.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-p3cyan transition-colors">{job.title}</div>
                        <div className="text-xs text-white/40">{job.company} · {job.location}</div>
                      </div>
                      <div className="text-p3cyan font-medium text-sm">${job.salary?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </div>
        </P3Slam>
      )}

      {activeTab === 'applications' && (
        <P3Slam direction="bottom">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <CinematicText variant="aggressive">Global Application Feed</CinematicText>
              <div className="flex gap-2">
                {['ALL', 'ACTIVE', 'REJECTED'].map(f => (
                  <button key={f} onClick={() => setAdminAppFilter(f)} className={`px-3 py-1 rounded-full text-[10px] cinematic-text transition-all ${adminAppFilter === f ? 'bg-p3cyan text-p3midnight' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <GlassPanel className="p-6 space-y-8">
              {loadingList ? <div className="py-12 text-center cinematic-text text-white/30">Loading...</div> :
               adminFilteredByJob.length === 0 ? <div className="py-12 text-center cinematic-text text-white/30">No records.</div> :
               adminFilteredByJob.map(group => (
                 <div key={group.jobId} className="space-y-3">
                   <div className="flex items-center justify-between border-b border-white/10 pb-2">
                     <h4 className="text-sm font-medium text-white italic uppercase tracking-wide">{group.jobTitle}</h4>
                     <span className="px-2 py-0.5 rounded-full text-[10px] cinematic-text bg-white/5 text-white/40 border border-white/10">
                       {group.applications.length} candidates
                     </span>
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                     {group.applications.map(app => {
                       const s = getAdminStatusStyle(app.status);
                       return (
                         <div key={app.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                           <div>
                             <div className="text-xs font-medium text-white group-hover:text-p3cyan transition-colors">{app.candidateName}</div>
                             <div className="text-[10px] text-white/40">{app.candidateEmail}</div>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className="px-2 py-0.5 rounded-full text-[10px] cinematic-text" style={{background: s.bg, color: s.color}}>{app.status}</span>
                             <div className="flex gap-1">
                               {app.status !== 'INTERVIEWING' && <RippleButton onClick={() => updateAdminAppStatus(app.id, 'interview')} className="py-1 px-2 text-[10px]">Interview</RippleButton>}
                               {app.status !== 'REVIEWED' && <RippleButton onClick={() => updateAdminAppStatus(app.id, 'review')} className="py-1 px-2 text-[10px]">Review</RippleButton>}
                               {app.status !== 'ACCEPTED' && <RippleButton onClick={() => updateAdminAppStatus(app.id, 'accept')} className="py-1 px-2 text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Accept</RippleButton>}
                               {app.status !== 'REJECTED' && <RippleButton onClick={() => updateAdminAppStatus(app.id, 'reject')} className="py-1 px-2 text-[10px] bg-red-500/20 text-red-400 border-red-500/30">Reject</RippleButton>}
                               <button className="p-1.5 rounded-full bg-white/5 text-white/60 hover:text-white transition-colors" onClick={() => downloadAdminResume(app.id)}><FileText size={12} /></button>
                               <button className="p-1.5 rounded-full bg-white/5 text-red-400/60 hover:bg-red-400/20 transition-colors" onClick={() => deleteAdminApplication(app.id)}><Trash size={12} /></button>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               ))}
            </GlassPanel>
          </div>
        </P3Slam>
      )}
    </AnimatePresence>
    </>
  );
};

export default Dashboard;
