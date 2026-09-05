<script setup>
import { ATTACK_TYPES } from '../../core/constants.js';

defineProps({
  characters: { type: Array, required: true },
  revealMode: { type: Boolean, default: false },
});

function isKnown(char, revealMode) {
  return !revealMode || char.revealed;
}

function attackLabel(type) {
  return ATTACK_TYPES[type]?.label ?? type;
}
</script>

<template>
  <div class="hp-list">
    <div v-for="char in characters" :key="char.id" class="hp-item" :class="{ dead: !char.alive }">
      <div class="top-row">
        <span class="hp-name">{{ isKnown(char, revealMode) ? char.name : '???' }}</span>
        <div class="hp-bar-bg">
          <div
            class="hp-bar-fill"
            :style="{ width: (isKnown(char, revealMode) ? Math.max(0, (char.hpCur / char.hpMax) * 100) : 0) + '%' }"
          />
        </div>
        <span class="hp-text">{{ isKnown(char, revealMode) ? `${char.hpCur}/${char.hpMax}` : '???' }}</span>
      </div>
      <div v-if="isKnown(char, revealMode)" class="substats">
        {{ char.w }}x{{ char.h }} • ATK {{ char.atk }} • DEF {{ char.def }} • {{ attackLabel(char.attackType) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.hp-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  width: 230px;
}

.hp-item {
  font-size: 12px;
  padding: 4px 0;
}

.hp-item.dead {
  opacity: 0.4;
}

.hp-item .top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hp-name {
  width: 100px;
  font-weight: 600;
}

.hp-text {
  width: 50px;
  text-align: right;
}

.hp-bar-bg {
  flex: 1;
  height: 8px;
  background: var(--panel-2);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--line);
}

.hp-bar-fill {
  height: 100%;
  background: var(--teal);
  transition: width 0.3s;
}

.hp-item.dead .hp-bar-fill {
  background: var(--red);
}

.substats {
  color: var(--text-dim);
  font-size: 11px;
  margin-top: 2px;
  padding-left: 2px;
}
</style>
