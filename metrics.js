import { isComplete, monthKey, shiftMonth } from './model.js';

export function annualMetrics(months, year, now = new Date()) {
  const current = monthKey(now);
  const count = key => (months[key] || []).filter(isComplete).length;
  const entries = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, '0')}`;
    return { key, count: count(key), future: key > current };
  });
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const active = entries.filter(entry => entry.count > 0).length;
  const max = Math.max(0, ...entries.map(entry => entry.count));
  let streak = null;
  if (year <= now.getFullYear()) {
    let end = year === now.getFullYear() ? current : `${year}-12`;
    if (end === current && !count(end)) end = shiftMonth(end, -1);
    streak = 0;
    while (count(end) > 0) {
      streak++;
      end = shiftMonth(end, -1);
    }
  }
  return { entries, total, active, max, average: active ? total / active : 0,
    best: max ? entries.filter(entry => entry.count === max).map(entry => entry.key) : [], streak };
}
