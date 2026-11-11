const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.resolve("mission-trainer-frontend/js/app.js"), "utf8");

const resourceDefinitions = [
  { key: "power", label: "Power", minimum: 0, maximum: 12, unit: "game units", purpose: "Runs the habitat and equipment." },
  { key: "water", label: "Water", minimum: 0, maximum: 12, unit: "game units", purpose: "Keeps the crew supplied." },
  { key: "food", label: "Food", minimum: 0, maximum: 12, unit: "game units", purpose: "Feeds the crew." },
  { key: "shelterReadiness", label: "Shelter readiness", minimum: 0, maximum: 12, unit: "game units", purpose: "Tracks shelter preparation." }
];

const choices = {
  1: [
    { id: "clean_solar_array", title: "Brush the solar array", description: "Spend Power now.", tradeoff: "Add Power later." },
    { id: "connect_spare_battery", title: "Connect the spare battery", description: "Gain Power now.", tradeoff: "No later boost." },
    { id: "prepare_storm_shelter", title: "Prepare the storm shelter", description: "Spend Power now.", tradeoff: "Avoid later shelter wear." }
  ],
  2: [
    { id: "service_water_recycler", title: "Service the recycler", description: "Spend Power and gain Water.", tradeoff: "Save Water later." },
    { id: "use_backup_water_pack", title: "Open a backup water pack", description: "Spend Power for Water.", tradeoff: "No later water savings." },
    { id: "inspect_co2_removal_loop", title: "Service the CO₂ removal loop", description: "Spend Power to clean the air.", tradeoff: "Use less Power later; no Oxygen or Water is created." }
  ],
  3: [
    { id: "start_grow_light_tray", title: "Start the LED grow tray", description: "Spend Power and Water.", tradeoff: "Food arrives later." },
    { id: "open_meal_crate", title: "Open the meal crate", description: "Gain Food now.", tradeoff: "No later harvest." }
  ],
  4: [
    { id: "full_storm_shelter", title: "Power the full shelter setup", description: "Spend Power.", tradeoff: "Gain more readiness." },
    { id: "passive_storm_shelter", title: "Use the low-power shelter", description: "Keep Power.", tradeoff: "Needs earlier preparation." }
  ]
};

const states = [
  null,
  { power: 9, water: 10, food: 8, shelterReadiness: 7 },
  { power: 7, water: 9, food: 6, shelterReadiness: 6 },
  { power: 4, water: 7, food: 4, shelterReadiness: 5 },
  { power: 1, water: 6, food: 6, shelterReadiness: 6 }
];

function eventFor(day) {
  return {
    day,
    title: ["", "Dust on the solar array", "The water loop needs care", "Fresh food for the crew", "A solar storm warning"][day],
    situation: `Situation for Day ${day}.`,
    scienceFact: "A science fact returned by the backend.",
    scienceSources: [{ title: "NASA source", url: "https://science.nasa.gov/" }],
    choices: choices[day],
    hazardType: day === 4 ? "Solar energetic particles" : "Lunar operations",
    hazardLevel: day === 4 ? "HIGH" : day === 1 ? "WATCH" : "NORMAL",
    oneWayCommunicationDelaySeconds: 1.3,
    dataStatus: "CURATED NASA DATA CONTEXT"
  };
}

function systemsFor(history) {
  const shieldingPrepared = history.some((decision) => decision.choiceId === "prepare_storm_shelter");
  const airLoopServiced = history.some((decision) => decision.choiceId === "inspect_co2_removal_loop");
  const shelterChoice = history.find((decision) => decision.choiceId === "full_storm_shelter"
    || decision.choiceId === "passive_storm_shelter");
  const shelterActivated = Boolean(shelterChoice);
  const emergencyProtectionActivated = shelterChoice?.choiceId === "full_storm_shelter" && !shieldingPrepared;
  return {
    airLoopServiced,
    shieldingPrepared,
    shelterActivated,
    shelterMode: shelterChoice ? shelterChoice.choiceId === "full_storm_shelter" ? "FULL" : "PASSIVE" : null,
    emergencyProtectionActivated,
    protectionReady: shelterActivated && (shieldingPrepared || emergencyProtectionActivated)
  };
}

function startResponse() {
  return {
    status: "ACTIVE",
    day: 1,
    totalDays: 4,
    resources: { power: 12, water: 12, food: 10, shelterReadiness: 8 },
    resourceDefinitions,
    event: eventFor(1),
    spaceWeather: {
      signal: "Solar particle watch",
      severity: "ELEVATED",
      sourceTitle: "NASA DONKI",
      sourceUrl: "https://api.nasa.gov/",
      dataNote: "Curated scenario, not a live measurement.",
      oneWayCommunicationDelaySeconds: 1.3
    },
    activeEffects: [],
    decisionHistory: [],
    systems: systemsFor([]),
    latestDecision: null,
    result: null
  };
}

function decisionResponse(history, terminalStatus = "ACTIVE", feedbackOverrides = {}) {
  const resolvedDay = history.length;
  const ended = terminalStatus !== "ACTIVE";
  const resources = states[resolvedDay];
  const breakdown = {};
  for (const [key, before] of Object.entries(resolvedDay === 1
    ? { power: 12, water: 12, food: 10, shelterReadiness: 8 }
    : states[resolvedDay - 1])) {
    const after = resources[key];
    breakdown[key] = { before, daily: 0, delayed: 0, event: 0, choice: after - before, after, change: after - before };
  }
  const selected = choices[resolvedDay].find((choice) => choice.id === history[resolvedDay - 1].choiceId);
  const result = ended ? {
    status: terminalStatus,
    title: terminalStatus === "SUCCEEDED" ? "Four days complete!" : "Mission paused",
    summary: "The backend returned the mission result.",
    limitingResource: null,
    primaryFailureReason: null,
    secondaryFailureReasons: [],
    takeaways: ["Server-provided learning takeaway."],
    decisions: history.map((decision, index) => ({ day: index + 1, title: decision.choiceId, lesson: "Server-provided lesson." }))
  } : null;
  const latestDecision = {
    day: resolvedDay,
    choiceId: selected.id,
    choiceTitle: selected.title,
    headline: `Day ${resolvedDay} decision report`,
    explanation: feedbackOverrides.explanation || `Backend explanation for ${selected.id}.`,
    whyItMatters: "Backend reason.",
    futureEffect: feedbackOverrides.futureEffect || "Backend future effect.",
    resourceBreakdown: { ...breakdown, ...(feedbackOverrides.resourceBreakdown || {}) }
  };
  return {
    status: terminalStatus,
    day: ended ? resolvedDay : resolvedDay + 1,
    totalDays: 4,
    resources,
    resourceDefinitions,
    event: ended ? null : eventFor(resolvedDay + 1),
    spaceWeather: {
      signal: "Solar particle watch",
      severity: "ELEVATED",
      sourceTitle: "NASA DONKI",
      sourceUrl: "https://api.nasa.gov/",
      dataNote: "Curated scenario, not a live measurement.",
      oneWayCommunicationDelaySeconds: 1.3
    },
    activeEffects: ended ? [] : [],
    decisionHistory: history,
    systems: systemsFor(history),
    latestDecision,
    result
  };
}

class FakeElement {
  constructor(tagName, text = "") {
    this.tagName = tagName.toLowerCase();
    this.className = "";
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this.childNodes = [];
    this.disabled = false;
    this._text = text;
    this.focused = false;
  }

  get textContent() {
    return this._text + this.childNodes.map((node) => node.textContent).join("");
  }

  set textContent(value) {
    this._text = String(value);
    this.childNodes = [];
  }

  append(...nodes) {
    for (const node of nodes) this.childNodes.push(typeof node === "string" ? new FakeElement("#text", node) : node);
  }

  prepend(...nodes) {
    for (const node of [...nodes].reverse()) this.childNodes.unshift(typeof node === "string" ? new FakeElement("#text", node) : node);
  }

  replaceChildren(...nodes) {
    this._text = "";
    this.childNodes = [];
    this.append(...nodes);
  }

  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() { this.focused = true; }

  querySelector(selector) {
    if (selector.startsWith(".")) {
      const className = selector.slice(1);
      return walk(this).find((node) => node.className.split(/\s+/).includes(className)) || null;
    }
    const dataMatch = selector.match(/^\[data-choice-id="([^"]+)"\]$/);
    if (dataMatch) return walk(this).find((node) => node.dataset.choiceId === dataMatch[1]) || null;
    return null;
  }
}

function walk(root) {
  const found = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    found.push(node);
    for (let index = node.childNodes.length - 1; index >= 0; index -= 1) stack.push(node.childNodes[index]);
  }
  return found;
}

function findButton(root, label) {
  return walk(root).find((node) => node.tagName === "button" && node.textContent.includes(label)) || null;
}

function createHarness(fetchHandler, { sceneFallback = false } = {}) {
  const root = new FakeElement("main");
  const announcer = new FakeElement("div");
  let rootFocusCount = 0;
  root.focus = () => { rootFocusCount += 1; root.focused = true; };
  const document = {
    documentElement: { dataset: { sceneStatus: sceneFallback ? "fallback" : "loading" } },
    body: { dataset: {} },
    querySelector(selector) { return selector === "#app" ? root : selector === "#announcer" ? announcer : null; },
    createElement(tag) { return new FakeElement(tag); },
    createTextNode(text) { return new FakeElement("#text", String(text)); }
  };
  const window = {
    MOONBASE_API_BASE_URL: "http://localhost:8080/api/v1",
    setTimeout(callback) { callback(); return 1; }
  };
  vm.runInNewContext(appSource, {
    document,
    window,
    URL,
    CSS: { escape: (value) => value },
    fetch: fetchHandler,
    console
  }, { filename: "mission-trainer-frontend/js/app.js" });
  return { root, announcer, window, get rootFocusCount() { return rootFocusCount; } };
}

function ok(payload) {
  return { ok: true, status: 200, json: async () => payload };
}

async function enterDayOne(harness) {
  await findButton(harness.root, "Start mission").listeners.click();
  assert.match(harness.root.textContent, /Dust on the solar array/);
}

test("the Day 1 flow returns directly to the lunar scene and unlocks Day 2 after one answer", async () => {
  const calls = [];
  const harness = createHarness(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/missions/start")) return ok(startResponse());
    const history = JSON.parse(options.body).decisions;
    return ok(decisionResponse(history));
  });

  assert.match(harness.root.textContent, /Start mission/);
  await enterDayOne(harness);
  const choice = harness.root.querySelector('[data-choice-id="clean_solar_array"]');
  assert.ok(choice, "Day 1 solar choice exists");
  await choice.listeners.click();
  assert.equal(harness.root.querySelector('[data-choice-id="clean_solar_array"]').getAttribute("aria-pressed"), "true");
  const focusCountBeforeSubmit = harness.rootFocusCount;
  await findButton(harness.root, "Confirm decision").listeners.click();
  assert.ok(harness.rootFocusCount > focusCountBeforeSubmit);
  assert.match(harness.announcer.textContent, /Day 1 complete/);
  assert.match(harness.root.textContent, /The water loop needs care/);
  assert.doesNotMatch(harness.root.textContent, /Day 2 gate unlocked/);
  assert.doesNotMatch(harness.root.textContent, /ACCESS GRANTED/);

  const decisionCalls = calls.filter((call) => call.url.endsWith("/missions/decisions"));
  assert.equal(decisionCalls.length, 1);
  assert.ok(calls.every((call) => call.url.startsWith("http://localhost:8080/api/v1/")));
  assert.deepEqual(JSON.parse(decisionCalls[0].options.body), {
    decisions: [{ day: 1, choiceId: "clean_solar_array" }]
  });
  assert.ok(harness.rootFocusCount >= 2, "screen transitions move focus to the main application region");

});

test("the gameplay deck surfaces hazard level and communication delay context", async () => {
  const harness = createHarness(async (url) => {
    if (url.endsWith("/missions/start")) return ok(startResponse());
    return ok(decisionResponse([{ day: 1, choiceId: "clean_solar_array" }]));
  });

  await enterDayOne(harness);
  assert.match(harness.root.textContent, /SPACE WEATHER \/\/ DATA CONTEXT/);
  assert.match(harness.root.textContent, /Moon link: 1\.3 s one-way/);
  assert.match(harness.root.textContent, /CURATED NASA DATA CONTEXT/);
});

test("the Day 1 decision opens the next playable mission event", async () => {
  const harness = createHarness(async (url, options) => {
    if (url.endsWith("/missions/start")) return ok(startResponse());
    const history = JSON.parse(options.body).decisions;
    return ok(decisionResponse(history, "ACTIVE", {
      explanation: "The solar array is clean and Power is flowing again.",
      futureEffect: "The Day 2 gate is now ready."
    }));
  });

  await enterDayOne(harness);
  await harness.root.querySelector('[data-choice-id="clean_solar_array"]').listeners.click();
  await findButton(harness.root, "Confirm decision").listeners.click();
  assert.match(harness.root.textContent, /The water loop needs care/);
  assert.match(harness.root.textContent, /W A S D/);
  assert.doesNotMatch(harness.root.textContent, /Day 1 complete — gate unlocked/);
});

test("gate lifecycle shows opening feedback before exposing the existing mission choices", async () => {
  const harness = createHarness(async (url, options) => {
    if (url.endsWith("/missions/start")) return ok(startResponse());
    return ok(decisionResponse(JSON.parse(options.body).decisions));
  });

  await enterDayOne(harness);
  await harness.root.querySelector('[data-choice-id="clean_solar_array"]').listeners.click();
  await findButton(harness.root, "Confirm decision").listeners.click();

  const gate = {
    id: "moonbase-two-entry",
    name: "MoonBase 2 gate",
    description: "Enter MoonBase 2.",
    day: 2
  };
  const handler = harness.window.MOONBASE_SCENE_INTERACTION_HANDLER;
  handler.onGateOpening(gate);
  assert.match(harness.root.textContent, /MISSION GATE OPENING/);
  handler.onGateOpened(gate);
  assert.match(harness.root.textContent, /IN-WORLD TERMINAL/);
  assert.ok(harness.root.querySelector(".is-briefing"));
  assert.ok(harness.root.querySelector(".is-briefing-task"));
  assert.ok(harness.root.querySelector('[data-choice-id="service_water_recycler"]'));
});

test("gameplay controls collapse without changing the documented control set", async () => {
  const harness = createHarness(async (url, options) => {
    if (url.endsWith("/missions/start")) return ok(startResponse());
    return ok(decisionResponse(JSON.parse(options.body).decisions));
  });

  await enterDayOne(harness);
  const toggle = harness.root.querySelector(".controls-toggle");
  assert.ok(toggle, "the controls panel has a collapse toggle");
  toggle.listeners.click();
  assert.ok(harness.root.querySelector(".gameplay-controls").className.includes("is-collapsed"));
  assert.ok(harness.root.querySelector(".controls-collapsed-icon"));
  harness.root.querySelector(".controls-toggle").listeners.click();
  assert.match(harness.root.textContent, /W A S D/);
  assert.match(harness.root.textContent, /SPACE/);
});

test("interaction prompt follows actual proximity and stays hidden outside range", async () => {
  const harness = createHarness(async (url, options) => {
    if (url.endsWith("/missions/start")) return ok(startResponse());
    return ok(decisionResponse(JSON.parse(options.body).decisions));
  });

  await enterDayOne(harness);
  assert.equal(harness.root.querySelector(".gameplay-interaction-hint"), null);
  const handler = harness.window.MOONBASE_SCENE_INTERACTION_HANDLER;
  handler.onProximity({ id: "moonbase-one-entry", name: "MoonBase 1 Airlock", description: "Press E to enter." });
  assert.match(harness.root.textContent, /Interact with MoonBase 1 Airlock/);
  handler.onProximity(null);
  assert.equal(harness.root.querySelector(".gameplay-interaction-hint"), null);
});

test("loading disables choices and an API failure preserves state for retry", async () => {
  const calls = [];
  let decisionAttempt = 0;
  let releaseDecision;
  const harness = createHarness(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/missions/start")) return ok(startResponse());
    decisionAttempt += 1;
    if (decisionAttempt === 1) {
      return new Promise((resolve) => { releaseDecision = resolve; });
    }
    if (decisionAttempt === 2) throw new Error("network offline");
    return ok(decisionResponse(JSON.parse(options.body).decisions));
  });

  await enterDayOne(harness);
  await harness.root.querySelector('[data-choice-id="clean_solar_array"]').listeners.click();
  const submit = findButton(harness.root, "Confirm decision");
  const pending = submit.listeners.click();
  await submit.listeners.click();
  assert.equal(decisionAttempt, 1, "a second click while the request is pending does not submit another decision");
  assert.ok(walk(harness.root).filter((node) => node.tagName === "button").every((node) => node.disabled));
  releaseDecision(ok(decisionResponse([{ day: 1, choiceId: "clean_solar_array" }])));
  await pending;
  assert.match(harness.root.textContent, /The water loop needs care/);
  const decisionBodies = calls.filter((call) => call.url.endsWith("/missions/decisions"))
    .map((call) => JSON.parse(call.options.body));
  assert.deepEqual(decisionBodies[0], { decisions: [{ day: 1, choiceId: "clean_solar_array" }] });
});

test("the welcome screen uses the Day 1 mission deck and Start mission action", async () => {
  const calls = [];
  const harness = createHarness(async (url, options) => {
    calls.push({ url, options });
    return ok(startResponse());
  });

  assert.match(harness.root.textContent, /MISSION OBJECTIVE/);
  assert.match(harness.root.textContent, /Start mission/);
  await findButton(harness.root, "Start mission").listeners.click();
  assert.equal(calls.length, 1);
  assert.match(harness.root.textContent, /W A S D/);
  assert.match(harness.root.textContent, /COMMANDER VEGA/);
});

test("the Day 1 solar choices are displayed and submitted with one decision", async () => {
  const calls = [];
  const harness = createHarness(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/missions/start")) return ok(startResponse());
    return ok(decisionResponse(JSON.parse(options.body).decisions));
  });

  await enterDayOne(harness);
  await harness.root.querySelector('[data-choice-id="clean_solar_array"]').listeners.click();
  await findButton(harness.root, "Confirm decision").listeners.click();

  const decisionBody = JSON.parse(calls.filter((call) => call.url.endsWith("/missions/decisions"))[0].options.body);
  assert.deepEqual(decisionBody, {
    decisions: [{ day: 1, choiceId: "clean_solar_array" }]
  });
  assert.match(harness.root.textContent, /The water loop needs care/);
});

test("WebGL fallback keeps the mission playable through the accessible terminal", async () => {
  const harness = createHarness(async (url, options) => {
    if (url.endsWith("/missions/start")) return ok(startResponse());
    return ok(decisionResponse(JSON.parse(options.body).decisions));
  }, { sceneFallback: true });

  await enterDayOne(harness);
  assert.match(harness.root.textContent, /ACCESSIBLE MISSION TERMINAL/);
  const choice = harness.root.querySelector('[data-choice-id="clean_solar_array"]');
  assert.ok(choice, "fallback terminal exposes the server choices");
  await choice.listeners.click();
  await findButton(harness.root, "Confirm decision").listeners.click();
  assert.match(harness.root.textContent, /The water loop needs care/);
});

test("a page reload starts on the welcome screen and the app uses no browser persistence", () => {
  const first = createHarness(async () => ok(startResponse()));
  assert.match(first.root.textContent, /Start mission/);
  const reloaded = createHarness(async () => ok(startResponse()));
  assert.match(reloaded.root.textContent, /MISSION OBJECTIVE/);
  assert.equal(reloaded.root.querySelector('[data-choice-id="clean_solar_array"]'), null);
  assert.doesNotMatch(appSource, /localStorage|sessionStorage|indexedDB|document\.cookie|URLSearchParams|location\.search|innerHTML/i);
});

test("Day 4 choice submission is gated by the completed emergency procedure", () => {
  assert.match(appSource,
    /if \(Number\(event\.day\) === 4 && !ui\.emergencyProcedureComplete\)\s*\{/,
    "the submit handler must reject a Day 4 decision before the shelter procedure");
  assert.match(appSource,
    /const emergencyProcedurePending = Number\(event\?\.day\) === 4 && !ui\.emergencyProcedureComplete;/,
    "the UI must derive the pending emergency procedure from the Day 4 event state");
  assert.match(appSource,
    /ui\.loading \|\| emergencyProcedurePending/,
    "Day 4 choices must remain disabled until the procedure is complete");
  assert.match(appSource,
    /!ui\.selectedChoiceId \|\| emergencyProcedurePending/,
    "the confirm action must remain disabled until the procedure is complete");
});

test("Day 4 emergency procedure is completed only by inspecting the Storm Shelter", () => {
  assert.match(appSource,
    /expectedTargetId[\s\S]*day === 4 \? "storm-shelter"/,
    "the required Day 4 inspection target must be the Storm Shelter");
  assert.match(appSource,
    /ui\.emergencyProcedureComplete = day === 4;/,
    "the emergency procedure flag must be set by the scene inspection handler");
});
