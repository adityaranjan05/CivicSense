import React, { useState, useMemo } from 'react';
import { useCivic } from '../context/CivicContext';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS, CATEGORIES, URGENCIES, STATUSES } from '../data/mockIssues';
import InteractiveMap from './InteractiveMap';
import AdminManageDrawer from './AdminManageDrawer';
import {
  Kanban,
  Table as TableIcon,
  Map as MapIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Download,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  Users,
  Briefcase,
  Flame,
  CheckSquare,
  ShieldCheck,
  AlertCircle,
  Mail,
  MailCheck,
  Send,
  Loader2
} from 'lucide-react';

export default function AdminDashboard() {
  const {
    issues,
    updateIssueStatus,
    assignDepartment,
    setSelectedIssue,
    selectedForManage,
    setSelectedForManage,
    addToast,
    departments,
    statuses,
    categories,
    urgencies,
    forwardIssueEmail
  } = useCivic();

  const { profile, openLogin, loginAsDemo } = useAuth();

  const [adminView, setAdminView] = useState('kanban'); // 'kanban' | 'table' | 'map'
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatchingId, setDispatchingId] = useState(null);

  const handleManualDispatch = async (e, issue) => {
    e.stopPropagation();
    setDispatchingId(issue.id);
    await forwardIssueEmail(issue.id);
    setDispatchingId(null);
  };

  // Auth Guard — strictly restrict to verified municipal officials
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center border border-rose-200 dark:border-rose-800">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Access Restricted: Municipal Officials Only
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            The Admin Operations Console is restricted to authorized BBMP municipal engineers, department heads, and dispatch officers.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <button
            onClick={() => setActiveTab('home')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Back to Citizen Portal
          </button>
          <button
            onClick={openLogin}
            className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-xs cursor-pointer"
          >
            Sign In with Official Account
          </button>
        </div>
      </div>
    );
  }

  // Key Metrics
  const totalIssues = issues.length;
  const activeIssues = issues.filter((i) => i.status !== 'Resolved').length;
  const resolvedIssues = issues.filter((i) => i.status === 'Resolved').length;
  const emergencyIssues = issues.filter((i) => (i.urgency === 'Emergency' || i.urgency === 'High') && i.status !== 'Resolved');

  // Filtered Issues for Kanban / Table
  const displayedIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedDeptFilter !== 'All' && issue.department !== selectedDeptFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(q);
        const matchesTicket = issue.ticketId.toLowerCase().includes(q);
        const matchesAddress = (issue.location.address || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesTicket && !matchesAddress) return false;
      }
      return true;
    });
  }, [issues, selectedDeptFilter, searchQuery]);

  // Export Table Data to CSV
  const handleExportCsv = () => {
    const headers = ['Ticket ID', 'Title', 'Category', 'Urgency', 'Status', 'Department', 'Address', 'Reported Date'];
    const rows = displayedIssues.map((i) => [
      i.ticketId,
      `"${i.title.replace(/"/g, '""')}"`,
      i.category,
      i.urgency,
      i.status,
      `"${i.department}"`,
      `"${i.location.address}"`,
      i.reportedAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `civicfix_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Work orders exported to CSV file.', 'info');
  };

  // Department Workload counts
  const deptWorkload = useMemo(() => {
    return (departments || []).map((dept) => {
      const deptIssues = issues.filter((i) => i.department === dept);
      const active = deptIssues.filter((i) => i.status !== 'Resolved').length;
      return {
        department: dept,
        total: deptIssues.length,
        active
      };
    });
  }, [issues]);

  return (
    <div className="space-y-5">
      {/* Admin Header & Stat Cards */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold mb-1">
              <Briefcase className="w-3 h-3" />
              <span>Ward Public Works Command Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Municipal Operations & Dispatch Board
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage incoming citizen grievances, assign maintenance crews, update ETAs, and audit resolution proofs.
            </p>

            {profile?.role === 'admin' ? (
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-300">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Active Officer: <strong>{profile.fullName}</strong>
                  {profile.department && ` • ${profile.department}`}
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Viewing console in preview mode. Sign in as a Municipal Official to link admin operations to your account.</span>
                </div>
                <button
                  type="button"
                  onClick={openLogin}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  Sign In as Official
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 rounded-xl p-3.5 transition-colors">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Tickets Logged</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{totalIssues}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 rounded-xl p-3.5 transition-colors">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Work Orders</div>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{activeIssues}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 rounded-xl p-3.5 transition-colors">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Resolved Complaints</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{resolvedIssues}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 rounded-xl p-3.5 transition-colors">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Critical Emergencies</div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{emergencyIssues.length}</div>
          </div>
        </div>
      </div>

      {/* Emergency Alerts Banner (if any unresolved emergency issues exist) */}
      {emergencyIssues.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 text-xs transition-colors">
          <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200 mb-2">
            <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>High Priority / Emergency Incidents Requiring Dispatch ({emergencyIssues.length})</span>
          </div>
          <div className="space-y-2">
            {emergencyIssues.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{item.ticketId}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</span>
                  <span className="text-slate-400 dark:text-slate-500 truncate hidden sm:inline">({item.location.address})</span>
                </div>
                <button
                  onClick={() => setSelectedForManage(item)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors"
                >
                  Dispatch Crew →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Workload Summary Box */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2.5 transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
          Department Workload Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs">
          {deptWorkload.map((dept) => (
            <div
              key={dept.department}
              onClick={() => setSelectedDeptFilter(dept.department === selectedDeptFilter ? 'All' : dept.department)}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                selectedDeptFilter === dept.department
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="truncate text-[11px] font-semibold" title={dept.department}>
                {dept.department.replace('Department of ', '').replace('Bureau of ', '')}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Active Queue:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{dept.active}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and View Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[210px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket, title, or address..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          >
            <option value="All">All Departments</option>
            {(departments || []).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* View Switcher: Kanban | Table | Map */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={() => setAdminView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
              adminView === 'kanban'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setAdminView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
              adminView === 'table'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setAdminView('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
              adminView === 'map'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {adminView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {(statuses || []).map((statusCol) => {
            const colIssues = displayedIssues.filter((i) => i.status === statusCol);

            return (
              <div
                key={statusCol}
                className="bg-slate-100/80 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col min-h-[520px] transition-colors"
              >
                {/* Column Header */}
                <div className="pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{statusCol}</span>
                  <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {colIssues.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 overflow-y-auto flex-1">
                  {colIssues.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-[11px] italic">
                      No issues in {statusCol}
                    </div>
                  ) : (
                    colIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-sm space-y-2 text-xs transition-all"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {issue.ticketId}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                              issue.urgency === 'Emergency'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : issue.urgency === 'High'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {issue.urgency}
                          </span>
                        </div>

                        <div
                          onClick={() => setSelectedIssue(issue)}
                          className="font-bold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 leading-snug"
                        >
                          {issue.title}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          📍 {issue.location.address || issue.location.neighborhood}
                        </div>

                        {/* Dispatch Status & Manual Forward Action */}
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                              issue.dispatchStatus === 'Failed'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : issue.dispatchStatus === 'Dispatched'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                            title={
                              issue.dispatchStatus === 'Dispatched'
                                ? `Dispatched to: ${issue.dispatchedTo || 'BBMP Department Desk'}`
                                : 'Awaiting admin verification before dispatching email'
                            }
                          >
                            {issue.dispatchStatus === 'Dispatched' ? (
                              <MailCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                            )}
                            <span className="truncate max-w-[125px]">
                              {issue.dispatchStatus === 'Failed'
                                ? 'Dispatch Failed'
                                : issue.dispatchStatus === 'Dispatched'
                                ? `Dispatched to ${issue.dispatchDepartment?.replace('Department of ', '') || 'Dept'}`
                                : 'Needs Verification'}
                            </span>
                          </span>

                          <button
                            type="button"
                            disabled={dispatchingId === issue.id}
                            onClick={(e) => handleManualDispatch(e, issue)}
                            title={issue.dispatchStatus === 'Dispatched' ? 'Re-dispatch Notice via Email' : 'Verify & Dispatch via Email'}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          >
                            {dispatchingId === issue.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 dark:text-slate-500 truncate max-w-[100px]">
                            {issue.department.replace('Department of ', '')}
                          </span>
                          <button
                            onClick={() => setSelectedForManage(issue)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1 rounded-md text-[11px] transition-colors"
                          >
                            Manage →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: DATA TABLE */}
      {adminView === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-x-auto transition-colors">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3.5">Ticket ID</th>
                <th className="p-3.5">Title & Address</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Urgency</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Email Dispatch</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {displayedIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No matching complaints found.
                  </td>
                </tr>
              ) : (
                displayedIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {issue.ticketId}
                    </td>
                    <td className="p-3.5">
                      <div
                        onClick={() => setSelectedIssue(issue)}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      >
                        {issue.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {issue.location.address}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{issue.category}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                          issue.urgency === 'Emergency'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : issue.urgency === 'High'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {issue.urgency}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={issue.department}
                        onChange={(e) => assignDepartment(issue.id, e.target.value)}
                        className="border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium cursor-pointer max-w-[180px] truncate focus:ring-2 focus:ring-blue-500/30"
                        title="Reassign Department"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            issue.dispatchStatus === 'Failed'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : issue.dispatchStatus === 'Pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          <MailCheck className="w-3 h-3" />
                          <span>{issue.dispatchStatus === 'Failed' ? 'Failed' : issue.dispatchStatus === 'Pending' ? 'Pending' : 'Dispatched'}</span>
                        </span>
                        {issue.dispatchedTo && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[130px] truncate" title={issue.dispatchedTo}>
                            {issue.dispatchedTo.split(',')[0]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={issue.status}
                        onChange={(e) => updateIssueStatus(issue.id, e.target.value, `Status updated from table view to ${e.target.value}`)}
                        className="border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                      >
                        {(statuses || []).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={dispatchingId === issue.id}
                        onClick={(e) => handleManualDispatch(e, issue)}
                        title={issue.dispatchStatus === 'Dispatched' ? 'Re-dispatch Notice via Email' : 'Verify & Dispatch via Email'}
                        className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white font-medium px-2 py-1 border border-indigo-200 dark:border-indigo-800 rounded-md bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 cursor-pointer disabled:opacity-50"
                      >
                        {dispatchingId === issue.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span className="text-[11px]">{issue.dispatchStatus === 'Dispatched' ? 'Re-dispatch' : 'Verify & Dispatch'}</span>
                      </button>
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-2.5 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setSelectedForManage(issue)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1 rounded-md"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: MAP VIEW */}
      {adminView === 'map' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden h-[600px] transition-colors">
          <InteractiveMap
            issues={displayedIssues}
            mode="explorer"
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            height="100%"
          />
        </div>
      )}

      {/* Admin Manage Issue Drawer / Modal */}
      {selectedForManage && (
        <AdminManageDrawer
          issue={selectedForManage}
          onClose={() => setSelectedForManage(null)}
        />
      )}
    </div>
  );
}
