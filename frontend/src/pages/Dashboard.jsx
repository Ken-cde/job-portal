import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import ApplyModal from '../components/ApplyModal';
import JobDetailModal from '../components/JobDetailModal';
import PostJobModal from '../components/PostJobModal';
import { Briefcase, Users, FileText, CheckCircle, Clock, XCircle, Eye, Wifi, Home, Building, Pencil, Trash } from 'lucide-react';

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
      console.log('Fetching dashboard for role:', user.role, 'Endpoint:', endpoint);

      if (!endpoint) {
        setError('Unknown role: ' + user.role);
        setLoading(false);
        return;
      }

      const res = await api.get(endpoint);
      console.log('Dashboard data received:', res.data);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
        setError('Request timed out. Server not responding. Make sure ngrok is running.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Try logging out and in again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user) return;
    fetchDashboard();
  }, [user, fetchDashboard]);

  if (loading) return <div style={{textAlign: 'center', padding: '4rem'}}>Loading dashboard...</div>;
  if (error) return <div style={{textAlign: 'center', color: 'var(--danger)', padding: '4rem'}}>Error: {error}</div>;
  if (!user) return <div style={{textAlign: 'center', padding: '4rem'}}>Please login.</div>;
  if (!data) return <div style={{textAlign: 'center', color: 'var(--danger)'}}>No data received.</div>;

  // Render different dashboards based on role
  return (
    <div className="animate-fade-in">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1 style={{fontSize: '2rem'}}>Welcome back, {user.username}!</h1>
          <p style={{color: 'var(--text-muted)'}}>Here is your {user.role.toLowerCase()} overview.</p>
        </div>
      </div>

      {user.role === 'CANDIDATE' && <CandidateView data={data} />}
      {user.role === 'EMPLOYER' && <EmployerView data={data} />}
      {user.role === 'ADMIN' && <AdminView data={data} />}
    </div>
  );
};

// --- Subviews ---

const StatCard = ({ title, value, icon, color, onClick, active }) => (
  <div
    className="glass-panel"
    onClick={onClick}
    style={{
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      cursor: onClick ? 'pointer' : 'default',
      border: active ? `2px solid rgb(${color})` : '2px solid transparent',
      transition: 'all 0.2s'
    }}
  >
    <div style={{background: `rgba(${color}, 0.1)`, color: `rgb(${color})`, padding: '1rem', borderRadius: '50%'}}>
      {icon}
    </div>
    <div>
      <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem'}}>{title}</div>
      <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{value}</div>
    </div>
  </div>
);

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
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'APPLIED' | 'ACCEPTED' | 'REJECTED'
  const [popupStatus, setPopupStatus] = useState(null); // which stat card was clicked
  const [appPage, setAppPage] = useState(0);
  const [appTotalPages, setAppTotalPages] = useState(0);
  const APP_PAGE_SIZE = 5;

  const fetchBrowseJobs = async () => {
    setLoadingJobs(true);
    try {
      const endpoint = search ? `/jobs/search?keyword=${search}` : '/jobs';
      const res = await api.get(endpoint);
      setJobs(res.data.content || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchMyApplications = async (page = 0) => {
    if (loadingApps) return;
    setLoadingApps(true);
    try {
      const res = await api.get(`/applications/my?page=${page}&size=${APP_PAGE_SIZE}`);
      setApplications(res.data.content || []);
      setAppTotalPages(res.data.totalPages || 0);
      setAppPage(page);
      const appliedJobIds = res.data.content.map(app => app.jobId).filter(Boolean);
      setAppliedJobs(new Set(appliedJobIds));
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoadingApps(false);
    }
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

  const popupTitle = {
    'ACCEPTED': 'Accepted Applications',
    'REJECTED': 'Rejected Applications',
    'APPLIED': 'Pending Applications',
    'ALL': 'All Applications'
  }[popupStatus] || '';

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'ALL') return true;
    return app.status === statusFilter;
  });

  return (
    <>
      {selectedJob && (
        <ApplyModal
          job={selectedJob}
          isOpen={showApplyModal}
          onClose={() => { setShowApplyModal(false); setSelectedJob(null); }}
          onSuccess={handleApplySuccess}
        />
      )}

      <JobDetailModal
        job={selectedJob}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onApply={handleApplyFromModal}
        hasApplied={selectedJob ? appliedJobs.has(selectedJob.id) : false}
      />

      {/* Popup overlay */}
      {popupStatus && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setPopupStatus(null)}
        >
          <div
            className="glass-panel"
            style={{width: '90%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden'}}
            onClick={e => e.stopPropagation()}
          >
            {/* Popup header */}
            <div style={{padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0}}>{popupTitle}</h3>
              <button onClick={() => setPopupStatus(null)} style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1}}>×</button>
            </div>
            {/* Popup body */}
            <div style={{padding: '1rem', overflowY: 'auto', flex: 1}}>
              {loadingApps ? (
                <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>Loading...</p>
              ) : popupApplications.length === 0 ? (
                <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>No {popupStatus.toLowerCase()} applications.</p>
              ) : (
                <div style={{display: 'grid', gap: '0.5rem'}}>
                  {popupApplications.map((app, idx) => {
                    const statusStyle = getStatusColor(app.status);
                    return (
                      <div key={idx} style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{fontWeight: '600', fontSize: '0.9rem'}}>{app.jobTitle}</div>
                          <div style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>{app.company}</div>
                        </div>
                        <span style={{padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', background: statusStyle.bg, color: statusStyle.color}}>
                          {app.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Row - each clickable, opens popup */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
        <StatCard title="Total Applications" value={getStatusCount('ALL')} icon={<FileText />} color="59, 130, 246" onClick={() => setPopupStatus('ALL')} />
        <StatCard title="Accepted" value={getStatusCount('ACCEPTED')} icon={<CheckCircle />} color="16, 185, 129" onClick={() => setPopupStatus('ACCEPTED')} />
        <StatCard title="Pending" value={getStatusCount('APPLIED')} icon={<Clock />} color="245, 158, 11" onClick={() => setPopupStatus('APPLIED')} />
        <StatCard title="Rejected" value={getStatusCount('REJECTED')} icon={<XCircle />} color="239, 68, 68" onClick={() => setPopupStatus('REJECTED')} />
      </div>

      {/* Two always-visible sections side by side */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>

        {/* My Applications */}
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3>My Applications</h3>
            <button className="btn btn-secondary" style={{padding: '0.3rem 0.8rem', fontSize: '0.8rem'}} onClick={fetchMyApplications}>Refresh</button>
          </div>
          <div style={{display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap'}}>
            {['ALL', 'APPLIED', 'ACCEPTED', 'REJECTED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  background: statusFilter === s ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                  color: statusFilter === s ? 'white' : 'var(--text-muted)'
                }}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="glass-panel" style={{padding: '1rem', minHeight: '200px'}}>
            {loadingApps ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>Loading...</p>
            ) : filteredApplications.length === 0 ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>
                {statusFilter === 'ALL' ? 'No applications yet.' : `No ${statusFilter.toLowerCase()} applications.`}
              </p>
            ) : (
              <div style={{display: 'grid', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto'}}>
                {filteredApplications.map((app, idx) => {
                  const statusStyle = getStatusColor(app.status);
                  return (
                    <div key={idx} style={{
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{minWidth: 0}}>
                        <div style={{fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{app.jobTitle}</div>
                        <div style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>{app.company}</div>
                      </div>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {appTotalPages > 1 && (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem'}}>
              <button
                className="btn btn-secondary"
                style={{padding: '0.25rem 0.6rem', fontSize: '0.75rem'}}
                disabled={appPage === 0}
                onClick={() => fetchMyApplications(appPage - 1)}
              >Prev</button>
              <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Page {appPage + 1} of {appTotalPages}</span>
              <button
                className="btn btn-secondary"
                style={{padding: '0.25rem 0.6rem', fontSize: '0.75rem'}}
                disabled={appPage >= appTotalPages - 1}
                onClick={() => fetchMyApplications(appPage + 1)}
              >Next</button>
            </div>
          )}
        </div>

        {/* Find Jobs */}
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <h3>Find Jobs</h3>
            <button className="btn btn-secondary" style={{padding: '0.3rem 0.8rem', fontSize: '0.8rem'}} onClick={fetchBrowseJobs}>Refresh</button>
          </div>
          <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.75rem'}}>
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchBrowseJobs(); }}
              style={{flex: 1, padding: '0.5rem 1rem', borderRadius: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.85rem'}}
            />
            <button className="btn btn-primary" style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}} onClick={fetchBrowseJobs}>Search</button>
          </div>
          <div className="glass-panel" style={{padding: '1rem', minHeight: '200px'}}>
            {loadingJobs ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>Loading...</p>
            ) : jobs.length === 0 ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>No jobs found.</p>
            ) : (
              <div style={{display: 'grid', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto'}}>
                {jobs.map(job => {
                  const jobTypeColor = job.jobType === 'REMOTE' ? '#10b981' : job.jobType === 'HYBRID' ? '#7c3aed' : job.jobType === 'ONSITE' ? '#3b82f6' : '#f59e0b';
                  return (
                  <div key={job.id} style={{
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{minWidth: 0}}>
                      <div style={{fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{job.title}</div>
                      <div style={{color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center'}}>
                        <span>{job.company}</span>
                        <span>·</span>
                        <span>{job.location}</span>
                        {job.jobType && (
                          <span style={{background: `${jobTypeColor}20`, color: jobTypeColor, padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: '600'}}>{job.jobType}</span>
                        )}
                        <span style={{color: '#10b981'}}>${job.salary?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '0.25rem', flexShrink: 0}}>
                      <button
                        className="btn btn-secondary"
                        style={{padding: '0.25rem 0.5rem', fontSize: '0.7rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.2rem'}}
                        onClick={() => handleViewDetails(job)}
                      >
                        <Eye size={12} /> Details
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{padding: '0.25rem 0.5rem', fontSize: '0.7rem', whiteSpace: 'nowrap'}}
                        disabled={appliedJobs.has(job.id)}
                        onClick={() => handleApply(job)}
                      >
                        {appliedJobs.has(job.id) ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const EmployerView = ({ data }) => {
  const [activeTab, setActiveTab] = useState(null); // 'myjobs' | 'myapplicants'
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [appFilter, setAppFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'REJECTED'
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [appPage, setAppPage] = useState(0);
  const [appTotalPages, setAppTotalPages] = useState(0);
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
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchMyApplications = async (page = 0) => {
    setLoadingList(true);
    try {
      const res = await api.get(`/applications/my-applicants?page=${page}&size=${APP_PAGE_SIZE}`);
      setApplications(res.data.content || []);
      setAppTotalPages(res.data.totalPages || 0);
      setAppPage(page);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleCardClick = (tab) => {
    console.log('Card clicked, tab:', tab, 'current activeTab:', activeTab);
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
      console.error('Failed to update application', err);
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
      console.error('Failed to remove application', err);
      toast.error('Failed to remove application');
    }
  };

  const downloadResume = async (appId) => {
    try {
      const res = await api.get(`/applications/${appId}/resume`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume_${appId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download resume', err);
      toast.error('Failed to download resume');
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
      console.error('Failed to delete job', err);
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
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
        <StatCard title="Active Job Postings" value={data.totalJobsPosted} icon={<Briefcase />} color="124, 58, 237" onClick={() => handleCardClick('myjobs')} active={activeTab === 'myjobs'} />
        <StatCard title="Total Applicants" value={data.totalApplicationsReceived} icon={<Users />} color="59, 130, 246" onClick={() => handleCardClick('myapplicants')} active={activeTab === 'myapplicants'} />
      </div>

      {activeTab === 'myjobs' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3>Your Job Postings</h3>
            <button className="btn btn-primary" onClick={() => setShowPostJobModal(true)}>+ Post New Job</button>
          </div>
          <div className="glass-panel" style={{padding: '1.5rem'}}>
            {loadingList ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>Loading...</p>
            ) : jobs.length === 0 ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No job postings yet.</p>
            ) : (
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left'}}>
                    <th style={{padding: '0.75rem 0.5rem'}}>Title</th>
                    <th style={{padding: '0.75rem 0.5rem'}}>Company</th>
                    <th style={{padding: '0.75rem 0.5rem'}}>Location</th>
                    <th style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>Salary</th>
                    <th style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding: '0.75rem 0.5rem'}}>{job.title}</td>
                      <td style={{padding: '0.75rem 0.5rem', color: 'var(--text-muted)'}}>{job.company}</td>
                      <td style={{padding: '0.75rem 0.5rem', color: 'var(--text-muted)'}}>{job.location}</td>
                      <td style={{padding: '0.75rem 0.5rem', textAlign: 'right', color: '#10b981'}}>${job.salary?.toLocaleString()}</td>
                      <td style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>
                        <button
                          className="btn btn-secondary"
                          style={{padding: '0.25rem 0.5rem', marginRight: '0.25rem'}}
                          onClick={() => handleEditJob(job)}
                          title="Edit job"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{padding: '0.25rem 0.5rem', color: '#ef4444'}}
                          onClick={() => handleDeleteJob(job)}
                          title="Delete job"
                        >
                          <Trash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'myapplicants' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3>Applicants for Your Jobs</h3>
            <div style={{display: 'flex', gap: '0.4rem'}}>
              {['ALL', 'ACTIVE', 'REJECTED'].map(f => (
                <button
                  key={f}
                  onClick={() => setAppFilter(f)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    background: appFilter === f ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    color: appFilter === f ? 'white' : 'var(--text-muted)'
                  }}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="glass-panel" style={{padding: '1.5rem'}}>
            {loadingList ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>Loading...</p>
            ) : filteredByJob.length === 0 ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No applicants found.</p>
            ) : (
              filteredByJob.map(group => (
                <div key={group.jobId} style={{marginBottom: '1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                    <h4 style={{margin: 0, fontSize: '0.95rem'}}>{group.jobTitle}</h4>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.5rem', borderRadius: '1rem'}}>
                      {group.applications.length} applicant{group.applications.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                    <thead>
                      <tr style={{borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left'}}>
                        <th style={{padding: '0.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500'}}>Candidate</th>
                        <th style={{padding: '0.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500'}}>Email</th>
                        <th style={{padding: '0.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500'}}>Applied</th>
                        <th style={{padding: '0.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500'}}>Status</th>
                        <th style={{padding: '0.5rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.applications.map(app => {
                        const statusStyle = getStatusStyle(app.status);
                        const isLoading = actionLoading[app.id];
                        return (
                          <tr key={app.id} style={{borderBottom: '1px solid rgba(255,255,255,0.04)'}}>
                            <td style={{padding: '0.6rem 0.5rem', fontWeight: '500'}}>{app.candidateName}</td>
                            <td style={{padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem'}}>{app.candidateEmail}</td>
                            <td style={{padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem'}}>{new Date(app.appliedAt).toLocaleDateString()}</td>
                            <td style={{padding: '0.6rem 0.5rem'}}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                background: statusStyle.bg,
                                color: statusStyle.color
                              }}>
                                {app.status}
                              </span>
                            </td>
                            <td style={{padding: '0.6rem 0.5rem', textAlign: 'right'}}>
                              <div style={{display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                                {app.status === 'APPLIED' && (
                                  <button className="btn btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem'}} disabled={!!isLoading} onClick={() => updateStatus(app.id, 'review')}>
                                    {isLoading === 'review' ? '...' : 'Review'}
                                  </button>
                                )}
                                {app.status === 'REVIEWED' && (
                                  <button className="btn btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem'}} disabled={!!isLoading} onClick={() => updateStatus(app.id, 'interview')}>
                                    {isLoading === 'interview' ? '...' : 'Interview'}
                                  </button>
                                )}
                                {app.status === 'INTERVIEWING' && (
                                  <button className="btn" style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: 'none'}} disabled={!!isLoading} onClick={() => updateStatus(app.id, 'accept')}>
                                    {isLoading === 'accept' ? '...' : 'Accept'}
                                  </button>
                                )}
                                {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                                  <button className="btn" style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none'}} disabled={!!isLoading} onClick={() => updateStatus(app.id, 'reject')}>
                                    {isLoading === 'reject' ? '...' : 'Reject'}
                                  </button>
                                )}
                                <button className="btn btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem'}} disabled={!!isLoading} onClick={() => downloadResume(app.id)}>
                                  Resume
                                </button>
                                <button className="btn" style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'rgba(100,100,100,0.2)', color: '#9ca3af', border: 'none'}} onClick={() => removeApplication(app.id)}>
                                    Remove
                                  </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
          {appTotalPages > 1 && (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem'}}>
              <button
                className="btn btn-secondary"
                style={{padding: '0.25rem 0.6rem', fontSize: '0.75rem'}}
                disabled={appPage === 0}
                onClick={() => fetchMyApplications(appPage - 1)}
              >Prev</button>
              <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Page {appPage + 1} of {appTotalPages}</span>
              <button
                className="btn btn-secondary"
                style={{padding: '0.25rem 0.6rem', fontSize: '0.75rem'}}
                disabled={appPage >= appTotalPages - 1}
                onClick={() => fetchMyApplications(appPage + 1)}
              >Next</button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

const AdminView = ({ data }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminAppActionLoading, setAdminAppActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState(null); // 'users' | 'jobs' | 'applications'
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [adminAppFilter, setAdminAppFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'REJECTED'

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
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchJobs = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/jobs');
      setJobs(res.data.content || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/applications');
      setApplications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoadingList(false);
    }
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
    if (!window.confirm('Remove this application? This cannot be undone.')) return;
    try {
      await api.delete(`/applications/${appId}`);
      fetchApplications();
    } catch (err) {
      console.error('Failed to remove application', err);
      toast.error('Failed to remove application');
    }
  };

  const updateAdminAppStatus = async (appId, action) => {
    setAdminAppActionLoading(prev => ({ ...prev, [appId]: action }));
    try {
      await api.put(`/applications/${appId}/${action}`);
      fetchApplications();
    } catch (err) {
      console.error('Failed to update application', err);
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
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume_${appId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download resume', err);
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
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
        <StatCard title="Total Users" value={data.totalUsers} icon={<Users />} color="59, 130, 246" onClick={() => handleCardClick('users')} active={activeTab === 'users'} />
        <StatCard title="Total Jobs" value={data.totalJobs} icon={<Briefcase />} color="124, 58, 237" onClick={() => handleCardClick('jobs')} active={activeTab === 'jobs'} />
        <StatCard title="Total Applications" value={data.totalApplications} icon={<FileText />} color="16, 185, 129" onClick={() => handleCardClick('applications')} active={activeTab === 'applications'} />
      </div>

      {activeTab === 'users' && (
        <div>
          <h3 style={{marginBottom: '1rem'}}>User Management</h3>
          <div className="glass-panel" style={{padding: '1.5rem'}}>
            {loadingUsers ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>Loading users...</p>
            ) : (
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left'}}>
                    <th style={{padding: '0.75rem 0.5rem'}}>Username</th>
                    <th style={{padding: '0.75rem 0.5rem'}}>Email</th>
                    <th style={{padding: '0.75rem 0.5rem'}}>Role</th>
                    <th style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding: '0.75rem 0.5rem'}}>{user.username}</td>
                      <td style={{padding: '0.75rem 0.5rem', color: 'var(--text-muted)'}}>{user.email}</td>
                      <td style={{padding: '0.75rem 0.5rem'}}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: user.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : user.role === 'EMPLOYER' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: user.role === 'ADMIN' ? '#ef4444' : user.role === 'EMPLOYER' ? '#7c3aed' : '#10b981'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>
                        {user.role === 'CANDIDATE' && (
                          <button
                            className="btn btn-primary"
                            style={{padding: '0.4rem 0.75rem', fontSize: '0.8rem'}}
                            onClick={() => promoteUser(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? 'Promoting...' : 'Promote to Employer'}
                          </button>
                        )}
                        {user.role === 'EMPLOYER' && (
                          <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>—</span>
                        )}
                        {user.role === 'ADMIN' && (
                          <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div>
          <h3 style={{marginBottom: '1rem'}}>All Jobs</h3>
          <div className="glass-panel" style={{padding: '1.5rem'}}>
            {loadingList ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No jobs found.</p>
            ) : (
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left'}}>
                    <th style={{padding: '0.75rem 0.5rem'}}>Title</th>
                    <th style={{padding: '0.75rem 0.5rem'}}>Company</th>
                    <th style={{padding: '0.75rem 0.5rem'}}>Location</th>
                    <th style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding: '0.75rem 0.5rem'}}>{job.title}</td>
                      <td style={{padding: '0.75rem 0.5rem', color: 'var(--text-muted)'}}>{job.company}</td>
                      <td style={{padding: '0.75rem 0.5rem', color: 'var(--text-muted)'}}>{job.location}</td>
                      <td style={{padding: '0.75rem 0.5rem', textAlign: 'right', color: '#10b981'}}>${job.salary?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div>
          <h3 style={{marginBottom: '1rem'}}>All Applications</h3>
          <div className="glass-panel" style={{padding: '1.5rem'}}>
            {loadingList ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>Loading applications...</p>
            ) : applications.length === 0 ? (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No applications found.</p>
            ) : (
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left'}}>
                    <th style={{padding: '0.75rem 0.5rem'}}>Applicant</th>
                    <th style={{padding: '0.75rem 0.5rem'}}>Job</th>
                    <th style={{padding: '0.75rem 0.5rem'}}>Status</th>
                    <th style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => {
                    const statusStyle = getAdminStatusStyle(app.status);
                    const isLoading = adminAppActionLoading[app.id];
                    return (
                      <tr key={app.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                        <td style={{padding: '0.75rem 0.5rem'}}>{app.candidateName}</td>
                        <td style={{padding: '0.75rem 0.5rem', color: 'var(--text-muted)'}}>{app.jobTitle}</td>
                        <td style={{padding: '0.75rem 0.5rem'}}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            background: statusStyle.bg,
                            color: statusStyle.color
                          }}>
                            {app.status}
                          </span>
                        </td>
                        <td style={{padding: '0.75rem 0.5rem', textAlign: 'right'}}>
                          <div style={{display: 'flex', gap: '0.3rem', justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                            {app.status !== 'INTERVIEWING' && (
                              <button
                                className="btn btn-secondary"
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.7rem'}}
                                disabled={!!isLoading}
                                onClick={() => updateAdminAppStatus(app.id, 'interview')}
                              >
                                {isLoading === 'interview' ? '...' : 'Interview'}
                              </button>
                            )}
                            {app.status !== 'REVIEWED' && (
                              <button
                                className="btn btn-secondary"
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.7rem'}}
                                disabled={!!isLoading}
                                onClick={() => updateAdminAppStatus(app.id, 'review')}
                              >
                                {isLoading === 'review' ? '...' : 'Review'}
                              </button>
                            )}
                            {app.status !== 'ACCEPTED' && (
                              <button
                                className="btn"
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: 'none'}}
                                disabled={!!isLoading}
                                onClick={() => updateAdminAppStatus(app.id, 'accept')}
                              >
                                {isLoading === 'accept' ? '...' : 'Accept'}
                              </button>
                            )}
                            {app.status !== 'REJECTED' && (
                              <button
                                className="btn"
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none'}}
                                disabled={!!isLoading}
                                onClick={() => updateAdminAppStatus(app.id, 'reject')}
                              >
                                {isLoading === 'reject' ? '...' : 'Reject'}
                              </button>
                            )}
                            <button
                              className="btn btn-secondary"
                              style={{padding: '0.25rem 0.5rem', fontSize: '0.7rem'}}
                              disabled={!!isLoading}
                              onClick={() => downloadAdminResume(app.id)}
                            >
                              Download
                            </button>
                            <button
                                className="btn"
                                style={{padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'rgba(100,100,100,0.2)', color: '#9ca3af', border: 'none'}}
                                disabled={!!isLoading}
                                onClick={() => deleteAdminApplication(app.id)}
                              >
                                Remove
                              </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
