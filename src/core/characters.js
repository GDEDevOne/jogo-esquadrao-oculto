import {
  ATK_BASE,
  ATK_PER_POINT,
  DEF_PER_POINT,
  HP_BASE,
  HP_PER_POINT,
  MAX_CHAR_SIZE,
  MIN_CHAR_SIZE,
  STAT_MAX_POINTS,
  STAT_MIN_POINTS,
  TIERS,
} from './constants.js';

export function clampSize(value, min = MIN_CHAR_SIZE, max = MAX_CHAR_SIZE) {
  const n = Number.isFinite(value) ? Math.round(value) : min;
  return Math.min(max, Math.max(min, n));
}

export function tierInfo(w, h) {
  const area = w * h;
  const tier = TIERS.find((t) => area <= t.maxArea) ?? TIERS[TIERS.length - 1];
  return { area, name: tier.name, points: tier.points };
}

export function statsFromPoints({ atkPoints, hpPoints, defPoints }) {
  return {
    atk: ATK_BASE + atkPoints * ATK_PER_POINT,
    hp: HP_BASE + hpPoints * HP_PER_POINT,
    def: defPoints * DEF_PER_POINT,
  };
}

/**
 * `tierPoints` é o total de pontos EXTRAS (além do 1 ponto base obrigatório
 * de cada atributo) que o tier libera para distribuir livremente.
 */
export function isValidAttributeDistribution(tierPoints, { atk, hp, def }) {
  const inRange = (v) => v >= STAT_MIN_POINTS && v <= STAT_MAX_POINTS;
  if (!inRange(atk) || !inRange(hp) || !inRange(def)) return false;
  const extraUsed = atk - STAT_MIN_POINTS + (hp - STAT_MIN_POINTS) + (def - STAT_MIN_POINTS);
  return extraUsed === tierPoints;
}

/**
 * Distribui pontos aleatoriamente entre ATK/HP/DEF, começando em 1/1/1
 * (o base obrigatório) e incrementando aleatoriamente entre os atributos
 * que ainda não atingiram o máximo, até esgotar os pontos extras do tier.
 * Replica randomDistributePoints() do protótipo original.
 */
export function distributePointsRandomly(tierPoints, rng = Math.random) {
  const points = { atk: STAT_MIN_POINTS, hp: STAT_MIN_POINTS, def: STAT_MIN_POINTS };
  let remaining = tierPoints;
  while (remaining > 0) {
    const available = ['atk', 'hp', 'def'].filter((key) => points[key] < STAT_MAX_POINTS);
    if (available.length === 0) break;
    const pick = available[Math.floor(rng() * available.length)];
    points[pick] += 1;
    remaining -= 1;
  }
  return points;
}

export function makeCharacterId(prefix, index) {
  return `${prefix}${index}`;
}
