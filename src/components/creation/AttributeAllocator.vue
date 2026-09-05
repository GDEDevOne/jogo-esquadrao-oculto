<script setup>
import { computed } from 'vue';
import { STAT_MAX_POINTS, STAT_MIN_POINTS } from '../../core/constants.js';

const props = defineProps({
  tierPoints: { type: Number, required: true }, // pontos EXTRAS liberados pelo tier
  modelValue: { type: Object, required: true }, // { atk, hp, def }, cada um 1-4 (já incluindo o base)
});

const emit = defineEmits(['update:modelValue']);

const LABELS = { atk: 'Ataque', hp: 'Vida', def: 'Defesa' };
const KEYS = ['atk', 'hp', 'def'];
const PIP_SLOTS = Array.from({ length: STAT_MAX_POINTS }, (_, i) => i);

const extraUsed = computed(
  () =>
    props.modelValue.atk -
    STAT_MIN_POINTS +
    (props.modelValue.hp - STAT_MIN_POINTS) +
    (props.modelValue.def - STAT_MIN_POINTS),
);
const remaining = computed(() => props.tierPoints - extraUsed.value);

function pips(key) {
  const value = props.modelValue[key];
  return PIP_SLOTS.map((i) => (i === 0 ? 'base' : value > i ? 'filled' : ''));
}

function canIncrement(key) {
  return props.modelValue[key] < STAT_MAX_POINTS && extraUsed.value < props.tierPoints;
}

function canDecrement(key) {
  return props.modelValue[key] > STAT_MIN_POINTS;
}

function increment(key) {
  if (!canIncrement(key)) return;
  emit('update:modelValue', { ...props.modelValue, [key]: props.modelValue[key] + 1 });
}

function decrement(key) {
  if (!canDecrement(key)) return;
  emit('update:modelValue', { ...props.modelValue, [key]: props.modelValue[key] - 1 });
}
</script>

<template>
  <div class="attribute-allocator">
    <label>Atributos — restam <b>{{ remaining }}</b> ponto(s)</label>
    <p class="remaining" style="margin-bottom: 10px">
      Todo personagem nasce com 1 ponto em cada atributo. Distribua o restante (máx. {{ STAT_MAX_POINTS }} por atributo).
    </p>
    <div v-for="key in KEYS" :key="key" class="attr-row">
      <div class="attr-name">{{ LABELS[key] }}</div>
      <div class="attr-controls">
        <button type="button" class="small" :disabled="!canDecrement(key)" @click="decrement(key)">−</button>
        <div class="pips">
          <div v-for="(state, i) in pips(key)" :key="i" class="pip" :class="state" />
        </div>
        <button type="button" class="small" :disabled="!canIncrement(key)" @click="increment(key)">+</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attr-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 10px;
}

.attr-name {
  font-size: 14px;
  width: 70px;
}

.attr-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pips {
  display: flex;
  gap: 4px;
}

.pip {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: var(--panel-2);
  border: 1px solid var(--line);
}

.pip.filled {
  background: var(--teal);
  border-color: var(--teal);
}

.pip.base {
  background: var(--text-dim);
  border-color: var(--text-dim);
}

button.small {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
}

button.small:hover {
  border-color: var(--teal);
  color: var(--teal);
}

button.small:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
