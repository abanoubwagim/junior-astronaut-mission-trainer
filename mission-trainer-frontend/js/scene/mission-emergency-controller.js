const EMERGENCY_COPY = Object.freeze({
  1: Object.freeze({
    title: "POWER DROP",
    message: "Mission Control: The base is receiving less sunlight. Investigate the power system."
  }),
  2: Object.freeze({
    title: "WATER QUALITY ALERT",
    message: "Mission Control: Recovered water has not passed its quality check. Investigate the water recovery station."
  }),
  3: Object.freeze({
    title: "FOOD SUPPLY WARNING",
    message: "Mission Control: Available food supplies are becoming limited. Investigate the food production systems."
  }),
  4: Object.freeze({
    title: "SOLAR RADIATION ALERT",
    message: "Mission Control: A solar particle event warning has been received. Follow the emergency protocol."
  })
});

const INITIAL_DELAY_SECONDS = 1;
const PROGRESSION_DELAY_SECONDS = 3;

export function createMissionEmergencyController({ onChange } = {}) {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let story = {};
  let day = 0;
  let status = "idle";
  let elapsed = 0;
  let visible = false;
  let objectiveVisible = false;
  let disposed = false;

  function detail() {
    const copy = EMERGENCY_COPY[day] || {};
    return {
      active: Boolean(day && story.screen === "game" && story.mission?.status === "ACTIVE"),
      day,
      title: copy.title || "",
      message: copy.message || "",
      status,
      visible,
      objectiveVisible,
      reducedMotion: Boolean(reducedMotion)
    };
  }

  function emit() {
    if (!disposed) onChange?.(detail());
  }

  function reset() {
    day = 0;
    status = "idle";
    elapsed = 0;
    visible = false;
    objectiveVisible = false;
    emit();
  }

  function setStoryState(nextStory = {}) {
    if (disposed) return;
    const nextDay = Number(nextStory.mission?.event?.day || nextStory.mission?.day || 0);
    const active = nextStory.screen === "game" && nextStory.mission?.status === "ACTIVE" && nextDay > 0;
    const dayChanged = nextDay !== day;
    story = nextStory;

    if (!active) {
      reset();
      return;
    }

    if (dayChanged) {
      day = nextDay;
      elapsed = 0;
      visible = false;
      objectiveVisible = false;
      status = "queued";
      emit();
      return;
    }

  }

  function update(delta = 0) {
    if (disposed || status !== "queued" || !day) return;
    if (story.interactionOpen || story.feedbackOpen || story.loading || story.paused) return;
    elapsed += Math.max(0, Number(delta) || 0);
    const delay = day === 1 ? INITIAL_DELAY_SECONDS : PROGRESSION_DELAY_SECONDS;
    if (elapsed < delay) return;
    status = "visible";
    visible = true;
    objectiveVisible = true;
    emit();
  }

  function dismiss() {
    if (disposed || !day || !visible) return;
    visible = false;
    objectiveVisible = true;
    status = "dismissed";
    emit();
  }

  function dispose() {
    disposed = true;
    story = {};
    onChange = null;
  }

  return {
    setStoryState,
    update,
    dismiss,
    dispose,
    getState: detail
  };
}
