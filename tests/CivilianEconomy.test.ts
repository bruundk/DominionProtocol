import { describe, expect, it } from "vitest";
import { PlayerExecution } from "../src/core/execution/PlayerExecution";
import { PlayerInfo, PlayerType, UnitType } from "../src/core/game/Game";
import { PlayerImpl } from "../src/core/game/PlayerImpl";
import { setup } from "./util/Setup";
import { makePlayerView } from "./util/viewStubs";

async function economy(type = PlayerType.Human) {
  const game = await setup("plains", { instantBuild: true }, [
    new PlayerInfo("Alice", type, null, "alice"),
  ]);
  const player = game.player("alice");
  player.conquer(game.ref(0, 0));
  const execution = new PlayerExecution(player);
  execution.init(game, 0);
  return { game, player, execution, config: game.config() };
}

describe("civilian economy", () => {
  it("supports land, completed cities and upgrades, but not construction", async () => {
    const { game, player, config } = await economy();
    expect(config.civilianCapacity(player)).toBe(1002);
    player.conquer(game.ref(1, 0));
    expect(config.civilianCapacity(player)).toBe(1004);
    const city = player.buildUnit(UnitType.City, game.ref(0, 0), {});
    expect(config.civilianCapacity(player)).toBe(11004);
    city.setUnderConstruction(true);
    expect(config.civilianCapacity(player)).toBe(1004);
    city.setUnderConstruction(false);
    player.upgradeUnit(city);
    expect(config.civilianCapacity(player)).toBe(1004 + city.level() * 10000);
    city.delete();
    expect(config.civilianCapacity(player)).toBe(1004);
  });

  it("grows in integer ticks, clamps at capacity and never deletes excess people", async () => {
    const { game, player, config, execution } = await economy();
    execution.tick(1);
    expect(player.civilians()).toBe(1001);
    execution.tick(2);
    expect(player.civilians()).toBe(1002);
    execution.tick(3);
    expect(player.civilians()).toBe(1002);
    player.setCivilians(2000);
    expect(config.civilianIncreaseRate(player)).toBe(0);
    execution.tick(4);
    expect(player.civilians()).toBe(2000);
    player.conquer(game.ref(1, 0));
    player.setCivilians(config.civilianCapacity(player));
    player.relinquish(game.ref(1, 0));
    execution.tick(5);
    expect(player.civilians()).toBe(1004);
    expect(config.civilianIncreaseRate(player)).toBe(0);
  });

  it.each([PlayerType.Human, PlayerType.Nation, PlayerType.Bot])(
    "uses the same capacity and growth rules for %s",
    async (type) => {
      const { player, config, execution } = await economy(type);
      expect(config.civilianCapacity(player)).toBe(1002);
      expect(config.civilianIncreaseRate(player)).toBe(1);
      expect(config.goldAdditionRate(player)).toBe(
        type === PlayerType.Bot ? 50n : 100n,
      );
      player.setCivilians(2000);
      expect(config.goldAdditionRate(player)).toBe(
        type === PlayerType.Bot ? 100n : 200n,
      );
      const gold = player.gold();
      execution.tick(1);
      expect(player.gold() - gold).toBe(config.goldAdditionRate(player));
    },
  );

  it("caps growth, preserves civilians after land loss and recovers after expansion", async () => {
    const { game, player, config } = await economy();
    const city = player.buildUnit(UnitType.City, game.ref(0, 0), {});
    player.setCivilians(0);
    expect(config.civilianIncreaseRate(player)).toBe(2);
    player.upgradeUnit(city);
    expect(config.civilianIncreaseRate(player)).toBe(2);
    player.upgradeUnit(city);
    expect(config.civilianIncreaseRate(player)).toBe(2);
    player.setCivilians(11000);
    city.delete();
    expect(config.civilianIncreaseRate(player)).toBe(0);
    expect(player.civilians()).toBe(11000);
    player.buildUnit(UnitType.City, game.ref(0, 0), {});
    expect(config.civilianIncreaseRate(player)).toBe(1);
    player.relinquish(game.ref(0, 0));
    expect(config.civilianIncreaseRate(player)).toBe(0);
    expect(player.civilians()).toBe(11000);
  });

  it("synchronizes growing counts and produces identical hashes for identical runs", async () => {
    const a = await economy();
    const b = await economy();
    const view = makePlayerView({ data: a.player.toUpdate()! });
    for (let tick = 1; tick <= 20; tick++) {
      a.execution.tick(tick);
      b.execution.tick(tick);
      const update = a.player.toUpdate();
      if (update) view.applyUpdate(structuredClone(update));
      expect(view.civilians()).toBe(a.player.civilians());
      expect((a.player as PlayerImpl).hash()).toBe(
        (b.player as PlayerImpl).hash(),
      );
      expect(a.player.gold()).toBe(b.player.gold());
    }
  });

  it("keeps troop growth and army capacity independent, with no minimum civilian income", async () => {
    const { player, config } = await economy();
    const troopRate = config.troopIncreaseRate(player);
    const armyCapacity = config.maxTroops(player);
    player.setCivilians(0);
    expect(config.goldAdditionRate(player)).toBe(0n);
    player.setCivilians(100000);
    expect(config.troopIncreaseRate(player)).toBe(troopRate);
    expect(config.maxTroops(player)).toBe(armyCapacity);
  });
  it("preserves configured income multipliers and unrelated gold grants", async () => {
    const game = await setup("plains", { goldMultiplier: 2 }, [
      new PlayerInfo("Alice", PlayerType.Human, null, "alice"),
    ]);
    const player = game.player("alice");
    expect(game.config().goldAdditionRate(player)).toBe(200n);
    player.setCivilians(1234);
    expect(game.config().goldAdditionRate(player)).toBe(246n);
    const before = player.gold();
    player.addGold(5000n);
    expect(player.gold() - before).toBe(5000n);
    expect(player.civilians()).toBe(1234);
  });
});
