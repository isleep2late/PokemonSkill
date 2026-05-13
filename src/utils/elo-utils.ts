// Elo display formula for PokemonSkill 1v1:
//   Elo = 1000 + 8 * (mu - 3 * sigma)
//
// The coefficient was reduced from cEDHSkill's 25 to 8 because 1v1 matches
// produce roughly 3x larger mu updates than 4-player free-for-all (the entire
// rating shift goes between two players instead of being split four ways).
// Combined with beta=20 in the OpenSkill rate() call (see rank.ts), this
// gives a brand-new player roughly +10 Elo for a win / -9 for a loss against
// a default-rated opponent, with the gain shrinking naturally as sigma drops.

const ELO_COEFFICIENT = 8;

export function calculateElo(mu: number, sigma: number): number {
  return Math.round(1000 + ELO_COEFFICIENT * (mu - 3 * sigma));
}

/**
 * Calculate the mu value needed to achieve a target Elo given a sigma value.
 * Elo = 1000 + 8 * (mu - 3 * sigma)
 * Solving for mu: mu = (Elo - 1000) / 8 + 3 * sigma
 */
export function muFromElo(targetElo: number, sigma: number): number {
  return (targetElo - 1000) / ELO_COEFFICIENT + 3 * sigma;
}

/**
 * Calculate the sigma value needed to achieve a target Elo given a fixed mu.
 * Used by the decay system: decay increases sigma (uncertainty) rather than
 * decreasing mu (skill), so a player's actual skill estimate is preserved
 * while their displayed Elo drops due to increased uncertainty.
 *
 * Elo = 1000 + 8 * (mu - 3 * sigma)
 * Solving for sigma: sigma = (1000 + 8 * mu - Elo) / 24
 */
export function sigmaFromElo(targetElo: number, mu: number): number {
  return (1000 + ELO_COEFFICIENT * mu - targetElo) / (ELO_COEFFICIENT * 3);
}

/**
 * Calculate mu and sigma adjustments to achieve exactly a target Elo change.
 * Returns new mu/sigma values that result in the desired Elo change.
 * Adjusts mu while keeping sigma stable (used for participation bonuses).
 */
export function adjustRatingForEloChange(
  currentMu: number,
  currentSigma: number,
  eloChange: number
): { mu: number; sigma: number } {
  const currentElo = calculateElo(currentMu, currentSigma);
  const targetElo = currentElo + eloChange;

  const newMu = muFromElo(targetElo, currentSigma);

  return { mu: newMu, sigma: currentSigma };
}
