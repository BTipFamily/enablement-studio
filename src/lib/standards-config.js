/**
 * Standards Repository Configuration
 *
 * Points the Atelier workspace to the Git repository that contains the
 * authoritative layer4-standards Markdown documents. When a sync is
 * triggered, the app fetches each file listed in STANDARDS_FILES, parses
 * the key sections, and stores the enriched data in localStorage so the
 * PolicyPanel always reflects the most recent requirements.
 *
 * Supported providers:
 *   "github"       — uses the GitHub raw content API (no auth required for public repos;
 *                    set STANDARDS_REPO_CONFIG.githubToken via localStorage for private repos)
 *   "gitlab"       — uses the GitLab raw file API
 *   "azuredevops" — uses the Azure DevOps REST API; requires a PAT for private projects
 *   "raw"          — direct URL per file; set rawBaseUrl in the config
 */

export const STANDARDS_REPO_CONFIG_KEY = "atelier_standards_repo_config";
export const STANDARDS_CACHE_KEY = "atelier_standards_cache";
export const STANDARDS_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Default configuration — update these values to point to the actual
 * standards repository. Stored values in localStorage override these.
 */
export const DEFAULT_STANDARDS_REPO_CONFIG = {
  provider: "github",          // "github" | "gitlab" | "azuredevops" | "raw"
  githubOwner: "",             // e.g. "my-org"
  githubRepo: "",              // e.g. "13731_Automation_Framework"
  githubBranch: "main",        // branch to read from
  githubFolderPath: "layer4-standards", // path within the repo
  gitlabProjectId: "",         // for gitlab provider
  gitlabBranch: "main",
  gitlabFolderPath: "layer4-standards",
  adoOrganization: "",         // Azure DevOps org name (e.g. "my-org")
  adoProject: "",              // Azure DevOps project name
  adoRepo: "",                 // Azure DevOps repository name
  adoBranch: "main",           // branch to read from
  adoFolderPath: "layer4-standards", // path within the repo
  adoToken: "",                // Azure DevOps PAT (stored in localStorage only)
  rawBaseUrl: "",              // for raw provider, base URL before filename
  githubToken: "",             // PAT for private repos (stored in localStorage only)
};

/**
 * Each entry maps the document filename to the AUTHOR_STANDARDS slug it
 * enriches. The parser extracts the Standard Statement, Author Obligations,
 * Approval Gate Requirements, and Anti-Patterns sections.
 */
export const STANDARDS_FILES = [
  { file: "safe-execution.md",                     slug: "safe-execution" },
  { file: "idempotency-and-re-runnable-behavior.md", slug: "idempotency" },
  { file: "tested-before-production.md",           slug: "tested-before-production" },
  { file: "automatic-backout-and-recovery.md",     slug: "backout-recovery" },
  { file: "observability-logging-and-reportability.md", slug: "observability-logging" },
  { file: "secured-by-design.md",                  slug: "secured-by-design" },
  { file: "naming-metadata-and-classification.md", slug: "naming-metadata" },
];

/**
 * Load the active config from localStorage, falling back to defaults.
 */
export function loadRepoConfig() {
  try {
    const stored = localStorage.getItem(STANDARDS_REPO_CONFIG_KEY);
    return stored ? { ...DEFAULT_STANDARDS_REPO_CONFIG, ...JSON.parse(stored) } : { ...DEFAULT_STANDARDS_REPO_CONFIG };
  } catch {
    return { ...DEFAULT_STANDARDS_REPO_CONFIG };
  }
}

/**
 * Persist updated config values to localStorage.
 */
export function saveRepoConfig(config) {
  localStorage.setItem(STANDARDS_REPO_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Build the raw fetch URL for a given filename and config.
 */
export function buildFileUrl(config, filename) {
  switch (config.provider) {
    case "github":
      return `https://raw.githubusercontent.com/${config.githubOwner}/${config.githubRepo}/${config.githubBranch}/${config.githubFolderPath}/${filename}`;
    case "gitlab": {
      const encodedPath = encodeURIComponent(`${config.gitlabFolderPath}/${filename}`);
      return `https://gitlab.com/api/v4/projects/${config.gitlabProjectId}/repository/files/${encodedPath}/raw?ref=${config.gitlabBranch}`;
    }
    case "azuredevops": {
      const itemPath = encodeURIComponent(`${config.adoFolderPath}/${filename}`);
      return `https://dev.azure.com/${encodeURIComponent(config.adoOrganization)}/${encodeURIComponent(config.adoProject)}/_apis/git/repositories/${encodeURIComponent(config.adoRepo)}/items?path=${itemPath}&versionDescriptor.version=${encodeURIComponent(config.adoBranch)}&versionDescriptor.versionType=branch&$format=text&api-version=7.0`;
    }
    case "raw":
      return `${config.rawBaseUrl}/${filename}`;
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Build fetch headers (adds Authorization for GitHub PAT if configured).
 */
export function buildFetchHeaders(config) {
  const headers = { Accept: "text/plain" };
  if (config.provider === "github" && config.githubToken) {
    headers["Authorization"] = `Bearer ${config.githubToken}`;
  }
  if (config.provider === "azuredevops" && config.adoToken) {
    // Azure DevOps uses HTTP Basic auth with an empty username and the PAT as the password
    headers["Authorization"] = `Basic ${btoa(`:${config.adoToken}`)}`;
  }
  return headers;
}

/**
 * Extract key sections from a Markdown document. Returns an object with
 * standard_statement, author_obligations, approval_gate_requirements,
 * anti_patterns, and standard_name.
 */
export function parseMarkdownStandard(markdown) {
  const result = {
    standard_name: "",
    standard_statement: "",
    author_obligations: [],
    approval_gate_requirements: [],
    anti_patterns: [],
    raw_markdown: markdown,
    last_synced: new Date().toISOString(),
  };

  const lines = markdown.split("\n");

  // Extract H1 title
  const titleLine = lines.find(l => l.startsWith("# Standard:"));
  if (titleLine) {
    result.standard_name = titleLine.replace("# Standard:", "").trim();
  }

  let currentSection = null;
  let buffer = [];

  const flushBuffer = () => {
    if (!currentSection || buffer.length === 0) return;
    const items = buffer
      .join("\n")
      .split(/\n(?=\d+\.\s|[-*]\s)/)
      .map(s => s.replace(/^\d+\.\s+|^[-*]\s+/, "").trim())
      .filter(s => s.length > 10);

    if (currentSection === "statement") {
      result.standard_statement = buffer.join(" ").replace(/\n/g, " ").trim();
    } else if (currentSection === "obligations") {
      result.author_obligations = items;
    } else if (currentSection === "gates") {
      result.approval_gate_requirements = items;
    } else if (currentSection === "antipatterns") {
      result.anti_patterns = items;
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## Standard Statement")) {
      flushBuffer();
      currentSection = "statement";
      continue;
    }
    if (trimmed.startsWith("## Author Obligations")) {
      flushBuffer();
      currentSection = "obligations";
      continue;
    }
    if (trimmed.startsWith("## Approval Gate Requirements")) {
      flushBuffer();
      currentSection = "gates";
      continue;
    }
    if (trimmed.match(/^##\s+Anti.?[Pp]atterns/)) {
      flushBuffer();
      currentSection = "antipatterns";
      continue;
    }
    if (trimmed.startsWith("## ") && currentSection) {
      flushBuffer();
      currentSection = null;
      continue;
    }
    if (currentSection && trimmed && !trimmed.startsWith("---")) {
      buffer.push(trimmed);
    }
  }
  flushBuffer();

  return result;
}

/**
 * Read the standards cache from localStorage.
 * Returns { data: {slug: parsedStandard}, fetchedAt: ISO string } or null.
 */
export function readStandardsCache() {
  try {
    const stored = localStorage.getItem(STANDARDS_CACHE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Write parsed standards data to the localStorage cache.
 */
export function writeStandardsCache(data) {
  localStorage.setItem(STANDARDS_CACHE_KEY, JSON.stringify({
    data,
    fetchedAt: new Date().toISOString(),
  }));
}

/**
 * Return true if the cache exists and is within the TTL window.
 */
export function isCacheFresh(cache) {
  if (!cache?.fetchedAt) return false;
  return (Date.now() - new Date(cache.fetchedAt).getTime()) < STANDARDS_CACHE_TTL_MS;
}
