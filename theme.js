export const THEME_KEY = 'rotina-de-base:theme';
export const validTheme = value => ['light', 'dark'].includes(value);
export function readTheme(storage, darkSystem = false) {
  try { const value = storage.getItem(THEME_KEY); if (validTheme(value)) return value; } catch {}
  return darkSystem ? 'dark' : 'light';
}
export function saveTheme(storage, preference) {
  try { storage.setItem(THEME_KEY, preference); } catch { /* Keep the in-memory choice. */ }
}
