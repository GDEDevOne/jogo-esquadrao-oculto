<script setup>
import { computed } from 'vue';

const props = defineProps({
  animated: { type: Boolean, default: false },
  size: { type: Number, default: 64 },
});

const sizeStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }));
</script>

<template>
  <div class="logo-mark" :class="{ animated }" :style="sizeStyle">
    <svg viewBox="0 0 100 100">
      <defs v-if="animated">
        <linearGradient id="lm-beam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--teal)" stop-opacity="0.55" />
          <stop offset="100%" stop-color="var(--teal)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g v-if="animated" class="lm-beam-group">
        <path d="M 50 50 L 50 6 A 44 44 0 0 1 87.1 27.5 Z" fill="url(#lm-beam)" />
      </g>
      <circle cx="50" cy="50" r="44" class="lm-ring lm-ring-outer" />
      <circle cx="50" cy="50" r="34" class="lm-ring lm-ring-inner" />
      <polygon points="50,30 70,50 50,70 30,50" class="lm-diamond" />
      <circle cx="50" cy="50" r="5" class="lm-dot" />
    </svg>
  </div>
</template>

<style scoped>
.logo-mark {
  display: inline-block;
  line-height: 0;
}

.logo-mark.animated {
  filter: drop-shadow(0 0 18px var(--glow-teal));
}

svg {
  width: 100%;
  height: 100%;
}

.lm-ring {
  fill: none;
  stroke: var(--teal);
  stroke-width: 1.5;
}

.lm-ring-inner {
  stroke-width: 1;
  opacity: 0.6;
}

.lm-diamond {
  fill: none;
  stroke: var(--teal);
  stroke-width: 2.5;
}

.lm-dot {
  fill: var(--teal);
}

.lm-beam-group {
  transform-origin: 50px 50px;
  animation: lm-spin 5.5s linear infinite;
}

@keyframes lm-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
