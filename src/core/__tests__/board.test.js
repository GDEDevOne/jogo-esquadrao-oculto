import { describe, expect, it } from 'vitest';
import {
  allDead,
  applyDamageToCharacter,
  canPlace,
  createBoard,
  isValidTarget,
  markCellAttacked,
  placeCharacter,
  removeCharacter,
} from '../board.js';

function makeChar(overrides = {}) {
  return {
    id: 'p1',
    name: 'Teste',
    w: 3,
    h: 3,
    hpMax: 20,
    hpCur: 20,
    alive: true,
    revealed: false,
    ...overrides,
  };
}

describe('canPlace', () => {
  it('rejeita posições fora dos limites do tabuleiro', () => {
    const board = createBoard(30);
    expect(canPlace(board, 3, 3, 28, 28)).toBe(false);
    expect(canPlace(board, 3, 3, -1, 0)).toBe(false);
  });

  it('permite posicionar dentro dos limites sem sobreposição', () => {
    const board = createBoard(30);
    expect(canPlace(board, 3, 3, 0, 0)).toBe(true);
  });

  it('rejeita sobreposição parcial ou total com outro personagem', () => {
    let board = createBoard(30);
    board = placeCharacter(board, makeChar(), 0, 0); // ocupa (0,0)-(2,2)
    expect(canPlace(board, 3, 3, 2, 2)).toBe(false); // sobreposição parcial em (2,2)
    expect(canPlace(board, 3, 3, 0, 0)).toBe(false); // sobreposição total
  });

  it('permite personagens lado a lado sem espaço obrigatório', () => {
    let board = createBoard(30);
    board = placeCharacter(board, makeChar(), 0, 0); // (0,0)-(2,2)
    expect(canPlace(board, 3, 3, 3, 0)).toBe(true); // encostado, sem gap
  });
});

describe('removeCharacter', () => {
  it('remove o personagem e libera a célula para um novo posicionamento', () => {
    let board = createBoard(30);
    board = placeCharacter(board, makeChar({ id: 'p1' }), 0, 0);
    expect(canPlace(board, 3, 3, 0, 0)).toBe(false);

    board = removeCharacter(board, 'p1');
    expect(board.characters).toHaveLength(0);
    expect(canPlace(board, 3, 3, 0, 0)).toBe(true);
  });
});

describe('placeCharacter', () => {
  it('retorna um novo board e mantém o original intacto (imutabilidade)', () => {
    const board = createBoard(30);
    const next = placeCharacter(board, makeChar(), 0, 0);
    expect(next).not.toBe(board);
    expect(board.characters).toHaveLength(0);
    expect(next.characters).toHaveLength(1);
  });

  it('lança erro ao tentar posicionar em local inválido', () => {
    const board = createBoard(30);
    expect(() => placeCharacter(board, makeChar(), -1, 0)).toThrow();
  });
});

describe('isValidTarget', () => {
  it('personagem vivo é sempre alvo válido, mesmo já atingido antes', () => {
    let board = createBoard(30);
    board = placeCharacter(board, makeChar({ alive: true }), 0, 0);
    board = markCellAttacked(board, 0, 0);
    expect(isValidTarget(board, 0, 0)).toBe(true);
  });

  it('personagem morto não é alvo válido', () => {
    let board = createBoard(30);
    board = placeCharacter(board, makeChar({ alive: false }), 0, 0);
    expect(isValidTarget(board, 0, 0)).toBe(false);
  });

  it('célula vazia já atacada (água) não é alvo válido', () => {
    let board = createBoard(30);
    board = markCellAttacked(board, 5, 5);
    expect(isValidTarget(board, 5, 5)).toBe(false);
  });

  it('célula vazia nunca atacada é alvo válido', () => {
    const board = createBoard(30);
    expect(isValidTarget(board, 5, 5)).toBe(true);
  });
});

describe('applyDamageToCharacter', () => {
  it('reduz o HP e mata o personagem ao chegar a 0', () => {
    let board = createBoard(30);
    board = placeCharacter(board, makeChar({ hpCur: 10, hpMax: 10 }), 0, 0);
    board = applyDamageToCharacter(board, 'p1', 15);
    const char = board.characters[0];
    expect(char.hpCur).toBe(0);
    expect(char.alive).toBe(false);
  });
});

describe('allDead', () => {
  it('retorna false se pelo menos um personagem está vivo', () => {
    let board = createBoard(30);
    board = placeCharacter(board, makeChar({ id: 'p1', alive: true }), 0, 0);
    board = placeCharacter(board, makeChar({ id: 'p2', alive: false }), 5, 5);
    expect(allDead(board)).toBe(false);
  });

  it('retorna true quando todos os personagens estão mortos', () => {
    let board = createBoard(30);
    board = placeCharacter(board, makeChar({ id: 'p1', alive: false }), 0, 0);
    board = placeCharacter(board, makeChar({ id: 'p2', alive: false }), 5, 5);
    expect(allDead(board)).toBe(true);
  });
});
