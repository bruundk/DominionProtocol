import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startVisibilityFrameLoop } from "../../src/client/VisibilityFrameLoop";

describe("visibility-resilient frame loop", () => {
  let hidden = false;
  let nextID = 1;
  let callbacks = new Map<number, FrameRequestCallback>();

  beforeEach(() => {
    hidden = false;
    nextID = 1;
    callbacks = new Map();
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = nextID++;
      callbacks.set(id, cb);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      callbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const runNextFrame = () => {
    const [id, cb] = callbacks.entries().next().value as [
      number,
      FrameRequestCallback,
    ];
    callbacks.delete(id);
    cb(performance.now());
  };

  it("replaces a suspended frame request when the tab becomes visible", () => {
    const frame = vi.fn();
    const stop = startVisibilityFrameLoop(frame);
    expect(callbacks.size).toBe(1);

    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));

    expect(callbacks.size).toBe(1);
    runNextFrame();
    expect(frame).toHaveBeenCalledOnce();
    expect(callbacks.size).toBe(1);
    stop();
  });

  it("recovers from a page-cache restore and cleans up on stop", () => {
    const frame = vi.fn();
    const stop = startVisibilityFrameLoop(frame);
    window.dispatchEvent(new Event("pageshow"));
    runNextFrame();
    expect(frame).toHaveBeenCalledOnce();

    stop();
    expect(callbacks.size).toBe(0);
    window.dispatchEvent(new Event("pageshow"));
    expect(callbacks.size).toBe(0);
  });
});
