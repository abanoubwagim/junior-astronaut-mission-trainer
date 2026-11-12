import { createAstronautCharacter } from "./astronaut-character.js?v=20261112-v61";

export function createStoryDirector(THREE, parent, environment, cameraController) {
  const astronautAssetUrl = new URL("../../assets/models/astronaut-in-spacesuit-rigged.glb", import.meta.url).href;
  const astronaut = createAstronautCharacter(THREE, parent, {
    name: "junior-astronaut",
    // Give the opening shot enough breathing room for the base silhouette and
    // the Earth to sit behind the playable astronaut.
    // Keep the opening composition clear: the astronaut stands beside the
    // airlock, leaving the cinematic copy on the left and the gate readable.
    position: [1.2, -1.03, 1.4],
    rotationY: 0,
    accentColor: 0x63e9ef,
    playerControlled: true,
    assetUrl: astronautAssetUrl,
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
    packColor: 0x493c77,
    assetUrl: astronautAssetUrl,
    assetScale: 1,
    assetHeight: 1.9,
    assetRotationY: Math.PI
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
    const introFocus = {
      arrival: "base",
      incident: "base",
      day1: "solar",
      day2: "water",
      day3: "grow",
      day4: "storm",
      ready: "base"
    }[state.introPhase] || "base";
    environment.setStoryState({ ...state, location, introFocus });
    const presentationLocation = state.interactionOpen
      ? (Number(state.mission?.event?.day || state.mission?.day || 0) === 1 ? "solar" : missionGateLocation(state.mission))
      : location;

    // The player starts in the base approach and walks to the solar array for
    // the Day 1 interaction. Once a mission chapter is complete, keep the
    // astronaut at the position where the player left them when the next
    // chapter is opened; resetting here sent Day 2/3 players back to Gate 1.
    const preserveMissionPosition = ["feedback", "day1Complete", "day2Complete", "day3Complete"]
      .includes(previousScreen);
    if (active && !wasGame && !preserveMissionPosition) {
      astronaut.root.position.set(-0.8, -1.03, 0.55);
      astronaut.root.rotation.y = 0;
    }
    if (state.screen !== "day1Complete" && ((state.dayOneComplete && !previousDayOneComplete)
        || (state.dayTwoComplete && !previousDayTwoComplete)
        || (state.dayThreeComplete && !previousDayThreeComplete))) {
      const navigationTarget = environment.getNavigationTarget?.();
      if (navigationTarget) {
        const deltaX = navigationTarget.x - astronaut.root.position.x;
        const deltaZ = navigationTarget.z - astronaut.root.position.z;
        cameraController.setHeading?.(Math.atan2(deltaX, -deltaZ));
        cameraController.setDistance?.(11.2);
      }
    }
    wasGame = active;
    operator.root.visible = !active && state.screen !== "intro";
    if (state.screen === "welcome") {
      astronaut.setAction("float");
      operator.setAction("idle");
      cameraController.setStoryTarget("base");
      cameraController.setPresentationActive?.(false);
    } else if (state.screen === "intro") {
      const introPhase = state.introPhase || "arrival";
      if (introPhase === "day4") {
        const storm = environment.getLocations?.().storm;
        const target = storm?.target || [-9, 0.8, -23.7];
        astronaut.moveTo([target[0], -1.03, target[2]], 3.1);
      } else if (introPhase === "incident") {
        astronaut.setAction("react");
      } else if (introPhase === "ready") {
        astronaut.moveTo([1.2, -1.03, 1.4], 1.1);
      } else {
        astronaut.setAction("idle");
      }
      cameraController.setCinematicPhase?.(introPhase);
      cameraController.setStoryTarget("base");
      cameraController.setPresentationActive?.(true);
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
    } else if (state.screen === "day4Complete") {
      astronaut.setAction("react");
      operator.setAction("talk");
      cameraController.setStoryTarget("storm");
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
