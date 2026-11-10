import { createAstronautCharacter } from "./astronaut-character.js?v=20261110-v51";

export function createStoryDirector(THREE, parent, environment, cameraController) {
  const astronaut = createAstronautCharacter(THREE, parent, {
    name: "junior-astronaut",
    // Give the opening shot enough breathing room for the base silhouette and
    // the Earth to sit behind the playable astronaut.
    // Keep the opening composition clear: the astronaut stands left of the
    // airlock so MoonBase 1 and its doorway are readable on the first frame.
    position: [-1.8, -1.03, 1.75],
    rotationY: 0,
    accentColor: 0x63e9ef,
    playerControlled: true,
    assetUrl: new URL("../../assets/models/astronaut-in-spacesuit-rigged.glb", import.meta.url).href,
    assetScale: 1,
    assetHeight: 1.95,
    assetRotationY: Math.PI,
    onAssetStatus: (status) => window.MOONBASE_SCENE_LIFECYCLE?.onAssetStatus?.(status)
  });
  const operator = createAstronautCharacter(THREE, parent, {
    name: "mission-operator",
    position: [-0.9, -1.03, -3.1],
    rotationY: 0.5,
    suitColor: 0xd8d5ff,
    suitShadow: 0x8f83c7,
    accentColor: 0xffd36f,
    visorColor: 0x241c55,
    packColor: 0x493c77
  });
  let state = { screen: "welcome", mission: null, selectedChoiceId: null, interactionOpen: false };
  let wasGame = false;

  function objectiveLocation(mission) {
    const day = Number(mission?.event?.day || mission?.day || 0);
    return ["base", "solar", "water", "grow", "storm"][day] || "base";
  }

  function missionGateLocation(mission) {
    const day = Number(mission?.event?.day || mission?.day || 0);
    return [`base`, `gate1`, `gate2`, `gate3`, `gate4`][day] || "base";
  }

  function setState(nextState = {}) {
    const previousScreen = state.screen;
    const previousDayOneComplete = Boolean(state.dayOneComplete);
    const previousDayTwoComplete = Boolean(state.dayTwoComplete);
    const previousDayThreeComplete = Boolean(state.dayThreeComplete);
    state = { ...state, ...nextState };
    const active = state.screen === "game";
    const location = objectiveLocation(state.mission);
    environment.setStoryState({ ...state, location });
    const presentationLocation = state.interactionOpen
      ? missionGateLocation(state.mission)
      : location;

    // The player starts beside the first airlock when Day 1 becomes playable.
    // The welcome composition remains farther back, but the gameplay spawn is
    // intentionally within the door's interaction radius.
    if (active && !wasGame && previousScreen !== "feedback") {
      astronaut.root.position.set(-0.8, -1.03, 0.55);
      astronaut.root.rotation.y = 0;
    }
    if ((state.screen === "day1Complete" && previousScreen !== "day1Complete")
        || (state.dayOneComplete && !previousDayOneComplete)
        || (state.dayTwoComplete && !previousDayTwoComplete)
        || (state.dayThreeComplete && !previousDayThreeComplete)) {
      const navigationTarget = environment.getNavigationTarget?.();
      if (navigationTarget) {
        const deltaX = navigationTarget.x - astronaut.root.position.x;
        const deltaZ = navigationTarget.z - astronaut.root.position.z;
        cameraController.setHeading?.(Math.atan2(deltaX, -deltaZ));
        cameraController.setDistance?.(11.2);
      }
    }
    wasGame = active;
    operator.root.visible = !active;
    if (state.screen === "welcome") {
      astronaut.setAction("float");
      operator.setAction("idle");
      cameraController.setStoryTarget("base");
      cameraController.setPresentationActive?.(false);
    } else if (state.screen === "briefing") {
      astronaut.setAction("point");
      operator.setAction("talk");
      cameraController.setStoryTarget("base");
      cameraController.setPresentationActive?.(false);
    } else if (state.screen === "game") {
      if (state.interactionOpen) astronaut.setAction("talk");
      cameraController.setStoryTarget(presentationLocation);
      cameraController.setPresentationActive?.(Boolean(state.interactionOpen));
    } else if (state.screen === "feedback") {
      astronaut.setAction(state.mission?.status === "ACTIVE" ? "react" : "disappointed");
      operator.setAction("talk");
      cameraController.setStoryTarget(location);
      cameraController.setPresentationActive?.(false);
    } else if (state.screen === "day1Complete") {
      astronaut.setAction("celebrate");
      operator.setAction("talk");
      cameraController.setStoryTarget("base");
      cameraController.setPresentationActive?.(false);
    } else if (state.screen === "result") {
      const success = state.mission?.result?.status === "SUCCEEDED";
      astronaut.setAction(success ? "celebrate" : "disappointed");
      operator.setAction("talk");
      cameraController.setStoryTarget("storm");
      cameraController.setPresentationActive?.(false);
    }
  }

  function update(delta, time) {
    astronaut.update(delta, time);
    operator.update(delta, time + 0.8);
  }

  function dispose() {
    astronaut.dispose();
    operator.dispose();
  }

  return {
    setState,
    update,
    dispose,
    getPlayer: () => astronaut,
    getOperator: () => operator
  };
}
