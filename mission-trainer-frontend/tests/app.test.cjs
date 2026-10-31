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
    choices: choices[day]
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
    activeEffects: [],
    decisionHistory: [],
    systems: systemsFor([]),
    latestDecision: null,
    result: null
  };
}

function decisionResponse(history, terminalStatus = "ACTIVE") {
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
  return {
    status: terminalStatus,
    day: ended ? resolvedDay : resolvedDay + 1,
    totalDays: 4,
    resources,
    resourceDefinitions,
    event: ended ? null : eventFor(resolvedDay + 1),
    activeEffects: ended ? [] : [],
    decisionHistory: history,
    systems: systemsFor(history),
    latestDecision: {
      day: resolvedDay,
      choiceId: selected.id,
      choiceTitle: selected.title,
      headline: `Day ${resolvedDay} decision report`,
      explanation: `Backend explanation for ${selected.id}.`,
      whyItMatters: "Backend reason.",
      futureEffect: "Backend future effect.",
      resourceBreakdown: breakdown
    },
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

function createHarness(fetchHandler) {
  const root = new FakeElement("main");
  const announcer = new FakeElement("div");
  let rootFocusCount = 0;
  root.focus = () => { rootFocusCount += 1; root.focused = true; };
  const document = {
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
  return { root, announcer, get rootFocusCount() { return rootFocusCount; } };
}

function ok(payload) {
  return { ok: true, status: 200, json: async () => payload };
}

async function enterDayOne(harness) {
  await findButton(harness.root, "Start mission").listeners.click();
  assert.match(harness.root.textContent, /Mission briefing/);
  await findButton(harness.root, "Begin Day 1").listeners.click();
  assert.match(harness.root.textContent, /Dust on the solar array/);
}

test("the connected flow uses backend state and can restart after a four-day result", async () => {
  const calls = [];
  const harness = createHarness(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/missions/start")) return ok(startResponse());
    const history = JSON.parse(options.body).decisions;
    return ok(decisionResponse(history, history.length === 4 ? "SUCCEEDED" : "ACTIVE"));
  });

  assert.match(harness.root.textContent, /Your MoonBase/);
  for (let day = 1; day <= 4; day += 1) {
    if (day === 1) await findButton(harness.root, "Start mission").listeners.click();
    if (day === 1) await findButton(harness.root, "Begin Day 1").listeners.click();
    const choiceId = choices[day][0].id;
    const choice = harness.root.querySelector(`[data-choice-id="${choiceId}"]`);
    assert.ok(choice, `Day ${day} choice exists`);
    await choice.listeners.click();
    const selected = harness.root.querySelector(`[data-choice-id="${choiceId}"]`);
    assert.equal(selected.getAttribute("aria-pressed"), "true");
    const focusCountBeforeSubmit = harness.rootFocusCount;
    await findButton(harness.root, "Confirm decision").listeners.click();
    assert.ok(harness.rootFocusCount > focusCountBeforeSubmit,
      `Day ${day} response moves focus to the updated main region`);
    assert.match(harness.announcer.textContent, new RegExp(`Day ${day} complete`));
    if (day < 4) {
      await findButton(harness.root, `Continue to Day ${day + 1}`).listeners.click();
      assert.match(harness.root.textContent, new RegExp(`Mission day ${day + 1} of 4`));
    } else {
      await findButton(harness.root, "See mission results").listeners.click();
      assert.match(harness.root.textContent, /Four days complete!/);
      assert.match(harness.root.textContent, /Server-provided learning takeaway/);
      assert.match(harness.root.textContent, /Power · 1 \/ 12/);
    }
  }

  const decisionCalls = calls.filter((call) => call.url.endsWith("/missions/decisions"));
  assert.equal(decisionCalls.length, 4);
  assert.ok(calls.every((call) => call.url.startsWith("http://localhost:8080/api/v1/")));
  assert.deepEqual(JSON.parse(decisionCalls[3].options.body), {
    decisions: [
      { day: 1, choiceId: "clean_solar_array" },
      { day: 2, choiceId: "service_water_recycler" },
      { day: 3, choiceId: "start_grow_light_tray" },
      { day: 4, choiceId: "full_storm_shelter" }
    ]
  });
  assert.ok(harness.rootFocusCount >= 6, "screen transitions move focus to the main application region");

  await findButton(harness.root, "Start a new mission").listeners.click();
  assert.equal(calls.filter((call) => call.url.endsWith("/missions/start")).length, 2);
  assert.match(harness.root.textContent, /Mission briefing/);
  await findButton(harness.root, "Begin Day 1").listeners.click();
  await harness.root.querySelector('[data-choice-id="clean_solar_array"]').listeners.click();
  await findButton(harness.root, "Confirm decision").listeners.click();
  assert.deepEqual(JSON.parse(calls.filter((call) => call.url.endsWith("/missions/decisions"))[4].options.body), {
    decisions: [{ day: 1, choiceId: "clean_solar_array" }]
  }, "starting over clears the completed mission's in-memory history");
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
  assert.match(harness.root.textContent, /Backend explanation for clean_solar_array/);

  // The next choice fails; the current Day 2 state and retry history must remain intact.
  await findButton(harness.root, "Continue to Day 2").listeners.click();
  await harness.root.querySelector('[data-choice-id="service_water_recycler"]').listeners.click();
  await findButton(harness.root, "Confirm decision").listeners.click();
  assert.match(harness.root.textContent, /could not be reached/);
  assert.match(harness.root.textContent, /The water loop needs care/);
  assert.equal(harness.root.querySelector('[data-choice-id="service_water_recycler"]').getAttribute("aria-pressed"), "true");
  assert.equal(findButton(harness.root, "Confirm decision").disabled, false);
  await findButton(harness.root, "Confirm decision").listeners.click();

  const decisionBodies = calls.filter((call) => call.url.endsWith("/missions/decisions"))
    .map((call) => JSON.parse(call.options.body));
  const expectedHistory = { decisions: [
    { day: 1, choiceId: "clean_solar_array" },
    { day: 2, choiceId: "service_water_recycler" }
  ] };
  assert.deepEqual(decisionBodies[1], expectedHistory);
  assert.deepEqual(decisionBodies[2], expectedHistory, "retry does not append a duplicate decision");
});

test("the optional lunar communication demo is UI-only", async () => {
  const calls = [];
  const harness = createHarness(async (url, options) => {
    calls.push({ url, options });
    return ok(startResponse());
  });

  await findButton(harness.root, "Start mission").listeners.click();
  const callsBeforeDemo = calls.length;
  await findButton(harness.root, "Show communication demo").listeners.click();
  assert.match(harness.root.textContent, /1\.3 seconds/);
  assert.match(harness.root.textContent, /2\.6 seconds/);
  assert.match(harness.root.textContent, /operational communication can take longer/);
  assert.match(harness.root.textContent, /does not .* enter your decision history/);
  assert.equal(calls.length, callsBeforeDemo);
  await findButton(harness.root, "Hide communication demo").listeners.click();
  assert.doesNotMatch(harness.root.textContent, /1\.3 seconds/);
});

test("the CO₂ choice is displayed and submitted with the complete history", async () => {
  const calls = [];
  const harness = createHarness(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/missions/start")) return ok(startResponse());
    return ok(decisionResponse(JSON.parse(options.body).decisions));
  });

  await enterDayOne(harness);
  await harness.root.querySelector('[data-choice-id="clean_solar_array"]').listeners.click();
  await findButton(harness.root, "Confirm decision").listeners.click();
  await findButton(harness.root, "Continue to Day 2").listeners.click();
  assert.ok(harness.root.querySelector('[data-choice-id="inspect_co2_removal_loop"]'));
  await harness.root.querySelector('[data-choice-id="inspect_co2_removal_loop"]').listeners.click();
  await findButton(harness.root, "Confirm decision").listeners.click();

  const decisionBody = JSON.parse(calls.filter((call) => call.url.endsWith("/missions/decisions"))[1].options.body);
  assert.deepEqual(decisionBody, {
    decisions: [
      { day: 1, choiceId: "clean_solar_array" },
      { day: 2, choiceId: "inspect_co2_removal_loop" }
    ]
  });
  await findButton(harness.root, "Continue to Day 3").listeners.click();
  assert.match(harness.root.textContent, /CO₂ removal loop: Serviced/);
  assert.match(harness.root.textContent, /does not generate oxygen/);
});

test("a page reload starts on the welcome screen and the app uses no browser persistence", () => {
  const first = createHarness(async () => ok(startResponse()));
  assert.match(first.root.textContent, /Start mission/);
  const reloaded = createHarness(async () => ok(startResponse()));
  assert.match(reloaded.root.textContent, /Your MoonBase/);
  assert.equal(reloaded.root.querySelector('[data-choice-id="clean_solar_array"]'), null);
  assert.doesNotMatch(appSource, /localStorage|sessionStorage|indexedDB|document\.cookie|URLSearchParams|location\.search|innerHTML/i);
});
