import React, { useState } from 'react';
import { CivicReport, Comment } from '../types';

interface MyReportsProps {
  reports: CivicReport[];
  userId: string;
  onBack: () => void;
  onReportClick?: (report: CivicReport) => void;
  onUpvote?: (reportId: string) => void;
  onAddComment?: (reportId: string, text: string) => void;
  currentUserId?: string;
}

export const MyReports: React.FC<MyReportsProps> = ({ 
  reports, 
  userId, 
  onBack, 
  onReportClick,
  onUpvote,
  onAddComment,
  currentUserId 
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const myReports = reports
    .filter(r => r.userId === userId)
    .filter(r => filter === 'ALL' || r.status === filter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const stats = {
    total: reports.filter(r => r.userId === userId).length,
    resolved: reports.filter(r => r.userId === userId && r.status === 'RESOLVED').length,
    inProgress: reports.filter(r => r.userId === userId && r.status === 'IN_PROGRESS').length,
    submitted: reports.filter(r => r.userId === userId && r.status === 'SUBMITTED').length,
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return { color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400', label: 'Submitted', icon: '📤' };
      case 'IN_PROGRESS': return { color: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-600 dark:text-amber-400', label: 'In Progress', icon: '⏳' };
      case 'RESOLVED': return { color: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-600 dark:text-emerald-400', label: 'Resolved', icon: '✅' };
      case 'REJECTED': return { color: 'bg-red-500', lightBg: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-600 dark:text-red-400', label: 'Rejected', icon: '❌' };
      default: return { color: 'bg-gray-400', lightBg: 'bg-gray-50', textColor: 'text-gray-600', label: status, icon: '📋' };
    }
  };

  const handleAddComment = (reportId: string) => {
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(reportId, commentText);
    setCommentText('');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* Premium Header */}
      <header className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl -translate-x-5 translate-y-5"></div>
        </div>
        
        <div className="relative z-10 px-5 pt-5 pb-6">
          {/* Top Bar */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={onBack} 
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-xl text-white">My Reports</h1>
              <p className="text-sm text-white/70">{stats.total} total submissions</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pending', value: stats.submitted, icon: '📤', color: 'from-blue-400/20 to-blue-500/20' },
              { label: 'Active', value: stats.inProgress, icon: '⚡', color: 'from-amber-400/20 to-amber-500/20' },
              { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'from-emerald-400/20 to-emerald-500/20' },
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-3 border border-white/10`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-white/70 text-xs font-medium">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Filter Chips */}
      <div className="px-5 py-4 flex gap-2 overflow-x-auto no-scrollbar bg-white dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-20">
        {(['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED'] as const).map((status) => {
          const isActive = filter === status;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'ALL' && '📊'}
              {status === 'SUBMITTED' && '📤'}
              {status === 'IN_PROGRESS' && '⏳'}
              {status === 'RESOLVED' && '✅'}
              <span>{status === 'ALL' ? 'All' : status.replace('_', ' ')}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-600'
              }`}>
                {status === 'ALL' ? stats.total : status === 'SUBMITTED' ? stats.submitted : status === 'IN_PROGRESS' ? stats.inProgress : stats.resolved}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
        {myReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">No Reports Found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {filter === 'ALL' 
                ? "You haven't submitted any reports yet. Start by reporting an issue in your area!" 
                : `No ${filter.toLowerCase().replace('_', ' ')} reports to show.`}
            </p>
          </div>
        ) : (
          myReports.map((report, idx) => {
            const statusConfig = getStatusConfig(report.status);
            const isExpanded = expandedReport === report.id;
            
            return (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Main Card Content */}
                <div className="p-4">
                  <div className="flex gap-4">
                    {/* Status Indicator */}
                    <div className={`w-1 self-stretch rounded-full ${statusConfig.color}`} />
                    
                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-700">
                      {report.images && report.images.length > 0 ? (
                        <img src={report.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl opacity-50">🏙️</span>
                        </div>
                      )}
                      {report.images && report.images.length > 1 && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white font-medium">
                          +{report.images.length - 1}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {report.analysis?.category || 'Issue Reported'}
                        </h3>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusConfig.lightBg} mb-2`}>
                        <span className="text-sm">{statusConfig.icon}</span>
                        <span className={`text-xs font-semibold ${statusConfig.textColor}`}>{statusConfig.label}</span>
                      </div>

                      {/* Location */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mb-2">
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {report.address || 'Udaipur'}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] text-gray-400">
                          {new Date(report.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onUpvote?.(report.id); }}
                            className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1 transition-colors"
                          >
                            👍 {report.upvotes || 0}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedReport(isExpanded ? null : report.id); }}
                            className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1 transition-colors"
                          >
                            💬 {report.comments?.length || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Section - Comments */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-slate-700">
                    {/* Comments List */}
                    <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                      {report.comments && report.comments.length > 0 ? (
                        report.comments.map((comment: Comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm">👤</span>
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-900 dark:text-white">{comment.userName}</span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(comment.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{comment.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-sm text-gray-400 py-4">No comments yet</p>
                      )}
                    </div>
                    
                    {/* Add Comment */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(report.id)}
                        />
                        <button
                          onClick={() => handleAddComment(report.id)}
                          disabled={!commentText.trim()}
                          className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-500 transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};
