import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "file:///C:/Users/Abanoub/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const ROOT = "C:/Users/Abanoub/Desktop/junior-astronaut-mission-trainer";
const BUILD = path.join(ROOT, "presentation-build");
const OUT = path.join(ROOT, "presentation-output");
const SCREEN = path.join(ROOT, "presentation-build", "screenshots");
const SKILL = "C:/Users/Abanoub/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations";
const C = {
  navy: "#0B1124",
  surface: "#141E39",
  surface2: "#192544",
  line: "#2B385A",
  white: "#F4F6FB",
  muted: "#AEB9D2",
  gold: "#F4C95D",
  cyan: "#75DCE5",
  purple: "#B7A0F4",
  green: "#82D9AD",
  red: "#FF9B8F",
};
const FONT = "Arial";
const IMAGE_PATHS = [
  path.join(SCREEN, "opening-crop.png"),
  path.join(SCREEN, "moonbase-scene.png"),
  path.join(SCREEN, "day2-recycler-decision-selected.png"),
  path.join(SCREEN, "day2-recycler-feedback-crop.png"),
  path.join(SCREEN, "mission-result-battery-path-crop.png"),
];
const IMAGE_BYTES = new Map();
for (const file of IMAGE_PATHS) IMAGE_BYTES.set(file.replaceAll("\\", "/"), new Uint8Array(await fs.readFile(file)));
const ppt = Presentation.create({ slideSize: { width: 1280, height: 720 } });

function shape(slide, x, y, w, h, fill, opts = {}) {
  return slide.shapes.add({
    geometry: opts.geometry || "rect",
    name: opts.name,
    position: { left: x, top: y, width: w, height: h },
    fill: fill || "none",
    line: opts.line || { style: "solid", fill: "none", width: 0 },
    ...(opts.radius ? { borderRadius: opts.radius } : {}),
  });
}

function text(slide, x, y, w, h, value, size = 20, color = C.white, opts = {}) {
  const box = shape(slide, x, y, w, h, "none", { geometry: "textbox", name: opts.name });
  box.text = value;
  box.text.style = {
    typeface: FONT,
    fontSize: size,
    color,
    bold: Boolean(opts.bold),
    alignment: opts.align || "left",
    verticalAlignment: opts.valign || "top",
    lineSpacing: opts.lineSpacing || 1.0,
    wrap: "square",
    autoFit: "shrinkText",
    insets: opts.insets ?? 0,
    ...(opts.italic ? { italic: true } : {}),
  };
  return box;
}

function panel(slide, x, y, w, h, fill = C.surface, radius = 16) {
  return shape(slide, x, y, w, h, fill, {
    geometry: "roundRect",
    radius,
    line: { style: "solid", fill: C.line, width: 1 },
  });
}

function stripe(slide, x, y, w, color = C.gold, h = 4) {
  shape(slide, x, y, w, h, color);
}

function addImage(slide, file, x, y, w, h, alt, radius = 14) {
  const key = file.replaceAll("\\", "/");
  return slide.images.add({
    blob: IMAGE_BYTES.get(key),
    contentType: "image/png",
    alt,
    fit: "cover",
    position: { left: x, top: y, width: w, height: h },
    geometry: "roundRect",
    borderRadius: radius,
  });
}

function frame(slide, kicker, title, page, subtitle = "") {
  slide.background.fill = C.navy;
  text(slide, 64, 32, 650, 24, kicker.toUpperCase(), 14, C.gold, { bold: true });
  text(slide, 64, 66, 1152, 58, title, 40, C.white, { bold: true, lineSpacing: 0.95 });
  if (subtitle) text(slide, 64, 124, 1136, 30, subtitle, 18, C.muted);
  stripe(slide, 64, 157, 1152, C.line, 1);
  stripe(slide, 64, 678, 1152, C.line, 1);
  text(slide, 64, 687, 800, 18, "RUN 2.0  ·  MOONBASE: 4 DAYS TO SURVIVE", 11, C.muted, { bold: true });
  text(slide, 1150, 685, 66, 20, String(page).padStart(2, "0"), 13, C.gold, { align: "right", bold: true });
}

function setNotes(slide, notes) {
  slide.speakerNotes.text = notes;
}

// 1 — Cover
{
  const slide = ppt.slides.add();
  slide.background.fill = C.navy;
  stripe(slide, 64, 48, 72, C.gold, 5);
  text(slide, 64, 68, 470, 25, "NASA SPACE APPS CHALLENGE 2026", 15, C.gold, { bold: true });
  text(slide, 64, 120, 520, 84, "MoonBase", 64, C.white, { bold: true });
  text(slide, 64, 198, 520, 70, "4 Days to Survive", 48, C.cyan, { bold: true });
  text(slide, 64, 292, 470, 58, "Build a Junior Astronaut\nMission Trainer", 25, C.white, { bold: true });
  text(slide, 64, 380, 452, 62, "An interactive lunar survival game for young explorers ages 8–12.", 21, C.muted, { lineSpacing: 1.05 });
  panel(slide, 64, 494, 286, 58, C.surface, 28);
  text(slide, 84, 511, 246, 23, "TEAM  RUN 2.0", 17, C.gold, { bold: true });
  text(slide, 64, 603, 470, 38, "Independent educational project · not a NASA product", 15, C.muted);
  addImage(slide, path.join(SCREEN, "opening-crop.png"), 596, 108, 620, 477, "Authentic welcome screen from the running MoonBase game", 20);
  text(slide, 596, 603, 620, 28, "THE CHALLENGE  /  JUNIOR ASTRONAUT MISSION TRAINER", 13, C.muted, { bold: true });
  setNotes(slide, "RUN 2.0 presents MoonBase: 4 Days to Survive, an independent educational entry for NASA Space Apps Challenge 2026, Junior Astronaut Mission Trainer. The project is not an official NASA product and is not endorsed or validated by NASA. The screenshot is from the actual local game welcome screen.");
}

// 2 — Team
{
  const slide = ppt.slides.add();
  frame(slide, "01 / The team", "Meet Team RUN 2.0", 2, "Six team members · responsibilities are shown only where project records support them");
  panel(slide, 64, 183, 565, 440, C.surface);
  text(slide, 94, 207, 500, 30, "TEAM MEMBERS", 15, C.cyan, { bold: true });
  const names = ["Reem Mohamed", "Roqia Mahmoud", "Fadwa Mohamed", "Abanoub Wagim", "Kareem Mohamed", "Nour Amin"];
  names.forEach((name, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = 94 + col * 260;
    const y = 264 + row * 92;
    text(slide, x, y, 38, 25, String(i + 1).padStart(2, "0"), 14, C.gold, { bold: true });
    text(slide, x, y + 28, 244, 42, name, 24, C.white, { bold: true });
  });
  panel(slide, 665, 183, 551, 440, C.surface2);
  text(slide, 697, 207, 465, 29, "VERIFIED PROJECT OUTPUTS", 15, C.cyan, { bold: true });
  text(slide, 697, 254, 477, 175,
    "• Browser game: HTML, CSS, JavaScript\n• Rules API: Java and Spring Boot\n• Game rules, science references, and judges' technical briefing\n• Automated test suites and recorded browser walkthrough",
    20, C.white, { lineSpacing: 1.13 });
  stripe(slide, 697, 449, 477, C.line, 1);
  text(slide, 697, 470, 477, 104,
    "The project files do not assign individual responsibilities. We list the team together rather than inventing role labels.",
    18, C.muted, { lineSpacing: 1.1 });
  setNotes(slide, "The original project presentation supplies the six names shown. The repository verifies the shared project artifacts: a static HTML/CSS/JavaScript game frontend, a Java/Spring Boot API and rules engine, game/science documentation, automated tests, and a recorded browser walkthrough. No source record maps individual members to specific responsibilities; the deck does not infer individual roles.");
}

// 3 — Design challenge
{
  const slide = ppt.slides.add();
  frame(slide, "02 / The design challenge", "Make connected systems visible", 3, "A design question—not a claim that learning outcomes have already been measured");
  text(slide, 92, 194, 1096, 92, "How can an 8–12-year-old see that power, water, food and shelter depend on one another?", 37, C.white, { bold: true, align: "center", valign: "middle", lineSpacing: 1.0 });
  const nodes = [
    { x: 92, label: "POWER", color: C.cyan, small: "runs habitat\nand equipment" },
    { x: 384, label: "WATER", color: C.purple, small: "crew supply\n& recycling" },
    { x: 676, label: "FOOD", color: C.green, small: "daily use\n& grow tray" },
    { x: 968, label: "SHELTER", color: C.gold, small: "readiness for\nfinal alert" },
  ];
  nodes.forEach((n, i) => {
    panel(slide, n.x, 372, 220, 142, C.surface);
    shape(slide, n.x + 24, 394, 14, 14, n.color, { geometry: "ellipse" });
    text(slide, n.x + 52, 390, 144, 24, n.label, 15, n.color, { bold: true });
    text(slide, n.x + 24, 430, 174, 52, n.small, 20, C.white, { bold: true });
    if (i < nodes.length - 1) {
      text(slide, n.x + 222, 425, 70, 40, "↔", 28, C.gold, { align: "center", bold: true });
    }
  });
  panel(slide, 244, 548, 792, 64, C.surface2, 14);
  text(slide, 270, 566, 740, 30, "Every choice changes the same mission ledger; some effects arrive later.", 20, C.cyan, { bold: true, align: "center" });
  setNotes(slide, "The project addresses a design question: whether a short interactive mission can make linked resource trade-offs concrete for children ages 8–12. The deck presents this as an intended design goal only. No child user study or learning-outcome measurement is documented.");
}

// 4 — Solution
{
  const slide = ppt.slides.add();
  frame(slide, "03 / Our solution", "A four-round mission for ages 8–12", 4, "Science-inspired choices with an explicit boundary between NASA evidence and game rules");
  addImage(slide, path.join(SCREEN, "moonbase-scene.png"), 64, 187, 525, 378, "MoonBase project illustration: habitat, solar array, rover and astronaut", 18);
  text(slide, 64, 577, 525, 25, "ORIGINAL ART FROM THE PROJECT", 13, C.muted, { bold: true });
  const items = [
    ["01", "Read the event", "Each day introduces a new mission-planning situation."],
    ["02", "Choose one plan", "Compare an immediate cost with a possible later benefit."],
    ["03", "See the ledger", "Mission Control returns a server-calculated change for every resource."],
    ["04", "Connect to NASA", "Short science signals link each theme to a NASA source."],
  ];
  items.forEach((item, i) => {
    const y = 190 + i * 102;
    shape(slide, 629, y + 2, 40, 40, C.surface2, { geometry: "ellipse", line: { style: "solid", fill: C.line, width: 1 } });
    text(slide, 629, y + 11, 40, 22, item[0], 13, C.gold, { bold: true, align: "center" });
    text(slide, 690, y, 480, 29, item[1], 22, C.white, { bold: true });
    text(slide, 690, y + 34, 490, 58, item[2], 17, C.muted, { lineSpacing: 1.02 });
  });
  setNotes(slide, "MoonBase is a browser-based, four-planning-round educational game. The frontend displays backend-provided event choices and resource outcomes. It is an independent project; NASA source links inform themes and do not imply NASA endorsement or validation.");
}

// 5 — Gameplay loop
{
  const slide = ppt.slides.add();
  frame(slide, "04 / How the game works", "One loop, repeated across four days", 5, "Each in-game day is a planning round, not a real Earth day or lunar daylight cycle");
  const steps = [
    { n: "01", title: "Challenge", body: "Read the event and science signal.", color: C.cyan },
    { n: "02", title: "Decision", body: "Choose one available crew plan.", color: C.gold },
    { n: "03", title: "Recalculate", body: "Backend replays the full choice history.", color: C.purple },
    { n: "04", title: "Feedback", body: "Review daily, delayed, event and choice effects.", color: C.green },
  ];
  steps.forEach((s, i) => {
    const x = 64 + i * 292;
    panel(slide, x, 228, 262, 276, C.surface);
    shape(slide, x + 23, 252, 54, 54, s.color, { geometry: "ellipse" });
    text(slide, x + 23, 270, 54, 24, s.n, 16, C.navy, { bold: true, align: "center" });
    text(slide, x + 24, 338, 218, 32, s.title, 24, C.white, { bold: true });
    text(slide, x + 24, 382, 218, 80, s.body, 19, C.muted, { lineSpacing: 1.05 });
    if (i < 3) text(slide, x + 261, 333, 31, 43, "→", 26, C.gold, { align: "center", bold: true });
  });
  panel(slide, 184, 548, 912, 63, C.surface2, 14);
  text(slide, 210, 565, 860, 30, "If any resource reaches 0, the run ends; after Day 4, Shelter readiness must be at least 6.", 19, C.white, { align: "center", bold: true });
  setNotes(slide, "The backend is the single rules engine. For each submitted ordered history it recomputes from the canonical Day 1 values, validates choices, applies the deterministic rules, clamps each integer resource to 0–12, and returns the event or result plus a breakdown. A zero Power, Water, or Food ends the mission on that day. Success after Day 4 requires Power, Water, and Food above zero and Shelter readiness at least 6. There is no random event, score, rescue, extra day, database, or saved progress.");
}

// 6 — Resource system
{
  const slide = ppt.slides.add();
  frame(slide, "05 / Resource management", "Four game meters · one shared budget", 6, "All quantities are integer game values on a 0–12 scale, not engineering units");
  panel(slide, 64, 185, 650, 438, C.surface);
  text(slide, 94, 207, 580, 25, "STARTING SUPPLIES", 15, C.cyan, { bold: true });
  const bars = [
    ["Power", 12, C.cyan], ["Water", 12, C.purple], ["Food", 10, C.green], ["Shelter readiness", 8, C.gold],
  ];
  bars.forEach((b, i) => {
    const y = 265 + i * 82;
    text(slide, 94, y, 190, 25, b[0], 19, C.white, { bold: true });
    text(slide, 620, y, 58, 25, String(b[1]) + " / 12", 17, b[2], { bold: true, align: "right" });
    panel(slide, 94, y + 37, 584, 15, C.navy, 8);
    shape(slide, 94, y + 37, 584 * b[1] / 12, 15, b[2], { geometry: "roundRect", radius: 8 });
  });
  panel(slide, 746, 185, 470, 438, C.surface2);
  text(slide, 776, 207, 408, 25, "WHAT CHANGES EACH ROUND", 15, C.cyan, { bold: true });
  text(slide, 776, 253, 410, 78, "Daily use:  Power −2 · Water −2\nFood −2 · Shelter readiness −1", 18, C.white, { lineSpacing: 1.06 });
  stripe(slide, 776, 348, 408, C.line, 1);
  text(slide, 776, 367, 408, 30, "Some choices pay back later", 20, C.gold, { bold: true });
  text(slide, 776, 407, 408, 126, "Array plan → Power on Days 2–4\nRecycler service → Water on Days 3–4\nGrow tray → Food on Day 4\nShelter prep → no readiness wear Days 2–4", 17, C.white, { lineSpacing: 1.1 });
  panel(slide, 776, 551, 408, 47, C.navy, 12);
  text(slide, 794, 563, 375, 26, "Before + Daily + Scheduled + Event + Choice → clamp 0–12", 14, C.muted, { bold: true, align: "center" });
  setNotes(slide, "Canonical initial values are Power 12, Water 12, Food 10, and Shelter readiness 8. Every resource is an integer from 0 to 12. Daily needs subtract 2 Power, 2 Water, and 2 Food; shelter readiness loses 1 except when Day 1 shelter preparation prevents wear on Days 2–4. Delayed effects: array cleaning adds Power +1 on Days 2–4; recycler service returns Water +1 on Days 3–4; grow tray adds Food +3 on Day 4. For every resource and day: After = clamp(Before + Daily + Scheduled + Event + Choice, 0, 12). These are game-only balance values, not NASA specifications.");
}

// 7 — Four days
{
  const slide = ppt.slides.add();
  frame(slide, "06 / Mission progression", "Four days · four planning challenges", 7, "Event names and choice effects below match the running game");
  const days = [
    { n: "DAY 1", title: "Dust on the solar array", color: C.cyan, text: "Clean array: −1 Power now; +1 on Days 2–4.\n\nSpare battery: +1 Power now.\n\nPrepare shelter: −1 Power, +2 readiness; removes readiness wear Days 2–4." },
    { n: "DAY 2", title: "The water loop needs care", color: C.purple, text: "Service recycler: −1 Power, +1 Water now; +1 Water on Days 3–4.\n\nBackup pack: −3 Power, +5 Water now (capped at 12)." },
    { n: "DAY 3", title: "Fresh food for the crew", color: C.green, text: "Start LED grow tray: −2 Power, −1 Water; +3 Food on Day 4.\n\nOpen meal crate: +3 Food now; no later harvest." },
    { n: "DAY 4", title: "A solar storm warning", color: C.gold, text: "Solar-particle alert: −2 Shelter readiness.\n\nFull setup: −1 Power, +4 readiness.\n\nLow-power plan: no Power cost, +2 readiness; relies on earlier preparation." },
  ];
  days.forEach((d, i) => {
    const x = 64 + i * 292;
    panel(slide, x, 183, 268, 441, C.surface);
    stripe(slide, x + 22, 206, 54, d.color, 4);
    text(slide, x + 22, 223, 220, 24, d.n, 14, d.color, { bold: true });
    text(slide, x + 22, 257, 220, 62, d.title, 22, C.white, { bold: true, lineSpacing: 0.97 });
    stripe(slide, x + 22, 333, 222, C.line, 1);
    text(slide, x + 22, 352, 224, 246, d.text, 16, C.muted, { lineSpacing: 1.02 });
  });
  setNotes(slide, "The event text and selectable effects are taken from the actual rules service and live game. A Day is a planning round, not one Earth day or lunar daylight cycle. On Day 4 the implemented event is named 'A solar storm warning' and its narrative identifies a solar-particle alert. The app does not model atmospheric weather or an Earth-style lunar dust storm. All costs, bonuses, timing and thresholds are game-only values. NASA science caveats are on Slide 8. Sources: NASA NTRS lunar dust report https://ntrs.nasa.gov/citations/20240003496 ; NASA ISS water recovery https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/ ; NASA Advanced Plant Habitat https://science.nasa.gov/mission/advanced-plant-habitat/ ; NASA Orion shelter article https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/.");
}

// 8 — Science boundaries
{
  const slide = ppt.slides.add();
  frame(slide, "07 / Science behind the game", "NASA evidence inspires themes; game values stay fictional", 8, "Qualitative science cues are sourced; the simulation is not an engineering model");
  const rows = [
    ["[1] DUST & POWER", "NASA documents lunar dust adhesion and array risks. The game's 'clean array' benefit is invented; NASA warns manual brushing can worsen damage."],
    ["[2] WATER RECOVERY", "The ISS demonstrated a 98% recovery goal. MoonBase's Water points do not use that percentage and are not a lunar system."],
    ["[3] PLANT GROWTH", "NASA's Advanced Plant Habitat uses LEDs and controlled water/nutrients. A one-turn game harvest compresses real growth time."],
    ["[4–5] LIFE SUPPORT & SHELTER", "NASA ECLSS manages pressure, oxygen, air and water; MoonBase has no oxygen or pressure meter. NASA's Orion supplies shelter is a concept; readiness points are not a dose or shielding estimate."],
    ["[6] LUNAR ENVIRONMENT", "The Moon has a thin exosphere; lunar 'weather' comes from space. Day 4 is a particle alert, not an atmospheric dust storm."],
  ];
  rows.forEach((r, i) => {
    const y = 181 + i * 82;
    panel(slide, 64, y, 790, 72, C.surface, 12);
    text(slide, 84, y + 11, 192, 24, r[0], 13, i === 0 ? C.gold : C.cyan, { bold: true });
    text(slide, 272, y + 9, 558, 56, r[1], 15, C.white, { lineSpacing: 0.96 });
  });
  panel(slide, 882, 181, 334, 400, C.surface2, 18);
  text(slide, 910, 208, 278, 25, "MODEL BOUNDARY", 14, C.gold, { bold: true });
  text(slide, 910, 252, 276, 184, "No real engineering units.\n\nNo lunar habitat design.\n\nNo radiation dose, shielding thickness, crop yield, or recovery efficiency calculation.", 19, C.white, { lineSpacing: 1.05 });
  stripe(slide, 910, 458, 278, C.line, 1);
  text(slide, 910, 478, 278, 79, "NASA sources support the science themes; they do not endorse or validate MoonBase.", 16, C.muted, { lineSpacing: 1.0 });
  setNotes(slide, "Scientific claims and their sources: [1] NASA/TM-20240003496, Lunar Dust Considerations for Vertical Solar Arrays Vol. 1, published 1 Oct 2024, https://ntrs.nasa.gov/citations/20240003496. The report describes dust adhesion/abrasion and risks to exposed array surfaces; its PDF warns that manual brushing can damage arrays and is not recommended. The game's clean-array action is a fictional choice and should not be treated as a real cleaning recommendation. [2] NASA, NASA Achieves Water Recovery Milestone on International Space Station, 20 Jun 2023, https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/. The 98% goal was demonstrated by ISS ECLSS; no game Water value represents 98% recovery. [3] NASA Science, Advanced Plant Habitat, https://science.nasa.gov/mission/advanced-plant-habitat/. The ISS facility uses LED lights and controlled delivery of water/nutrients; Day 4 harvest is compressed game time. [4] NASA, Environmental Control and Life Support Systems, https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/. ECLSS controls pressure, oxygen, ventilation, waste and water; MoonBase tracks no oxygen or pressure. [5] NASA Science, How NASA Will Protect Astronauts From Space Radiation at the Moon, 7 Aug 2019, https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/. NASA describes a representative Orion temporary shelter using onboard supplies during an SEP event; this is not a lunar base design. Game Shelter readiness 0–12 is abstract, not dose or shielding. [6] NASA Science, Weather on the Moon, https://science.nasa.gov/moon/weather-on-the-moon/. NASA explains the Moon's exosphere is too thin for Earth-like weather; lunar weather comes from space. The game uses a solar-particle alert and does not model an atmospheric dust storm. No NASA endorsement or validation is claimed.");
}

// 9 — Real decision screen
{
  const slide = ppt.slides.add();
  frame(slide, "08 / Live gameplay", "A real Day 2 choice in the running game", 9, "The selected path trades power now for water now and later");
  addImage(slide, path.join(SCREEN, "day2-recycler-decision-selected.png"), 64, 174, 654, 498, "Actual Day 2 screen with Service the recycler selected", 14);
  panel(slide, 748, 174, 468, 498, C.surface);
  text(slide, 780, 202, 400, 25, "MISSION STATE BEFORE THE CHOICE", 14, C.cyan, { bold: true });
  text(slide, 780, 242, 400, 70, "Power 11 · Water 10\nFood 8 · Shelter readiness 7", 22, C.white, { bold: true, lineSpacing: 1.08 });
  stripe(slide, 780, 331, 400, C.line, 1);
  text(slide, 780, 352, 400, 26, "SERVICE THE RECYCLER", 16, C.gold, { bold: true });
  text(slide, 780, 388, 400, 77, "Spend 1 Power, gain 1 Water now, then use 1 less Water on Days 3 and 4.", 20, C.white, { lineSpacing: 1.04 });
  stripe(slide, 780, 480, 400, C.line, 1);
  text(slide, 780, 501, 400, 26, "ALTERNATIVE", 14, C.muted, { bold: true });
  text(slide, 780, 535, 400, 94, "Backup pack: spend 3 Power for 5 Water now (capped at 12), with no later reduction in Water use.", 17, C.muted, { lineSpacing: 1.03 });
  setNotes(slide, "Screenshot captured from the actual running game on 27 Oct 2026. The Day 2 state followed Day 1's Connect the spare battery choice: Power 11, Water 10, Food 8, Shelter readiness 7. The service choice spends 1 Power and gains 1 Water immediately, then reduces Water use by one game unit on Days 3 and 4. Alternative backup pack costs 3 Power and adds 5 Water up to the 12 maximum, with no later water-use reduction. The in-game science signal references NASA's ISS water recovery milestone: https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/. Its 98% figure is explicitly not applied to game values.");
}

// 10 — Consequence screen
{
  const slide = ppt.slides.add();
  frame(slide, "09 / Decision feedback", "Mission Control shows the cost and payoff", 10, "The game returns a breakdown instead of hiding the resource arithmetic");
  addImage(slide, path.join(SCREEN, "day2-recycler-feedback-crop.png"), 64, 174, 606, 483, "Actual Day 2 decision report with server-calculated resource changes", 14);
  panel(slide, 700, 174, 516, 483, C.surface2);
  text(slide, 730, 202, 456, 25, "SERVER-CALCULATED RESULT", 14, C.cyan, { bold: true });
  const changes = [
    ["Power", "11 → 8", "−2 daily · −1 choice", C.cyan],
    ["Water", "10 → 9", "−2 daily · +1 choice", C.purple],
    ["Food", "8 → 6", "−2 daily", C.green],
    ["Shelter readiness", "7 → 6", "−1 daily", C.gold],
  ];
  changes.forEach((c, i) => {
    const y = 244 + i * 70;
    text(slide, 730, y, 200, 22, c[0], 16, c[3], { bold: true });
    text(slide, 955, y - 1, 224, 25, c[1], 19, C.white, { bold: true, align: "right" });
    text(slide, 730, y + 27, 450, 22, c[2], 14, C.muted, { align: "right" });
  });
  stripe(slide, 730, 525, 456, C.line, 1);
  text(slide, 730, 546, 456, 72, "Carry-over: Water use is 1 lower on Days 3–4. All values remain game units.", 18, C.gold, { bold: true, lineSpacing: 1.03 });
  setNotes(slide, "Authentic Day 2 feedback screenshot captured in the live local browser. The exact returned result was Power 8/12 (Before 11; daily −2; choice −1), Water 9/12 (Before 10; daily −2; choice +1), Food 6/12 (Before 8; daily −2), Shelter readiness 6/12 (Before 7; daily −1). The server also scheduled Water use one game unit lower on Days 3 and 4. This example is from the actual battery → recycler route, not the separate documented worked route that cleans the array.");
}

// 11 — Mission outcome
{
  const slide = ppt.slides.add();
  frame(slide, "10 / Mission outcome", "A complete four-day run, captured from the game", 11, "This is the route demonstrated in the screenshots");
  addImage(slide, path.join(SCREEN, "mission-result-battery-path-crop.png"), 64, 176, 760, 500, "Actual successful mission result screen and final supply indicators", 14);
  panel(slide, 870, 176, 346, 500, C.surface);
  text(slide, 900, 204, 286, 26, "DEMONSTRATED CHOICES", 14, C.cyan, { bold: true });
  const route = ["Day 1 · Connect spare battery", "Day 2 · Service recycler", "Day 3 · Start LED grow tray", "Day 4 · Full shelter setup"];
  route.forEach((r, i) => {
    const y = 250 + i * 54;
    text(slide, 900, y, 285, 34, r, 16, C.white, { bold: i === 3 });
    if (i < 3) stripe(slide, 900, y + 38, 280, C.line, 1);
  });
  panel(slide, 900, 487, 286, 108, C.surface2, 12);
  text(slide, 919, 503, 250, 22, "FINAL GAME VALUES", 13, C.gold, { bold: true });
  text(slide, 919, 537, 250, 46, "Power 1 · Water 6\nFood 5 · Readiness 6", 18, C.white, { bold: true, lineSpacing: 1.02 });
  text(slide, 900, 616, 286, 36, "A successful run; not a real survival forecast.", 14, C.muted);
  setNotes(slide, "Actual final result captured in local browser after the sequence Connect the spare battery → Service the recycler → Start the LED grow tray → Power the full shelter setup. The live game declared mission complete and returned (Power 1, Water 6, Food 5, Shelter readiness 6), all game-value units. This path differs from the canonical worked path in docs/GAME_RULES.md (which begins with clean_solar_array and ends at (2,6,5,6)); both satisfy the implemented success criteria. No real lunar-survival or engineering performance is implied.");
}

// 12 — Learning objectives
{
  const slide = ppt.slides.add();
  frame(slide, "11 / Learning design", "What players are invited to practice", 12, "Intended learning objectives · no child study or outcome measurement is documented");
  const objectives = [
    ["01", "Track connected supplies", "Notice that energy, water, food and shelter readiness share one mission budget.", C.cyan],
    ["02", "Compare now with later", "Weigh an immediate cost against a scheduled benefit on a future round.", C.gold],
    ["03", "Read the evidence", "Use the feedback breakdown to explain how a choice changed the state.", C.purple],
    ["04", "Separate fact from model", "Recognize NASA science themes while questioning simplified game values.", C.green],
  ];
  objectives.forEach((o, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 64 + col * 584;
    const y = 196 + row * 207;
    panel(slide, x, y, 552, 174, C.surface);
    shape(slide, x + 24, y + 26, 46, 46, o[3], { geometry: "ellipse" });
    text(slide, x + 24, y + 38, 46, 20, o[0], 14, C.navy, { bold: true, align: "center" });
    text(slide, x + 92, y + 27, 424, 30, o[1], 22, C.white, { bold: true });
    text(slide, x + 92, y + 70, 424, 80, o[2], 18, C.muted, { lineSpacing: 1.03 });
  });
  panel(slide, 294, 613, 692, 40, C.surface2, 12);
  text(slide, 318, 622, 644, 22, "These are goals for play, not measured learning gains.", 15, C.gold, { bold: true, align: "center" });
  setNotes(slide, "Learning objectives are inferred from the implemented choices, resource descriptions, feedback, and end-of-mission learning takeaways. They are intended outcomes, not measured results. No child user study or formal learning assessment is documented.");
}

// 13 — Technology and evidence
{
  const slide = ppt.slides.add();
  frame(slide, "12 / Implementation & checks", "A small, stateless rules service powers the game", 13, "Technology and test evidence confirmed in project files");
  panel(slide, 64, 184, 714, 252, C.surface);
  text(slide, 92, 204, 650, 24, "IMPLEMENTATION", 14, C.cyan, { bold: true });
  const blocks = [
    ["FRONTEND", "HTML · CSS\nVanilla JavaScript", C.cyan],
    ["API", "JSON requests\nFull choice history", C.gold],
    ["RULES ENGINE", "Java 17\nSpring Boot 4.1.2", C.purple],
  ];
  blocks.forEach((b, i) => {
    const x = 92 + i * 222;
    panel(slide, x, 251, 196, 126, C.surface2, 12);
    text(slide, x + 16, 268, 164, 21, b[0], 12, b[2], { bold: true });
    text(slide, x + 16, 301, 164, 59, b[1], 17, C.white, { bold: true, lineSpacing: 1.02 });
    if (i < 2) text(slide, x + 194, 291, 28, 32, "→", 23, C.gold, { align: "center", bold: true });
  });
  text(slide, 92, 395, 652, 26, "Backend owns decisions and totals; no database, account, or saved progress.", 16, C.muted, { bold: true });
  panel(slide, 810, 184, 406, 252, C.surface2);
  text(slide, 838, 204, 350, 24, "EVIDENCE ON RECORD", 14, C.gold, { bold: true });
  text(slide, 838, 247, 345, 102, "Backend: 9 tests passed\nFrontend: 3 tests passed\nRecorded local browser walkthrough", 18, C.white, { bold: true, lineSpacing: 1.08 });
  text(slide, 838, 365, 345, 33, "Reported in project docs; not rerun for this deck.", 14, C.muted, { lineSpacing: 1.0 });
  panel(slide, 64, 460, 1152, 177, C.surface);
  text(slide, 92, 481, 1080, 24, "VALIDATION BOUNDARIES", 14, C.cyan, { bold: true });
  text(slide, 92, 522, 520, 80, "This presentation task: local app health check, complete live winning route, and authentic screenshots.\nLocal demo only; no public deployment URL is documented.", 17, C.white, { lineSpacing: 1.04 });
  text(slide, 650, 522, 522, 80, "Not documented: child study, NASA validation, public deployment, or performance measurements.\nThe game is an educational model, not an engineering simulator.", 17, C.muted, { lineSpacing: 1.04 });
  setNotes(slide, "README and source confirm a plain static HTML/CSS/vanilla JavaScript frontend and a Java 17 Spring Boot 4.1.2 backend. The backend replays the complete ordered history and owns resource calculations and outcomes. No database/accounts/saved mission progress are used. docs/JUDGES_BRIEFING.md records backend 9 tests passed, frontend 3 tests passed, and a browser walkthrough/responsive checks. These tests were not rerun for this deck. During this presentation task the local health route returned UP and a full successful route was completed in the local browser; that live verification used a different successful route than the docs' clean-array path. No child study, NASA endorsement/validation, public deployment URL, production-origin CORS test or performance measurement is documented. Local app only, URL http://127.0.0.1:5500/html/ is not public.");
}

// 14 — References
{
  const slide = ppt.slides.add();
  frame(slide, "13 / Sources", "NASA references used in this presentation", 14, "Select a title in PowerPoint to open the official source");
  const refs = [
    ["[1] Lunar Dust Considerations for Vertical Solar Arrays · Vol. 1", "NASA Technical Reports Server · 2024 · dust, adhesion, array risks", "https://ntrs.nasa.gov/citations/20240003496"],
    ["[2] NASA Achieves Water Recovery Milestone on the ISS", "NASA · 20 Jun 2023 · ISS ECLSS water recovery", "https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/"],
    ["[3] Advanced Plant Habitat", "NASA Science · LEDs and controlled plant research", "https://science.nasa.gov/mission/advanced-plant-habitat/"],
    ["[4] Environmental Control and Life Support Systems", "NASA · atmospheric pressure, oxygen, air, water and waste", "https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/"],
    ["[5] How NASA Will Protect Astronauts From Space Radiation at the Moon", "NASA Science · Orion shelter concept and solar-particle events · 2019", "https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/"],
    ["[6] Weather on the Moon", "NASA Science · the exosphere and weather from space", "https://science.nasa.gov/moon/weather-on-the-moon/"],
  ];
  refs.forEach((r, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = 64 + col * 584;
    const y = 186 + row * 151;
    panel(slide, x, y, 552, 128, C.surface);
    const title = text(slide, x + 22, y + 20, 508, 47, r[0], 17, C.cyan, { bold: true, lineSpacing: 1.0 });
    title.text.get(r[0]).link = { uri: r[2], isExternal: true };
    text(slide, x + 22, y + 77, 508, 39, r[1], 14, C.muted, { lineSpacing: 1.0 });
  });
  text(slide, 64, 650, 1152, 19, "Sources checked 27 October 2026 · NASA sources support themes only; game values are invented balancing rules.", 13, C.gold, { bold: true });
  setNotes(slide, "1. NASA/TM-20240003496, Lunar Dust Considerations for Vertical Solar Arrays Volume 1: Lunar Environment and Dust Interactions (1 Oct 2024): https://ntrs.nasa.gov/citations/20240003496\n2. NASA, NASA Achieves Water Recovery Milestone on International Space Station (20 Jun 2023): https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/\n3. NASA Science, Advanced Plant Habitat: https://science.nasa.gov/mission/advanced-plant-habitat/\n4. NASA, Environmental Control and Life Support Systems (ECLSS): https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/\n5. NASA Science Editorial Team, How NASA Will Protect Astronauts From Space Radiation at the Moon (7 Aug 2019): https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/\n6. NASA Science, Weather on the Moon: https://science.nasa.gov/moon/weather-on-the-moon/\nAll sources are official NASA websites or NASA NTRS. They are science references for an independent game and do not constitute endorsement or validation.");
}

// 15 — Close
{
  const slide = ppt.slides.add();
  slide.background.fill = C.navy;
  stripe(slide, 64, 64, 72, C.gold, 5);
  text(slide, 64, 96, 600, 28, "RUN 2.0  ·  NASA SPACE APPS CHALLENGE 2026", 15, C.gold, { bold: true });
  text(slide, 64, 172, 640, 76, "Survival is a\nsystems problem.", 48, C.white, { bold: true, lineSpacing: 0.96 });
  text(slide, 64, 354, 640, 45, "What would your crew choose?", 29, C.cyan, { bold: true });
  text(slide, 64, 425, 530, 64, "MoonBase: 4 Days to Survive\nJunior Astronaut Mission Trainer", 21, C.muted, { lineSpacing: 1.04 });
  panel(slide, 64, 541, 462, 62, C.surface, 28);
  text(slide, 84, 559, 422, 23, "LOCAL DEMO ONLY · NO PUBLIC URL DOCUMENTED", 14, C.gold, { bold: true, align: "center" });
  addImage(slide, path.join(SCREEN, "mission-result-battery-path-crop.png"), 755, 187, 461, 295, "Actual successful mission result from the MoonBase game", 16);
  text(slide, 755, 511, 461, 50, "Four decisions. Visible consequences.\nScience-inspired, clearly simplified.", 18, C.white, { bold: true, align: "center", lineSpacing: 1.04 });
  text(slide, 755, 620, 461, 24, "INDEPENDENT EDUCATIONAL PROJECT · NOT NASA-ENDORSED", 12, C.muted, { bold: true, align: "center" });
  setNotes(slide, "Thank you. The game currently runs locally only; repository documentation does not provide a public deployment URL. Do not present http://127.0.0.1:5500/html/ as a public demo link. MoonBase is not an official NASA product and is not endorsed or validated by NASA.");
}

await fs.mkdir(BUILD, { recursive: true });
await fs.mkdir(OUT, { recursive: true });
const candidate = path.join(BUILD, "MoonBase_Final_Presentation_candidate.pptx");
await (await PresentationFile.exportPptx(ppt)).save(candidate);

const { finalizePresentation } = await import(pathToFileURL(path.join(SKILL, "container_tools", "artifact_tool_utils.mjs")).href);
const finalPath = path.join(OUT, "MoonBase_Final_Presentation.pptx");
const result = await finalizePresentation({
  explicitTotalSlideCount: 15,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir: ROOT,
  candidatePath: candidate,
  finalPath,
  pythonExecutable: "C:/Users/Abanoub/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
  integrityValidatorPath: path.join(SKILL, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [FONT] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(BUILD, "MoonBase_Final_Presentation.validation.json"),
});
console.log(JSON.stringify({ candidate, finalPath, slides: ppt.slides.items.length, result }, null, 2));
