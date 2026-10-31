(() => {
  "use strict";

  const API_BASE = (window.MOONBASE_API_BASE_URL || "http://localhost:8080/api/v1").replace(/\/$/, "");
  const root = document.querySelector("#app");
  const announcer = document.querySelector("#announcer");

  const ui = {
    screen: "welcome",
    mission: null,
    decisionHistory: [],
    selectedChoiceId: null,
    loading: false,
    error: "",
    communicationOpen: false
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

  function setScreen(screen) {
    ui.screen = screen;
    ui.error = "";
    render();
    root.focus({ preventScroll: true });
  }

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: options.method || "GET",
        headers: options.body ? { "Content-Type": "application/json" } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store"
      });
    } catch {
      throw new Error("The mission server could not be reached. Check that the backend is running, then try again.");
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
    ui.loading = true;
    ui.screen = "welcome";
    render();

    try {
      ui.mission = validateMission(await request("/missions/start", { method: "POST" }));
      ui.decisionHistory = [];
      ui.screen = "briefing";
      announce("A fresh mission is ready. Review the supplies, then begin Day 1.");
    } catch (error) {
      ui.error = displayError(error);
      ui.screen = "welcome";
      announce(ui.error);
    } finally {
      ui.loading = false;
      render();
      root.focus({ preventScroll: true });
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
      ui.screen = "feedback";
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
    root.replaceChildren();
    if (ui.error) root.append(make("div", "alert-box", ui.error));

    switch (ui.screen) {
      case "briefing": renderBriefing(); break;
      case "game": renderGame(); break;
      case "feedback": renderFeedback(); break;
      case "result": renderResult(); break;
      default: renderWelcome();
    }
  }

  function renderWelcome() {
    const section = make("section", "welcome-screen");
    section.setAttribute("aria-labelledby", "welcome-title");

    const hero = make("div", "hero");
    const copy = make("div", "hero-copy");
    const kicker = make("div", "eyebrow", "A mission for young explorers");
    const title = make("h1");
    title.id = "welcome-title";
    append(title, document.createTextNode("Your MoonBase. "), make("span", "", "Four days to survive."));
    append(copy, kicker, title,
      make("p", "hero-lede", "The crew needs your help. Make smart choices, protect the base, and learn how real space teams plan for life beyond Earth."),
      make("p", "hero-note", "Four mission days • science-inspired choices • no saved progress"));
    const actions = make("div", "hero-actions");
    const startButton = button(ui.loading ? "Connecting to Mission Control…" : "Start mission", "", startMission, ui.loading);
    if (ui.loading) {
      startButton.replaceChildren(make("span", "loading-label", "Connecting to Mission Control…"));
      startButton.querySelector(".loading-label").prepend(make("span", "spinner"));
    } else {
      startButton.append(make("span", "arrow", "→"));
    }
    append(actions, startButton);
    append(copy, actions);

    const art = make("div", "hero-art");
    const image = make("img");
    image.src = "../assets/moonbase-scene.svg";
    image.alt = "A lunar habitat, rover, and astronaut under a starry sky.";
    image.width = 720;
    image.height = 500;
    const orbitTag = make("div", "orbit-tag");
    append(orbitTag, make("strong", "", "MISSION CONTROL"), document.createTextNode("The crew is counting on you."));
    append(art, image, orbitTag);
    append(hero, copy, art);

    const features = make("div", "feature-strip");
    features.setAttribute("aria-label", "Mission highlights");
    [
      ["01", "Keep four base supplies in balance"],
      ["02", "Choices can help now or later"],
      ["03", "Every mission begins fresh" ]
    ].forEach(([number, text]) => {
      const card = make("div", "feature-card");
      append(card, make("span", "feature-number", number), make("p", "", text));
      features.append(card);
    });
    append(section, hero, features);
    root.append(section);
  }

  function renderBriefing() {
    const mission = ui.mission;
    const section = make("section", "briefing-screen");
    const heading = make("div", "page-heading");
    append(heading, make("div", "section-kicker", "Before launch"),
      make("h1", "", "Mission briefing"),
      make("p", "", "Guide the crew through four mission days. Each round uses game-value supplies, and your earlier repairs can change what happens next."));

    const grid = make("div", "briefing-grid");
    const objective = make("article", "panel briefing-panel");
    append(objective, make("h2", "", "Your objective"),
      make("p", "", "Keep Power, Water, and Food above zero, then finish Day 4 with a ready shelter. Daily needs are used before each decision. Choose a plan that helps today and leaves the crew ready for tomorrow."));
    const controls = make("article", "panel briefing-panel");
    append(controls, make("h2", "", "How to play"),
      make("p", "", "Read the situation and science note. Select one choice, review its trade-off, and confirm it. Mission Control calculates every supply change."));
    const resources = make("ul", "resource-list");
    (mission?.resourceDefinitions || []).forEach((resource) => {
      const item = make("li");
      append(item, make("strong", "", `${resource.label} · ${mission.resources[resource.key]} / ${resource.maximum}`),
        make("span", "", resource.purpose));
      resources.append(item);
    });
    controls.append(resources);
    append(grid, objective, controls, renderCommunicationDemo());

    const bottom = make("div", "briefing-bottom");
    append(bottom, make("p", "", "This is an educational game, not a real engineering simulator or an official NASA product. Refreshing the page starts you at the beginning."),
      button(ui.loading ? "Preparing…" : "Begin Day 1", "", () => setScreen("game"), ui.loading));
    append(section, heading, grid, bottom);
    root.append(section);
  }

  function renderCommunicationDemo() {
    const panel = make("article", "panel communication-demo");
    const heading = make("div", "communication-heading");
    append(heading, make("div", "section-kicker", "Optional science demo"),
      make("h2", "", "How messages travel to Earth"));
    const toggle = button(ui.communicationOpen ? "Hide communication demo" : "Show communication demo",
      "button-secondary", () => {
        ui.communicationOpen = !ui.communicationOpen;
        render();
        root.focus({ preventScroll: true });
      });
    append(panel, heading, make("p", "", "The Moon is close enough for a quick signal, but real mission teams still plan for more than light-travel time."), toggle);

    if (ui.communicationOpen) {
      const facts = make("div", "communication-facts");
      const track = make("div", "communication-track");
      append(track, make("span", "communication-node", "Earth"),
        make("span", "communication-pulse", "⇄"), make("span", "communication-node", "Moon"));
      append(facts, track,
        make("p", "", "One-way light-travel time is about 1.3 seconds."),
        make("p", "", "The minimum light-only round trip is about 2.6 seconds."),
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
      root.append(make("div", "alert-box", "Mission Control did not receive the next day. Start a fresh mission to continue."));
      root.append(button("Start a fresh mission", "", startMission, ui.loading));
      return;
    }

    const topLine = make("div", "game-topline");
    const titleBlock = make("div");
    append(titleBlock, make("div", "day-label", `Mission day ${event.day} of ${mission.totalDays}`),
      make("h1", "", "Base status"));
    const progress = make("div", "day-progress");
    progress.setAttribute("aria-label", `Day ${event.day} of ${mission.totalDays}`);
    for (let day = 1; day <= mission.totalDays; day += 1) {
      const dot = make("span", `day-dot${day <= event.day ? " done" : ""}`);
      dot.setAttribute("aria-hidden", "true");
      progress.append(dot);
    }
    append(topLine, titleBlock, progress);

    const layout = make("div", "mission-layout");
    const mainPanel = make("section", "panel mission-main");
    mainPanel.setAttribute("aria-labelledby", "event-title");
    const badge = make("div", "event-badge");
    append(badge, make("span"), document.createTextNode(`Day ${event.day} event`));
    const eventTitle = make("h2", "event-title", event.title);
    eventTitle.id = "event-title";
    append(mainPanel, badge, eventTitle, make("p", "event-copy", event.situation));

    const science = make("aside", "science-card");
    append(science, make("div", "science-icon", "i"));
    const scienceContent = make("div");
    append(scienceContent, make("h3", "", "Science signal"), make("p", "", event.scienceFact));
    (event.scienceSources || []).forEach((source) => {
      const link = make("a", "", source.title);
      const url = safeHttpsUrl(source.url);
      if (url) {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      const sourceLine = make("p", "science-source");
      append(sourceLine, document.createTextNode("Source: "), link);
      scienceContent.append(sourceLine);
    });
    science.append(scienceContent);
    mainPanel.append(science);

    mainPanel.append(make("h3", "choices-heading", "Choose the crew's plan"));
    const choiceGrid = make("div", "choice-grid");
    choiceGrid.setAttribute("role", "group");
    choiceGrid.setAttribute("aria-label", "Mission choices");
    (event.choices || []).forEach((choice) => {
      const selected = ui.selectedChoiceId === choice.id;
      const card = make("button", "choice-card");
      card.type = "button";
      card.disabled = ui.loading;
      card.setAttribute("aria-pressed", String(selected));
      card.addEventListener("click", () => {
        ui.selectedChoiceId = choice.id;
        ui.error = "";
        render();
        root.querySelector(`[data-choice-id="${CSS.escape(choice.id)}"]`)?.focus({ preventScroll: true });
      });
      card.dataset.choiceId = choice.id;
      const selectLabel = make("span", "choice-select-mark");
      append(selectLabel, make("span"), document.createTextNode(selected ? "Selected" : "Select this plan"));
      append(card, selectLabel, make("span", "choice-title", choice.title),
        make("span", "choice-description", choice.description),
        make("span", "choice-tradeoff", choice.tradeoff));
      choiceGrid.append(card);
    });
    mainPanel.append(choiceGrid);

    const submitRow = make("div", "submit-row");
    append(submitRow, make("span", "submit-hint", ui.selectedChoiceId ? "Ready to send your choice to Mission Control." : "Choose a plan to continue."));
    const submit = button("Confirm decision", "", submitChoice, ui.loading || !ui.selectedChoiceId);
    if (ui.loading) {
      submit.replaceChildren(make("span", "loading-label", "Sending to Mission Control…"));
      submit.querySelector(".loading-label").prepend(make("span", "spinner"));
    } else {
      submit.append(make("span", "arrow", "→"));
    }
    submitRow.append(submit);
    mainPanel.append(submitRow);

    const sideStack = make("aside", "side-stack");
    const effectsPanel = make("section", "panel side-panel");
    const effectsTitle = make("h2");
    append(effectsTitle, make("span", "", "✦"), document.createTextNode("Mission effects"));
    effectsPanel.append(effectsTitle);
    if (mission.activeEffects?.length) {
      const effects = make("ul", "effect-list");
      mission.activeEffects.forEach((effect) => effects.append(make("li", "", effect)));
      effectsPanel.append(effects);
    } else {
      effectsPanel.append(make("p", "empty-effects", "No delayed effects yet. Your choices can change future days."));
    }
    const rule = make("div", "mission-rule");
    append(rule, make("strong", "", "Mission rule"),
      document.createTextNode("Daily needs are applied before your choice. Supplies use a 0–12 game-value scale, and the backend checks each update."));
    append(sideStack, effectsPanel, renderSystems(mission), rule);

    append(layout, mainPanel, sideStack);
    append(root, topLine, renderResources(mission), layout);
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
      root.append(make("div", "alert-box", "Mission Control did not return decision feedback. Your mission state has not advanced."));
      root.append(button("Return to the mission", "button-secondary", () => setScreen("game"), ui.loading));
      return;
    }

    const shell = make("section", "feedback-shell");
    const panel = make("article", "panel feedback-hero");
    const icon = make("div", "feedback-icon", "✓");
    icon.setAttribute("aria-hidden", "true");
    append(panel, icon, make("div", "section-kicker", `Day ${feedback.day} decision report`),
      make("h1", "", feedback.choiceTitle), make("p", "", feedback.explanation),
      make("p", "feedback-reason", feedback.whyItMatters));

    const changes = make("section", "change-grid");
    changes.setAttribute("aria-label", "Server-calculated resource changes");
    const definitions = ui.mission.resourceDefinitions || [];
    definitions.forEach((definition) => {
      const detail = feedback.resourceBreakdown?.[definition.key];
      if (!detail) return;
      const card = make("article", "change-card");
      const heading = make("h2", "", definition.label);
      const net = formatSigned(detail.change);
      append(card, heading, make("strong", "", `${detail.after} / ${definition.maximum}`),
        make("p", "change-net", `${net} this day`),
        make("p", "", `Before ${detail.before} · daily ${formatSigned(detail.daily)} · delayed ${formatSigned(detail.delayed)} · event ${formatSigned(detail.event)} · choice ${formatSigned(detail.choice)}`));
      changes.append(card);
    });

    const future = make("div", "future-note", feedback.futureEffect);
    const actions = make("div", "feedback-actions");
    const ended = ui.mission.status !== "ACTIVE";
    actions.append(button(ended ? "See mission results" : `Continue to Day ${ui.mission.day}`, "", () => {
      if (ended) setScreen("result");
      else setScreen("game");
    }, ui.loading));
    append(shell, panel, changes, future, actions);
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
      root.append(make("div", "alert-box", "Mission Control did not return a final result."));
      root.append(button("Start a fresh mission", "", startMission, ui.loading));
      return;
    }

    const shell = make("section", "result-shell");
    const hero = make("article", `panel result-hero ${result.status === "SUCCEEDED" ? "success" : "failure"}`);
    const icon = make("div", "result-icon", result.status === "SUCCEEDED" ? "★" : "!");
    icon.setAttribute("aria-hidden", "true");
    append(hero, icon, make("div", "section-kicker", result.status === "SUCCEEDED" ? "Mission status · complete" : "Mission status · paused"),
      make("h1", "", result.title), make("p", "", result.summary));
    if (result.limitingResource) hero.append(make("span", "result-limiter", `Needs attention: ${result.limitingResource}`));

    const grid = make("div", "result-grid");
    const supplies = make("article", "panel result-panel");
    supplies.append(make("h2", "", "Final base supplies"));
    const resourceList = make("ul", "resource-list");
    (mission.resourceDefinitions || []).forEach((definition) => {
      const item = make("li");
      append(item, make("strong", "", `${definition.label} · ${mission.resources[definition.key]} / ${definition.maximum}`),
        make("span", "", "Game-value units"));
      resourceList.append(item);
    });
    supplies.append(resourceList);

    const takeaways = make("article", "panel result-panel");
    takeaways.append(make("h2", "", "What the crew learned"));
    const lessons = make("ul", "result-takeaways");
    (result.takeaways || []).forEach((item) => lessons.append(make("li", "", item)));
    takeaways.append(lessons);
    append(grid, supplies, takeaways);

    const logPanel = make("article", "panel result-panel");
    logPanel.append(make("h2", "", "Mission choices"));
    const log = make("ol", "decision-log");
    (result.decisions || []).forEach((decision) => {
      const item = make("li");
      append(item, make("strong", "", `Day ${decision.day}`),
        make("span", "", `${decision.title} — ${decision.lesson}`));
      log.append(item);
    });
    logPanel.append(log);

    const actions = make("div", "result-actions");
    actions.append(button("Start a new mission", "", startMission, ui.loading));
    const opening = button("Back to the welcome screen", "button-secondary", () => {
      ui.mission = null;
      ui.decisionHistory = [];
      ui.selectedChoiceId = null;
      ui.communicationOpen = false;
      setScreen("welcome");
    }, ui.loading);
    actions.append(opening);

    append(shell, hero, renderResources(mission), grid, renderSystems(mission), logPanel, actions);
    root.append(shell);
  }

  render();
})();
