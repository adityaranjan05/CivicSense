import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import {
  X,
  CheckCircle,
  Clock,
  Upload,
  Phone,
  FileText,
  Building,
  UserCheck,
  ShieldAlert,
  Save,
  Mail,
  MailCheck,
  Send,
  Loader2
} from 'lucide-react';

export default function AdminManageDrawer({ issue, onClose }) {
  const {
    updateIssueStatus,
    reassignIssue,
    submitProofOfWork,
    addToast,
    departments,
    statuses,
    sampleImages,
    dispatchTeams,
    forwardIssueEmail
  } = useCivic();

  if (!issue) return null;

  // Form State
  const [currentStatus, setCurrentStatus] = useState(issue.status);
  const [officialNote, setOfficialNote] = useState('');
  const [eta, setEta] = useState(issue.eta || 'Within 24 Hours');
  const [selectedDept, setSelectedDept] = useState(issue.department || departments?.[0] || 'BBMP Road Infrastructure');
  const [teamName, setTeamName] = useState(issue.assignedTeam?.name || '');
  const [leadWorker, setLeadWorker] = useState(issue.assignedTeam?.leadWorker || '');
  const [contactNumber, setContactNumber] = useState(issue.assignedTeam?.contactNumber || '');
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatchEmail = async () => {
    setIsDispatching(true);
    await forwardIssueEmail(issue.id);
    setIsDispatching(false);
  };
  const [proofPhotoUrl, setProofPhotoUrl] = useState(
    issue.afterPhotoUrl || sampleImages?.[0]?.url || 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80'
  );

  // Teams from database or local fallback
  const teamList = dispatchTeams && dispatchTeams.length > 0 ? dispatchTeams : [
    { name: 'BBMP Ward 151 Road Repair Crew', lead: 'AEE Suresh Gowda', phone: '+91 98450 49921', dept: 'BBMP Road Infrastructure' },
    { name: 'BBMP SWM Auto Tipper & Sanitation Squad', lead: 'Inspector Ravi Shankar', phone: '+91 94480 71200', dept: 'BBMP Solid Waste Management (SWM)' },
    { name: 'BWSSB Cauvery Pipe & Jetting Unit', lead: 'Engineer Ramesh Kumar', phone: '+91 99001 38819', dept: 'BWSSB (Water Supply & Sewerage)' },
    { name: 'BESCOM Quick Response Vehicle (QRV)', lead: 'Lineman Manjunath B.', phone: '+91 98860 94432', dept: 'BESCOM (Electricity Supply & Streetlights)' }
  ];

  const handleApplyPreset = (preset) => {
    setSelectedDept(preset.dept);
    setTeamName(preset.name);
    setLeadWorker(preset.lead);
    setContactNumber(preset.phone);
  };

  const handleSaveAll = (e) => {
    e.preventDefault();

    // 1. Update status
    if (currentStatus !== issue.status || officialNote) {
      updateIssueStatus(
        issue.id,
        currentStatus,
        officialNote || `Status updated to ${currentStatus} by Municipal Admin`,
        eta
      );
    }

    // 2. Update assignment if provided
    if (teamName || selectedDept !== issue.department) {
      reassignIssue(issue.id, selectedDept, teamName, leadWorker, contactNumber);
    }

    // 3. If marked Resolved and has proof photo, submit proof
    if (currentStatus === 'Resolved' && proofPhotoUrl) {
      submitProofOfWork(
        issue.id,
        proofPhotoUrl,
        officialNote || 'Work order completed and verified with after-photo.'
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700/80 overflow-y-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-blue-700 dark:bg-slate-900 text-white flex items-center justify-between border-b border-blue-800 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base">Manage Municipal Work Order</h3>
            <p className="text-xs text-blue-200 dark:text-slate-400">
              Ticket ID: {issue.ticketId} • {issue.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 dark:text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveAll} className="p-5 flex-1 space-y-4 text-xs overflow-y-auto text-slate-800 dark:text-slate-200">
          {/* Issue Summary */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{issue.title}</div>
            <div className="text-slate-600 dark:text-slate-400">Location: {issue.location.address}</div>
            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Priority:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{issue.urgency}</span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Reported:</span>
              <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Municipal Email Auto-Dispatch Section */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Municipal Email Dispatch</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  issue.dispatchStatus === 'Failed'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    : issue.dispatchStatus === 'Pending'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                {issue.dispatchStatus || 'Dispatched'}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Department Desk:</span>{' '}
                <span>{issue.dispatchDepartment || selectedDept}</span>
              </div>
              <div className="truncate">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Routed To:</span>{' '}
                <span className="font-mono text-[10.5px]">{issue.dispatchedTo || 'comm@bbmp.gov.in, contactusbbmp@gmail.com'}</span>
              </div>
              {issue.dispatchedAt && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Dispatched At:</span>{' '}
                  <span>{new Date(issue.dispatchedAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isDispatching}
              onClick={handleDispatchEmail}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying & Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{issue.dispatchStatus === 'Dispatched' ? 'Re-dispatch Notice via Email' : 'Verify & Dispatch via Email'}</span>
                </>
              )}
            </button>
          </div>

          {/* Status Selection */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">Update Ticket Pipeline Status</label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-blue-500/30 focus:outline-none cursor-pointer"
            >
              {(statuses || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Department Selection */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">Jurisdiction Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/30 focus:outline-none cursor-pointer"
            >
              {(departments || []).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Quick Team Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Ward Team Presets:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {teamList.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2 text-left border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/40 hover:bg-blue-50 dark:hover:bg-slate-700/60 text-[11px] truncate text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Field Crew Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Field Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. BBMP Ward 151 Road Repair Crew"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Crew Supervisor / Lead</label>
              <input
                type="text"
                value={leadWorker}
                onChange={(e) => setLeadWorker(e.target.value)}
                placeholder="e.g. AEE Suresh Gowda"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lead Contact Phone</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="e.g. +91 98450 49921"
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Target ETA */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Completion ETA</label>
            <input
              type="text"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              placeholder="e.g. Today by 5:00 PM or Within 48 Hours"
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Official Audit Note */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Timeline Log Remark</label>
            <textarea
              rows={2}
              value={officialNote}
              onChange={(e) => setOfficialNote(e.target.value)}
              placeholder="Add official audit remark visible in timeline history..."
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Proof of Work (After Photo) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Resolution Proof Photo URL (Required when marking Resolved)
            </label>
            <input
              type="text"
              value={proofPhotoUrl}
              onChange={(e) => setProofPhotoUrl(e.target.value)}
              placeholder="Paste after-repair image URL"
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
            {proofPhotoUrl && (
              <div className="w-full h-32 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={proofPhotoUrl}
                  alt="Proof Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Work Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
