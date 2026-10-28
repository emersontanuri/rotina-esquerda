import { ref } from 'vue';
import { readTheme, saveTheme } from '../../theme.js';
const preference = ref('light');
let started = false;
function apply() { document.documentElement.dataset.theme = preference.value; }
export function useTheme() {
  function start() {
    if (started) return;
    started = true;
    const darkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
    try { preference.value = readTheme(window.localStorage, darkSystem); }
    catch { preference.value = darkSystem ? 'dark' : 'light'; }
    apply();
  }
  function toggle() {
    preference.value = preference.value === 'dark' ? 'light' : 'dark';
    apply();
    try { saveTheme(window.localStorage, preference.value); } catch {}
  }
  return { preference, start, toggle };
}
