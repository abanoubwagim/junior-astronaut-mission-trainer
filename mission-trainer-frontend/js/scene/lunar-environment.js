export function createLunarEnvironment(THREE, scene) {
  const root = new THREE.Group();
  root.name = "moonbase-environment";
  scene.add(root);

  const colors = {
    ground: 0x77746e,
    groundDark: 0x3d3c3a,
    regolithDust: 0x98938b,
    craterBowl: 0x373737,
    craterRim: 0x77736b,
    base: 0x27345d,
    baseLight: 0x5268a4,
    cyan: 0x63e9ef,
    violet: 0xa981ff,
    warm: 0xffd36f,
    orange: 0xff9346,
    hull: 0xd9e4f1,
    hullShadow: 0x7e8ca7,
    panelBlue: 0x173b6d,
    earth: 0x2e629a,
    land: 0x788569,
    suit: 0xe9efff,
    hazard: 0xff9b83,
    plant: 0x84f1d0
  };

  let rockNormalTexture;
  let rockRoughnessTexture;

  const materials = {
    ground: new THREE.MeshStandardMaterial({ color: colors.ground, roughness: 1, metalness: 0, vertexColors: true }),
    groundDark: new THREE.MeshStandardMaterial({ color: colors.groundDark, roughness: 1, metalness: 0, transparent: true, opacity: 0.34 }),
    base: new THREE.MeshStandardMaterial({ color: colors.base, roughness: 0.74, metalness: 0.08 }),
    baseLight: new THREE.MeshStandardMaterial({ color: colors.baseLight, roughness: 0.54, metalness: 0.16 }),
    hull: new THREE.MeshStandardMaterial({ color: colors.hull, roughness: 0.65, metalness: 0.28 }),
    hullShadow: new THREE.MeshStandardMaterial({ color: colors.hullShadow, roughness: 0.76, metalness: 0.18 }),
    orange: new THREE.MeshStandardMaterial({ color: colors.orange, emissive: colors.orange, emissiveIntensity: 0.65, roughness: 0.4, metalness: 0.2 }),
    panelBlue: new THREE.MeshStandardMaterial({ color: colors.panelBlue, roughness: 0.36, metalness: 0.38 }),
    dome: new THREE.MeshStandardMaterial({ color: 0x79cfff, transparent: true, opacity: 0.48, emissive: 0x1e6ca5, emissiveIntensity: 0.42, roughness: 0.2, metalness: 0.12 }),
    cyan: new THREE.MeshStandardMaterial({ color: colors.cyan, emissive: colors.cyan, emissiveIntensity: 1.6, roughness: 0.28 }),
    roverCyan: new THREE.MeshStandardMaterial({ color: colors.cyan, emissive: colors.cyan, emissiveIntensity: 1.7, roughness: 0.24 }),
    violet: new THREE.MeshStandardMaterial({ color: colors.violet, emissive: colors.violet, emissiveIntensity: 1.15, roughness: 0.4 }),
    warm: new THREE.MeshStandardMaterial({ color: colors.warm, emissive: colors.warm, emissiveIntensity: 1.25, roughness: 0.35 }),
    earth: new THREE.MeshStandardMaterial({ color: colors.earth, roughness: 0.82, metalness: 0.02 }),
    land: new THREE.MeshStandardMaterial({ color: colors.land, roughness: 0.9 }),
    suit: new THREE.MeshStandardMaterial({ color: colors.suit, roughness: 0.72 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x122858, emissive: 0x154d87, emissiveIntensity: 0.7, roughness: 0.18, metalness: 0.2 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x111936, roughness: 0.55, metalness: 0.2 }),
    rockBasalt: createRockMaterial(0x45464a, { roughness: 0.98, normalScale: 0.42, flatShading: false }),
    rockBasaltLight: createRockMaterial(0x5c5b5b, { roughness: 0.96, normalScale: 0.34, flatShading: false }),
    rockBreccia: createRockMaterial(0x77736d, { roughness: 0.98, normalScale: 0.3, flatShading: false }),
    rockBrecciaLight: createRockMaterial(0x9a958c, { roughness: 0.96, normalScale: 0.24, flatShading: false }),
    rockDust: createRockMaterial(0x9b958a, { roughness: 1, normalScale: 0.2, flatShading: false }),
    rockEdge: createRockMaterial(0xaaa59b, { roughness: 0.96, normalScale: 0.25, flatShading: false }),
    rockVoid: new THREE.MeshStandardMaterial({ color: 0x292a2b, roughness: 1, metalness: 0, flatShading: true }),
    groundDust: new THREE.MeshStandardMaterial({ color: colors.regolithDust, roughness: 1, metalness: 0 }),
    craterBowl: new THREE.MeshStandardMaterial({ color: colors.craterBowl, roughness: 1, metalness: 0 }),
    craterRim: new THREE.MeshStandardMaterial({ color: colors.craterRim, roughness: 1, metalness: 0 })
  };

  const signal = {
    baseLights: [],
    waterLights: [],
    storm: null,
    dust: null,
    stars: null,
    rover: null,
    roverLights: [],
    astronaut: null,
    earth: null,
    earthClouds: null,
    antenna: null,
    baseGlow: null,
    sceneLight: null,
    locations: {},
    beacons: [],
    solarDust: null,
    waterLeak: null,
    growLights: [],
    shelterDome: null,
    stormRings: [],
    communicationDish: null,
    story: { screen: "welcome", day: 0, location: "base", selectedChoiceId: null, gateProgress: {} },
    interactiveObjects: [],
    collisionObjects: [],
    moonTexture: null,
    solarArray: null,
    dayGate: null,
    dayThreeGate: null,
    dayFourGate: null,
    baseLabelTexture: null,
    secondaryLabelTexture: null,
    missionLabelTextures: [],
    entryDoor: null,
    dayGateDoor: null,
    dayThreeGateDoor: null,
    dayFourGateDoor: null,
    gateArrows: [],
    navigationGate: "moonbase-one",
    foodRatio: 1,
    shelterRatio: 1,
    growBaseIntensity: 0.3
  };

  const WORLD = { centerZ: -6, size: 84, minX: -38, maxX: 38, minZ: -42, maxZ: 30 };
  const missionLocations = Object.freeze({
    solar: { x: 3.55, z: -0.72 },
    water: { x: -6.8, z: -10.8 },
    grow: { x: 15.0, z: -14.0 },
    storm: { x: -9.0, z: -23.7 }
  });

  // These are visual-simulation features, not a claim that MoonBase occupies
  // a surveyed lunar coordinate. Their profiles are intentionally varied so
  // the terrain mesh, not a decorative bowl, defines the lunar silhouette.
  const terrainCraters = Object.freeze([
    { x: -20.5, z: -26.0, radius: 7.2, depth: 1.18, rim: 0.72, age: "degraded", seed: 11 },
    { x: 21.0, z: -28.0, radius: 5.8, depth: 1.48, rim: 0.92, age: "fresh", seed: 17 },
    { x: -27.0, z: -7.5, radius: 4.7, depth: 0.84, rim: 0.54, age: "ancient", seed: 23 },
    { x: 27.0, z: -8.0, radius: 4.2, depth: 0.98, rim: 0.62, age: "fresh", seed: 29 },
    { x: 17.0, z: 10.8, radius: 6.5, depth: 0.74, rim: 0.46, age: "ancient", seed: 31 },
    { x: -18.0, z: 11.5, radius: 5.6, depth: 1.02, rim: 0.6, age: "degraded", seed: 37 },
    { x: 3.6, z: -19.8, radius: 3.5, depth: 0.62, rim: 0.43, age: "fresh", seed: 41 },
    { x: -1.8, z: -29.5, radius: 2.5, depth: 0.48, rim: 0.34, age: "fresh", seed: 43 },
    { x: 12.2, z: -22.8, radius: 2.25, depth: 0.38, rim: 0.26, age: "fresh", seed: 47 },
    { x: -28.0, z: -22.0, radius: 2.9, depth: 0.5, rim: 0.31, age: "degraded", seed: 53 },
    { x: 24.0, z: 4.8, radius: 2.8, depth: 0.42, rim: 0.28, age: "fresh", seed: 59 },
    { x: -9.5, z: 18.0, radius: 3.2, depth: 0.48, rim: 0.3, age: "ancient", seed: 61 },
    { x: 7.8, z: -11.2, radius: 1.7, depth: 0.28, rim: 0.2, age: "fresh", seed: 67 },
    { x: -13.4, z: -14.2, radius: 1.45, depth: 0.22, rim: 0.16, age: "fresh", seed: 71 }
  ]);

  // Broad landforms make the playable area read as a geological landscape
  // before the smaller craters and rocks are even visible. These are
  // procedural visual features, not measurements of a named lunar site.
  const terrainHighlands = Object.freeze([
    { x: -23, z: -15, width: 15, depth: 5.2, height: 2.35, rotation: 0.32, seed: 101 },
    { x: 22, z: -17, width: 18, depth: 5.8, height: 2.15, rotation: -0.24, seed: 109 },
    { x: 1, z: -36, width: 27, depth: 6.8, height: 2.05, rotation: 0.06, seed: 113 },
    { x: -31, z: 9, width: 16, depth: 8.2, height: 1.85, rotation: 0.55, seed: 127 },
    { x: 30, z: 11, width: 17, depth: 7.4, height: 1.72, rotation: -0.48, seed: 131 }
  ]);

  function hash2(x, z) {
    const value = Math.sin(x * 127.1 + z * 311.7 + 17.3) * 43758.5453;
    return value - Math.floor(value);
  }

  function smoothstep(edge0, edge1, value) {
    const t = Math.max(0, Math.min(1, (value - edge0) / Math.max(0.0001, edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function valueNoise(x, z) {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const tx = smoothstep(0, 1, x - x0);
    const tz = smoothstep(0, 1, z - z0);
    const a = hash2(x0, z0);
    const b = hash2(x0 + 1, z0);
    const c = hash2(x0, z0 + 1);
    const d = hash2(x0 + 1, z0 + 1);
    const ab = a + (b - a) * tx;
    const cd = c + (d - c) * tx;
    return ab + (cd - ab) * tz;
  }

  function fractalNoise(x, z) {
    let value = 0;
    let amplitude = 0.56;
    let frequency = 0.035;
    let total = 0;
    for (let octave = 0; octave < 4; octave += 1) {
      value += (valueNoise(x * frequency + octave * 17.3, z * frequency - octave * 9.1) * 2 - 1) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      frequency *= 2.05;
    }
    return value / total;
  }

  function highlandProfile(form, x, z) {
    const cosine = Math.cos(form.rotation);
    const sine = Math.sin(form.rotation);
    const dx = x - form.x;
    const dz = z - form.z;
    const along = (dx * cosine - dz * sine) / Math.max(0.1, form.width * 0.5);
    const across = (dx * sine + dz * cosine) / Math.max(0.1, form.depth * 0.5);
    const envelope = Math.exp(-0.5 * (along * along + across * across));
    const brokenProfile = 0.82 + valueNoise(x * 0.18 + form.seed, z * 0.18 - form.seed) * 0.28;
    const shoulder = 0.88 + Math.max(0, 1 - Math.abs(along)) * 0.12;
    return form.height * envelope * brokenProfile * shoulder;
  }

  function craterProfile(crater, x, z) {
    const dx = x - crater.x;
    const dz = z - crater.z;
    const angle = Math.atan2(dz, dx);
    const irregularity = 1 + (valueNoise(Math.cos(angle) * 2.5 + crater.seed, Math.sin(angle) * 2.5 - crater.seed) - 0.5) * 0.28;
    const radial = Math.hypot(dx, dz) / Math.max(0.1, crater.radius * irregularity);
    if (radial > 1.62) return 0;

    const floorDepth = crater.age === "ancient" ? crater.depth * 0.64 : crater.depth;
    const rimScale = crater.age === "degraded" ? crater.rim * 0.7 : crater.rim;
    if (radial < 0.42) {
      const floorBlend = smoothstep(0.05, 0.42, radial);
      return -floorDepth * (0.88 - floorBlend * 0.2);
    }
    if (radial < 0.94) {
      const wall = smoothstep(0.42, 0.94, radial);
      return -floorDepth * (1 - wall) + rimScale * Math.pow(wall, 2.2) * 0.18;
    }
    if (radial < 1.18) {
      const rim = 1 - smoothstep(0.94, 1.18, radial);
      const unevenRim = 0.74 + valueNoise(x * 0.7 + crater.seed, z * 0.7 - crater.seed) * 0.42;
      return rimScale * rim * unevenRim;
    }
    const ejecta = 1 - smoothstep(1.18, 1.62, radial);
    return rimScale * 0.24 * ejecta * (0.75 + valueNoise(x * 0.28, z * 0.28) * 0.5);
  }

  function createRockTexture(size, seed, normal = false) {
    const data = new Uint8Array(size * size * 4);
    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = y * size + x;
        const coarse = hash2(seed + Math.floor(x / 4) * 1.7, seed - Math.floor(y / 4) * 2.3);
        const fine = hash2(seed + x * 0.73, seed + y * 1.19);
        heights[index] = coarse * 0.68 + fine * 0.32;
      }
    }
    const sample = (x, y) => heights[((y + size) % size) * size + ((x + size) % size)];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        if (normal) {
          const dx = (sample(x + 1, y) - sample(x - 1, y)) * 1.9;
          const dy = (sample(x, y + 1) - sample(x, y - 1)) * 1.9;
          data[index] = Math.max(0, Math.min(255, 128 - dx * 170));
          data[index + 1] = Math.max(0, Math.min(255, 128 - dy * 170));
          data[index + 2] = 246;
        } else {
          const value = 148 + Math.round(heights[y * size + x] * 94);
          data[index] = value;
          data[index + 1] = value;
          data[index + 2] = value;
        }
        data[index + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
    texture.needsUpdate = true;
    return texture;
  }

  rockNormalTexture = createRockTexture(32, 41, true);
  rockRoughnessTexture = createRockTexture(32, 73, false);
  [materials.rockBasalt, materials.rockBasaltLight, materials.rockBreccia,
    materials.rockBrecciaLight, materials.rockDust, materials.rockEdge].forEach((material) => {
    material.normalMap = rockNormalTexture;
    material.roughnessMap = rockRoughnessTexture;
    material.needsUpdate = true;
  });

  function createRockMaterial(color, { roughness = 0.98, normalScale = 0.32, flatShading = true } = {}) {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0,
      flatShading,
      normalScale: new THREE.Vector2(normalScale, normalScale)
    });
    // The materials are created before the deterministic texture maps are
    // generated. Assign maps only after they exist to avoid undefined-map
    // warnings during WebGL material construction.
    if (rockNormalTexture) material.normalMap = rockNormalTexture;
    if (rockRoughnessTexture) material.roughnessMap = rockRoughnessTexture;
    return material;
  }

  function groundHeight(x, z) {
    // Multi-scale highland relief gives the playable map broad slopes and
    // ridges. Crater profiles are then stamped into the same height function,
    // so floors and rims are part of the displaced terrain mesh.
    let height = fractalNoise(x, z) * 0.92;
    height += fractalNoise(x * 0.43 + 19, z * 0.43 - 11) * 1.35;
    height += (valueNoise(x * 0.92 + 8, z * 0.92 - 4) - 0.5) * 0.18;
    terrainHighlands.forEach((form) => { height += highlandProfile(form, x, z); });
    terrainCraters.forEach((crater) => { height += craterProfile(crater, x, z); });

    const padZones = [
      [0, -3.8, 7.6],
      [missionLocations.solar.x, missionLocations.solar.z, 3.5],
      [missionLocations.water.x, missionLocations.water.z, 3.5],
      [missionLocations.grow.x, missionLocations.grow.z, 3.5],
      [missionLocations.storm.x, missionLocations.storm.z, 3.5],
      [-10.5, -10.5, 3.1], [11.8, -13.8, 3.1], [-12.8, -23.5, 3.1]
    ];
    padZones.forEach(([padX, padZ, radius]) => {
      const distance = Math.hypot(x - padX, z - padZ);
      const flatten = 1 - smoothstep(radius * 0.62, radius, distance);
      height *= 1 - flatten;
    });
    return height;
  }

  function createRockGeometry(type, seed) {
    // Use deformed rounded chunks instead of tetrahedrons/octahedrons. The
    // silhouette stays rocky and uneven without reading as a pyramid or a
    // deliberate triangular prop, especially in close camera views.
    const geometry = type === "small"
      ? new THREE.SphereGeometry(1, 10, 6)
      : type === "basalt"
        ? new THREE.SphereGeometry(1, 12, 7)
        : type === "breccia"
          ? new THREE.SphereGeometry(1, 11, 7)
          : new THREE.SphereGeometry(1, 12, 8);
    const position = geometry.attributes.position;
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      const facet = 0.78 + hash2(seed + index * 0.91, seed - index * 0.47) * 0.42;
      const shoulder = 0.88 + hash2(seed - index * 0.31, seed + index * 0.63) * 0.2;
      position.setXYZ(index, x * facet * shoulder, y * (type === "basalt" ? 0.72 : 0.78) * facet, z * facet);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }

  function addRockCavities(rock, scale, seed, count = 2) {
    for (let index = 0; index < count; index += 1) {
      const cavity = new THREE.Mesh(new THREE.SphereGeometry(0.11 + hash2(seed, index + 13) * 0.09, 8, 5), materials.rockVoid);
      cavity.position.set(
        -0.38 + hash2(seed, index + 21) * 0.76,
        0.28 + hash2(seed, index + 27) * 0.32,
        -0.36 + hash2(seed, index + 33) * 0.72
      );
      cavity.scale.set(1.35, 0.34, 0.92);
      cavity.rotation.set(hash2(seed, index + 39), hash2(seed, index + 45) * Math.PI, hash2(seed, index + 51));
      cavity.castShadow = true;
      rock.add(cavity);
    }
  }

  function addRockFractures(rock, seed, scale) {
    const crackMaterial = materials.rockVoid;
    for (let index = 0; index < 1; index += 1) {
      const crack = new THREE.Mesh(new THREE.BoxGeometry(0.42 + hash2(seed, index + 60) * 0.25, 0.018, 0.035), crackMaterial);
      crack.position.set(-0.16 + hash2(seed, index + 64) * 0.34, 0.47 + hash2(seed, index + 67) * 0.12, -0.18 + hash2(seed, index + 70) * 0.38);
      crack.rotation.y = -0.8 + hash2(seed, index + 73) * 1.6;
      crack.rotation.z = -0.18 + hash2(seed, index + 76) * 0.36;
      crack.scale.set(1, 1, 0.7);
      rock.add(crack);
    }
  }

  function addBrecciaFragments(rock, seed, scale) {
    const fragmentMaterials = [materials.rockBrecciaLight, materials.rockBasaltLight, materials.rockDust];
    for (let index = 0; index < 3; index += 1) {
      const fragment = new THREE.Mesh(
        createRockGeometry(index % 2 === 0 ? "small" : "basalt", seed + index + 140),
        fragmentMaterials[index % fragmentMaterials.length]
      );
      fragment.position.set(
        -0.42 + hash2(seed, index + 91) * 0.8,
        0.08 + hash2(seed, index + 95) * 0.46,
        -0.4 + hash2(seed, index + 99) * 0.72
      );
      fragment.scale.setScalar(0.2 + hash2(seed, index + 103) * 0.18);
      fragment.scale.y *= 0.7;
      fragment.rotation.set(hash2(seed, index + 107), hash2(seed, index + 111) * Math.PI, hash2(seed, index + 115));
      fragment.castShadow = true;
      rock.add(fragment);
    }
  }

  function createAuthenticRock({ x, z, scale, seed, type = "small", buried = false, collidable = false }) {
    const rock = new THREE.Group();
    rock.name = `authentic-lunar-${type}${buried ? "-partially-buried" : ""}`;
    const groundY = -1.08 + groundHeight(x, z);
    rock.position.set(x, groundY + scale * (buried ? 0.3 : 0.72), z);
    rock.rotation.set(
      -0.08 + hash2(seed, 3) * 0.22,
      hash2(seed, 7) * Math.PI,
      -0.08 + hash2(seed, 11) * 0.22
    );
    rock.scale.set(
      scale * (1.02 + hash2(seed, 19) * 0.26),
      scale * (0.84 + hash2(seed, 23) * 0.24),
      scale * (0.94 + hash2(seed, 29) * 0.22)
    );

    const bodyMaterial = type === "basalt"
      ? materials.rockBasalt
      : type === "breccia"
        ? materials.rockBreccia
        : buried ? materials.rockDust : materials.rockBasaltLight;
    const body = new THREE.Mesh(createRockGeometry(type === "small" ? "small" : type, seed), bodyMaterial);
    body.castShadow = type !== "small" || scale > 0.3;
    body.receiveShadow = type !== "small" || scale > 0.22;
    rock.add(body);

    if (type === "basalt") {
      addRockCavities(rock, scale, seed, scale > 0.85 ? 3 : 1);
      if (scale > 1.05) addRockFractures(rock, seed, scale);
    } else if (type === "breccia") {
      addBrecciaFragments(rock, seed, scale);
      addRockFractures(rock, seed + 18, scale);
    } else if (type === "boulder") {
      addRockCavities(rock, scale, seed, 3);
      addRockFractures(rock, seed, scale);
      const brokenShoulder = new THREE.Mesh(createRockGeometry("basalt", seed + 46), materials.rockEdge);
      brokenShoulder.position.set(-0.22, 0.34, -0.12);
      brokenShoulder.scale.set(0.72, 0.35, 0.58);
      brokenShoulder.rotation.set(0.2, 0.7, -0.12);
      brokenShoulder.castShadow = true;
      rock.add(brokenShoulder);
      for (let index = 0; index < 2; index += 1) {
        const fragment = new THREE.Mesh(createRockGeometry("small", seed + index + 70), materials.rockBasalt);
        fragment.position.set(-0.68 + hash2(seed, index + 74) * 1.2, -0.22 + hash2(seed, index + 78) * 0.12, -0.46 + hash2(seed, index + 83) * 0.86);
        fragment.scale.setScalar(0.16 + hash2(seed, index + 61) * 0.2);
        fragment.rotation.set(hash2(seed, index + 86), hash2(seed, index + 90) * Math.PI, hash2(seed, index + 95));
        fragment.castShadow = true;
        rock.add(fragment);
      }
    } else if (type === "small" && scale > 0.32) {
      addRockCavities(rock, scale, seed, 1);
    }

    if (buried) {
      const dust = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.02, 0.055, 12), materials.groundDust);
      dust.position.set(0, -scale * 0.27, 0);
      dust.scale.set(1.1 + hash2(seed, 126) * 0.3, 1, 0.8 + hash2(seed, 129) * 0.28);
      dust.rotation.y = hash2(seed, 132) * Math.PI;
      dust.receiveShadow = true;
      rock.add(dust);
      for (let index = 0; index < 2; index += 1) {
        const dustClump = new THREE.Mesh(createRockGeometry("small", seed + index + 180), materials.rockDust);
        dustClump.position.set(-0.42 + hash2(seed, index + 136) * 0.84, -0.2 + hash2(seed, index + 139) * 0.08, -0.4 + hash2(seed, index + 142) * 0.78);
        dustClump.scale.setScalar(0.08 + hash2(seed, index + 145) * 0.09);
        dustClump.castShadow = true;
        rock.add(dustClump);
      }
    }

    if (collidable) {
      addCollider(`authentic-${type}-${seed}`, [x, z], [scale * 0.74, scale * 0.68], {
        maxY: groundY + scale * 1.62
      });
    }
    root.add(rock);
    return rock;
  }

  function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function roundedRectPath(width, height, radius) {
    const shape = new THREE.Shape();
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    shape.moveTo(-halfWidth + radius, -halfHeight);
    shape.lineTo(halfWidth - radius, -halfHeight);
    shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
    shape.lineTo(halfWidth, halfHeight - radius);
    shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
    shape.lineTo(-halfWidth + radius, halfHeight);
    shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
    shape.lineTo(-halfWidth, -halfHeight + radius);
    shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
    return shape;
  }

  function addPortalFrame(parent, width, height, radius, frameWidth, material, z) {
    const frame = roundedRectPath(width, height, radius);
    frame.holes.push(roundedRectPath(
      width - frameWidth * 2,
      height - frameWidth * 2,
      Math.max(0.06, radius - frameWidth * 0.35)
    ));
    const geometry = new THREE.ExtrudeGeometry(frame, {
      depth: 0.075,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 2
    });
    return addMesh(parent, geometry, material, [0, 0, z]);
  }

  function addCollider(name, center, halfExtents, options = {}) {
    signal.collisionObjects.push({
      name,
      center,
      halfExtents,
      minY: options.minY ?? -1.08,
      maxY: options.maxY ?? Number.POSITIVE_INFINITY,
      enabled: options.enabled ?? true
    });
  }

  function updateGateDoorColliders(door) {
    if (!door?.colliders || !door.group) return;
    const cos = Math.cos(door.group.rotation.y);
    const sin = Math.sin(door.group.rotation.y);
    door.colliders.forEach((collider, index) => {
      const side = index === 0 ? -1 : 1;
      const localX = side * (0.42 + door.open * 0.72);
      const localZ = 0.32;
      collider.center[0] = (door.origin?.[0] || 0) + door.group.position.x + localX * cos + localZ * sin;
      collider.center[1] = (door.origin?.[1] || 0) + door.group.position.z - localX * sin + localZ * cos;
      collider.halfExtents[0] = 0.4 * Math.abs(cos) + 0.12 * Math.abs(sin);
      collider.halfExtents[1] = 0.4 * Math.abs(sin) + 0.12 * Math.abs(cos);
      collider.enabled = door.open < 0.97;
    });
  }

  function createGateColliders(gate, door, id, origin = [0, 0]) {
    const cos = Math.cos(gate.rotation.y);
    const sin = Math.sin(gate.rotation.y);
    const originX = origin[0] + gate.position.x;
    const originZ = origin[1] + gate.position.z;
    const addGateStaticCollider = (name, localX, localZ, halfX, halfZ, maxY = Number.POSITIVE_INFINITY) => {
      addCollider(`${id}-${name}`, [
        originX + localX * cos + localZ * sin,
        originZ - localX * sin + localZ * cos
      ], [halfX * Math.abs(cos) + halfZ * Math.abs(sin), halfX * Math.abs(sin) + halfZ * Math.abs(cos)], { maxY });
    };
    addGateStaticCollider("left-pillar", -1.35, 0, 0.18, 0.28);
    addGateStaticCollider("right-pillar", 1.35, 0, 0.18, 0.28);
    door.group = gate;
    door.origin = origin;
    door.colliders = [
      { name: `${id}-left-door`, center: [0, 0], halfExtents: [0.4, 0.12], minY: -1.08, maxY: Number.POSITIVE_INFINITY, enabled: true },
      { name: `${id}-right-door`, center: [0, 0], halfExtents: [0.4, 0.12], minY: -1.08, maxY: Number.POSITIVE_INFINITY, enabled: true }
    ];
    signal.collisionObjects.push(...door.colliders);
    updateGateDoorColliders(door);
  }

  function createObjectiveArrow(parent, position, id) {
    const arrow = new THREE.Group();
    arrow.name = `${id}-objective-arrow`;
    arrow.position.set(...position);
    const arrowCyan = new THREE.MeshBasicMaterial({ color: 0x43eaff });
    const arrowGold = new THREE.MeshBasicMaterial({ color: 0xffd36f });
    const beamMaterial = new THREE.MeshBasicMaterial({ color: 0x43eaff, transparent: true, opacity: 0.34 });
    addMesh(arrow, new THREE.BoxGeometry(0.14, 0.72, 0.14), arrowCyan, [0, 0.3, 0]);
    addMesh(arrow, new THREE.ConeGeometry(0.36, 0.62, 4), arrowGold, [0, -0.32, 0], [Math.PI, 0, 0]);
    addMesh(arrow, new THREE.TorusGeometry(0.56, 0.035, 8, 24), arrowCyan, [0, -0.72, 0], [Math.PI / 2, 0, 0]);
    addMesh(arrow, new THREE.CylinderGeometry(0.035, 0.035, 2.1, 8), beamMaterial, [0, -1.72, 0]);
    const light = new THREE.PointLight(colors.cyan, 1.8, 3.2, 2);
    light.position.set(0, -0.08, 0.12);
    arrow.add(light);
    parent.add(arrow);
    signal.gateArrows.push({ id, object: arrow, baseY: position[1], light });
    return arrow;
  }

  function createBaseLabel(text) {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 760;
    canvas.height = 190;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(9, 19, 42, 0.84)";
    context.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.strokeStyle = "rgba(93, 219, 255, 0.9)";
    context.lineWidth = 6;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.fillStyle = "#f2f8ff";
    context.font = "800 66px Orbitron, Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(text).toUpperCase().replace(/\s+/g, " "), canvas.width / 2, canvas.height / 2 + 4);
    return canvas;
  }

  function addMissionLabel(parent, text, position, width = 1.35, height = 0.42) {
    const labelCanvas = createBaseLabel(text);
    if (!labelCanvas) return;
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    signal.missionLabelTextures.push(labelTexture);
    const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false });
    addMesh(parent, new THREE.PlaneGeometry(width, height), labelMaterial, position);
  }

  function registerInteractive(group, {
    id, name, description, day, radius = 2.35, position = null, collidable = true
  }) {
    const worldPosition = position || [group.position.x, group.position.z];
    const haloMaterial = new THREE.MeshBasicMaterial({ color: colors.cyan, transparent: true, opacity: 0.78 });
    const halo = addMesh(group, new THREE.TorusGeometry(0.68, 0.035, 8, 28), haloMaterial,
      [0, -group.position.y - 0.86, 0], [Math.PI / 2, 0, 0]);
    halo.visible = false;
    group.userData.interactiveId = id;
    group.userData.interactionHalo = halo;
    group.userData.interactionName = name;
    group.userData.interactionDescription = description;
    signal.interactiveObjects.push({ id, name, description, day, radius, position: worldPosition, object: group });
    if (collidable) addCollider(`${id}-station`, worldPosition, [0.78, 0.62]);
  }

  function createStars() {
    const geometry = new THREE.BufferGeometry();
    const count = 920;
    const positions = new Float32Array(count * 3);
    const starColors = new Float32Array(count * 3);
    const starPalette = [new THREE.Color(0xf7f4e9), new THREE.Color(0xdbe6f0), new THREE.Color(0xffffff)];
    for (let index = 0; index < count; index += 1) {
      // Deterministic low-density placement keeps the sky quiet and avoids a
      // repeated loading pattern while still giving the camera a natural,
      // non-grid distribution of stars.
      const radius = 34 + hash2(index, 601) * 42;
      const theta = hash2(index, 607) * Math.PI * 2;
      const y = 2.8 + hash2(index, 613) * 43;
      positions[index * 3] = Math.cos(theta) * radius;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = Math.sin(theta) * radius - 18;
      const color = starPalette[Math.floor(hash2(index, 619) * starPalette.length)];
      const brightness = 0.52 + hash2(index, 625) * 0.42;
      starColors[index * 3] = color.r * brightness;
      starColors[index * 3 + 1] = color.g * brightness;
      starColors[index * 3 + 2] = color.b * brightness;
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));
    const material = new THREE.PointsMaterial({ vertexColors: true, size: 0.052, transparent: true, opacity: 0.78, sizeAttenuation: true, depthWrite: false });
    signal.stars = new THREE.Points(geometry, material);
    signal.stars.name = "star-field";
    root.add(signal.stars);
  }

  function createGround() {
    // The height field is the primary lunar surface. A dense grid keeps the
    // crater walls, floors, broad highlands, and small regolith undulations
    // visible from the third-person camera instead of reducing them to props.
    const geometry = new THREE.PlaneGeometry(WORLD.size, WORLD.size, 192, 192);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.attributes.position;
    const groundColors = new Float32Array(position.count * 3);
    const baseGround = new THREE.Color(colors.ground);
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index) + WORLD.centerZ;
      const height = groundHeight(x, z);
      position.setY(index, height);
      // Relate vertex tone to relief as well as deterministic mineral
      // variation so ridges catch sunlight and crater floors stay visually
      // distinct without an artificial painted ring.
      const reliefTone = Math.max(-0.08, Math.min(0.1, height * 0.035));
      const variation = 0.86 + hash2(x * 2.7, z * 3.1) * 0.24 + reliefTone;
      groundColors[index * 3] = Math.min(1, baseGround.r * variation + 0.015);
      groundColors[index * 3 + 1] = Math.min(1, baseGround.g * variation + 0.012);
      groundColors[index * 3 + 2] = Math.min(1, baseGround.b * variation + 0.008);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(groundColors, 3));
    geometry.computeVertexNormals();
    addMesh(root, geometry, materials.ground, [0, -1.08, WORLD.centerZ]);

    const underlay = addMesh(root, new THREE.PlaneGeometry(WORLD.size * 0.98, WORLD.size * 0.98), materials.groundDark,
      [0, -1.105, WORLD.centerZ], [-Math.PI / 2, 0, 0], [1, 0.86, 1]);
    underlay.material.opacity = 0.16;

    // Craters are stamped into groundHeight(), so these anchors are only used
    // to distribute ejecta rocks and fragments around the already-displaced
    // surface. No bowl or ring is placed over the ground anymore.
    const craterAnchors = terrainCraters;
    const clearZones = [
      [0, -3.8, 7.6],
      [missionLocations.solar.x, missionLocations.solar.z, 3.3],
      [missionLocations.water.x, missionLocations.water.z, 3.2],
      [missionLocations.grow.x, missionLocations.grow.z, 3.2],
      [missionLocations.storm.x, missionLocations.storm.z, 3.4],
      [-10.5, -10.5, 3.0],
      [11.8, -13.8, 3.0],
      [-12.8, -23.5, 3.0]
    ];
    const traversalSegments = [
      [0, 0.1, 0, -10.5],
      [0, -10.5, -10.5, -10.5],
      [-10.5, -10.5, 11.8, -13.8],
      [11.8, -13.8, -12.8, -23.5]
    ];
    const distanceToSegment = (x, z, x1, z1, x2, z2) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const lengthSquared = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / lengthSquared));
      const closestX = x1 + t * dx;
      const closestZ = z1 + t * dz;
      return Math.hypot(x - closestX, z - closestZ);
    };
    const isClearForPlayer = (x, z, padding = 0) => {
      if (clearZones.some(([zoneX, zoneZ, radius]) => Math.hypot(x - zoneX, z - zoneZ) < radius + padding)) return true;
      return traversalSegments.some(([x1, z1, x2, z2]) => distanceToSegment(x, z, x1, z1, x2, z2) < 2.2 + padding);
    };

    // Large boulders stay on the outer perimeter so the base remains easy to
    // navigate. Their low-poly silhouettes and fractured shoulders are the
    // scene's strongest Apollo-inspired rock landmarks.
    const perimeterBoulders = [
      [-32.2, -30.4, 2.75], [29.5, -31.8, 3.1], [-31.0, -8.0, 2.35],
      [30.8, -5.0, 2.6], [-25.5, 12.4, 2.5], [24.5, 13.8, 2.2],
      [-20.8, -25.4, 2.7], [19.8, -24.8, 2.85], [-2.5, -34.0, 2.45],
      [-1.8, 17.2, 2.1], [9.4, 22.0, 2.35], [-27.2, -21.4, 2.4]
    ];
    perimeterBoulders.forEach(([x, z, scale], index) => createAuthenticRock({
      x, z, scale, seed: 100 + index, type: "boulder", collidable: true
    }));

    // Medium basalt and breccia form uneven natural bands around, rather than
    // across, the traversal lanes. A deterministic hash keeps every load the
    // same while still giving the field a non-grid, non-repeating rhythm.
    let mediumPlaced = 0;
    for (let index = 0; index < 72 && mediumPlaced < 24; index += 1) {
      const x = -34 + hash2(index, 171) * 68;
      const z = -34 + hash2(index, 179) * 62;
      const scale = 0.58 + hash2(index, 183) * 0.48;
      if (isClearForPlayer(x, z, scale * 0.7)) continue;
      createAuthenticRock({
        x,
        z,
        scale,
        seed: 300 + index,
        type: index % 3 === 0 ? "breccia" : "basalt",
        collidable: scale > 0.75
      });
      mediumPlaced += 1;
    }

    // Small angular rocks are scattered over open regolith and in pairs near
    // crater rims. They carry no collider, preserving movement and jumps.
    let smallPlaced = 0;
    for (let index = 0; index < 120 && smallPlaced < 52; index += 1) {
      const x = -34 + hash2(index, 271) * 68;
      const z = -34 + hash2(index, 279) * 62;
      const scale = 0.11 + hash2(index, 283) * 0.42;
      if (isClearForPlayer(x, z, 0.55)) continue;
      createAuthenticRock({ x, z, scale, seed: 500 + index, type: "small" });
      smallPlaced += 1;
    }

    let buriedPlaced = 0;
    craterAnchors.forEach((crater, index) => {
      if (buriedPlaced >= 10 || isClearForPlayer(crater.x, crater.z, 1.2)) return;
      const offset = crater.radius * (0.72 + hash2(index, 301) * 0.4);
      const angle = hash2(index, 305) * Math.PI * 2;
      const x = crater.x + Math.cos(angle) * offset;
      const z = crater.z + Math.sin(angle) * offset;
      createAuthenticRock({
        x,
        z,
        scale: 0.34 + hash2(index, 309) * 0.38,
        seed: 700 + index,
        type: index % 2 === 0 ? "breccia" : "basalt",
        buried: true
      });
      buriedPlaced += 1;
    });

    for (let index = 0; index < craterAnchors.length; index += 6) {
      const crater = craterAnchors[index];
      for (let fragment = 0; fragment < 2; fragment += 1) {
        const angle = hash2(index, fragment + 321) * Math.PI * 2;
        const distance = crater.radius * (1.12 + hash2(index, fragment + 327) * 0.7);
        const x = crater.x + Math.cos(angle) * distance;
        const z = crater.z + Math.sin(angle) * distance;
        if (isClearForPlayer(x, z, 0.3)) continue;
        createAuthenticRock({ x, z, scale: 0.13 + hash2(index, fragment + 333) * 0.18, seed: 820 + index * 2 + fragment, type: "small" });
      }
    }

    const regolithGeometry = new THREE.BufferGeometry();
    const regolithPositions = [];
    const regolithColors = [];
    for (let index = 0; index < 240; index += 1) {
      const x = -36 + hash2(index, 401) * 72;
      const z = -38 + hash2(index, 409) * 68;
      regolithPositions.push(x, -1.065 + groundHeight(x, z), z);
      const light = 0.46 + hash2(index, 413) * 0.26;
      regolithColors.push(light + 0.04, light + 0.02, light);
    }
    regolithGeometry.setAttribute("position", new THREE.Float32BufferAttribute(regolithPositions, 3));
    regolithGeometry.setAttribute("color", new THREE.Float32BufferAttribute(regolithColors, 3));
    const regolith = new THREE.Points(regolithGeometry, new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.68,
      sizeAttenuation: true
    }));
    regolith.name = "lunar-regolith-grains";
    root.add(regolith);
  }

  function createEarth() {
    const group = new THREE.Group();
    // From the lunar surface Earth is a small, bright disk—not a nearby
    // planet-sized prop. Keep it high in the black sky and far behind the
    // base so it reads as a distant celestial body.
    group.position.set(-5.5, 8.1, -30);
    group.scale.setScalar(0.42);
    group.rotation.z = -0.16;
    signal.earth = group;
    const earthMaterial = new THREE.MeshStandardMaterial({ color: colors.earth, roughness: 0.88, metalness: 0 });
    addMesh(group, new THREE.SphereGeometry(1.2, 32, 20), earthMaterial);

    const landMaterial = new THREE.MeshStandardMaterial({ color: colors.land, transparent: true, opacity: 0.74, roughness: 0.96, metalness: 0 });
    const land = new THREE.Group();
    land.rotation.set(0.3, -0.2, 0.15);
    addMesh(land, new THREE.SphereGeometry(1.215, 20, 12, 0, Math.PI * 0.56, Math.PI * 0.18, Math.PI * 0.32), landMaterial);
    group.add(land);

    // Keep clouds white and extremely restrained; there is no neon halo or
    // atmospheric ring around the Moon itself.
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xe5e6df, transparent: true, opacity: 0.13, roughness: 1, depthWrite: false });
    signal.earthClouds = addMesh(group, new THREE.SphereGeometry(1.235, 24, 16), cloudMaterial);
    root.add(group);
  }

  function createHorizon() {
    const horizon = new THREE.Group();
    horizon.name = "lunar-horizon-ridges";
    // Build distant highlands from displaced ridge meshes rather than scaled
    // spheres. Their broken silhouettes extend the same geological language as
    // the playable height field and make the horizon feel genuinely elevated.
    const ridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x4c4a47, roughness: 1, metalness: 0, flatShading: true });
    const ridgePositions = [
      [0, -40, 28, 8.2, 3.5, 601], [-25, -38, 20, 7.2, 2.9, 607],
      [27, -37, 19, 7.4, 3.1, 613]
    ];
    ridgePositions.forEach(([x, z, width, depth, height, seed], index) => {
      const ridgeGeometry = new THREE.PlaneGeometry(width, depth, 18, 6);
      ridgeGeometry.rotateX(-Math.PI / 2);
      const ridgePosition = ridgeGeometry.attributes.position;
      for (let vertex = 0; vertex < ridgePosition.count; vertex += 1) {
        const localX = ridgePosition.getX(vertex);
        const localZ = ridgePosition.getZ(vertex);
        const across = Math.max(0, 1 - Math.abs(localX / Math.max(0.1, width * 0.5)));
        const depthProfile = 0.62 + Math.cos((localZ / Math.max(0.1, depth)) * Math.PI) * 0.24;
        const broken = 0.78 + valueNoise(localX * 0.24 + seed, localZ * 0.34 - seed) * 0.46;
        ridgePosition.setY(vertex, height * Math.pow(across, 0.68) * depthProfile * broken);
      }
      ridgeGeometry.computeVertexNormals();
      const ridge = addMesh(horizon, ridgeGeometry, ridgeMaterial,
        [x, -1.08 + groundHeight(x, z) + 0.1, z], [0, (index - 2) * 0.12, 0]);
      ridge.castShadow = false;
      ridge.receiveShadow = true;
    });
    root.add(horizon);
  }

  function createBase() {
    const base = new THREE.Group();
    base.name = "moon-base";
    base.position.set(0, 0, -3.8);

    // Main habitat hull: a broad front-facing module gives the outpost the
    // silhouette of the reference scene while the dome remains interactive.
    addMesh(base, new THREE.BoxGeometry(5.7, 1.28, 1.72), materials.hull, [0, 0.12, 0.15]);
    addMesh(base, new THREE.BoxGeometry(5.45, 0.12, 1.58), materials.hullShadow, [0, 0.77, 0.15]);
    addMesh(base, new THREE.BoxGeometry(5.32, 0.07, 0.07), materials.orange, [0, 0.52, 0.77]);
    addMesh(base, new THREE.BoxGeometry(5.32, 0.07, 0.07), materials.orange, [0, -0.24, 0.77]);
    for (const x of [-2.05, -1.35, 1.35, 2.05]) {
      addMesh(base, new THREE.BoxGeometry(0.42, 0.2, 0.05), materials.cyan, [x, 0.21, 0.89]);
    }
    const entrance = new THREE.Group();
    // Pull the whole airlock clearly in front of the hull so the facade can
    // never occlude the door or its sign at the opening camera angle.
    // The habitat platform is circular and reaches far toward the camera.
    // Place the airlock beyond that front edge so no hull piece can cover it.
    entrance.position.set(0, 0.08, 3.28);
    // The large portal is the visual anchor of the outpost: an illuminated
    // cyan outer frame, warm orange safety trim, and a recessed airlock door.
    addMesh(entrance, new THREE.BoxGeometry(2.35, 2.22, 0.24), materials.hullShadow, [0, 0, 0]);
    addMesh(entrance, new THREE.ShapeGeometry(roundedRectPath(1.74, 1.82, 0.2)), materials.dark, [0, 0.02, 0.15]);
    addMesh(entrance, new THREE.BoxGeometry(1.68, 1.76, 0.07), materials.dark, [0, 0, 0.27]);
    const leftDoor = addMesh(entrance, new THREE.BoxGeometry(0.78, 1.68, 0.04), materials.panelBlue, [-0.42, 0, 0.32]);
    const rightDoor = addMesh(entrance, new THREE.BoxGeometry(0.78, 1.68, 0.04), materials.panelBlue, [0.42, 0, 0.32]);
    addMesh(entrance, new THREE.BoxGeometry(0.035, 1.62, 0.045), materials.orange, [0, 0, 0.36]);
    addMesh(entrance, new THREE.BoxGeometry(0.1, 0.38, 0.05), materials.warm, [-0.66, 0, 0.38]);
    addMesh(entrance, new THREE.BoxGeometry(0.1, 0.38, 0.05), materials.warm, [0.66, 0, 0.38]);
    addPortalFrame(entrance, 2.35, 2.2, 0.3, 0.12, materials.cyan, 0.22);
    addPortalFrame(entrance, 2.08, 1.98, 0.24, 0.08, materials.orange, 0.3);
    addMesh(entrance, new THREE.BoxGeometry(0.28, 0.07, 0.05), materials.warm, [0, 0.76, 0.4]);
    const doorLight = new THREE.PointLight(colors.cyan, 1.2, 3.2, 2);
    doorLight.position.set(0, 0.05, 0.62);
    entrance.add(doorLight);
    signal.entryDoor = { left: leftDoor, right: rightDoor, light: doorLight, open: 0, target: 0 };
    createGateColliders(entrance, signal.entryDoor, "moonbase-entry", [base.position.x, base.position.z]);
    base.add(entrance);
    createObjectiveArrow(base, [0, 3.25, 3.42], "moonbase-one");

    // A visible landing step makes the entrance read as a door rather than a
    // window and gives the player a physical approach point.
    addMesh(base, new THREE.BoxGeometry(2.2, 0.1, 0.46), materials.dark, [0, -0.97, 3.02]);
    addMesh(base, new THREE.BoxGeometry(1.8, 0.08, 0.3), materials.hullShadow, [0, -0.88, 2.86]);
    const entranceGlow = new THREE.PointLight(colors.orange, 2.2, 5.2, 2);
    entranceGlow.position.set(0, 0.18, 3.68);
    base.add(entranceGlow);

    const labelCanvas = createBaseLabel("MOONBASE 1");
    if (labelCanvas) {
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      signal.baseLabelTexture = labelTexture;
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false });
      // Keep the sign entirely clear of the wide airlock frame so the first
      // letter of MOONBASE cannot be hidden by the doorway.
      addMesh(base, new THREE.PlaneGeometry(1.72, 0.5), labelMaterial, [2.05, 0.55, 3.58]);
    }
    addMissionLabel(base, "SOLAR", [-2.05, 0.55, 3.58]);

    registerInteractive(entrance, {
      id: "moonbase-entry",
      name: "MoonBase 1 airlock",
      description: "Fly to the illuminated door and press E to begin Mission Day 1.",
      day: 1,
      radius: 1.45,
      position: [base.position.x + entrance.position.x, base.position.z + entrance.position.z],
      collidable: false
    });

    addMesh(base, new THREE.CylinderGeometry(2.55, 2.8, 0.9, 24), materials.base, [0, -0.35, 0]);
    addMesh(base, new THREE.SphereGeometry(2.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), materials.dome, [0, 0.76, 0.12]);
    addMesh(base, new THREE.TorusGeometry(2.18, 0.08, 8, 32), materials.cyan, [0, 0.18, 0], [Math.PI / 2, 0, 0]);
    addMesh(base, new THREE.TorusGeometry(2.16, 0.028, 6, 32), materials.hull, [0, 0.76, 0.12], [Math.PI / 2, 0, 0]);
    for (let index = -2; index <= 2; index += 1) {
      const rib = addMesh(base, new THREE.TorusGeometry(2.08, 0.018, 5, 24), materials.hullShadow,
        [0, 0.76, 0.12], [Math.PI / 2, index * 0.33, 0]);
      rib.scale.set(1, 0.72, 1);
    }
    addMesh(base, new THREE.CylinderGeometry(0.62, 0.78, 0.4, 16), materials.dark, [0, 1.83, 0]);
    addMesh(base, new THREE.SphereGeometry(0.72, 16, 8), materials.cyan, [0, 2.05, 0]);

    for (const [x, height, z] of [[2.35, 2.25, 0.1], [3.08, 1.62, 0.38], [-2.7, 1.52, 0.2]]) {
      const tower = new THREE.Group();
      tower.position.set(x, 0.72, z);
      addMesh(tower, new THREE.BoxGeometry(0.58, height, 0.58), materials.hullShadow, [0, 0, 0]);
      addMesh(tower, new THREE.BoxGeometry(0.42, 0.12, 0.06), materials.cyan, [0, 0.16, -0.31]);
      addMesh(tower, new THREE.CylinderGeometry(0.025, 0.025, 0.72, 8), materials.dark, [0, height / 2 + 0.45, 0]);
      addMesh(tower, new THREE.SphereGeometry(0.07, 8, 6), materials.orange, [0, height / 2 + 0.84, 0]);
      base.add(tower);
    }

    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const window = addMesh(base, new THREE.BoxGeometry(0.34, 0.18, 0.06), index % 3 === 0 ? materials.warm : materials.cyan,
        [Math.cos(angle) * 2.33, 0.18, Math.sin(angle) * 2.33], [0, -angle, 0]);
      signal.baseLights.push(window.material);
    }

    for (let index = 0; index < 3; index += 1) {
      const module = new THREE.Group();
      const angle = index * (Math.PI * 2 / 3) + 0.28;
      module.position.set(Math.cos(angle) * 2.25, -0.37, Math.sin(angle) * 2.25);
      module.rotation.y = -angle;
      addMesh(module, new THREE.BoxGeometry(1.18, 0.84, 1.18), materials.base, [0, 0, 0]);
      addMesh(module, new THREE.BoxGeometry(0.78, 0.18, 0.06), materials.violet, [0, 0.08, -0.62]);
      const waterIndicator = addMesh(module, new THREE.BoxGeometry(0.14, 0.1, 0.045), materials.cyan, [0.38, 0.28, -0.62]);
      signal.waterLights.push(waterIndicator.material);
      base.add(module);
    }

    signal.antenna = new THREE.Group();
    signal.antenna.position.set(1.38, 2.05, 0.3);
    addMesh(signal.antenna, new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), materials.dark, [0, 0.4, 0]);
    addMesh(signal.antenna, new THREE.SphereGeometry(0.09, 8, 6), materials.warm, [0, 0.88, 0]);
    base.add(signal.antenna);

    signal.baseGlow = new THREE.PointLight(colors.cyan, 3.6, 8, 1.8);
    signal.baseGlow.position.set(0, 1.6, 0.8);
    base.add(signal.baseGlow);
    root.add(base);
    // Leave the central airlock corridor open so the player can physically
    // approach and enter MoonBase 1 instead of stopping at an invisible wall.
    addCollider("habitat-left", [-2, -3.8], [1.2, 3.35]);
    addCollider("habitat-right", [2, -3.8], [1.2, 3.35]);
    addCollider("habitat-hull", [0, -3.8], [3.05, 0.92]);
  }

  function createMoonBaseTwoGate() {
    const gate = new THREE.Group();
    gate.name = "moonbase-two-gate";
    gate.position.set(-10.5, 0.08, -10.5);
    gate.rotation.y = 0.14;

    // Standalone day-two airlock: same MoonBase language, but placed away
    // from the main habitat so it reads as a second lunar destination.
    addMesh(gate, new THREE.BoxGeometry(2.35, 2.22, 0.24), materials.hullShadow, [0, 0, 0]);
    addMesh(gate, new THREE.ShapeGeometry(roundedRectPath(1.74, 1.82, 0.2)), materials.dark, [0, 0.02, 0.15]);
    addMesh(gate, new THREE.BoxGeometry(1.68, 1.76, 0.07), materials.dark, [0, 0, 0.27]);
    const leftDoor = addMesh(gate, new THREE.BoxGeometry(0.78, 1.68, 0.04), materials.panelBlue, [-0.42, 0, 0.32]);
    const rightDoor = addMesh(gate, new THREE.BoxGeometry(0.78, 1.68, 0.04), materials.panelBlue, [0.42, 0, 0.32]);
    addMesh(gate, new THREE.BoxGeometry(0.035, 1.62, 0.045), materials.orange, [0, 0, 0.36]);
    addMesh(gate, new THREE.BoxGeometry(0.1, 0.38, 0.05), materials.warm, [-0.66, 0, 0.38]);
    addMesh(gate, new THREE.BoxGeometry(0.1, 0.38, 0.05), materials.warm, [0.66, 0, 0.38]);
    addPortalFrame(gate, 2.35, 2.2, 0.3, 0.12, materials.cyan, 0.22);
    addPortalFrame(gate, 2.08, 1.98, 0.24, 0.08, materials.orange, 0.3);
    addMesh(gate, new THREE.BoxGeometry(0.28, 0.07, 0.05), materials.warm, [0, 0.76, 0.4]);

    // Full foundation slab anchors the gate to the lunar surface instead of
    // leaving it visually suspended above the terrain.
    addMesh(gate, new THREE.BoxGeometry(4.2, 0.18, 2.55), materials.base, [0, -1.02, 0.28]);
    addMesh(gate, new THREE.BoxGeometry(3.86, 0.06, 2.2), materials.hullShadow, [0, -0.9, 0.28]);
    addMesh(gate, new THREE.BoxGeometry(3.92, 0.05, 0.07), materials.cyan, [0, -0.85, -0.82]);
    addMesh(gate, new THREE.BoxGeometry(3.92, 0.05, 0.07), materials.orange, [0, -0.85, 1.38]);
    addMesh(gate, new THREE.RingGeometry(1.15, 1.22, 40), materials.cyan, [0, -0.84, 0.38], [-Math.PI / 2, 0, 0]);
    addMesh(gate, new THREE.BoxGeometry(2.2, 0.1, 0.46), materials.dark, [0, -0.97, 0.18]);
    addMesh(gate, new THREE.BoxGeometry(1.8, 0.08, 0.3), materials.hullShadow, [0, -0.88, 0.02]);
    for (const x of [-1.35, 1.35]) {
      addMesh(gate, new THREE.BoxGeometry(0.18, 2.1, 0.2), materials.base, [x, 0.08, 0]);
      addMesh(gate, new THREE.BoxGeometry(0.12, 0.18, 0.05), materials.cyan, [x, 0.7, 0.16]);
      addMesh(gate, new THREE.SphereGeometry(0.08, 8, 6), materials.orange, [x, 1.25, 0.12]);
    }

    const labelCanvas = createBaseLabel("MOONBASE 2");
    if (labelCanvas) {
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      signal.secondaryLabelTexture = labelTexture;
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false });
      addMesh(gate, new THREE.PlaneGeometry(1.5, 0.5), labelMaterial, [1.9, 0.55, 0.62]);
    }
    addMissionLabel(gate, "WATER", [-1.9, 0.55, 0.62]);

    const glow = new THREE.PointLight(colors.cyan, 2.4, 5.2, 2);
    glow.position.set(0, 0.2, 0.76);
    gate.add(glow);
    signal.dayGateDoor = { id: "moonbase-two-entry", left: leftDoor, right: rightDoor, light: glow, open: 0, target: 0 };
    createGateColliders(gate, signal.dayGateDoor, "moonbase-two-entry");
    root.add(gate);
    signal.dayGate = gate;
    createObjectiveArrow(gate, [0, 3.25, 0.42], "moonbase-two");

    registerInteractive(gate, {
      id: "moonbase-two-entry",
      name: "MoonBase 2 gate",
      description: "Enter the illuminated MoonBase 2 airlock to begin Mission Day 2.",
      day: 2,
      radius: 2.2,
      position: [gate.position.x, gate.position.z],
      collidable: false
    });
  }

  function createMoonBaseThreeGate() {
    const gate = new THREE.Group();
    gate.name = "moonbase-three-gate";
    gate.position.set(11.8, 0.08, -13.8);
    gate.rotation.y = -0.16;

    // Day-three airlock: the same readable illuminated doorway language as
    // MoonBase 1 and 2, with its own foundation and destination marker.
    addMesh(gate, new THREE.BoxGeometry(2.35, 2.22, 0.24), materials.hullShadow, [0, 0, 0]);
    addMesh(gate, new THREE.ShapeGeometry(roundedRectPath(1.74, 1.82, 0.2)), materials.dark, [0, 0.02, 0.15]);
    addMesh(gate, new THREE.BoxGeometry(1.68, 1.76, 0.07), materials.dark, [0, 0, 0.27]);
    const leftDoor = addMesh(gate, new THREE.BoxGeometry(0.78, 1.68, 0.04), materials.panelBlue, [-0.42, 0, 0.32]);
    const rightDoor = addMesh(gate, new THREE.BoxGeometry(0.78, 1.68, 0.04), materials.panelBlue, [0.42, 0, 0.32]);
    addMesh(gate, new THREE.BoxGeometry(0.035, 1.62, 0.045), materials.orange, [0, 0, 0.36]);
    addMesh(gate, new THREE.BoxGeometry(0.1, 0.38, 0.05), materials.warm, [-0.66, 0, 0.38]);
    addMesh(gate, new THREE.BoxGeometry(0.1, 0.38, 0.05), materials.warm, [0.66, 0, 0.38]);
    addPortalFrame(gate, 2.35, 2.2, 0.3, 0.12, materials.cyan, 0.22);
    addPortalFrame(gate, 2.08, 1.98, 0.24, 0.08, materials.orange, 0.3);
    addMesh(gate, new THREE.BoxGeometry(0.28, 0.07, 0.05), materials.warm, [0, 0.76, 0.4]);

    addMesh(gate, new THREE.BoxGeometry(4.2, 0.18, 2.55), materials.base, [0, -1.02, 0.28]);
    addMesh(gate, new THREE.BoxGeometry(3.86, 0.06, 2.2), materials.hullShadow, [0, -0.9, 0.28]);
    addMesh(gate, new THREE.BoxGeometry(3.92, 0.05, 0.07), materials.cyan, [0, -0.85, -0.82]);
    addMesh(gate, new THREE.BoxGeometry(3.92, 0.05, 0.07), materials.orange, [0, -0.85, 1.38]);
    addMesh(gate, new THREE.RingGeometry(1.15, 1.22, 40), materials.cyan, [0, -0.84, 0.38], [-Math.PI / 2, 0, 0]);
    addMesh(gate, new THREE.BoxGeometry(2.2, 0.1, 0.46), materials.dark, [0, -0.97, 0.18]);
    addMesh(gate, new THREE.BoxGeometry(1.8, 0.08, 0.3), materials.hullShadow, [0, -0.88, 0.02]);
    for (const x of [-1.35, 1.35]) {
      addMesh(gate, new THREE.BoxGeometry(0.18, 2.1, 0.2), materials.base, [x, 0.08, 0]);
      addMesh(gate, new THREE.BoxGeometry(0.12, 0.18, 0.05), materials.cyan, [x, 0.7, 0.16]);
      addMesh(gate, new THREE.SphereGeometry(0.08, 8, 6), materials.orange, [x, 1.25, 0.12]);
    }

    const labelCanvas = createBaseLabel("MOONBASE 3");
    if (labelCanvas) {
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false });
      addMesh(gate, new THREE.PlaneGeometry(1.5, 0.5), labelMaterial, [1.9, 0.55, 0.62]);
      signal.secondaryLabelTexture = labelTexture;
    }
    addMissionLabel(gate, "GROW", [-1.9, 0.55, 0.62]);

    const glow = new THREE.PointLight(colors.cyan, 2.4, 5.2, 2);
    glow.position.set(0, 0.2, 0.76);
    gate.add(glow);
    root.add(gate);
    signal.dayThreeGate = gate;
    signal.dayThreeGateDoor = { id: "moonbase-three-entry", left: leftDoor, right: rightDoor, light: glow, open: 0, target: 0 };
    createGateColliders(gate, signal.dayThreeGateDoor, "moonbase-three-entry");
    createObjectiveArrow(gate, [0, 3.25, 0.42], "moonbase-three");

    registerInteractive(gate, {
      id: "moonbase-three-entry",
      name: "MoonBase 3 gate",
      description: "Enter the illuminated MoonBase 3 airlock to begin Mission Day 3.",
      day: 3,
      radius: 2.2,
      position: [gate.position.x, gate.position.z],
      collidable: false
    });
  }

  function createMoonBaseFourGate() {
    const gate = new THREE.Group();
    gate.name = "moonbase-four-gate";
    gate.position.set(-12.8, 0.08, -23.5);
    gate.rotation.y = 0.12;

    // Final mission airlock: a clearly separate outpost for the storm-shelter
    // chapter and the last step of the four-day lunar mission.
    addMesh(gate, new THREE.BoxGeometry(2.35, 2.22, 0.24), materials.hullShadow, [0, 0, 0]);
    addMesh(gate, new THREE.ShapeGeometry(roundedRectPath(1.74, 1.82, 0.2)), materials.dark, [0, 0.02, 0.15]);
    addMesh(gate, new THREE.BoxGeometry(1.68, 1.76, 0.07), materials.dark, [0, 0, 0.27]);
    const leftDoor = addMesh(gate, new THREE.BoxGeometry(0.78, 1.68, 0.04), materials.panelBlue, [-0.42, 0, 0.32]);
    const rightDoor = addMesh(gate, new THREE.BoxGeometry(0.78, 1.68, 0.04), materials.panelBlue, [0.42, 0, 0.32]);
    addMesh(gate, new THREE.BoxGeometry(0.035, 1.62, 0.045), materials.orange, [0, 0, 0.36]);
    addMesh(gate, new THREE.BoxGeometry(0.1, 0.38, 0.05), materials.warm, [-0.66, 0, 0.38]);
    addMesh(gate, new THREE.BoxGeometry(0.1, 0.38, 0.05), materials.warm, [0.66, 0, 0.38]);
    addPortalFrame(gate, 2.35, 2.2, 0.3, 0.12, materials.cyan, 0.22);
    addPortalFrame(gate, 2.08, 1.98, 0.24, 0.08, materials.orange, 0.3);
    addMesh(gate, new THREE.BoxGeometry(0.28, 0.07, 0.05), materials.warm, [0, 0.76, 0.4]);

    addMesh(gate, new THREE.BoxGeometry(4.2, 0.18, 2.55), materials.base, [0, -1.02, 0.28]);
    addMesh(gate, new THREE.BoxGeometry(3.86, 0.06, 2.2), materials.hullShadow, [0, -0.9, 0.28]);
    addMesh(gate, new THREE.BoxGeometry(3.92, 0.05, 0.07), materials.cyan, [0, -0.85, -0.82]);
    addMesh(gate, new THREE.BoxGeometry(3.92, 0.05, 0.07), materials.orange, [0, -0.85, 1.38]);
    addMesh(gate, new THREE.RingGeometry(1.15, 1.22, 40), materials.cyan, [0, -0.84, 0.38], [-Math.PI / 2, 0, 0]);
    addMesh(gate, new THREE.BoxGeometry(2.2, 0.1, 0.46), materials.dark, [0, -0.97, 0.18]);
    addMesh(gate, new THREE.BoxGeometry(1.8, 0.08, 0.3), materials.hullShadow, [0, -0.88, 0.02]);
    for (const x of [-1.35, 1.35]) {
      addMesh(gate, new THREE.BoxGeometry(0.18, 2.1, 0.2), materials.base, [x, 0.08, 0]);
      addMesh(gate, new THREE.BoxGeometry(0.12, 0.18, 0.05), materials.cyan, [x, 0.7, 0.16]);
      addMesh(gate, new THREE.SphereGeometry(0.08, 8, 6), materials.orange, [x, 1.25, 0.12]);
    }

    const labelCanvas = createBaseLabel("MOONBASE 4");
    if (labelCanvas) {
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false });
      addMesh(gate, new THREE.PlaneGeometry(1.5, 0.5), labelMaterial, [1.9, 0.55, 0.62]);
    }
    addMissionLabel(gate, "STORM", [-1.9, 0.55, 0.62]);

    const glow = new THREE.PointLight(colors.cyan, 2.4, 5.2, 2);
    glow.position.set(0, 0.2, 0.76);
    gate.add(glow);
    root.add(gate);
    signal.dayFourGate = gate;
    signal.dayFourGateDoor = { id: "moonbase-four-entry", left: leftDoor, right: rightDoor, light: glow, open: 0, target: 0 };
    createGateColliders(gate, signal.dayFourGateDoor, "moonbase-four-entry");
    createObjectiveArrow(gate, [0, 3.25, 0.42], "moonbase-four");

    registerInteractive(gate, {
      id: "moonbase-four-entry",
      name: "MoonBase 4 gate",
      description: "Enter the illuminated MoonBase 4 airlock to begin Mission Day 4.",
      day: 4,
      radius: 2.2,
      position: [gate.position.x, gate.position.z],
      collidable: false
    });
  }

  function createSolarArray() {
    const array = new THREE.Group();
    // Put the solar farm in the open foreground to the right of the habitat,
    // matching the readable silhouette of the reference scene.
    array.position.set(missionLocations.solar.x, -1.02, missionLocations.solar.z);
    array.rotation.y = -0.08;
    signal.solarArray = array;

    const createPanel = (x, y) => {
      const panel = new THREE.Group();
      panel.position.set(x, y, 0.16);
      panel.rotation.x = -0.12;
      panel.rotation.y = -0.02;
      addMesh(panel, new THREE.BoxGeometry(1.28, 1.05, 0.09), materials.dark, [0, 0, -0.03]);
      addMesh(panel, new THREE.BoxGeometry(1.12, 0.89, 0.035), materials.panelBlue, [0, 0, 0.035]);
      for (const gridX of [-0.37, 0, 0.37]) {
        addMesh(panel, new THREE.BoxGeometry(0.022, 0.86, 0.025), materials.cyan, [gridX, 0, 0.065]);
      }
      for (const gridY of [-0.29, 0, 0.29]) {
        addMesh(panel, new THREE.BoxGeometry(1.08, 0.022, 0.025), materials.cyan, [0, gridY, 0.065]);
      }
      addMesh(panel, new THREE.BoxGeometry(1.2, 0.035, 0.028), materials.hullShadow, [0, 0.48, 0.07]);
      addMesh(panel, new THREE.BoxGeometry(1.2, 0.035, 0.028), materials.hullShadow, [0, -0.48, 0.07]);
      array.add(panel);
    };

    [-1.35, 0, 1.35].forEach((x) => {
      createPanel(x, 1.38);
      createPanel(x, 0.28);
    });

    // Heavy support rails, legs, feet, and a controller box make the array
    // read as a walkable piece of moon-base machinery instead of a flat icon.
    addMesh(array, new THREE.BoxGeometry(4.25, 0.1, 0.1), materials.dark, [0, 1.95, 0.03]);
    addMesh(array, new THREE.BoxGeometry(4.25, 0.1, 0.1), materials.dark, [0, -0.27, 0.03]);
    for (const x of [-1.75, 1.75]) {
      addMesh(array, new THREE.CylinderGeometry(0.07, 0.09, 2.25, 8), materials.dark, [x, 0.86, -0.04]);
      addMesh(array, new THREE.BoxGeometry(0.5, 0.1, 0.35), materials.baseLight, [x, -0.08, 0.03]);
      addMesh(array, new THREE.BoxGeometry(0.06, 1.7, 0.06), materials.hullShadow, [x, 0.8, 0.28], [0, 0, x < 0 ? -0.24 : 0.24]);
    }
    addMesh(array, new THREE.BoxGeometry(0.62, 0.45, 0.5), materials.baseLight, [0, 0.15, 0.48]);
    addMesh(array, new THREE.BoxGeometry(0.16, 0.06, 0.05), materials.cyan, [0, 0.27, 0.74]);

    root.add(array);
    registerInteractive(array, {
      id: "solar-array",
      name: "Solar array",
      description: "A fictional equipment condition is reducing the array's available output.",
      day: 1,
      radius: 3.1,
      position: [array.position.x, array.position.z]
    });
  }

  function createBeacon(name, position, color) {
    const beacon = new THREE.Group();
    beacon.name = `${name}-beacon`;
    beacon.position.set(...position);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 });
    const ring = addMesh(beacon, new THREE.TorusGeometry(0.42, 0.018, 6, 24), material, [0, 0.04, 0], [Math.PI / 2, 0, 0]);
    const beam = addMesh(beacon, new THREE.CylinderGeometry(0.018, 0.14, 1.45, 8), material, [0, 0.74, 0]);
    beacon.userData.ring = ring;
    beacon.userData.beam = beam;
    root.add(beacon);
    signal.beacons.push(beacon);
    return beacon;
  }

  function createStoryLocations() {
    signal.locations = {
      base: { camera: [0, 2.1, 11.4], target: [0, 0.4, -3.7] },
      solar: { camera: [missionLocations.solar.x + 0.9, 2.6, missionLocations.solar.z + 4.8], target: [missionLocations.solar.x, 0.55, missionLocations.solar.z] },
      water: { camera: [missionLocations.water.x + 0.9, 2.25, missionLocations.water.z + 4.4], target: [missionLocations.water.x, 0.55, missionLocations.water.z] },
      grow: { camera: [missionLocations.grow.x + 0.9, 2.0, missionLocations.grow.z + 4.4], target: [missionLocations.grow.x, 0.55, missionLocations.grow.z] },
      storm: { camera: [missionLocations.storm.x + 0.9, 2.7, missionLocations.storm.z + 4.8], target: [missionLocations.storm.x, 0.8, missionLocations.storm.z] }
    };

    createBeacon("solar", [missionLocations.solar.x, -0.88, missionLocations.solar.z], colors.cyan);
    createBeacon("water", [missionLocations.water.x, -0.88, missionLocations.water.z], colors.earth);
    createBeacon("grow", [missionLocations.grow.x, -0.88, missionLocations.grow.z], colors.plant);
    createBeacon("storm", [missionLocations.storm.x, -0.88, missionLocations.storm.z], colors.warm);

    const solarDustGeometry = new THREE.BufferGeometry();
    const solarDustPositions = new Float32Array(52 * 3);
    for (let index = 0; index < 52; index += 1) {
      solarDustPositions[index * 3] = missionLocations.solar.x - 1.35 + Math.random() * 2.8;
      solarDustPositions[index * 3 + 1] = -0.25 + Math.random() * 2.1;
      solarDustPositions[index * 3 + 2] = missionLocations.solar.z - 0.75 + Math.random() * 1.5;
    }
    solarDustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(solarDustPositions, 3));
    signal.solarDust = new THREE.Points(solarDustGeometry,
      new THREE.PointsMaterial({ color: colors.hazard, size: 0.07, transparent: true, opacity: 0.02 }));
    signal.solarDust.name = "solar-array-output-condition";
    root.add(signal.solarDust);

    const recycler = new THREE.Group();
    recycler.name = "water-recycler-location";
    recycler.position.set(missionLocations.water.x, -0.35, missionLocations.water.z);
    addMesh(recycler, new THREE.BoxGeometry(1.32, 0.9, 0.72), materials.baseLight, [0, 0.5, 0]);
    addMesh(recycler, new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16), materials.cyan, [0, 0.5, -0.4], [Math.PI / 2, 0, 0]);
    addMesh(recycler, new THREE.TorusGeometry(0.36, 0.035, 8, 24), materials.cyan, [0, 0.5, -0.45], [Math.PI / 2, 0, 0]);
    // Day 2 covers both water recovery and air revitalization. These two
    // service modules make that mission readable beside the second gate.
    const recoveryTank = new THREE.Group();
    recoveryTank.position.set(0.92, 0, 0.12);
    addMesh(recoveryTank, new THREE.CylinderGeometry(0.25, 0.3, 0.9, 14), materials.baseLight, [0, 0.5, 0]);
    addMesh(recoveryTank, new THREE.TorusGeometry(0.27, 0.035, 8, 20), materials.cyan, [0, 0.5, 0], [Math.PI / 2, 0, 0]);
    addMesh(recoveryTank, new THREE.BoxGeometry(0.12, 0.12, 0.05), materials.earth, [0, 0.76, -0.25]);
    recycler.add(recoveryTank);
    const airScrubber = new THREE.Group();
    airScrubber.position.set(-0.9, 0, 0.16);
    addMesh(airScrubber, new THREE.BoxGeometry(0.54, 0.72, 0.5), materials.dark, [0, 0.45, 0]);
    addMesh(airScrubber, new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), materials.violet, [0, 0.56, -0.29], [Math.PI / 2, 0, 0]);
    addMesh(airScrubber, new THREE.BoxGeometry(0.26, 0.06, 0.04), materials.cyan, [0, 0.72, -0.3]);
    recycler.add(airScrubber);
    const leakGeometry = new THREE.BufferGeometry();
    const leakPositions = new Float32Array(26 * 3);
    for (let index = 0; index < 26; index += 1) {
      leakPositions[index * 3] = -0.24 + Math.random() * 0.48;
      leakPositions[index * 3 + 1] = 0.1 + Math.random() * 0.6;
      leakPositions[index * 3 + 2] = -0.48 + Math.random() * 0.22;
    }
    leakGeometry.setAttribute("position", new THREE.Float32BufferAttribute(leakPositions, 3));
    signal.waterLeak = new THREE.Points(leakGeometry,
      new THREE.PointsMaterial({ color: colors.earth, size: 0.06, transparent: true, opacity: 0.02 }));
    signal.waterLeak.name = "water-recycler-leak-hazard";
    recycler.add(signal.waterLeak);
    root.add(recycler);
    registerInteractive(recycler, {
      id: "water-recycler",
      name: "Water recycler",
      description: "The water and air systems need a careful inspection.",
      day: 2,
      radius: 2.25,
      position: [recycler.position.x, recycler.position.z]
    });

    const grow = new THREE.Group();
    grow.name = "grow-tray-location";
    grow.position.set(missionLocations.grow.x, -0.25, missionLocations.grow.z);
    addMesh(grow, new THREE.BoxGeometry(1.5, 0.68, 0.88), materials.dark, [0, 0.35, 0]);
    const greenhouse = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.7, 0.74),
      new THREE.MeshStandardMaterial({ color: 0x6fcacb, transparent: true, opacity: 0.12, roughness: 0.2, metalness: 0.1 }));
    greenhouse.position.set(0, 0.72, 0);
    grow.add(greenhouse);
    for (let index = 0; index < 4; index += 1) {
      const stem = addMesh(grow, new THREE.CylinderGeometry(0.025, 0.04, 0.34, 6), new THREE.MeshStandardMaterial({ color: colors.plant, emissive: colors.plant, emissiveIntensity: 0.3 }),
        [-0.48 + index * 0.32, 0.63 + (index % 2) * 0.05, -0.1 + (index % 2) * 0.22]);
      signal.growLights.push(stem.material);
    }
    const growLight = addMesh(grow, new THREE.BoxGeometry(1.05, 0.035, 0.24), materials.violet, [0, 1.18, 0]);
    signal.growLights.push(growLight.material);
    // The Day 3 choices cover both growing food and opening reserve meals.
    const mealCrate = new THREE.Group();
    mealCrate.position.set(1.05, 0, 0.16);
    addMesh(mealCrate, new THREE.BoxGeometry(0.72, 0.55, 0.62), materials.baseLight, [0, 0.28, 0]);
    addMesh(mealCrate, new THREE.BoxGeometry(0.76, 0.08, 0.08), materials.warm, [0, 0.28, -0.33]);
    addMesh(mealCrate, new THREE.BoxGeometry(0.08, 0.42, 0.08), materials.orange, [0, 0.28, -0.34]);
    grow.add(mealCrate);
    root.add(grow);
    registerInteractive(grow, {
      id: "grow-tray",
      name: "Grow light tray",
      description: "The crew's food system is waiting for a plan.",
      day: 3,
      radius: 2.2,
      position: [grow.position.x, grow.position.z]
    });

    const shelter = new THREE.Group();
    shelter.name = "storm-shelter-location";
    shelter.position.set(missionLocations.storm.x, -0.2, missionLocations.storm.z);
    signal.shelterDome = new THREE.Mesh(new THREE.SphereGeometry(1.45, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x6d74b8, transparent: true, opacity: 0.12, emissive: 0x373c91, emissiveIntensity: 0.55, roughness: 0.34 }));
    signal.shelterDome.position.y = 0.1;
    shelter.add(signal.shelterDome);
    for (let index = 0; index < 3; index += 1) {
      const ring = addMesh(shelter, new THREE.TorusGeometry(0.64 + index * 0.28, 0.022, 6, 28), materials.warm, [0, 0.1 + index * 0.02, 0], [Math.PI / 2, 0, 0]);
      ring.material.transparent = true;
      ring.material.opacity = 0.05;
      signal.stormRings.push(ring);
    }
    // Day 4 is the solar-particle alert. Add a warning beacon and shield
    // panels so the fourth gate visibly reads as the protection mission.
    const warningBeacon = new THREE.PointLight(colors.warm, 2.1, 4.2, 2);
    warningBeacon.position.set(0, 1.65, 0.15);
    shelter.add(warningBeacon);
    addMesh(shelter, new THREE.SphereGeometry(0.12, 10, 8), materials.warm, [0, 1.65, 0.15]);
    for (const x of [-1.9, 1.9]) {
      addMesh(shelter, new THREE.BoxGeometry(0.12, 1.25, 0.9), materials.violet, [x, 0.45, 0.08]);
      addMesh(shelter, new THREE.BoxGeometry(0.16, 0.08, 0.96), materials.cyan, [x, 0.78, 0.08]);
    }
    root.add(shelter);
    registerInteractive(shelter, {
      id: "storm-shelter",
      name: "Storm shelter",
      description: "A lunar particle alert is approaching the outpost.",
      day: 4,
      radius: 2.45,
      position: [shelter.position.x, shelter.position.z]
    });

    const dish = new THREE.Group();
    dish.name = "communication-dish-location";
    dish.position.set(4.5, -0.15, -5.4);
    dish.rotation.z = -0.22;
    addMesh(dish, new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), materials.dark, [0, 0.85, 0]);
    addMesh(dish, new THREE.SphereGeometry(0.16, 12, 8), materials.warm, [0, 1.78, 0]);
    signal.communicationDish = dish;
    root.add(dish);
  }

  function createRover() {
    const spacecraft = new THREE.Group();
    spacecraft.name = "lunar-spacecraft";
    spacecraft.position.set(-3.55, -0.68, -0.22);
    spacecraft.rotation.y = -0.34;
    spacecraft.userData.baseY = -0.68;
    signal.rover = spacecraft;

    // A compact lunar lander silhouette replaces the old four-wheeled rover:
    // cylindrical fuselage, a glazed cockpit, solar wings, and landing gear.
    addMesh(spacecraft, new THREE.CylinderGeometry(0.48, 0.56, 1.25, 14), materials.hull, [0, 0.82, 0], [Math.PI / 2, 0, 0]);
    addMesh(spacecraft, new THREE.ConeGeometry(0.48, 0.58, 14), materials.hullShadow, [0, 0.82, -0.9], [-Math.PI / 2, 0, 0]);
    addMesh(spacecraft, new THREE.ConeGeometry(0.43, 0.42, 14), materials.dark, [0, 0.82, 0.82], [Math.PI / 2, 0, 0]);
    addMesh(spacecraft, new THREE.SphereGeometry(0.37, 16, 10), materials.hull, [0, 1.16, -0.23], [0, 0, 0], [0.92, 0.58, 1.02]);
    addMesh(spacecraft, new THREE.BoxGeometry(0.52, 0.19, 0.045), materials.visor, [0, 1.16, -0.57]);
    addMesh(spacecraft, new THREE.BoxGeometry(0.44, 0.045, 0.05), materials.cyan, [0, 1.02, -0.59]);

    // Solar wings and cyan edge strips make the vehicle read as spacecraft
    // instead of a ground car even in a wide camera shot.
    for (const side of [-1, 1]) {
      addMesh(spacecraft, new THREE.BoxGeometry(0.72, 0.055, 0.82), materials.panelBlue, [side * 0.82, 0.76, 0]);
      addMesh(spacecraft, new THREE.BoxGeometry(0.06, 0.07, 0.86), materials.roverCyan, [side * 0.82, 0.77, 0]);
      addMesh(spacecraft, new THREE.BoxGeometry(0.05, 0.07, 0.82), materials.cyan, [side * 0.53, 0.77, 0]);
    }

    // Four landing struts and flat pads replace the rover wheels.
    for (const x of [-0.5, 0.5]) {
      for (const z of [-0.38, 0.38]) {
        addMesh(spacecraft, new THREE.BoxGeometry(0.07, 0.48, 0.07), materials.dark, [x, 0.2, z], [0, 0, x < 0 ? -0.12 : 0.12]);
        addMesh(spacecraft, new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), materials.hullShadow, [x * 1.08, -0.05, z]);
      }
    }

    // Rear thrusters, exhaust rings, antenna and a small service beacon.
    for (const x of [-0.24, 0.24]) {
      addMesh(spacecraft, new THREE.CylinderGeometry(0.13, 0.16, 0.28, 12), materials.dark, [x, 0.56, 0.66], [Math.PI / 2, 0, 0]);
      addMesh(spacecraft, new THREE.TorusGeometry(0.12, 0.035, 6, 12), materials.roverCyan, [x, 0.56, 0.82], [Math.PI / 2, 0, 0]);
    }
    signal.roverLights.push(materials.roverCyan);
    addMesh(spacecraft, new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), materials.dark, [0, 1.55, 0.18]);
    addMesh(spacecraft, new THREE.SphereGeometry(0.09, 10, 8), materials.warm, [0, 1.88, 0.18]);
    addMesh(spacecraft, new THREE.BoxGeometry(0.34, 0.18, 0.08), materials.orange, [0.38, 0.82, 0.34]);

    const spacecraftGlow = new THREE.PointLight(0x43dcff, 1.15, 3.8, 2);
    spacecraftGlow.position.set(0, 0.62, -0.78);
    spacecraft.add(spacecraftGlow);
    addCollider("rover", [spacecraft.position.x, spacecraft.position.z], [1.25, 0.95]);
    root.add(spacecraft);
  }

  function createBaseProps() {
    const props = new THREE.Group();
    props.name = "moonbase-support-props";

    const createCrate = (position, scale, accent) => {
      const crate = new THREE.Group();
      crate.position.set(...position);
      crate.scale.setScalar(scale);
      addMesh(crate, new THREE.BoxGeometry(0.8, 0.62, 0.72), materials.hullShadow, [0, 0.31, 0]);
      addMesh(crate, new THREE.BoxGeometry(0.62, 0.06, 0.05), accent, [0, 0.33, -0.38]);
      addMesh(crate, new THREE.BoxGeometry(0.06, 0.58, 0.05), accent, [-0.32, 0.31, -0.38]);
      props.add(crate);
    };

    const createFloodlight = (position, rotationY = 0) => {
      const mast = new THREE.Group();
      mast.position.set(...position);
      mast.rotation.y = rotationY;
      addMesh(mast, new THREE.CylinderGeometry(0.035, 0.05, 1.9, 8), materials.dark, [0, 0.95, 0]);
      addMesh(mast, new THREE.BoxGeometry(0.55, 0.12, 0.08), materials.hullShadow, [0, 1.78, 0]);
      for (const x of [-0.18, 0, 0.18]) {
        addMesh(mast, new THREE.BoxGeometry(0.1, 0.1, 0.035), materials.warm, [x, 1.78, -0.08]);
      }
      props.add(mast);
    };

    createCrate([-3.4, -0.9, -1.7], 1.15, materials.orange);
    createCrate([2.55, -0.9, -1.55], 0.82, materials.cyan);
    createCrate([4.9, -0.92, -4.8], 1.1, materials.orange);
    createFloodlight([-4.7, -0.95, -4.5], 0.15);
    createFloodlight([5.0, -0.95, -4.35], -0.12);

    // A low landing pad ring gives the astronaut a readable route through the
    // prop field and adds a strong cinematic foreground silhouette.
    const pad = new THREE.Group();
    pad.position.set(0, -1.0, 0.2);
    addMesh(pad, new THREE.RingGeometry(2.9, 3.05, 48), materials.baseLight, [0, 0, 0], [-Math.PI / 2, 0, 0]);
    addMesh(pad, new THREE.RingGeometry(2.35, 2.39, 48), materials.cyan, [0, 0.005, 0], [-Math.PI / 2, 0, 0]);
    props.add(pad);
    root.add(props);
  }

  function createAstronaut() {
    const astronaut = new THREE.Group();
    astronaut.name = "stylized-astronaut";
    astronaut.position.set(2.62, -0.14, -0.5);
    astronaut.rotation.y = -0.35;
    signal.astronaut = astronaut;
    addMesh(astronaut, new THREE.CylinderGeometry(0.34, 0.43, 0.72, 12), materials.suit, [0, 0.58, 0]);
    addMesh(astronaut, new THREE.SphereGeometry(0.38, 16, 12), materials.suit, [0, 1.14, 0]);
    addMesh(astronaut, new THREE.SphereGeometry(0.28, 16, 10), materials.visor, [0, 1.14, -0.24], [0.12, 0, 0]);
    addMesh(astronaut, new THREE.BoxGeometry(0.22, 0.48, 0.18), materials.baseLight, [0, 0.6, 0.36]);
    addMesh(astronaut, new THREE.CylinderGeometry(0.11, 0.13, 0.48, 10), materials.suit, [-0.2, 0.02, 0]);
    addMesh(astronaut, new THREE.CylinderGeometry(0.11, 0.13, 0.48, 10), materials.suit, [0.2, 0.02, 0]);
    addMesh(astronaut, new THREE.CapsuleGeometry(0.1, 0.32, 4, 8), materials.suit, [-0.42, 0.52, 0], [0, 0, -0.3]);
    addMesh(astronaut, new THREE.CapsuleGeometry(0.1, 0.32, 4, 8), materials.suit, [0.42, 0.52, 0], [0, 0, 0.3]);
    root.add(astronaut);
  }

  function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(140 * 3);
    for (let index = 0; index < 140; index += 1) {
      positions[index * 3] = -34 + Math.random() * 68;
      positions[index * 3 + 1] = -0.4 + Math.random() * 4.7;
      positions[index * 3 + 2] = -34 + Math.random() * 56;
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    signal.dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: colors.cyan, size: 0.06, transparent: true, opacity: 0.33 }));
    signal.dust.name = "floating-dust";
    root.add(signal.dust);

    const stormGeometry = new THREE.BufferGeometry();
    const stormPositions = new Float32Array(220 * 3);
    for (let index = 0; index < 220; index += 1) {
      stormPositions[index * 3] = -36 + Math.random() * 72;
      stormPositions[index * 3 + 1] = -0.3 + Math.random() * 7;
      stormPositions[index * 3 + 2] = -38 + Math.random() * 54;
    }
    stormGeometry.setAttribute("position", new THREE.Float32BufferAttribute(stormPositions, 3));
    signal.storm = new THREE.Points(stormGeometry, new THREE.PointsMaterial({ color: 0xb58eff, size: 0.07, transparent: true, opacity: 0 }));
    signal.storm.name = "storm-particles";
    root.add(signal.storm);
  }

  function createLighting() {
    // A very low neutral fill represents reflected light from the regolith.
    // The key below does the visual work; there is no colored sky contribution.
    signal.sceneLight = new THREE.AmbientLight(0x77746d, 0.18);
    scene.add(signal.sceneLight);
    const key = new THREE.DirectionalLight(0xfff1d5, 4.15);
    key.name = "direct-lunar-sunlight";
    key.position.set(-18, 26, 21);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 110;
    key.shadow.camera.left = -48;
    key.shadow.camera.right = 48;
    key.shadow.camera.top = 48;
    key.shadow.camera.bottom = -48;
    key.shadow.bias = -0.00018;
    key.shadow.normalBias = 0.018;
    scene.add(key);
  }

  function loadMoonSurfaceTexture() {
    // Keep the lunar surface self-contained. The procedural texture uses the
    // same deterministic noise family as the rock normal/roughness maps, so
    // the game does not depend on a remote texture request at runtime.
    const texture = createRockTexture(64, 211, false);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    texture.repeat.set(5.5, 5.5);
    materials.ground.map = texture;
    materials.ground.bumpMap = texture;
    materials.ground.bumpScale = 0.24;
    materials.ground.needsUpdate = true;
    signal.moonTexture = texture;
  }

  createStars();
  createGround();
  createHorizon();
  createEarth();
  createBase();
  createMoonBaseTwoGate();
  createMoonBaseThreeGate();
  createMoonBaseFourGate();
  createSolarArray();
  createStoryLocations();
  createRover();
  createBaseProps();
  createParticles();
  createLighting();
  loadMoonSurfaceTexture();

  function update(time, delta) {
    if (signal.stars) signal.stars.rotation.y = time * 0.002;
    if (signal.earth) signal.earth.rotation.y += delta * 0.04;
    if (signal.earthClouds) signal.earthClouds.rotation.y -= delta * 0.08;
    if (signal.rover) {
      const baseY = signal.rover.userData.baseY ?? -0.72;
      signal.rover.position.y = baseY + Math.sin(time * 0.0015) * 0.012;
    }
    signal.gateArrows.forEach((arrow, index) => {
      const active = arrow.id === signal.navigationGate;
      arrow.object.visible = active;
      if (active) {
        arrow.object.position.y = arrow.baseY + Math.sin(time * 0.003 + index) * 0.08;
        arrow.light.intensity = 1.35 + (Math.sin(time * 0.005 + index) + 1) * 0.45;
      }
    });
    if (signal.entryDoor) {
      const door = signal.entryDoor;
      door.open += (door.target - door.open) * (1 - Math.exp(-delta * 5.5));
      door.left.position.x = -0.42 - door.open * 0.72;
      door.right.position.x = 0.42 + door.open * 0.72;
      door.light.intensity = 1.2 + door.open * 2.4;
      updateGateDoorColliders(door);
    }
    [signal.dayGateDoor, signal.dayThreeGateDoor, signal.dayFourGateDoor].forEach((door) => {
      if (!door) return;
      door.open += (door.target - door.open) * (1 - Math.exp(-delta * 5.5));
      door.left.position.x = -0.42 - door.open * 0.72;
      door.right.position.x = 0.42 + door.open * 0.72;
      door.light.intensity = 1.2 + door.open * 2.4;
      updateGateDoorColliders(door);
    });
    signal.roverLights.forEach((material, index) => {
      material.emissiveIntensity = 1.35 + (Math.sin(time * 0.004 + index) + 1) * 0.35;
    });
    if (signal.antenna) signal.antenna.rotation.z = Math.sin(time * 0.001) * 0.06;
    if (signal.dust) signal.dust.position.y = Math.sin(time * 0.0005) * 0.12;
    if (signal.storm) {
      signal.storm.rotation.y += delta * 0.14;
      signal.storm.position.x = Math.sin(time * 0.0004) * 0.5;
    }
    signal.beacons.forEach((beacon, index) => {
      const pulse = 0.08 + (Math.sin(time * 0.0025 + index) + 1) * 0.04;
      beacon.userData.ring.material.opacity = signal.story.location === beacon.name.replace("-beacon", "") ? pulse + 0.16 : 0.025;
      beacon.userData.beam.material.opacity = signal.story.location === beacon.name.replace("-beacon", "") ? pulse : 0.01;
      beacon.rotation.y += delta * 0.16;
    });
    if (signal.waterLeak) signal.waterLeak.position.y = Math.sin(time * 0.004) * 0.06;
    if (signal.solarDust) signal.solarDust.rotation.y += delta * 0.18;
    if (signal.communicationDish) signal.communicationDish.rotation.y = Math.sin(time * 0.0008) * 0.15;
    signal.growLights.forEach((material, index) => { material.emissiveIntensity = signal.growBaseIntensity + (Math.sin(time * 0.003 + index) + 1) * 0.18; });
    signal.stormRings.forEach((ring, index) => { ring.rotation.y += delta * (0.18 + index * 0.06); });
  }

  function setStoryState(story = {}) {
    const mission = story.mission || null;
    const day = mission?.event?.day || mission?.day || 0;
    const location = story.location || ["base", "solar", "water", "grow", "storm"][day] || "base";
    const active = story.screen === "game" || story.screen === "feedback"
      || story.screen === "day1Complete" || story.screen === "result";
    const dayOneComplete = Boolean(story.dayOneComplete)
      || story.screen === "day1Complete"
      || Boolean(mission?.latestDecision?.day === 1 && story.screen === "feedback");
    const dayTwoComplete = Boolean(story.dayTwoComplete)
      || Boolean(mission?.latestDecision?.day === 2 && story.screen === "feedback");
    const dayThreeComplete = Boolean(story.dayThreeComplete)
      || Boolean(mission?.latestDecision?.day === 3 && story.screen === "feedback");
    const selected = story.selectedChoiceId || mission?.latestDecision?.choiceId || "";
    const showFourthGate = dayThreeComplete || day >= 4;
    const showThirdGate = !showFourthGate && (dayTwoComplete || day >= 3);
    const showSecondGate = !showThirdGate && !showFourthGate
      && (dayOneComplete || day >= 2 || story.screen === "day1Complete");
    signal.story = { ...signal.story, ...story, day, location, gateProgress: story.gateProgress || signal.story.gateProgress || {} };
    signal.navigationGate = showFourthGate
      ? "moonbase-four"
      : showThirdGate ? "moonbase-three" : showSecondGate ? "moonbase-two" : "moonbase-one";
    signal.solarDust.material.opacity = active && location === "solar" ? 0.7 : 0.02;
    signal.waterLeak.material.opacity = active && location === "water" ? 0.72 : 0.02;
    signal.shelterDome.material.opacity = active && location === "storm" ? 0.24 : 0.12;
    signal.stormRings.forEach((ring) => { ring.material.opacity = active && location === "storm" ? 0.42 : 0.05; });
    signal.growLights.forEach((material) => { material.emissiveIntensity = active && location === "grow" ? Math.max(0.75, signal.growBaseIntensity) : signal.growBaseIntensity; });
    if (signal.dayGate) signal.dayGate.visible = true;
    // Keep every numbered outpost visible as a readable lunar landmark. The
    // objective arrow still points only to the gate unlocked for the current day.
    if (signal.dayThreeGate) signal.dayThreeGate.visible = true;
    if (signal.dayFourGate) signal.dayFourGate.visible = true;
    if (selected === "reduce_non_essential_loads") signal.solarDust.material.opacity = 0.04;
  }

  function setInteractionFocus(id = "") {
    signal.interactiveObjects.forEach((object) => {
      const focused = object.id === id;
      if (object.object?.userData.interactionHalo) object.object.userData.interactionHalo.visible = focused;
    });
  }

  function getNavigationTarget() {
    const currentDay = Number(signal.story.day || 0);
    if (signal.story.screen === "game" && currentDay === 1) {
      const solar = signal.interactiveObjects.find((object) => object.id === "solar-array");
      if (solar) return { x: solar.position[0], z: solar.position[1], id: solar.id };
    }
    if (signal.story.screen === "game") {
      const currentGateId = getGateIdForDay(currentDay);
      const currentGate = signal.interactiveObjects.find((object) => object.id === currentGateId);
      if (currentGate) {
        // Missions are solved at their own gate. Keep the radar and camera on
        // that gate instead of sending the player back to MoonBase 1 or on to
        // a separate station.
        return { x: currentGate.position[0], z: currentGate.position[1], id: currentGate.id };
      }
    }
    if (signal.story.screen === "day1Complete") return null;
    const targetId = signal.navigationGate === "moonbase-four"
      ? "moonbase-four-entry"
      : signal.navigationGate === "moonbase-three"
        ? "moonbase-three-entry"
        : signal.navigationGate === "moonbase-two" ? "moonbase-two-entry" : "moonbase-entry";
    const target = signal.interactiveObjects.find((object) => object.id === targetId);
    return target ? { x: target.position[0], z: target.position[1], id: target.id } : null;
  }

  function getGateIdForDay(day) {
    return Number(day) === 1 ? "moonbase-entry"
      : Number(day) === 2 ? "moonbase-two-entry"
      : Number(day) === 3 ? "moonbase-three-entry"
        : Number(day) === 4 ? "moonbase-four-entry" : null;
  }

  function isGateEntered(day) {
    const missionDay = Number(day);
    return missionDay >= 1 && Boolean(signal.story.gateProgress?.[missionDay]);
  }

  function isWelcomeEntryActive() {
    return signal.story.screen === "welcome";
  }

  function setEntryDoorOpen(open = true) {
    if (!signal.entryDoor) return;
    signal.entryDoor.target = open ? 1 : 0;
  }

  function setGateDoorOpen(id, open = true) {
    const door = id === "moonbase-four-entry"
      ? signal.dayFourGateDoor
      : id === "moonbase-three-entry" ? signal.dayThreeGateDoor : signal.dayGateDoor;
    if (door) door.target = open ? 1 : 0;
  }

  function isGateDoorOpen(id) {
    const door = id === "moonbase-four-entry"
      ? signal.dayFourGateDoor
      : id === "moonbase-three-entry" ? signal.dayThreeGateDoor : signal.dayGateDoor;
    return Boolean(door && door.open >= 0.97);
  }

  function setSignal({ storm = false, success = false } = {}) {
    // These are presentation lights only; they are deliberately not derived
    // from fictional resource quantities.
    signal.foodRatio = 0.72;
    signal.shelterRatio = 0.72;
    signal.growBaseIntensity = 0.82;
    if (signal.baseGlow) signal.baseGlow.intensity = success ? 3.8 : 2.55;
    signal.baseLights.forEach((material) => { material.emissiveIntensity = success ? 1.85 : 1.35; });
    signal.waterLights.forEach((material) => { material.emissiveIntensity = 1.2; });
    signal.growLights.forEach((material) => { material.emissiveIntensity = signal.growBaseIntensity; });
    if (signal.shelterDome) signal.shelterDome.material.emissiveIntensity = 0.22 + signal.shelterRatio * 0.75;
    if (signal.storm) signal.storm.material.opacity = storm ? 0.55 : 0;
    if (signal.dust) signal.dust.material.opacity = storm ? 0.56 : 0.25;
    if (signal.sceneLight) signal.sceneLight.intensity = success ? 0.26 : 0.2;
  }

  function dispose() {
    signal.moonTexture?.dispose?.();
    rockNormalTexture?.dispose?.();
    rockRoughnessTexture?.dispose?.();
    signal.baseLabelTexture?.dispose?.();
    signal.secondaryLabelTexture?.dispose?.();
    signal.missionLabelTextures.forEach((texture) => texture.dispose?.());
    root.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material) => material.dispose());
      }
    });
  }

  return {
    root,
    update,
    setSignal,
    setStoryState,
    setInteractionFocus,
    setEntryDoorOpen,
    setGateDoorOpen,
    isGateDoorOpen,
    getNavigationTarget,
    getGateIdForDay,
    isGateEntered,
    isWelcomeEntryActive,
    getLocations: () => signal.locations,
    getInteractiveObjects: () => signal.interactiveObjects,
    getCollisionObjects: () => signal.collisionObjects,
    // World-space terrain query shared by the player and camera controllers.
    // The value includes the environment group's base Y offset.
    getTerrainHeight: (x, z) => -1.08 + groundHeight(Number(x) || 0, Number(z) || 0),
    dispose
  };
}
