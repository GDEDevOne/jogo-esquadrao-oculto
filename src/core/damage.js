import {
  ATTACK_TYPES,
  CRIT_CHANCE,
  CRIT_MULT,
  DAMAGE_VARIANCE_MIN,
  DAMAGE_VARIANCE_RANGE,
  DEF_MITIGATION_CONSTANT,
  GRAZE_MULT,
  GRAZE_UPPER,
} from './constants.js';

/**
 * ATK efetivo usado no cálculo de dano de uma célula do padrão de ataque: a
 * célula mirada diretamente (âncora) usa o ATK cheio; as demais células do
 * padrão usam ATK reduzido pela `secondaryAtkRatio` do tipo de ataque (cada
 * tipo define a própria taxa em ATTACK_TYPES — a Área 3x3 usa uma taxa menor
 * que os demais para não ultrapassar o teto de dano em área).
 */
export function areaEffectiveAtk(atk, isAnchorCell, attackType) {
  if (isAnchorCell) return atk;
  const ratio = ATTACK_TYPES[attackType]?.secondaryAtkRatio ?? 0.5;
  return atk * ratio;
}

/**
 * Calcula o dano de um ataque. Consome `rng()` exatamente duas vezes, nesta
 * ordem: 1) variância, 2) rolagem de crítico/de raspão. Manter essa ordem é
 * importante para os testes com rng mockado.
 *
 * O dano-base usa mitigação percentual (não subtração linear): mesmo uma
 * defesa muito alta nunca zera o dano-base antes da variância/crítico serem
 * aplicados, o que evita duelos onde o resultado trava sempre em 1 sem
 * nenhuma variação.
 */
export function computeDamage(attackerAtk, defenderDef, rng = Math.random) {
  const base = attackerAtk * (DEF_MITIGATION_CONSTANT / (DEF_MITIGATION_CONSTANT + defenderDef));
  const variance = DAMAGE_VARIANCE_MIN + rng() * DAMAGE_VARIANCE_RANGE;
  const roll = rng();

  let mult = 1;
  let tag = null;
  if (roll < CRIT_CHANCE) {
    mult = CRIT_MULT;
    tag = 'CRITICO';
  } else if (roll < GRAZE_UPPER) {
    mult = GRAZE_MULT;
    tag = 'GRAZE';
  }

  const amount = Math.max(1, Math.round(base * variance * mult));
  return { amount, tag };
}
