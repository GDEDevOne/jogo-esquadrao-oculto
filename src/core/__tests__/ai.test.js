import { describe, expect, it } from 'vitest';
import { distributePointsRandomly } from '../characters.js';
import { pickAiAction } from '../ai.js';
import { createBoard, placeCharacter } from '../board.js';

// rng determinístico simples que cicla por uma lista de valores
function cyclicRng(values) {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}

describe('distributePointsRandomly', () => {
  it('a soma dos pontos totais é sempre igual ao total do tier + 3 (o base de cada atributo)', () => {
    for (const tierPoints of [5, 6, 7]) {
      const rng = cyclicRng([0.1, 0.4, 0.7, 0.2, 0.9, 0.3]);
      const { atk, hp, def } = distributePointsRandomly(tierPoints, rng);
      expect(atk + hp + def).toBe(tierPoints + 3);
    }
  });

  it('nenhum atributo passa do máximo de 4 pontos (1 base + 3 extras)', () => {
    const rng = () => 0; // sempre escolhe o primeiro disponível
    const { atk, hp, def } = distributePointsRandomly(8, rng);
    expect(atk).toBeLessThanOrEqual(4);
    expect(hp).toBeLessThanOrEqual(4);
    expect(def).toBeLessThanOrEqual(4);
  });

  it('nenhum atributo fica abaixo do mínimo de 1 ponto (o base)', () => {
    const rng = () => 0.99;
    const { atk, hp, def } = distributePointsRandomly(5, rng);
    expect(atk).toBeGreaterThanOrEqual(1);
    expect(hp).toBeGreaterThanOrEqual(1);
    expect(def).toBeGreaterThanOrEqual(1);
  });
});

describe('pickAiAction', () => {
  function makeChar(overrides = {}) {
    return {
      id: 'a1',
      name: 'IA',
      w: 1,
      h: 1,
      atk: 10,
      def: 0,
      hpMax: 10,
      hpCur: 10,
      alive: true,
      revealed: false,
      attackType: 'unico',
      ...overrides,
    };
  }

  it('escolhe uma âncora cujo padrão tem pelo menos um alvo válido', () => {
    let aiBoard = createBoard(5);
    aiBoard = placeCharacter(aiBoard, makeChar(), 0, 0);
    const playerBoard = createBoard(5); // tudo água nova, tudo válido

    const rng = cyclicRng([0, 0, 0]);
    const action = pickAiAction(aiBoard, playerBoard, rng);

    expect(action).not.toBeNull();
    expect(action.attackerId).toBe('a1');
    expect(action.x).toBeGreaterThanOrEqual(0);
    expect(action.y).toBeGreaterThanOrEqual(0);
  });

  it('retorna null quando não há personagens vivos na IA', () => {
    let aiBoard = createBoard(5);
    aiBoard = placeCharacter(aiBoard, makeChar({ alive: false }), 0, 0);
    const playerBoard = createBoard(5);
    expect(pickAiAction(aiBoard, playerBoard, () => 0)).toBeNull();
  });

  it('retorna null quando não há nenhuma célula válida no tabuleiro do jogador', () => {
    let aiBoard = createBoard(2);
    aiBoard = placeCharacter(aiBoard, makeChar(), 0, 0);
    // marca todas as células do tabuleiro 2x2 do jogador como água já atacada
    let playerBoard = createBoard(2);
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        playerBoard.attackedCells.add(`${x}_${y}`);
      }
    }
    expect(pickAiAction(aiBoard, playerBoard, () => 0)).toBeNull();
  });
});
