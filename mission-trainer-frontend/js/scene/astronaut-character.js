export function createAstronautCharacter(THREE, parent, options = {}) {
  const palette = {
    suit: options.suitColor || 0xf1f5f7,
    suitShadow: options.suitShadow || 0x9aa8b2,
    accent: options.accentColor || 0x63e9ef,
    visor: options.visorColor || 0x0b263d,
    pack: options.packColor || 0x263744,
    glove: options.gloveColor || 0xdbe4e9,
    seam: options.seamColor || 0x344957,
    insignia: options.insigniaColor || 0xf3bf58,
    boot: options.bootColor || 0x2d414d
  };
  const materials = {
    suit: new THREE.MeshStandardMaterial({ color: palette.suit, roughness: 0.64 }),
    suitShadow: new THREE.MeshStandardMaterial({ color: palette.suitShadow, roughness: 0.74 }),
    accent: new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 1.15, roughness: 0.32 }),
    visor: new THREE.MeshStandardMaterial({ color: palette.visor, emissive: 0x164c86, emissiveIntensity: 0.58, roughness: 0.12, metalness: 0.52 }),
    pack: new THREE.MeshStandardMaterial({ color: palette.pack, roughness: 0.6, metalness: 0.12 }),
    glove: new THREE.MeshStandardMaterial({ color: palette.glove, roughness: 0.72 }),
    thruster: new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 2.1, roughness: 0.25 }),
    oxygen: new THREE.MeshStandardMaterial({ color: 0xd8e5f3, roughness: 0.42, metalness: 0.24 }),
    seam: new THREE.MeshStandardMaterial({ color: palette.seam, roughness: 0.82, metalness: 0.08 }),
    insignia: new THREE.MeshStandardMaterial({ color: palette.insignia, emissive: 0x5e3d0b, emissiveIntensity: 0.2, roughness: 0.42, metalness: 0.35 }),
    boot: new THREE.MeshStandardMaterial({ color: palette.boot, roughness: 0.78, metalness: 0.08 })
  };

  const root = new THREE.Group();
  root.name = options.name || "astronaut-character";
  root.userData.characterType = "moonbase-eva-astronaut";
  root.userData.assetStatus = "procedural";
  root.userData.identityId = "moonbase-cadet-01";
  root.userData.sharedAcrossWorlds = true;
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
  hips.name = "pelvis-rig";
  hips.position.y = 0.48;
  root.add(hips);

  const torso = mesh(new THREE.CylinderGeometry(0.34, 0.43, 0.72, 12), materials.suit, [0, 0.53, 0]);
  torso.name = "pressure-torso";
  hips.add(torso);
  // The torso is layered like a modern EVA suit: pressure fabric, a hard
  // chest shell, ribbed waist seals, and a small readable life-support panel.
  hips.add(mesh(new THREE.BoxGeometry(0.58, 0.14, 0.33), materials.suitShadow, [0, 0.83, -0.02], [0, 0, 0], [1, 0.75, 1]));
  hips.add(mesh(new THREE.BoxGeometry(0.38, 0.24, 0.045), materials.pack, [0, 0.59, -0.38], [0.08, 0, 0]));
  hips.add(mesh(new THREE.BoxGeometry(0.28, 0.13, 0.018), materials.seam, [0, 0.61, -0.41]));
  hips.add(mesh(new THREE.BoxGeometry(0.07, 0.045, 0.02), materials.accent, [-0.11, 0.65, -0.425]));
  hips.add(mesh(new THREE.BoxGeometry(0.07, 0.045, 0.02), materials.insignia, [0.11, 0.65, -0.425]));
  for (const y of [0.31, 0.36]) {
    hips.add(mesh(new THREE.TorusGeometry(0.37, 0.014, 6, 20), materials.seam, [0, y, 0], [Math.PI / 2, 0, 0]));
  }
  hips.add(mesh(new THREE.BoxGeometry(0.72, 0.11, 0.28), materials.suitShadow, [0, 0.2, 0]));
  hips.add(mesh(new THREE.BoxGeometry(0.29, 0.14, 0.43), materials.accent, [0, 0.28, -0.05]));

  // Belt hardware and a compact utility pouch keep the silhouette readable
  // from the front, side, and the over-the-shoulder gameplay camera.
  hips.add(mesh(new THREE.BoxGeometry(0.13, 0.18, 0.14), materials.pack, [-0.38, 0.27, -0.03]));
  hips.add(mesh(new THREE.BoxGeometry(0.13, 0.18, 0.14), materials.pack, [0.38, 0.27, -0.03]));
  hips.add(mesh(new THREE.BoxGeometry(0.15, 0.08, 0.06), materials.insignia, [0, 0.25, -0.24]));

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
  hips.add(mesh(new THREE.BoxGeometry(0.54, 0.7, 0.25), materials.pack, [0, 0.61, 0.37]));
  hips.add(mesh(new THREE.BoxGeometry(0.4, 0.18, 0.32), materials.suitShadow, [0, 0.96, 0.35]));
  hips.add(mesh(new THREE.BoxGeometry(0.18, 0.32, 0.07), materials.seam, [-0.34, 0.61, 0.31]));
  hips.add(mesh(new THREE.BoxGeometry(0.18, 0.32, 0.07), materials.seam, [0.34, 0.61, 0.31]));
  hips.add(mesh(new THREE.BoxGeometry(0.22, 0.18, 0.1), materials.pack, [0, 0.67, 0.7]));
  hips.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.15, 10), materials.accent, [-0.27, 0.92, 0.51]));
  hips.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.15, 10), materials.accent, [0.27, 0.92, 0.51]));
  const oxygenHose = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.82, 0.62),
    new THREE.Vector3(-0.3, 0.9, 0.46),
    new THREE.Vector3(-0.27, 1.04, 0.24)
  ]);
  hips.add(new THREE.Mesh(new THREE.TubeGeometry(oxygenHose, 12, 0.025, 8, false), materials.pack));
  for (const side of [-1, 1]) {
    const shoulderHose = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.2, 0.86, 0.45),
      new THREE.Vector3(side * 0.35, 0.89, 0.22),
      new THREE.Vector3(side * 0.42, 0.78, 0.02)
    ]);
    hips.add(new THREE.Mesh(new THREE.TubeGeometry(shoulderHose, 10, 0.026, 8, false), materials.seam));
  }

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
  head.name = "helmet-rig";
  head.position.set(0, 1.04, 0);
  hips.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.38, 24, 16), materials.suit, [0, 0, 0], [0, 0, 0], [1, 1.06, 0.98]));
  head.add(mesh(new THREE.TorusGeometry(0.29, 0.035, 8, 24), materials.seam, [0, -0.02, -0.24]));
  head.add(mesh(new THREE.SphereGeometry(0.295, 24, 16), materials.visor, [0, 0.01, -0.265], [0.08, 0, 0], [1.12, 0.77, 0.42]));
  head.add(mesh(new THREE.TorusGeometry(0.3, 0.018, 8, 24), materials.accent, [0, 0.01, -0.30]));
  // A single soft reflection strip keeps the glass readable and friendly
  // without drawing a face or adding dialogue/UI to the character.
  head.add(mesh(new THREE.BoxGeometry(0.14, 0.025, 0.018), materials.accent, [-0.09, 0.11, -0.414], [0, 0, -0.22], [1, 0.72, 1]));
  head.add(mesh(new THREE.BoxGeometry(0.06, 0.13, 0.06), materials.pack, [-0.36, 0.0, 0], [0, 0, Math.PI / 2]));
  head.add(mesh(new THREE.BoxGeometry(0.06, 0.13, 0.06), materials.pack, [0.36, 0.0, 0], [0, 0, Math.PI / 2]));
  head.add(mesh(new THREE.BoxGeometry(0.045, 0.08, 0.04), materials.accent, [0.21, 0.35, 0]));
  hips.add(mesh(new THREE.TorusGeometry(0.27, 0.035, 8, 22), materials.seam, [0, 0.91, 0], [Math.PI / 2, 0, 0]));

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  leftArm.name = "left-arm-rig";
  rightArm.name = "right-arm-rig";
  leftArm.position.set(-0.42, 0.77, 0);
  rightArm.position.set(0.42, 0.77, 0);
  hips.add(leftArm, rightArm);
  leftArm.add(mesh(new THREE.SphereGeometry(0.14, 14, 10), materials.suitShadow));
  rightArm.add(mesh(new THREE.SphereGeometry(0.14, 14, 10), materials.suitShadow));
  leftArm.add(mesh(new THREE.CapsuleGeometry(0.105, 0.34, 4, 8), materials.suit, [0, -0.18, 0], [0, 0, -0.08]));
  rightArm.add(mesh(new THREE.CapsuleGeometry(0.105, 0.34, 4, 8), materials.suit, [0, -0.18, 0], [0, 0, 0.08]));
  leftArm.add(mesh(new THREE.TorusGeometry(0.115, 0.018, 6, 16), materials.seam, [0, -0.36, 0], [Math.PI / 2, 0, 0]));
  rightArm.add(mesh(new THREE.TorusGeometry(0.115, 0.018, 6, 16), materials.seam, [0, -0.36, 0], [Math.PI / 2, 0, 0]));
  // MoonBase insignia: an intentionally small gold mission mark on the
  // shoulder, visible at close range but never mistaken for official NASA branding.
  leftArm.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.014, 16), materials.insignia, [-0.13, -0.03, -0.02], [0, 0, Math.PI / 2]));
  leftArm.add(mesh(new THREE.BoxGeometry(0.018, 0.07, 0.012), materials.accent, [-0.139, -0.03, -0.02], [0, 0, Math.PI / 2]));
  leftArm.add(mesh(new THREE.BoxGeometry(0.07, 0.018, 0.012), materials.accent, [-0.139, -0.03, -0.02], [0, 0, Math.PI / 2]));
  const leftForearm = new THREE.Group();
  const rightForearm = new THREE.Group();
  leftForearm.name = "left-forearm-rig";
  rightForearm.name = "right-forearm-rig";
  leftForearm.position.set(0, -0.37, 0);
  rightForearm.position.set(0, -0.37, 0);
  leftArm.add(leftForearm);
  rightArm.add(rightForearm);
  leftForearm.add(mesh(new THREE.CapsuleGeometry(0.095, 0.28, 4, 8), materials.suitShadow, [0, -0.16, 0]));
  rightForearm.add(mesh(new THREE.CapsuleGeometry(0.095, 0.28, 4, 8), materials.suitShadow, [0, -0.16, 0]));
  leftForearm.add(mesh(new THREE.TorusGeometry(0.10, 0.018, 6, 16), materials.seam, [0, -0.29, 0], [Math.PI / 2, 0, 0]));
  rightForearm.add(mesh(new THREE.TorusGeometry(0.10, 0.018, 6, 16), materials.seam, [0, -0.29, 0], [Math.PI / 2, 0, 0]));
  leftForearm.add(mesh(new THREE.BoxGeometry(0.13, 0.11, 0.035), materials.pack, [-0.05, -0.16, -0.105], [0.1, 0, -0.12]));
  rightForearm.add(mesh(new THREE.BoxGeometry(0.13, 0.11, 0.035), materials.pack, [0.05, -0.16, -0.105], [-0.1, 0, 0.12]));
  leftForearm.add(mesh(new THREE.SphereGeometry(0.12, 14, 10), materials.glove, [0, -0.34, 0], [0, 0, 0], [1, 0.83, 1.08]));
  rightForearm.add(mesh(new THREE.SphereGeometry(0.12, 14, 10), materials.glove, [0, -0.34, 0], [0, 0, 0], [1, 0.83, 1.08]));
  for (const side of [-1, 1]) {
    const glove = side < 0 ? leftForearm : rightForearm;
    for (const offset of [-0.045, 0, 0.045]) {
      glove.add(mesh(new THREE.CapsuleGeometry(0.018, 0.055, 3, 6), materials.glove, [offset, -0.39, -0.07]));
    }
  }

  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  leftLeg.name = "left-leg-rig";
  rightLeg.name = "right-leg-rig";
  // A wider stance gives the astronaut a stable, deliberate lunar gait.
  leftLeg.position.set(-0.23, 0.2, 0);
  rightLeg.position.set(0.23, 0.2, 0);
  hips.add(leftLeg, rightLeg);
  leftLeg.add(mesh(new THREE.SphereGeometry(0.14, 14, 10), materials.suitShadow));
  rightLeg.add(mesh(new THREE.SphereGeometry(0.14, 14, 10), materials.suitShadow));
  leftLeg.add(mesh(new THREE.CapsuleGeometry(0.12, 0.36, 4, 8), materials.suit, [0, -0.2, 0]));
  rightLeg.add(mesh(new THREE.CapsuleGeometry(0.12, 0.36, 4, 8), materials.suit, [0, -0.2, 0]));
  leftLeg.add(mesh(new THREE.BoxGeometry(0.18, 0.14, 0.05), materials.suitShadow, [0, -0.36, -0.12]));
  rightLeg.add(mesh(new THREE.BoxGeometry(0.18, 0.14, 0.05), materials.suitShadow, [0, -0.36, -0.12]));
  const leftBoot = new THREE.Group();
  const rightBoot = new THREE.Group();
  leftBoot.name = "left-boot-rig";
  rightBoot.name = "right-boot-rig";
  leftBoot.position.set(0, -0.42, 0);
  rightBoot.position.set(0, -0.42, 0);
  leftLeg.add(leftBoot);
  rightLeg.add(rightBoot);
  leftBoot.add(mesh(new THREE.CapsuleGeometry(0.13, 0.3, 4, 8), materials.boot, [0, -0.16, -0.03], [Math.PI / 2, 0, 0]));
  rightBoot.add(mesh(new THREE.CapsuleGeometry(0.13, 0.3, 4, 8), materials.boot, [0, -0.16, -0.03], [Math.PI / 2, 0, 0]));
  leftBoot.add(mesh(new THREE.BoxGeometry(0.28, 0.07, 0.43), materials.seam, [0, -0.31, -0.07]));
  rightBoot.add(mesh(new THREE.BoxGeometry(0.28, 0.07, 0.43), materials.seam, [0, -0.31, -0.07]));
  for (const z of [-0.2, -0.08, 0.04]) {
    leftBoot.add(mesh(new THREE.BoxGeometry(0.22, 0.025, 0.035), materials.suitShadow, [0, -0.35, z]));
    rightBoot.add(mesh(new THREE.BoxGeometry(0.22, 0.025, 0.035), materials.suitShadow, [0, -0.35, z]));
  }

  const animation = {
    action: "idle",
    blend: 1,
    walkPhase: 0,
    talkPhase: 0,
    elapsed: 0,
    thrusterActive: false,
    landingImpact: 0
  };
  const motion = { from: new THREE.Vector3(), to: new THREE.Vector3(), duration: 0, elapsed: 0, active: false };
  const baseRotation = { x: 0, y: options.rotationY || 0, z: 0 };
  const fallbackChildren = [...root.children];
  let mixer = null;
  let loadedModel = null;
  let loadedClips = [];
  let activeClipAction = null;
  let loadedRig = null;

  function reportAssetStatus(status, error = null) {
    root.userData.assetStatus = status;
    if (typeof document !== "undefined" && root.name === "junior-astronaut") {
      document.documentElement.dataset.astronautAssetStatus = status;
    }
    options.onAssetStatus?.({ status, error, character: root.name, identityId: root.userData.identityId });
  }

  function disposeObject(object) {
    object.traverse?.((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const materialsToDispose = Array.isArray(child.material) ? child.material : [child.material];
        materialsToDispose.forEach((material) => material.dispose());
      }
    });
  }

  function tuneLoadedMaterial(material, meshName = "") {
    if (!material || !(material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)) return;
    const name = String(meshName || material.name || "").toLowerCase();
    // Preserve the downloaded PBR textures while making the important EVA
    // surfaces read consistently under MoonBase's hard, low-angle light.
    material.envMapIntensity = Math.max(1.15, Number(material.envMapIntensity) || 0);
    if (/visor|glass|helmet.?front|faceplate/.test(name)) {
      material.roughness = Math.min(Number(material.roughness ?? 0.18), 0.16);
      material.metalness = Math.max(Number(material.metalness ?? 0), 0.48);
    } else if (/backpack|life.?support|pack|tank|joint|boot|glove/.test(name)) {
      material.roughness = Math.max(Number(material.roughness ?? 0.58), 0.48);
    }
    material.needsUpdate = true;
  }

  function clipForAction(action) {
    const patterns = {
      idle: /idle|stand|t-?pose/i,
      walk: /walk/i,
      float: /float|idle|stand|t-?pose/i,
      "lunar-walk": /walk|idle/i,
      loping: /run|jog/i
    };
    const pattern = patterns[action] || patterns.idle;
    const matched = loadedClips.find((clip) => pattern.test(clip.name || ""));
    if (matched) return matched;
    return ["walk", "lunar-walk", "loping"].includes(action)
      ? loadedClips.find((clip) => /walk|run|jog/i.test(clip.name || "")) || null
      : null;
  }

  function updateLoadedAction(action) {
    if (!mixer) return;
    const clip = clipForAction(action);
    if (!clip) {
      activeClipAction?.fadeOut(0.16);
      activeClipAction?.stop();
      activeClipAction = null;
      return;
    }
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

  function setLandingImpact(nextImpact) {
    animation.landingImpact = Math.max(0, Math.min(1, Number(nextImpact) || 0));
  }

  function findBone(pattern) {
    let found = null;
    loadedModel?.traverse?.((child) => {
      if (!found && child.isBone && pattern.test(child.name || "")) found = child;
    });
    return found;
  }

  function setBoneRotation(bone, x, y, z, weight = 1) {
    if (!bone) return;
    const base = bone.userData.baseQuaternion || bone.quaternion.clone();
    const offsetEuler = bone.userData.poseOffsetEuler ||= new THREE.Euler();
    const offsetQuaternion = bone.userData.poseOffsetQuaternion ||= new THREE.Quaternion();
    // The values passed to this helper are local pose offsets. Multiplying a
    // small local quaternion onto the GLB bind/rest quaternion preserves the
    // source skeleton's axes and avoids treating the rest pose as XYZ=0.
    offsetEuler.set(x * weight, y * weight, z * weight, "XYZ");
    offsetQuaternion.setFromEuler(offsetEuler);
    bone.quaternion.copy(base).multiply(offsetQuaternion);
  }

  function cacheLoadedRigBaseRotations() {
    if (!loadedRig) return;
    Object.values(loadedRig).forEach((bone) => {
      if (!bone) return;
      bone.userData.baseRotation ||= {
        x: bone.rotation.x,
        y: bone.rotation.y,
        z: bone.rotation.z
      };
      bone.userData.baseQuaternion ||= bone.quaternion.clone();
    });
  }

  function updateLoadedRigPose(time) {
    if (!loadedRig) return;
    const action = animation.action;
    const breathing = Math.sin(time * 1.8) * 0.025;
    const poseWeight = animation.blend;
    const presentation = {
      head: loadedRig.head,
      neck: loadedRig.neck,
      leftArm: loadedRig.leftArm,
      rightArm: loadedRig.rightArm,
      leftForeArm: loadedRig.leftForeArm,
      rightForeArm: loadedRig.rightForeArm,
      leftLeg: loadedRig.leftLeg,
      rightLeg: loadedRig.rightLeg,
      leftLowerLeg: loadedRig.leftLowerLeg,
      rightLowerLeg: loadedRig.rightLowerLeg,
      leftFoot: loadedRig.leftFoot,
      rightFoot: loadedRig.rightFoot,
      spine: loadedRig.spine
    };
    cacheLoadedRigBaseRotations();
    // Let the source walk/run clips own the skeleton. Rig-bone poses below
    // are only for states that the downloaded asset does not provide.
    if (["walk", "lunar-walk", "loping"].includes(action)) return;
    const base = (bone) => bone?.userData.baseRotation || { x: 0, y: 0, z: 0 };
    const restore = (bone) => {
      if (!bone) return;
      if (bone.userData.baseQuaternion) {
        bone.quaternion.copy(bone.userData.baseQuaternion);
        return;
      }
      const rotation = base(bone);
      bone.rotation.set(rotation.x, rotation.y, rotation.z);
    };
    Object.values(presentation).forEach(restore);
    if (action === "idle" || action === "float") {
      setBoneRotation(loadedRig.spine, breathing, 0, 0, poseWeight);
      setBoneRotation(loadedRig.head, 0, Math.sin(time * 1.2) * 0.025, 0, poseWeight);
    } else if (action === "jumping" || action === "airborne" || action === "thruster") {
      // The GLB chain is Hips -> UpperLeg -> Leg -> Foot. Keep the thighs
      // hanging below the pelvis, add only a small knee bend, and keep the
      // boots aligned with the shins. These are local offsets from the
      // verified bind pose, not replacement rotations.
      setBoneRotation(loadedRig.leftArm, 0.16, 0, -0.14, poseWeight);
      setBoneRotation(loadedRig.rightArm, 0.16, 0, 0.14, poseWeight);
      setBoneRotation(loadedRig.leftLeg, 0.035, 0, -0.035, poseWeight);
      setBoneRotation(loadedRig.rightLeg, 0.035, 0, 0.035, poseWeight);
      setBoneRotation(loadedRig.leftLowerLeg, 0.12, 0, -0.02, poseWeight);
      setBoneRotation(loadedRig.rightLowerLeg, 0.12, 0, 0.02, poseWeight);
      setBoneRotation(loadedRig.leftFoot, 0.035, 0, 0, poseWeight);
      setBoneRotation(loadedRig.rightFoot, 0.035, 0, 0, poseWeight);
      setBoneRotation(loadedRig.spine, -0.045, 0, 0, poseWeight);
    } else if (action === "landing") {
      setBoneRotation(loadedRig.leftLeg, 0.08, 0, -0.025, poseWeight);
      setBoneRotation(loadedRig.rightLeg, 0.08, 0, 0.025, poseWeight);
      setBoneRotation(loadedRig.leftLowerLeg, -0.12, 0, -0.015, poseWeight);
      setBoneRotation(loadedRig.rightLowerLeg, -0.12, 0, 0.015, poseWeight);
      setBoneRotation(loadedRig.leftFoot, 0.06, 0, 0, poseWeight);
      setBoneRotation(loadedRig.rightFoot, 0.06, 0, 0, poseWeight);
      setBoneRotation(loadedRig.spine, -0.055, 0, 0, poseWeight);
    } else if (action === "talk" || action === "react") {
      setBoneRotation(loadedRig.head, Math.sin(time * 2.5) * 0.05, Math.sin(time * 2.1) * 0.08, 0, poseWeight);
      setBoneRotation(loadedRig.rightForeArm, -0.24, 0, 0.12, poseWeight);
    } else if (action === "point") {
      setBoneRotation(loadedRig.rightArm, -0.9, 0, 0.18, poseWeight);
      setBoneRotation(loadedRig.rightForeArm, -0.42, 0, 0.05, poseWeight);
      setBoneRotation(loadedRig.head, 0, -0.12, 0, poseWeight);
    } else if (action === "celebrate") {
      setBoneRotation(loadedRig.leftArm, -0.95, 0, -0.32, poseWeight);
      setBoneRotation(loadedRig.rightArm, -0.95, 0, 0.32, poseWeight);
      setBoneRotation(loadedRig.spine, -0.08, 0, 0, poseWeight);
    } else if (action === "disappointed") {
      setBoneRotation(loadedRig.head, 0.22, 0, 0, poseWeight);
      setBoneRotation(loadedRig.spine, 0.08, 0, 0, poseWeight);
    }
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
    animation.landingImpact = Math.max(0, animation.landingImpact - delta * 3.8);
    mixer?.update(delta);
    updateLoadedRigPose(animation.elapsed);
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
      + jumpingWeight * 0.06
      + airborneWeight * 0.08
      + thrusterWeight * 0.1
      + landingWeight * (-0.14 - animation.landingImpact * 0.08)
      + floatWeight * 0.18;
    rightLeg.rotation.x = -walk * 0.16 * walkWeight
      - lope * 0.48 * lopingWeight
      + jumpingWeight * 0.05
      + airborneWeight * 0.07
      + thrusterWeight * 0.09
      + landingWeight * (-0.12 - animation.landingImpact * 0.08)
      - floatWeight * 0.14;
    leftLeg.rotation.z = lopingWeight * -0.08 + airborneWeight * -0.055 + thrusterWeight * -0.06 + floatWeight * -0.07;
    rightLeg.rotation.z = lopingWeight * 0.08 + airborneWeight * 0.055 + thrusterWeight * 0.06 + floatWeight * 0.07;
    leftBoot.rotation.x = lopingWeight * 0.12 + airborneWeight * -0.045 + thrusterWeight * -0.05 + landingWeight * (0.12 + animation.landingImpact * 0.08);
    rightBoot.rotation.x = lopingWeight * 0.12 + airborneWeight * -0.045 + thrusterWeight * -0.05 + landingWeight * (0.12 + animation.landingImpact * 0.08);
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
    hips.rotation.x = lopingWeight * 0.08 + jumpingWeight * -0.025 + airborneWeight * -0.035 + thrusterWeight * -0.045 + landingWeight * 0.12;
    hips.position.y = 0.48
      + walkWeight * Math.abs(walk) * 0.018
      + lopingWeight * Math.abs(lope) * 0.11
      + jumpingWeight * 0.02
      + airborneWeight * 0.035
      + thrusterWeight * 0.045
      + landingWeight * (-0.06 - animation.landingImpact * 0.04 + Math.abs(Math.sin(animation.elapsed * 18)) * 0.03)
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
    // The procedural MoonBase EVA is the canonical playable identity. A GLB
    // may be supplied explicitly for a future production art pass, but the
    // game must never silently replace the astronaut with a generic soldier
    // or rely on a remote asset for the playable character.
    const assetUrl = options.assetUrl || window.MOONBASE_ASTRONAUT_ASSET_URL;
    if (!assetUrl) return;
    reportAssetStatus("loading");
    try {
      const { GLTFLoader } = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      loader.load(assetUrl, (gltf) => {
        if (!gltf?.scene || !root.parent) {
          reportAssetStatus("error", new Error("The astronaut GLB did not contain a scene."));
          return;
        }
        fallbackChildren.forEach((child) => {
          root.remove(child);
          disposeObject(child);
        });
        loadedModel = gltf.scene;
        loadedModel.name = `${root.name}-gltf`;
        loadedModel.rotation.y = Number(options.assetRotationY || 0);
        loadedModel.scale.setScalar(Number(options.assetScale || 1));
        const sourceBounds = new THREE.Box3().setFromObject(loadedModel);
        const sourceSize = sourceBounds.getSize(new THREE.Vector3());
        const targetHeight = Number(options.assetHeight || 1.95);
        if (sourceSize.y > 0 && targetHeight > 0) loadedModel.scale.multiplyScalar(targetHeight / sourceSize.y);
        const normalizedBounds = new THREE.Box3().setFromObject(loadedModel);
        loadedModel.position.y = -normalizedBounds.min.y + Number(options.assetYOffset || 0);
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const materialsToTune = Array.isArray(child.material) ? child.material : [child.material];
            materialsToTune.filter(Boolean).forEach((material) => tuneLoadedMaterial(material, child.name));
          }
        });
        const modelBounds = new THREE.Box3().setFromObject(loadedModel);
        const modelSize = modelBounds.getSize(new THREE.Vector3());
        const badge = new THREE.Group();
        badge.name = "moonbase-insignia";
        badge.position.set(-modelSize.x * 0.33, modelSize.y * 0.69, -modelSize.z * 0.49);
        badge.rotation.x = Math.PI / 2;
        badge.add(mesh(new THREE.CylinderGeometry(Math.max(0.035, modelSize.x * 0.045), Math.max(0.035, modelSize.x * 0.045), 0.012, 16), materials.insignia));
        badge.add(mesh(new THREE.BoxGeometry(Math.max(0.008, modelSize.x * 0.012), Math.max(0.04, modelSize.y * 0.04), 0.014), materials.accent, [0, 0, -0.012]));
        loadedModel.add(badge);
        root.add(loadedModel);
        loadedClips = gltf.animations || [];
        mixer = loadedClips.length ? new THREE.AnimationMixer(loadedModel) : null;
        loadedRig = {
          head: findBone(/^(head|headfront)$/i),
          neck: findBone(/^neck$/i),
          leftArm: findBone(/^leftarm$/i),
          rightArm: findBone(/^rightarm$/i),
          leftForeArm: findBone(/^leftforearm$/i),
          rightForeArm: findBone(/^rightforearm$/i),
          leftLeg: findBone(/^leftupleg$/i),
          rightLeg: findBone(/^rightupleg$/i),
          leftLowerLeg: findBone(/^leftleg$/i),
          rightLowerLeg: findBone(/^rightleg$/i),
          leftFoot: findBone(/^leftfoot$/i),
          rightFoot: findBone(/^rightfoot$/i),
          spine: findBone(/^spine02$/i)
        };
        // Capture the bind pose before the first walk/idle clip can modify
        // any bone rotations.
        cacheLoadedRigBaseRotations();
        root.userData.characterType = "rigged-glb-astronaut";
        root.userData.animationClips = loadedClips.map((clip) => clip.name || "(unnamed)");
        updateLoadedAction(animation.action);
        reportAssetStatus("ready");
      }, undefined, () => {
        reportAssetStatus("error", new Error("The local astronaut GLB could not be loaded."));
      });
    } catch (error) {
      reportAssetStatus("error", error);
    }
  }

  if (options.loadAsset !== false && (options.assetUrl || window.MOONBASE_ASTRONAUT_ASSET_URL)) loadAnimatedAsset();
  return { root, setAction, setThrusterActive, setLandingImpact, moveTo, update, dispose };
}
