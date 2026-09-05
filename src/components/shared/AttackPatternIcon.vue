<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: { type: String, required: true },
});

// Representação cosmética do padrão numa mini-grade 3x3 (não é a fonte de
// verdade das células reais — essa fica em src/core/attackPatterns.js). Os
// offsets aqui refletem a forma real de cada padrão (ver comentário em
// attackPatterns.js), incluindo a âncora de area2x2 no canto superior-
// esquerdo do bloco, não no centro.
const PATTERN_CELLS = {
  unico: { anchor: [1, 1], cells: [] },
  linha3: { anchor: [1, 1], cells: [[0, 1], [2, 1]] },
  cruz: { anchor: [1, 1], cells: [[0, 1], [2, 1], [1, 0], [1, 2]] },
  area2x2: { anchor: [1, 1], cells: [[2, 1], [1, 2], [2, 2]] },
  area3x3: {
    anchor: [1, 1],
    cells: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  },
};

const key = (x, y) => `${x}_${y}`;

const pattern = computed(() => PATTERN_CELLS[props.type] ?? PATTERN_CELLS.unico);
const anchorKey = computed(() => key(...pattern.value.anchor));
const secondarySet = computed(() => new Set(pattern.value.cells.map(([x, y]) => key(x, y))));

const grid = computed(() => {
  const cells = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const k = key(x, y);
      cells.push({ key: k, anchor: k === anchorKey.value, filled: k === anchorKey.value || secondarySet.value.has(k) });
    }
  }
  return cells;
});
</script>

<template>
  <div class="pattern-icon">
    <div v-for="cell in grid" :key="cell.key" class="mini-cell" :class="{ filled: cell.filled, anchor: cell.anchor }" />
  </div>
</template>

<style scoped>
.pattern-icon {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.mini-cell {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 2px;
}

.mini-cell.filled {
  background: var(--teal);
  border-color: var(--teal);
}

.mini-cell.anchor {
  background: var(--amber);
  border-color: var(--amber);
}
</style>
