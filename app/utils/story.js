import { isComplete, monthKey, shiftMonth } from '../../model.js';

const monthName = key => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
  .format(new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, 1));

const monthLabel = key => new Intl.DateTimeFormat('pt-BR', { month: 'long' })
  .format(new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, 1));

export function monthlyStorySummary(months, now = new Date(), period = 'previous') {
  const through = shiftMonth(monthKey(now), period === 'current' ? 0 : -1);
  const comparison = shiftMonth(through, -1);
  const tasks = months[through] || [];
  const completed = tasks.filter(isComplete);
  const previousTasks = months[comparison];
  const previousTotal = previousTasks ? previousTasks.filter(isComplete).length : null;
  const total = completed.length;
  const difference = previousTotal === null ? null : total - previousTotal;
  return {
    month: through,
    inProgress: period === 'current',
    comparison,
    monthTitle: monthName(through),
    monthLabel: monthLabel(through),
    total,
    previousTotal,
    difference,
    activities: completed.map(task => task.title),
    comparisonLabel: difference === null ? 'Não há dados para comparação' : difference === 0 ? 'O mesmo número de atividades do mês anterior' : `${Math.abs(difference)} atividade${Math.abs(difference) === 1 ? '' : 's'} ${difference > 0 ? 'a mais' : 'a menos'} que no mês anterior`,
  };
}

export function paginateStoryActivities(activities, maxPerPage = 10) {
  const pages = [];
  let page = [];
  let characters = 0;
  for (const activity of activities) {
    const cost = Math.max(1, Math.ceil(activity.length / 34));
    if (page.length && (page.length >= maxPerPage || characters + cost > 20)) {
      pages.push(page); page = []; characters = 0;
    }
    page.push(activity); characters += cost;
  }
  if (page.length || !pages.length) pages.push(page);
  return pages;
}

export function storyDescription(summary) {
  return `${summary.streak} ${summary.streak === 1 ? 'mês' : 'meses'} em sequência, ${summary.total} tarefas concluídas e ${summary.active} meses ativos. Histórico até ${monthName(summary.through)}.`;
}

export async function createStory(summary) {
  // Ship the display font so offline stories keep the same typography.
  if (![...document.fonts].some(font => font.family === 'StoryDisplay' && font.status === 'loaded')) {
    try {
      const font = await new FontFace('StoryDisplay', 'url(/fonts/barlow-condensed-800.ttf)', { weight: '800' }).load();
      document.fonts.add(font);
    } catch { /* System fonts remain available if the font cannot load. */ }
  }
  const background = new Image();
  background.src = '/share/story-background.png';
  const logo = new Image();
  logo.src = '/rotina-de-base.svg';
  await Promise.all([background.decode(), logo.decode()]);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  const text = (value, x, y, size, color = '#25241f', maxWidth = 888, align = 'left') => {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.font = `800 ${size}px StoryDisplay, Impact, sans-serif`;
    const width = ctx.measureText(String(value)).width;
    if (width > maxWidth) ctx.font = `800 ${size * maxWidth / width}px StoryDisplay, Impact, sans-serif`;
    ctx.fillText(String(value), x, y);
  };
  ctx.drawImage(background, 0, 0, 1080, 1920);
  ctx.drawImage(logo, 373, 150, 58, 58);
  text('BASE ATIVA', 449, 194, 42, '#25241f', 350);
  text('Cada ação', 110, 366, 166, '#25241f', 780);
  text('conta.', 110, 526, 184, '#c92c25', 650);
  text(summary.streak, 540, 914, 354, '#fffaf0', 480, 'center');
  text(`${summary.streak === 1 ? 'MÊS' : 'MESES'} EM`, 540, 1004, 68, '#fffaf0', 470, 'center');
  text('MOVIMENTO', 540, 1090, 88, '#fffaf0', 490, 'center');
  text(summary.total, 120, 1452, 174, '#c92c25', 230);
  text(summary.total === 1 ? 'TAREFA' : 'TAREFAS', 366, 1386, 32, '#25241f', 180);
  text(summary.total === 1 ? 'CONCLUÍDA' : 'CONCLUÍDAS', 366, 1428, 32, '#25241f', 180);
  ctx.fillStyle = '#c92c25'; ctx.fillRect(593, 1324, 2, 134);
  text(summary.active, 650, 1452, 174, '#c92c25', 155);
  text(summary.active === 1 ? 'MÊS' : 'MESES', 824, 1386, 32, '#25241f', 150);
  text(summary.active === 1 ? 'ATIVO' : 'ATIVOS', 824, 1428, 32, '#25241f', 150);
  text(summary.tied ? 'UM DOS MELHORES MESES' : 'MELHOR MÊS', 366, 1555, 32, '#c92c25', 530);
  text(summary.best ? monthName(summary.best) : 'Sua história começa aqui', 366, 1620, 60, '#25241f', 530);
  text(summary.best ? `${summary.bestCount} ${summary.bestCount === 1 ? 'tarefa concluída' : 'tarefas concluídas'}` : 'Uma ação pode iniciar sua sequência.', 366, 1670, 34, '#25241f', 530);
  text('Constância que transforma.', 540, 1782, 64, '#25241f', 888, 'center');
  text(`Histórico até ${monthName(summary.through)}`, 540, 1834, 28, '#25241f', 888, 'center');
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Falha no PNG')), 'image/png'));
  return new File([blob], `base-ativa-${summary.through}.png`, { type: 'image/png' });
}

function loadImage(src) {
  const image = new Image(); image.src = src;
  return image.decode().then(() => image);
}

function storyCanvas(logo, background) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  if (background) ctx.drawImage(background, 0, 0, 1080, 1920);
  else { ctx.fillStyle = '#f5f0e5'; ctx.fillRect(0, 0, 1080, 1920); ctx.fillStyle = '#c92c25'; ctx.fillRect(0, 0, 24, 1920); }
  ctx.fillStyle = '#e8b53b'; ctx.fillRect(80, 294, 130, 12);
  ctx.drawImage(logo, 80, 138, 58, 58);
  return { canvas, ctx };
}

function drawStoryText(ctx, value, x, y, size, color = '#25241f', maxWidth = 888, align = 'left') {
  ctx.fillStyle = color; ctx.textAlign = align;
  ctx.font = `800 ${size}px StoryDisplay, Impact, sans-serif`;
  const width = ctx.measureText(String(value)).width;
  if (width > maxWidth) ctx.font = `800 ${size * maxWidth / width}px StoryDisplay, Impact, sans-serif`;
  ctx.fillText(String(value), x, y);
}

function wrapLines(ctx, value, maxWidth) {
  const words = String(value).split(/\s+/); const lines = []; let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function monthlyPhrase(summary) {
  if (summary.inProgress) return summary.total ? 'Cada ação fortalece o coletivo.' : 'O mês ainda está em construção.';
  if (!summary.total) return 'Toda caminhada começa com uma ação.';
  if (summary.difference === null) return `Em ${summary.monthLabel}, você colocou a participação em movimento.`;
  if (summary.difference > 0) return `Em ${summary.monthLabel}, você ampliou sua participação.`;
  if (summary.difference < 0) return `Em ${summary.monthLabel}, você manteve a participação em movimento.`;
  return `Em ${summary.monthLabel}, você seguiu em movimento.`;
}

async function createMonthlyPage(logo, background, summary, activities, pageIndex, pageCount) {
  const { canvas, ctx } = storyCanvas(logo, pageIndex === 0 ? background : null);
  drawStoryText(ctx, 'BASE ATIVA', 158, 182, 42, '#25241f', 350);
  if (pageIndex === 0) {
    drawStoryText(ctx, summary.inProgress ? 'MEU MÊS ATÉ AGORA' : 'MEU MÊS EM MOVIMENTO', 80, 260, 32, '#c92c25');
    drawStoryText(ctx, 'Resumo de', 80, 385, 82);
    drawStoryText(ctx, summary.monthLabel, 80, 495, 120, '#c92c25', 920);
    drawStoryText(ctx, summary.month.slice(0, 4), 84, 550, 32);
    ctx.fillStyle = '#c92c25'; ctx.fillRect(80, 610, 920, 310);
    drawStoryText(ctx, summary.total, 126, 813, 205, '#fffaf0', 760);
    drawStoryText(ctx, summary.total === 1 ? 'ATIVIDADE CONCLUÍDA' : 'ATIVIDADES CONCLUÍDAS', 130, 875, 42, '#fffaf0', 820);
    drawStoryText(ctx, summary.difference === null ? 'SEM COMPARAÇÃO' : summary.difference === 0 ? '= MESMO TOTAL' : summary.difference > 0 ? `+${summary.difference} ATIVIDADES` : `${summary.difference} ATIVIDADES`, 80, 1000, 58, '#25241f', 920);
    drawStoryText(ctx, summary.comparisonLabel, 80, 1050, 36, '#25241f', 920);
    drawStoryText(ctx, summary.inProgress ? 'Comparação parcial: mês atual em andamento.' : monthlyPhrase(summary), 80, 1100, 36, '#c92c25', 920);
    drawStoryText(ctx, `${pageIndex + 1} / ${pageCount}`, 984, 180, 32, '#25241f', 100, 'right');
  } else {
    drawStoryText(ctx, 'PARTICIPAÇÃO NA PRÁTICA', 80, 260, 30, '#c92c25');
    drawStoryText(ctx, 'O que fiz em', 80, 410, 82);
    drawStoryText(ctx, summary.monthLabel, 80, 520, 116, '#c92c25', 920);
    drawStoryText(ctx, summary.month.slice(0, 4), 84, 578, 32);
    let y = 690;
    activities.forEach((activity, index) => {
      ctx.font = '800 46px StoryDisplay, Impact, sans-serif';
      const lines = wrapLines(ctx, activity, 790);
      drawStoryText(ctx, '✓', 80, y, 42, '#c92c25', 60);
      lines.forEach((line, lineIndex) => drawStoryText(ctx, line, 160, y + lineIndex * 54, 46, '#25241f', 820));
      y += lines.length * 54 + 38;
    });
  }
  if (pageIndex !== 0) {
    drawStoryText(ctx, 'Constância que transforma.', 540, 1782, 54, '#25241f', 888, 'center');
    drawStoryText(ctx, `${pageIndex + 1} / ${pageCount}`, 540, 1840, 30, '#c92c25', 888, 'center');
  }
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Falha no PNG')), 'image/png'));
  return new File([blob], `resumo-${summary.month}-${pageIndex + 1}-de-${pageCount}.png`, { type: 'image/png' });
}

export async function createMonthlyStories(summary) {
  if (![...document.fonts].some(font => font.family === 'StoryDisplay' && font.status === 'loaded')) {
    try { document.fonts.add(await new FontFace('StoryDisplay', 'url(/fonts/barlow-condensed-800.ttf)', { weight: '800' }).load()); } catch { /* fallback */ }
  }
  const [logo, background] = await Promise.all([loadImage('/rotina-de-base.svg'), loadImage('/share/monthly-story-background-v2.png')]);
  const pages = summary.activities.length ? paginateStoryActivities(summary.activities) : [];
  const pageCount = 1 + (summary.activities.length ? pages.length : 0);
  return Promise.all([createMonthlyPage(logo, background, summary, [], 0, pageCount), ...pages.map((page, index) => createMonthlyPage(logo, background, summary, page, index + 1, pageCount))]);
}
