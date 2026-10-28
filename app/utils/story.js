const monthName = key => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
  .format(new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, 1));

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
