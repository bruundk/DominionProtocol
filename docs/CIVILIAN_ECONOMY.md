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
- Capacity: **1,000 + the existing army-capacity curve**. This scales
  non-linearly with owned territory and includes the existing completed-city
  bonuses. Cities under construction contribute nothing.
- Growth per tick:
  **floor((10 + totalPopulation^0.73 / 4) × unusedCapacityShare)**, clamped to
  the remaining capacity and with a minimum of one. This replaces the original
  capped +20/second prototype rate and mirrors the former army-growth curve.
  Bots receive 0.5× growth; nations retain the existing difficulty modifiers.
- Passive worker income per tick: **floor(civilians / 10)** gold for humans and
  nations; **floor(civilians / 20)** for bots. Then apply the existing configured
  gold multiplier and rounding. The bot modifier preserves its previous half
  income rather than adding a new advantage. Income uses the population after
  that tick's growth. There is no minimum income or separate worker population.

At 1,000 civilians, default human/nation passive income remains 100 gold/tick
(1,000/second), and bots retain 50/tick. City construction does not grant
population instantly. The exact territory/city curve remains a **playtest
assumption** and can be tuned without changing population accounting.

Losing capacity **stops growth, never deletes civilians**. Excess civilians still
earn income. Growth resumes when capacity exceeds population again. This means
a damaged empire retains economic strength; conquest population transfers,
casualties, starvation, upkeep and other loss penalties are explicitly deferred.

Trade, trains, piracy, donations, conquest and building costs are untouched.
Army capacity and combat remain unchanged; population growth now supplies the
people who can be mobilised instead of generating soldiers independently.

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
