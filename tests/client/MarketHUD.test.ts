import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import en from "../../resources/lang/en.json";
import {
  buildTable,
  flattenedBuildTable,
} from "../../src/client/hud/layers/BuildMenu";
import { UnitType } from "../../src/core/game/Game";
import { getDefaultKeybinds } from "../../src/core/game/UserSettings";

describe("Market HUD", () => {
  it("registers the Market in the standard build menu with its original icon", () => {
    const market = flattenedBuildTable.find(
      (item) => item.unitType === UnitType.Market,
    );
    expect(market).toMatchObject({
      description: "build_menu.desc.market",
      key: "unit_type.market",
      countable: true,
    });
    expect(market?.icon).toContain("MarketIconWhite.svg");
    expect(buildTable.flat()).toContain(market);
  });

  it("uses a non-conflicting Shift+2 hotkey and translated economic details", () => {
    expect(getDefaultKeybinds(false).buildMarket).toBe("Shift+Digit2");
    expect(en.unit_type.market).toBe("Market");
    expect(en.build_menu.desc.market).toContain("civilian passive income");
    expect(en.build_menu.market_status).toContain("{constructing}");
    expect(en.user_setting.build_market).toBe("Build Market");
  });

  it("ships a safe standalone SVG and a wrapping narrow-screen hotbar", () => {
    const svg = readFileSync("resources/images/MarketIconWhite.svg", "utf8");
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.documentElement.getAttribute("viewBox")).toBe("0 0 64 64");
    expect(doc.querySelector("script, image, foreignObject")).toBeNull();

    const source = readFileSync("src/client/hud/layers/UnitDisplay.ts", "utf8");
    expect(source).toContain("flex flex-wrap justify-center");
    expect(source).toContain('this.keybinds["buildMarket"]');
    expect(source).toContain('translateText("build_menu.market_status"');
  });
});
