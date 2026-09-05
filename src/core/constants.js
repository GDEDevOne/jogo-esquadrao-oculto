export const BOARD_SIZE = 30;
export const CHAR_COUNT = 6;
export const TURN_SECONDS = 30;

export const MIN_CHAR_SIZE = 3;
export const MAX_CHAR_SIZE = 10;

// Área -> tier. `points` é o total de pontos EXTRAS de atributo disponíveis
// para distribuir, além do 1 ponto base obrigatório (não removível) que
// todo personagem já recebe em cada um dos 3 atributos.
export const TIERS = [
  { maxArea: 16, name: 'Pequeno', points: 5 },
  { maxArea: 49, name: 'Médio', points: 6 },
  { maxArea: 100, name: 'Grande', points: 8 },
];

export const STAT_MIN_POINTS = 1; // ponto base, não removível
export const STAT_MAX_POINTS = 4; // base (1) + no máximo 3 pontos extras

// Ataques em área: a célula mirada diretamente (âncora) sempre recebe 100%
// do ATK do atacante no cálculo de dano daquela célula. As demais células do
// padrão recebem `secondaryAtkRatio` do ATK — cada tipo define o próprio
// valor abaixo (a Área 3x3 usa uma taxa menor que os demais, ver comentário
// na sua entrada).
export const ATTACK_TYPES = {
  unico: {
    id: 'unico',
    label: 'Único',
    cellCount: 1,
    needsOrientation: false,
    secondaryAtkRatio: 1, // nunca há célula secundária (só a âncora existe)
    description: 'Atinge apenas a célula escolhida.',
  },
  linha3: {
    id: 'linha3',
    label: 'Linha',
    cellCount: 3,
    needsOrientation: true,
    secondaryAtkRatio: 0.5,
    description: 'Atinge 3 células em linha reta (você escolhe a orientação na hora do ataque).',
  },
  cruz: {
    id: 'cruz',
    label: 'Cruz',
    cellCount: 5,
    needsOrientation: false,
    secondaryAtkRatio: 0.5,
    description: 'Atinge a célula escolhida e as 4 células vizinhas (cima, baixo, esquerda, direita).',
  },
  area2x2: {
    id: 'area2x2',
    label: 'Área 2x2',
    cellCount: 4,
    needsOrientation: false,
    secondaryAtkRatio: 0.5,
    description: 'Atinge um bloco de 2x2 células a partir do ponto escolhido.',
  },
  area3x3: {
    id: 'area3x3',
    label: 'Área 3x3',
    cellCount: 9,
    needsOrientation: false,
    // Taxa reduzida (0.25 em vez do 0.5 padrão): com 8 células secundárias,
    // 0.5 levaria o pior caso a 5x o dano de um ataque Único (acima do teto
    // de ~2.5-3x que os outros tipos respeitam); com 0.25 o pior caso fica
    // em 1 + 8*0.25 = 3x, igual ao teto da Cruz.
    secondaryAtkRatio: 0.25,
    description: 'Atinge um bloco de 3x3 células centrado no ponto escolhido.',
  },
};

export const ATTACK_TYPE_LIST = Object.values(ATTACK_TYPES);

// Fórmula de conversão de pontos totais por atributo (1-4, já incluindo o
// ponto base) em stats.
export const ATK_BASE = 5;
export const ATK_PER_POINT = 10;
export const HP_BASE = 15;
export const HP_PER_POINT = 15;
export const DEF_PER_POINT = 4;

// Mitigação percentual: dano-base = ATK * (100 / (100 + DEF)). Nunca chega a
// zero (ao contrário da subtração linear antiga), então o piso de dano de 1
// nunca vira o único resultado possível — a variância/crítico sempre atuam
// sobre um valor positivo.
export const DEF_MITIGATION_CONSTANT = 100;

export const DAMAGE_VARIANCE_MIN = 0.8;
export const DAMAGE_VARIANCE_RANGE = 0.4; // 0.8 + rng()*0.4 => até 1.2
export const CRIT_CHANCE = 0.15;
export const GRAZE_UPPER = 0.25; // entre CRIT_CHANCE e GRAZE_UPPER = de raspão
export const CRIT_MULT = 2;
export const GRAZE_MULT = 0.5;

export const BRUSH_PALETTE = ['#ef4444', '#f5a83c', '#f2e15c', '#2ee6c5', '#4a90e2', '#a76ee0', '#ffffff', '#2a3550'];
export const BRUSH_SIZES = [3, 6, 10];
export const PAINT_TOOLS = [
  { id: 'pencil', label: 'Lápis' },
  { id: 'line', label: 'Linha' },
  { id: 'rectangle', label: 'Retângulo' },
  { id: 'circle', label: 'Círculo' },
  { id: 'eraser', label: 'Borracha' },
];

export const MOBILE_BREAKPOINT = 820;
export const CELL_PX_DESKTOP = 16;
export const CELL_PX_MOBILE = 11;

// Tamanho fixo (em px) do canvas de desenho do sprite, independente do
// tamanho (w x h) do personagem — grande o bastante para dar espaço de
// sobra para desenhar.
export const PAINT_CANVAS_SIZE_DESKTOP = 440;
export const PAINT_CANVAS_SIZE_MOBILE = 320;

export const AI_MIN_SIZE = 3;
export const AI_MAX_SIZE = 8;

export const ENEMY_NAME_POOL = [
  'Fera do Norte',
  'Sombra-9',
  'Capitão Ferrugem',
  'Máquina Cega',
  'Punho de Aço',
  'Corvo Negro',
  'Titã Salgado',
  'Espectro Azul',
];
