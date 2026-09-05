import { onMounted, onUnmounted } from 'vue';

/**
 * Roda um setInterval de 1s chamando `onTick` enquanto o componente está
 * montado. O handle do interval não é reativo/serializável, por isso não
 * vive no store Pinia.
 */
export function useTurnTimer(onTick) {
  let intervalId = null;

  function start() {
    stop();
    intervalId = setInterval(onTick, 1000);
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  onMounted(start);
  onUnmounted(stop);

  return { start, stop };
}
