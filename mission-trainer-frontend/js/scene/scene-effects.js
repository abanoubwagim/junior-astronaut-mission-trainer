export function createSceneEffects(environment) {
  let state = { mode: "welcome", power: 12, water: 12, storm: false, success: false };
  let pulse = 0;

  function setMode(mode) {
    state.mode = mode;
  }

  function setMissionState(mission) {
    const eventTitle = mission?.event?.title || "";
    const resultStatus = mission?.result?.status || "";
    state = {
      ...state,
      power: Number(mission?.resources?.power ?? 12),
      water: Number(mission?.resources?.water ?? 12),
      food: Number(mission?.resources?.food ?? 12),
      shelterReadiness: Number(mission?.resources?.shelterReadiness ?? 12),
      storm: /storm/i.test(eventTitle) || mission?.event?.day === 4
        || Boolean(mission?.result && resultStatus !== "SUCCEEDED"),
      success: resultStatus === "SUCCEEDED"
    };
    pulse = state.success ? 1 : 0;
    environment.setSignal(state);
  }

  function update(delta) {
    if (pulse > 0) pulse = Math.max(0, pulse - delta * 0.8);
  }

  return { setMode, setMissionState, update };
}
