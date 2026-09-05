import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CELL_PX_DESKTOP, CELL_PX_MOBILE, MOBILE_BREAKPOINT } from '../core/constants.js';

export function useResponsive() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT + 1);

  function onResize() {
    width.value = window.innerWidth;
  }

  onMounted(() => window.addEventListener('resize', onResize));
  onUnmounted(() => window.removeEventListener('resize', onResize));

  const isMobile = computed(() => width.value < MOBILE_BREAKPOINT);
  const cellPx = computed(() => (isMobile.value ? CELL_PX_MOBILE : CELL_PX_DESKTOP));

  return { isMobile, cellPx };
}
