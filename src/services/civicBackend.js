import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { INITIAL_ISSUES, INITIAL_NOTIFICATIONS } from '../data/mockIssues';

// Convert JavaScript camelCase object to Supabase snake_case schema
export function toDbIssue(issue) {
  // Store dispatch metadata inside triage_metadata so it is resilient against table schema differences
  const triageMeta = {
    ...(issue.triageMetadata || {}),
    dispatchStatus: issue.dispatchStatus || 'Pending Verification',
    dispatchedAt: issue.dispatchedAt || null,
    dispatchedTo: issue.dispatchedTo || null,
    dispatchDepartment: issue.dispatchDepartment || null
  };

  return {
    id: issue.id,
    ticket_id: issue.ticketId,
    title: issue.title,
    description: issue.description || '',
    category: issue.category,
    urgency: issue.urgency || 'Medium',
    status: issue.status || 'Submitted',
    location: issue.location || {},
    media_url: issue.mediaUrl || '',
    before_photo_url: issue.beforePhotoUrl || issue.mediaUrl || '',
    after_photo_url: issue.afterPhotoUrl || '',
    department: issue.department || 'BBMP Road Infrastructure',
    assigned_team: issue.assignedTeam || null,
    eta: issue.eta || 'Awaiting triage',
    upvotes: typeof issue.upvotes === 'number' ? issue.upvotes : 1,
    reporter: issue.reporter || { name: 'Citizen', isAnonymous: false },
    timeline: issue.timeline || [],
    comments: issue.comments || [],
    triage_metadata: triageMeta,
    feedback: issue.feedback || null,
    reported_at: issue.reportedAt || new Date().toISOString(),
    updated_at: issue.updatedAt || new Date().toISOString()
  };
}

// Convert Supabase database row back to frontend camelCase object
export function fromDbIssue(row) {
  if (!row || !row.id || !row.title) return null;

  // Sanitize broken legacy Unsplash URLs
  let mediaUrl = row.media_url || row.mediaUrl || '';
  if (mediaUrl.includes('photo-1541888946425-d0fbb1861593')) {
    mediaUrl = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80';
  }

  let beforeUrl = row.before_photo_url || row.beforePhotoUrl || mediaUrl;
  if (beforeUrl.includes('photo-1541888946425-d0fbb1861593')) {
    beforeUrl = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80';
  }

  const triageMeta = row.triage_metadata || row.triageMetadata || {};
  const dispatchStatus = row.dispatch_status || triageMeta.dispatchStatus || 'Pending Verification';
  const dispatchedAt = row.dispatched_at || triageMeta.dispatchedAt || null;
  const dispatchedTo = row.dispatched_to || triageMeta.dispatchedTo || null;
  const dispatchDepartment = row.dispatch_department || triageMeta.dispatchDepartment || null;

  return {
    id: row.id,
    ticketId: row.ticket_id || row.ticketId,
    title: row.title,
    description: row.description || '',
    category: row.category || 'Infrastructure',
    urgency: row.urgency || 'Medium',
    status: row.status || 'Submitted',
    location: row.location || {},
    mediaUrl,
    beforePhotoUrl: beforeUrl,
    afterPhotoUrl: row.after_photo_url || row.afterPhotoUrl || '',
    department: row.department || 'BBMP Road Infrastructure',
    assignedTeam: row.assigned_team || row.assignedTeam,
    eta: row.eta || 'Awaiting triage',
    upvotes: typeof row.upvotes === 'number' ? row.upvotes : 0,
    hasUpvoted: false,
    reporter: row.reporter || {},
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    triageMetadata: triageMeta,
    dispatchStatus,
    dispatchedAt,
    dispatchedTo,
    dispatchDepartment,
    feedback: row.feedback,
    reportedAt: row.reported_at || row.reportedAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
  };
}

export function toDbNotification(notif) {
  return {
    id: notif.id,
    title: notif.title,
    message: notif.message,
    timestamp: notif.timestamp || 'Just now',
    type: notif.type || 'info',
    read: Boolean(notif.read),
    ticket_id: notif.ticketId || null,
    created_at: new Date().toISOString()
  };
}

export function fromDbNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    timestamp: row.timestamp || 'Just now',
    type: row.type || 'info',
    read: Boolean(row.read),
    ticketId: row.ticket_id || row.ticketId
  };
}

/**
 * Fetch all issues from Supabase backend
 */
export async function fetchIssuesFromBackend() {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('reported_at', { ascending: false });

    if (error) {
      console.warn('Backend issues fetch returned error, fallback to local cache:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(fromDbIssue);
    }

    // If table exists but is empty, seed it with the realistic initial dataset!
    if (data && data.length === 0) {
      console.log('Issues table is empty. Seeding initial Bengaluru civic dataset to Supabase backend...');
      await seedIssuesToBackend(INITIAL_ISSUES);
      return INITIAL_ISSUES;
    }

    return null;
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return null;
  }
}

/**
 * Seed initial issues to Supabase table
 */
export async function seedIssuesToBackend(issuesToSeed = INITIAL_ISSUES) {
  if (!isSupabaseConfigured) return;
  try {
    const dbPayload = issuesToSeed.map(toDbIssue);
    const { error } = await supabase.from('issues').upsert(dbPayload, { onConflict: 'id' });
    if (error) {
      console.warn('Error auto-seeding issues to backend:', error.message);
    } else {
      console.log(`Successfully seeded ${issuesToSeed.length} issues to Supabase backend.`);
    }
  } catch (err) {
    console.warn('Seed exception:', err);
  }
}

/**
 * Create a new issue in Supabase backend
 */
export async function createIssueInBackend(issue) {
  if (!isSupabaseConfigured) return null;
  try {
    const dbPayload = toDbIssue(issue);
    const { data, error } = await supabase
      .from('issues')
      .insert([dbPayload])
      .select();

    if (error) {
      console.error('Failed to create issue in Supabase backend:', error);
      return null;
    }
    return data?.[0] ? fromDbIssue(data[0]) : issue;
  } catch (err) {
    console.error('Create issue exception:', err);
    return null;
  }
}

/**
 * Update an existing issue in Supabase backend
 */
export async function updateIssueInBackend(issueId, updatedIssue) {
  if (!isSupabaseConfigured) return null;
  try {
    const dbPayload = toDbIssue(updatedIssue);
    // Don't modify the primary key
    delete dbPayload.id;

    const { data, error } = await supabase
      .from('issues')
      .update(dbPayload)
      .eq('id', issueId)
      .select();

    if (error) {
      console.error('Failed to update issue in Supabase backend:', error);
      return null;
    }
    return data?.[0] ? fromDbIssue(data[0]) : updatedIssue;
  } catch (err) {
    console.error('Update issue exception:', err);
    return null;
  }
}

/**
 * Fetch all notifications from Supabase backend
 */
export async function fetchNotificationsFromBackend() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notifications fetch notice:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(fromDbNotification);
    }

    if (data && data.length === 0) {
      // Seed notifications
      await seedNotificationsToBackend(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }

    return null;
  } catch (err) {
    console.warn('Notifications fetch exception:', err);
    return null;
  }
}

/**
 * Seed initial notifications
 */
export async function seedNotificationsToBackend(notifs = INITIAL_NOTIFICATIONS) {
  if (!isSupabaseConfigured) return;
  try {
    const dbPayload = notifs.map(toDbNotification);
    await supabase.from('notifications').upsert(dbPayload, { onConflict: 'id' });
  } catch (e) {}
}

/**
 * Mark all notifications as read in backend
 */
export async function markNotificationsReadInBackend() {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('notifications').update({ read: true }).neq('read', true);
  } catch (e) {}
}

/**
 * Fetch dynamic app configuration from public.app_config table
 * (categories, urgencies, statuses, departments, sample_preset_images)
 */
export async function fetchAppConfigFromBackend() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, data');

    if (error) {
      console.warn('App config fetch notice:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      const configMap = {};
      data.forEach((row) => {
        configMap[row.key] = row.data;
      });
      return configMap;
    }
    return null;
  } catch (err) {
    console.warn('App config fetch exception:', err);
    return null;
  }
}

/**
 * Fetch Bengaluru Wards from public.wards table
 */
export async function fetchWardsFromBackend() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('wards')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Wards fetch notice:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((w) => ({
        id: w.id,
        name: w.name,
        zone: w.zone,
        neighborhood: w.neighborhood,
        slaHoursAvg: w.sla_hours_avg,
        leadEngineer: w.lead_engineer,
        wardOffice: w.ward_office
      }));
    }
    return null;
  } catch (err) {
    console.warn('Wards fetch exception:', err);
    return null;
  }
}

/**
 * Fetch Municipal Dispatch Teams from public.dispatch_teams table
 */
export async function fetchDispatchTeamsFromBackend() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('dispatch_teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Dispatch teams fetch notice:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((t) => ({
        id: t.id,
        name: t.name,
        lead: t.lead,
        phone: t.phone,
        dept: t.dept
      }));
    }
    return null;
  } catch (err) {
    console.warn('Dispatch teams fetch exception:', err);
    return null;
  }
}

/**
 * Update user karma points & badges in Supabase profiles table
 */
export async function updateUserKarmaInBackend(userId, karmaData) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase
      .from('profiles')
      .update({
        karma_points: karmaData.points,
        badges: karmaData.badges,
        reports_count: karmaData.reportsCount,
        endorsements_count: karmaData.endorsementsCount,
        verifications_count: karmaData.verificationsCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  } catch (e) {
    console.warn('Karma update exception:', e);
  }
}

/**
 * Subscribe to real-time changes on the issues table
 */
export function subscribeToIssuesRealtime(callback) {
  if (!isSupabaseConfigured || !supabase.channel) return () => {};

  try {
    const channel = supabase
      .channel('public:issues')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        (payload) => {
          if (typeof callback === 'function') {
            callback(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Realtime subscription notice:', e);
    return () => {};
  }
}

