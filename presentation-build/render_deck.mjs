import fs from "node:fs/promises";
import path from "node:path";
import { PresentationFile, FileBlob } from "file:///C:/Users/Abanoub/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
import sharp from "file:///C:/Users/Abanoub/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs";

const ROOT = "C:/Users/Abanoub/Desktop/junior-astronaut-mission-trainer";
const DECK = path.join(ROOT, "MoonBase_Final_Presentation.pptx");
const OUT = path.join(ROOT, "presentation-build", "final-render");
await fs.mkdir(OUT, { recursive: true });
const ppt = await PresentationFile.importPptx(await FileBlob.load(DECK));
const rendered = [];
for (const [i, slide] of ppt.slides.items.entries()) {
  const name = "slide-" + String(i + 1).padStart(2, "0") + ".png";
  const blob = await ppt.export({ slide, format: "png", scale: 1 });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const file = path.join(OUT, name);
  await fs.writeFile(file, bytes);
  rendered.push(file);
}
const thumbFiles = await Promise.all(rendered.map((file) => sharp(file).resize(320, 180, { fit: "fill" }).png().toBuffer()));
const tiles = thumbFiles.map((input, i) => ({ input, left: (i % 4) * 320, top: Math.floor(i / 4) * 180 }));
await sharp({ create: { width: 1280, height: 720, channels: 4, background: "#0B1124" } }).composite(tiles).png().toFile(path.join(OUT, "montage.png"));
const inspect = await ppt.inspect({ kind: "slide,textbox,shape,image,notes", maxChars: 90000 });
await fs.writeFile(path.join(OUT, "content-inspection.ndjson"), inspect.ndjson, "utf8");
console.log(JSON.stringify({ slideCount: ppt.slides.items.length, renderDir: OUT, montage: path.join(OUT, "montage.png"), inspectChars: inspect.ndjson.length }, null, 2));
