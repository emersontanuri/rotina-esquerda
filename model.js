export const STORAGE_KEY = 'rotina-esquerda:v1';
export const LEGACY_TASKS = [
  { title: 'Participar de uma reunião local', subtasks: ['Encontrar um coletivo ou organização no bairro', 'Confirmar a data e reservar um tempo', 'Participar e anotar os próximos passos'] },
  { title: 'Apoiar uma ação comunitária', subtasks: ['Conhecer uma iniciativa da comunidade', 'Combinar como posso contribuir', 'Participar da ação'] },
  { title: 'Organizar uma roda de conversa', subtasks: ['Escolher um tema com o grupo', 'Combinar local e horário', 'Convidar pessoas e preparar a conversa'] },
];
export const SUGGESTIONS = [
  { title: 'Engajar representantes da esquerda', subtasks: ['Escolher um ou mais representantes', 'Acompanhar uma publicação', 'Comentar com conteúdo', 'Compartilhar com contexto'] },
  { title: 'Pesquisar uma conquista para os trabalhadores', subtasks: ['Encontrar uma medida ou iniciativa', 'Conferir a fonte e quem participou', 'Explicar seu impacto', 'Compartilhar com a fonte'] },
  { title: 'Conhecer uma ação do governo', subtasks: ['Escolher uma política pública', 'Verificar o que já foi implementado', 'Entender quem ela atende', 'Compartilhar com a fonte'] },
  { title: 'Acompanhar a esquerda na sua região', subtasks: ['Conhecer representantes e movimentos locais', 'Acompanhar uma proposta', 'Divulgar uma iniciativa relevante'] },
  { title: 'Acompanhar uma decisão legislativa', subtasks: ['Escolher um projeto', 'Entender a proposta', 'Assistir a uma sessão ou comissão da Câmara, Senado ou Câmara Municipal', 'Registrar o que aconteceu'] },
  { title: 'Cobrar um compromisso de campanha', subtasks: ['Recuperar uma promessa', 'Verificar seu andamento', 'Enviar uma pergunta respeitosa por um canal oficial'] },
  { title: 'Participar de uma atividade coletiva', subtasks: ['Escolher uma reunião aberta, debate, plenária, atividade sindical ou de movimento social', 'Participar da atividade', 'Registrar um aprendizado'] },
  { title: 'Ouvir uma demanda do bairro', subtasks: ['Conversar com moradores interessados', 'Identificar um problema concreto', 'Descobrir o órgão responsável', 'Encaminhar a demanda'] },
  { title: 'Conhecer um direito trabalhista', subtasks: ['Estudar um direito', 'Consultar uma fonte confiável', 'Compartilhar uma explicação acessível e o canal de orientação'] },
  { title: 'Aprofundar um tema', subtasks: ['Ler um texto ou assistir a uma aula sobre trabalho, serviços públicos, história política ou organização popular', 'Anotar uma ideia e uma dúvida'] },
  { title: 'Participar de um espaço público', subtasks: ['Escolher uma audiência pública, conselho municipal ou consulta pública', 'Entender a pauta', 'Acompanhar e contribuir quando possível'] },
  { title: 'Revisar uma informação antes de compartilhar', subtasks: ['Conferir autoria e data', 'Consultar a fonte original e o contexto', 'Corrigir uma publicação própria se necessário'] },
  { title: 'Avaliar criticamente uma ação de alguém que você apoia', subtasks: ['Escolher uma ação e consultar fontes', 'Registrar um avanço', 'Registrar uma limitação', 'Formular uma cobrança'] },
];
export const INITIAL_TASKS = [
  { ...SUGGESTIONS[0], title: 'Engajar representantes da esquerda — 1ª vez' },
  { ...SUGGESTIONS[0], title: 'Engajar representantes da esquerda — 2ª vez' },
  SUGGESTIONS[4], SUGGESTIONS[2], SUGGESTIONS[5], SUGGESTIONS[6], SUGGESTIONS[3],
];
export function freshTask(task) {
  return { id: crypto.randomUUID(), title: task.title, completed: false, subtasks: task.subtasks.map(sub => ({ id: crypto.randomUUID(), title: typeof sub === 'string' ? sub : sub.title, completed: false })) };
}
export function createMonth() { return INITIAL_TASKS.map(freshTask); }
export const validMonth = key => typeof key === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(key) && !key.startsWith('0000-');
export function migrateLegacyTasks(data) {
  let changed = false;
  for (const [key, tasks] of Object.entries(data.months)) {
    const intact = task => !task.completed && LEGACY_TASKS.some(old => old.title === task.title && old.subtasks.length === task.subtasks.length && old.subtasks.every((title, i) => task.subtasks[i].title === title && !task.subtasks[i].completed));
    const first = tasks.findIndex(intact);
    if (first < 0) continue;
    data.months[key] = [...tasks.slice(0, first), ...createMonth(), ...tasks.slice(first).filter(task => !intact(task))];
    changed = true;
  }
  return changed;
}
export const isComplete = task => task.subtasks.length ? task.subtasks.every(sub => sub.completed) : task.completed;
export function monthKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
export function shiftMonth(key, offset) { const [year, month] = key.split('-').map(Number); return monthKey(new Date(year, month - 1 + offset, 1)); }
export function validateData(data) {
  const item = value => value && typeof value.id === 'string' && value.id.length > 0 && typeof value.title === 'string' && value.title.trim().length > 0 && typeof value.completed === 'boolean';
  if (!data || data.version !== 1 || !data.months || typeof data.months !== 'object' || Array.isArray(data.months)) return false;
  return Object.entries(data.months).every(([key, tasks]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(key) && Array.isArray(tasks) && tasks.every(task => item(task) && Array.isArray(task.subtasks) && task.subtasks.every(item) && new Set(task.subtasks.map(sub => sub.id)).size === task.subtasks.length) && new Set(tasks.map(task => task.id)).size === tasks.length);
}
