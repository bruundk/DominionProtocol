import { describe, expect, it } from "vitest";
import { Executor } from "../src/core/execution/ExecutionManager";
import { PlayerInfo, PlayerType, UnitType } from "../src/core/game/Game";
import { PlayerImpl } from "../src/core/game/PlayerImpl";
import { IntentSchema } from "../src/core/Schemas";
import { setup } from "./util/Setup";
import { makePlayerView } from "./util/viewStubs";

async function scenario() {
  const game = await setup("plains", {}, [
    new PlayerInfo("Alice", PlayerType.Human, "alice-client", "alice"),
  ]);
  const player = game.player("alice");
  player.conquer(game.ref(0, 0));
  player.setSpawnTile(game.ref(0, 0));
  player.setTroops(1000);
  player.setCivilians(9000);
  return { game, player };
}

describe("mobilisation", () => {
  it("conserves population through repeated instant conversions", async () => {
    const { player } = await scenario();
    for (const percentage of [0, 100, 33, 67, 0, 100, 50]) {
      player.setMobilisationPercentage(percentage);
      expect(player.totalPopulation()).toBe(10000);
      expect(player.troops() + player.civilians()).toBe(10000);
    }
    expect(player.troops()).toBe(5000);
    expect(player.civilians()).toBe(5000);
  });

  it("validates and executes mobilisation through the multiplayer intent path", async () => {
    const { game, player } = await scenario();
    expect(
      IntentSchema.safeParse({ type: "mobilisation", percentage: 65 }).success,
    ).toBe(true);
    for (const percentage of [-1, 101, 2.5]) {
      expect(
        IntentSchema.safeParse({ type: "mobilisation", percentage }).success,
      ).toBe(false);
    }
    const executor = new Executor(game, "test-game", "alice-client");
    const execution = executor.createExec({
      type: "mobilisation",
      percentage: 70,
      clientID: "alice-client",
    });
    execution.init(game, 0);
    expect(player.mobilisationPercentage()).toBe(70);
    expect(player.totalPopulation()).toBe(10000);
  });

  it("synchronizes target and population and hashes the split deterministically", async () => {
    const a = await scenario();
    const b = await scenario();
    a.player.setMobilisationPercentage(65);
    b.player.setMobilisationPercentage(65);
    const view = makePlayerView({ data: a.player.toUpdate()! });
    expect(view.totalPopulation()).toBe(10000);
    expect(view.mobilisationPercentage()).toBe(65);
    expect((a.player as PlayerImpl).hash()).toBe(
      (b.player as PlayerImpl).hash(),
    );
    b.player.setMobilisationPercentage(35);
    expect((a.player as PlayerImpl).hash()).not.toBe(
      (b.player as PlayerImpl).hash(),
    );
  });

  it("locks deployed attacks, counts casualties, and returns survivors once", async () => {
    const { game, player } = await scenario();
    player.removeTroops(1000);
    const attack = player.createAttack(
      game.terraNullius(),
      1000,
      game.ref(0, 0),
      new Set(),
    );
    expect(player.totalPopulation()).toBe(10000);
    player.setMobilisationPercentage(0);
    expect(player.troops()).toBe(0);
    expect(player.deployedTroops()).toBe(1000);
    expect(player.civilians()).toBe(9000);

    attack.setTroops(700);
    expect(player.totalPopulation()).toBe(9700);
    attack.delete();
    player.addTroops(700);
    player.reconcileMobilisation();
    expect(player.deployedTroops()).toBe(0);
    expect(player.totalPopulation()).toBe(9700);
    expect(player.civilians()).toBe(9700);
  });

  it("accounts for transport ships without duplicating returning soldiers", async () => {
    const { game, player } = await scenario();
    const ship = player.buildUnit(UnitType.TransportShip, game.ref(0, 0), {
      troops: 600,
      targetTile: game.ref(0, 0),
    });
    expect(player.deployedTroops()).toBe(600);
    expect(player.totalPopulation()).toBe(10000);
    ship.setTroops(450);
    expect(player.totalPopulation()).toBe(9850);
    ship.delete();
    player.addTroops(450);
    player.setMobilisationPercentage(0);
    expect(player.totalPopulation()).toBe(9850);
    expect(player.civilians()).toBe(9850);
  });
});
