import React, { useState, useMemo } from 'react';
import { useCivic } from '../context/CivicContext';
import { useAuth } from '../context/AuthContext';
import InteractiveMap from './InteractiveMap';
import {
  Search,
  ThumbsUp,
  MapPin,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  LayoutGrid,
  Map as MapIcon,
  Columns,
  Filter,
  Building,
  RotateCcw,
  ShieldCheck,
  Flame,
  Activity,
  Layers,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  CheckCircle2,
  Calendar,
  MailCheck,
  Mail,
  AlertCircle
} from 'lucide-react';

export default function CitizenFeed() {
  const {
    issues,
    filter,
    setFilter,
    setSelectedIssue,
    upvoteIssue,
    setIsReportModalOpen,
    categories,
    urgencies,
    statuses,
    addToast
  } = useCivic();

  const { user, openLogin } = useAuth();

  const handleOpenReport = () => {
    if (!user) {
      addToast('Please sign in or create an account to report a grievance.', 'info');
      openLogin();
      return;
    }
    setIsReportModalOpen(true);
  };

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map' | 'split'
  const [activeChip, setActiveChip] = useState('all');

  // Filter and sort issues based on user selection
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Guard against invalid or blank issues
      if (!issue || !issue.id || !issue.title || !issue.ticketId) {
        return false;
      }

      // 1. Text Search
      if (filter.search.trim()) {
        const query = filter.search.toLowerCase();
        const matchesTitle = (issue.title || '').toLowerCase().includes(query);
        const matchesDesc = (issue.description || '').toLowerCase().includes(query);
        const matchesTicket = (issue.ticketId || '').toLowerCase().includes(query);
        const matchesLoc = (
          (issue.location?.address || '') +
          ' ' +
          (issue.location?.neighborhood || '')
        )
          .toLowerCase()
          .includes(query);

        if (!matchesTitle && !matchesDesc && !matchesTicket && !matchesLoc) {
          return false;
        }
      }

      // 2. Category Filter
      if (filter.category !== 'All' && issue.category !== filter.category) {
        return false;
      }

      // 3. Urgency Filter
      if (filter.urgency !== 'All' && issue.urgency !== filter.urgency) {
        return false;
      }

      // 4. Status Filter
      if (filter.status !== 'All' && issue.status !== filter.status) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filter.sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      if (filter.sortBy === 'newest') {
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      }
      if (filter.sortBy === 'urgency') {
        const priorityOrder = { Emergency: 4, High: 3, Medium: 2, Low: 1 };
        return (priorityOrder[b.urgency] || 0) - (priorityOrder[a.urgency] || 0);
      }
      return 0;
    });
  }, [issues, filter]);

  // Aggregate summary counts
  const totalReports = issues.length;
  const activeReports = issues.filter((i) => i.status !== 'Resolved').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const emergencyCount = issues.filter(
    (i) => (i.urgency === 'Emergency' || i.urgency === 'High') && i.status !== 'Resolved'
  ).length;

  const resolutionRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const hasActiveFilters =
    filter.category !== 'All' ||
    filter.urgency !== 'All' ||
    filter.status !== 'All' ||
    Boolean(filter.search.trim()) ||
    activeChip !== 'all';

  const resetFilters = () => {
    setActiveChip('all');
    setFilter({
      search: '',
      category: 'All',
      urgency: 'All',
      status: 'All',
      sortBy: 'upvotes',
      radiusKm: 15
    });
  };

  // Quick Filter Chip Click Handler
  const handleChipClick = (chipKey) => {
    setActiveChip(chipKey);
    switch (chipKey) {
      case 'emergency':
        setFilter({ ...filter, urgency: 'Emergency', category: 'All', status: 'All' });
        break;
      case 'in_progress':
        setFilter({ ...filter, status: 'In Progress', urgency: 'All', category: 'All' });
        break;
      case 'resolved':
        setFilter({ ...filter, status: 'Resolved', urgency: 'All', category: 'All' });
        break;
      case 'roads':
        setFilter({ ...filter, category: 'Roads & Footpaths', urgency: 'All', status: 'All' });
        break;
      case 'waste':
        setFilter({ ...filter, category: 'Solid Waste Management', urgency: 'All', status: 'All' });
        break;
      case 'electricity':
        setFilter({ ...filter, category: 'Streetlighting & Electricity', urgency: 'All', status: 'All' });
        break;
      case 'water':
        setFilter({ ...filter, category: 'Water Supply & Sewage', urgency: 'All', status: 'All' });
        break;
      case 'all':
      default:
        resetFilters();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Modern Civic Portal Hero & Metrics Overview */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-xs backdrop-blur-md transition-colors">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Government of Karnataka • BBMP Public Works & Redressal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Community Grievance & Ward Public Works
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Direct municipal reporting for potholes, garbage hazards, broken streetlights, or drainage overflow across all Bengaluru wards. Endorse existing complaints to accelerate engineer dispatch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleOpenReport}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-sm shadow-emerald-950/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Grievance</span>
            </button>
          </div>
        </div>

        {/* Interactive Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/60">
          {/* Card 1: Total */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-4 transition-all hover:border-blue-300 dark:hover:border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Complaints</span>
              <span className="p-1.5 rounded-lg bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              {totalReports}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Across 8 BBMP zones</span>
            </div>
          </div>

          {/* Card 2: Active */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-4 transition-all hover:border-amber-300 dark:hover:border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">In Progress Queue</span>
              <span className="p-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                <Activity className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
              {activeReports}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Awaiting engineer fix</span>
            </div>
          </div>

          {/* Card 3: Resolved */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-4 transition-all hover:border-emerald-300 dark:hover:border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified Resolved</span>
              <span className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
              {resolvedCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>{resolutionRate}% resolution rate</span>
            </div>
          </div>

          {/* Card 4: Critical */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-4 transition-all hover:border-rose-300 dark:hover:border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Emergency Triage</span>
              <span className="p-1.5 rounded-lg bg-rose-100/80 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                <Flame className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5 font-mono">
              {emergencyCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>Priority dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Quick Filter Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => handleChipClick('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeChip === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          ✨ All Grievances
        </button>

        <button
          onClick={() => handleChipClick('emergency')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeChip === 'emergency'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          🚨 Emergency Only
        </button>

        <button
          onClick={() => handleChipClick('in_progress')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeChip === 'in_progress'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          ⏳ Under Repair
        </button>

        <button
          onClick={() => handleChipClick('resolved')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeChip === 'resolved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          ✅ Verified Fixed
        </button>

        <button
          onClick={() => handleChipClick('roads')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeChip === 'roads'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          🛣️ Roads & Potholes
        </button>

        <button
          onClick={() => handleChipClick('waste')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeChip === 'waste'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          🚯 Solid Waste
        </button>

        <button
          onClick={() => handleChipClick('electricity')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeChip === 'electricity'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          ⚡ BESCOM Power
        </button>

        <button
          onClick={() => handleChipClick('water')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeChip === 'water'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          🚰 BWSSB Water
        </button>
      </div>

      {/* 3. Search, Filter Bar & View Toggle */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              placeholder="Search by title, location landmark, or ticket #CIVIC..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {filter.search && (
              <button
                onClick={() => setFilter({ ...filter, search: '' })}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <div className="relative">
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="All">All Categories</option>
                {(categories || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Urgency Select */}
            <div className="relative">
              <select
                value={filter.urgency}
                onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="All">All Priorities</option>
                {(urgencies || []).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Select */}
            <div className="relative">
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {(statuses || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="upvotes">Sort: Endorsements</option>
                <option value="newest">Sort: Recently Logged</option>
                <option value="urgency">Sort: High Urgency First</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 bg-slate-100 dark:bg-slate-900/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Split View (List + Map)"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Map View"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter & Active Filter Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-900 dark:text-slate-100 font-bold">{filteredIssues.length}</strong> of {issues.length} grievances in Bengaluru
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset active filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Main View Area (Map / Split / Grid) */}
      {viewMode === 'map' ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl overflow-hidden h-[600px] shadow-sm">
          <InteractiveMap
            issues={filteredIssues}
            mode="explorer"
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            height="100%"
          />
        </div>
      ) : viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px]">
          <div className="lg:col-span-6 overflow-y-auto pr-1 space-y-3.5">
            {filteredIssues.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-8 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
                No grievances match your current filters.
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onSelect={() => setSelectedIssue(issue)}
                  onUpvote={() => upvoteIssue(issue.id)}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
          <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl overflow-hidden h-full shadow-sm">
            <InteractiveMap
              issues={filteredIssues}
              mode="explorer"
              onSelectIssue={(issue) => setSelectedIssue(issue)}
              height="100%"
            />
          </div>
        </div>
      ) : (
        <div>
          {filteredIssues.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-center space-y-3 shadow-xs transition-colors">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                No Matching Grievances Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No municipal complaints matched your keyword search or selected filters. Try clearing your filters or report a new issue in your ward.
              </p>
              <button
                onClick={resetFilters}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl font-semibold border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onSelect={() => setSelectedIssue(issue)}
                  onUpvote={() => upvoteIssue(issue.id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponent: Individual Grievance Card
function IssueCard({ issue, onSelect, onUpvote, formatDate }) {
  if (!issue || !issue.title || !issue.ticketId) return null;

  const isEmergency = issue.urgency === 'Emergency';
  const isHigh = issue.urgency === 'High';
  const isResolved = issue.status === 'Resolved';

  const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=900&q=80';
  const displayPhoto = issue.mediaUrl || FALLBACK_PHOTO;

  // Category specific tint styling
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Roads & Footpaths':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
      case 'Solid Waste Management':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      case 'Streetlighting & Electricity':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/60';
      case 'Water Supply & Sewage':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60';
      case 'Drainage & Flooding':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
      case 'Traffic & Road Safety':
        return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  // Urgency badge styling
  let urgencyClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  if (isEmergency) urgencyClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 font-bold';
  else if (isHigh) urgencyClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold';
  else if (issue.urgency === 'Medium') urgencyClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 font-medium';

  // Status dot & badge styling
  let statusBadge = {
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
  };
  if (isResolved) {
    statusBadge = {
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 font-semibold'
    };
  } else if (issue.status === 'In Progress') {
    statusBadge = {
      dot: 'bg-blue-500 animate-pulse',
      text: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60 font-medium'
    };
  } else if (issue.status === 'Assigned') {
    statusBadge = {
      dot: 'bg-purple-500',
      text: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/60 font-medium'
    };
  } else if (issue.status === 'Under Review') {
    statusBadge = {
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60 font-medium'
    };
  }

  return (
    <div
      onClick={onSelect}
      className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Card Header: Ticket ID, Category & Urgency */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between text-xs bg-slate-50/60 dark:bg-slate-900/40">
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            {issue.ticketId}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadge(issue.category)}`}>
              {issue.category}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] border ${urgencyClass} flex items-center gap-1`}>
              {isEmergency && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />}
              <span>{issue.urgency}</span>
            </span>
          </div>
        </div>

        {/* Thumbnail Image with automatic fallback */}
        <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-100 dark:border-slate-700/60">
          <img
            src={displayPhoto}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_PHOTO;
            }}
          />
          {/* Subtle Gradient Shadow for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />

          {isResolved && (
            <div className="absolute top-2.5 right-2.5 bg-emerald-600/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-xs flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Verified Fixed</span>
            </div>
          )}
          <div className="absolute bottom-2.5 left-3 text-white text-[11px] font-semibold flex items-center gap-1.5 truncate max-w-[90%] drop-shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{issue.location?.neighborhood || issue.location?.address || 'Bengaluru'}</span>
          </div>
        </div>

        {/* Issue Content Body */}
        <div className="p-4 space-y-2.5">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
            {issue.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {issue.description}
          </p>

          {/* Location & Department Metadata */}
          <div className="pt-1.5 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate">{issue.department}</span>
              </div>
              <div className="shrink-0">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    issue.dispatchStatus === 'Failed'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      : issue.dispatchStatus === 'Dispatched'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  }`}
                  title={
                    issue.dispatchStatus === 'Dispatched'
                      ? `Verified & forwarded to: ${issue.dispatchedTo || 'BBMP Department Desk'}`
                      : 'Awaiting review and verification by municipal admin'
                  }
                >
                  {issue.dispatchStatus === 'Dispatched' ? (
                    <MailCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  ) : issue.dispatchStatus === 'Failed' ? (
                    <AlertCircle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>
                    {issue.dispatchStatus === 'Failed'
                      ? 'Dispatch Failed'
                      : issue.dispatchStatus === 'Dispatched'
                      ? `Dispatched to ${issue.dispatchDepartment?.replace('Department of ', '') || 'Dept'}`
                      : 'Awaiting Verification'}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Reported {formatDate(issue.reportedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Upvote, Comments, Status & Details Button */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
        {/* Upvote Button with smooth scale */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpvote();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            issue.hasUpvoted
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95'
          }`}
          title="Endorse this ticket to bump resolution priority"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{issue.upvotes || 0}</span>
        </button>

        {/* Comments Count */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{issue.comments?.length || 0}</span>
        </div>

        {/* Status Pill with live dot */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border ${statusBadge.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
          <span className={statusBadge.text}>{issue.status}</span>
        </div>

        {/* View Details Link */}
        <button
          onClick={onSelect}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold text-xs cursor-pointer group-hover:translate-x-0.5 transition-transform"
        >
          Details →
        </button>
      </div>
    </div>
  );
}
