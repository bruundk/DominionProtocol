import { beforeEach, describe, expect, it } from "vitest";
import { Game, Player, PlayerInfo, PlayerType } from "../src/core/game/Game";
import { PlayerImpl } from "../src/core/game/PlayerImpl";
import { STARTING_CIVILIANS } from "../src/core/game/Population";
import { setup } from "./util/Setup";
import { makePlayerView } from "./util/viewStubs";

describe("civilian population foundation", () => {
  let game: Game;
  let player: Player;

  beforeEach(async () => {
    game = await setup("plains", {}, [
      new PlayerInfo("Alice", PlayerType.Human, null, "alice"),
    ]);
    player = game.player("alice");
  });

  it("initializes every player type with the same deterministic placeholder", () => {
    expect(player.civilians()).toBe(STARTING_CIVILIANS);
    for (const type of [PlayerType.Bot, PlayerType.Nation]) {
      const id = `population-${type}`;
      game.addPlayer(new PlayerInfo(id, type, null, id));
      expect(game.player(id).civilians()).toBe(STARTING_CIVILIANS);
    }
  });

  it("sends initial state and civilian-only diffs through to the client view", () => {
    const full = player.toUpdate()!;
    expect(full.civilians).toBe(STARTING_CIVILIANS);
    const view = makePlayerView({ data: full });
    expect(view.civilians()).toBe(STARTING_CIVILIANS);
    expect(player.toUpdate()).toBeNull();

    const stats: number[] = [];
    player.setCivilians(1250);
    const diff = player.toUpdate(stats)!;
    expect(diff.civilians).toBe(1250);
    expect(diff.troops).toBeUndefined();
    expect(stats).toEqual([]);
    view.applyUpdate(structuredClone(diff));
    expect(view.civilians()).toBe(1250);
    view.applyUpdate({ type: full.type, id: full.id, troops: 500 });
    expect(view.civilians()).toBe(1250);
    expect(view.troops()).toBe(500);

    player.setCivilians(0);
    view.applyUpdate(player.toUpdate()!);
    expect(view.civilians()).toBe(0);
    expect(player.toUpdate()).toBeNull();
  });

  it("does not turn removed or deployed troops into civilians", () => {
    player.setTroops(500);
    player.removeTroops(200);
    player.createAttack(game.terraNullius(), 200, null, new Set());
    expect(player.civilians()).toBe(STARTING_CIVILIANS);
    player.addTroops(100);
    expect(player.civilians()).toBe(STARTING_CIVILIANS);
  });

  it("does not change troop growth, capacity or grant gold when population changes", () => {
    const config = game.config();
    const before = [config.troopIncreaseRate(player), config.maxTroops(player)];
    const troops = player.troops();
    const gold = player.gold();
    player.setCivilians(2000);
    expect([
      config.troopIncreaseRate(player),
      config.maxTroops(player),
    ]).toEqual(before);
    expect(player.troops()).toBe(troops);
    expect(player.gold()).toBe(gold);
  });

  it("includes civilian changes in deterministic player hashes", () => {
    const impl = player as PlayerImpl;
    const hash = impl.hash();
    player.setCivilians(STARTING_CIVILIANS + 1);
    expect(impl.hash()).not.toBe(hash);
    player.setCivilians(STARTING_CIVILIANS);
    expect(impl.hash()).toBe(hash);
  });

  it("reads older view snapshots without inventing a civilian population", () => {
    const view = makePlayerView({ data: { civilians: undefined } });
    expect(view.civilians()).toBe(0);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid population %s without changing state",
    (value) => {
      expect(() => player.setCivilians(value)).toThrow();
      expect(player.civilians()).toBe(STARTING_CIVILIANS);
    },
  );
});
