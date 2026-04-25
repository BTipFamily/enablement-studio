import { useState, useEffect, useCallback } from "react";
import {
  loadRepoConfig,
  saveRepoConfig,
  buildFileUrl,
  buildFetchHeaders,
  parseMarkdownStandard,
  readStandardsCache,
  writeStandardsCache,
  isCacheFresh,
  STANDARDS_FILES,
} from "@/lib/standards-config";

/**
 * useStandardsSync
 *
 * Manages fetching the latest layer4-standards documents from the configured
 * Git repository and caching them in localStorage. Components that need
 * enriched standard descriptions can read from `enrichedStandards`.
 *
 * Returns:
 *   config            — current repo config (editable)
 *   setConfig         — update config fields
 *   saveConfig        — persist config to localStorage
 *   sync              — trigger a manual fetch from the repo
 *   syncing           — true while a fetch is in progress
 *   lastSyncedAt      — ISO timestamp of the last successful sync (or null)
 *   syncError         — error message from last failed sync (or null)
 *   enrichedStandards — map of slug → parsed standard data from repo (or null)
 *   isConfigured      — true when the repo config has enough data to attempt a sync
 */
export function useStandardsSync() {
  const [config, setConfigState] = useState(() => loadRepoConfig());
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [cacheState, setCacheState] = useState(() => readStandardsCache());

  const isConfigured = Boolean(
    config.provider === "github"
      ? config.githubOwner && config.githubRepo
      : config.provider === "gitlab"
        ? config.gitlabProjectId
        : config.rawBaseUrl
  );

  const setConfig = useCallback((updates) => {
    setConfigState(prev => ({ ...prev, ...updates }));
  }, []);

  const saveConfig = useCallback((overrides) => {
    const merged = { ...config, ...(overrides || {}) };
    saveRepoConfig(merged);
    setConfigState(merged);
  }, [config]);

  /**
   * Fetch all standards documents from the configured repo.
   * Results are parsed and written to localStorage cache.
   */
  const sync = useCallback(async () => {
    if (!isConfigured) {
      setSyncError("Repository is not configured. Provide owner and repo name.");
      return;
    }
    setSyncing(true);
    setSyncError(null);

    const results = {};
    const errors = [];

    await Promise.allSettled(
      STANDARDS_FILES.map(async ({ file, slug }) => {
        try {
          const url = buildFileUrl(config, file);
          const headers = buildFetchHeaders(config);
          const response = await fetch(url, { headers });

          if (!response.ok) {
            errors.push(`${file}: HTTP ${response.status}`);
            return;
          }

          const markdown = await response.text();
          results[slug] = parseMarkdownStandard(markdown);
        } catch (err) {
          errors.push(`${file}: ${err.message}`);
        }
      })
    );

    if (Object.keys(results).length === 0) {
      setSyncError(`Sync failed — no documents fetched. ${errors.join("; ")}`);
    } else {
      if (errors.length > 0) {
        setSyncError(`Partial sync — ${errors.length} file(s) failed: ${errors.join("; ")}`);
      }
      writeStandardsCache(results);
      setCacheState({ data: results, fetchedAt: new Date().toISOString() });
    }

    setSyncing(false);
  }, [config, isConfigured]);

  /**
   * Auto-sync on mount when: cache is stale AND the repo is configured.
   * This keeps the app up-to-date without requiring manual intervention.
   */
  useEffect(() => {
    const cache = readStandardsCache();
    if (isConfigured && !isCacheFresh(cache)) {
      sync();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enrichedStandards = cacheState?.data ?? null;
  const lastSyncedAt = cacheState?.fetchedAt ?? null;

  return {
    config,
    setConfig,
    saveConfig,
    sync,
    syncing,
    lastSyncedAt,
    syncError,
    enrichedStandards,
    isConfigured,
  };
}
