<script setup>
import { computed, ref } from 'vue';
import { useGameStore } from '../../stores/gameStore.js';
import { useResponsive } from '../../composables/useResponsive.js';
import { canPlace } from '../../core/board.js';
import { CHAR_COUNT } from '../../core/constants.js';
import BoardGrid from '../shared/BoardGrid.vue';

const store = useGameStore();
const { cellPx } = useResponsive();

const hover = ref(null); // {x,y} | null
const message = ref('');
const rotating = ref(false);

const overlay = computed(() => {
  if (!hover.value || !store.pendingChar) return null;
  const { w, h } = store.pendingChar;
  const valid = canPlace(store.playerBoard, w, h, hover.value.x, hover.value.y);
  return { type: 'ghost', spriteUrl: store.pendingChar.spriteUrl, x: hover.value.x, y: hover.value.y, w, h, valid };
});

function onHover({ x, y }) {
  if (hover.value && hover.value.x === x && hover.value.y === y) return;
  hover.value = { x, y };
}

function onLeave() {
  hover.value = null;
}

function onClick({ x, y }) {
  if (!store.pendingChar) return;
  const { w, h } = store.pendingChar;
  if (!canPlace(store.playerBoard, w, h, x, y)) {
    message.value = 'Posição inválida — fora do campo ou sobrepondo outro personagem.';
    return;
  }
  message.value = '';
  store.placeCurrentCharacter(x, y);
}

async function onRotate() {
  if (rotating.value) return;
  rotating.value = true;
  try {
    await store.rotatePendingCharacter();
  } finally {
    rotating.value = false;
  }
}
</script>

<template>
  <div class="panel placement-layout">
    <div class="placement-sidebar">
      <template v-if="store.pendingChar">
        <h3 class="eyebrow">Personagem atual</h3>
        <div class="current-char">
          <img class="thumb" :src="store.pendingChar.spriteUrl" alt="" />
          <div>
            <div class="name">{{ store.pendingChar.name }}</div>
            <div class="meta">{{ store.pendingChar.w }}x{{ store.pendingChar.h }}</div>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="btn secondary small-btn" :disabled="rotating" @click="onRotate">Girar</button>
          <button type="button" class="btn secondary small-btn" @click="store.placeRandomly()">Aleatório</button>
        </div>
        <p class="msg">{{ message }}</p>
      </template>
      <template v-else>
        <h3 class="eyebrow">Esquadrão posicionado</h3>
        <p class="remaining">Todos os personagens já foram posicionados.</p>
      </template>

      <h3 class="eyebrow" style="margin-top: 20px">Já posicionados</h3>
      <p v-if="!store.playerBoard.characters.length" class="remaining">Nenhum ainda.</p>
      <div v-for="c in store.playerBoard.characters" :key="c.id" class="placed-item">
        <span>{{ c.name }}</span>
        <span class="coords">({{ c.x + 1 }}, {{ c.y + 1 }})</span>
      </div>

      <p class="remaining counter">{{ store.placedCount }} de {{ CHAR_COUNT }} posicionados</p>

      <button type="button" class="btn" style="width: 100%; margin-top: 10px" :disabled="!store.allPlaced" @click="store.startBattle()">
        Iniciar batalha
      </button>
    </div>

    <div class="placement-board-area">
      <BoardGrid
        :board="store.playerBoard"
        :cell-px="cellPx"
        interactive
        :overlay="overlay"
        @cell-hover="onHover"
        @cell-click="onClick"
        @mouse-leave="onLeave"
      />
      <div class="legend">
        <span class="legend-item"><i class="swatch swatch-occupied"></i> Ocupado</span>
        <span class="legend-item"><i class="swatch swatch-free"></i> Livre</span>
        <span class="legend-item"><i class="swatch swatch-preview"></i> Prévia</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.placement-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .placement-layout {
    grid-template-columns: 1fr;
  }
}

.current-char {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.current-char .thumb {
  width: 44px;
  height: 44px;
  object-fit: contain;
  image-rendering: pixelated;
  background: var(--water);
  border-radius: 6px;
  flex-shrink: 0;
}

.current-char .name {
  font-weight: 700;
}

.current-char .meta {
  font-size: 12px;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.msg {
  font-size: 12px;
  color: var(--red);
  min-height: 16px;
  margin: 4px 0 0;
}

.placed-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--line);
}

.placed-item .coords {
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.counter {
  margin-top: 10px;
  font-family: var(--font-mono);
}

.placement-board-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 12px;
  color: var(--text-dim);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.swatch-occupied {
  background: var(--teal);
}

.swatch-free {
  background: var(--water);
  border: 1px solid var(--line);
}

.swatch-preview {
  background: rgba(46, 230, 197, 0.35);
  border: 1px dashed var(--teal);
}
</style>
