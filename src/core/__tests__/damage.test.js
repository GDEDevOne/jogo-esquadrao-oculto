import { describe, expect, it } from 'vitest';
import { computeDamage } from '../damage.js';

// rng mockado: retorna a sequência dada, em ordem (variância, depois rolagem).
function sequenceRng(values) {
  let i = 0;
  return () => values[i++];
}

describe('computeDamage', () => {
  it('aplica mitigação percentual: DEF igual a 100 corta o ATK pela metade', () => {
    // base = 100 * (100/(100+100)) = 50 ; variância 1.0 ; rolagem normal
    const { amount, tag } = computeDamage(100, 100, sequenceRng([0.5, 0.5]));
    expect(amount).toBe(50);
    expect(tag).toBeNull();
  });

  it('sem defesa, o dano-base é igual ao ATK cheio', () => {
    const { amount } = computeDamage(100, 0, sequenceRng([0.5, 0.5]));
    expect(amount).toBe(100);
  });

  it('aplica crítico (x2) quando a rolagem é menor que 0.15', () => {
    const { amount, tag } = computeDamage(100, 100, sequenceRng([0.5, 0.1]));
    expect(tag).toBe('CRITICO');
    expect(amount).toBe(100); // base=50, variancia=1.0, mult=2
  });

  it('aplica de raspão (x0.5) quando a rolagem está entre 0.15 e 0.25', () => {
    const { amount, tag } = computeDamage(100, 100, sequenceRng([0.5, 0.2]));
    expect(tag).toBe('GRAZE');
    expect(amount).toBe(25); // base=50, variancia=1.0, mult=0.5
  });

  it('nunca retorna dano menor que 1, mesmo com defesa muitíssimo maior que o ataque', () => {
    const { amount } = computeDamage(1, 100000, sequenceRng([0.9, 0.9]));
    expect(amount).toBe(1);
  });

  it('respeita os limites da variância (0.8x e 1.2x)', () => {
    const low = computeDamage(100, 0, sequenceRng([0, 0.9])); // variancia = 0.8
    expect(low.amount).toBe(80);
    const high = computeDamage(100, 0, sequenceRng([1, 0.9])); // variancia = 1.2
    expect(high.amount).toBe(120);
  });

  it('defesa alta nunca zera o dano-base antes da variância (sem travar em 1 sempre)', () => {
    // com defesa muito maior que o ataque, o dano-base ainda é positivo
    // (só pequeno), então diferentes rolagens de variância/crítico ainda
    // produzem valores diferentes em vez de sempre arredondar para o mesmo.
    const amounts = new Set();
    let seed = 1;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 50; i++) {
      amounts.add(computeDamage(30, 200, rng).amount);
    }
    expect(amounts.size).toBeGreaterThan(1);
  });
});
