export function createSceneEffects(environment) {
  let state = { mode: "welcome", storm: false, success: false };
  let pulse = 0;

  function setMode(mode) {
    state.mode = mode;
  }

  function setMissionState(mission) {
    const eventTitle = mission?.event?.title || "";
    const resultStatus = mission?.result?.status || "";
    state = {
      ...state,
      storm: /storm/i.test(eventTitle) || mission?.event?.day === 4,
      success: resultStatus === "DAY_1_COMPLETE"
    };
    pulse = state.success ? 1 : 0;
    environment.setSignal(state);
  }

  function update(delta) {
    if (pulse > 0) pulse = Math.max(0, pulse - delta * 0.8);
  }

  return { setMode, setMissionState, update };
}
