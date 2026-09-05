<script setup>
import { computed } from 'vue';

const props = defineProps({
  board: { type: Object, required: true },
  cellPx: { type: Number, required: true },
  interactive: { type: Boolean, default: false },
  revealMode: { type: Boolean, default: false },
  // { type: 'ghost', spriteUrl, x, y, w, h, valid }
  // | { type: 'preview' | 'locked', cells: [[x,y], ...] }
  // | null
  overlay: { type: Object, default: null },
});

const emit = defineEmits(['cell-hover', 'cell-click', 'mouse-leave']);

// Precisam bater exatamente com `.board-grid` no <style> abaixo: o CSS Grid
// insere 1px de gap entre células e a borda do container mede 2px. Ignorar
// isso ao converter pixel <-> célula fazia o cálculo de coordenadas
// (hover/clique) ir se distanciando da posição real do mouse conforme a
// célula ficava mais longe da origem (0,0) — o ataque selecionado sempre
// aparecia "abaixo e à direita" de onde o jogador realmente clicou.
const GAP_PX = 1;
const BORDER_PX = 2;
const cellStep = computed(() => props.cellPx + GAP_PX);

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.board.size}, ${props.cellPx}px)`,
  gridTemplateRows: `repeat(${props.board.size}, ${props.cellPx}px)`,
}));

const overlayCellSet = computed(() => {
  if (!props.overlay || props.overlay.type === 'ghost') return null;
  return new Set(props.overlay.cells.map(([x, y]) => `${x}_${y}`));
});

function findCharacterAt(x, y) {
  return props.board.characters.find((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
}

const cellList = computed(() => {
  const list = [];
  for (let y = 0; y < props.board.size; y++) {
    for (let x = 0; x < props.board.size; x++) {
      list.push({ x, y, key: `${x}_${y}` });
    }
  }
  return list;
});

function cellClasses(cell) {
  const classes = [];
  if (props.interactive) classes.push('hoverable');
  const occupied = findCharacterAt(cell.x, cell.y);
  if (!occupied && props.board.attackedCells.has(cell.key)) classes.push('attacked-miss');
  if (overlayCellSet.value?.has(cell.key)) {
    classes.push(props.overlay.type === 'locked' ? 'pending-target' : 'preview-target');
  }
  return classes;
}

const visibleCharacters = computed(() => props.board.characters.filter((c) => !props.revealMode || c.revealed));

// w/h em células viram largura/altura em px incluindo os gaps ENTRE as
// próprias células do personagem (w células = (w-1) gaps internos).
function spanPx(cells) {
  return cells * props.cellPx + (cells - 1) * GAP_PX;
}

function spriteStyle(char) {
  return {
    left: `${char.x * cellStep.value}px`,
    top: `${char.y * cellStep.value}px`,
    width: `${spanPx(char.w)}px`,
    height: `${spanPx(char.h)}px`,
  };
}

const ghostStyle = computed(() => {
  if (!props.overlay || props.overlay.type !== 'ghost') return {};
  const { x, y, w, h } = props.overlay;
  return {
    left: `${x * cellStep.value}px`,
    top: `${y * cellStep.value}px`,
    width: `${spanPx(w)}px`,
    height: `${spanPx(h)}px`,
  };
});

function coordsFromEvent(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left - BORDER_PX) / cellStep.value);
  const y = Math.floor((e.clientY - rect.top - BORDER_PX) / cellStep.value);
  return { x, y };
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < props.board.size && y < props.board.size;
}

function onMouseMove(e) {
  if (!props.interactive) return;
  const { x, y } = coordsFromEvent(e);
  if (!inBounds(x, y)) return;
  emit('cell-hover', { x, y });
}

function onMouseLeave() {
  emit('mouse-leave');
}

function onClick(e) {
  if (!props.interactive) return;
  const { x, y } = coordsFromEvent(e);
  if (!inBounds(x, y)) return;
  emit('cell-click', { x, y });
}
</script>

<template>
  <div
    class="board-grid"
    :style="gridStyle"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @click="onClick"
  >
    <div v-for="cell in cellList" :key="cell.key" class="cell" :class="cellClasses(cell)" />
    <div
      v-for="char in visibleCharacters"
      :key="char.id"
      class="char-sprite-wrap"
      :class="{ dead: !char.alive }"
      :style="spriteStyle(char)"
    >
      <img class="char-sprite" :src="char.spriteUrl" alt="" />
    </div>
    <img
      v-if="overlay && overlay.type === 'ghost'"
      class="placement-ghost"
      :class="{ invalid: !overlay.valid }"
      :src="overlay.spriteUrl"
      :style="ghostStyle"
      alt=""
    />
  </div>
</template>

<style scoped>
.board-grid {
  display: grid;
  gap: 1px;
  background: var(--line);
  border: 2px solid var(--line);
  position: relative;
  width: max-content;
}

.cell {
  background: var(--water);
  position: relative;
}

.cell.hoverable:hover {
  background: var(--water-hover);
  cursor: crosshair;
}

.cell.attacked-miss::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--amber) 0%, var(--red) 60%, transparent 75%);
}

.cell.preview-target {
  background: rgba(46, 230, 197, 0.22) !important;
  outline: 1px dashed var(--teal);
}

.cell.pending-target {
  background: rgba(46, 230, 197, 0.5) !important;
  outline: 1px solid var(--teal);
}

.char-sprite-wrap {
  position: absolute;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.char-sprite {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.char-sprite-wrap.dead .char-sprite {
  filter: grayscale(1) brightness(0.4);
}

.char-sprite-wrap.dead::after {
  content: '✕';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--red);
  font-size: 1.4em;
  font-weight: 900;
}

.placement-ghost {
  position: absolute;
  pointer-events: none;
  opacity: 0.55;
  image-rendering: pixelated;
  z-index: 5;
}

.placement-ghost.invalid {
  filter: brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(6);
}
</style>
