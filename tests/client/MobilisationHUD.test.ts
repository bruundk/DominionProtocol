import { describe, expect, it, vi } from "vitest";
import "../../src/client/hud/layers/ControlPanel";
import type { ControlPanel } from "../../src/client/hud/layers/ControlPanel";
import { SendMobilisationIntentEvent } from "../../src/client/Transport";
import type { UIState } from "../../src/client/UIState";
import type { GameView } from "../../src/client/view";
import { EventBus } from "../../src/core/EventBus";
import { UserSettings } from "../../src/core/game/UserSettings";
import { makePlayerView, stubConfig } from "../util/viewStubs";

vi.mock("../../src/client/Utils", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../src/client/Utils")>();
  const { default: english } = await import("../../resources/lang/en.json");
  return {
    ...original,
    translateText: (key: string, params?: Record<string, string | number>) => {
      const value =
        english.control_panel[
          key.replace(
            "control_panel.",
            "",
          ) as keyof typeof english.control_panel
        ] ?? key;
      return value.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name]));
    },
  };
});

describe("mobilisation HUD", () => {
  it("separates mobilisation from attack strength and sends an intent", async () => {
    vi.spyOn(UserSettings.prototype, "helpMessages").mockReturnValue(false);
    const player = makePlayerView({
      data: {
        civilians: 8000,
        troops: 500,
        totalPopulation: 10000,
        deployedTroops: 1500,
        mobilisationPercentage: 20,
      },
    });
    const bus = new EventBus();
    let sent: number | null = null;
    bus.on(SendMobilisationIntentEvent, (event) => {
      sent = event.percentage;
    });
    const panel = document.createElement("control-panel") as ControlPanel;
    panel.eventBus = bus;
    panel.uiState = { attackRatio: 0.2 } as UIState;
    panel.game = {
      inSpawnPhase: () => false,
      myPlayer: () => player,
      config: () =>
        stubConfig({
          maxTroops: () => 10000,
          troopIncreaseRate: () => 0,
          civilianCapacity: () => 10000,
          civilianIncreaseRate: () => 0,
        }),
      updatesSinceLastTick: () => null,
    } as unknown as GameView;
    document.body.appendChild(panel);
    panel.tick();
    await panel.updateComplete;

    const mobilisation = panel.querySelector(
      '[data-testid="mobilisation-controls"] input',
    ) as HTMLInputElement;
    expect(mobilisation.value).toBe("20");
    expect(mobilisation.getAttribute("aria-label")).toBe("Mobilisation");
    expect(panel.textContent).toContain("Actual 20%");
    expect(panel.querySelectorAll('input[type="range"]')).toHaveLength(3);

    mobilisation.value = "70";
    mobilisation.dispatchEvent(new Event("input", { bubbles: true }));
    await panel.updateComplete;
    expect(player.mobilisationPercentage()).toBe(20);
    mobilisation.dispatchEvent(new Event("change", { bubbles: true }));
    expect(sent).toBe(70);
  });
});
