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
    // The Moon is the default playable environment. Mars remains available
    // through an explicit world query/selection.
    world: window.MOONBASE_SCENE_WORLD === "mars" ? "mars" : "moon",
    gateProgress: {},
    feedbackDismissed: true,
    dayOneComplete: false,
    dayTwoComplete: false,
    dayThreeComplete: false,
    dayFourComplete: false
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
      dayFourComplete: ui.dayFourComplete
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
    startMission();
  }

  window.addEventListener?.("keydown", handleWelcomeKeydown, { passive: false });

  function setScreen(screen) {
    ui.screen = screen;
    ui.error = "";
    ui.interactionOpen = false;
    ui.interactionTarget = null;
    ui.gateOpening = false;
    ui.paused = false;
    ui.controlsCollapsed = screen === "game";
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
    if (!payload.qualitativeState || !Array.isArray(payload.decisionHistory)) {
      throw new Error("Mission Control returned an incomplete mission state. Your mission was not advanced.");
    }
    if (payload.status === "ACTIVE" && !payload.event) {
      throw new Error("Mission Control did not return the next mission event. Your mission was not advanced.");
    }
    if (payload.status === "DAY_1_COMPLETE" && (!payload.result || payload.event)) {
      throw new Error("Mission Control did not return the terminal mission result. Your mission was not advanced.");
    }
    if (!["ACTIVE", "DAY_1_COMPLETE"].includes(payload.status)) {
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

  async function startMission() {
    if (ui.loading) return;
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
      ui.screen = "briefing";
      announce("Mission briefing ready. Review the objectives, then continue to Day 1.");
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
      // Day 1 is the only playable mission in this slice. Keep the terminal
      // report separate so Days 2–4 cannot be opened accidentally.
      ui.screen = event.day === 1 ? "day1Complete" : "result";
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
      case "worldSelection": renderWorldSelection(); break;
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
    const isMars = ui.world === "mars";
    const worldName = isMars ? "MARS" : "MOON";
    const protocolLabel = isMars ? "MARTIAN EXPEDITION PROTOCOL // SECTOR MARS-04" : "LUNAR EXPEDITION PROTOCOL // SECTOR MOON-04";
    const briefingLabel = isMars ? "MARS SURFACE EXPEDITION BRIEFING" : "NASA ARTEMIS EXPEDITION BRIEFING";
    const targetLabel = isMars ? "MARS RESEARCH REGION" : "LUNAR SOUTH POLE";
    const assuranceLabel = isMars
      ? "Explore the Martian base, make four mission decisions, and learn how a crew keeps a habitat running."
      : "Explore the lunar base, make four mission decisions, and learn how a crew keeps a habitat running.";
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
    const lede = make("p", "welcome-lede", "A NASA-Powered Interactive 3D Planetary Survival Expedition for Ages 7–12.");
    const startWrap = make("div", "welcome-start-wrap");
    const startButton = button(ui.loading ? "Connecting to Mission Control…" : "Start mission", "welcome-start-button", startMission, ui.loading);
    startButton.setAttribute("aria-label", ui.loading ? "Connecting to Mission Control" : "Start mission");
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
      make("span", "story-hud-subtitle", ui.world === "mars" ? "Martian outpost survival mission" : "Lunar outpost survival mission"));
    const state = mission?.qualitativeState || {};
    const status = make("div", "story-qualitative-status");
    [
      ["SOLAR INPUT", state.solarInput || "DATA UNAVAILABLE"],
      ["POWER PLAN", state.powerAllocation || "PENDING"],
      ["DATA", state.dataStatus || "DATA UNAVAILABLE"]
    ].forEach(([label, value]) => {
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
      append(effects, make("span", "story-effects-label", "ACTIVE MISSION STATES"),
        make("span", "story-effects-value", mission.activeEffects.join(" · ")));
    } else {
      append(effects, make("span", "story-effects-label", "MISSION CONTROL"),
        make("span", "story-effects-value", "No qualitative power plan recorded yet."));
    }
    return effects;
  }

  function renderStorySystems(mission) {
    const strip = make("div", "story-system-strip");
    const state = mission?.qualitativeState || {};
    const statuses = [
      ["CREW SUPPORT", state.crewSupport || "DATA UNAVAILABLE"],
      ["BACKUP RESERVE", state.backupReserve || "DATA UNAVAILABLE"],
      ["VALUE ORIGIN", state.valueOrigin || "GAME_SIMULATION"]
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
      make("h2", "mission-feedback-title", decision.headline || `Day ${decision.day} decision report`),
      make("p", "mission-feedback-explanation", decision.explanation || "Mission Control accepted the decision."),
      make("p", "mission-feedback-why", decision.whyItMatters || "This choice changed the outpost state."));
    const changes = make("div", "mission-feedback-qualitative");
    append(changes,
      make("p", "mission-feedback-change", `PRESERVED: ${decision.preserved || "DATA UNAVAILABLE"}`),
      make("p", "mission-feedback-change", `REDUCED OR DELAYED: ${decision.reducedOrDelayed || "DATA UNAVAILABLE"}`),
      make("p", "mission-feedback-change", `RESERVE STATE: ${decision.reserveState || "DATA UNAVAILABLE"}`));
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
      make("p", "", "You are about to begin a space exploration mission. Explore unfamiliar environments, investigate mission challenges, understand the science behind them, and make thoughtful decisions along the way."));
    heroCopy.querySelector?.("h1")?.setAttribute("id", "briefing-title");
    heroCard.append(heroCopy);

    const objectives = make("section", "briefing-objectives");
    const objectivesHeader = make("div", "briefing-section-header");
    append(objectivesHeader,
      append(make("div", "briefing-section-title"), make("span", "briefing-section-icon", "⌁"), make("h2", "", "YOUR MISSION")),
      make("span", "briefing-section-count", "4 CORE OBJECTIVES"));
    const objectiveGrid = make("div", "briefing-objective-grid");
    [
      ["01", "EXPLORE", "Discover new places and interact with the world around you.", "Survey planetary terrain", "◌", "primary"],
      ["02", "OBSERVE", "Look closely and discover what scientific data tells you.", "Read sensor evidence", "◎", "primary"],
      ["03", "UNDERSTAND", "Learn why space exploration can be challenging.", "Analyze real conditions", "◇", "secondary"],
      ["04", "DECIDE", "Choose how to respond to mission challenges.", "Execute informed choices", "⌁", "primary"]
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
      make("p", "", "Two worlds. Two different adventures. Where will you explore?"),
      append(make("div", "world-selection-crosshair"), make("span", "", "╱"), make("span", "world-selection-crosshair-icon", "⌖"), make("span", "", "╲")));

    const destinationGrid = make("section", "destination-grid");
    destinationGrid.setAttribute("aria-label", "Available destinations");

    const selectWorld = (world) => {
      ui.world = world === "moon" ? "moon" : "mars";
      const url = new URL(window.location.href);
      url.searchParams.set("world", ui.world);
      window.history.replaceState({}, "", url);
      setScreen("game");
      window.MoonBaseScene?.setWorld?.(ui.world);
    };

    const moonCard = button("", "destination-card destination-card-moon", () => selectWorld("moon"));
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
        append(make("div", "destination-card-pills"), make("span", "", "LUNAR CRATERS"), make("span", "", "DEEP SHADOW CRATERS"), make("span", "", "EARTH IN SIGHT")),
        make("p", "", "Explore the lunar surface and discover the challenges of working on our nearest celestial neighbor."),
        append(make("span", "destination-card-action destination-card-action-moon"), make("span", "", "Explore the Moon"), make("span", "", "↗"))));

    const marsCard = button("", "destination-card destination-card-mars", () => selectWorld("mars"));
    marsCard.setAttribute("aria-label", "Select destination: Mars");
    append(marsCard,
      append(make("div", "destination-card-image"), (() => {
        const image = make("img", "", "");
        image.src = "../assets/backgrounds/mars-world-selection.png";
        image.alt = "Mars surface landscape with dunes and canyons";
        return image;
      })(), make("span", "destination-card-tint")),
      append(make("div", "destination-card-top"),
        append(make("span", "destination-card-tag"), make("span", "destination-card-dot destination-card-dot-mars"), make("span", "", "DESTINATION 02 // THE RED PLANET")),
        make("span", "destination-card-symbol destination-card-symbol-mars", "✦")),
      append(make("div", "destination-card-content"),
        append(make("div", "destination-card-heading"), make("span", "destination-card-kicker destination-card-kicker-mars", "PLANETARY BODY"), make("h2", "", "MARS")),
        append(make("div", "destination-card-pills"), make("span", "", "DUSTY TERRAIN"), make("span", "", "ANCIENT RIVERBEDS"), make("span", "", "THIN ATMOSPHERE")),
        make("p", "", "Explore the Red Planet and discover the challenges of exploring a world far beyond Earth."),
        append(make("span", "destination-card-action destination-card-action-mars"), make("span", "", "EXPLORE MARS"), make("span", "", "↗"))));

    append(destinationGrid, moonCard, marsCard);

    const footer = make("footer", "world-selection-footer");
    const footerBack = button("Back to challenge briefing", "world-selection-footer-back", returnToBriefing);
    const footerHint = make("div", "world-selection-footer-hint");
    append(footerHint, make("span", "world-selection-footer-dot"), make("span", "", "SELECT A DESTINATION TO LAUNCH MISSION BRIEFING"));
    append(footer, footerBack, footerHint);

    append(main, intro, destinationGrid, footer);
    append(section, nav, main);
    root.append(section);
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
    append(telemetry,
      make("span", "mission-telemetry-kicker", "MISSION DATA // CONTEXT"),
      make("strong", "mission-telemetry-status is-unavailable", "DATA UNAVAILABLE"),
      make("span", "mission-telemetry-copy", "This Day 1 power-drop condition is a fictional educational simulation state. It is not live NASA telemetry."));

    const objective = make("section", "gameplay-objective");
    append(objective,
      append(make("div", "gameplay-objective-head"),
        make("span", "story-eyebrow", "MISSION OBJECTIVE"),
        make("span", "objective-diamond", "◆")),
      make("h1", "gameplay-title", "Establish the Base"),
      make("p", "gameplay-objective-copy", "Reach the highlighted solar array and choose how the crew should respond to the fictional power drop."),
      append(make("div", "gameplay-objective-status"),
        make("span", "objective-status-dot"),
        document.createTextNode(`Day ${event.day} of ${mission.totalDays || 4} · ${ui.interactionTarget ? `Near ${ui.interactionTarget.name}` : "Objective beacon active"}`)));
    objective.querySelector?.(".gameplay-title")?.setAttribute("id", "gameplay-title");

    const task = make("aside", `gameplay-task${ui.interactionOpen ? " is-briefing-task" : ""}`);
    append(task,
      make("div", "gameplay-task-kicker", "CURRENT TASK"),
      make("h2", "gameplay-task-title", event.title),
      make("p", "gameplay-task-copy", ui.gateOpening
        ? `${ui.interactionTarget?.name || "Mission gate"} is opening. Hold position for the cinematic transition.`
        : "Walk to the highlighted solar-array station and inspect it when the prompt appears."),
      append(make("div", "gameplay-task-status"), make("span", "task-status-icon", "!"), make("span", "", "Solar-array beacon active")));

    const showInteractionHint = !ui.interactionOpen && (ui.gateOpening || ui.interactionTarget);
    const hint = showInteractionHint
      ? make("div", `gameplay-interaction-hint${ui.interactionTarget && !ui.interactionTarget.locked ? " is-ready" : ""}`)
      : null;
    if (hint && ui.interactionTarget?.id === "solar-array") hint.setAttribute("aria-label", "E — Inspect Solar Array");
    if (hint && ui.gateOpening) {
      append(hint, make("span", "interaction-key", "…"), make("span", "interaction-copy", "MISSION GATE OPENING"),
        make("small", "interaction-description", "Mechanical locks are releasing. Mission Control will brief you when the door is ready."));
    } else if (hint && ui.interactionTarget?.locked) {
      append(hint, make("span", "interaction-key", "LOCKED"), make("span", "interaction-copy", `${ui.interactionTarget.name} locked`),
        make("small", "interaction-description", ui.interactionTarget.description));
    } else if (hint && ui.interactionTarget) {
      const interactionCopy = ui.interactionTarget.id === "solar-array"
        ? "— Inspect Solar Array"
        : `Interact with ${ui.interactionTarget.name}`;
      append(hint, make("span", "interaction-key", "E"), make("span", "interaction-copy", interactionCopy),
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
      title: "DAY 1 COMPLETE — ESTABLISH THE BASE",
      text: feedback?.explanation || "Your qualitative power plan was recorded by Mission Control.",
      note: feedback ? `${feedback.whyItMatters} ${feedback.futureEffect}` : "Your answer was accepted by Mission Control.",
      tone: "success"
    });
    dialogue.className = "story-dialogue day-one-complete-dialogue story-dialogue-success";

    const outcome = make("section", "story-change-rail day-one-change-rail qualitative-outcome");
    outcome.setAttribute("aria-label", "Day 1 qualitative outcome");
    append(outcome,
      append(make("article", "story-change-card"), make("span", "story-change-label", "PRESERVED"),
        make("strong", "", feedback?.preserved || "DATA UNAVAILABLE")),
      append(make("article", "story-change-card"), make("span", "story-change-label", "REDUCED OR DELAYED"),
        make("strong", "", feedback?.reducedOrDelayed || "DATA UNAVAILABLE")),
      append(make("article", "story-change-card"), make("span", "story-change-label", "RESERVE STATE"),
        make("strong", "", feedback?.reserveState || "DATA UNAVAILABLE")));

    const actions = make("div", "day-one-complete-actions");
    append(actions,
      button("Replay Day 1", "story-primary-action", startMission, ui.loading),
        make("span", "day-one-complete-note", "Days 2–4 are not available in this mission slice. NASA-backed readings remain DATA UNAVAILABLE until the verified package is added."));

    append(shell, renderStoryHud(ui.mission, null, 1), renderMissionRadar(), dialogue, outcome, actions);
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
      speaker: ended ? "MISSION CONTROL" : "CAPTAIN NOVA",
      title: feedback.choiceTitle,
      text: feedback.explanation,
      note: `${feedback.whyItMatters} ${feedback.futureEffect}`,
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
        make("strong", "", feedback.reserveState || "DATA UNAVAILABLE")));
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

  render();
})();
