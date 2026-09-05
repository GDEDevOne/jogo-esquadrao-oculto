<script setup>
import { nextTick, ref, watch } from 'vue';
import { useGameStore } from '../../stores/gameStore.js';

const store = useGameStore();
const logRef = ref(null);

watch(
  () => store.battle.log.length,
  async () => {
    await nextTick();
    if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight;
  },
);
</script>

<template>
  <div ref="logRef" class="log">
    <div v-for="(entry, i) in store.battle.log" :key="i" :class="entry.kind">{{ entry.text }}</div>
  </div>
</template>

<style scoped>
.log {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  height: 180px;
  overflow-y: auto;
  font-size: 12.5px;
  margin-top: 16px;
}

.log div {
  margin-bottom: 6px;
  line-height: 1.4;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--line);
}

.log .crit {
  color: var(--amber);
  font-weight: 700;
}

.log .graze {
  color: var(--text-dim);
}

.log .miss {
  color: var(--text-dim);
}

.log .turn-head {
  color: var(--teal);
  font-weight: 700;
  border-bottom: none;
}
</style>
