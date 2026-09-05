<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useGameStore } from '../../stores/gameStore.js';
import { clampSize, tierInfo } from '../../core/characters.js';
import { ATTACK_TYPE_LIST, CHAR_COUNT, MAX_CHAR_SIZE, MIN_CHAR_SIZE, STAT_MIN_POINTS } from '../../core/constants.js';
import AttributeAllocator from './AttributeAllocator.vue';
import SpritePainter from './SpritePainter.vue';
import AttackPatternIcon from '../shared/AttackPatternIcon.vue';

const store = useGameStore();

// Snapshot tirado uma única vez: o componente é remontado (via :key no
// App.vue) sempre que se entra ou sai do modo de edição, então não
// precisamos reagir a mudanças posteriores de store.editingCharacterData.
const editingData = store.editingCharacterData;
const isEditing = editingData !== null;

const form = reactive({
  name: editingData?.name ?? '',
  w: editingData?.w ?? MIN_CHAR_SIZE,
  h: editingData?.h ?? MIN_CHAR_SIZE,
  attackType: editingData?.attackType ?? 'unico',
  attrPoints: editingData
    ? { atk: editingData.atkPoints, hp: editingData.hpPoints, def: editingData.defPoints }
    : { atk: 1, hp: 1, def: 1 },
});

const painterRef = ref(null);
const errorMessage = ref('');

const tier = computed(() => tierInfo(form.w, form.h));

function extraUsed(points) {
  return points.atk - STAT_MIN_POINTS + (points.hp - STAT_MIN_POINTS) + (points.def - STAT_MIN_POINTS);
}

watch(
  () => [form.w, form.h],
  () => {
    if (extraUsed(form.attrPoints) > tier.value.points) {
      form.attrPoints = { atk: 1, hp: 1, def: 1 };
    }
  },
);

function onSizeInput(axis, event) {
  const clamped = clampSize(event.target.valueAsNumber, MIN_CHAR_SIZE, MAX_CHAR_SIZE);
  form[axis] = clamped;
  // Força o DOM a refletir o valor corrigido mesmo quando ele coincide com o
  // valor reativo anterior (nesse caso o Vue não reaplicaria o :value).
  event.target.value = clamped;
}

const pointsUsed = computed(() => extraUsed(form.attrPoints));
const canConfirm = computed(() => pointsUsed.value === tier.value.points);

const attackTypeInfo = computed(() => ATTACK_TYPE_LIST.find((t) => t.id === form.attackType));

const TIER_CSS_CLASS = { Pequeno: 'tier-pequeno', Médio: 'tier-medio', Grande: 'tier-grande' };
const tierCssClass = computed(() => TIER_CSS_CLASS[tier.value.name]);

const emptySlots = computed(() => Math.max(0, CHAR_COUNT - store.createdCharacters.length));

const confirmLabel = computed(() => {
  if (isEditing) return 'Salvar alterações';
  return store.createdCharacters.length + 1 === CHAR_COUNT ? 'Confirmar e ir para posicionamento →' : 'Confirmar e criar próximo →';
});

function attackLabel(type) {
  return ATTACK_TYPE_LIST.find((t) => t.id === type)?.label ?? type;
}

function confirm() {
  if (!canConfirm.value) {
    errorMessage.value = `Distribua todos os ${tier.value.points} pontos de atributo antes de continuar (${pointsUsed.value}/${tier.value.points} usados).`;
    return;
  }
  if (!painterRef.value.hasContent()) {
    errorMessage.value = 'Desenhe seu personagem antes de confirmar — o quadro de desenho não pode ficar em branco.';
    return;
  }
  errorMessage.value = '';
  const spriteUrl = painterRef.value.exportDataUrl();
  const payload = {
    name: form.name.trim(),
    w: form.w,
    h: form.h,
    attackType: form.attackType,
    atkPoints: form.attrPoints.atk,
    hpPoints: form.attrPoints.hp,
    defPoints: form.attrPoints.def,
    spriteUrl,
  };
  if (isEditing) {
    store.confirmCharacterEdit(payload);
  } else {
    store.confirmCharacterCreation(payload);
  }
}

function cancelEdit() {
  store.cancelEditingCharacter();
}
</script>

<template>
  <div>
    <div class="steps">
      <div
        v-for="i in CHAR_COUNT"
        :key="i"
        class="step-dot"
        :class="{ done: i - 1 < store.createdCharacters.length, current: i - 1 === store.createdCharacters.length }"
      />
    </div>

    <h2 v-if="isEditing">Editando: {{ editingData.name }}</h2>
    <h2 v-else>Personagem {{ store.createdCharacters.length + 1 }} de {{ CHAR_COUNT }}</h2>

    <div class="creator-layout">
      <div class="creator-col-left">
        <div class="panel">
          <h3 class="eyebrow">Identificação</h3>
          <label>Nome do personagem</label>
          <input v-model="form.name" type="text" placeholder="Ex: Capitão Aço" maxlength="24" />
        </div>

        <div class="panel">
          <h3 class="eyebrow">Tamanho</h3>
          <p class="remaining" style="margin-top: 0">Mínimo 3, máximo 10 em cada eixo.</p>
          <div class="size-inputs">
            Largura
            <input
              type="number"
              :min="MIN_CHAR_SIZE"
              :max="MAX_CHAR_SIZE"
              :value="form.w"
              :disabled="isEditing"
              @change="onSizeInput('w', $event)"
            />
            Altura
            <input
              type="number"
              :min="MIN_CHAR_SIZE"
              :max="MAX_CHAR_SIZE"
              :value="form.h"
              :disabled="isEditing"
              @change="onSizeInput('h', $event)"
            />
          </div>
          <p class="remaining">
            <span class="tier-badge" :class="tierCssClass">{{ tier.name }} • +{{ tier.points }} pts</span>
            {{ form.w }}x{{ form.h }} = {{ tier.area }} células
            <template v-if="isEditing">— tamanho travado após a criação</template>
          </p>
        </div>

        <div class="panel">
          <h3 class="eyebrow">Padrão de ataque</h3>
          <div class="pattern-grid">
            <button
              v-for="t in ATTACK_TYPE_LIST"
              :key="t.id"
              type="button"
              class="pattern-card"
              :class="{ selected: form.attackType === t.id }"
              @click="form.attackType = t.id"
            >
              <AttackPatternIcon :type="t.id" />
              <div class="pattern-info">
                <div class="pattern-label">{{ t.label }}</div>
                <div class="pattern-desc">{{ t.description }}</div>
              </div>
            </button>
          </div>
          <p class="attack-type-desc" v-if="attackTypeInfo">{{ attackTypeInfo.description }}</p>
        </div>

        <div class="panel">
          <h3 class="eyebrow">Atributos</h3>
          <AttributeAllocator v-model="form.attrPoints" :tier-points="tier.points" />
        </div>
      </div>

      <div class="creator-col-center">
        <div class="panel">
          <h3 class="eyebrow">Editor de sprite</h3>
          <SpritePainter ref="painterRef" :initial-image="editingData?.spriteUrl ?? null" :char-w="form.w" :char-h="form.h" />
          <div class="msg">{{ errorMessage }}</div>
          <div class="footer-actions">
            <button v-if="isEditing" type="button" class="btn secondary" @click="cancelEdit">Cancelar edição</button>
            <button type="button" class="btn" :disabled="!canConfirm" @click="confirm">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>

      <div class="creator-col-right">
        <div class="panel">
          <h3 class="eyebrow">Esquadrão {{ store.createdCharacters.length }}/{{ CHAR_COUNT }}</h3>
          <div
            v-for="char in store.createdCharacters"
            :key="char.id"
            class="created-card"
            @click="store.startEditingCharacter(char.id)"
          >
            <img class="thumb" :src="char.spriteUrl" alt="" />
            <div class="created-info">
              <div class="name">{{ char.name }}</div>
              <div class="meta">{{ char.w }}x{{ char.h }} • {{ attackLabel(char.attackType) }}</div>
              <div class="stats">ATK {{ char.atk }} • HP {{ char.hpMax }} • DEF {{ char.def }}</div>
            </div>
          </div>
          <div v-for="n in emptySlots" :key="`empty-${n}`" class="empty-slot">Vaga livre</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.steps {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--line);
}

.step-dot.done {
  background: var(--teal);
}

.step-dot.current {
  background: var(--amber);
}

.creator-layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr 0.9fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1100px) {
  .creator-layout {
    grid-template-columns: 1fr;
  }
}

.creator-col-left,
.creator-col-center,
.creator-col-right {
  min-width: 0;
}

.creator-col-right h3 {
  margin-bottom: 12px;
}

.created-card {
  display: flex;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--line);
  background: var(--panel-2);
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 12px;
}

.created-card:hover {
  border-color: var(--teal);
}

.created-card .thumb {
  width: 36px;
  height: 36px;
  object-fit: contain;
  image-rendering: pixelated;
  border-radius: 4px;
  background: var(--water);
  flex-shrink: 0;
}

.created-card .name {
  font-weight: 700;
  margin-bottom: 2px;
}

.created-card .meta,
.created-card .stats {
  color: var(--text-dim);
  font-size: 11px;
}

.empty-slot {
  border: 1px dashed var(--line);
  border-radius: 8px;
  padding: 12px 10px;
  margin-bottom: 8px;
  text-align: center;
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.size-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.tier-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 6px;
  font-family: var(--font-mono);
}

.tier-pequeno {
  background: rgba(46, 230, 197, 0.15);
  color: var(--teal);
}

.tier-medio {
  background: rgba(245, 168, 60, 0.15);
  color: var(--amber);
}

.tier-grande {
  background: rgba(239, 68, 68, 0.15);
  color: var(--red);
}

.pattern-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.pattern-card {
  display: flex;
  gap: 8px;
  align-items: center;
  text-align: left;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: var(--text);
}

.pattern-card:hover {
  border-color: var(--teal);
}

.pattern-card.selected {
  border-color: var(--teal);
  background: rgba(46, 230, 197, 0.1);
}

.pattern-label {
  font-weight: 700;
  font-size: 12px;
}

.pattern-desc {
  font-size: 10px;
  color: var(--text-dim);
  line-height: 1.3;
}

.attack-type-desc {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 8px;
}

.msg {
  font-size: 13px;
  color: var(--amber);
  min-height: 18px;
  margin-top: 8px;
}

.footer-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
