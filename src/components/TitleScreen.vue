<script setup>
import { ref } from 'vue';
import { useGameStore } from '../stores/gameStore.js';
import { BOARD_SIZE, CHAR_COUNT, TURN_SECONDS } from '../core/constants.js';
import LogoMark from './shared/LogoMark.vue';

const store = useGameStore();
const showHelp = ref(false);
</script>

<template>
  <div class="title-screen bg-grid-subtle">
    <LogoMark :animated="true" :size="140" />

    <h1 class="title">
      <span class="w1">ESQUADRÃO</span> <span class="w2">OCULTO</span>
    </h1>
    <div class="subtitle eyebrow">Estratégia às cegas</div>

    <p class="description">
      Monte um esquadrão de até {{ CHAR_COUNT }} personagens, desenhe seus sprites, escolha padrões de ataque e
      posicione tudo às cegas num campo {{ BOARD_SIZE }}×{{ BOARD_SIZE }}. Turnos simultâneos, sem segunda chance.
    </p>

    <div class="actions">
      <button type="button" class="btn" @click="store.startNewGame()">Nova partida</button>
      <button type="button" class="btn secondary" @click="showHelp = true">Como jogar</button>
    </div>

    <div class="quick-stats eyebrow">
      <span>{{ CHAR_COUNT }} personagens</span>
      <span class="sep">|</span>
      <span>tabuleiro {{ BOARD_SIZE }}×{{ BOARD_SIZE }}</span>
      <span class="sep">|</span>
      <span>turnos de {{ TURN_SECONDS }}s</span>
    </div>

    <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
      <div class="panel help-panel">
        <h2>Como jogar</h2>
        <ul>
          <li>Crie até {{ CHAR_COUNT }} personagens: nome, tamanho (largura/altura de 3 a 10), padrão de ataque e sprite desenhado à mão.</li>
          <li>Distribua pontos de Ataque, Vida e Defesa — o tamanho do personagem define quantos pontos você tem disponíveis.</li>
          <li>Posicione todo o esquadrão no seu campo {{ BOARD_SIZE }}×{{ BOARD_SIZE }}, sem sobrepor ninguém.</li>
          <li>Em batalha, cada turno dura {{ TURN_SECONDS }}s: escolha um atacante e um alvo no campo inimigo.</li>
          <li>Os dois lados atacam ao mesmo tempo a cada turno — vence quem eliminar todo o esquadrão adversário primeiro.</li>
        </ul>
        <button type="button" class="btn" @click="showHelp = false">Fechar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-screen {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  padding: 40px 20px;
  border-radius: 12px;
}

.title {
  font-family: var(--font-display);
  font-size: 44px;
  letter-spacing: 0.5px;
  margin: 8px 0 0;
}

.w1 {
  color: var(--text);
}

.w2 {
  color: var(--teal);
}

.subtitle {
  letter-spacing: 0.3em;
}

.description {
  max-width: 560px;
  color: var(--text-dim);
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-stats {
  margin-top: 24px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-stats .sep {
  color: var(--line);
}

.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 12, 22, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.help-panel {
  max-width: 520px;
  text-align: left;
}

.help-panel ul {
  color: var(--text-dim);
  line-height: 1.6;
  padding-left: 20px;
  margin-bottom: 16px;
}
</style>
