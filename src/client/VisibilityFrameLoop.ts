/**
 * Drive a browser animation loop that explicitly recovers after a hidden tab
 * or a page-cache restore. Browsers normally resume requestAnimationFrame,
 * but a suspended/discarded callback must not leave the game permanently
 * frozen.
 */
export function startVisibilityFrameLoop(frame: () => void): () => void {
  let rafId: number | null = null;
  let stopped = false;

  const schedule = (): void => {
    if (stopped || rafId !== null || document.hidden) return;
    rafId = requestAnimationFrame(run);
  };

  const run = (): void => {
    rafId = null;
    try {
      frame();
    } finally {
      schedule();
    }
  };

  const resume = (): void => {
    if (stopped || document.hidden) return;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    schedule();
  };

  const onVisibilityChange = (): void => {
    if (!document.hidden) resume();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", resume);
  schedule();

  return () => {
    stopped = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", resume);
  };
}
