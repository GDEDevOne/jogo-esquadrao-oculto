<script setup>
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore.js';
import { ATTACK_TYPES } from '../../core/constants.js';

const store = useGameStore();

function attackLabel(type) {
  return ATTACK_TYPES[type]?.label ?? type;
}

function select(character) {
  if (!character.alive || store.battle.resolving) return;
  store.selectAttacker(character.id);
}

const showOrientation = computed(() => store.currentAttacker?.attackType === 'linha3');
</script>

<template>
  <div>
    <p class="remaining center" style="margin-bottom: 8px">1. Escolha qual personagem ataca</p>
    <div class="attacker-select">
      <div
        v-for="char in store.playerBoard.characters"
        :key="char.id"
        class="attacker-chip"
        :class="{ disabled: !char.alive, selected: store.battle.selectedAttackerId === char.id }"
        @click="select(char)"
      >
        <div class="name">{{ char.name }}</div>
        <div>{{ char.w }}x{{ char.h }} • {{ attackLabel(char.attackType) }}</div>
        <div class="hpmini">
          <div class="hpmini-fill" :style="{ width: Math.max(0, (char.hpCur / char.hpMax) * 100) + '%' }" />
        </div>
      </div>
    </div>
    <div v-if="showOrientation" class="orientation-toggle">
      <span class="remaining">Orientação da linha:</span>
      <button
        type="button"
        class="btn secondary small-btn"
        :class="{ active: store.battle.orientation === 'H' }"
        @click="store.setOrientation('H')"
      >
        Horizontal
      </button>
      <button
        type="button"
        class="btn secondary small-btn"
        :class="{ active: store.battle.orientation === 'V' }"
        @click="store.setOrientation('V')"
      >
        Vertical
      </button>
    </div>
  </div>
</template>

<style scoped>
.attacker-select {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  justify-content: center;
}

.attacker-chip {
  border: 1px solid var(--line);
  background: var(--panel-2);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  min-width: 120px;
}

.attacker-chip:hover {
  border-color: var(--teal);
}

.attacker-chip.selected {
  border-color: var(--teal);
  background: rgba(46, 230, 197, 0.12);
}

.attacker-chip.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.attacker-chip .name {
  font-weight: 700;
  margin-bottom: 2px;
}

.attacker-chip .hpmini {
  height: 5px;
  background: var(--line);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
}

.attacker-chip .hpmini-fill {
  height: 100%;
  background: var(--teal);
}

.orientation-toggle {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-bottom: 10px;
  align-items: center;
}

.orientation-toggle .btn.active {
  border-color: var(--teal);
  color: var(--teal);
}
</style>
