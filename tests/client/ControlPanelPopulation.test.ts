import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../resources/lang/en.json";
import "../../src/client/hud/layers/ControlPanel";
import type { ControlPanel } from "../../src/client/hud/layers/ControlPanel";
import type { UIState } from "../../src/client/UIState";
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
    translateText: (key: string, params?: Record<string, string | number>) => {
      if (key === "control_panel.civilian_details") {
        return english.control_panel.civilian_details.replace(
          /\{(\w+)\}/g,
          (_, name) => String(params?.[name]),
        );
      }
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
  vi.useRealTimers();
});

describe("control-panel population indicators", () => {
  it("integrates styled badges and translated troop tooltips in both HUD variants", async () => {
    vi.spyOn(UserSettings.prototype, "helpMessages").mockReturnValue(false);
    const player = makePlayerView({ data: { civilians: 1000, troops: 500 } });
    const panel = document.createElement("control-panel") as ControlPanel;
    panel.uiState = { attackRatio: 0.2 } as UIState;
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
    expect(
      panel.querySelector('[data-testid="population-summary"]'),
    ).toBeNull();
    expect(
      panel.querySelector('[data-testid="available-troop-count"]'),
    ).toBeNull();
    const badges = panel.querySelectorAll('[data-testid="civilian-count"]');
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge.textContent?.trim()).toBe(renderNumber(1000));
      expect(badge.getAttribute("title")).toBe(
        "Civilians: 1.00K / 1.00K capacity; growth: +0/s",
      );
      expect(badge.getAttribute("aria-label")).toContain(
        en.control_panel.civilians,
      );
      expect(badge.classList.contains("border")).toBe(true);
      expect(badge.querySelector("img")!.getAttribute("src")).toContain(
        "CivilianIcon.svg",
      );
    }
    const bars = panel.querySelectorAll('[data-testid="available-troop-bar"]');
    expect(bars).toHaveLength(2);
    for (const bar of bars) {
      expect(bar.getAttribute("title")).toBe(en.control_panel.available_troops);
      expect(bar.getAttribute("aria-label")).toContain(renderTroops(500));
      expect(bar.getAttribute("role")).toBe("group");
      expect(bar.textContent).not.toContain(en.control_panel.available_troops);
    }
    expect(
      panel.querySelector('[data-testid="civilian-count"]')!.textContent,
    ).toContain(renderNumber(1000));
    expect(bars[0].textContent).toContain(renderTroops(500));

    panel.game.config = () =>
      stubConfig({
        maxTroops: () => 1000,
        troopIncreaseRate: () => 1,
        civilianCapacity: () => 2000,
        civilianIncreaseRate: () => 1,
      });
    panel.tick();
    await panel.updateComplete;
    expect(badges[0].getAttribute("title")).toBe(
      "Civilians: 1.00K / 2.00K capacity; growth: +10/s",
    );
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
    expect(bars[0].getAttribute("aria-label")).toContain(renderTroops(200));
    const resources = panel.querySelector(
      '[data-testid="mobile-resource-row"]',
    )!;
    const attacks = panel.querySelector('[data-testid="mobile-attack-row"]')!;
    expect(resources.querySelector("input")).toBeNull();
    expect(resources.textContent).not.toContain("/s");
    expect(attacks.textContent).toContain("/s");
    const slider = attacks.querySelector("input")!;
    slider.value = "35";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(panel.uiState.attackRatio).toBe(0.35);
  });
  it("ships a self-contained civilian SVG distinct from the soldier", () => {
    const svg = readFileSync("resources/images/CivilianIcon.svg", "utf8");
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.documentElement.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(doc.querySelectorAll("circle")).toHaveLength(2);
    expect(doc.querySelector("script, image, foreignObject")).toBeNull();
    expect(svg).not.toBe(
      readFileSync("resources/images/SoldierIcon.svg", "utf8"),
    );
  });
  it("clips gold notifications to their indicators and restores the total", async () => {
    vi.useFakeTimers();
    vi.spyOn(UserSettings.prototype, "helpMessages").mockReturnValue(false);
    const player = makePlayerView({
      data: { civilians: 1000, gold: 137_900_000n },
    });
    const panel = document.createElement("control-panel") as ControlPanel;
    panel.uiState = { attackRatio: 0.2 } as UIState;
    panel.game = {
      inSpawnPhase: () => false,
      myPlayer: () => player,
      config: () =>
        stubConfig({ maxTroops: () => 1000, troopIncreaseRate: () => 1 }),
      updatesSinceLastTick: () => ({
        [GameUpdateType.BonusEvent]: [{ player: player.id(), gold: 10000 }],
      }),
    } as unknown as GameView;
    document.body.appendChild(panel);
    panel.tick();
    await panel.updateComplete;
    const pulses = panel.querySelectorAll(".gold-gain-pop");
    expect(pulses).toHaveLength(2);
    for (const pulse of pulses) {
      expect(pulse.classList.contains("inset-0")).toBe(true);
      expect(pulse.parentElement!.classList.contains("overflow-hidden")).toBe(
        true,
      );
      expect(pulse.textContent).toContain(`+${renderNumber(10000)}`);
      expect(pulse.parentElement!.textContent).toContain(
        renderNumber(137_900_000n),
      );
    }
    vi.advanceTimersByTime(2000);
    await panel.updateComplete;
    expect(panel.querySelector(".gold-gain-pop")).toBeNull();
  });
});
