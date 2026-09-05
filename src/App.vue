<script setup>
import { useGameStore } from './stores/gameStore.js';
import TitleScreen from './components/TitleScreen.vue';
import AppHeader from './components/shared/AppHeader.vue';
import CharacterCreator from './components/creation/CharacterCreator.vue';
import PlacementBoard from './components/placement/PlacementBoard.vue';
import BattleScreen from './components/battle/BattleScreen.vue';
import EndScreen from './components/EndScreen.vue';

const store = useGameStore();
</script>

<template>
  <div class="app">
    <TitleScreen v-if="store.phase === 'title'" />

    <template v-else>
      <AppHeader />

      <CharacterCreator
        v-if="store.phase === 'creating'"
        :key="store.editingCharacterId ?? `new-${store.createdCharacters.length}`"
      />
      <PlacementBoard v-else-if="store.phase === 'placing'" />
      <BattleScreen v-else-if="store.phase === 'battle'" />
      <EndScreen v-else-if="store.phase === 'end'" />
    </template>
  </div>
</template>

<style scoped>
.app {
  max-width: 1440px;
  margin: 0 auto;
}
</style>
