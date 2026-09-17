# Markets

Markets are the first city-linked economic building. They reward civilian
population and City investment without introducing another resource or a new
permanent HUD row.

## Balance and authoritative formula

- Cost: **250,000 gold**.
- Construction time: **30 ticks (3 seconds)** at the standard 10 ticks/second.
- One completed **City level** supplies one Market slot. A level-three City
  therefore supplies three slots. Cities under construction supply no slots.
- Completed and under-construction Markets both reserve a slot. A player cannot
  begin another Market while all slots are reserved.
- Markets under construction give no income bonus.

The simulation first calculates the existing civilian passive income for the
tick. It then adds a Market-only bonus:

`market income = floor(base civilian income × bonus basis points / 10,000)`

For `M` enabled, completed Markets:

`bonus basis points = min(4,000, min(M, 3) × 1,000 + max(M - 3, 0) × 200)`

The first three Markets therefore add **10% each**. Every subsequent Market adds
**2%**, up to a hard **40%** total bonus. Integer basis-point arithmetic keeps
the result deterministic. This multiplier applies only to civilian passive
income; trade ships, trains, donations, conquest, piracy and other gold grants
are unchanged.

## Capacity loss, capture and destruction

Losing City capacity never deletes Markets. Active Markets are ordered by their
stable simulation ID (oldest first); available slots enable that many. The
newest excess Markets remain visible and owned but disabled. They automatically
resume operation when the player regains a slot. An under-construction Market
within the enabled group still reserves its slot but contributes no bonus.

Ownership is evaluated from current synchronized unit state every tick. A
captured Market stops benefiting its previous owner immediately and benefits
its new owner only if that owner has an available City slot and the Market is
complete. Deletion or destruction removes it from the calculation immediately.
There is no cached Market income that can be duplicated through repeated
capture, cancellation or ownership changes.

## AI behavior

Nations conservatively target one Market for every two completed City levels,
after ports and factories in their normal structure priorities. Tribe bots do
not normally own Cities; if a bot captures City capacity, it checks every ten
seconds and may build a Market only while it has an unused slot and at least
twice the Market cost in gold. Humans, nations and bots use the same slot and
income rules.

## Interface

The Market uses its own storefront SVG and the existing structure renderer,
build menu and hotbar. Its default key is **Shift+2**, keeping the established
number row intact. The translated hotbar tooltip shows cost, completed and
under-construction counts, enabled count, slot usage and current bonus. The
existing gold indicator tooltip includes base civilian income and the Market
contribution per second. The hotbar wraps on narrow screens.

## Manual testing

1. Run `npm run dev`, start an English single-player game and build a City.
2. Build a Market with **Shift+2** or the build menu. Confirm 250,000 gold is
   charged once and no bonus appears during the three-second construction.
3. Hover/focus the Market and gold indicators. Confirm slot usage, construction
   status and the Market-only income contribution appear in their tooltips.
4. Upgrade/build Cities and construct at least four Markets. Confirm bonuses
   progress 10%, 20%, 30%, then 32%.
5. Lose a City. Confirm the newest excess Market remains on the map but the
   bonus drops; regain capacity and confirm it resumes automatically.
6. Capture and destroy Markets and confirm the bonus follows current ownership.
7. Trigger trade, train, donation and conquest income and confirm those amounts
   are not multiplied.
8. Test desktop and a 320–500px viewport. Confirm the hotbar wraps and does not
   overlap the troop, civilian, gold, mobilisation or attack controls.
