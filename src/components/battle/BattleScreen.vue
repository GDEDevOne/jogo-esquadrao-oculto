<script setup>
import { computed, ref } from 'vue';
import { useGameStore } from '../../stores/gameStore.js';
import { useResponsive } from '../../composables/useResponsive.js';
import { useTurnTimer } from '../../composables/useTurnTimer.js';
import { getAttackCells } from '../../core/attackPatterns.js';
import BoardGrid from '../shared/BoardGrid.vue';
import AttackerSelector from './AttackerSelector.vue';
import TurnTimer from './TurnTimer.vue';
import BattleLog from './BattleLog.vue';
import CharacterHpList from './CharacterHpList.vue';

const store = useGameStore();
const { cellPx } = useResponsive();

useTurnTimer(() => store.tickTimer());

const hoverCell = ref(null);

function patternCells(x, y) {
  const attacker = store.currentAttacker;
  if (!attacker) return [];
  return getAttackCells(attacker.attackType, x, y, store.battle.orientation, store.aiBoard.size);
}

const enemyOverlay = computed(() => {
  if (!store.currentAttacker) return null;
  // O alvo travado tem prioridade sobre o preview de hover: assim que o
  // jogador clica, o destaque aparece imediatamente e permanece visível
  // mesmo que o mouse continue sobre o tabuleiro.
  if (store.battle.pendingTarget) {
    return { type: 'locked', cells: patternCells(store.battle.pendingTarget.x, store.battle.pendingTarget.y) };
  }
  if (hoverCell.value) {
    return { type: 'preview', cells: patternCells(hoverCell.value.x, hoverCell.value.y) };
  }
  return null;
});

function onEnemyHover({ x, y }) {
  hoverCell.value = { x, y };
}

function onEnemyLeave() {
  hoverCell.value = null;
}

function onEnemyClick({ x, y }) {
  if (!store.currentAttacker || store.battle.resolving) return;
  store.setPendingTarget(x, y);
}

function confirmAttack() {
  store.resolveTurn();
}
</script>

<template>
  <div class="panel">
    <div class="battle-topbar">
      <TurnTimer />
      <div class="topbar-info">
        <div class="turn-label eyebrow">Turno {{ store.battle.turnNumber }} · Simultâneo</div>
        <div class="instruction">Escolha o alvo e confirme.</div>
      </div>
      <div class="topbar-target">
        <div v-if="store.battle.pendingTarget" class="target-info">
          Atacando ({{ store.battle.pendingTarget.x + 1 }}, {{ store.battle.pendingTarget.y + 1 }})
          com <b>{{ store.currentAttacker?.name }}</b>
        </div>
        <div v-else class="target-info dim">Nenhum alvo selecionado</div>
        <button type="button" class="btn" :disabled="!store.battle.pendingTarget" @click="confirmAttack">Confirmar ataque</button>
      </div>
    </div>

    <div class="battle-layout">
      <div class="battle-sidebar">
        <h3>Seus personagens</h3>
        <AttackerSelector />
        <CharacterHpList :characters="store.playerBoard.characters" />

        <h3 class="enemy-heading">Personagens inimigos</h3>
        <CharacterHpList :characters="store.aiBoard.characters" reveal-mode />
      </div>

      <div class="battle-boards">
        <div class="board-block">
          <h3>Campo inimigo · alvo</h3>
          <BoardGrid
            :board="store.aiBoard"
            :cell-px="cellPx"
            interactive
            reveal-mode
            :overlay="enemyOverlay"
            @cell-hover="onEnemyHover"
            @cell-click="onEnemyClick"
            @mouse-leave="onEnemyLeave"
          />
        </div>

        <div class="board-block">
          <h3>Seu campo</h3>
          <BoardGrid :board="store.playerBoard" :cell-px="cellPx" />
        </div>
      </div>
    </div>

    <BattleLog />
  </div>
</template>

<style scoped>
.battle-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.topbar-info {
  flex: 1;
  min-width: 160px;
}

.topbar-info .instruction {
  font-size: 13px;
  color: var(--text-dim);
  margin-top: 2px;
}

.topbar-target {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.target-info {
  font-size: 13px;
  white-space: nowrap;
}

.target-info.dim {
  color: var(--text-dim);
}

.target-info b {
  color: var(--teal);
}

.battle-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 900px) {
  .battle-layout {
    grid-template-columns: 1fr;
  }
}

.battle-sidebar {
  min-width: 0;
}

.battle-sidebar h3 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-dim);
  margin-bottom: 10px;
}

.battle-sidebar h3.enemy-heading {
  margin-top: 20px;
}

.battle-boards {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.board-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.board-block h3 {
  margin-bottom: 12px;
}
</style>
