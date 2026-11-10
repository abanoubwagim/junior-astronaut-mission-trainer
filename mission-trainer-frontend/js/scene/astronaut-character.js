export function createAstronautCharacter(THREE, parent, options = {}) {
  const palette = {
    suit: options.suitColor || 0xeaf2ff,
    suitShadow: options.suitShadow || 0x93a9d3,
    accent: options.accentColor || 0x63e9ef,
    visor: options.visorColor || 0x102856,
    pack: options.packColor || 0x354a80,
    glove: options.gloveColor || 0xc6d7f1
  };
  const materials = {
    suit: new THREE.MeshStandardMaterial({ color: palette.suit, roughness: 0.68 }),
    suitShadow: new THREE.MeshStandardMaterial({ color: palette.suitShadow, roughness: 0.74 }),
    accent: new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 1.15, roughness: 0.32 }),
    visor: new THREE.MeshStandardMaterial({ color: palette.visor, emissive: 0x164c86, emissiveIntensity: 0.72, roughness: 0.16, metalness: 0.18 }),
    pack: new THREE.MeshStandardMaterial({ color: palette.pack, roughness: 0.6, metalness: 0.12 }),
    glove: new THREE.MeshStandardMaterial({ color: palette.glove, roughness: 0.72 }),
    thruster: new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 2.1, roughness: 0.25 }),
    oxygen: new THREE.MeshStandardMaterial({ color: 0xd8e5f3, roughness: 0.42, metalness: 0.24 })
  };

  const root = new THREE.Group();
  root.name = options.name || "astronaut-character";
  root.userData.characterType = "procedural-articulated-astronaut";
  root.userData.assetStatus = "fallback";
  parent.add(root);

  function mesh(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(...position);
    part.rotation.set(...rotation);
    part.scale.set(...scale);
    part.castShadow = true;
    part.receiveShadow = true;
    return part;
  }

  const hips = new THREE.Group();
  hips.position.y = 0.48;
  root.add(hips);

  const torso = mesh(new THREE.CylinderGeometry(0.34, 0.43, 0.72, 12), materials.suit, [0, 0.53, 0]);
  hips.add(torso);
  hips.add(mesh(new THREE.BoxGeometry(0.23, 0.48, 0.2), materials.pack, [0, 0.55, 0.34]));
  hips.add(mesh(new THREE.BoxGeometry(0.29, 0.14, 0.43), materials.accent, [0, 0.28, -0.05]));

  // Twin oxygen cylinders sit visibly behind the suit, with mounting rings,
  // top valves, a regulator block, and a dark hose leading toward the chest.
  for (const x of [-0.18, 0.18]) {
    hips.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.66, 12), materials.oxygen, [x, 0.58, 0.54]));
    for (const y of [0.36, 0.78]) {
      hips.add(mesh(new THREE.TorusGeometry(0.125, 0.018, 6, 16), materials.pack,
        [x, y, 0.54], [Math.PI / 2, 0, 0]));
    }
    hips.add(mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.1, 10), materials.pack, [x, 0.97, 0.54]));
    hips.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), materials.accent, [x, 1.04, 0.54]));
  }
  hips.add(mesh(new THREE.BoxGeometry(0.22, 0.18, 0.1), materials.pack, [0, 0.67, 0.7]));
  const oxygenHose = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.82, 0.62),
    new THREE.Vector3(-0.3, 0.9, 0.46),
    new THREE.Vector3(-0.27, 1.04, 0.24)
  ]);
  hips.add(new THREE.Mesh(new THREE.TubeGeometry(oxygenHose, 12, 0.025, 8, false), materials.pack));

  // Small backpack nozzles and downward exhaust cones provide a readable,
  // restrained visual cue only when the player actively uses the thruster.
  const thrusterFlames = [];
  for (const x of [-0.16, 0.16]) {
    hips.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 10), materials.pack,
      [x, 0.42, 0.5], [0, 0, 0]));
    const flame = mesh(new THREE.ConeGeometry(0.055, 0.22, 8), materials.thruster,
      [x, 0.24, 0.54], [Math.PI, 0, 0]);
    flame.visible = false;
    hips.add(flame);
    thrusterFlames.push(flame);
  }
  const thrusterLight = new THREE.PointLight(palette.accent, 0.5, 1.8, 2);
  thrusterLight.position.set(0, 0.18, 0.54);
  thrusterLight.visible = false;
  hips.add(thrusterLight);

  const head = new THREE.Group();
  head.position.set(0, 1.04, 0);
  hips.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.38, 16, 12), materials.suit));
  head.add(mesh(new THREE.SphereGeometry(0.285, 16, 10), materials.visor, [0, 0, -0.25], [0.12, 0, 0]));
  head.add(mesh(new THREE.TorusGeometry(0.3, 0.018, 6, 20), materials.accent, [0, 0, -0.27], [Math.PI / 2, 0, 0]));

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  leftArm.position.set(-0.42, 0.77, 0);
  rightArm.position.set(0.42, 0.77, 0);
  hips.add(leftArm, rightArm);
  leftArm.add(mesh(new THREE.CapsuleGeometry(0.105, 0.34, 4, 8), materials.suit, [0, -0.18, 0], [0, 0, -0.08]));
  rightArm.add(mesh(new THREE.CapsuleGeometry(0.105, 0.34, 4, 8), materials.suit, [0, -0.18, 0], [0, 0, 0.08]));
  const leftForearm = new THREE.Group();
  const rightForearm = new THREE.Group();
  leftForearm.position.set(0, -0.37, 0);
  rightForearm.position.set(0, -0.37, 0);
  leftArm.add(leftForearm);
  rightArm.add(rightForearm);
  leftForearm.add(mesh(new THREE.CapsuleGeometry(0.095, 0.28, 4, 8), materials.suitShadow, [0, -0.16, 0]));
  rightForearm.add(mesh(new THREE.CapsuleGeometry(0.095, 0.28, 4, 8), materials.suitShadow, [0, -0.16, 0]));
  leftForearm.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), materials.glove, [0, -0.34, 0]));
  rightForearm.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), materials.glove, [0, -0.34, 0]));

  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  // A wider stance gives the astronaut a stable, deliberate lunar gait.
  leftLeg.position.set(-0.23, 0.2, 0);
  rightLeg.position.set(0.23, 0.2, 0);
  hips.add(leftLeg, rightLeg);
  leftLeg.add(mesh(new THREE.CapsuleGeometry(0.12, 0.36, 4, 8), materials.suit, [0, -0.2, 0]));
  rightLeg.add(mesh(new THREE.CapsuleGeometry(0.12, 0.36, 4, 8), materials.suit, [0, -0.2, 0]));
  const leftBoot = new THREE.Group();
  const rightBoot = new THREE.Group();
  leftBoot.position.set(0, -0.42, 0);
  rightBoot.position.set(0, -0.42, 0);
  leftLeg.add(leftBoot);
  rightLeg.add(rightBoot);
  leftBoot.add(mesh(new THREE.CapsuleGeometry(0.13, 0.3, 4, 8), materials.suitShadow, [0, -0.16, -0.03], [Math.PI / 2, 0, 0]));
  rightBoot.add(mesh(new THREE.CapsuleGeometry(0.13, 0.3, 4, 8), materials.suitShadow, [0, -0.16, -0.03], [Math.PI / 2, 0, 0]));

  const animation = {
    action: "idle",
    blend: 1,
    walkPhase: 0,
    talkPhase: 0,
    elapsed: 0,
    thrusterActive: false
  };
  const motion = { from: new THREE.Vector3(), to: new THREE.Vector3(), duration: 0, elapsed: 0, active: false };
  const baseRotation = { x: 0, y: options.rotationY || 0, z: 0 };
  const fallbackChildren = [...root.children];
  let mixer = null;
  let loadedModel = null;
  let loadedClips = [];
  let activeClipAction = null;

  function disposeObject(object) {
    object.traverse?.((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const materialsToDispose = Array.isArray(child.material) ? child.material : [child.material];
        materialsToDispose.forEach((material) => material.dispose());
      }
    });
  }

  function clipForAction(action) {
    const patterns = {
      idle: /idle|t-?pose/i,
      walk: /walk/i,
      float: /float|idle/i,
      talk: /talk|idle/i,
      point: /point|idle/i,
      react: /react|run/i,
      celebrate: /celebrat|jump|run/i,
      disappointed: /sad|hurt|idle/i,
      "lunar-walk": /walk|idle/i,
      loping: /run|walk|idle/i,
      jumping: /jump|celebrat|idle/i,
      airborne: /float|idle/i,
      thruster: /float|idle/i,
      landing: /land|idle/i
    };
    const pattern = patterns[action] || patterns.idle;
    return loadedClips.find((clip) => pattern.test(clip.name)) || loadedClips[0] || null;
  }

  function updateLoadedAction(action) {
    if (!mixer) return;
    const clip = clipForAction(action);
    if (!clip) return;
    const nextAction = mixer.clipAction(clip);
    if (activeClipAction === nextAction) return;
    nextAction.reset().setEffectiveWeight(1).fadeIn(0.16).play();
    activeClipAction?.fadeOut(0.16);
    activeClipAction = nextAction;
  }

  function setAction(action) {
    const next = [
      "idle", "walk", "float", "talk", "point", "react", "celebrate", "disappointed",
      "lunar-walk", "loping", "jumping", "airborne", "thruster", "landing"
    ].includes(action)
      ? action : "idle";
    if (animation.action !== next) animation.blend = 0;
    animation.action = next;
    updateLoadedAction(next);
  }

  function setThrusterActive(nextActive) {
    animation.thrusterActive = Boolean(nextActive);
    root.userData.thrusterActive = animation.thrusterActive;
  }

  function moveTo(position, duration = 1.8) {
    motion.from.copy(root.position);
    motion.to.set(...position);
    motion.duration = Math.max(0.2, duration);
    motion.elapsed = 0;
    motion.active = true;
    setAction("walk");
  }

  function update(delta, time) {
    animation.elapsed += delta;
    mixer?.update(delta);
    animation.blend = Math.min(1, animation.blend + delta * 4.2);
    if (motion.active) {
      motion.elapsed += delta;
      const progress = Math.min(1, motion.elapsed / motion.duration);
      const eased = progress * progress * (3 - 2 * progress);
      root.position.lerpVectors(motion.from, motion.to, eased);
      if (progress >= 1) {
        motion.active = false;
        setAction("talk");
      }
    }

    const walk = Math.sin(animation.elapsed * 5.8);
    const lope = Math.sin(animation.elapsed * 7.6);
    const talk = Math.sin(animation.elapsed * 4.4);
    const pulse = 0.5 + Math.sin(animation.elapsed * 3.5) * 0.5;
    const action = animation.action;
    const walkWeight = ["walk", "lunar-walk"].includes(action) ? animation.blend : 0;
    const lopingWeight = action === "loping" ? animation.blend : 0;
    const jumpingWeight = action === "jumping" ? animation.blend : 0;
    const airborneWeight = action === "airborne" ? animation.blend : 0;
    const thrusterWeight = action === "thruster" ? animation.blend : 0;
    const landingWeight = action === "landing" ? animation.blend : 0;
    const floatWeight = action === "float" ? animation.blend : 0;
    const talkWeight = action === "talk" ? animation.blend : 0;
    const pointWeight = action === "point" ? animation.blend : 0;
    const reactWeight = action === "react" ? animation.blend : 0;
    const celebrateWeight = action === "celebrate" ? animation.blend : 0;
    const disappointedWeight = action === "disappointed" ? animation.blend : 0;

    // Lunar walk keeps the torso quiet, the feet broad and nearly flat, and
    // uses short, low-amplitude leg swings instead of an Earth-like stride.
    // Loping adds the longer stride and visible bounding motion.
    leftLeg.rotation.x = walk * 0.16 * walkWeight
      + lope * 0.48 * lopingWeight
      + jumpingWeight * 0.22
      + airborneWeight * 0.3
      + thrusterWeight * 0.38
      + landingWeight * -0.2
      + floatWeight * 0.18;
    rightLeg.rotation.x = -walk * 0.16 * walkWeight
      - lope * 0.48 * lopingWeight
      + jumpingWeight * 0.18
      + airborneWeight * 0.26
      + thrusterWeight * 0.34
      + landingWeight * -0.16
      - floatWeight * 0.14;
    leftLeg.rotation.z = lopingWeight * -0.08 + airborneWeight * -0.13 + thrusterWeight * -0.16 + floatWeight * -0.07;
    rightLeg.rotation.z = lopingWeight * 0.08 + airborneWeight * 0.13 + thrusterWeight * 0.16 + floatWeight * 0.07;
    leftBoot.rotation.x = lopingWeight * 0.12 + airborneWeight * -0.2 + thrusterWeight * -0.25 + landingWeight * 0.18;
    rightBoot.rotation.x = lopingWeight * 0.12 + airborneWeight * -0.2 + thrusterWeight * -0.25 + landingWeight * 0.18;
    leftArm.rotation.x = -walk * 0.08 * walkWeight - lope * 0.27 * lopingWeight;
    rightArm.rotation.x = walk * 0.08 * walkWeight + lope * 0.27 * lopingWeight;
    leftArm.rotation.x += (floatWeight + airborneWeight) * Math.sin(animation.elapsed * 2.2) * 0.06;
    rightArm.rotation.x += (floatWeight + airborneWeight) * Math.sin(animation.elapsed * 2.2 + 0.7) * 0.06;
    leftArm.rotation.z = -0.12 - airborneWeight * 0.22 - thrusterWeight * 0.28 + floatWeight * -0.32 + celebrateWeight * -0.85 + reactWeight * -0.48;
    rightArm.rotation.z = 0.12 + airborneWeight * 0.22 + thrusterWeight * 0.28 + floatWeight * 0.32 + celebrateWeight * 0.85 + reactWeight * 0.48;
    leftForearm.rotation.x = talkWeight * (0.38 + talk * 0.12) + celebrateWeight * -0.55;
    rightForearm.rotation.x = talkWeight * (-0.3 - talk * 0.1) + celebrateWeight * -0.55;
    rightArm.rotation.x += pointWeight * -0.75;
    rightForearm.rotation.x += pointWeight * -0.58;
    head.rotation.x = talkWeight * Math.sin(animation.elapsed * 2.6) * 0.08 + disappointedWeight * 0.22;
    head.rotation.y = talkWeight * Math.sin(animation.elapsed * 2.1) * 0.1 + pointWeight * -0.14;
    hips.rotation.z = walkWeight * Math.sin(animation.elapsed * 5.8) * 0.018
      + lopingWeight * lope * 0.045;
    hips.rotation.x = lopingWeight * 0.08 + jumpingWeight * -0.06 + airborneWeight * -0.08 + thrusterWeight * -0.12 + landingWeight * 0.12;
    hips.position.y = 0.48
      + walkWeight * Math.abs(walk) * 0.018
      + lopingWeight * Math.abs(lope) * 0.11
      + jumpingWeight * 0.02
      + airborneWeight * 0.035
      + thrusterWeight * 0.045
      + landingWeight * (-0.08 + Math.abs(Math.sin(animation.elapsed * 18)) * 0.04)
      + floatWeight * Math.sin(animation.elapsed * 2.8) * 0.035
      + celebrateWeight * pulse * 0.08;
    if (!options.playerControlled) root.rotation.y = baseRotation.y;
    root.rotation.z = disappointedWeight * 0.03 + floatWeight * Math.sin(animation.elapsed * 1.8) * 0.018;
    const thrustPulse = 0.75 + (Math.sin(animation.elapsed * 9) + 1) * 0.16;
    thrusterFlames.forEach((flame, index) => {
      flame.visible = animation.thrusterActive;
      flame.scale.set(0.75, animation.thrusterActive ? thrustPulse + index * 0.04 : 0.01, 0.75);
      flame.material.emissiveIntensity = animation.thrusterActive ? 2.1 + thrustPulse * 1.2 : 0;
    });
    thrusterLight.visible = animation.thrusterActive;
    thrusterLight.intensity = animation.thrusterActive ? 0.35 + thrustPulse * 0.25 : 0;
    root.userData.animation = action;
  }

  function dispose() {
    root.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materialsToDispose = Array.isArray(object.material) ? object.material : [object.material];
        materialsToDispose.forEach((material) => material.dispose());
      }
    });
    mixer?.stopAllAction();
    parent.remove(root);
  }

  root.position.set(...(options.position || [0, -0.12, -1]));
  root.rotation.y = baseRotation.y;
  setAction("idle");

  async function loadAnimatedAsset() {
    const assetUrl = options.assetUrl || window.MOONBASE_ASTRONAUT_ASSET_URL
      || "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r180/examples/models/gltf/Soldier.glb";
    try {
      const { GLTFLoader } = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      loader.load(assetUrl, (gltf) => {
        if (!gltf?.scene || !root.parent) return;
        fallbackChildren.forEach((child) => {
          root.remove(child);
          disposeObject(child);
        });
        loadedModel = gltf.scene;
        loadedModel.name = `${root.name}-gltf`;
        loadedModel.scale.setScalar(Number(options.assetScale || 1));
        loadedModel.position.y = Number(options.assetYOffset || 0);
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const materialName = `${child.name || ""} ${child.material?.name || ""}`.toLowerCase();
            const visor = /visor|eye|face|head/.test(materialName);
            const equipment = /boot|belt|pack|armor|weapon|joint/.test(materialName);
            const previousMaterial = child.material;
            const material = new THREE.MeshStandardMaterial({
              color: visor ? 0x102856 : equipment ? 0x4a5f92 : 0xeaf2ff,
              emissive: visor ? 0x164c86 : 0x000000,
              emissiveIntensity: visor ? 0.72 : 0,
              roughness: visor ? 0.18 : 0.68,
              metalness: visor ? 0.18 : 0.04
            });
            child.material = material;
            if (previousMaterial) {
              const previousMaterials = Array.isArray(previousMaterial) ? previousMaterial : [previousMaterial];
              previousMaterials.forEach((oldMaterial) => oldMaterial.dispose?.());
            }
          }
        });
        root.add(loadedModel);
        loadedClips = gltf.animations || [];
        mixer = loadedClips.length ? new THREE.AnimationMixer(loadedModel) : null;
        root.userData.characterType = "animated-gltf-astronaut";
        root.userData.assetStatus = "loaded";
        updateLoadedAction(animation.action);
      }, undefined, () => {
        root.userData.assetStatus = "fallback";
      });
    } catch {
      root.userData.assetStatus = "fallback";
    }
  }

  if (options.loadAsset !== false) loadAnimatedAsset();
  return { root, setAction, setThrusterActive, moveTo, update, dispose };
}
