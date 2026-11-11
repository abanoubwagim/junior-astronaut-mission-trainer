(() => {
  "use strict";

  const API_BASE = (window.MOONBASE_API_BASE_URL || "http://localhost:8080/api/v1").replace(/\/$/, "");
  const root = document.querySelector("#app");
  const announcer = document.querySelector("#announcer");
  // Keep the radar projection aligned with the movement bounds used by the
  // 3D player controller. The opening screen renders before the first scene
  // telemetry tick, so the CSS fallback is intentionally the center of the
  // radar rather than an arbitrary pixel coordinate.
  const RADAR_WORLD_BOUNDS = Object.freeze({ minX: -36.5, maxX: 36.5, minZ: -40.5, maxZ: 27.5 });

  const ui = {
    screen: "welcome",
    mission: null,
    decisionHistory: [],
    selectedChoiceId: null,
    loading: false,
    error: "",
    communicationOpen: false,
    interactionOpen: false,
    interactionTarget: null,
    gateOpening: false,
    paused: false,
    // Keep the world visible on first entry; players can expand the compact
    // keyboard guide whenever they need it.
    controlsCollapsed: true,
    sceneAvailable: document.documentElement?.dataset?.sceneStatus !== "fallback",
    sceneError: "",
    sceneAssetStatus: "loading",
    world: "moon",
    inspectionComplete: false,
    gateProgress: {},
    feedbackDismissed: true,
    dayOneComplete: false,
    dayTwoComplete: false,
    dayThreeComplete: false,
    dayFourComplete: false,
    emergencyProcedureComplete: false
  };

  function syncScene() {
    window.MOONBASE_SCENE_MODE = ui.screen;
    window.MOONBASE_SCENE_WORLD = ui.world;
    window.MOONBASE_SCENE_STATE = ui.mission;
    window.MOONBASE_SCENE_STORY = {
      screen: ui.screen,
      mission: ui.mission,
      selectedChoiceId: ui.selectedChoiceId,
      loading: ui.loading,
      error: ui.error,
      interactionOpen: ui.interactionOpen,
      gateOpening: ui.gateOpening,
      paused: ui.paused,
      gateProgress: ui.gateProgress,
      dayOneComplete: ui.dayOneComplete,
      dayTwoComplete: ui.dayTwoComplete,
      dayThreeComplete: ui.dayThreeComplete,
      dayFourComplete: ui.dayFourComplete,
      inspectionComplete: ui.inspectionComplete,
      emergencyProcedureComplete: ui.emergencyProcedureComplete
    };
    if (document.body?.dataset) document.body.dataset.appScreen = ui.screen;
    if (document.body?.dataset) document.body.dataset.appWorld = ui.world;
    const brandName = document.querySelector(".brand-name");
    if (brandName) {
      brandName.dataset.missionDay = String(ui.mission?.event?.day || ui.mission?.day || 1);
      brandName.dataset.totalDays = String(ui.mission?.totalDays || 4);
    }
    if (window.MoonBaseScene) {
      window.MoonBaseScene.setInteractionHandler?.(sceneInteractionHandler);
      window.MoonBaseScene.setMode?.(ui.screen);
      window.MoonBaseScene.setMissionState?.(ui.mission);
      window.MoonBaseScene.setStoryState?.(window.MOONBASE_SCENE_STORY);
    }
  }

  window.MOONBASE_SCENE_LIFECYCLE = {
    onReady() {
      ui.sceneAvailable = true;
      ui.sceneError = "";
      render();
    },
    onAssetStatus(detail = {}) {
      ui.sceneAssetStatus = detail.status || "loading";
      if (detail.status === "error") {
        ui.sceneAvailable = false;
        ui.sceneError = "The local astronaut model could not load. A temporary articulated fallback is active.";
        console.error("MoonBase astronaut asset error.", detail.error);
      } else if (detail.status === "ready") {
        ui.sceneError = "";
      }
      render();
    },
    onFallback(error) {
      ui.sceneAvailable = false;
      ui.sceneError = "The 3D view is unavailable, so Mission Control has opened the accessible mission terminal.";
      console.warn("MoonBase is using the accessible gameplay fallback.", error);
      render();
    }
  };

  function make(tag, className = "", text = null) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== null && text !== undefined) element.textContent = String(text);
    return element;
  }

  function button(label, className, onClick, disabled = false) {
    const control = make("button", `button ${className || ""}`.trim(), label);
    control.type = "button";
    control.disabled = Boolean(disabled);
    control.addEventListener("click", onClick);
    return control;
  }

  function append(parent, ...children) {
    for (const child of children) {
      if (child) parent.append(child);
    }
    return parent;
  }

  function controlRow(key, label) {
    const row = make("div", "controls-line");
    append(row, make("span", "control-key", key), make("span", "control-label", label));
    return row;
  }

  function renderGameControls({ showPause = false } = {}) {
    const controls = make("aside", `gameplay-controls${ui.controlsCollapsed ? " is-collapsed" : ""}`);
    const controlsHeader = make("div", "controls-header");
    const toggle = button(ui.controlsCollapsed ? "⌨" : "−", "controls-toggle", () => {
      ui.controlsCollapsed = !ui.controlsCollapsed;
      render();
    }, ui.loading || ui.interactionOpen);
    toggle.setAttribute("aria-label", ui.controlsCollapsed ? "Expand controls" : "Collapse controls");
    toggle.setAttribute("aria-expanded", String(!ui.controlsCollapsed));
    toggle.title = ui.controlsCollapsed ? "Expand controls" : "Collapse controls";
    append(controlsHeader, make("span", "controls-label", "CONTROLS"), make("span", "controls-header-status", "READY"), toggle);
    if (ui.controlsCollapsed) {
      append(controls, controlsHeader, make("span", "controls-collapsed-icon", "⌨"));
      return controls;
    }
    append(controls, controlsHeader,
      controlRow("W A S D", "Move"),
      controlRow("SHIFT", "Movement boost"),
      controlRow("SPACE", "Jump"),
      controlRow("E", "Interact"),
      controlRow("MOUSE", "Look around"));
    if (showPause) {
      controls.append(button(ui.paused ? "Resume mission" : "Pause", "button-secondary gameplay-pause-button", () => {
        ui.paused = !ui.paused;
        render();
      }, ui.loading || ui.interactionOpen));
    }
    return controls;
  }

  function renderTouchControls() {
    const controls = make("aside", "gameplay-touch-controls");
    controls.setAttribute("aria-label", "Touch movement controls");
    const header = make("div", "touch-controls-header");
    append(header,
      make("span", "touch-controls-title", "TOUCH FLIGHT DECK"),
      make("span", "touch-controls-note", "Hold to move · drag to look"));

    const pad = make("div", "touch-control-pad");
    const movementButtons = [
      ["▲", "up", "Move forward"],
      ["◀", "left", "Move left"],
      ["▼", "down", "Move backward"],
      ["▶", "right", "Move right"]
    ];
    movementButtons.forEach(([label, direction, ariaLabel]) => {
      const control = button(label, `touch-control-button touch-move-${direction}`, () => {}, false);
      control.setAttribute("aria-label", ariaLabel);
      const start = (event) => {
        event.preventDefault();
        control.setPointerCapture?.(event.pointerId);
        window.MoonBaseScene?.setTouchMovement?.(direction, true);
      };
      const stop = (event) => {
        event.preventDefault();
        window.MoonBaseScene?.setTouchMovement?.(direction, false);
      };
      control.addEventListener("pointerdown", start);
      control.addEventListener("pointerup", stop);
      control.addEventListener("pointercancel", stop);
      control.addEventListener("pointerleave", stop);
      pad.append(control);
    });
    const jump = button("JUMP", "touch-control-button touch-jump", () => {
      window.MoonBaseScene?.jump?.();
    });
    jump.setAttribute("aria-label", "Jump");
    pad.append(jump);

    const lookPad = make("div", "touch-look-pad", "DRAG HERE TO LOOK AROUND");
    let looking = false;
    let lastPoint = null;
    lookPad.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      lookPad.setPointerCapture?.(event.pointerId);
      looking = true;
      lastPoint = { x: event.clientX, y: event.clientY };
    });
    lookPad.addEventListener("pointermove", (event) => {
      if (!looking || !lastPoint) return;
      event.preventDefault();
      const dx = event.clientX - lastPoint.x;
      const dy = event.clientY - lastPoint.y;
      lastPoint = { x: event.clientX, y: event.clientY };
      window.MoonBaseScene?.lookBy?.(dx, dy);
    });
    const stopLooking = () => {
      looking = false;
      lastPoint = null;
    };
    lookPad.addEventListener("pointerup", stopLooking);
    lookPad.addEventListener("pointercancel", stopLooking);
    lookPad.addEventListener("pointerleave", stopLooking);

    append(controls, header, pad, lookPad);
    return controls;
  }

  const sceneInteractionHandler = {
    onPlayerUpdate(telemetry) {
      const radar = root.querySelector?.(".mission-radar-gameplay, .mission-radar");
      if (!radar || !telemetry) return;
      const player = telemetry.player || {};
      const objective = telemetry.objective || {};
      const size = Math.min(radar.clientWidth || 168, radar.clientHeight || 168);
      const mapRadius = Math.max(24, size * 0.36);
      const mapAxis = (value, minimum, maximum) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) return 0;
        const normalized = (numericValue - minimum) / (maximum - minimum);
        return Math.max(-1, Math.min(1, normalized * 2 - 1));
      };
      const mapX = (value) => mapAxis(value, RADAR_WORLD_BOUNDS.minX, RADAR_WORLD_BOUNDS.maxX);
      const mapZ = (value) => mapAxis(value, RADAR_WORLD_BOUNDS.minZ, RADAR_WORLD_BOUNDS.maxZ);
      radar.style.setProperty("--radar-player-left", `${size / 2 + mapX(player.x) * mapRadius}px`);
      radar.style.setProperty("--radar-player-top", `${size / 2 + mapZ(player.z) * mapRadius}px`);
      const heading = Number(player.heading);
      radar.style.setProperty("--radar-heading", `${Number.isFinite(heading) ? heading : 0}rad`);
      const hasObjective = Number.isFinite(Number(objective.x)) && Number.isFinite(Number(objective.z));
      radar.classList.toggle("has-objective", hasObjective);
      if (hasObjective) {
        radar.style.setProperty("--radar-objective-left", `${size / 2 + mapX(objective.x) * mapRadius}px`);
        radar.style.setProperty("--radar-objective-top", `${size / 2 + mapZ(objective.z) * mapRadius}px`);
      } else {
        radar.style.removeProperty("--radar-objective-left");
        radar.style.removeProperty("--radar-objective-top");
      }
    },
    onProximity(target) {
      const nextTarget = target || null;
      const nextId = nextTarget?.id || "";
      const currentId = ui.interactionTarget?.id || "";
      if (nextId === currentId && (!nextTarget || nextTarget.distance === ui.interactionTarget?.distance)) return;
      ui.interactionTarget = nextTarget;
      if (["game", "welcome"].includes(ui.screen) && !ui.interactionOpen && !ui.loading) render();
    },
    onGateOpening(target) {
      if (ui.screen !== "game" || ui.loading || !target) return;
      ui.gateOpening = true;
      ui.interactionTarget = { ...target, opening: true };
      ui.interactionOpen = false;
      ui.paused = true;
      render();
      announce(`Mission gate opening. ${target.name} is preparing the next chapter.`);
    },
    onGateOpened(target) {
      if (ui.screen !== "game" || ui.loading || !target) return;
      ui.gateOpening = false;
      ui.gateProgress = { ...ui.gateProgress, [target.day]: true };
      ui.interactionTarget = null;
      ui.interactionOpen = false;
      ui.inspectionComplete = false;
      ui.paused = false;
      ui.error = "";
      render();
      root.focus({ preventScroll: true });
      const day = Number(ui.mission?.event?.day || 0);
      announce(day === 2
        ? "You entered the lunar habitat. Find the Water Recovery Station and inspect it."
        : day === 3
          ? "You entered the lunar habitat. Find the Crop Production Unit and inspect it."
        : day === 4
          ? "You entered the lunar habitat. Proceed to the Storm Shelter and press E."
        : `${target.name} is open. Read Mission Control's briefing and choose a solution.`);
    },
    onInteract(target) {
      const day = Number(ui.mission?.event?.day || ui.mission?.day || 0);
      const expectedTargetId = day === 1 ? "solar-array" : day === 2 ? "water-recycler" : day === 3 ? "grow-tray" : day === 4 ? "storm-shelter" : "";
      if (ui.screen !== "game" || ui.loading || !target || target.id !== expectedTargetId
          || ui.interactionOpen || ui.inspectionComplete) return;
      ui.interactionTarget = target;
      ui.interactionOpen = true;
      ui.inspectionComplete = true;
      ui.emergencyProcedureComplete = day === 4;
      ui.feedbackDismissed = true;
      ui.paused = false;
      ui.error = "";
      render();
      root.focus({ preventScroll: true });
      announce(day === 2
        ? "Water Recovery Station inspected. Read the WATER QUALITY ALERT before choosing a response."
        : day === 3
          ? "Crop Production Unit inspected. Read the FOOD SUPPLY WARNING before choosing a response."
        : day === 4
          ? "EVA stopped. You entered the Storm Shelter. Review the shelter status and choose a supplementary-shielding strategy."
        : `You reached ${target.name}. Read Commander Vega's mission briefing.`);
    }
  };

  window.MOONBASE_SCENE_INTERACTION_HANDLER = sceneInteractionHandler;

  function handleWelcomeKeydown(event) {
    if (event.repeat || ui.loading) return;
    const tagName = String(event.target?.tagName || "").toUpperCase();
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tagName)) return;

    if (ui.screen === "briefing" && ["Enter", "Space"].includes(event.code)) {
      event.preventDefault();
      root.querySelector?.(".briefing-continue-button")?.click?.();
      return;
    }

    if (event.code !== "Space" || ui.screen !== "welcome") return;
    event.preventDefault();
    root.querySelector?.(".welcome-start-button")?.focus?.({ preventScroll: true });
    root.querySelector?.(".welcome-start-button")?.click?.();
  }

  window.addEventListener?.("keydown", handleWelcomeKeydown, { passive: false });

  function resetViewport() {
    window.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  }

  function setScreen(screen) {
    resetViewport();
    ui.screen = screen;
    ui.error = "";
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = screen === "game";
    ui.gateProgress = {};
    ui.inspectionComplete = false;
    ui.feedbackDismissed = true;
    ui.dayOneComplete = false;
    ui.dayTwoComplete = false;
    ui.dayThreeComplete = false;
    ui.dayFourComplete = false;
    ui.emergencyProcedureComplete = false;
    render();
    root.focus({ preventScroll: true });
  }

  async function request(path, options = {}) {
    let response;
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutMs = Number(window.MOONBASE_REQUEST_TIMEOUT_MS || 0);
    const timeoutId = controller && timeoutMs > 0 && typeof window.setTimeout === "function"
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: options.method || "GET",
        headers: options.body ? { "Content-Type": "application/json" } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
        signal: controller?.signal
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Mission Control took too long to respond. Check the backend, then try again.");
      }
      throw new Error("The mission server could not be reached. Check that the backend is running, then try again.");
    } finally {
      if (timeoutId !== null) window.clearTimeout?.(timeoutId);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const error = new Error(payload?.error?.message || `The mission request failed (${response.status}). Please try again.`);
      error.code = payload?.error?.code || "REQUEST_FAILED";
      throw error;
    }
    if (!payload || typeof payload.status !== "string") {
      throw new Error("The mission server returned an incomplete response. Please try again.");
    }
    return payload;
  }

  function validateMission(payload) {
    if (!payload || typeof payload.status !== "string") {
      throw new Error("Mission Control returned an incomplete mission response. Please try again.");
    }
    if (!payload.qualitativeState || !Array.isArray(payload.decisionHistory)) {
      throw new Error("Mission Control returned an incomplete mission state. Your mission was not advanced.");
    }
    if (payload.status === "ACTIVE" && !payload.event) {
      throw new Error("Mission Control did not return the next mission event. Your mission was not advanced.");
    }
    if (["DAY_1_COMPLETE", "DAY_2_COMPLETE", "DAY_3_COMPLETE", "DAY_4_COMPLETE"].includes(payload.status) && (!payload.result || payload.event)) {
      throw new Error("Mission Control did not return the terminal mission result. Your mission was not advanced.");
    }
    if (!["ACTIVE", "DAY_1_COMPLETE", "DAY_2_COMPLETE", "DAY_3_COMPLETE", "DAY_4_COMPLETE"].includes(payload.status)) {
      throw new Error("Mission Control returned an unsupported mission status. Your mission was not advanced.");
    }
    return payload;
  }

  function sameDecisionHistory(first, second) {
    return Array.isArray(first) && Array.isArray(second)
      && first.length === second.length
      && first.every((decision, index) => decision.day === second[index].day
        && decision.choiceId === second[index].choiceId);
  }

  function displayError(error) {
    return error?.message || "Mission Control could not complete that request. Please try again.";
  }

  function startMission() {
    if (ui.loading) return;
    resetViewport();
    ui.mission = null;
    ui.decisionHistory = [];
    ui.selectedChoiceId = null;
    ui.error = "";
    ui.communicationOpen = false;
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = true;
    ui.gateProgress = {};
    ui.inspectionComplete = false;
    ui.feedbackDismissed = true;
    ui.dayOneComplete = false;
    ui.dayTwoComplete = false;
    ui.dayThreeComplete = false;
    ui.dayFourComplete = false;
    ui.emergencyProcedureComplete = false;
    ui.loading = false;
    ui.screen = "briefing";
    render();
    announce("Mission briefing ready. Review the objectives, then choose the Moon.");
    root.focus({ preventScroll: true });
  }

  async function startMoonMission() {
    if (ui.loading) return;
    resetViewport();
    ui.world = "moon";
    ui.mission = null;
    ui.decisionHistory = [];
    ui.selectedChoiceId = null;
    ui.error = "";
    ui.communicationOpen = false;
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = true;
    ui.gateProgress = {};
    ui.inspectionComplete = false;
    ui.feedbackDismissed = true;
    ui.dayOneComplete = false;
    ui.dayTwoComplete = false;
    ui.dayThreeComplete = false;
    ui.dayFourComplete = false;
    ui.emergencyProcedureComplete = false;
    ui.loading = true;
    ui.screen = "worldSelection";
    render();

    try {
      const mission = validateMission(await request("/missions/start", { method: "POST" }));
      if (mission.status !== "ACTIVE" || mission.day !== 1 || mission.event?.title !== "POWER DROP") {
        throw new Error("Mission Control returned an unsupported Day 1 mission state. Please try again.");
      }
      ui.mission = mission;
      ui.screen = "game";
      announce("Day 1 is ready. Walk to the solar array and inspect it.");
    } catch (error) {
      ui.error = displayError(error);
      ui.screen = "worldSelection";
      announce(ui.error);
    } finally {
      ui.loading = false;
      render();
      root.focus({ preventScroll: true });
      if (ui.screen === "game") window.MoonBaseScene?.focus?.();
    }
  }

  async function submitChoice() {
    const event = ui.mission?.event;
    if (!event || ui.mission?.status !== "ACTIVE" || !ui.selectedChoiceId || ui.loading) return;

    const candidateHistory = [
      ...ui.decisionHistory,
      { day: event.day, choiceId: ui.selectedChoiceId }
    ];
    const selectedId = ui.selectedChoiceId;
    ui.loading = true;
    ui.error = "";
    render();

    try {
      const updatedMission = await request("/missions/decisions", {
        method: "POST",
        body: { decisions: candidateHistory }
      });
      validateMission(updatedMission);
      if (!sameDecisionHistory(updatedMission.decisionHistory, candidateHistory)
          || !updatedMission.latestDecision) {
        throw new Error("The mission server returned an incomplete decision result. Your choice was not advanced.");
      }
      ui.decisionHistory = updatedMission.decisionHistory;
      ui.mission = updatedMission;
      ui.selectedChoiceId = null;
      ui.interactionOpen = false;
      ui.interactionTarget = null;
      ui.gateOpening = false;
      ui.paused = false;
      ui.feedbackDismissed = false;
      ui.dayOneComplete = event.day === 1;
      ui.dayTwoComplete = event.day === 2;
      ui.dayThreeComplete = event.day === 3;
      ui.dayFourComplete = event.day === 4;
      ui.screen = event.day === 1 ? "day1Complete" : event.day === 2 ? "day2Complete" : event.day === 3 ? "day3Complete" : event.day === 4 ? "day4Complete" : "result";
      resetViewport();
      announce(`Day ${event.day} complete. ${updatedMission.latestDecision.explanation}`);
    } catch (error) {
      ui.error = displayError(error);
      ui.selectedChoiceId = selectedId;
      announce(ui.error);
    } finally {
      ui.loading = false;
      render();
      root.focus({ preventScroll: true });
    }
  }

  function beginDayTwo() {
    if (ui.loading || !ui.mission?.event || ui.mission.event.day !== 2) return;
    resetViewport();
    ui.screen = "game";
    ui.error = "";
    ui.selectedChoiceId = null;
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.inspectionComplete = false;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = true;
    ui.gateProgress = {};
    ui.feedbackDismissed = true;
    ui.dayOneComplete = true;
    ui.dayTwoComplete = false;
    ui.dayThreeComplete = false;
    ui.dayFourComplete = false;
    ui.emergencyProcedureComplete = false;
    render();
    announce("Day 2 briefing ready. Enter the lunar habitat and find the Water Recovery Station.");
    root.focus({ preventScroll: true });
    window.MoonBaseScene?.focus?.();
  }

  function beginDayThree() {
    if (ui.loading || !ui.mission?.event || ui.mission.event.day !== 3) return;
    resetViewport();
    ui.screen = "game";
    ui.error = "";
    ui.selectedChoiceId = null;
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.inspectionComplete = false;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = true;
    ui.gateProgress = {};
    ui.feedbackDismissed = true;
    ui.dayOneComplete = true;
    ui.dayTwoComplete = true;
    ui.dayThreeComplete = false;
    ui.dayFourComplete = false;
    ui.emergencyProcedureComplete = false;
    render();
    announce("Day 3 briefing ready. Enter the Crop Production Unit and inspect the food and crop systems.");
    root.focus({ preventScroll: true });
    window.MoonBaseScene?.focus?.();
  }

  async function beginDayFour() {
    if (ui.loading || !ui.mission) return;
    resetViewport();

    // A browser can still be holding the pre-Day-4 response where Day 3 was
    // terminal. Replay the complete in-memory history once so the current
    // backend can open Day 4 without changing the stateless contract.
    if (ui.mission.event?.day === 3 && ui.decisionHistory.length === 3) {
      ui.loading = true;
      ui.error = "";
      render();
      try {
        const updatedMission = validateMission(await request("/missions/decisions", {
          method: "POST",
          body: { decisions: ui.decisionHistory }
        }));
        if (updatedMission.status !== "ACTIVE" || updatedMission.day !== 4 || !updatedMission.event) {
          throw new Error("Mission Control did not return the Day 4 briefing. Restart the backend and try again.");
        }
        ui.mission = updatedMission;
        ui.decisionHistory = updatedMission.decisionHistory;
      } catch (error) {
        ui.error = displayError(error);
        ui.loading = false;
        render();
        announce(ui.error);
        return;
      }
      ui.loading = false;
    }

    if (!ui.mission.event || ui.mission.event.day !== 4) {
      ui.error = "Day 4 is not available from the current mission response. Restart the backend, then try again.";
      render();
      announce(ui.error);
      return;
    }
    ui.screen = "game";
    ui.error = "";
    ui.selectedChoiceId = null;
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.inspectionComplete = false;
    ui.emergencyProcedureComplete = false;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = true;
    ui.gateProgress = {};
    ui.feedbackDismissed = true;
    ui.dayOneComplete = true;
    ui.dayTwoComplete = true;
    ui.dayThreeComplete = true;
    ui.dayFourComplete = false;
    render();
    announce("Day 4 briefing ready. Stop EVA and enter the designated Storm Shelter before choosing a shielding strategy.");
    root.focus({ preventScroll: true });
    window.MoonBaseScene?.focus?.();
  }

  function announce(message) {
    announcer.textContent = "";
    window.setTimeout(() => { announcer.textContent = message; }, 20);
  }

  function render() {
    const previousScreen = document.body?.dataset?.appScreen || "";
    syncScene();
    root.replaceChildren();
    if (ui.error) root.append(make("div", "alert-box", ui.error));

    switch (ui.screen) {
      case "briefing": renderBriefing(); break;
      case "worldSelection": renderWorldSelection(); break;
      case "game": renderGame(); break;
      case "day1Complete": renderDayOneComplete(); break;
      case "day2Complete": renderDayTwoComplete(); break;
      case "day3Complete": renderDayThreeComplete(); break;
      case "day4Complete": renderDayFourComplete(); break;
      case "feedback": renderFeedback(); break;
      case "result": renderResult(); break;
      default: renderWelcome();
    }
    const brandName = document.querySelector(".brand-name");
    if (brandName) {
      brandName.dataset.missionDay = String(ui.mission?.event?.day || ui.mission?.day || 1);
      brandName.dataset.totalDays = String(ui.mission?.totalDays || 4);
    }
    if (!previousScreen || previousScreen !== ui.screen) resetViewport();
  }

  function renderWelcome() {
    const worldName = "MOON";
    const protocolLabel = "LUNAR EXPEDITION PROTOCOL // SOUTH POLE SECTOR";
    const briefingLabel = "NASA-INSPIRED LUNAR MISSION BRIEFING";
    const targetLabel = "LUNAR SOUTH POLE";
    const assuranceLabel = "Explore the Moon, inspect a solar array, and choose how the base should respond to a power drop.";
    const section = make("section", "moonbase-welcome");
    section.setAttribute("aria-labelledby", "welcome-title");
    const topHud = make("header", "welcome-top-hud");
    topHud.setAttribute("aria-label", "Mission reference telemetry");
    const protocol = make("div", "welcome-protocol");
    append(protocol,
      make("span", "welcome-telemetry-icon", "◈"),
      make("span", "welcome-mono", protocolLabel),
      make("span", "visually-hidden", "MISSION OBJECTIVE"));
    const teamBadge = make("div", "welcome-team-badge");
    append(teamBadge, make("span", "welcome-shield", "◇"), make("span", "welcome-mono", "TEAM RUN 2.0 // CADET SIMULATION"));
    const referenceStatus = make("div", "welcome-reference-status");
    append(referenceStatus, make("span", "welcome-status-dot"), make("span", "welcome-mono", "MISSION DATA: CURATED REFERENCE"));
    append(topHud, protocol, teamBadge, referenceStatus);

    const hero = make("section", "welcome-hero");
    const heroContent = make("div", "welcome-hero-content");
    const briefingBadge = make("div", "welcome-briefing-badge");
    append(briefingBadge, make("span", "welcome-badge-dot"), make("span", "welcome-mono", briefingLabel));
    const independentNote = make("p", "welcome-independent-note", "NASA Space Apps Challenge · independent team simulation");
    const title = make("h1", "welcome-title", "MOONBASE");
    title.id = "welcome-title";
    const subtitle = make("div", "welcome-subtitle");
    append(subtitle, make("span", "welcome-rule welcome-rule-left"), make("span", "welcome-mono", "4 DAYS TO SURVIVE"), make("span", "welcome-rule welcome-rule-right"));
    const lede = make("p", "welcome-lede", "An interactive lunar mission simulation inspired by NASA science.");
    const startWrap = make("div", "welcome-start-wrap");
    const startAction = startMission;
    const startLabel = "Start mission";
    const startButton = button(ui.loading ? "Connecting to Mission Control…" : startLabel, "welcome-start-button", startAction, ui.loading);
    startButton.setAttribute("aria-label", ui.loading ? "Connecting to Mission Control" : startLabel);
    if (ui.loading) {
      startButton.replaceChildren(make("span", "loading-label", "Connecting to Mission Control…"));
      startButton.querySelector(".loading-label").prepend(make("span", "spinner"));
    } else {
      startButton.prepend(make("span", "welcome-launch-icon", "↗"));
      startButton.append(make("span", "welcome-launch-arrow", "→"));
    }
    const hotkey = make("span", "welcome-hotkey");
    append(hotkey, make("span", "", "PRESS "), make("kbd", "welcome-hotkey-key", "SPACEBAR"), make("span", "", " OR CLICK TO INITIATE SEQUENCE"));
    append(startWrap, startButton, hotkey);
    const assurance = make("p", "welcome-assurance", assuranceLabel);
    if (ui.error) {
      const error = make("p", "welcome-error", ui.error);
      error.setAttribute("role", "alert");
      heroContent.append(error);
    }
    if (ui.sceneAssetStatus === "error") {
      const assetError = make("p", "welcome-error", ui.sceneError);
      assetError.setAttribute("role", "alert");
      heroContent.append(assetError);
    }
    append(heroContent, briefingBadge, independentNote, title, subtitle, lede, startWrap, assurance);

    const bottomTelemetry = make("footer", "welcome-bottom-telemetry");
    const referenceRibbon = make("div", "welcome-reference-ribbon");
    append(referenceRibbon, make("span", "welcome-ribbon-icon", "▦"), make("span", "welcome-mono", "MISSION REFERENCE DATA"));
    const referenceCopy = make("p", "welcome-reference-copy");
    append(referenceCopy, make("span", "welcome-mono", "TARGET: "), make("strong", "", targetLabel),
      make("span", "welcome-telemetry-separator", " // "), make("span", "welcome-mono", "ENVIRONMENT: "), make("strong", "", worldName),
      make("span", "welcome-telemetry-separator", " // "), make("span", "welcome-mono", "DATA: "), make("strong", "", "NON-LIVE CONTEXT"));
    const readyCopy = make("div", "welcome-ready-copy");
    append(readyCopy, make("span", "welcome-status-dot welcome-status-dot-amber"), make("span", "welcome-mono", "SIMULATION HABITAT READY"));
    append(bottomTelemetry, append(make("div", "welcome-telemetry-left"), referenceRibbon, referenceCopy), readyCopy);

    append(section, topHud, hero, bottomTelemetry);
    hero.append(heroContent);
    root.append(section);
  }

  function renderStoryHud(mission, event = null, dayOverride = null) {
    const hud = make("div", "story-hud");
    const day = dayOverride || event?.day || mission?.day || 1;
    const marker = make("div", "story-hud-marker");
    const identity = make("div", "story-hud-identity");
    append(identity, make("span", "story-hud-kicker", "MOONBASE SIM"),
      make("span", "story-team-inline", "RUN 2.0"));
    append(marker, identity,
      make("strong", "story-hud-title", `Mission day ${day} of ${mission?.totalDays || 4}`),
      make("span", "story-hud-subtitle", "Lunar outpost survival mission"));
    const state = mission?.qualitativeState || {};
    const missionDay = Number(day);
    const statusRows = missionDay >= 4
      ? [
        ["EVA STATUS", state.evaStatus || "DATA UNAVAILABLE"],
        ["CREW LOCATION", state.crewLocation || "DATA UNAVAILABLE"],
        ["PRIMARY SHIELDING", state.primaryShielding || "DATA UNAVAILABLE"],
        ["SUPPLEMENTARY SHIELDING", state.supplementaryShielding || "DATA UNAVAILABLE"]
      ]
      : missionDay >= 3
      ? [
        ["STORED FOOD", state.storedFoodSupply || "DATA UNAVAILABLE"],
        ["CROP UNIT", state.cropProductionUnit || "DATA UNAVAILABLE"],
        ["CROP GROWTH", state.cropGrowth || "DATA UNAVAILABLE"],
        ["APPROVED CROP WATER", state.approvedWaterForCrops || "DATA UNAVAILABLE"]
      ]
      : missionDay >= 2
      ? [
        ["WATER RECOVERY", state.waterRecoveryStatus || "DATA UNAVAILABLE"],
        ["POTABLE SUPPLY", state.potableWaterSupply || "DATA UNAVAILABLE"],
        ["QUALITY CHECK", state.waterQualityVerification || "DATA UNAVAILABLE"],
        ["LIFE SUPPORT", state.crewLifeSupport || "DATA UNAVAILABLE"]
      ]
      : [
        ["SOLAR INPUT", state.solarInput || "DATA UNAVAILABLE"],
        ["BACKUP RESERVE", state.backupReserve || "DATA UNAVAILABLE"],
        ["POWER DEMAND", state.powerDemand || "DATA UNAVAILABLE"],
        ["EVENT CAUSE", state.eventCause || "DATA UNAVAILABLE"]
      ];
    const status = make("div", "story-qualitative-status");
    statusRows.forEach(([label, value]) => {
      const chip = make("div", "story-qualitative-chip");
      append(chip, make("span", "story-qualitative-label", label), make("strong", "story-qualitative-value", value));
      status.append(chip);
    });
    const progress = make("div", "story-day-progress");
    progress.setAttribute("aria-label", `Mission day ${day} of ${mission?.totalDays || 4}`);
    progress.append(make("span", "story-day-caption", `DAY ${day} / ${mission?.totalDays || 4}`));
    for (let index = 1; index <= (mission?.totalDays || 4); index += 1) {
      const dot = make("span", `story-day-dot${index <= day ? " active" : ""}`);
      dot.setAttribute("aria-hidden", "true");
      progress.append(dot);
    }
    append(hud, marker, status, progress);
    return hud;
  }

  function renderMissionRadar({ gameplay = false } = {}) {
    const radar = make("div", `mission-radar${gameplay ? " mission-radar-gameplay" : ""}`);
    radar.setAttribute("aria-label", "Mission radar. The cyan marker shows your astronaut.");
    append(radar,
      make("span", "radar-label radar-north", "N"),
      make("span", "radar-line radar-line-horizontal"),
      make("span", "radar-line radar-line-vertical"),
      make("span", "radar-sweep"),
      make("span", "radar-player"),
      make("span", "radar-objective"));
    if (gameplay) {
      radar.append(
        make("span", "radar-surface-grid"),
        make("span", "radar-caption radar-caption-player", "YOU"),
        make("span", "radar-caption radar-caption-objective", "TARGET")
      );
    }
    return radar;
  }

  function renderInspectionReport(event) {
    const report = make("section", "inspection-report");
    const values = event?.inspectionReport || {};
    append(report, make("h3", "inspection-report-title", "ARRAY INSPECTION REPORT"));
    const grid = make("dl", "inspection-report-grid");
    [
      ["ARRAY CONDITION", values.arrayCondition],
      ["SUNLIGHT EXPOSURE", values.sunlightExposure],
      ["POWER GENERATION", values.powerGeneration],
      ["EVENT CAUSE", values.eventCause]
    ].forEach(([label, value]) => {
      append(grid, make("dt", "inspection-report-label", label), make("dd", "inspection-report-value", value || "DATA UNAVAILABLE"));
    });
    report.append(grid);
    return report;
  }

  function renderWaterSystemReport(event) {
    const report = make("section", "inspection-report water-system-report");
    append(report, make("h3", "inspection-report-title", "SYSTEM REPORT"));
    const table = make("div", "water-status-table");
    table.setAttribute("role", "table");
    (event?.systemReport || []).forEach((item) => {
      const row = make("div", "water-status-row");
      row.setAttribute("role", "row");
      append(row,
        make("span", "water-status-system", item.system || "System"),
        make("strong", "water-status-value", item.status || "DATA UNAVAILABLE"));
      table.append(row);
    });
    report.append(table);
    return report;
  }

  function renderFoodSystemReport(event) {
    const report = make("section", "inspection-report food-system-report");
    append(report, make("h3", "inspection-report-title", "SYSTEM REPORT"));
    const table = make("div", "water-status-table");
    table.setAttribute("role", "table");
    (event?.systemReport || []).forEach((item) => {
      const row = make("div", "water-status-row");
      row.setAttribute("role", "row");
      append(row,
        make("span", "water-status-system", item.system || "System"),
        make("strong", "water-status-value", item.status || "DATA UNAVAILABLE"));
      table.append(row);
    });
    report.append(table);
    return report;
  }

  function renderStormShelterReport(event) {
    const report = make("section", "inspection-report storm-shelter-report");
    append(report, make("h3", "inspection-report-title", "SHELTER STATUS"));
    const table = make("div", "water-status-table");
    table.setAttribute("role", "table");
    (event?.systemReport || []).forEach((item) => {
      const row = make("div", "water-status-row");
      row.setAttribute("role", "row");
      append(row,
        make("span", "water-status-system", item.system || "System"),
        make("strong", "water-status-value", item.status || "DATA UNAVAILABLE"));
      table.append(row);
    });
    report.append(table);
    return report;
  }

  function renderGameDialogue(event) {
    const opened = Boolean(ui.interactionOpen);
    const day = Number(event?.day || 0);
    const isWaterEvent = day === 2;
    const isFoodEvent = day === 3;
    const isDayFour = day === 4;
    const emergencyReady = Boolean(ui.emergencyProcedureComplete && opened);
    const dialogue = make("aside", `story-dialogue gameplay-dialogue gameplay-dialogue-live gameplay-commander-card${opened || isDayFour ? " is-briefing is-open" : ""}`);
    dialogue.setAttribute("aria-live", "polite");
    dialogue.setAttribute("aria-label", opened || isDayFour
      ? (isWaterEvent ? "Water quality alert and system report" : isFoodEvent ? "Food supply warning and system report" : isDayFour ? "Solar radiation alert and storm shelter status" : "Power drop inspection report")
      : (isWaterEvent ? "Water recovery station objective" : isFoodEvent ? "Crop production unit objective" : "Solar array objective"));
    const portrait = make("div", "crew-portrait");
    append(portrait, make("span", "crew-portrait-visor"), make("span", "crew-portrait-light"));
    const copy = make("div", "gameplay-dialogue-copy");
    append(copy, make("div", "story-speaker-line", "MISSION CONTROL"));
    if (!opened && !isDayFour) {
      append(copy, make("p", "story-subtitle", isWaterEvent
        ? "Enter the lunar habitat, find the Water Recovery Station, and press E or use the touch button to inspect it."
        : isFoodEvent
          ? "Enter the lunar habitat, find the Crop Production Unit, and press E or use the touch button to inspect it."
          : "Walk to the highlighted solar-array station. When you are close, press E or use the touch button to inspect it."));
    } else {
      if (isWaterEvent) {
        append(copy,
          make("h2", "story-dialogue-title water-alert-title", "WATER QUALITY ALERT"),
          make("p", "story-subtitle", "The water recovery system has detected an unacceptable water-quality reading."),
          make("p", "gameplay-dialogue-note", "The recovered water has been isolated from the potable water supply until it can be inspected, reprocessed, and verified."),
          make("p", "gameplay-dialogue-note", "This is a simulated mission event, not live NASA telemetry."),
          renderWaterSystemReport(event),
          make("p", "science-explanation", event.scientificExplanation || "Scientific explanation unavailable."));
        if (event.contextNote) copy.append(make("p", "mission-context-note", event.contextNote));
      } else if (isFoodEvent) {
        append(copy,
          make("h2", "story-dialogue-title food-warning-title", "FOOD SUPPLY WARNING"),
          make("p", "story-subtitle", "The stored ready-to-eat food supply is running low."),
          make("p", "gameplay-dialogue-note", "The crop production unit is available, but growing crops takes time and will not provide an immediate meal."),
          make("p", "gameplay-dialogue-note", "This is a simulated mission event, not live NASA telemetry."),
          renderFoodSystemReport(event),
          make("p", "science-explanation", event.scientificExplanation || "Scientific explanation unavailable."));
        if (event.contextNote) copy.append(make("p", "mission-context-note", event.contextNote));
      } else if (isDayFour) {
        append(copy,
          make("h2", "story-dialogue-title solar-alert-title", "SOLAR RADIATION ALERT"),
          make("p", "story-subtitle", "A solar particle event warning has been received. The crew must stop all external activity and move to the designated storm shelter."),
          make("p", "gameplay-dialogue-note", emergencyReady
            ? "EVA is stopped and the crew is inside the existing Storm Shelter. Compare the supplementary-shielding strategies below."
            : "Stop all EVA operations and proceed to the Storm Shelter immediately. The strategic choices unlock only after shelter entry."),
          make("p", "gameplay-dialogue-note", "This is a simulated mission event, not live NASA telemetry."));
        if (emergencyReady) copy.append(renderStormShelterReport(event));
        if (event.scientificExplanation) copy.append(make("p", "science-explanation", event.scientificExplanation));
        if (event.contextNote) copy.append(make("p", "mission-context-note", event.contextNote));
      } else {
        append(copy,
          make("h2", "story-dialogue-title", "POWER DROP DETECTED"),
          make("p", "story-subtitle", "Solar power generation is decreasing."),
          make("p", "gameplay-dialogue-note", "Your solar array inspection found no visible damage. Terrain shadows are reducing the sunlight reaching the array."),
          make("p", "gameplay-dialogue-note", "Mission Control needs you to choose how the base should respond."),
          renderInspectionReport(event),
          make("p", "science-explanation", event.scientificExplanation || "Scientific explanation unavailable."));
      }
      const learn = event.scienceSources?.find((source) => /veggie|advanced plant habitat/i.test(source.title || ""))
        || event.scienceSources?.find((source) => /shadows near/i.test(source.title || ""))
        || event.scienceSources?.[0];
      if (learn) {
        const scienceLink = make("a", "learn-science-link", "Learn the science ↗");
        const url = safeHttpsUrl(learn.url);
        if (url) {
          scienceLink.href = url;
          scienceLink.target = "_blank";
          scienceLink.rel = "noopener noreferrer";
        }
        copy.append(scienceLink);
      }
      if (event.scienceSources?.length) {
        const sourceLine = make("p", "story-source-line");
        append(sourceLine, document.createTextNode("Official references: "));
        event.scienceSources.slice(0, 3).forEach((source, index) => {
          const url = safeHttpsUrl(source.url);
          const link = make("a", "story-source-link", source.title || `NASA source ${index + 1}`);
          if (url) {
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
          }
          sourceLine.append(link);
          if (index < Math.min(2, event.scienceSources.length - 1)) sourceLine.append(document.createTextNode(" · "));
        });
        copy.append(sourceLine);
      }
    }
    append(dialogue, portrait, copy);
    return dialogue;
  }

  function renderStoryDialogue({ speaker, title, text, note = "", tone = "normal", sources = [] }) {
    const dialogue = make("section", `story-dialogue story-dialogue-${tone}`);
    dialogue.setAttribute("aria-live", "polite");
    const speakerLine = make("div", "story-speaker-line");
    append(speakerLine, make("span", "story-speaker-pip"), make("span", "story-speaker", speaker));
    append(dialogue, speakerLine, make("h1", "story-dialogue-title", title), make("p", "story-subtitle", text));
    if (note) dialogue.append(make("p", "story-science-note", note));
    if (sources.length) {
      const sourceLine = make("p", "story-source-line");
      append(sourceLine, document.createTextNode("Science source: "));
      sources.slice(0, 1).forEach((source) => {
        const link = make("a", "story-source-link", source.title);
        const url = safeHttpsUrl(source.url);
        if (url) {
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        sourceLine.append(link);
      });
      dialogue.append(sourceLine);
    }
    return dialogue;
  }

  function renderStoryChoices(event) {
    const choices = make("div", "story-choices");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", "Mission choices");
    (event?.choices || []).forEach((choice, index) => {
      const selected = ui.selectedChoiceId === choice.id;
      const card = make("button", "story-choice");
      card.type = "button";
      card.disabled = ui.loading;
      card.dataset.choiceId = choice.id;
      card.setAttribute("aria-pressed", String(selected));
      card.addEventListener("click", () => {
        ui.selectedChoiceId = choice.id;
        ui.interactionOpen = true;
        ui.error = "";
        render();
        root.querySelector(`[data-choice-id="${CSS.escape(choice.id)}"]`)?.focus({ preventScroll: true });
      });
      append(card, make("span", "story-choice-index", `0${index + 1}`),
        make("strong", "story-choice-title", choice.title),
        make("span", "story-choice-description", choice.description),
        make("span", "story-choice-benefit", `Benefit: ${choice.immediateBenefit || "Mission support continues."}`),
        make("span", "story-choice-tradeoff", choice.tradeoff),
        make("span", "story-choice-state", selected ? "Selected · press confirm" : "Select this solution"));
      choices.append(card);
    });
    return choices;
  }

  function renderStoryEffects(mission) {
    const effects = make("div", "story-effects");
    if (mission?.activeEffects?.length) {
      append(effects, make("span", "story-effects-label", "ACTIVE MISSION STATES"));
      mission.activeEffects.forEach((effect) => {
        const item = make("p", "story-effects-value");
        append(item, make("strong", "story-effect-name", `${effect.label || "Effect"}: ${effect.state || "ACTIVE"}`),
          document.createTextNode(` ${effect.description || ""}`));
        effects.append(item);
      });
    } else {
      append(effects, make("span", "story-effects-label", "MISSION CONTROL"),
        make("span", "story-effects-value", "No qualitative power plan recorded yet."));
    }
    return effects;
  }

  function renderStorySystems(mission) {
    const strip = make("div", "story-system-strip");
    const state = mission?.qualitativeState || {};
    const statuses = Number(mission?.event?.day || mission?.day || 0) >= 4
      ? [
        ["EVA", state.evaStatus || "DATA UNAVAILABLE"],
        ["CREW LOCATION", state.crewLocation || "DATA UNAVAILABLE"],
        ["PRIMARY SHIELDING", state.primaryShielding || "DATA UNAVAILABLE"],
        ["SUPPLEMENTARY SHIELDING", state.supplementaryShielding || "DATA UNAVAILABLE"]
      ]
      : Number(mission?.event?.day || mission?.day || 0) >= 3
      ? [
        ["FOOD PLAN", state.dayThreePersistentState || "DATA UNAVAILABLE"],
        ["CROP GROWTH", state.cropGrowth || "DATA UNAVAILABLE"],
        ["APPROVED CROP WATER", state.approvedWaterForCrops || "DATA UNAVAILABLE"],
        ["POWER AVAILABILITY", state.powerAvailability || "DATA UNAVAILABLE"]
      ]
      : Number(mission?.event?.day || mission?.day || 0) >= 2
      ? [
        ["WATER PLAN", state.dayTwoPersistentState || "DATA UNAVAILABLE"],
        ["RECOVERED WATER", state.recoveredWaterDisposition || "DATA UNAVAILABLE"],
        ["BACKUP RESERVE", state.backupReserve || "DATA UNAVAILABLE"],
        ["VSAT STATUS", state.verticalArrayStatus || "DATA UNAVAILABLE"]
      ]
      : [
        ["ARRAY CONDITION", state.arrayCondition || "DATA UNAVAILABLE"],
        ["BACKUP RESERVE", state.backupReserve || "DATA UNAVAILABLE"],
        ["POWER DEMAND", state.powerDemand || "DATA UNAVAILABLE"],
        ["VSAT STATUS", state.verticalArrayStatus || "DATA UNAVAILABLE"]
      ];
    statuses.forEach(([label, value]) => {
      const chip = make("span", "story-system-chip", `${label}: ${value}`);
      strip.append(chip);
    });
    return strip;
  }

  function renderDecisionFeedback(mission) {
    const decision = mission?.latestDecision;
    if (!decision || ui.feedbackDismissed) return null;
    const report = make("aside", "mission-feedback", "");
    report.setAttribute("aria-live", "polite");
    append(report,
      make("span", "mission-feedback-kicker", "MISSION CONTROL // SERVER REPORT"),
      make("h2", "mission-feedback-title", decision.choiceTitle || `Day ${decision.day} decision report`),
      make("p", "mission-feedback-explanation", decision.resultMessage || decision.explanation || "Mission Control accepted the decision."),
      make("p", "mission-feedback-why", decision.explanation || "This choice changed the outpost state."));
    const changes = make("div", "mission-feedback-qualitative");
    append(changes,
      make("p", "mission-feedback-change", `PRESERVED: ${decision.preserved || "DATA UNAVAILABLE"}`),
      make("p", "mission-feedback-change", `REDUCED OR DELAYED: ${decision.reducedOrDelayed || "DATA UNAVAILABLE"}`),
      make("p", "mission-feedback-change", `RESERVE STATE: ${decision.backupReserve || "DATA UNAVAILABLE"}`));
    append(report, changes,
      make("p", "mission-feedback-future", decision.persistentEffect || "The effect is recorded for a future mission chapter."),
      button("Hide report and continue exploring", "button-secondary mission-feedback-dismiss", () => {
        ui.feedbackDismissed = true;
        render();
      }, ui.loading));
    return report;
  }

  function renderBriefing() {
    const mission = ui.mission;
    const section = make("section", "mission-briefing-page");
    section.setAttribute("aria-labelledby", "briefing-title");

    const clearMissionAndReturn = () => {
      ui.mission = null;
      ui.decisionHistory = [];
      ui.selectedChoiceId = null;
      ui.communicationOpen = false;
      setScreen("welcome");
    };

    const nav = make("header", "briefing-nav");
    const navLeft = make("div", "briefing-nav-left");
    append(navLeft,
      button("Back to main menu", "briefing-back-button", clearMissionAndReturn),
      make("span", "briefing-nav-divider"));
    const brand = make("div", "briefing-brand");
    append(brand, make("span", "briefing-brand-icon", "◈"), make("strong", "", "MOONBASE"),
      make("span", "briefing-brand-divider", "•"), make("span", "briefing-brand-academy", "SPACE EXPLORATION ACADEMY"));
    navLeft.append(brand);
    const journey = make("nav", "briefing-journey");
    journey.setAttribute("aria-label", "Mission journey");
    append(journey,
      make("span", "briefing-journey-muted", "WELCOME"), make("span", "briefing-chevron", "›"),
      make("span", "briefing-journey-active", "CHALLENGE BRIEFING"), make("span", "briefing-chevron", "›"),
      make("span", "briefing-journey-muted", "WORLD SELECTION"), make("span", "briefing-chevron", "›"),
      make("span", "briefing-journey-muted", "SURFACE EXPLORATION"));
    append(nav, navLeft, journey);

    const content = make("div", "briefing-content");
    const heroCard = make("section", "briefing-hero-card");
    const heroCopy = make("div", "briefing-hero-copy");
    append(heroCopy,
      append(make("div", "briefing-kicker"), make("span", "briefing-kicker-icon", "⚑"), make("span", "", "MISSION BRIEFING")),
      make("h1", "", "YOUR MISSION STARTS HERE"),
      make("p", "", "You are starting a lunar exploration mission. Explore the Moon, inspect a power station, investigate a power-generation problem, and make a decision that will affect the base's future operational state."));
    heroCopy.querySelector?.("h1")?.setAttribute("id", "briefing-title");
    heroCard.append(heroCopy);

    const objectives = make("section", "briefing-objectives");
    const objectivesHeader = make("div", "briefing-section-header");
    append(objectivesHeader,
      append(make("div", "briefing-section-title"), make("span", "briefing-section-icon", "⌁"), make("h2", "", "YOUR MISSION")),
      make("span", "briefing-section-count", "4 CORE STEPS"));
    const objectiveGrid = make("div", "briefing-objective-grid");
    [
      ["01", "EXPLORE", "Walk across the lunar surface and find the solar-array station.", "Reach the objective beacon", "◌", "primary"],
      ["02", "INSPECT", "Look closely at the intact array before making a plan.", "Read the inspection report", "◎", "primary"],
      ["03", "UNDERSTAND", "Learn how low-angle sunlight and terrain shadows affect power.", "Connect cause and effect", "◇", "secondary"],
      ["04", "DECIDE", "Choose how the base should respond to the power drop.", "Prepare the next chapter", "⌁", "primary"]
    ].forEach(([number, title, description, footer, icon, tone]) => {
      const card = make("article", `briefing-objective-card is-${tone}`);
      const cardTop = make("div", "briefing-objective-top");
      append(cardTop, make("span", "briefing-objective-number", number), make("span", "briefing-objective-icon", icon));
      append(card, cardTop, make("h3", "", title), make("p", "", description), make("span", "briefing-objective-footer", footer));
      objectiveGrid.append(card);
    });
    append(objectives, objectivesHeader, objectiveGrid);

    const science = make("section", "briefing-science-card");
    const scienceMain = make("div", "briefing-science-main");
    const scienceIcon = make("span", "briefing-science-icon", "▤");
    const scienceCopy = make("div", "briefing-science-copy");
    const scienceHeading = make("div", "briefing-science-heading");
    append(scienceHeading, make("h2", "", "SCIENCE MATTERS"), make("span", "briefing-science-tag", "NASA-BASED SCIENCE"));
    append(scienceCopy, scienceHeading,
      make("p", "", "Explore scientific information from NASA-supported sources. Measurements keep their original units and source context. Missing data is clearly marked DATA UNAVAILABLE."));
    append(scienceMain, scienceIcon, scienceCopy);
    const scienceNote = make("aside", "briefing-science-note");
    append(scienceNote, make("span", "briefing-science-note-icon", "i"),
      append(make("div", ""), make("strong", "", "AUTHENTIC EXPLORATION"), make("span", "", "Some scientific measurements may not be available for every location.")));
    append(science, scienceMain, scienceNote);

    const actionFooter = make("footer", "briefing-action-footer");
    const footerInner = make("div", "briefing-action-inner");
    const footerBack = button("Back to main menu", "briefing-footer-back", clearMissionAndReturn);
    const actionCluster = make("div", "briefing-action-cluster");
    const actionHint = make("div", "briefing-action-hint");
    append(actionHint, make("strong", "", "READY TO CONTINUE"), make("span", "", "HOTKEY: PRESS ENTER OR SPACE"));
    const continueButton = button("Choose your world", "briefing-continue-button", () => setScreen("worldSelection"), ui.loading);
    continueButton.setAttribute("aria-label", "Choose your world");
    append(actionCluster, actionHint, continueButton);
    append(footerInner, footerBack, actionCluster);

    append(content, heroCard, objectives, science);
    append(section, nav, content, actionFooter);
    actionFooter.append(footerInner);
    root.append(section);
  }

  function renderWorldSelection() {
    const section = make("section", "world-selection-page");
    section.setAttribute("aria-labelledby", "world-selection-title");

    const returnToBriefing = () => setScreen("briefing");
    const nav = make("header", "briefing-nav world-selection-nav");
    const navLeft = make("div", "briefing-nav-left world-selection-nav-left");
    const returnButton = button("Back to briefing", "briefing-back-button world-selection-return", returnToBriefing);
    returnButton.setAttribute("aria-label", "Return to challenge briefing");
    const brand = make("div", "briefing-brand world-selection-brand");
    append(brand, make("span", "briefing-brand-icon world-selection-brand-icon", "◈"), make("strong", "", "MOONBASE"),
      make("span", "briefing-brand-divider world-selection-brand-divider", "•"), make("span", "briefing-brand-academy world-selection-brand-academy", "SPACE EXPLORATION ACADEMY"));
    append(navLeft, returnButton, make("span", "briefing-nav-divider world-selection-nav-divider"), brand);
    const journey = make("nav", "briefing-journey world-selection-journey");
    journey.setAttribute("aria-label", "Mission journey");
    append(journey,
      make("span", "briefing-journey-muted world-selection-journey-muted", "WELCOME"), make("span", "briefing-chevron world-selection-chevron", "›"),
      make("span", "briefing-journey-muted world-selection-journey-muted", "CHALLENGE BRIEFING"), make("span", "briefing-chevron world-selection-chevron", "›"),
      make("span", "briefing-journey-active world-selection-journey-active", "WORLD SELECTION"), make("span", "briefing-chevron world-selection-chevron", "›"),
      make("span", "briefing-journey-muted world-selection-journey-muted", "SURFACE EXPLORATION"));
    append(nav, navLeft, journey);

    const main = make("main", "world-selection-main");
    const intro = make("header", "world-selection-intro");
    const destinationTag = make("div", "world-selection-tag");
    append(destinationTag, make("span", "world-selection-ping"), make("span", "world-selection-tag-icon", "◉"), make("span", "", "DESTINATION SELECT"));
    const title = make("h1", "", "CHOOSE YOUR WORLD");
    title.id = "world-selection-title";
    append(intro, destinationTag, title,
      make("p", "", "One destination. One lunar mission. Prepare to explore."),
      append(make("div", "world-selection-crosshair"), make("span", "", "╱"), make("span", "world-selection-crosshair-icon", "⌖"), make("span", "", "╲")));

    const destinationGrid = make("section", "destination-grid");
    destinationGrid.setAttribute("aria-label", "Available destinations");

    const moonCard = button("", "destination-card destination-card-moon", startMoonMission, ui.loading);
    moonCard.setAttribute("aria-label", "Select destination: The Moon");
    append(moonCard,
      append(make("div", "destination-card-image"), (() => {
        const image = make("img", "", "");
        image.src = "../assets/backgrounds/moon-world-selection.png";
        image.alt = "The Moon surface landscape with Earth in the background";
        return image;
      })(), make("span", "destination-card-tint")),
      append(make("div", "destination-card-top"),
        append(make("span", "destination-card-tag"), make("span", "destination-card-dot"), make("span", "", "DESTINATION 01 // EARTH'S COMPANION")),
        make("span", "destination-card-symbol", "◐")),
      append(make("div", "destination-card-content"),
        append(make("div", "destination-card-heading"), make("span", "destination-card-kicker", "PLANETARY BODY"), make("h2", "", "THE MOON")),
        append(make("div", "destination-card-pills"), make("span", "", "LUNAR SOUTH POLE"), make("span", "", "LONG SHADOWS"), make("span", "", "POWER SYSTEMS")),
        make("p", "", "Explore the lunar South Pole and discover the challenges of generating power in a landscape of long shadows."),
        append(make("span", "destination-card-action destination-card-action-moon"), make("span", "", ui.loading ? "Connecting to Mission Control…" : "Explore the Moon"), make("span", "", ui.loading ? "…" : "↗"))));
    append(destinationGrid, moonCard);

    const footer = make("footer", "world-selection-footer");
    const footerBack = button("Back to challenge briefing", "world-selection-footer-back", returnToBriefing);
    const footerHint = make("div", "world-selection-footer-hint");
    append(footerHint, make("span", "world-selection-footer-dot"), make("span", "", "SELECT THE MOON TO LAUNCH DAY 1"));
    append(footer, footerBack, footerHint);

    append(main, intro, destinationGrid, footer);
    append(section, nav, main);
    root.append(section);
  }

  function renderGame() {
    const mission = ui.mission;
    const event = mission?.event;
    if (!event) {
      if (ui.loading) {
        const loading = make("section", "story-shell mission-loading", "");
        append(loading, make("span", "story-eyebrow", "MISSION CONTROL"), make("h1", "", "INITIALIZING THE MOON"),
          make("p", "", "Loading the Day 1 lunar environment and preparing the solar-array objective…"),
          make("span", "loading-line", "Please wait"));
        root.append(loading);
        return;
      }
      const fallback = make("section", "story-shell story-error");
      append(fallback, make("div", "alert-box", "Mission Control did not receive the next day. Start a fresh mission to continue."),
        button("Start a fresh mission", "story-primary-action", startMission, ui.loading));
      root.append(fallback);
      return;
    }
    const section = make("section", "story-shell gameplay-shell");
    section.setAttribute("aria-labelledby", "gameplay-title");
    const isDayTwo = Number(event.day) === 2;
    const isDayThree = Number(event.day) === 3;
    const isDayFour = Number(event.day) === 4;
    const isInspected = Boolean(ui.inspectionComplete && ui.interactionOpen);
    const hud = renderStoryHud(mission, event);
    hud.className = "story-hud gameplay-hud";
    const objective = make("section", "gameplay-objective");
    const objectiveCopy = isInspected
      ? (isDayTwo
        ? "Read the WATER QUALITY ALERT, keep unverified water isolated, and choose a response."
        : isDayThree
          ? "Read the FOOD SUPPLY WARNING, compare the three food strategies, and choose a response."
          : isDayFour
            ? "Review the Storm Shelter status, compare the three supplementary-shielding strategies, and choose a response."
          : "Inspect the report, compare the three responses, and choose how the base should respond.")
      : (isDayTwo
        ? "Enter the lunar habitat and find the Water Recovery Station. Inspect it before choosing a response."
        : isDayThree
          ? "Enter the lunar habitat and find the Crop Production Unit. Inspect it before choosing a response."
          : isDayFour
            ? "Stop EVA operations and enter the designated Storm Shelter before choosing a shielding strategy."
          : "Walk to the highlighted solar-array station and inspect it when the prompt appears.");
    append(objective,
      append(make("div", "gameplay-objective-head"),
        make("span", "story-eyebrow", "MISSION OBJECTIVE"),
        make("span", "objective-diamond", "◆")),
      make("h1", "gameplay-title", isDayTwo ? "Life Support Crisis" : isDayThree ? "Food Production" : isDayFour ? "Emergency Protocol" : "Establish the Base"),
      make("p", "gameplay-objective-copy", objectiveCopy),
      append(make("div", "gameplay-objective-status"),
        make("span", "objective-status-dot"),
        document.createTextNode(`Day ${event.day} of ${mission.totalDays || 4} · ${ui.interactionTarget ? `Near ${ui.interactionTarget.name}` : "Objective beacon active"}`)));
    objective.querySelector?.(".gameplay-title")?.setAttribute("id", "gameplay-title");

    const task = make("aside", `gameplay-task${ui.interactionOpen ? " is-briefing-task" : ""}`);
    append(task,
      make("div", "gameplay-task-kicker", "CURRENT TASK"),
      make("h2", "gameplay-task-title", isDayTwo && !isInspected ? "WATER RECOVERY STATION" : isDayThree && !isInspected ? "CROP PRODUCTION UNIT" : isDayFour && !isInspected ? "STORM SHELTER" : event.title),
      make("p", "gameplay-task-copy", ui.gateOpening
        ? `${ui.interactionTarget?.name || "Mission gate"} is opening. Hold position for the cinematic transition.`
        : isInspected
          ? "Compare the three response choices, then send one plan to Mission Control."
          : isDayTwo
            ? "Enter the water-systems bay and inspect the station when the prompt appears."
          : isDayThree
              ? "Enter the crop-production bay and inspect the unit when the prompt appears."
              : isDayFour
                ? "Enter the Storm Shelter when the prompt appears. The emergency procedure must be completed before choosing a strategy."
              : "Walk to the highlighted solar-array station and inspect it when the prompt appears."),
      append(make("div", "gameplay-task-status"), make("span", "task-status-icon", "!"), make("span", "", isDayTwo ? "Water-station beacon active" : isDayThree ? "Crop-production beacon active" : isDayFour ? (isInspected ? "Emergency procedure complete" : "Storm-shelter beacon active") : "Solar-array beacon active")));

    const showInteractionHint = !ui.interactionOpen && (ui.gateOpening || ui.interactionTarget);
    const hint = showInteractionHint
      ? make("div", `gameplay-interaction-hint${ui.interactionTarget && !ui.interactionTarget.locked ? " is-ready" : ""}`)
      : null;
    if (hint && ui.interactionTarget?.id === "solar-array") hint.setAttribute("aria-label", "E — Inspect Solar Array");
    if (hint && ui.interactionTarget?.id === "water-recycler") hint.setAttribute("aria-label", "E — Inspect Water Recovery Station");
    if (hint && ui.interactionTarget?.id === "grow-tray") hint.setAttribute("aria-label", "E — Inspect Crop Production Unit");
    if (hint && ui.interactionTarget?.id === "storm-shelter") hint.setAttribute("aria-label", "E — Enter Storm Shelter");
    if (hint && ui.gateOpening) {
      append(hint, make("span", "interaction-key", "…"), make("span", "interaction-copy", "MISSION GATE OPENING"),
        make("small", "interaction-description", "Mechanical locks are releasing. Mission Control will brief you when the door is ready."));
    } else if (hint && ui.interactionTarget?.locked) {
      append(hint, make("span", "interaction-key", "LOCKED"), make("span", "interaction-copy", `${ui.interactionTarget.name} locked`),
        make("small", "interaction-description", ui.interactionTarget.description));
    } else if (hint && ui.interactionTarget) {
      const interactionCopy = ui.interactionTarget.id === "solar-array"
        ? "— Inspect Solar Array"
        : ui.interactionTarget.id === "water-recycler"
          ? "— Inspect Water Recovery Station"
        : ui.interactionTarget.id === "storm-shelter"
          ? "— Enter Storm Shelter"
        : `Interact with ${ui.interactionTarget.name}`;
      append(hint, make("span", "interaction-key", "E"), make("span", "interaction-copy", interactionCopy),
        make("small", "interaction-description", ui.interactionTarget.description));
      if (ui.interactionTarget.id === "solar-array") {
        const touchInspect = button("Inspect Solar Array", "interaction-touch-button", () => {
          sceneInteractionHandler.onInteract(ui.interactionTarget);
        }, ui.loading || ui.inspectionComplete);
        touchInspect.setAttribute("aria-label", "Inspect Solar Array");
        hint.append(touchInspect);
      }
      if (ui.interactionTarget.id === "water-recycler") {
        const touchInspect = button("Inspect Water Recovery Station", "interaction-touch-button", () => {
          sceneInteractionHandler.onInteract(ui.interactionTarget);
        }, ui.loading || ui.inspectionComplete);
        touchInspect.setAttribute("aria-label", "Inspect Water Recovery Station");
        hint.append(touchInspect);
      }
      if (ui.interactionTarget.id === "grow-tray") {
        const touchInspect = button("Inspect Crop Production Unit", "interaction-touch-button", () => {
          sceneInteractionHandler.onInteract(ui.interactionTarget);
        }, ui.loading || ui.inspectionComplete);
        touchInspect.setAttribute("aria-label", "Inspect Crop Production Unit");
        hint.append(touchInspect);
      }
      if (ui.interactionTarget.id === "storm-shelter") {
        const touchEnter = button("Enter Storm Shelter", "interaction-touch-button", () => {
          sceneInteractionHandler.onInteract(ui.interactionTarget);
        }, ui.loading || ui.inspectionComplete);
        touchEnter.setAttribute("aria-label", "Enter Storm Shelter");
        hint.append(touchEnter);
      }
    }

    const fallbackNotice = ui.sceneAvailable ? null : make("aside", "scene-fallback-notice", "");
    if (fallbackNotice) append(fallbackNotice,
      make("span", "story-eyebrow", "ACCESSIBLE MISSION TERMINAL"),
      make("strong", "", ui.sceneError || "The 3D view is unavailable."),
      make("p", "", isDayTwo
        ? "The 3D scene did not load successfully. Use this terminal to inspect the Water Recovery Station and continue the mission."
        : isDayThree
          ? "The 3D scene did not load successfully. Use this terminal to inspect the Crop Production Unit and continue the mission."
          : isDayFour
            ? "The 3D scene did not load successfully. Use this terminal to enter the Storm Shelter and complete the mandatory emergency procedure."
          : "The 3D scene did not load successfully. Use this terminal to inspect the solar array and continue the mission."),
      button(isDayTwo ? "Inspect Water Recovery Station" : isDayThree ? "Inspect Crop Production Unit" : isDayFour ? "Enter Storm Shelter" : "Inspect Solar Array", "story-primary-action terminal-inspect-button", () => {
        sceneInteractionHandler.onInteract({
          id: isDayTwo ? "water-recycler" : isDayThree ? "grow-tray" : isDayFour ? "storm-shelter" : "solar-array",
          name: isDayTwo ? "Water Recovery Station" : isDayThree ? "Crop Production Unit" : isDayFour ? "Storm Shelter" : "Solar array",
          description: "Accessible mission terminal inspection"
        });
      }, ui.loading || ui.inspectionComplete));

    const controls = renderGameControls({ showPause: true });
    const touchControls = renderTouchControls();

    const dialogue = renderGameDialogue(event);
    dialogue.id = "event-title";

    const choicePanel = make("div", `gameplay-decision-panel gameplay-task-decision in-world-terminal${ui.interactionOpen ? " is-open" : ""}`);
    choicePanel.setAttribute("aria-label", ui.sceneAvailable ? "In-world mission terminal" : "Accessible mission terminal");
    const choiceHeader = make("div", "gameplay-decision-header");
    append(choiceHeader, make("span", "story-eyebrow", ui.sceneAvailable ? "IN-WORLD TERMINAL // CHOOSE A SOLUTION" : "CHOOSE A SOLUTION"),
      make("strong", "", "Mission Control will calculate the result."));
    const choices = renderStoryChoices(event);
    const confirm = make("div", "story-confirm gameplay-confirm");
    const submit = button("Confirm decision", "story-primary-action", submitChoice,
      ui.loading || !ui.selectedChoiceId || (!ui.interactionOpen && ui.sceneAvailable));
    if (ui.loading) {
      submit.replaceChildren(make("span", "loading-label", "Sending to Mission Control…"));
      submit.querySelector?.(".loading-label")?.prepend(make("span", "spinner"));
    } else {
      submit.append(make("span", "arrow", "→"));
    }
    append(confirm, make("span", "story-confirm-hint", ui.selectedChoiceId ? "Ready to send this plan to Mission Control." : "Select a solution to continue."), submit);
    append(choicePanel, choiceHeader, choices, confirm);
    task.append(choicePanel);

    const pauseMenu = make("div", `gameplay-pause-menu${ui.paused ? " is-open" : ""}`);
    append(pauseMenu, make("strong", "", "Mission paused"), make("p", "", "The lunar base is waiting for you."),
      button("Resume exploration", "story-primary-action", () => { ui.paused = false; render(); }, ui.loading),
      make("small", "", "Press Escape any time to release the mouse pointer."));

    append(section, hud, objective, task, renderMissionRadar({ gameplay: true }), hint, controls, touchControls, renderStorySystems(mission),
      fallbackNotice, dialogue, renderDecisionFeedback(mission), pauseMenu);
    root.append(section);
  }

  function renderDayOneComplete() {
    const feedback = ui.mission?.latestDecision;
    const result = ui.mission?.result;
    const shell = make("section", "story-shell day-one-complete-story");
    const dialogue = renderStoryDialogue({
      speaker: "MISSION CONTROL",
      title: result?.title || "DAY 1 COMPLETE",
      text: result?.summary || feedback?.explanation || "Mission Control recorded the Day 1 response.",
      note: result?.nextChapterMessage || "The next mission chapter is not available in this build.",
      tone: "success"
    });
    dialogue.className = "story-dialogue day-one-complete-dialogue story-dialogue-success";

    const outcome = make("section", "day-one-report", "");
    outcome.setAttribute("aria-label", "Day 1 mission report");
    append(outcome, make("span", "story-eyebrow", "MISSION REPORT"));
    const selected = result?.selectedDecision?.title || feedback?.choiceTitle || "DATA UNAVAILABLE";
    append(outcome, make("h2", "day-one-selected", `YOUR DECISION: ${selected}`));
    const reportGrid = make("div", "day-one-report-grid");
    [
      ["PRESERVED", result?.preserved],
      ["REDUCED OR DELAYED", result?.reducedOrDelayed],
      ["POWER STATUS", result?.powerStatus],
      ["BACKUP RESERVE", result?.backupReserve]
    ].forEach(([label, value]) => {
      append(reportGrid, append(make("article", "day-one-report-card"), make("span", "story-change-label", label), make("strong", "", value || "DATA UNAVAILABLE")));
    });
    outcome.append(reportGrid);
    const effectList = make("div", "day-one-persistent-effect");
    append(effectList, make("span", "story-change-label", "PERSISTENT EFFECT"));
    (result?.persistentEffects || ui.mission?.activeEffects || []).forEach((effect) => {
      append(effectList, make("strong", "", `${effect.label || "Effect"}: ${effect.state || "ACTIVE"}`), make("p", "", effect.description || ""));
    });
    outcome.append(effectList);
    append(outcome, make("div", "day-one-takeaway", ""));
    const takeaway = outcome.querySelector(".day-one-takeaway");
    append(takeaway, make("span", "story-change-label", "WHAT YOU LEARNED"), make("p", "", result?.scientificTakeaway || feedback?.scientificTakeaway || "Power depends on both generation and demand."));

    const nextChapter = make("aside", "day-two-briefing-card");
    append(nextChapter,
      make("span", "story-eyebrow", "NEXT MISSION CHAPTER"),
      make("h2", "day-two-briefing-title", "DAY 2 — LIFE SUPPORT CRISIS"),
      make("p", "", result?.nextChapterMessage || "Enter the lunar habitat and inspect the Water Recovery Station."),
      make("p", "day-two-briefing-copy", "A water-quality reading is unacceptable. The water is isolated until it can be inspected, reprocessed, and verified."));

    const actions = make("div", "day-one-complete-actions");
    append(actions,
      button("Enter Day 2 — Life Support Crisis", "story-primary-action", beginDayTwo, ui.loading),
      button("Start a new mission", "button-secondary", startMission, ui.loading));

    append(shell, renderStoryHud(ui.mission, null, 1), dialogue, outcome, nextChapter, actions);
    root.append(shell);
  }

  function renderDayTwoComplete() {
    const feedback = ui.mission?.latestDecision;
    const result = ui.mission?.result;
    const state = ui.mission?.qualitativeState || {};
    const shell = make("section", "story-shell day-two-complete-story");
    const dialogue = renderStoryDialogue({
      speaker: "MISSION CONTROL",
      title: result?.title || "DAY 2 COMPLETE",
      text: result?.summary || feedback?.resultMessage || "Mission Control recorded the Day 2 response.",
      note: result?.nextChapterMessage || "The Day 2 state is ready for a future mission chapter.",
      tone: "success"
    });
    dialogue.className = "story-dialogue day-two-complete-dialogue story-dialogue-success";

    const report = make("section", "day-two-report");
    report.setAttribute("aria-label", "Day 2 water mission report");
    append(report, make("span", "story-eyebrow", "DAY 2 AUTHORITATIVE REPORT"));
    append(report, make("h2", "day-two-selected", `YOUR DECISION: ${result?.selectedDecision?.title || feedback?.choiceTitle || "DATA UNAVAILABLE"}`));
    const statusGrid = make("div", "day-two-status-grid");
    [
      ["WATER RECOVERY", state.waterRecoveryStatus],
      ["POTABLE SUPPLY", state.potableWaterSupply],
      ["QUALITY CHECK", state.waterQualityVerification],
      ["CREW LIFE SUPPORT", state.crewLifeSupport],
      ["RECOVERED WATER", state.recoveredWaterDisposition],
      ["DAY 2 STATE", state.dayTwoPersistentState]
    ].forEach(([label, value]) => {
      append(statusGrid, append(make("article", "day-two-status-card"), make("span", "story-change-label", label), make("strong", "", value || "DATA UNAVAILABLE")));
    });
    report.append(statusGrid);
    append(report, make("p", "day-two-science-note", result?.scientificTakeaway || feedback?.scientificTakeaway || "Water must pass quality verification before it can enter the potable supply."));
    append(report, make("p", "day-two-persistence-note", result?.nextChapterMessage || "The selected Day 2 state remains in the ordered mission history for Day 3.") );

    const actions = make("div", "day-two-complete-actions");
    append(actions,
      button("Enter Day 3 — Food Production", "story-primary-action", beginDayThree, ui.loading),
      button("Start a new mission", "button-secondary", startMission, ui.loading),
      make("span", "day-two-complete-note", "The Day 2 water state is carried into Day 3. No reprocessing success or numerical water result was invented."));

    append(shell, renderStoryHud(ui.mission, null, 2), dialogue, report, actions);
    root.append(shell);
  }

  function renderDayThreeComplete() {
    const feedback = ui.mission?.latestDecision;
    const result = ui.mission?.result;
    const state = ui.mission?.qualitativeState || {};
    const shell = make("section", "story-shell day-three-complete-story");
    const dialogue = renderStoryDialogue({
      speaker: "MISSION CONTROL",
      title: result?.title || "DAY 3 COMPLETE",
      text: result?.summary || feedback?.resultMessage || "Mission Control recorded the Day 3 food strategy.",
      note: result?.nextChapterMessage || "The Day 3 state is ready for a future mission chapter.",
      tone: "success"
    });
    dialogue.className = "story-dialogue day-three-complete-dialogue story-dialogue-success";

    const report = make("section", "day-three-report");
    report.setAttribute("aria-label", "Day 3 food production mission report");
    append(report, make("span", "story-eyebrow", "DAY 3 AUTHORITATIVE REPORT"));
    append(report, make("h2", "day-three-selected", `YOUR DECISION: ${result?.selectedDecision?.title || feedback?.choiceTitle || "DATA UNAVAILABLE"}`));
    const statusGrid = make("div", "day-three-status-grid");
    [
      ["STORED FOOD SUPPLY", state.storedFoodSupply],
      ["CROP PRODUCTION UNIT", state.cropProductionUnit],
      ["CROP GROWTH", state.cropGrowth],
      ["APPROVED WATER FOR CROPS", state.approvedWaterForCrops],
      ["POWER AVAILABILITY", state.powerAvailability],
      ["DAY 3 STATE", state.dayThreePersistentState],
      ["CROP OPERATION", state.cropOperationStatus],
      ["OPERATIONAL CONSTRAINT", state.cropOperationalConstraint]
    ].forEach(([label, value]) => {
      append(statusGrid, append(make("article", "day-three-status-card"), make("span", "story-change-label", label), make("strong", "", value || "DATA UNAVAILABLE")));
    });
    report.append(statusGrid);
    append(report,
      make("p", "day-three-science-note", result?.scientificTakeaway || feedback?.scientificTakeaway || "Crops need controlled light, water, nutrients, and monitoring; they do not provide an immediate meal."),
      make("p", "day-three-persistence-note", result?.nextChapterMessage || "The selected Day 3 state remains in the ordered mission history for Day 4."));

    const actions = make("div", "day-three-complete-actions");
    append(actions,
      button("Enter Day 4 — Emergency Protocol", "story-primary-action", beginDayFour, ui.loading),
      button("Start a new mission", "story-primary-action", startMission, ui.loading),
      make("span", "day-three-complete-note", "Day 3 is recorded for Day 4. The next chapter begins with a simulated solar-radiation alert."));

    append(shell, renderStoryHud(ui.mission, null, 3), dialogue, report, actions);
    root.append(shell);
  }

  function renderDayFourComplete() {
    const feedback = ui.mission?.latestDecision;
    const result = ui.mission?.result;
    const state = ui.mission?.qualitativeState || {};
    const shell = make("section", "story-shell day-four-complete-story");
    const dialogue = renderStoryDialogue({
      speaker: "MISSION CONTROL",
      title: result?.title || "DAY 4 COMPLETE",
      text: result?.summary || feedback?.resultMessage || "Mission Control recorded the Day 4 emergency response.",
      note: result?.nextChapterMessage || "The Day 4 record is descriptive; no final success or failure classification was calculated.",
      tone: "result"
    });
    dialogue.className = "story-dialogue day-four-complete-dialogue story-dialogue-result";

    const report = make("section", "day-four-report");
    report.setAttribute("aria-label", "Day 4 emergency protocol mission report");
    append(report, make("span", "story-eyebrow", "DAY 4 AUTHORITATIVE REPORT"));
    append(report, make("h2", "day-four-selected", `YOUR STRATEGY: ${result?.selectedDecision?.title || feedback?.choiceTitle || "DATA UNAVAILABLE"}`));
    const statusGrid = make("div", "day-four-status-grid");
    [
      ["EVA STATUS", state.evaStatus],
      ["CREW LOCATION", state.crewLocation],
      ["PRIMARY SHIELDING", state.primaryShielding],
      ["SUPPLEMENTARY SHIELDING", state.supplementaryShielding],
      ["WATER FOR SHIELDING", state.approvedWaterForShielding],
      ["FOOD FOR SHIELDING", state.packagedFoodForShielding],
      ["DAY 4 STATE", state.dayFourPersistentState],
      ["OPERATIONAL CONSTRAINT", state.dayFourOperationalConstraint]
    ].forEach(([label, value]) => {
      append(statusGrid, append(make("article", "day-four-status-card"), make("span", "story-change-label", label), make("strong", "", value || "DATA UNAVAILABLE")));
    });
    report.append(statusGrid);
    append(report,
      make("p", "day-four-result-note", result?.scientificTakeaway || feedback?.scientificTakeaway || "This is a simulated mission event, not live NASA telemetry."),
      make("p", "day-four-persistence-note", "The selected Day 4 strategy and inherited Day 1–3 states are preserved in the returned mission history."),
      make("p", "day-four-pending-note", "No radiation dose, shielding percentage, duration, threshold, or scientific success/failure classification was calculated. Final evaluation rules remain pending scientific review after November 13, 2026."));

    const actions = make("div", "day-four-complete-actions");
    append(actions,
      button("Start a new mission", "story-primary-action", startMission, ui.loading),
      make("span", "day-four-complete-note", "The Day 4 report is descriptive and based only on the verified game states returned by Mission Control."));

    append(shell, renderStoryHud(ui.mission, null, 4), dialogue, report, actions);
    root.append(shell);
  }

  function safeHttpsUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : null;
    } catch {
      return null;
    }
  }

  function renderFeedback() {
    const feedback = ui.mission?.latestDecision;
    if (!feedback) {
      const fallback = make("section", "story-shell story-error");
      append(fallback, make("div", "alert-box", "Mission Control did not return decision feedback. Your mission state has not advanced."),
        button("Return to the mission", "button-secondary", () => setScreen("game"), ui.loading));
      root.append(fallback);
      return;
    }
    const shell = make("section", "story-shell feedback-story");
    const ended = ui.mission.status !== "ACTIVE";
    const dialogue = renderStoryDialogue({
      speaker: ended ? "MISSION CONTROL" : "COMMANDER VEGA",
      title: feedback.choiceTitle,
      text: feedback.explanation,
      note: `${feedback.explanation} ${feedback.persistentEffect}`,
      tone: ended ? "result" : "success"
    });
    const changes = make("section", "story-change-rail");
    changes.setAttribute("aria-label", "Qualitative mission outcome");
    append(changes,
      append(make("article", "story-change-card"), make("span", "story-change-label", "PRESERVED"),
        make("strong", "", feedback.preserved || "DATA UNAVAILABLE")),
      append(make("article", "story-change-card"), make("span", "story-change-label", "REDUCED OR DELAYED"),
        make("strong", "", feedback.reducedOrDelayed || "DATA UNAVAILABLE")),
      append(make("article", "story-change-card"), make("span", "story-change-label", "RESERVE STATE"),
        make("strong", "", feedback.backupReserve || "DATA UNAVAILABLE")));
    const action = button(ended ? "Return to Day 1 report" : "Continue to Day 1", "story-primary-action", () => {
      setScreen(ended ? "day1Complete" : "game");
    }, ui.loading);
    const actionWrap = make("div", "story-feedback-action");
    actionWrap.append(action);
    append(shell, renderStoryHud(ui.mission, ui.mission?.event, feedback.day), dialogue,
      renderStoryEffects(ui.mission), changes, actionWrap);
    root.append(shell);
  }

  function renderResult() {
    const mission = ui.mission;
    const result = mission?.result;
    if (!result) {
      const fallback = make("section", "story-shell story-error");
      append(fallback, make("div", "alert-box", "Mission Control did not return a final result."),
        button("Start a fresh mission", "story-primary-action", startMission, ui.loading));
      root.append(fallback);
      return;
    }
    const shell = make("section", "story-shell result-story");
    const success = result.status === "SUCCEEDED";
    const dialogue = renderStoryDialogue({
      speaker: success ? "THE CREW" : "MISSION CONTROL",
      title: result.title,
      text: result.summary,
      note: result.limitingResource ? `Needs attention: ${result.limitingResource}.` : "The mission record below is calculated from the backend response.",
      tone: success ? "success" : "result"
    });
    const lessons = make("div", "story-lessons");
    append(lessons, make("span", "story-eyebrow", "WHAT THE CREW LEARNED"));
    (result.takeaways || []).forEach((item) => lessons.append(make("p", "story-lesson", item)));
    const log = make("div", "story-recap");
    append(log, make("span", "story-eyebrow", "MISSION RECAP"));
    (result.decisions || []).forEach((decision) => {
      const item = make("div", "story-recap-row");
      append(item, make("strong", "", `DAY ${decision.day}`), make("span", "", `${decision.title} — ${decision.lesson}`));
      log.append(item);
    });
    const actions = make("div", "story-result-actions");
    actions.append(button("Start a new mission", "story-primary-action", startMission, ui.loading));
    const opening = button("Back to the welcome screen", "button-secondary", () => {
      ui.mission = null;
      ui.decisionHistory = [];
      ui.selectedChoiceId = null;
      ui.communicationOpen = false;
      ui.interactionOpen = false;
      ui.interactionTarget = null;
      ui.paused = false;
      setScreen("welcome");
    }, ui.loading);
    actions.append(opening);
    append(shell, renderStoryHud(mission, null, mission.totalDays), dialogue,
      lessons, log, actions);
    root.append(shell);
  }

  resetViewport();
  render();
})();
