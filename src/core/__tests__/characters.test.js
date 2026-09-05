import { describe, expect, it } from 'vitest';
import { isValidAttributeDistribution, statsFromPoints, tierInfo } from '../characters.js';

describe('tierInfo', () => {
  it('classifica corretamente nas fronteiras exatas', () => {
    expect(tierInfo(4, 4)).toMatchObject({ area: 16, name: 'Pequeno', points: 5 });
    expect(tierInfo(4, 5)).toMatchObject({ area: 20, name: 'Médio', points: 6 });
    expect(tierInfo(7, 7)).toMatchObject({ area: 49, name: 'Médio', points: 6 });
    expect(tierInfo(5, 10)).toMatchObject({ area: 50, name: 'Grande', points: 8 });
    expect(tierInfo(10, 10)).toMatchObject({ area: 100, name: 'Grande', points: 8 });
  });
});

describe('statsFromPoints', () => {
  it('calcula os stats no ponto mínimo (1 em cada atributo, sem pontos extras)', () => {
    expect(statsFromPoints({ atkPoints: 1, hpPoints: 1, defPoints: 1 })).toEqual({ atk: 15, hp: 30, def: 4 });
  });

  it('calcula os stats no ponto máximo (1 base + 3 extras = 4 em cada atributo)', () => {
    expect(statsFromPoints({ atkPoints: 4, hpPoints: 4, defPoints: 4 })).toEqual({ atk: 45, hp: 75, def: 16 });
  });
});

describe('isValidAttributeDistribution', () => {
  it('aceita uma distribuição cujos pontos extras (além do base) somam o total do tier', () => {
    // extras: (4-1) + (3-1) + (2-1) = 3 + 2 + 1 = 6
    expect(isValidAttributeDistribution(6, { atk: 4, hp: 3, def: 2 })).toBe(true);
  });

  it('rejeita distribuições cujos pontos extras não somam o total do tier', () => {
    // todos no base (1,1,1) => 0 pontos extras usados, tier libera 6
    expect(isValidAttributeDistribution(6, { atk: 1, hp: 1, def: 1 })).toBe(false);
  });

  it('rejeita qualquer atributo fora do intervalo [1,4]', () => {
    expect(isValidAttributeDistribution(8, { atk: 5, hp: 1, def: 3 })).toBe(false);
    expect(isValidAttributeDistribution(8, { atk: 0, hp: 5, def: 3 })).toBe(false);
  });
});
