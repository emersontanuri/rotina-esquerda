import { isComplete, monthKey, shiftMonth } from './model.js';

export function achievementSummary(months, now = new Date()) {
  const through = monthKey(now);
  const entries = Object.keys(months).filter(key => key <= through).sort()
    .map(key => ({ key, count: months[key].filter(isComplete).length }));
  const active = entries.filter(entry => entry.count > 0);
  const bestCount = Math.max(0, ...active.map(entry => entry.count));
  const best = active.filter(entry => entry.count === bestCount);
  return { total: active.reduce((sum, entry) => sum + entry.count, 0), active: active.length,
    streak: annualMetrics(months, now.getFullYear(), now).streak,
    best: best.at(-1)?.key || null, bestCount, tied: best.length > 1, through };
}

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
