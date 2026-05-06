// utils/edhrec-utils.ts - Free-form deck/team name normalization for PokemonSkill
//
// PokemonSkill accepts any user-supplied deck or team name (e.g. "Mewtwo Hyper Offense"
// for Showdown, "All Psychic" for TCG Pocket). Unlike cEDHSkill, names are NOT
// validated against an external database — players register whatever they like.
//
// The exports here keep the same names/signatures used throughout the codebase so the
// rest of the bot's plumbing (rank.ts, set.ts, predict.ts, etc.) continues to work
// without changes. Validation always succeeds.

/**
 * Normalize a deck/team name for database storage and stable lookup.
 * Lowercased, with non-alphanumeric runs collapsed to single hyphens.
 */
export function normalizeCommanderName(name: string): string {
  return name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Free-form names: always valid. Kept async so existing await callers compile.
 */
export async function validateCommander(_commanderName: string): Promise<boolean> {
  return true;
}

/**
 * No external link to point at — return an empty string so callers that embed
 * a URL produce a harmless empty link rather than a misleading EDHREC URL.
 */
export function getEdhrecUrl(_commanderName: string): string {
  return '';
}

/**
 * Format a deck/team name for display (capitalize words).
 */
export function formatCommanderName(name: string): string {
  return name
    .split(/[-\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Batch validation — every name is accepted.
 */
export async function validateCommanders(commanderNames: string[]): Promise<{ [key: string]: boolean }> {
  const results: { [key: string]: boolean } = {};
  for (const name of commanderNames) results[name] = true;
  return results;
}

/**
 * No similarity search needed for free-form names.
 */
export async function findSimilarCommanders(_searchTerm: string, _maxResults: number = 5): Promise<string[]> {
  return [];
}

/**
 * Cached variant — also always valid.
 */
export async function validateCommanderCached(_commanderName: string): Promise<boolean> {
  return true;
}
