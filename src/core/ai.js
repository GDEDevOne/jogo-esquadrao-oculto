import { AI_MAX_SIZE, AI_MIN_SIZE, ATTACK_TYPE_LIST, BOARD_SIZE, CHAR_COUNT, ENEMY_NAME_POOL } from './constants.js';
import { canPlace, createBoard, isValidTarget, placeCharacter } from './board.js';
import { distributePointsRandomly, makeCharacterId, statsFromPoints, tierInfo } from './characters.js';
import { getAttackCells } from './attackPatterns.js';
import { randomSpriteDataUrl } from './sprite.js';

function pickName(usedNames, rng) {
  const remaining = ENEMY_NAME_POOL.filter((n) => !usedNames.has(n));
  const pool = remaining.length > 0 ? remaining : ENEMY_NAME_POOL;
  return pool[Math.floor(rng() * pool.length)];
}

export function randomAiCharacterDefs(count = CHAR_COUNT, rng = Math.random, cellPx = 16) {
  const usedNames = new Set();
  const defs = [];
  for (let i = 0; i < count; i++) {
    const w = AI_MIN_SIZE + Math.floor(rng() * (AI_MAX_SIZE - AI_MIN_SIZE + 1));
    const h = AI_MIN_SIZE + Math.floor(rng() * (AI_MAX_SIZE - AI_MIN_SIZE + 1));
    const tier = tierInfo(w, h);
    const points = distributePointsRandomly(tier.points, rng);
    const stats = statsFromPoints({ atkPoints: points.atk, hpPoints: points.hp, defPoints: points.def });
    const name = pickName(usedNames, rng);
    usedNames.add(name);
    const attackType = ATTACK_TYPE_LIST[Math.floor(rng() * ATTACK_TYPE_LIST.length)].id;

    defs.push({
      id: makeCharacterId('a', i),
      name,
      w,
      h,
      atkPoints: points.atk,
      hpPoints: points.hp,
      defPoints: points.def,
      atk: stats.atk,
      def: stats.def,
      hpMax: stats.hp,
      hpCur: stats.hp,
      alive: true,
      revealed: false,
      attackType,
      spriteUrl: randomSpriteDataUrl(w, h, cellPx, rng),
    });
  }
  return defs;
}

export function generateAiBoard(rng = Math.random, size = BOARD_SIZE, cellPx = 16) {
  let board = createBoard(size);
  const defs = randomAiCharacterDefs(CHAR_COUNT, rng, cellPx);

  for (const def of defs) {
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      const x = Math.floor(rng() * (size - def.w + 1));
      const y = Math.floor(rng() * (size - def.h + 1));
      if (canPlace(board, def.w, def.h, x, y)) {
        board = placeCharacter(board, def, x, y);
        placed = true;
      }
    }
    if (!placed) {
      outer: for (let y = 0; y <= size - def.h; y++) {
        for (let x = 0; x <= size - def.w; x++) {
          if (canPlace(board, def.w, def.h, x, y)) {
            board = placeCharacter(board, def, x, y);
            placed = true;
            break outer;
          }
        }
      }
    }
  }

  return board;
}

/**
 * Escolhe a ação da IA: um personagem vivo aleatório, orientação aleatória
 * (se aplicável), e uma âncora aleatória entre todas as que produzem pelo
 * menos uma célula de alvo válido no tabuleiro do oponente.
 */
export function pickAiAction(aiBoard, playerBoard, rng = Math.random) {
  const alive = aiBoard.characters.filter((c) => c.alive);
  if (alive.length === 0) return null;

  const attacker = alive[Math.floor(rng() * alive.length)];
  const orientation = rng() < 0.5 ? 'H' : 'V';

  const candidates = [];
  for (let y = 0; y < playerBoard.size; y++) {
    for (let x = 0; x < playerBoard.size; x++) {
      const cells = getAttackCells(attacker.attackType, x, y, orientation, playerBoard.size);
      if (cells.some(([cx, cy]) => isValidTarget(playerBoard, cx, cy))) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) return null;
  const anchor = candidates[Math.floor(rng() * candidates.length)];
  return { attackerId: attacker.id, x: anchor.x, y: anchor.y, orientation };
}
