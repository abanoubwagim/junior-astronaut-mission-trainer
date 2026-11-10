export function createMarsEnvironment(THREE, scene) {
  const root = new THREE.Group();
  root.name = "mars-research-environment";
  scene.add(root);

  // Procedural Mars simulation inspired by Jezero and Gale rover imagery. It
  // is not a DEM of a specific landing site and does not represent live data.
  const BASE_Y = -1.08;
  const WORLD = Object.freeze({ centerZ: -6, size: 96, minX: -42, maxX: 42, minZ: -54, maxZ: 42 });
  const colors = {
    regolith: 0x8b4b38, regolithLight: 0xb06b4b, regolithDark: 0x4d2824,
    bedrock: 0x5b302b, bedrockLight: 0x9b5a43, basalt: 0x393235,
    shadow: 0x211a1c, habitat: 0xcbd1cf, habitatShadow: 0x4a535c,
    glass: 0x8dd4d0, cyan: 0x57d6e5, amber: 0xffbd65, panel: 0x243a4d,
    plant: 0xb6e69b
  };
  const materials = {
    regolith: new THREE.MeshStandardMaterial({ color: colors.regolith, roughness: 1, vertexColors: true }),
    regolithLight: new THREE.MeshStandardMaterial({ color: colors.regolithLight, roughness: 0.98, flatShading: true }),
    regolithDark: new THREE.MeshStandardMaterial({ color: colors.regolithDark, roughness: 1 }),
    bedrock: new THREE.MeshStandardMaterial({ color: colors.bedrock, roughness: 0.98, flatShading: true }),
    bedrockLight: new THREE.MeshStandardMaterial({ color: colors.bedrockLight, roughness: 0.96, flatShading: true }),
    basalt: new THREE.MeshStandardMaterial({ color: colors.basalt, roughness: 0.99, flatShading: true }),
    habitat: new THREE.MeshStandardMaterial({ color: colors.habitat, roughness: 0.62, metalness: 0.22 }),
    habitatShadow: new THREE.MeshStandardMaterial({ color: colors.habitatShadow, roughness: 0.76, metalness: 0.18 }),
    glass: new THREE.MeshStandardMaterial({ color: colors.glass, transparent: true, opacity: 0.43, roughness: 0.18, metalness: 0.18, emissive: 0x174f59, emissiveIntensity: 0.18 }),
    cyan: new THREE.MeshStandardMaterial({ color: colors.cyan, emissive: colors.cyan, emissiveIntensity: 1.15, roughness: 0.3 }),
    amber: new THREE.MeshStandardMaterial({ color: colors.amber, emissive: colors.amber, emissiveIntensity: 0.8, roughness: 0.36 }),
    panel: new THREE.MeshStandardMaterial({ color: colors.panel, roughness: 0.4, metalness: 0.42 }),
    plant: new THREE.MeshStandardMaterial({ color: colors.plant, emissive: 0x355b2d, emissiveIntensity: 0.18, roughness: 0.8 }),
    dust: new THREE.MeshStandardMaterial({ color: 0xa96b4c, roughness: 1, transparent: true, opacity: 0.64, depthWrite: false })
  };
  const locations = Object.freeze({ solar: { x: 4.2, z: -0.8 }, water: { x: -7.2, z: -10.8 }, grow: { x: 14.6, z: -14.4 }, storm: { x: -10.3, z: -24.2 } });
  const signal = {
    story: { screen: "welcome", day: 0, location: "base", gateProgress: {} }, interactiveObjects: [], collisionObjects: [],
    doors: new Map(), beacons: [], dust: null, storm: null, dish: null, rover: null, habitatGlow: null,
    navigationGate: "moonbase-one", sceneLight: null, lights: []
  };

  scene.background = new THREE.Color(0xb7836d);
  scene.fog = new THREE.Fog(0xb7836d, 25, 94);

  function hash(x, z) {
    const value = Math.sin(x * 127.1 + z * 311.7 + 17.3) * 43758.5453;
    return value - Math.floor(value);
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function valueNoise(x, z, scale = 1) {
    const sx = x / scale; const sz = z / scale;
    const x0 = Math.floor(sx); const z0 = Math.floor(sz);
    const tx = smooth(sx - x0); const tz = smooth(sz - z0);
    const a = hash(x0, z0); const b = hash(x0 + 1, z0); const c = hash(x0, z0 + 1); const d = hash(x0 + 1, z0 + 1);
    return ((a + (b - a) * tx) * (1 - tz)) + ((c + (d - c) * tx) * tz);
  }
  function fractalNoise(x, z) {
    return (valueNoise(x, z, 18) - 0.5) * 1.85
      + (valueNoise(x + 11.4, z - 7.6, 7.5) - 0.5) * 0.72
      + (valueNoise(x - 4.2, z + 5.8, 2.5) - 0.5) * 0.18;
  }

  const craters = [
    { x: -16, z: -22, radius: 8.4, depth: 1.45, rim: 0.86, age: 0.2 },
    { x: 22, z: -31, radius: 6.8, depth: 1.02, rim: 0.72, age: 0.32 },
    { x: -27, z: 8, radius: 5.2, depth: 0.72, rim: 0.5, age: 0.48 },
    { x: 28, z: 9, radius: 4.7, depth: 0.62, rim: 0.46, age: 0.58 },
    { x: 6, z: 20, radius: 3.4, depth: 0.4, rim: 0.34, age: 0.7 },
    { x: -32, z: -33, radius: 3.2, depth: 0.36, rim: 0.3, age: 0.66 },
    { x: 11, z: -1, radius: 2.6, depth: 0.3, rim: 0.23, age: 0.78 },
    { x: -4, z: 11, radius: 2.1, depth: 0.25, rim: 0.2, age: 0.85 }
  ];
  const pads = [
    { x: 0, z: -3.8, radius: 7.1 }, { x: locations.solar.x, z: locations.solar.z, radius: 3.4 },
    { x: locations.water.x, z: locations.water.z, radius: 3.5 }, { x: locations.grow.x, z: locations.grow.z, radius: 3.7 },
    { x: locations.storm.x, z: locations.storm.z, radius: 3.6 }
  ];
  function craterProfile(x, z) {
    let result = 0;
    craters.forEach((crater, index) => {
      const dx = x - crater.x; const dz = z - crater.z; const angle = Math.atan2(dz, dx);
      const irregular = 1 + (valueNoise(Math.cos(angle) * 2.3 + index * 4.7, Math.sin(angle) * 2.3 - index * 3.1, 1.3) - 0.5) * 0.22;
      const distance = Math.hypot(dx, dz) / (crater.radius * irregular);
      result += -crater.depth * Math.exp(-Math.pow(distance / 0.66, 4));
      result += crater.rim * Math.exp(-Math.pow((distance - 0.98) / 0.16, 2));
      result += crater.rim * (0.25 - crater.age * 0.08) * Math.exp(-Math.pow(distance / 1.6, 2));
    });
    return result;
  }
  function duneProfile(x, z) {
    const field = (x > 18 && z < -13) || (x < -19 && z > -5) || (z > 19 && x > -10);
    if (!field) return 0;
    return Math.max(0, Math.sin((x * 0.24 + z * 0.09) + valueNoise(x, z, 9) * 2.4) * 0.28 + Math.cos(z * 0.38 - x * 0.05) * 0.08) * 0.8;
  }
  function rawMarsHeight(x, z) {
    const broadRelief = fractalNoise(x, z) * 0.66;
    const erodedRidge = Math.pow(Math.max(0, valueNoise(x * 0.9, z * 0.75, 13) - 0.43), 1.5) * 1.7;
    return broadRelief + erodedRidge + craterProfile(x, z) + duneProfile(x, z);
  }
  function marsHeight(x, z) {
    let height = rawMarsHeight(x, z);
    pads.forEach((pad) => {
      const blend = 1 - smooth(Math.min(1, Math.hypot(x - pad.x, z - pad.z) / pad.radius));
      height *= 1 - blend * 0.96;
    });
    return height;
  }

  function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position); object.rotation.set(...rotation); object.scale.set(...scale);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function addCollider(id, center, halfExtents, minY = BASE_Y, maxY = 2.2, enabled = true) {
    signal.collisionObjects.push({ id, center, halfExtents, minY, maxY, enabled });
  }
  function createRegolithTexture() {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext("2d"); if (!context) return null;
    const image = context.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4; const n = 0.78 + valueNoise(x, y, 18) * 0.16 + valueNoise(x + 40, y - 22, 4) * 0.06;
      image.data[index] = Math.min(255, 124 * n + 13); image.data[index + 1] = Math.min(255, 65 * n + 9); image.data[index + 2] = Math.min(255, 49 * n + 7); image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(7, 7);
    if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  function createTerrain() {
    const geometry = new THREE.PlaneGeometry(WORLD.size, WORLD.size, 176, 176); geometry.rotateX(-Math.PI / 2);
    const position = geometry.attributes.position; const vertexColors = new Float32Array(position.count * 3);
    const palette = [new THREE.Color(colors.regolith), new THREE.Color(colors.regolithLight), new THREE.Color(colors.bedrock), new THREE.Color(colors.regolithDark)];
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index); const z = position.getZ(index) + WORLD.centerZ; position.setY(index, marsHeight(x, z));
      const blend = valueNoise(x * 1.7, z * 1.4, 3.8); const base = palette[blend > 0.76 ? 1 : blend < 0.2 ? 3 : valueNoise(x, z, 15) > 0.58 ? 2 : 0];
      const variation = 0.84 + valueNoise(x + 22, z - 15, 2.8) * 0.28;
      vertexColors[index * 3] = Math.min(1, base.r * variation); vertexColors[index * 3 + 1] = Math.min(1, base.g * variation); vertexColors[index * 3 + 2] = Math.min(1, base.b * variation);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(vertexColors, 3)); geometry.computeVertexNormals();
    const texture = createRegolithTexture(); materials.regolith.map = texture; materials.regolith.needsUpdate = true;
    addMesh(root, geometry, materials.regolith, [0, BASE_Y, WORLD.centerZ]);
    const dustPatch = new THREE.CircleGeometry(1, 32);
    pads.slice(1).forEach((pad, index) => { const patch = addMesh(root, dustPatch, materials.dust, [pad.x, BASE_Y + 0.012, pad.z], [-Math.PI / 2, 0, index * 0.7], [pad.radius * 1.1, pad.radius * 0.66, 1]); patch.castShadow = false; });
  }
  function createRockGeometry(seed, variant = 0) {
    const geometry = new THREE.IcosahedronGeometry(1, variant ? 2 : 1); const position = geometry.attributes.position;
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index); const y = position.getY(index); const z = position.getZ(index); const length = Math.max(0.001, Math.hypot(x, y, z)); const jitter = 0.78 + hash(seed * 1.73 + index, seed * 2.41 - index) * 0.42;
      position.setXYZ(index, x / length * jitter, y / length * jitter * (0.68 + hash(seed, index) * 0.25), z / length * jitter);
    }
    geometry.computeVertexNormals(); return geometry;
  }
  function createRocks() {
    const clearZones = [[0, -3.8, 7], [locations.solar.x, locations.solar.z, 3], [locations.water.x, locations.water.z, 3], [locations.grow.x, locations.grow.z, 3], [locations.storm.x, locations.storm.z, 3]];
    const isClear = (x, z, padding = 0) => clearZones.some(([cx, cz, radius]) => Math.hypot(x - cx, z - cz) < radius + padding);
    for (let index = 0; index < 92; index += 1) {
      const x = -39 + hash(index, 31) * 78; const z = -49 + hash(index, 37) * 82; const scale = 0.14 + hash(index, 41) * 1.48;
      if (isClear(x, z, scale * 0.72)) continue;
      const rock = new THREE.Group(); rock.name = `mars-boulder-${index}`;
      rock.position.set(x, BASE_Y + marsHeight(x, z) - scale * (0.18 + hash(index, 45) * 0.18), z); rock.rotation.set((hash(index, 47) - 0.5) * 0.32, hash(index, 49) * Math.PI * 2, (hash(index, 53) - 0.5) * 0.28);
      const material = index % 5 === 0 ? materials.basalt : index % 3 === 0 ? materials.bedrockLight : materials.bedrock;
      addMesh(rock, createRockGeometry(index + 1, index % 4 === 0 ? 1 : 0), material, [0, 0, 0], [0, 0, 0], [scale * (0.92 + hash(index, 57) * 0.5), scale * (0.54 + hash(index, 61) * 0.5), scale * (0.78 + hash(index, 67) * 0.52)]); root.add(rock);
      if (scale > 0.8) addCollider(`mars-rock-${index}`, [x, z], [scale * 0.72, scale * 0.68], BASE_Y - 0.15, BASE_Y + marsHeight(x, z) + scale * 0.9);
    }
    for (let index = 0; index < 180; index += 1) {
      const x = -40 + hash(index, 79) * 80; const z = -50 + hash(index, 83) * 84; if (isClear(x, z, 0.18)) continue; const size = 0.035 + hash(index, 89) * 0.13;
      addMesh(root, createRockGeometry(300 + index), index % 4 === 0 ? materials.basalt : materials.regolithDark, [x, BASE_Y + marsHeight(x, z) + size * 0.12, z], [0, hash(index, 97) * Math.PI, 0], [size * 1.6, size * 0.7, size]);
    }
  }
  function createMesaGeometry(seed, width, depth, height) {
    const segments = 10; const positions = []; const indices = []; const levels = [0, height * 0.2, height * 0.84, height]; const radii = [1, 1.02, 0.9, 0.61];
    levels.forEach((level, levelIndex) => { for (let index = 0; index < segments; index += 1) { const angle = (index / segments) * Math.PI * 2; const irregular = 0.84 + hash(seed + levelIndex * 7, index + seed) * 0.28; positions.push(Math.cos(angle) * width * radii[levelIndex] * irregular, level, Math.sin(angle) * depth * radii[levelIndex] * irregular); } });
    for (let level = 0; level < levels.length - 1; level += 1) for (let index = 0; index < segments; index += 1) { const next = (index + 1) % segments; const current = level * segments + index; const upper = (level + 1) * segments + index; indices.push(current, next, upper, next, (level + 1) * segments + next, upper); }
    const topCenter = positions.length / 3; positions.push(0, height, 0); for (let index = 0; index < segments; index += 1) indices.push(topCenter, (levels.length - 1) * segments + index, (levels.length - 1) * segments + ((index + 1) % segments));
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
  }
  function createDistantGeology() {
    const formations = [[-31, -43, 7.4, 3.6, 6.5], [-18, -48, 9.2, 3.8, 7.8], [-3, -51, 6.5, 3.1, 5.7], [17, -46, 10.5, 4.1, 8.2], [34, -40, 7.8, 3.3, 6.7], [-42, -25, 5.4, 3.4, 5.5], [42, -19, 6.2, 3.3, 6.1]];
    formations.forEach(([x, z, width, depth, height], index) => {
      const y = BASE_Y + marsHeight(x, z) - 0.2; const mesa = addMesh(root, createMesaGeometry(index + 1, width, depth, height), index % 2 ? materials.bedrock : materials.regolithDark, [x, y, z], [0, hash(index, 113) * 0.8, 0]); mesa.castShadow = false;
      for (let band = 1; band < 4; band += 1) { const bandHeight = height * (0.18 + band * 0.18); const layer = addMesh(root, createMesaGeometry(80 + index * 5 + band, width * (1.02 - band * 0.035), depth * (1.02 - band * 0.035), 0.045), materials.bedrockLight, [x, y + bandHeight, z], [0, hash(index + band, 117) * 0.8, 0]); layer.castShadow = false; }
    });
  }
  function createDunePatches() {
    [[25, -26, 13, 8], [-26, -1, 12, 9], [5, 27, 19, 7]].forEach(([centerX, centerZ, width, depth], patchIndex) => {
      const geometry = new THREE.PlaneGeometry(width, depth, 34, 20); geometry.rotateX(-Math.PI / 2); const position = geometry.attributes.position;
      for (let index = 0; index < position.count; index += 1) { const x = position.getX(index) + centerX; const z = position.getZ(index) + centerZ; const ripple = Math.sin(x * 1.18 + patchIndex) * 0.035 + Math.cos(z * 0.92 - patchIndex) * 0.025; position.setY(index, marsHeight(x, z) + Math.max(0, ripple) + 0.014); }
      geometry.computeVertexNormals(); const dune = addMesh(root, geometry, materials.regolithLight); dune.position.y = BASE_Y; dune.position.x = 0; dune.position.z = 0; dune.castShadow = false;
      dune.userData.patchCenter = [centerX, centerZ];
      // The geometry is authored in local coordinates; shift its vertices so
      // the patch remains aligned with the terrain query and its world center.
      position.needsUpdate = true; dune.geometry.translate(centerX, 0, centerZ);
    });
  }
  function createSkyDetails() {
    const sun = addMesh(root, new THREE.SphereGeometry(0.42, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffdfb7 }), [-14, 17, -48]); sun.name = "mars-dust-filtered-sun"; sun.castShadow = false;
    const moon = addMesh(root, new THREE.SphereGeometry(0.13, 14, 8), new THREE.MeshBasicMaterial({ color: 0xd2b5a2 }), [24, 16, -53]); moon.name = "distant-martian-moon"; moon.castShadow = false;
  }

  function createHabitat() {
    const habitat = new THREE.Group(); habitat.name = "mars-research-habitat"; habitat.position.set(0, 0, -3.8);
    addMesh(habitat, new THREE.CylinderGeometry(2.4, 2.55, 1.2, 16), materials.habitat, [0, -0.1, 0], [0, 0, 0], [1.6, 1, 0.72]); addMesh(habitat, new THREE.CylinderGeometry(2.15, 2.3, 0.12, 16), materials.habitatShadow, [0, 0.52, 0], [0, 0, 0], [1.6, 1, 0.72]);
    addMesh(habitat, new THREE.SphereGeometry(1.25, 24, 14), materials.glass, [-1.65, 0.25, -0.02], [0, 0, 0], [1.28, 0.76, 0.92]); addMesh(habitat, new THREE.SphereGeometry(1.1, 24, 14), materials.glass, [1.5, 0.2, 0.08], [0, 0, 0], [1.18, 0.68, 0.88]);
    addMesh(habitat, new THREE.BoxGeometry(0.62, 0.82, 0.12), materials.panel, [0, 0.02, 1.06]); addMesh(habitat, new THREE.BoxGeometry(0.5, 0.06, 0.04), materials.cyan, [0, 0.25, 1.13]); addMesh(habitat, new THREE.BoxGeometry(0.42, 0.06, 0.04), materials.amber, [0, 0.07, 1.13]); addMesh(habitat, new THREE.BoxGeometry(0.72, 0.14, 2.3), materials.habitatShadow, [0, -0.18, 2.05]); root.add(habitat);
    const airlock = addMesh(root, new THREE.BoxGeometry(1.45, 1.68, 0.95), materials.habitatShadow, [0, -0.05, -1.95]); addMesh(airlock, new THREE.BoxGeometry(0.76, 1.22, 0.05), materials.panel, [0, 0.04, -0.5]);
    signal.habitatGlow = new THREE.PointLight(0x55ddea, 1.0, 7, 2); signal.habitatGlow.position.set(0, 1.0, -3.8); root.add(signal.habitatGlow);
  }
  function createMissionStations() {
    const water = new THREE.Group(); water.name = "mars-water-recovery-station"; water.position.set(locations.water.x, BASE_Y + marsHeight(locations.water.x, locations.water.z) + 0.06, locations.water.z);
    addMesh(water, new THREE.CylinderGeometry(0.78, 0.92, 1.35, 12), materials.habitatShadow, [0, 0.66, 0]); addMesh(water, new THREE.CylinderGeometry(0.53, 0.6, 0.08, 12), materials.glass, [0, 1.35, 0]); addMesh(water, new THREE.BoxGeometry(0.11, 0.92, 0.11), materials.cyan, [0.64, 0.67, 0]); root.add(water);
    const grow = new THREE.Group(); grow.name = "mars-food-growing-station"; grow.position.set(locations.grow.x, BASE_Y + marsHeight(locations.grow.x, locations.grow.z) + 0.08, locations.grow.z);
    addMesh(grow, new THREE.CylinderGeometry(1.02, 1.14, 0.36, 14), materials.habitatShadow, [0, 0.18, 0]); addMesh(grow, new THREE.SphereGeometry(0.85, 20, 12), materials.glass, [0, 0.78, 0], [0, 0, 0], [1.1, 0.65, 0.82]); addMesh(grow, new THREE.BoxGeometry(0.12, 0.7, 0.12), materials.plant, [0.24, 0.9, 0]); addMesh(grow, new THREE.BoxGeometry(0.12, 0.55, 0.12), materials.plant, [-0.3, 0.82, 0.16]); root.add(grow);
    const storm = new THREE.Group(); storm.name = "mars-weather-shelter"; storm.position.set(locations.storm.x, BASE_Y + marsHeight(locations.storm.x, locations.storm.z) + 0.06, locations.storm.z);
    addMesh(storm, new THREE.BoxGeometry(2.25, 1.1, 1.45), materials.habitatShadow, [0, 0.55, 0]); addMesh(storm, new THREE.BoxGeometry(1.2, 0.55, 0.06), materials.panel, [0, 0.54, -0.75]); addMesh(storm, new THREE.BoxGeometry(0.92, 0.08, 0.06), materials.amber, [0, 0.95, -0.79]); root.add(storm);
  }
  function createSolarAndEquipment() {
    const solar = new THREE.Group(); solar.name = "mars-solar-field"; solar.position.set(5.6, BASE_Y + marsHeight(5.6, -0.8) + 0.08, -0.8);
    for (const x of [-1.2, 0, 1.2]) { addMesh(solar, new THREE.BoxGeometry(0.9, 0.06, 1.45), materials.panel, [x, 1.1, 0], [0.18, 0, -0.16]); addMesh(solar, new THREE.BoxGeometry(0.7, 0.012, 1.22), materials.cyan, [x, 1.14, -0.01], [0.18, 0, -0.16]); addMesh(solar, new THREE.CylinderGeometry(0.035, 0.05, 1.2, 8), materials.habitatShadow, [x, 0.53, 0]); }
    addMesh(solar, new THREE.BoxGeometry(3.9, 0.18, 0.18), materials.habitatShadow, [0, 0.05, 0]); root.add(solar); addCollider("mars-solar-field", [5.6, -0.8], [2.3, 1.2], BASE_Y, 2.4);
    const dish = new THREE.Group(); dish.name = "mars-communication-dish"; dish.position.set(-5.4, BASE_Y + marsHeight(-5.4, -1.4) + 0.08, -1.4);
    addMesh(dish, new THREE.CylinderGeometry(0.07, 0.09, 2.0, 8), materials.habitatShadow, [0, 1, 0]); addMesh(dish, new THREE.SphereGeometry(0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.46), materials.habitat, [0, 1.9, 0], [Math.PI / 2, 0, 0], [1, 1, 0.34]); addMesh(dish, new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), materials.cyan, [0, 2.12, -0.25], [0.35, 0, 0]); signal.dish = dish; root.add(dish);
    const rover = new THREE.Group(); rover.name = "mars-exploration-rover"; rover.position.set(2.3, BASE_Y + marsHeight(2.3, 1.5) + 0.08, 1.5);
    addMesh(rover, new THREE.BoxGeometry(1.2, 0.38, 0.8), materials.habitatShadow, [0, 0.2, 0]); addMesh(rover, new THREE.BoxGeometry(0.62, 0.42, 0.54), materials.habitat, [0, 0.58, 0]); addMesh(rover, new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), materials.habitatShadow, [0, 0.95, 0]); addMesh(rover, new THREE.SphereGeometry(0.13, 10, 6), materials.cyan, [0, 1.32, 0]);
    for (const x of [-0.55, 0.55]) for (const z of [-0.34, 0.34]) addMesh(rover, new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12), materials.basalt, [x, 0.08, z], [Math.PI / 2, 0, 0]); signal.rover = rover; root.add(rover);
  }
  function createGate(id, name, day, position, index) {
    const group = new THREE.Group(); group.name = `${id}-gate`; group.position.set(position[0], BASE_Y, position[1]); addMesh(group, new THREE.BoxGeometry(2.2, 2.7, 0.56), materials.habitatShadow, [0, 1.35, 0]);
    const left = addMesh(group, new THREE.BoxGeometry(0.48, 1.48, 0.08), materials.habitat, [-0.42, 1.15, -0.34]); const right = addMesh(group, new THREE.BoxGeometry(0.48, 1.48, 0.08), materials.habitat, [0.42, 1.15, -0.34]); addMesh(group, new THREE.BoxGeometry(1.05, 0.09, 0.06), materials.cyan, [0, 1.96, -0.36]);
    const light = new THREE.PointLight(index % 2 ? 0xffbd65 : 0x57d6e5, 1.3, 3.6, 2); light.position.set(0, 2.05, -0.46); group.add(light);
    const halo = addMesh(group, new THREE.RingGeometry(0.42, 0.49, 24), materials.cyan, [0, -1.0, -0.6], [-Math.PI / 2, 0, 0]); halo.material = halo.material.clone(); halo.material.transparent = true; halo.material.opacity = 0.06; halo.userData.interactionHalo = true; halo.visible = false;
    const door = { id, left, right, light, open: 0, target: 0, collider: null }; signal.doors.set(id, door); const record = { id, name, day, position: [position[0], position[1]], radius: 2.05, object: group }; signal.interactiveObjects.push(record); signal.collisionObjects.push({ id, center: [position[0], position[1]], halfExtents: [1.16, 0.48], minY: BASE_Y, maxY: 1.75, enabled: true, door }); root.add(group); return record;
  }
  function createStoryBeacons() {
    const entries = [["moonbase-entry", "base", 0], ["moonbase-two-entry", "solar", 1], ["moonbase-three-entry", "water", 2], ["moonbase-four-entry", "grow", 3]];
    entries.forEach(([id, location, index]) => { const point = location === "base" ? [0, -2] : location === "solar" ? [4.2, -0.8] : location === "water" ? [-7.2, -10.8] : [14.6, -14.4]; createGate(id, `Mars ${location} airlock`, index + 1, point, index); const beacon = addMesh(root, new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8), materials.cyan, [point[0], BASE_Y + 0.91, point[1] - 1.2]); const ring = addMesh(beacon, new THREE.RingGeometry(0.35, 0.39, 24), materials.cyan, [0, -0.84, 0], [-Math.PI / 2, 0, 0]); ring.material = ring.material.clone(); ring.material.transparent = true; ring.material.opacity = 0.05; const light = new THREE.PointLight(0x57d6e5, 1.0, 3.4, 2); light.position.y = 0.65; beacon.add(light); signal.beacons.push({ object: beacon, ring, location }); });
  }
  function createParticles() {
    const geometry = new THREE.BufferGeometry(); const positions = new Float32Array(220 * 3);
    for (let index = 0; index < 220; index += 1) { positions[index * 3] = -38 + hash(index, 131) * 76; positions[index * 3 + 1] = BASE_Y + 0.08 + hash(index, 137) * 2.2; positions[index * 3 + 2] = -42 + hash(index, 139) * 72; }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); signal.dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xd08b63, size: 0.06, transparent: true, opacity: 0.14, depthWrite: false })); root.add(signal.dust);
    const stormGeometry = new THREE.BufferGeometry(); const stormPositions = new Float32Array(280 * 3);
    for (let index = 0; index < 280; index += 1) { stormPositions[index * 3] = -36 + hash(index, 149) * 72; stormPositions[index * 3 + 1] = BASE_Y + 0.1 + hash(index, 151) * 3.6; stormPositions[index * 3 + 2] = -40 + hash(index, 157) * 66; }
    stormGeometry.setAttribute("position", new THREE.Float32BufferAttribute(stormPositions, 3)); signal.storm = new THREE.Points(stormGeometry, new THREE.PointsMaterial({ color: 0xb66f52, size: 0.07, transparent: true, opacity: 0, depthWrite: false })); root.add(signal.storm);
  }
  function createLighting() {
    signal.sceneLight = new THREE.AmbientLight(0xb98575, 0.62); scene.add(signal.sceneLight); signal.lights.push(signal.sceneLight);
    const fill = new THREE.HemisphereLight(0xd9a58d, 0x3b2424, 0.44); fill.name = "thin-martian-atmosphere-fill"; scene.add(fill); signal.lights.push(fill);
    const key = new THREE.DirectionalLight(0xffc8aa, 2.8); key.name = "direct-martian-sunlight"; key.position.set(-18, 24, 14); key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.camera.near = 0.5; key.shadow.camera.far = 120; key.shadow.camera.left = -52; key.shadow.camera.right = 52; key.shadow.camera.top = 52; key.shadow.camera.bottom = -52; key.shadow.normalBias = 0.034; scene.add(key); signal.lights.push(key);
  }
  function updateDoor(door, delta) { if (!door) return; door.open += (door.target - door.open) * (1 - Math.exp(-delta * 5.5)); door.left.position.x = -0.42 - door.open * 0.72; door.right.position.x = 0.42 + door.open * 0.72; door.light.intensity = 1.0 + door.open * 2.4; const collider = signal.collisionObjects.find((entry) => entry.door === door); if (collider) collider.enabled = door.open < 0.72; }
  function update(time, delta) {
    signal.dish && (signal.dish.rotation.y = Math.sin(time * 0.0007) * 0.2); signal.rover && (signal.rover.position.y = BASE_Y + marsHeight(2.3, 1.5) + 0.08 + Math.sin(time * 0.0012) * 0.012); signal.habitatGlow && (signal.habitatGlow.intensity = 0.86 + (Math.sin(time * 0.002) + 1) * 0.1); signal.doors.forEach((door) => updateDoor(door, delta));
    signal.beacons.forEach((beacon, index) => { const active = signal.story.location === beacon.location; beacon.ring.material.opacity = active ? 0.22 + (Math.sin(time * 0.003 + index) + 1) * 0.08 : 0.025; beacon.object.rotation.y += delta * 0.16; });
    if (signal.dust) { signal.dust.position.x = Math.sin(time * 0.00016) * 0.55; signal.dust.position.z = Math.cos(time * 0.00013) * 0.35; } if (signal.storm) signal.storm.position.x = Math.sin(time * 0.0004) * 0.8;
  }
  function setStoryState(story = {}) {
    const mission = story.mission || null; const day = Number(mission?.event?.day || mission?.day || 0); const location = story.location || ["base", "solar", "water", "grow", "storm"][day] || "base";
    const dayOneComplete = Boolean(story.dayOneComplete) || story.screen === "day1Complete" || Number(mission?.latestDecision?.day) === 1; const dayTwoComplete = Boolean(story.dayTwoComplete) || Number(mission?.latestDecision?.day) === 2; const dayThreeComplete = Boolean(story.dayThreeComplete) || Number(mission?.latestDecision?.day) === 3;
    signal.story = { ...signal.story, ...story, day, location, gateProgress: story.gateProgress || signal.story.gateProgress || {} }; signal.navigationGate = dayThreeComplete || day >= 4 ? "moonbase-four" : dayTwoComplete || day >= 3 ? "moonbase-three" : dayOneComplete || day >= 2 ? "moonbase-two" : "moonbase-one";
  }
  function setInteractionFocus(id = "") { signal.interactiveObjects.forEach((entry) => entry.object.traverse?.((child) => { if (child.userData.interactionHalo) child.visible = entry.id === id; })); }
  function getNavigationTarget() { const targetId = signal.story.screen === "game" ? getGateIdForDay(signal.story.day) : `${signal.navigationGate}-entry`; const target = signal.interactiveObjects.find((entry) => entry.id === targetId); return target ? { x: target.position[0], z: target.position[1], id: target.id } : null; }
  function getGateIdForDay(day) { return Number(day) === 1 ? "moonbase-entry" : Number(day) === 2 ? "moonbase-two-entry" : Number(day) === 3 ? "moonbase-three-entry" : Number(day) === 4 ? "moonbase-four-entry" : null; }
  function isGateEntered(day) { return Number(day) >= 1 && Boolean(signal.story.gateProgress?.[day]); }
  function isWelcomeEntryActive() { return signal.story.screen === "welcome"; }
  function setEntryDoorOpen(open = true) { const door = signal.doors.get("moonbase-entry"); if (door) door.target = open ? 1 : 0; }
  function setGateDoorOpen(id, open = true) { const door = signal.doors.get(id); if (door) door.target = open ? 1 : 0; }
  function isGateDoorOpen(id) { return Boolean(signal.doors.get(id)?.open >= 0.97); }
  function setSignal({ storm = false, success = false } = {}) { if (signal.habitatGlow) signal.habitatGlow.intensity = success ? 2.6 : 1.55; if (signal.dust) signal.dust.material.opacity = storm ? 0.3 : 0.14; if (signal.storm) signal.storm.material.opacity = storm ? 0.3 : 0; if (signal.sceneLight) signal.sceneLight.intensity = 0.5; }
  function dispose() { root.traverse((object) => { if (object.geometry) object.geometry.dispose(); if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose?.()); }); signal.lights.forEach((light) => light.removeFromParent?.()); scene.fog = null; root.removeFromParent?.(); }

  createTerrain(); createRocks(); createDistantGeology(); createDunePatches(); createSkyDetails(); createHabitat(); createMissionStations(); createSolarAndEquipment(); createStoryBeacons(); createParticles(); createLighting();

  return {
    root, update, setSignal, setStoryState, setInteractionFocus, setEntryDoorOpen, setGateDoorOpen, isGateDoorOpen,
    getNavigationTarget, getGateIdForDay, isGateEntered, isWelcomeEntryActive, getLocations: () => locations,
    getInteractiveObjects: () => signal.interactiveObjects, getCollisionObjects: () => signal.collisionObjects,
    getTerrainHeight: (x, z) => BASE_Y + marsHeight(Number(x) || 0, Number(z) || 0), dispose
  };
}
