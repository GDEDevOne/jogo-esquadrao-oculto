<script setup>
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore.js';
import { TURN_SECONDS } from '../../core/constants.js';

const store = useGameStore();

const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;

const low = computed(() => store.battle.timeLeft <= 10);
const dashoffset = computed(() => CIRCUMFERENCE * (1 - store.battle.timeLeft / TURN_SECONDS));
</script>

<template>
  <div class="timer-ring">
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" :r="R" class="ring-bg" />
      <circle
        cx="50"
        cy="50"
        :r="R"
        class="ring-fill"
        :class="{ low }"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashoffset"
      />
    </svg>
    <span class="ring-label">{{ store.battle.timeLeft }}s</span>
  </div>
</template>

<style scoped>
.timer-ring {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--panel-2);
  stroke-width: 8;
}

.ring-fill {
  fill: none;
  stroke: var(--teal);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.ring-fill.low {
  stroke: var(--red);
}

.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 15px;
}
</style>
