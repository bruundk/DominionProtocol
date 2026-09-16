# Mobilisation

Mobilisation connects the shared army and civilian economy without adding
another resource. The player chooses a target from 0 to 100%. Conversion
between free civilians and reserve troops is immediate and player-wide.

## Population accounting

`total population = civilians + available troops + deployed troops`

Deployed troops are soldiers in outgoing land attacks and transport ships.
They cannot be demobilised until they return. If they exceed the target, the
HUD shows the selected target beside the honest actual split. The target is
reconciled after simulation executions on every tick.

Changing the target only moves people between civilians and available troops.
It never changes total population or gold. Military casualties reduce total
population. Retreats, landings and returning ships transfer the same soldiers
between holders and cannot duplicate them.

## Growth, capacity, and income

The PR #2 income formula is unchanged:

- Humans and nations: `floor(civilians / 10) × gold multiplier` per tick.
- Bots: `floor(civilians / 20) × gold multiplier` per tick.

Population growth remains deterministic and capped at two people per tick, but
capacity is compared with total population. Capacity contains configured
starting army, 1,000 starting civilians, two people per owned land tile, and
10,000 per completed city level. Losing capacity stops growth without deleting
people.

Independent troop growth is disabled. New soldiers come from existing
civilians. The army cap limits new conversion but does not delete existing
over-cap soldiers. Humans start at 50%. Bots and nations use 55%, or 75% while
attacked. Troop donations transfer population; conquest changes capacity but
does not directly create people.

## Multiplayer and HUD

The slider emits a validated `mobilisation` intent through the normal
server-stamped multiplayer path. Dragging only changes a local draft until
synchronized state confirms it.

The separate HUD panel shows target, actual soldier share and deployed troops,
while preserving the civilian badge, troop bar, gold, attack strength and
building hotbar. Tooltips and accessibility text expose the complete split.
Troop displays now use the same one-person unit as civilians; this is a display
normalisation only and does not multiply combat strength.

## Manual test

1. Run `npm run dev` and start a match.
2. Move Mobilisation between 0%, 50%, and 100%.
3. Confirm civilians and available troops exchange while population stays
   constant and income follows civilians.
4. Launch an attack or transport ship, then lower mobilisation.
5. Confirm deployed troops stay soldiers, actual differs when necessary, and
   returning survivors reconcile without duplication.
6. Check desktop and narrow/mobile widths.
