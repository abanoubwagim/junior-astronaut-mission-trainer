const DEFAULT_TIMELINE = Object.freeze([
  { id: "arrival", duration: 2.2 },
  { id: "incident", duration: 3.1 },
  { id: "day1", duration: 3.4 },
  { id: "day2", duration: 3.4 },
  { id: "day3", duration: 3.4 },
  { id: "day4", duration: 3.5 },
  { id: "ready", duration: 0 }
]);

/**
 * Coordinates the intro's timed beats from the existing render loop.
 * Camera, character and environment motion remain owned by their existing
 * controllers; this module only advances the presentation phase.
 */
export function createCinematicIntroController(options = {}) {
  const timeline = Array.isArray(options.timeline) && options.timeline.length
    ? options.timeline
    : DEFAULT_TIMELINE;
  let active = false;
  let index = 0;
  let elapsed = 0;
  let lastPhase = "";

  function current() {
    const item = timeline[Math.min(index, timeline.length - 1)] || timeline[0];
    return {
      phase: item?.id || "ready",
      index,
      total: timeline.length,
      progress: item?.duration ? Math.min(1, elapsed / item.duration) : 1,
      duration: item?.duration || 0,
      active
    };
  }

  function emit(force = false) {
    const state = current();
    if (!force && state.phase === lastPhase) return;
    lastPhase = state.phase;
    options.onPhaseChange?.(state);
  }

  function reset() {
    index = 0;
    elapsed = 0;
    lastPhase = "";
    emit(true);
  }

  function setActive(nextActive) {
    const next = Boolean(nextActive);
    if (next === active && next) return;
    active = next;
    if (active) reset();
    else emit(true);
  }

  function update(delta) {
    if (!active || current().phase === "ready") return;
    elapsed += Math.min(0.1, Math.max(0, Number(delta) || 0));
    let item = timeline[index];
    while (item && item.duration > 0 && elapsed >= item.duration && index < timeline.length - 1) {
      elapsed -= item.duration;
      index += 1;
      item = timeline[index];
      emit(true);
    }
  }

  function dispose() {
    active = false;
    options.onPhaseChange = null;
  }

  return {
    getState: current,
    reset,
    setActive,
    update,
    dispose,
    timeline
  };
}
