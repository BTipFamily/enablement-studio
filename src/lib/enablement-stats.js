/**
 * enablement-stats.js
 * Lightweight localStorage-backed statistics tracker for the Enablement Activity Catalogue.
 *
 * Tracks two categories of metrics:
 *  1. Curriculum metrics  — add/remove/complete per activity, suggested paths applied
 *  2. Catalogue metrics   — detail views per activity, search queries, filter usage, emails sent
 */

const STORAGE_KEY = "enablement_activity_stats";
const MAX_HISTORY  = 200;
const MAX_SEARCHES = 100;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || defaultStore();
  } catch {
    return defaultStore();
  }
}

function save(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

function defaultStore() {
  return {
    // ── Curriculum metrics ─────────────────────────────────────────────────
    activities: {},
    // { [activityId]: {
    //     addCount, removeCount, completedCount, uncompleteCount,
    //     viewCount,                  ← NEW: detail sheet opens
    //     lastAdded, lastCompleted, lastViewed
    //   }
    // }

    paths: {},
    // { [pathId]: number }

    // ── Catalogue interaction metrics ──────────────────────────────────────
    catalogue: {
      searches:           [],   // SearchRecord[] (capped at MAX_SEARCHES)
      filterUsage:        { format: {}, tier: {} },
      emailsSent:         0,
      emailActivityCounts: [],  // number[] — distribution of curriculum sizes emailed
    },

    // ── Rolling event log ──────────────────────────────────────────────────
    history: [],
    // Event[] (capped at MAX_HISTORY)
    // types: add | remove | complete | uncomplete | path |
    //        view | search | filter | email
  };
}

// Ensure the catalogue sub-object exists on stores persisted before this version
function ensureCatalogue(store) {
  if (!store.catalogue) {
    store.catalogue = defaultStore().catalogue;
  }
  if (!store.catalogue.filterUsage) {
    store.catalogue.filterUsage = { format: {}, tier: {} };
  }
  if (!store.catalogue.searches)           store.catalogue.searches = [];
  if (store.catalogue.emailsSent == null)  store.catalogue.emailsSent = 0;
  if (!store.catalogue.emailActivityCounts) store.catalogue.emailActivityCounts = [];
  return store;
}

function activityEntry(store, id) {
  if (!store.activities[id]) {
    store.activities[id] = {
      addCount: 0,
      removeCount: 0,
      completedCount: 0,
      uncompleteCount: 0,
      viewCount: 0,
      lastAdded: null,
      lastCompleted: null,
      lastViewed: null,
    };
  }
  // Backfill viewCount for entries persisted before this version
  if (store.activities[id].viewCount == null) store.activities[id].viewCount = 0;
  return store.activities[id];
}

function pushHistory(store, entry) {
  store.history.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (store.history.length > MAX_HISTORY) store.history.length = MAX_HISTORY;
}

// ─── Curriculum API ───────────────────────────────────────────────────────────

export function recordAdd(activityId) {
  const store = load();
  const entry = activityEntry(store, activityId);
  entry.addCount++;
  entry.lastAdded = new Date().toISOString();
  pushHistory(store, { type: "add", activityId });
  save(store);
}

export function recordRemove(activityId) {
  const store = load();
  const entry = activityEntry(store, activityId);
  entry.removeCount++;
  pushHistory(store, { type: "remove", activityId });
  save(store);
}

export function recordComplete(activityId) {
  const store = load();
  const entry = activityEntry(store, activityId);
  entry.completedCount++;
  entry.lastCompleted = new Date().toISOString();
  pushHistory(store, { type: "complete", activityId });
  save(store);
}

export function recordUncomplete(activityId) {
  const store = load();
  const entry = activityEntry(store, activityId);
  entry.uncompleteCount = (entry.uncompleteCount || 0) + 1;
  pushHistory(store, { type: "uncomplete", activityId });
  save(store);
}

export function recordPathApplied(pathId, activityIds) {
  const store = load();
  store.paths[pathId] = (store.paths[pathId] || 0) + 1;
  pushHistory(store, { type: "path", pathId, activityCount: activityIds.length });
  save(store);
}

// ─── Catalogue Interaction API ────────────────────────────────────────────────

/** Record that a user opened the detail sheet for an activity. */
export function recordDetailView(activityId) {
  const store = ensureCatalogue(load());
  const entry = activityEntry(store, activityId);
  entry.viewCount++;
  entry.lastViewed = new Date().toISOString();
  pushHistory(store, { type: "view", activityId });
  save(store);
}

/**
 * Record a catalogue search query.
 * @param {string} query  The trimmed search string (non-empty).
 * @param {number} resultsCount  Number of activities returned.
 */
export function recordSearch(query, resultsCount) {
  if (!query || !query.trim()) return;
  const store = ensureCatalogue(load());
  const record = {
    query:        query.trim().toLowerCase(),
    resultsCount,
    timestamp:    new Date().toISOString(),
  };
  store.catalogue.searches.unshift(record);
  if (store.catalogue.searches.length > MAX_SEARCHES) {
    store.catalogue.searches.length = MAX_SEARCHES;
  }
  pushHistory(store, { type: "search", query: record.query, resultsCount });
  save(store);
}

/**
 * Record use of a catalogue filter.
 * @param {"format"|"tier"} filterType
 * @param {string} value  The selected filter value (e.g. "live", "1", "all").
 */
export function recordFilterUsed(filterType, value) {
  const store = ensureCatalogue(load());
  const bucket = store.catalogue.filterUsage[filterType] || {};
  bucket[value] = (bucket[value] || 0) + 1;
  store.catalogue.filterUsage[filterType] = bucket;
  pushHistory(store, { type: "filter", filterType, value });
  save(store);
}

/**
 * Record that a curriculum was emailed.
 * @param {number} activityCount  Number of activities in the emailed curriculum.
 */
export function recordEmailSent(activityCount) {
  const store = ensureCatalogue(load());
  store.catalogue.emailsSent++;
  store.catalogue.emailActivityCounts.push(activityCount);
  pushHistory(store, { type: "email", activityCount });
  save(store);
}

// ─── Read / Reset ─────────────────────────────────────────────────────────────

export function getStats() {
  return ensureCatalogue(load());
}

export function clearStats() {
  save(defaultStore());
}

