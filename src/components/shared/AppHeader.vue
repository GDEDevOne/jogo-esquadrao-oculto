<script setup>
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore.js';
import LogoMark from './LogoMark.vue';

const store = useGameStore();

const STEPS = [
  { key: 'title', n: 1, label: 'Título' },
  { key: 'creating', n: 2, label: 'Criação' },
  { key: 'placing', n: 3, label: 'Posicionamento' },
  { key: 'battle', n: 4, label: 'Batalha' },
  { key: 'end', n: 5, label: 'Fim de jogo' },
];

const currentIndex = computed(() => STEPS.findIndex((s) => s.key === store.phase));

function stepClass(index) {
  if (index === currentIndex.value) return 'current';
  if (index < currentIndex.value) return 'done';
  return 'upcoming';
}
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <LogoMark :size="40" />
      <div class="brand-text">
        <div class="wordmark"><span class="w1">ESQUADRÃO</span> <span class="w2">OCULTO</span></div>
        <div class="tagline eyebrow">estratégia às cegas</div>
      </div>
    </div>

    <nav class="steps">
      <div v-for="(step, i) in STEPS" :key="step.key" class="step" :class="stepClass(i)">
        <span class="step-n">{{ step.n }}.</span> {{ step.label }}
      </div>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--line);
  padding-bottom: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wordmark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.3px;
}

.w1 {
  color: var(--text);
}

.w2 {
  color: var(--teal);
}

.tagline {
  margin-top: 2px;
}

.steps {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.step {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--text-dim);
}

.step .step-n {
  opacity: 0.8;
}

.step.done {
  color: var(--teal);
}

.step.current {
  background: var(--teal);
  color: #04241d;
  font-weight: 700;
}

.step.upcoming {
  color: var(--text-dim);
  opacity: 0.6;
}
</style>
