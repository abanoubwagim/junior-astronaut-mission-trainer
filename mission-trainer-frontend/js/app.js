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
    controlsCollapsed: false,
    sceneAvailable: document.documentElement?.dataset?.sceneStatus !== "fallback",
    sceneError: "",
    gateProgress: {},
    feedbackDismissed: true,
    dayOneComplete: false,
    dayTwoComplete: false,
    dayThreeComplete: false,
    dayFourComplete: false
  };

  function syncScene() {
    window.MOONBASE_SCENE_MODE = ui.screen;
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
      dayFourComplete: ui.dayFourComplete
    };
    if (document.body?.dataset) document.body.dataset.appScreen = ui.screen;
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
      controlRow("SHIFT", "Loping"),
      controlRow("SPACE", "Jump / thruster"),
      controlRow("E", "Interact"),
      controlRow("MOUSE", "Look around"),
      controlRow("SCROLL", "Camera distance"),
      controlRow("ESC", "Release mouse"));
    if (showPause) {
      controls.append(button(ui.paused ? "Resume mission" : "Pause", "button-secondary gameplay-pause-button", () => {
        ui.paused = !ui.paused;
        render();
      }, ui.loading || ui.interactionOpen));
    }
    return controls;
  }

  const sceneInteractionHandler = {
    onPlayerUpdate(telemetry) {
      const radar = root.querySelector?.(".mission-radar");
      if (!radar || !telemetry) return;
      const player = telemetry.player || {};
      const objective = telemetry.objective || {};
      const size = radar.clientWidth || 154;
      const mapRadius = size * 0.36;
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
      radar.style.setProperty("--radar-heading", `${Number(player.heading || 0)}rad`);
      if (Number.isFinite(Number(objective.x)) && Number.isFinite(Number(objective.z))) {
        radar.style.setProperty("--radar-objective-left", `${size / 2 + mapX(objective.x) * mapRadius}px`);
        radar.style.setProperty("--radar-objective-top", `${size / 2 + mapZ(objective.z) * mapRadius}px`);
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
      ui.interactionTarget = target;
      ui.interactionOpen = true;
      ui.paused = false;
      ui.error = "";
      render();
      root.focus({ preventScroll: true });
      announce(`${target.name} is open. Read Mission Control's briefing and choose a solution.`);
    },
    onInteract(target) {
      if (ui.screen === "welcome" && target?.id === "moonbase-entry" && !ui.loading) {
        startMission();
        return;
      }
      if (ui.screen !== "game" || ui.loading || !target) return;
      ui.interactionTarget = target;
      if (target.id?.endsWith("-entry")) {
        const gateDay = Number(target.day);
        ui.gateOpening = false;
        ui.gateProgress = { ...ui.gateProgress, [gateDay]: true };
        ui.interactionOpen = true;
        ui.paused = false;
        ui.error = "";
        render();
        root.focus({ preventScroll: true });
        announce(`${target.name} is open. Read Mission Control's briefing and choose a solution.`);
        return;
      }
      ui.interactionOpen = true;
      ui.feedbackDismissed = true;
      ui.paused = false;
      ui.error = "";
      render();
      root.focus({ preventScroll: true });
      announce(`You reached ${target.name}. Read Captain Nova's mission briefing.`);
    }
  };

  window.MOONBASE_SCENE_INTERACTION_HANDLER = sceneInteractionHandler;

  function setScreen(screen) {
    ui.screen = screen;
    ui.error = "";
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = false;
    ui.gateProgress = {};
    ui.feedbackDismissed = true;
    ui.dayOneComplete = false;
    ui.dayTwoComplete = false;
    ui.dayThreeComplete = false;
    ui.dayFourComplete = false;
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
    if (!payload.resources || !Array.isArray(payload.resourceDefinitions)
        || !Array.isArray(payload.decisionHistory) || !payload.systems) {
      throw new Error("Mission Control returned an incomplete mission state. Your mission was not advanced.");
    }
    if (payload.status === "ACTIVE" && !payload.event) {
      throw new Error("Mission Control did not return the next mission event. Your mission was not advanced.");
    }
    if (payload.status !== "ACTIVE" && !payload.result) {
      throw new Error("Mission Control did not return the terminal mission result. Your mission was not advanced.");
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

  async function startMission() {
    ui.mission = null;
    ui.decisionHistory = [];
    ui.selectedChoiceId = null;
    ui.error = "";
    ui.communicationOpen = false;
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = false;
    ui.gateProgress = {};
    ui.feedbackDismissed = true;
    ui.dayOneComplete = false;
    ui.dayTwoComplete = false;
    ui.dayThreeComplete = false;
    ui.dayFourComplete = false;
    ui.loading = true;
    ui.screen = "welcome";
    render();

    try {
      ui.mission = validateMission(await request("/missions/start", { method: "POST" }));
      ui.decisionHistory = [];
      ui.screen = "game";
      announce("Day 1 is ready. Use WASD to lunar walk, Shift to lope, and Space to jump or thrust.");
    } catch (error) {
      ui.error = displayError(error);
      ui.screen = "welcome";
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
    if (!event || !ui.selectedChoiceId || ui.loading) return;

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
      // The scene remains playable after each response; the server report is
      // shown in-world while the next station becomes the active objective.
      ui.screen = event.day <= 3 ? "game" : "result";
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

  function announce(message) {
    announcer.textContent = "";
    window.setTimeout(() => { announcer.textContent = message; }, 20);
  }

  function render() {
    syncScene();
    root.replaceChildren();
    if (ui.error) root.append(make("div", "alert-box", ui.error));

    switch (ui.screen) {
      case "briefing": renderBriefing(); break;
      case "game": renderGame(); break;
      case "day1Complete": renderDayOneComplete(); break;
      case "feedback": renderFeedback(); break;
      case "result": renderResult(); break;
      default: renderWelcome();
    }
    const brandName = document.querySelector(".brand-name");
    if (brandName) {
      brandName.dataset.missionDay = String(ui.mission?.event?.day || ui.mission?.day || 1);
      brandName.dataset.totalDays = String(ui.mission?.totalDays || 4);
    }
  }

  function renderWelcome() {
    const section = make("section", "welcome-screen");
    section.setAttribute("aria-labelledby", "welcome-title");
    const previewMission = {
      day: 1,
      totalDays: 4,
      resources: { power: 10, water: 10, food: 8, shelterReadiness: 7 },
      resourceDefinitions: [
        { key: "power", label: "Power", maximum: 12, unit: "game units" },
        { key: "water", label: "Water", maximum: 12, unit: "game units" },
        { key: "food", label: "Food", maximum: 12, unit: "game units" },
        { key: "shelterReadiness", label: "Shelter", maximum: 12, unit: "game units" }
      ]
    };
    const previewEvent = {
      day: 1,
      title: "Solar array inspection",
      situation: "The base is awake. Let's check the solar panels and get things running."
    };
    const objective = make("section", "gameplay-objective welcome-objective");
    append(objective,
      append(make("div", "gameplay-objective-head"), make("span", "story-eyebrow", "MISSION OBJECTIVE"), make("span", "objective-diamond", "◆")),
      make("h1", "gameplay-title", "Keep the base alive"),
      make("p", "gameplay-objective-copy", "Balance Power, Life Support, Food and Shielding, then finish Day 4 with protection ready."));
    objective.querySelector?.(".gameplay-title")?.setAttribute("id", "welcome-title");

    const task = make("aside", "gameplay-task welcome-task");
    append(task, make("div", "gameplay-task-kicker", "DAY 1 OBJECTIVE"),
      make("h2", "gameplay-task-title", "Explore the station"),
      make("p", "gameplay-task-copy", "Fly to the MoonBase 1 airlock and press E to begin Day 1, then repair the solar panels."),
      append(make("div", "gameplay-task-status"), make("span", "task-status-icon", "!"), make("span", "", "Solar beacon active")));

    const startCard = make("section", "welcome-start-card");
    append(startCard, make("span", "welcome-start-kicker", "MOONBASE // MISSION DAY 1 OF 4"),
      make("h1", "welcome-start-title", "Your lunar mission starts here"),
      make("p", "welcome-start-copy", "Fly to the illuminated MoonBase 1 door and press E to begin the first mission, or use the button below."));
    const startButton = button(ui.loading ? "Connecting to Mission Control…" : "Start mission", "story-primary-action", startMission, ui.loading);
    if (ui.loading) {
      startButton.replaceChildren(make("span", "loading-label", "Connecting to Mission Control…"));
      startButton.querySelector(".loading-label").prepend(make("span", "spinner"));
    } else {
      startButton.append(make("span", "arrow", "→"));
    }
    startCard.append(startButton);

    const entryHint = make("div", `gameplay-interaction-hint welcome-interaction-hint${ui.interactionTarget ? " is-ready" : ""}`);
    if (ui.interactionTarget) {
      append(entryHint,
        make("span", "interaction-key", "E"),
        make("span", "interaction-copy", `Enter ${ui.interactionTarget.name}`),
        make("small", "interaction-description", "The airlock is open. Press E to begin Mission Day 1."));
    } else {
      append(entryHint,
        make("span", "interaction-scan-dot"),
        make("span", "interaction-copy", "Find the illuminated airlock"),
        make("small", "interaction-description", "Fly with W A S D · press E when you are near the door"));
    }

    append(section,
      renderStoryHud(previewMission, previewEvent),
      objective,
      task,
      renderMissionRadar(),
      entryHint,
      renderGameControls(),
      renderGameDialogue(previewEvent),
      startCard);
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
    const resources = make("div", "story-resources");
    (mission?.resourceDefinitions || []).forEach((definition) => {
      const value = mission.resources?.[definition.key] ?? 0;
      const resource = make("div", "story-resource");
      resource.classList?.add(`resource-${definition.key}`);
      const resourceRatio = definition.maximum ? value / definition.maximum : 0;
      resource.classList?.add(resourceRatio <= 0.25 ? "is-critical" : resourceRatio <= 0.5 ? "is-warning" : "is-healthy");
      const resourceTop = make("div", "story-resource-top");
      const label = make("span", "story-resource-label");
      const iconKey = definition.key === "shelterReadiness" ? "shelter" : definition.key;
      const displayLabel = definition.key === "shelterReadiness" ? "Shelter" : definition.label;
      append(label, make("span", `story-resource-icon resource-icon-${iconKey}`), document.createTextNode(displayLabel));
      const amount = make("div", "story-resource-amount");
      const valueElement = make("strong", "story-resource-value", String(value));
      valueElement.setAttribute("aria-label", `${definition.label}: ${value} of ${definition.maximum} ${definition.unit}`);
      append(amount, valueElement, make("span", "story-resource-limit", `/${definition.maximum}`));
      append(resourceTop, label, amount,
        make("span", "visually-hidden", `${definition.label} · ${value} / ${definition.maximum}`));
      const meter = make("span", "story-resource-meter");
      meter.setAttribute("role", "meter");
      meter.setAttribute("aria-label", `${definition.label}: ${value} of ${definition.maximum} ${definition.unit}`);
      meter.setAttribute("aria-valuemin", String(definition.minimum ?? 0));
      meter.setAttribute("aria-valuemax", String(definition.maximum));
      meter.setAttribute("aria-valuenow", String(value));
      const fill = make("span");
      fill.style.width = `${Math.max(0, Math.min(100, (value / definition.maximum) * 100))}%`;
      meter.append(fill);
      resource.append(resourceTop, meter);
      resources.append(resource);
    });
    const progress = make("div", "story-day-progress");
    progress.setAttribute("aria-label", `Mission day ${day} of ${mission?.totalDays || 4}`);
    progress.append(make("span", "story-day-caption", `DAY ${day} / ${mission?.totalDays || 4}`));
    for (let index = 1; index <= (mission?.totalDays || 4); index += 1) {
      const dot = make("span", `story-day-dot${index <= day ? " active" : ""}`);
      dot.setAttribute("aria-hidden", "true");
      progress.append(dot);
    }
    append(hud, marker, resources, progress);
    return hud;
  }

  function renderMissionRadar() {
    const radar = make("div", "mission-radar");
    radar.setAttribute("aria-label", "Mission radar. The cyan marker shows your astronaut.");
    append(radar,
      make("span", "radar-label radar-north", "N"),
      make("span", "radar-line radar-line-horizontal"),
      make("span", "radar-line radar-line-vertical"),
      make("span", "radar-sweep"),
      make("span", "radar-player"),
      make("span", "radar-objective"));
    return radar;
  }

  function renderGameDialogue(event) {
    const dialogue = make("aside", `story-dialogue gameplay-dialogue gameplay-dialogue-live gameplay-commander-card${ui.interactionOpen ? " is-briefing" : ""}${ui.interactionOpen || ui.screen === "game" ? " is-open" : ""}`);
    dialogue.setAttribute("aria-live", "polite");
    dialogue.setAttribute("aria-label", `Commander Vega briefing: ${event.title}`);
    const portrait = make("div", "crew-portrait");
    append(portrait, make("span", "crew-portrait-visor"), make("span", "crew-portrait-light"));
    const copy = make("div", "gameplay-dialogue-copy");
    append(copy,
      make("div", "story-speaker-line", "COMMANDER VEGA"),
      make("p", "story-subtitle", event.situation));
    if (event.hazardType || event.hazardLevel || event.oneWayCommunicationDelaySeconds) {
      const signal = make("div", "story-hazard-signal");
      const level = event.hazardLevel || "NORMAL";
      append(signal,
        make("span", `story-hazard-level is-${level.toLowerCase()}`, `RISK ${level}`),
        make("strong", "story-hazard-type", event.hazardType || "Mission environment"),
        make("span", "story-hazard-delay", `Moon link: ${Number(event.oneWayCommunicationDelaySeconds || 1.3).toFixed(1)} s one-way`));
      copy.append(signal);
    }
    if (ui.interactionOpen && event.scienceFact) {
      copy.append(make("p", "gameplay-dialogue-note", event.scienceFact));
    }
    if (ui.interactionOpen && event.scienceSources?.length) {
      const sourceLine = make("p", "story-source-line");
      append(sourceLine, document.createTextNode("NASA science source: "));
      event.scienceSources.slice(0, 2).forEach((source) => {
        const url = safeHttpsUrl(source.url);
        const link = make("a", "story-source-link", source.title || "Open source");
        if (url) {
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        sourceLine.append(link);
      });
      copy.append(sourceLine);
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
        make("span", "story-choice-tradeoff", choice.tradeoff),
        make("span", "story-choice-state", selected ? "Selected · press confirm" : "Select this solution"));
      choices.append(card);
    });
    return choices;
  }

  function renderStoryEffects(mission) {
    const effects = make("div", "story-effects");
    if (mission?.activeEffects?.length) {
      append(effects, make("span", "story-effects-label", "ACTIVE SYSTEMS"),
        make("span", "story-effects-value", mission.activeEffects.join(" · ")));
    } else {
      append(effects, make("span", "story-effects-label", "MISSION CONTROL"),
        make("span", "story-effects-value", "No delayed systems yet. Your next choice can change the future."));
    }
    return effects;
  }

  function renderStorySystems(mission) {
    const systems = mission?.systems;
    const strip = make("div", "story-system-strip");
    if (!systems) return strip;
    const statuses = [
      ["CO₂ removal loop", systems.airLoopServiced ? "Serviced" : "Not serviced"],
      ["Shielding preparation", systems.shieldingPrepared ? "Prepared" : "Not prepared"],
      ["Shelter activation", systems.shelterActivated ? "Activated" : "Not activated"],
      ["Protection readiness", systems.protectionReady ? "Ready" : "Not ready"]
    ];
    statuses.forEach(([label, value]) => {
      const chip = make("span", "story-system-chip", `${label}: ${value}`);
      if (label === "CO₂ removal loop") {
        chip.append(make("span", "visually-hidden", " Air cleaning removes carbon dioxide; it does not generate oxygen."));
      }
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
      make("h2", "mission-feedback-title", decision.headline || `Day ${decision.day} decision report`),
      make("p", "mission-feedback-explanation", decision.explanation || "Mission Control accepted the decision."),
      make("p", "mission-feedback-why", decision.whyItMatters || "This choice changed the outpost state."));
    const changes = make("div", "mission-feedback-changes");
    (mission.resourceDefinitions || []).forEach((definition) => {
      const change = decision.resourceBreakdown?.[definition.key];
      if (!change) return;
      const delta = Number(change.change ?? (change.after - change.before));
      const label = delta > 0 ? `+${delta}` : String(delta);
      const line = make("span", `mission-feedback-change${delta < 0 ? " is-negative" : ""}`);
      append(line, make("strong", "", definition.label), make("span", "", `${label} · ${change.after}/${definition.maximum}`));
      changes.append(line);
    });
    append(report, changes,
      make("p", "mission-feedback-future", decision.futureEffect || "Your next objective is now active."),
      button("Hide report and continue exploring", "button-secondary mission-feedback-dismiss", () => {
        ui.feedbackDismissed = true;
        render();
      }, ui.loading));
    return report;
  }

  function renderBriefing() {
    const mission = ui.mission;
    const section = make("section", "story-shell briefing-story");
    const stage = make("div", "story-briefing-stage");
    const dialogue = renderStoryDialogue({
      speaker: "MISSION CONTROL",
      title: "Mission briefing",
      text: "Guide the crew through four mission days. The base is awake, the crew is ready, and every repair can change what happens next.",
      note: "Your objective: keep Power, Water, and Food above zero, then finish Day 4 with a ready shelter. These are simplified game values, not real engineering measurements."
    });
    const controls = make("div", "story-briefing-controls");
    append(controls, make("span", "story-eyebrow", "VISUAL MISSION GUIDE"),
      make("p", "story-briefing-copy", "Read the astronaut's subtitles, watch the highlighted station, then choose one solution. Mission Control calculates every supply change."),
      renderStoryEffects(mission),
      button(ui.loading ? "Preparing…" : "Begin Day 1", "story-primary-action", () => setScreen("game"), ui.loading));
    const demo = renderCommunicationDemo();
    demo.className = `${demo.className} story-demo`.trim();
    append(stage, dialogue, controls, demo);
    append(section, renderStoryHud(mission, mission?.event, 1), stage);
    root.append(section);
  }

  function renderCommunicationDemo() {
    const panel = make("article", "panel communication-demo");
    const heading = make("div", "communication-heading");
    append(heading, make("div", "section-kicker", "Optional science"),
      make("h2", "", "How messages travel to Earth"));
    const toggle = button(ui.communicationOpen ? "Hide communication demo" : "Show communication demo",
      "button-secondary", () => {
        ui.communicationOpen = !ui.communicationOpen;
        render();
        root.focus({ preventScroll: true });
      });
    append(panel, heading, make("p", "", "The Moon is close enough for a quick signal, but real mission teams still plan for more than light-travel time."), toggle);

    if (ui.communicationOpen) {
      const delay = Number(ui.mission?.spaceWeather?.oneWayCommunicationDelaySeconds || 1.3);
      const facts = make("div", "communication-facts");
      const track = make("div", "communication-track");
      append(track, make("span", "communication-node", "Earth"),
        make("span", "communication-pulse", "⇄"), make("span", "communication-node", "Moon"));
      append(facts, track,
        make("p", "", `One-way light-travel time is about ${delay.toFixed(1)} seconds.`),
        make("p", "", `The minimum light-only round trip is about ${(delay * 2).toFixed(1)} seconds.`),
        make("p", "", "Real operational communication can take longer because people, computers, scheduling, and network routing add time."),
        make("p", "communication-note", "This is an optional explanation. It does not spend a mission day, change supplies, or enter your decision history."));
      panel.append(facts);
    }
    return panel;
  }

  function renderResources(mission) {
    const dashboard = make("section", "resource-dashboard");
    dashboard.setAttribute("aria-label", "Current mission supplies");
    (mission.resourceDefinitions || []).forEach((definition) => {
      const value = mission.resources?.[definition.key] ?? 0;
      const card = make("article", "resource-card");
      const top = make("div", "resource-card-top");
      append(top, make("h2", "", definition.label));
      const amount = make("div", "resource-value");
      append(amount, document.createTextNode(String(value)), make("small", "", ` / ${definition.maximum}`));
      top.append(amount);

      const meter = make("div", "resource-meter");
      meter.setAttribute("role", "meter");
      meter.setAttribute("aria-label", `${definition.label}: ${value} of ${definition.maximum} ${definition.unit}`);
      meter.setAttribute("aria-valuemin", String(definition.minimum));
      meter.setAttribute("aria-valuemax", String(definition.maximum));
      meter.setAttribute("aria-valuenow", String(value));
      const fill = make("span");
      fill.style.width = `${Math.max(0, Math.min(100, (value / definition.maximum) * 100))}%`;
      meter.append(fill);
      append(card, top, meter, make("div", "resource-purpose", definition.purpose),
        make("span", "resource-unit", `Game value · ${definition.unit}`));
      dashboard.append(card);
    });
    return dashboard;
  }

  function renderGame() {
    const mission = ui.mission;
    const event = mission?.event;
    if (!event) {
      const fallback = make("section", "story-shell story-error");
      append(fallback, make("div", "alert-box", "Mission Control did not receive the next day. Start a fresh mission to continue."),
        button("Start a fresh mission", "story-primary-action", startMission, ui.loading));
      root.append(fallback);
      return;
    }
    const section = make("section", "story-shell gameplay-shell");
    section.setAttribute("aria-labelledby", "gameplay-title");
    const hud = renderStoryHud(mission, event);
    hud.className = "story-hud gameplay-hud";
    const telemetry = make("aside", "mission-telemetry");
    const telemetryStatus = mission?.spaceWeather?.severity || event.hazardLevel || "NORMAL";
    const telemetrySource = mission?.spaceWeather?.sourceTitle || "NASA science reference";
    const sourceLink = mission?.spaceWeather?.sourceUrl ? make("a", "mission-telemetry-source", `Source: ${telemetrySource}`) : null;
    if (sourceLink) {
      sourceLink.href = mission.spaceWeather.sourceUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noreferrer noopener";
    }
    append(telemetry,
      make("span", "mission-telemetry-kicker", "SPACE WEATHER // DATA CONTEXT"),
      make("strong", `mission-telemetry-status is-${String(telemetryStatus).toLowerCase()}`, `${telemetryStatus} · ${event.hazardType || "Lunar operations"}`),
      make("span", "mission-telemetry-copy", `${event.dataStatus || telemetrySource} · ${mission?.spaceWeather?.dataNote || "Game values are simplified for learning."}`),
      sourceLink);

    const objective = make("section", "gameplay-objective");
    append(objective,
      append(make("div", "gameplay-objective-head"),
        make("span", "story-eyebrow", "MISSION OBJECTIVE"),
        make("span", "objective-diamond", "◆")),
      make("h1", "gameplay-title", "Keep the base alive"),
      make("p", "gameplay-objective-copy", "Balance Power, Life Support, Food and Shielding, then finish Day 4 with protection ready."),
      append(make("div", "gameplay-objective-status"),
        make("span", "objective-status-dot"),
        document.createTextNode(`Day ${event.day} of ${mission.totalDays || 4} · ${ui.interactionTarget ? `Near ${ui.interactionTarget.name}` : "Objective beacon active"}`)));
    objective.querySelector?.(".gameplay-title")?.setAttribute("id", "gameplay-title");

    const task = make("aside", `gameplay-task${ui.interactionOpen ? " is-briefing-task" : ""}`);
    const atMissionGate = Boolean(ui.interactionTarget?.id?.endsWith("-entry") && !ui.interactionTarget.locked);
    append(task,
      make("div", "gameplay-task-kicker", "CURRENT TASK"),
      make("h2", "gameplay-task-title", event.title),
      make("p", "gameplay-task-copy", ui.gateOpening
        ? `${ui.interactionTarget?.name || "Mission gate"} is opening. Hold position for the cinematic transition.`
        : atMissionGate
          ? "Press E at this gate to begin its mission."
          : "Explore the station and repair the highlighted system."),
      append(make("div", "gameplay-task-status"), make("span", "task-status-icon", "!"), make("span", "", atMissionGate ? "Gate ready — press E" : "Station beacon active")));

    const showInteractionHint = !ui.interactionOpen && (ui.gateOpening || ui.interactionTarget);
    const hint = showInteractionHint
      ? make("div", `gameplay-interaction-hint${ui.interactionTarget && !ui.interactionTarget.locked ? " is-ready" : ""}`)
      : null;
    if (hint && ui.gateOpening) {
      append(hint, make("span", "interaction-key", "…"), make("span", "interaction-copy", "MISSION GATE OPENING"),
        make("small", "interaction-description", "Mechanical locks are releasing. Mission Control will brief you when the door is ready."));
    } else if (hint && ui.interactionTarget?.locked) {
      append(hint, make("span", "interaction-key", "LOCKED"), make("span", "interaction-copy", `${ui.interactionTarget.name} locked`),
        make("small", "interaction-description", ui.interactionTarget.description));
    } else if (hint && ui.interactionTarget) {
      append(hint, make("span", "interaction-key", "E"), make("span", "interaction-copy", `Interact with ${ui.interactionTarget.name}`),
        make("small", "interaction-description", ui.interactionTarget.description));
    }

    const fallbackNotice = ui.sceneAvailable ? null : make("aside", "scene-fallback-notice", "");
    if (fallbackNotice) append(fallbackNotice,
      make("span", "story-eyebrow", "ACCESSIBLE MISSION TERMINAL"),
      make("strong", "", ui.sceneError || "The 3D view is unavailable."),
      make("p", "", "Use the keyboard or buttons below to inspect the current mission station. Mission Control still calculates every consequence."));

    const controls = renderGameControls({ showPause: true });

    const dialogue = renderGameDialogue(event);
    dialogue.id = "event-title";

    const choicePanel = make("div", `gameplay-decision-panel gameplay-task-decision in-world-terminal${ui.interactionOpen || !ui.sceneAvailable ? " is-open" : ""}`);
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

    append(section, hud, telemetry, objective, task, renderMissionRadar(), hint, controls, renderStorySystems(mission),
      fallbackNotice, dialogue, renderDecisionFeedback(mission), pauseMenu);
    root.append(section);
  }

  function renderDayOneComplete() {
    const feedback = ui.mission?.latestDecision;
    const shell = make("section", "story-shell day-one-complete-story");
    const dialogue = renderStoryDialogue({
      speaker: "MISSION CONTROL",
      title: "Day 1 complete — gate unlocked",
      text: feedback?.explanation || "The solar array is back online. The next mission gate is now unlocked.",
      note: feedback ? `${feedback.whyItMatters} ${feedback.futureEffect}` : "Your answer was accepted by Mission Control.",
      tone: "success"
    });
    dialogue.className = "story-dialogue day-one-complete-dialogue story-dialogue-success";

    const gate = make("aside", "day-two-gate-card");
    append(gate,
      make("span", "story-eyebrow", "NEXT OBJECTIVE"),
      make("h2", "", "Day 2 gate unlocked"),
      make("p", "", "The water systems door is ready for the next chapter. You can move freely now and follow the illuminated arrow to MoonBase 2."),
      make("span", "gate-lock-status", "ACCESS GRANTED"));

    const changes = make("section", "story-change-rail day-one-change-rail");
    changes.setAttribute("aria-label", "Day 1 resource changes");
    (ui.mission?.resourceDefinitions || []).forEach((definition) => {
      const detail = feedback?.resourceBreakdown?.[definition.key];
      if (!detail) return;
      const card = make("article", "story-change-card");
      const net = formatSigned(detail.change);
      append(card, make("span", "story-change-label", definition.label),
        make("strong", "", `${detail.after} / ${definition.maximum}`),
        make("span", `story-change-net${net.startsWith("-") ? " negative" : ""}`, `${net} this day`));
      changes.append(card);
    });

    const actions = make("div", "day-one-complete-actions");
    append(actions,
      button("Replay Day 1", "story-primary-action", startMission, ui.loading),
        make("span", "day-one-complete-note", "Use W A S D to lunar walk, Shift to lope, and Space to jump or thrust toward MoonBase 2."));

    append(shell, renderStoryHud(ui.mission, null, 1), renderMissionRadar(), dialogue, gate, changes, actions);
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

  function renderSystems(mission) {
    const panel = make("section", "panel side-panel system-status-panel");
    panel.append(make("h2", "", "System status"));
    const systems = mission?.systems;
    if (!systems) {
      panel.append(make("p", "empty-effects", "Mission Control did not return system status."));
      return panel;
    }

    const statuses = [
      ["CO₂ removal loop", systems.airLoopServiced ? "Serviced" : "Not serviced",
        "Air cleaning removes carbon dioxide; it does not generate oxygen."],
      ["Shielding preparation", systems.shieldingPrepared ? "Prepared" : "Not prepared",
        "Preparation is separate from activating the shelter."],
      ["Shelter activation", systems.shelterActivated ? "Activated" : "Not activated",
        `Mode: ${systems.shelterMode || "Not selected"}.`],
      ["Emergency protection", systems.emergencyProtectionActivated ? "Activated" : "Not used",
        "Full shelter can use an emergency setup when preparation was skipped."],
      ["Protection readiness", systems.protectionReady ? "Ready" : "Not ready",
        "This is a qualitative game state, not a radiation dose or shielding percentage."]
    ];
    const list = make("ul", "system-status-list");
    statuses.forEach(([label, value, explanation]) => {
      const item = make("li");
      append(item, make("div", "system-status-top", `${label}: ${value}`),
        make("span", "system-status-explanation", explanation));
      list.append(item);
    });
    panel.append(list);
    return panel;
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
      speaker: ended ? "MISSION CONTROL" : "CAPTAIN NOVA",
      title: feedback.choiceTitle,
      text: feedback.explanation,
      note: `${feedback.whyItMatters} ${feedback.futureEffect}`,
      tone: ended ? "result" : "success"
    });
    const changes = make("section", "story-change-rail");
    changes.setAttribute("aria-label", "Server-calculated resource changes");
    const definitions = ui.mission.resourceDefinitions || [];
    definitions.forEach((definition) => {
      const detail = feedback.resourceBreakdown?.[definition.key];
      if (!detail) return;
      const card = make("article", "story-change-card");
      const net = formatSigned(detail.change);
      append(card, make("span", "story-change-label", definition.label),
        make("strong", "", `${detail.after} / ${definition.maximum}`),
        make("span", `story-change-net${net.startsWith("-") ? " negative" : ""}`, `${net} this day`),
        make("span", "story-change-detail", `Before ${detail.before} · daily ${formatSigned(detail.daily)} · delayed ${formatSigned(detail.delayed)} · event ${formatSigned(detail.event)} · choice ${formatSigned(detail.choice)}`));
      changes.append(card);
    });
    const action = button(ended ? "See mission results" : `Continue to Day ${ui.mission.day}`, "story-primary-action", () => {
      if (ended) setScreen("result");
      else setScreen("game");
    }, ui.loading);
    const actionWrap = make("div", "story-feedback-action");
    actionWrap.append(action);
    append(shell, renderStoryHud(ui.mission, ui.mission?.event, feedback.day), dialogue,
      renderStoryEffects(ui.mission), changes, actionWrap);
    root.append(shell);
  }

  function formatSigned(value) {
    if (value > 0) return `+${value}`;
    return String(value);
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

  render();
})();
