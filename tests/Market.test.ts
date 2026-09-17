import { describe, expect, it } from "vitest";
import { ConstructionExecution } from "../src/core/execution/ConstructionExecution";
import { PlayerExecution } from "../src/core/execution/PlayerExecution";
import {
  Player,
  PlayerInfo,
  PlayerType,
  Unit,
  UnitType,
} from "../src/core/game/Game";
import {
  MARKET_CONSTRUCTION_TICKS,
  MARKET_COST,
  marketBonusBasisPoints,
} from "../src/core/game/Market";
import { simpleHash } from "../src/core/Util";
import { setup } from "./util/Setup";

async function marketGame(type = PlayerType.Human, instantBuild = true) {
  const game = await setup("plains", { instantBuild }, [
    new PlayerInfo("Alice", type, null, "alice"),
    new PlayerInfo("Bob", PlayerType.Human, null, "bob"),
  ]);
  const player = game.player("alice");
  const other = game.player("bob");
  player.addGold(10_000_000n);
  other.addGold(10_000_000n);
  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 30; x++) player.conquer(game.ref(x, y));
  }
  for (let y = 40; y < 55; y++) {
    for (let x = 40; x < 55; x++) other.conquer(game.ref(x, y));
  }
  return { game, player, other, config: game.config() };
}

function build(player: Player, type: UnitType, tile: number): Unit {
  return player.buildUnit(type, tile, {});
}

describe("Market economy", () => {
  it("uses the documented cost, duration and diminishing-return curve", async () => {
    const { game, player } = await marketGame(PlayerType.Human, false);
    const info = game.unitInfo(UnitType.Market);
    expect(info.cost(game, player)).toBe(BigInt(MARKET_COST));
    expect(info.constructionDuration).toBe(MARKET_CONSTRUCTION_TICKS);
    expect([0, 1, 2, 3, 4, 8, 100].map(marketBonusBasisPoints)).toEqual([
      0, 1000, 2000, 3000, 3200, 4000, 4000,
    ]);
  });

  it("requires completed City levels and reserves slots during construction", async () => {
    const { game, player, config } = await marketGame();
    expect(config.marketSlots(player)).toBe(0);
    expect(player.canBuild(UnitType.Market, game.ref(20, 20))).toBe(false);

    const city = build(player, UnitType.City, game.ref(2, 2));
    expect(config.marketSlots(player)).toBe(1);
    city.increaseLevel();
    expect(config.marketSlots(player)).toBe(2);
    city.setUnderConstruction(true);
    expect(config.marketSlots(player)).toBe(0);
    city.setUnderConstruction(false);

    const market = build(player, UnitType.Market, game.ref(20, 20));
    market.setUnderConstruction(true);
    build(player, UnitType.Market, game.ref(25, 25));
    expect(player.canBuild(UnitType.Market, game.ref(10, 20))).toBe(false);
    expect(config.enabledMarketCount(player)).toBe(1);
    market.setUnderConstruction(false);
    expect(config.enabledMarketCount(player)).toBe(2);
  });

  it("charges once, synchronizes construction state and gives no unfinished bonus", async () => {
    const { game, player, config } = await marketGame(PlayerType.Human, false);
    build(player, UnitType.City, game.ref(2, 2));
    player.setCivilians(100_000);
    const base = config.civilianBaseGoldAdditionRate(player);
    const before = player.gold();
    game.addExecution(
      new ConstructionExecution(player, UnitType.Market, game.ref(20, 20)),
    );
    game.executeNextTick();
    game.executeNextTick();
    const market = player.units(UnitType.Market)[0];
    expect(market.isUnderConstruction()).toBe(true);
    expect(config.marketIncomeBonus(player)).toBe(0n);
    expect(market.toUpdate().unitType).toBe(UnitType.Market);
    expect(player.gold()).toBeLessThan(
      before - BigInt(MARKET_COST) + base * 3n,
    );

    for (let i = 0; i <= MARKET_CONSTRUCTION_TICKS + 1; i++) {
      game.executeNextTick();
    }
    expect(market.isUnderConstruction()).toBe(false);
    expect(config.marketIncomeBonus(player)).toBe(base / 10n);
  });

  it("boosts only civilian passive income", async () => {
    const { game, player, config } = await marketGame();
    build(player, UnitType.City, game.ref(2, 2));
    player.setCivilians(123_450);
    const base = config.civilianBaseGoldAdditionRate(player);
    const market = build(player, UnitType.Market, game.ref(20, 20));
    expect(config.goldAdditionRate(player)).toBe(base + base / 10n);

    const beforeGrant = player.gold();
    player.addGold(777n);
    expect(player.gold() - beforeGrant).toBe(777n);
    market.setUnderConstruction(true);
    expect(config.goldAdditionRate(player)).toBe(base);
  });

  it("disables newest excess Markets after City capacity is lost", async () => {
    const { game, player, config } = await marketGame();
    const firstCity = build(player, UnitType.City, game.ref(2, 2));
    const secondCity = build(player, UnitType.City, game.ref(8, 2));
    const first = build(player, UnitType.Market, game.ref(20, 20));
    const second = build(player, UnitType.Market, game.ref(25, 25));
    expect(config.enabledMarkets(player)).toEqual([first, second]);
    secondCity.delete(false);
    expect(config.enabledMarkets(player)).toEqual([first]);
    expect(second.isActive()).toBe(true);
    firstCity.delete(false);
    expect(config.enabledMarketCount(player)).toBe(0);
    expect(player.units(UnitType.Market)).toHaveLength(2);
  });

  it("moves benefits immediately on capture and destruction", async () => {
    const { game, player, other, config } = await marketGame();
    build(player, UnitType.City, game.ref(2, 2));
    build(other, UnitType.City, game.ref(42, 42));
    const market = build(player, UnitType.Market, game.ref(20, 20));
    expect(config.enabledMarketCount(player)).toBe(1);
    other.captureUnit(market);
    expect(config.enabledMarketCount(player)).toBe(0);
    expect(config.enabledMarketCount(other)).toBe(1);
    market.delete(false);
    expect(config.enabledMarketCount(other)).toBe(0);
  });

  it("frees a reserved slot when construction is cancelled or deleted", async () => {
    const { game, player } = await marketGame();
    build(player, UnitType.City, game.ref(2, 2));
    const market = build(player, UnitType.Market, game.ref(20, 20));
    market.setUnderConstruction(true);
    expect(player.canBuild(UnitType.Market, game.ref(25, 25))).toBe(false);
    market.delete(false);
    expect(player.canBuild(UnitType.Market, game.ref(25, 25))).not.toBe(false);
  });

  it("lets a rich bot conservatively use captured City capacity", async () => {
    const { game, player } = await marketGame(PlayerType.Bot);
    build(player, UnitType.City, game.ref(2, 2));
    const execution = new PlayerExecution(player);
    execution.init(game, 0);
    const buildTick = (100 - (simpleHash(player.id()) % 100)) % 100;
    execution.tick(buildTick);
    game.executeNextTick();
    game.executeNextTick();
    expect(player.units(UnitType.Market)).toHaveLength(1);
  });

  it.each([PlayerType.Human, PlayerType.Nation, PlayerType.Bot])(
    "applies the same Market formula to %s players",
    async (type) => {
      const { game, player, config } = await marketGame(type);
      build(player, UnitType.City, game.ref(2, 2));
      build(player, UnitType.Market, game.ref(20, 20));
      const base = config.civilianBaseGoldAdditionRate(player);
      expect(config.marketIncomeBonus(player)).toBe(base / 10n);
      expect(config.goldAdditionRate(player)).toBe(base + base / 10n);
    },
  );

  it("produces identical synchronized unit state and deterministic hashes", async () => {
    const a = await marketGame();
    const b = await marketGame();
    for (const state of [a, b]) {
      build(state.player, UnitType.City, state.game.ref(2, 2));
      build(state.player, UnitType.Market, state.game.ref(20, 20));
    }
    expect(a.player.units(UnitType.Market)[0].toUpdate()).toEqual(
      b.player.units(UnitType.Market)[0].toUpdate(),
    );
    expect((a.game as any).hash()).toBe((b.game as any).hash());
  });
});
