import { describe, expect, it } from 'vitest';
import { clipToBoard, getAttackCells, getRawAttackCells } from '../attackPatterns.js';

describe('getRawAttackCells', () => {
  it('unico atinge apenas a célula clicada', () => {
    expect(getRawAttackCells('unico', 5, 5)).toEqual([[5, 5]]);
  });

  it('linha3 usa a âncora como centro, horizontal por padrão', () => {
    expect(getRawAttackCells('linha3', 5, 5, 'H')).toEqual([[4, 5], [5, 5], [6, 5]]);
  });

  it('linha3 vertical usa a âncora como centro', () => {
    expect(getRawAttackCells('linha3', 5, 5, 'V')).toEqual([[5, 4], [5, 5], [5, 6]]);
  });

  it('cruz atinge o centro e os 4 vizinhos ortogonais', () => {
    expect(getRawAttackCells('cruz', 5, 5)).toEqual([[5, 5], [4, 5], [6, 5], [5, 4], [5, 6]]);
  });

  it('area2x2 usa o ponto clicado como canto superior-esquerdo', () => {
    expect(getRawAttackCells('area2x2', 5, 5)).toEqual([[5, 5], [6, 5], [5, 6], [6, 6]]);
  });

  it('area3x3 usa a âncora como centro do bloco 3x3', () => {
    expect(getRawAttackCells('area3x3', 5, 5)).toEqual([
      [4, 4], [5, 4], [6, 4],
      [4, 5], [5, 5], [6, 5],
      [4, 6], [5, 6], [6, 6],
    ]);
  });
});

describe('clipToBoard', () => {
  it('remove células fora dos limites do tabuleiro', () => {
    const cells = [[-1, 0], [0, 0], [29, 29], [30, 29]];
    expect(clipToBoard(cells, 30)).toEqual([[0, 0], [29, 29]]);
  });

  it('cruz no canto (0,0) perde as células que extrapolam', () => {
    const cells = getAttackCells('cruz', 0, 0, 'H', 30);
    expect(cells).toEqual([[0, 0], [1, 0], [0, 1]]);
  });
});
