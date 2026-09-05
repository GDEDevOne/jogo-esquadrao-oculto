import { BOARD_SIZE } from './constants.js';

/**
 * Board imutável: toda função aqui retorna um NOVO board em vez de mutar o
 * recebido. Isso torna o estado fácil de testar e integra bem com a
 * reatividade do Pinia (reatribuição explícita dispara updates).
 */

export function createBoard(size = BOARD_SIZE) {
  return { size, characters: [], attackedCells: new Set() };
}

function cloneBoard(board) {
  return {
    size: board.size,
    characters: board.characters.map((c) => ({ ...c })),
    attackedCells: new Set(board.attackedCells),
  };
}

export function getCharacterCells(character) {
  const cells = [];
  for (let dy = 0; dy < character.h; dy++) {
    for (let dx = 0; dx < character.w; dx++) {
      cells.push({ x: character.x + dx, y: character.y + dy });
    }
  }
  return cells;
}

export function isWithinBounds(board, x, y, w, h) {
  return x >= 0 && y >= 0 && x + w <= board.size && y + h <= board.size;
}

export function canPlace(board, w, h, x, y) {
  if (!isWithinBounds(board, x, y, w, h)) return false;
  for (const character of board.characters) {
    const overlapsX = x < character.x + character.w && x + w > character.x;
    const overlapsY = y < character.y + character.h && y + h > character.y;
    if (overlapsX && overlapsY) return false;
  }
  return true;
}

export function placeCharacter(board, character, x, y) {
  if (!canPlace(board, character.w, character.h, x, y)) {
    throw new Error(`Não é possível posicionar "${character.name}" em (${x},${y}).`);
  }
  const next = cloneBoard(board);
  next.characters.push({ ...character, x, y });
  return next;
}

export function removeCharacter(board, characterId) {
  const next = cloneBoard(board);
  next.characters = next.characters.filter((c) => c.id !== characterId);
  return next;
}

export function findCharacterAt(board, x, y) {
  return board.characters.find((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
}

const cellKey = (x, y) => `${x}_${y}`;

/**
 * Regra de alvo válido:
 * - célula com personagem vivo -> sempre válida (mesmo já atingida antes)
 * - célula com personagem morto -> inválida
 * - célula vazia já atacada (água) -> inválida (não pode reselecionar)
 * - célula vazia nunca atacada -> válida
 */
export function isValidTarget(board, x, y) {
  const character = findCharacterAt(board, x, y);
  if (character) return character.alive;
  return !board.attackedCells.has(cellKey(x, y));
}

export function markCellAttacked(board, x, y) {
  const next = cloneBoard(board);
  next.attackedCells.add(cellKey(x, y));
  return next;
}

export function applyDamageToCharacter(board, characterId, amount) {
  const next = cloneBoard(board);
  const character = next.characters.find((c) => c.id === characterId);
  if (!character) return next;
  character.hpCur = Math.max(0, character.hpCur - amount);
  character.alive = character.hpCur > 0;
  return next;
}

export function revealCharacter(board, characterId) {
  const next = cloneBoard(board);
  const character = next.characters.find((c) => c.id === characterId);
  if (character) character.revealed = true;
  return next;
}

export function allDead(board) {
  return board.characters.length > 0 && board.characters.every((c) => !c.alive);
}
