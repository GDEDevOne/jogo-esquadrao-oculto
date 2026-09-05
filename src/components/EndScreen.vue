<script setup>
import { computed } from 'vue';
import { useGameStore } from '../stores/gameStore.js';
import { CHAR_COUNT } from '../core/constants.js';
import LogoMark from './shared/LogoMark.vue';

const store = useGameStore();

const playerWon = computed(() => store.winner === 'player');

const stats = computed(() => {
  const turns = store.battle.turnNumber;
  const survivors = store.playerBoard.characters.filter((c) => c.alive).length;
  const { shotsPlayer, hitsPlayer } = store.battle.stats;
  const accuracy = shotsPlayer === 0 ? 0 : Math.round((hitsPlayer / shotsPlayer) * 100);
  return { turns, survivors, accuracy };
});
</script>

<template>
  <div class="panel endscreen">
    <LogoMark :size="56" />
    <div class="eyebrow">Operação encerrada</div>
    <h2 class="result" :style="{ color: playerWon ? 'var(--teal)' : 'var(--red)' }">
      {{ playerWon ? 'Vitória' : 'Derrota' }}
    </h2>
    <p class="subtitle">
      {{ playerWon ? 'Você eliminou todos os personagens do inimigo.' : 'Todos os seus personagens foram eliminados.' }}
    </p>

    <div class="stat-row">
      <div class="stat-block">
        <div class="stat-number">{{ stats.turns }}</div>
        <div class="eyebrow">Turnos</div>
      </div>
      <div class="stat-block">
        <div class="stat-number">{{ stats.accuracy }}%</div>
        <div class="eyebrow">Precisão</div>
      </div>
      <div class="stat-block">
        <div class="stat-number">{{ stats.survivors }}/{{ CHAR_COUNT }}</div>
        <div class="eyebrow">Sobreviventes</div>
      </div>
    </div>

    <button type="button" class="btn" style="margin-top: 20px" @click="store.resetGame()">Jogar novamente</button>
  </div>
</template>

<style scoped>
.endscreen {
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.result {
  font-family: var(--font-display);
  font-size: 40px;
  margin: 4px 0 2px;
}

.subtitle {
  color: var(--text-dim);
  margin-bottom: 10px;
}

.stat-row {
  display: flex;
  gap: 32px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
</style>
