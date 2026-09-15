# Civilian population foundation

This describes the original PR #1 foundation. For the subsequent growth and
income rules, see [Civilian economy](CIVILIAN_ECONOMY.md). The no-growth/no-income
statements below refer to the foundation version, not the economy follow-up.

Every player (human, nation and bot) starts with **1,000 civilians**. This is
a deterministic placeholder defined by `STARTING_CIVILIANS` in
`src/core/game/Population.ts`, not a balance decision for the future economy.

Civilians are stored independently from the existing shared army using integer
`bigint` state. Removing troops for an attack or transport does not create
civilians. This version deliberately has no civilian growth, mobilisation,
income effects, upkeep, buildings, conquest transfers or elimination effects.
The existing troop generation, combat and gold income remain unchanged.

The initial worker snapshot includes civilians. Subsequent changes use the
ordinary `PlayerUpdate` diff and `applyStateUpdate` merge, including zero values.
The existing five-lane packed numeric update format is unchanged. If continuous
population growth is added later, consider moving civilians into that channel.
Older view/renderer snapshots without this field display zero rather than an
invented population. Player hashes include deviations from the starting count,
so unchanged foundation games preserve existing replay hash values.

The HUD integrates civilians as a teal bordered badge with an original two-person
SVG icon beside the existing resource indicators. Its formatted count has a
translated **Civilians** tooltip and accessible label. The existing troop bars
identify **Available Troops** through translated tooltips and accessible labels,
without duplicating the count above them. Mobile growth and attack controls sit
on a separate row. Gold-gain pulses are clipped inside the gold indicator and
temporarily overlay its total, rather than overlapping other labels.
Available troops are reserves: soldiers committed to ongoing attacks or ships
remain outside this count, as before. These labels do not imply a total-population
or mobilisation system exists yet.

## Manual testing

1. Check out `feature/civilian-population-foundation` and run `npm run inst`.
2. Run `npm run dev` and start a single-player game in English.
3. After spawning, verify the teal civilian badge shows 1,000 (abbreviated).
   Hover the badge and troop bar to check their English tooltips.
4. Verify Available Troops grows as before. Launch attacks and verify it falls
   while Civilians stays unchanged. Check gold income and building costs.
5. Narrow the browser to 320–500 pixels. Verify the resource indicators, growth,
   attack slider and building hotbar remain readable. Trigger a gold bonus and
   check its notification stays inside the gold indicator for two seconds.

Automated population tests cover initial state, updates, zero values, validation,
troop independence, unchanged rates and deterministic hashes. Mobilisation and
population-driven income are follow-up work, not part of this PR.
