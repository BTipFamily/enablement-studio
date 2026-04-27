/**
 * enablement-stats.js
 * Lightweight localStorage-backed statistics tracker for the Enablement Activity Catalogue.
 * Tracks which activities are added/removed from curricula and which are completed.
 */

const STORAGE_KEY = "enablement_activity_stats";
const MAX_HISTORY = 200;

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
    activities: {},   // { [activityId]: { addCount, removeCount, completedCount, uncompleteCount, lastAdded, lastCompleted } }
    paths: {},        // { [pathId]: number } — how many times each suggested path was applied
    history: [],      // [ { type, activityId?, pathId?, timestamp } ]
  };
}

function activityEntry(store, id) {
  if (!store.activities[id]) {
    store.activities[id] = {
      addCount: 0,
      removeCount: 0,
      completedCount: 0,
      uncompleteCount: 0,
      lastAdded: null,
      lastCompleted: null,
    };
  }
  return store.activities[id];
}

function pushHistory(store, entry) {
  store.history.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (store.history.length > MAX_HISTORY) store.history.length = MAX_HISTORY;
}

// ─── Public API ───────────────────────────────────────────────────────────────

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

export function getStats() {
  return load();
}

export function clearStats() {
  save(defaultStore());
}
