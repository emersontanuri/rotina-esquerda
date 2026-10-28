import { useMonthlyTasks } from './useMonthlyTasks.js';
// The app is client-rendered; all routes share this one in-memory store.
let store;
export function useTaskStore() { return store ||= useMonthlyTasks(); }
