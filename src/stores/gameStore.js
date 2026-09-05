import { defineStore } from 'pinia';
import { BOARD_SIZE, CHAR_COUNT, TURN_SECONDS } from '../core/constants.js';
import {
  allDead,
  applyDamageToCharacter,
  canPlace,
  createBoard,
  isValidTarget,
  markCellAttacked,
  placeCharacter,
  revealCharacter,
} from '../core/board.js';
import { getAttackCells } from '../core/attackPatterns.js';
import { areaEffectiveAtk, computeDamage } from '../core/damage.js';
import { generateAiBoard, pickAiAction } from '../core/ai.js';
import { rotateSpriteDataUrl } from '../core/sprite.js';
import { makeCharacterId, statsFromPoints, tierInfo } from '../core/characters.js';

function initialBattleState() {
  return {
    turnNumber: 1,
    timeLeft: TURN_SECONDS,
    selectedAttackerId: null,
    orientation: 'H',
    pendingTarget: null,
    resolving: false,
    log: [],
    stats: { shotsPlayer: 0, hitsPlayer: 0 },
  };
}

export const useGameStore = defineStore('game', {
  state: () => ({
    phase: 'title', // 'title' | 'creating' | 'placing' | 'battle' | 'end'
    createdCharacters: [], // personagens já criados, aguardando posicionamento (sem x/y)
    placingIndex: 0, // índice em createdCharacters do próximo a posicionar
    playerBoard: createBoard(BOARD_SIZE),
    aiBoard: null,
    editingCharacterId: null, // id do personagem já criado sendo editado, ou null
    editingCharacterData: null, // snapshot do personagem removido de createdCharacters para edição
    editingCharacterIndex: null, // posição original em createdCharacters, para reinserir no mesmo lugar
    battle: initialBattleState(),
    winner: null,
  }),

  getters: {
    currentAttacker(state) {
      if (!state.playerBoard) return null;
      return state.playerBoard.characters.find((c) => c.id === state.battle.selectedAttackerId) ?? null;
    },
    pendingChar(state) {
      if (state.phase !== 'placing') return null;
      return state.createdCharacters[state.placingIndex] ?? null;
    },
    placedCount(state) {
      return state.playerBoard.characters.length;
    },
    allPlaced(state) {
      return state.playerBoard.characters.length === CHAR_COUNT;
    },
  },

  actions: {
    confirmCharacterCreation({ name, w, h, attackType, atkPoints, hpPoints, defPoints, spriteUrl }) {
      const tier = tierInfo(w, h);
      const stats = statsFromPoints({ atkPoints, hpPoints, defPoints });
      const character = {
        id: makeCharacterId('p', this.createdCharacters.length),
        name: name || `Personagem ${this.createdCharacters.length + 1}`,
        w,
        h,
        tierName: tier.name,
        atkPoints,
        hpPoints,
        defPoints,
        atk: stats.atk,
        def: stats.def,
        hpMax: stats.hp,
        hpCur: stats.hp,
        attackType,
        alive: true,
        revealed: true,
        spriteUrl,
      };
      this.createdCharacters.push(character);

      if (this.createdCharacters.length === CHAR_COUNT) {
        this.phase = 'placing';
        this.placingIndex = 0;
      }
    },

    placeCurrentCharacter(x, y) {
      const char = this.pendingChar;
      if (!char) return;
      if (!canPlace(this.playerBoard, char.w, char.h, x, y)) return;
      this.playerBoard = placeCharacter(this.playerBoard, char, x, y);
      this.placingIndex += 1;
    },

    // Troca w/h do personagem que está para ser posicionado agora (mesma
    // pegada de células, só a orientação muda) e rotaciona o sprite 90° pra
    // não ficar esticado/comprimido.
    async rotatePendingCharacter() {
      const idx = this.placingIndex;
      const char = this.createdCharacters[idx];
      if (!char) return;
      const rotatedUrl = await rotateSpriteDataUrl(char.spriteUrl);
      this.createdCharacters.splice(idx, 1, { ...char, w: char.h, h: char.w, spriteUrl: rotatedUrl });
    },

    // Varre todas as posições válidas do tabuleiro e escolhe uma aleatória
    // pro personagem que está para ser posicionado agora.
    placeRandomly() {
      const char = this.pendingChar;
      if (!char) return;
      const options = [];
      for (let y = 0; y <= this.playerBoard.size - char.h; y++) {
        for (let x = 0; x <= this.playerBoard.size - char.w; x++) {
          if (canPlace(this.playerBoard, char.w, char.h, x, y)) options.push({ x, y });
        }
      }
      if (options.length === 0) return;
      const { x, y } = options[Math.floor(Math.random() * options.length)];
      this.placeCurrentCharacter(x, y);
    },

    // Remove um personagem já criado de `createdCharacters` para reabrir sua
    // ficha na tela de criação. O tamanho (w/h) permanece travado — só nome,
    // tipo de ataque, atributos e sprite podem mudar. Só é permitido durante
    // a fase de criação (antes do posicionamento começar).
    startEditingCharacter(id) {
      if (this.phase !== 'creating' || this.editingCharacterId) return;
      const idx = this.createdCharacters.findIndex((c) => c.id === id);
      if (idx === -1) return;
      const [character] = this.createdCharacters.splice(idx, 1);
      this.editingCharacterId = id;
      this.editingCharacterData = character;
      this.editingCharacterIndex = idx;
    },

    cancelEditingCharacter() {
      if (!this.editingCharacterData) return;
      this.createdCharacters.splice(this.editingCharacterIndex, 0, this.editingCharacterData);
      this.editingCharacterId = null;
      this.editingCharacterData = null;
      this.editingCharacterIndex = null;
    },

    confirmCharacterEdit({ name, attackType, atkPoints, hpPoints, defPoints, spriteUrl }) {
      if (!this.editingCharacterData) return;
      const original = this.editingCharacterData;
      const stats = statsFromPoints({ atkPoints, hpPoints, defPoints });
      const updated = {
        ...original,
        name: name || original.name,
        attackType,
        atkPoints,
        hpPoints,
        defPoints,
        atk: stats.atk,
        def: stats.def,
        hpMax: stats.hp,
        hpCur: stats.hp,
        spriteUrl,
      };
      this.createdCharacters.splice(this.editingCharacterIndex, 0, updated);
      this.editingCharacterId = null;
      this.editingCharacterData = null;
      this.editingCharacterIndex = null;
    },

    startBattle() {
      if (this.playerBoard.characters.length !== CHAR_COUNT) return;
      this.aiBoard = generateAiBoard(Math.random, BOARD_SIZE, 16);
      this.battle = initialBattleState();
      this.battle.log.push({ turn: 1, text: '— Turno 1 —', kind: 'turn-head' });
      this.phase = 'battle';
    },

    selectAttacker(id) {
      this.battle.selectedAttackerId = id;
      this.battle.pendingTarget = null;
      this.battle.orientation = 'H';
    },

    setOrientation(orientation) {
      this.battle.orientation = orientation;
      this.battle.pendingTarget = null;
    },

    setPendingTarget(x, y) {
      // Não valida aqui de propósito: a validade real das células do padrão
      // só é checada na resolução do turno (fiel ao protótipo original).
      this.battle.pendingTarget = { x, y };
    },

    tickTimer() {
      this.battle.timeLeft -= 1;
      if (this.battle.timeLeft <= 0) {
        this.resolveTurn();
      }
    },

    _applySide(attacker, attackType, orientation, target, defenderBoardKey, attackerLabel) {
      const defenderBoard = this[defenderBoardKey];
      const cells = getAttackCells(attackType, target.x, target.y, orientation, defenderBoard.size).filter(
        ([cx, cy]) => isValidTarget(defenderBoard, cx, cy),
      );

      const isPlayer = attackerLabel === 'Você';
      if (isPlayer) this.battle.stats.shotsPlayer += cells.length;

      if (cells.length === 0) {
        this.battle.log.push({ turn: this.battle.turnNumber, text: `${attackerLabel} não teve alvos válidos.`, kind: 'miss' });
        return;
      }

      for (const [x, y] of cells) {
        const defender = defenderBoard.characters.find((c) => c.x <= x && x < c.x + c.w && c.y <= y && y < c.y + c.h);
        if (!defender) {
          this[defenderBoardKey] = markCellAttacked(this[defenderBoardKey], x, y);
          this.battle.log.push({
            turn: this.battle.turnNumber,
            text: `${attackerLabel} (${attacker.name}) atacou (${x + 1},${y + 1}) — ÁGUA.`,
            kind: 'miss',
          });
          continue;
        }

        if (isPlayer) this.battle.stats.hitsPlayer += 1;

        const wasRevealed = defender.revealed;
        this[defenderBoardKey] = revealCharacter(this[defenderBoardKey], defender.id);
        const isAnchorCell = x === target.x && y === target.y;
        const { amount, tag } = computeDamage(areaEffectiveAtk(attacker.atk, isAnchorCell, attackType), defender.def);
        this[defenderBoardKey] = applyDamageToCharacter(this[defenderBoardKey], defender.id, amount);

        const updated = this[defenderBoardKey].characters.find((c) => c.id === defender.id);
        const targetName = wasRevealed ? defender.name : `${defender.name} (revelado agora)`;
        const tagLabel = tag === 'CRITICO' ? ' — CRÍTICO' : tag === 'GRAZE' ? ' — DE RASPÃO' : '';
        const kind = tag === 'CRITICO' ? 'crit' : tag === 'GRAZE' ? 'graze' : '';

        if (updated.hpCur <= 0) {
          this.battle.log.push({
            turn: this.battle.turnNumber,
            text: `${attackerLabel} (${attacker.name}) atingiu ${targetName} em (${x + 1},${y + 1}): ${amount} de dano${tagLabel}. ELIMINADO!`,
            kind,
          });
        } else {
          this.battle.log.push({
            turn: this.battle.turnNumber,
            text: `${attackerLabel} (${attacker.name}) atingiu ${targetName} em (${x + 1},${y + 1}): ${amount} de dano${tagLabel}. (${updated.hpCur}/${updated.hpMax} HP)`,
            kind,
          });
        }
      }
    },

    resolveTurn() {
      if (this.battle.resolving) return;
      this.battle.resolving = true;

      const attacker = this.currentAttacker;
      if (attacker && this.battle.pendingTarget) {
        this._applySide(attacker, attacker.attackType, this.battle.orientation, this.battle.pendingTarget, 'aiBoard', 'Você');
      } else {
        this.battle.log.push({ turn: this.battle.turnNumber, text: 'Você não escolheu personagem/alvo a tempo — turno perdido.', kind: 'miss' });
      }

      const aiAction = pickAiAction(this.aiBoard, this.playerBoard);
      if (aiAction) {
        const aiAttacker = this.aiBoard.characters.find((c) => c.id === aiAction.attackerId);
        this._applySide(aiAttacker, aiAttacker.attackType, aiAction.orientation, aiAction, 'playerBoard', 'Inimigo');
      }

      this.battle.selectedAttackerId = null;
      this.battle.pendingTarget = null;
      this.battle.orientation = 'H';

      const playerLost = allDead(this.playerBoard);
      const aiLost = allDead(this.aiBoard);

      if (playerLost || aiLost) {
        this.winner = aiLost ? 'player' : 'ai';
        this.phase = 'end';
        this.battle.resolving = false;
        return;
      }

      this.battle.turnNumber += 1;
      this.battle.timeLeft = TURN_SECONDS;
      this.battle.log.push({ turn: this.battle.turnNumber, text: `— Turno ${this.battle.turnNumber} —`, kind: 'turn-head' });
      this.battle.resolving = false;
    },

    _resetState() {
      this.createdCharacters = [];
      this.placingIndex = 0;
      this.playerBoard = createBoard(BOARD_SIZE);
      this.aiBoard = null;
      this.editingCharacterId = null;
      this.editingCharacterData = null;
      this.editingCharacterIndex = null;
      this.battle = initialBattleState();
      this.winner = null;
    },

    resetGame() {
      this._resetState();
      this.phase = 'title';
    },

    startNewGame() {
      this._resetState();
      this.phase = 'creating';
    },
  },
});
