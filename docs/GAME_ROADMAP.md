# Game Development Roadmap

This document tracks the transformation of our OpenFront fork into a distinct
strategy game focused on empire development, population management and warfare.

The final game name has not yet been decided.

## Core design principles

- [x] Retain OpenFront's fluid territorial expansion
- [x] Retain one shared army for the player's entire empire
- [x] Keep the game understandable for casual browser players
- [x] Add more strategic depth without creating a complicated simulation
- [x] Make developing an empire a viable alternative to constant expansion
- [x] Use English as the default language
- [ ] Decide the final game name
- [ ] Define the game's original visual identity

---

## Phase 1: Project and licence preparation

- [x] Clone the OpenFront repository
- [x] Install the project dependencies
- [x] Confirm that the original game runs locally
- [x] Create the `dominion-development` branch
- [x] Create the public GitHub fork
- [x] Connect `origin` to our fork
- [x] Preserve official OpenFront as `upstream`
- [ ] Add a notice explaining that this is a modified OpenFront version
- [ ] Preserve required OpenFront copyright notices
- [ ] Add an accessible source-code link
- [ ] Add a credits and licence screen
- [ ] Audit all assets in `/resources`
- [ ] Identify everything used from `/proprietary`
- [ ] Replace restricted proprietary assets before public release
- [ ] Remove or replace official OpenFront branding
- [ ] Remove official OpenFront analytics and advertising integrations
- [ ] Remove dependencies on private OpenFront services where necessary

---

## Phase 2: Population and army system

### Foundation milestone

- [x] Add independent player-wide civilian state (1,000 starting civilians)
- [x] Synchronize initial state and subsequent civilian changes
- [x] Display Civilians and Available Troops in the English HUD
- [x] Test civilian state, synchronization and HUD updates

See [civilian foundation notes](CIVILIAN_POPULATION.md). This milestone does not
yet implement total-population accounting, mobilisation, growth or income effects.

### Civilian economy milestone

- [x] Add deterministic civilian growth and land/completed-city capacity
- [x] Make passive worker income proportional to civilians
- [x] Preserve civilians when capacity falls, pausing growth instead
- [x] Show capacity and growth in the compact HUD badge tooltip
- [x] Test growth, income, synchronization and troop independence

See [civilian economy rules](CIVILIAN_ECONOMY.md). Army/civilian conversion,
total-population accounting and new buildings remain separate future milestones.

### Confirmed design

- [ ] Add one total population value for each player
- [ ] Divide population into civilians and active troops
- [ ] Keep troops in one shared national army
- [ ] Do not store separate armies in individual territories
- [ ] Make civilians generate money
- [ ] Make active troops require upkeep
- [ ] Make military casualties reduce total population
- [ ] Add gradual population recovery and growth
- [ ] Display civilians, troops and money clearly in the interface

### Mobilisation

- [ ] Add a national mobilisation percentage slider
- [ ] Make civilian-to-troop conversion immediate
- [ ] Keep the existing attack-percentage control separate
- [ ] Make mobilisation increases cost money
- [ ] Allow demobilisation to return surviving troops to civilian life
- [ ] Add a short mobilisation cooldown if testing shows it is necessary
- [ ] Teach AI players to manage mobilisation

### Important distinction

The two percentage controls must remain separate:

1. Mobilisation percentage: how much of the population serves in the army.
2. Attack percentage: how much of the available army is committed to an attack.

---

## Phase 3: Economy

- [ ] Use money as the primary economic resource
- [ ] Generate income primarily from civilians
- [ ] Give buildings construction costs
- [ ] Give military units and advanced weapons upkeep costs
- [ ] Display current money and income per second
- [ ] Display major expenses and military upkeep
- [ ] Prevent players from earning maximum income and instantly mobilising for free
- [ ] Balance economic investment against immediate expansion
- [ ] Teach AI players to earn, save and spend money

### Systems deliberately excluded for now

- [x] No separate materials resource
- [x] No separate energy resource
- [x] No food-management system
- [x] No local troop inventories
- [x] No manual supply convoys

These systems may only be reconsidered if the basic economy remains too simple.

---

## Phase 4: Cities

### General city changes

- [ ] Redesign cities so they are more important than ordinary land
- [ ] Give cities a civilian population bonus
- [ ] Allow players to customise or upgrade cities
- [ ] Keep city choices limited and easy to understand
- [ ] Make developed cities valuable strategic targets
- [ ] Add clear city information when selected
- [ ] Decide whether cities use levels, specialisations or limited building slots
- [ ] Teach AI players to develop cities

### Possible city-focused buildings

These are candidates, not all confirmed:

- [ ] Market: improves money income
- [ ] Housing: improves population growth or capacity
- [ ] Hospital: improves recovery after population losses

### Design limit

- [x] Do not use complicated residential, commercial and industrial district systems
- [ ] Limit civilian city choices to approximately three
- [ ] Make every building's purpose understandable from one short description

---

## Phase 5: Military buildings

### New or redesigned military structures

- [ ] Barracks
- [ ] Fortifications
- [ ] Airfield

### Proposed functions

- [ ] Barracks reduces mobilisation cost
- [ ] Barracks may improve mobilisation efficiency
- [ ] Fortifications slow enemy expansion locally
- [ ] Fortifications make nearby cities harder to capture
- [ ] Airfields enable aircraft or air attacks
- [ ] Keep military building effects visually understandable
- [ ] Teach AI players when and where to build them

### Balance rules

- [ ] Military buildings affect local combat without storing local armies
- [ ] The army remains a shared national pool
- [ ] Building a fortified position should not make expansion impossible
- [ ] Advanced military buildings should require money and upkeep

---

## Phase 6: Railways and infrastructure

### Railway station

- [ ] Add railway stations as infrastructure buildings
- [ ] Automatically connect stations to nearby friendly buildings
- [ ] Draw visible railway lines on the map
- [ ] Allow railway stations to connect to other railway stations
- [ ] Limit each station to approximately three direct connections
- [ ] Require railway routes to pass through friendly territory
- [ ] Break a railway connection when enemy territory cuts through it
- [ ] Recalculate connections when territory ownership changes
- [ ] Teach AI players to construct useful railway networks

### Buildings that may receive rail connections

- [ ] Cities
- [ ] Markets
- [ ] Barracks
- [ ] Ports
- [ ] Factories
- [ ] Other railway stations

### Railway effect

Initial proposed rule:

- [ ] Connected buildings operate approximately 20% more efficiently

The exact percentage must be balanced through testing.

### Important railway rule

Railways improve buildings and infrastructure. They do not transport separate
local armies because every player uses one shared national army.

---

## Phase 7: Existing OpenFront structures

### Existing systems to preserve and evaluate

- [ ] Cities
- [ ] Factories
- [ ] Ports
- [ ] Defence posts
- [ ] Missile silos
- [ ] SAM launchers
- [ ] Warships
- [ ] Atom bombs
- [ ] Hydrogen bombs

### Required review

- [ ] Document the current purpose and cost of every structure
- [ ] Decide which structures remain unchanged
- [ ] Decide which structures need new economic costs
- [ ] Decide which structures require upkeep
- [ ] Prevent factories and markets from having identical purposes
- [ ] Integrate existing factory roads with the railway system
- [ ] Decide whether defence posts and fortifications should be combined
- [ ] Decide whether warships remain units or become part of a naval system
- [ ] Rebalance nuclear weapons for the new economy

---

## Phase 8: Tall versus wide strategy

A developed compact empire should be able to compete with a larger,
underdeveloped empire.

- [ ] Make developed cities more valuable than empty land
- [ ] Make newly conquered territory initially less productive
- [ ] Consider temporary unrest after conquest
- [ ] Consider temporary damage to captured buildings
- [ ] Increase army upkeep as mobilisation becomes larger
- [ ] Prevent land area alone from determining economic strength
- [ ] Reward connected city and railway networks
- [ ] Create meaningful economic targets for enemy attacks
- [ ] Test compact economic strategies against rapid expansion strategies

---

## Phase 9: Interface and accessibility

- [ ] Keep English as the default language
- [ ] Display civilians, troops and money without opening menus
- [ ] Make building construction usable with mouse and touch
- [ ] Add simple building tooltips
- [ ] Clearly distinguish mobilisation from attack strength
- [ ] Add visual construction progress
- [ ] Add clear railway-network visuals
- [ ] Redesign the main menu
- [ ] Create an original logo and colour palette
- [ ] Add a short playable tutorial
- [ ] Keep the game readable at CrazyGames iframe sizes
- [ ] Test the interface on desktop and mobile

---

## Phase 10: AI

- [ ] Teach AI to balance civilians and troops
- [ ] Teach AI to save money
- [ ] Teach AI to construct buildings
- [ ] Teach AI to specialise cities
- [ ] Teach AI to build railway networks
- [ ] Teach AI to defend valuable economic centres
- [ ] Give AI players different economic and military personalities
- [ ] Prevent AI from spending all money immediately
- [ ] Test AI performance with the additional calculations

---

## Phase 11: Originality and publication

- [ ] Choose the final game name
- [ ] Create an original logo
- [ ] Create an original main menu
- [ ] Replace restricted assets
- [ ] Make the game clearly distinguishable from OpenFront
- [ ] Keep the modified source publicly available under AGPL v3
- [ ] Add required CC BY-SA asset attribution
- [ ] Add the CrazyGames SDK
- [ ] Remove external advertisements
- [ ] Meet CrazyGames gameplay requirements
- [ ] Test supported screen sizes
- [ ] Prepare a Basic Launch build
- [ ] Submit the game for CrazyGames review

---

## Current priority

The next development milestone is:

> Create a minimal population prototype with civilians, troops and money while
> preserving OpenFront's existing territorial combat.

The first implementation should not include buildings or railways yet. We must
prove that the new population and mobilisation system is understandable and
balanced before building other systems on top of it.
