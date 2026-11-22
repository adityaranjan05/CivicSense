import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../data/mockIssues';
import BeforeAfterSlider from './BeforeAfterSlider';
import {
  X,
  ThumbsUp,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  Building,
  Share2,
  Printer,
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  MailCheck,
  Loader2
} from 'lucide-react';

export default function IssueDetailModal({ issue, onClose }) {
  const { upvoteIssue, addComment, rateResolution, role, addToast, setReceiptIssue, forwardIssueEmail } = useCivic();
  const { profile } = useAuth();

  const [newComment, setNewComment] = useState('');
  const [citizenRating, setCitizenRating] = useState(5);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  const handleForwardEmail = async () => {
    setIsDispatching(true);
    await forwardIssueEmail(issue.id);
    setIsDispatching(false);
  };

  if (!issue) return null;

  const isResolved = issue.status === 'Resolved';
  const isEmergency = issue.urgency === 'Emergency';
  const isHigh = issue.urgency === 'High';

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const authorName = profile?.fullName
      ? (role === 'admin' ? `${profile.fullName} (Official)` : profile.fullName)
      : (role === 'admin' ? 'Municipal Coordinator' : 'Local Resident');
    addComment(issue.id, newComment, authorName);
    setNewComment('');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Ticket tracking link copied to clipboard.', 'info');
    }
  };

  const handleConfirmFix = () => {
    rateResolution(issue.id, citizenRating, feedbackNote || 'Resolution verified by citizen.', true);
    setShowFeedbackForm(false);
  };

  const handleFlagPersists = () => {
    rateResolution(
      issue.id,
      1,
      feedbackNote || 'Resident reports that this issue is still persisting.',
      false
    );
    setShowFeedbackForm(false);
  };

  // Timeline statuses ordered
  const STATUS_STEPS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
  const currentStepIndex = STATUS_STEPS.indexOf(issue.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto transition-opacity">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col my-auto max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-blue-300 border border-slate-700">
              {issue.ticketId}
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-medium border border-slate-700">
              {issue.category}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                isEmergency
                  ? 'bg-rose-600 text-white shadow-xs'
                  : isHigh
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {issue.urgency} Priority
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setReceiptIssue(issue)}
              title="Official Grievance Acknowledgement Slip"
              className="flex items-center gap-1.5 bg-slate-800 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Receipt</span>
            </button>
            <button
              onClick={handleShare}
              title="Copy share link"
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="Print complaint record"
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 ml-1 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          
          {/* Title & Metadata */}
          <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
              {issue.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>{issue.location.address || issue.location.neighborhood}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Reported on {new Date(issue.reportedAt).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Filed by {issue.reporter.name}</span>
              </span>
            </div>
          </div>

          {/* Official Municipal Email Forwarding Status Banner */}
          <div className="p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                issue.dispatchStatus === 'Failed'
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : issue.dispatchStatus === 'Dispatched'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}>
                {issue.dispatchStatus === 'Failed' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : issue.dispatchStatus === 'Dispatched' ? (
                  <MailCheck className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Municipal Email Dispatch:
                  </span>
                  <span className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${
                    issue.dispatchStatus === 'Failed'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : issue.dispatchStatus === 'Dispatched'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {issue.dispatchStatus === 'Dispatched' ? 'Verified & Dispatched' : (issue.dispatchStatus || 'Pending Verification')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {issue.dispatchedTo ? (
                    <>Emailed to: <span className="font-mono text-slate-700 dark:text-slate-300">{issue.dispatchedTo}</span></>
                  ) : (
                    'Awaiting municipal official audit & verification before department dispatch'
                  )}
                  {issue.dispatchedAt && ` • ${new Date(issue.dispatchedAt).toLocaleString()}`}
                </div>
              </div>
            </div>

            {role === 'admin' ? (
              <button
                type="button"
                disabled={isDispatching}
                onClick={handleForwardEmail}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{issue.dispatchStatus === 'Dispatched' ? 'Re-dispatch Email' : 'Verify & Dispatch Email'}</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 italic shrink-0">
                Official Review Protocol
              </span>
            )}
          </div>

          {/* Issue Photo & Resolution Comparison */}
          <div className="space-y-2">
            <BeforeAfterSlider
              beforeUrl={issue.beforePhotoUrl || issue.mediaUrl}
              afterUrl={issue.afterPhotoUrl}
              title={issue.title}
            />
          </div>

          {/* Description Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 transition-colors">
            <div className="font-bold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              Citizen Description & Ground Report
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xs sm:text-sm">
              {issue.description}
            </p>
          </div>

          {/* Interactive Step-by-Step Status Progress Tracker */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              Resolution Progress Audit Pipeline
            </h3>

            {/* Stepper Bar */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
              {STATUS_STEPS.map((statusName, index) => {
                const isPassed = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                let pillColor = 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-900/40 dark:text-slate-500 dark:border-slate-800';
                if (isPassed) {
                  pillColor = 'bg-blue-50 text-blue-800 border-blue-400 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 font-bold';
                }
                if (statusName === 'Resolved' && isPassed) {
                  pillColor = 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 font-bold';
                }

                return (
                  <div key={statusName} className={`p-2 rounded-xl border transition-colors ${pillColor}`}>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Step {index + 1}</div>
                    <div className="font-semibold truncate">{statusName}</div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Timeline Audit Log */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 transition-colors">
              <div className="font-bold text-slate-700 dark:text-slate-300 text-xs">Timeline Activity Log:</div>
              <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                {issue.timeline?.map((item, idx) => (
                  <div key={item.id || idx} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{item.title}</span>
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-snug">{item.description}</p>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">By: {item.actor} ({item.role})</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assigned Department & Field Crew Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 transition-colors">
              <div className="font-bold text-slate-700 dark:text-slate-300">Jurisdiction Department</div>
              <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-semibold">
                <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{issue.department}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                Estimated Resolution SLA: <strong className="text-slate-700 dark:text-slate-300">{issue.eta || 'Standard SLA (24-48 hours)'}</strong>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 transition-colors">
              <div className="font-bold text-slate-700 dark:text-slate-300">Assigned Ward Field Crew</div>
              {issue.assignedTeam ? (
                <div className="space-y-0.5 text-slate-800 dark:text-slate-200">
                  <div className="font-semibold">{issue.assignedTeam.name}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Field Lead: {issue.assignedTeam.leadWorker}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    <span>{issue.assignedTeam.contactNumber}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Pending dispatch assignment to ward division engineer.
                </div>
              )}
            </div>
          </div>

          {/* Citizen Feedback & Verification (If Resolved) */}
          {isResolved && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 p-4 rounded-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
                    Citizen Verification & Work Quality
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Municipal staff marked this ticket as Resolved. Please confirm if the repair was completed satisfactorily.
                  </p>
                </div>
                {issue.feedback?.isResolvedConfirmed && (
                  <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
                    Verified Fixed ({issue.feedback.rating}★)
                  </span>
                )}
              </div>

              {!showFeedbackForm && !issue.feedback ? (
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Verify or Rate This Fix
                </button>
              ) : showFeedbackForm ? (
                <div className="space-y-3 pt-2.5 border-t border-emerald-200 dark:border-emerald-800/80 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rate Resolution Quality (1 to 5 Stars):
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCitizenRating(star)}
                          className={`p-1 text-lg transition-transform hover:scale-120 ${
                            star <= citizenRating ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Comments / Feedback Note:
                    </label>
                    <input
                      type="text"
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      placeholder="e.g. Asphalt was rolled smooth, or water still pooling..."
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmFix}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      ✓ Confirm Resolution Fixed
                    </button>
                    <button
                      type="button"
                      onClick={handleFlagPersists}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      ✕ Issue Persists (Reopen)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(false)}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs px-2.5 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Upvote & Endorsement Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between transition-colors">
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100">{issue.upvotes || 0} Citizens</span>
              <span className="text-slate-600 dark:text-slate-400"> have endorsed this grievance to expedite municipal repair.</span>
            </div>
            <button
              type="button"
              onClick={() => upvoteIssue(issue.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                issue.hasUpvoted
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{issue.hasUpvoted ? 'Endorsed' : 'Endorse (+1)'}</span>
            </button>
          </div>

          {/* Community Discussion & Official Updates */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Community Discussion ({issue.comments?.length || 0})</span>
            </h4>

            {/* Comments List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {!issue.comments || issue.comments.length === 0 ? (
                <div className="text-xs text-slate-400 dark:text-slate-500 italic p-3 text-center">
                  No comments logged yet. Citizens and coordinators can leave updates below.
                </div>
              ) : (
                issue.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      comment.isOfficial
                        ? 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span>{comment.author}</span>
                        {comment.isOfficial && (
                          <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                            Official Ward Staff
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 dark:text-slate-500">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post a status update or citizen comment..."
                className="flex-1 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <span>Post</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">
              Ticket #{issue.ticketId} • Status: <strong className="text-slate-800 dark:text-slate-200">{issue.status}</strong>
            </span>
            <button
              type="button"
              onClick={() => setReceiptIssue(issue)}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline hidden sm:inline"
            >
              • View Official Receipt Slip
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
