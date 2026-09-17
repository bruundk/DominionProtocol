/** Market balance constants. Percentages use basis points for deterministic math. */
export const MARKET_COST = 250_000;
export const MARKET_CONSTRUCTION_TICKS = 3 * 10;
export const MARKET_FULL_BONUS_COUNT = 3;
export const MARKET_FULL_BONUS_BPS = 1_000; // 10%
export const MARKET_DIMINISHED_BONUS_BPS = 200; // 2%
export const MARKET_MAX_BONUS_BPS = 4_000; // 40%
export const BASIS_POINTS = 10_000;

export function marketBonusBasisPoints(enabledMarkets: number): number {
  const count = Math.max(0, Math.floor(enabledMarkets));
  const full = Math.min(count, MARKET_FULL_BONUS_COUNT);
  const diminished = Math.max(0, count - MARKET_FULL_BONUS_COUNT);
  return Math.min(
    MARKET_MAX_BONUS_BPS,
    full * MARKET_FULL_BONUS_BPS + diminished * MARKET_DIMINISHED_BONUS_BPS,
  );
}
