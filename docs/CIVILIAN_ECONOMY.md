# Civilian growth and income

> Mobilisation now extends this foundation. Growth and capacity use total
> population, while the civilian-income formula remains unchanged. See
> [MOBILISATION.md](MOBILISATION.md).

This first economy pass uses the existing player-wide civilian state and shared
army. It adds no mobilisation, resources, buildings or combat changes. PR #1 was
merged before this branch started.

## Balance rules

All simulation population arithmetic is integer-based. Each living player's
`PlayerExecution` runs at the existing 10 ticks per second, outside spawn phase.
Constants live in `src/core/game/Population.ts`.

- Starting civilians: **1,000**, unchanged.
- Capacity: **1,000 + 2 × owned tiles + 10,000 × completed city levels**.
  Cities under construction contribute nothing, matching army-capacity rules.
  Captured cities count for their current owner; demolished or lost cities no
  longer provide capacity.
- Growth per tick: **min(2, ceil((capacity − civilians) / 1,000))**, or zero
  when already at/above capacity or owning no land. Ceiling is implemented with
  bigint division, not fractional population. The increment never overshoots
  capacity. Growth is identical for humans, nations and bots, with no difficulty
  modifier. At most 20 civilians arrive per second; growth slows as capacity
  fills, with a minimum of 10 per second until the last few people arrive.
- Passive worker income per tick: **floor(civilians / 10)** gold for humans and
  nations; **floor(civilians / 20)** for bots. Then apply the existing configured
  gold multiplier and rounding. The bot modifier preserves its previous half
  income rather than adding a new advantage. Income uses the population after
  that tick's growth. There is no minimum income or separate worker population.

At 1,000 civilians, default human/nation passive income remains 100 gold/tick
(1,000/second), and bots retain 50/tick. A completed level-one city on unchanged
land supports 10,000 additional civilians and eventually 1,000 additional
gold/tick for a human/nation. City construction does not grant population
instantly. These deliberately simple values are **playtest assumptions**, not
final balancing; city payback and late-game income need testing.

Losing capacity **stops growth, never deletes civilians**. Excess civilians still
earn income. Growth resumes when capacity exceeds population again. This means
a damaged empire retains economic strength; conquest population transfers,
casualties, starvation, upkeep and other loss penalties are explicitly deferred.

Only `goldAdditionRate` (the existing worker grant) changes. Trade, trains,
piracy, donations, conquest and building costs are untouched. Troop growth,
army capacity, troop spending and combat remain independent from civilians.

## Synchronization and HUD

Growth uses ordinary civilian `PlayerUpdate` diffs, including zero values,
without changing the packed five-lane army/gold channel. Capacity and next-tick
growth are derived through the same Config methods in the simulation and HUD.
The existing compact badge shows only the formatted count. Its English tooltip
and accessible label show count, capacity and growth/second; changing capacity
refreshes these even when population is frozen. No extra text row is added.

Continuous civilian diffs add worker-to-client traffic; moving civilians to a
packed update channel can be considered separately after profiling. Growing
population and changed income intentionally change new-game replay hashes;
old economy replay hashes are not expected to match this version.

## Manual playtest

1. Check out `feature/civilian-growth-income`, run `npm run inst`, then
   `npm run dev`. Start an English single-player game.
2. Spawn and hover/focus the civilian badge. Check count, capacity and growth.
3. Expand: capacity should rise immediately and civilians gradually. Build a
   city and check capacity rises only after completion. Upgrading increases the
   completed-level contribution.
4. Watch passive gold income increase as civilians grow. Attack with your army:
   civilian count must not be converted into soldiers or deducted by attacks.
5. Lose land/cities until capacity falls below population: civilians must remain
   unchanged and growth read zero. Expand/build again to resume growth.
6. Confirm trade/train income, donations, gold bonuses, costs and combat work as
   before. Observe bots and nations using the same population rules.
7. Test desktop and 320–500px widths: keep the compact badge, troop bar, gold,
   attack slider and building hotbar readable. Gold notifications must remain
   inside their own indicator.

Automated tests cover capacity, construction, upgrades, integer growth,
population retention, income, bot rules, synchronization, deterministic hashes,
troop independence and HUD details. Browser visual verification may be unavailable
in the coding runtime; the PR reports the checks actually run.
