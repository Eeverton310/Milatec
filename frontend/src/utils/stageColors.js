const fallbackStage = {
  color: '#6f7b96',
  background: 'rgba(111, 123, 150, 0.1)',
  border: 'rgba(111, 123, 150, 0.2)',
};

const workStageColors = {
  orcamento: {
    color: '#1450c8',
    background: 'rgba(20, 80, 200, 0.1)',
    border: 'rgba(20, 80, 200, 0.2)',
  },
  'atualizacao de orcamento': {
    color: '#0f766e',
    background: 'rgba(15, 118, 110, 0.1)',
    border: 'rgba(15, 118, 110, 0.2)',
  },
  'follow-up': {
    color: '#7c3aed',
    background: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.2)',
  },
  negociacao: {
    color: '#a36715',
    background: 'rgba(163, 103, 21, 0.11)',
    border: 'rgba(163, 103, 21, 0.22)',
  },
  'aprovacao de projetos': {
    color: '#0369a1',
    background: 'rgba(3, 105, 161, 0.1)',
    border: 'rgba(3, 105, 161, 0.2)',
  },
  piloto: {
    color: '#be185d',
    background: 'rgba(190, 24, 93, 0.09)',
    border: 'rgba(190, 24, 93, 0.18)',
  },
  'projeto aprovado': {
    color: '#15803d',
    background: 'rgba(21, 128, 61, 0.1)',
    border: 'rgba(21, 128, 61, 0.2)',
  },
  'em andamento': {
    color: '#004ae8',
    background: 'rgba(0, 74, 232, 0.1)',
    border: 'rgba(0, 74, 232, 0.2)',
  },
  'pos-vendas': {
    color: '#475569',
    background: 'rgba(71, 85, 105, 0.1)',
    border: 'rgba(71, 85, 105, 0.2)',
  },
  concluido: {
    color: '#087443',
    background: 'rgba(8, 116, 67, 0.1)',
    border: 'rgba(8, 116, 67, 0.2)',
  },
  'negocio perdido': {
    color: '#bb3f59',
    background: 'rgba(187, 63, 89, 0.1)',
    border: 'rgba(187, 63, 89, 0.2)',
  },
};

const projectStageColors = {
  'analise inicial': {
    color: '#1450c8',
    background: 'rgba(20, 80, 200, 0.1)',
    border: 'rgba(20, 80, 200, 0.2)',
  },
  'pre-projetos': {
    color: '#0369a1',
    background: 'rgba(3, 105, 161, 0.1)',
    border: 'rgba(3, 105, 161, 0.2)',
  },
  'revisao pre-projeto': {
    color: '#7c3aed',
    background: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.2)',
  },
  orcamento: {
    color: '#a36715',
    background: 'rgba(163, 103, 21, 0.11)',
    border: 'rgba(163, 103, 21, 0.22)',
  },
  'projeto para aprovacao': {
    color: '#0f766e',
    background: 'rgba(15, 118, 110, 0.1)',
    border: 'rgba(15, 118, 110, 0.2)',
  },
  'revisao de projeto': {
    color: '#be185d',
    background: 'rgba(190, 24, 93, 0.09)',
    border: 'rgba(190, 24, 93, 0.18)',
  },
  'aguardando aprovacao': {
    color: '#ca8a04',
    background: 'rgba(202, 138, 4, 0.11)',
    border: 'rgba(202, 138, 4, 0.22)',
  },
  'projeto executivo': {
    color: '#004ae8',
    background: 'rgba(0, 74, 232, 0.1)',
    border: 'rgba(0, 74, 232, 0.2)',
  },
  'ajustes de piloto': {
    color: '#c2415d',
    background: 'rgba(194, 65, 93, 0.1)',
    border: 'rgba(194, 65, 93, 0.2)',
  },
  'revisao projetos executivo': {
    color: '#5b21b6',
    background: 'rgba(91, 33, 182, 0.1)',
    border: 'rgba(91, 33, 182, 0.2)',
  },
  'aguardando producao': {
    color: '#b45309',
    background: 'rgba(180, 83, 9, 0.1)',
    border: 'rgba(180, 83, 9, 0.2)',
  },
  'projeto em andamento': {
    color: '#0284c7',
    background: 'rgba(2, 132, 199, 0.1)',
    border: 'rgba(2, 132, 199, 0.2)',
  },
  'projeto finalizado': {
    color: '#087443',
    background: 'rgba(8, 116, 67, 0.1)',
    border: 'rgba(8, 116, 67, 0.2)',
  },
  'pos-vendas': {
    color: '#475569',
    background: 'rgba(71, 85, 105, 0.1)',
    border: 'rgba(71, 85, 105, 0.2)',
  },
  'negocio perdido': {
    color: '#bb3f59',
    background: 'rgba(187, 63, 89, 0.1)',
    border: 'rgba(187, 63, 89, 0.2)',
  },
};

function normalizeStage(stage) {
  return String(stage || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function resolveStage(stage, type) {
  const source = type === 'project' ? projectStageColors : workStageColors;
  return source[normalizeStage(stage)] || fallbackStage;
}

export function stageStyle(stage, type = 'work') {
  const stageToken = resolveStage(stage, type);

  return {
    '--stage-color': stageToken.color,
    '--stage-bg': stageToken.background,
    '--stage-border': stageToken.border,
  };
}
