import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../resources/lang/en.json";
import "../../src/client/hud/layers/ControlPanel";
import type { ControlPanel } from "../../src/client/hud/layers/ControlPanel";
import { renderNumber, renderTroops } from "../../src/client/Utils";
import type { GameView } from "../../src/client/view";
import { GameUpdateType } from "../../src/core/game/GameUpdates";
import { UserSettings } from "../../src/core/game/UserSettings";
import { makePlayerView, stubConfig } from "../util/viewStubs";

vi.mock("../../src/client/Utils", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../src/client/Utils")>();
  const { default: english } = await import("../../resources/lang/en.json");
  return {
    ...original,
    translateText: (key: string) => {
      if (key === "control_panel.civilians")
        return english.control_panel.civilians;
      if (key === "control_panel.available_troops")
        return english.control_panel.available_troops;
      return key;
    },
  };
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("control-panel population summary", () => {
  it("displays translated civilian and reserve counts and refreshes them on ticks", async () => {
    vi.spyOn(UserSettings.prototype, "helpMessages").mockReturnValue(false);
    const player = makePlayerView({ data: { civilians: 1000, troops: 500 } });
    const panel = document.createElement("control-panel") as ControlPanel;
    panel.game = {
      inSpawnPhase: () => false,
      myPlayer: () => player,
      config: () =>
        stubConfig({ maxTroops: () => 1000, troopIncreaseRate: () => 1 }),
      updatesSinceLastTick: () => null,
    } as unknown as GameView;
    document.body.appendChild(panel);
    panel.tick();
    await panel.updateComplete;
    const summary = panel.querySelector('[data-testid="population-summary"]')!;
    expect(summary.textContent).toContain(en.control_panel.civilians);
    expect(summary.textContent).toContain(en.control_panel.available_troops);
    expect(
      panel.querySelector('[data-testid="civilian-count"]')!.textContent,
    ).toContain(renderNumber(1000));
    expect(
      panel.querySelector('[data-testid="available-troop-count"]')!.textContent,
    ).toContain(renderTroops(500));

    player.applyUpdate({
      type: GameUpdateType.Player,
      id: player.id(),
      troops: 200,
      civilians: 0,
    });
    panel.tick();
    await panel.updateComplete;
    expect(
      panel.querySelector('[data-testid="civilian-count"]')!.textContent,
    ).toContain(renderNumber(0));
    expect(
      panel.querySelector('[data-testid="available-troop-count"]')!.textContent,
    ).toContain(renderTroops(200));
    expect(summary.closest(".lg\\:hidden, .hidden.lg\\:block")).toBeNull();
  });
});
