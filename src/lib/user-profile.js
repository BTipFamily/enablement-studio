/**
 * user-profile.js
 * Manages the current user's name and team, stored in localStorage.
 * Used to tag automation projects with a requester so Dashboard can track
 * who is building what and whether their automations are succeeding.
 */

const STORAGE_KEY = "enablement_studio_user_profile";

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function hasProfile() {
  const p = getProfile();
  return p !== null && p.name && p.name.trim().length > 0;
}

export function saveProfile({ name, team }) {
  const profile = {
    name: name.trim(),
    team: team ? team.trim() : "",
    created_date: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearProfile() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Returns { name, team } for tagging projects — falls back to Anonymous. */
export function getRequesterInfo() {
  const p = getProfile();
  return {
    requested_by: p?.name || "Anonymous",
    team: p?.team || "Unknown",
  };
}
