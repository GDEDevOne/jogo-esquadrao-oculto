import { describe, expect, it } from 'vitest';
import { areaEffectiveAtk, computeDamage } from '../damage.js';
import { statsFromPoints } from '../characters.js';
import { ATTACK_TYPE_LIST } from '../constants.js';

// PRNG determinístico (mulberry32) para a simulação ser reprodutível.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Builds representativas dos extremos e do meio-termo da escala real de
// atributos (1-4 pontos por atributo). Não precisam bater com o orçamento
// exato de nenhum tier — o objetivo é estressar a fórmula de dano nos
// extremos (glass cannon / tanque) e no meio (equilibrado), não simular uma
// criação de personagem válida na UI.
const GLASS_CANNON = statsFromPoints({ atkPoints: 4, hpPoints: 1, defPoints: 1 });
const TANK = statsFromPoints({ atkPoints: 1, hpPoints: 4, defPoints: 4 });
const BALANCED = statsFromPoints({ atkPoints: 2, hpPoints: 2, defPoints: 2 });

function simulateDuel(a, b, rng, maxTurns = 200) {
  let hpA = a.hp;
  let hpB = b.hp;
  const amounts = [];
  let turns = 0;
  while (hpA > 0 && hpB > 0 && turns < maxTurns) {
    const toB = computeDamage(a.atk, b.def, rng).amount;
    const toA = computeDamage(b.atk, a.def, rng).amount;
    amounts.push(toB, toA);
    hpB -= toB;
    hpA -= toA;
    turns++;
  }
  let winner;
  if (hpA <= 0 && hpB <= 0) winner = 'draw';
  else if (hpB <= 0) winner = 'a';
  else if (hpA <= 0) winner = 'b';
  else winner = 'timeout';
  return { winner, turns, amounts };
}

function runTrials(a, b, trials, rng) {
  const tally = { a: 0, b: 0, draw: 0, timeout: 0 };
  const allAmounts = [];
  let turnsSum = 0;
  for (let i = 0; i < trials; i++) {
    const { winner, turns, amounts } = simulateDuel(a, b, rng);
    tally[winner]++;
    turnsSum += turns;
    allAmounts.push(...amounts);
  }
  return { tally, allAmounts, avgTurns: turnsSum / trials };
}

describe('Simulação de balanceamento (Monte Carlo, duelos 1v1)', () => {
  const TRIALS = 500;

  it('build tanque não perde quase sempre contra build equilibrada', () => {
    const rng = mulberry32(12345);
    const { tally, avgTurns } = runTrials(TANK, BALANCED, TRIALS, rng);
    const tankWinRate = (tally.a + tally.draw * 0.5) / TRIALS;
    console.log(
      `[Tanque vs Equilibrado] ATK/HP/DEF tanque=${TANK.atk}/${TANK.hp}/${TANK.def}` +
        ` equilibrado=${BALANCED.atk}/${BALANCED.hp}/${BALANCED.def}` +
        ` — vitórias tanque=${tally.a} equilibrado=${tally.b} empates=${tally.draw}` +
        ` (winrate tanque=${(tankWinRate * 100).toFixed(1)}%, turnos médios=${avgTurns.toFixed(2)})`,
    );
    expect(tankWinRate).toBeGreaterThan(0.15);
  });

  it('glass cannon vs tanque e vs equilibrado: nenhum lado é impossível de vencer', () => {
    const rng = mulberry32(42);
    const gcVsTank = runTrials(GLASS_CANNON, TANK, TRIALS, rng);
    const gcVsBalanced = runTrials(GLASS_CANNON, BALANCED, TRIALS, rng);
    console.log(
      `[Glass Cannon vs Tanque] vitórias GC=${gcVsTank.tally.a} tanque=${gcVsTank.tally.b}` +
        ` empates=${gcVsTank.tally.draw} (turnos médios=${gcVsTank.avgTurns.toFixed(2)})`,
    );
    console.log(
      `[Glass Cannon vs Equilibrado] vitórias GC=${gcVsBalanced.tally.a} equilibrado=${gcVsBalanced.tally.b}` +
        ` empates=${gcVsBalanced.tally.draw} (turnos médios=${gcVsBalanced.avgTurns.toFixed(2)})`,
    );
    expect(gcVsTank.tally.a).toBeGreaterThan(0);
    expect(gcVsTank.tally.b).toBeGreaterThan(0);
  });

  it('nenhum confronto trava em dano determinístico (sempre 1, sem variação) — caso extremo DEF > ATK dos dois lados', () => {
    // Tanque vs tanque: ATK(15) < DEF(16) para os dois lados — é exatamente o
    // caso que travava em dano=1 sempre com a fórmula linear antiga.
    const rng = mulberry32(999);
    const { allAmounts, tally } = runTrials(TANK, TANK, 100, rng);
    const unique = new Set(allAmounts);
    console.log(
      `[Tanque vs Tanque] ${allAmounts.length} rolagens de dano — valores distintos observados: ${unique.size}` +
        ` (min=${Math.min(...allAmounts)}, max=${Math.max(...allAmounts)}) — resultado: a=${tally.a} b=${tally.b} empates=${tally.draw}`,
    );
    expect(unique.size).toBeGreaterThan(1);
  });

  it('ataque em área contra alvos agrupados não ultrapassa ~3x o dano de um ataque único no mesmo turno (Área 3x3 incluída)', () => {
    const expectedRatio = { unico: 1, linha3: 2, cruz: 3, area2x2: 2.5, area3x3: 3 };
    for (const type of ATTACK_TYPE_LIST) {
      if (type.id === 'unico') continue;
      const anchorAtk = areaEffectiveAtk(BALANCED.atk, true, type.id);
      const secondaryAtk = areaEffectiveAtk(BALANCED.atk, false, type.id);
      const secondaryCells = type.cellCount - 1;
      // Pior caso teórico: todas as células do padrão acertam personagens
      // distintos (nenhuma célula desperdiçada em água ou no mesmo alvo).
      const worstCaseRatio = (anchorAtk + secondaryCells * secondaryAtk) / anchorAtk;
      console.log(
        `[Área] ${type.label} (${type.cellCount} células, taxa secundária=${type.secondaryAtkRatio}) — pior caso (todas em alvos distintos): ${worstCaseRatio.toFixed(2)}x um ataque Único`,
      );
      expect(worstCaseRatio).toBeCloseTo(expectedRatio[type.id], 5);
      expect(worstCaseRatio).toBeLessThanOrEqual(3);
    }
  });
});
