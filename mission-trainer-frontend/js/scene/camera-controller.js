export function createCameraController(THREE, camera, options = {}) {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const canvas = options.canvas || null;
  const target = new THREE.Vector3(0, 1.6, 10.8);
  const lookTarget = new THREE.Vector3(0, 0.55, -3.4);
  const desired = new THREE.Vector3();
  const safePosition = new THREE.Vector3();
  const playerPosition = new THREE.Vector3();
  const probe = new THREE.Vector3();
  const pointer = { x: 0, y: 0 };
  const environmentLocations = options.storyLocations || {};
  const presets = {
    welcome: { position: [0, 2.1, 11.4], target: [0, 0.2, -3.2], strength: 1 },
    briefing: { position: [0.2, 1.7, 9.7], target: [0, 0.45, -3.9], strength: 0.7 },
    game: { position: [0, 3.2, 9.2], target: [0, 0.5, -1.8], strength: 0.42 },
    feedback: { position: [-0.5, 1.9, 9.5], target: [0, 0.65, -3.8], strength: 0.52 },
    day1Complete: { position: [-0.8, 2.15, 8.8], target: [0, 0.8, -3.7], strength: 0.62 },
    result: { position: [0, 2.4, 10.5], target: [0, 0.7, -3.2], strength: 0.78 }
  };
  let mode = "welcome";
  let storyTarget = "base";
  let player = null;
  let collisionObjects = options.collisionObjects || [];
  let terrainHeight = typeof options.terrainHeight === "function" ? options.terrainHeight : null;
  let gameplayActive = false;
  let presentationActive = false;
  let yaw = 0.34;
  // Start at a slightly elevated diagonal angle so the astronaut, base pad,
  // nearby slope, and distant highlands share the first gameplay frame.
  // Scroll still allows close-up inspection.
  let pitch = 0.29;
  let distance = 10.6;
  let pointerListenerAttached = false;
  let canvasListenerAttached = false;
  let wheelListenerAttached = false;

  function normalizeStoryTarget(location, fallback) {
    return {
      position: location?.position || location?.camera || fallback.position,
      target: location?.target || fallback.target
    };
  }

  const storyTargets = {
    base: { position: [0, 2.1, 11.4], target: [0, 0.4, -3.7] },
    solar: normalizeStoryTarget(environmentLocations.solar, { position: [4.45, 2.25, 3.8], target: [3.55, 0.55, -0.72] }),
    water: normalizeStoryTarget(environmentLocations.water, { position: [-3.7, 2.25, -6.3], target: [-6.8, 0.55, -10.8] }),
    grow: normalizeStoryTarget(environmentLocations.grow, { position: [17.8, 2.0, -9.6], target: [15, 0.55, -14] }),
    storm: normalizeStoryTarget(environmentLocations.storm, { position: [-4.3, 2.7, -18.9], target: [-9, 0.8, -23.7] }),
    // Each mission briefing is presented at the gate that owns that mission.
    // These targets face the front of the four airlocks instead of the old
    // station locations inside MoonBase 1.
    gate1: { position: [4.3, 2.45, 5.3], target: [0, 0.72, 0.05] },
    gate2: { position: [-8.6, 2.05, -4.6], target: [-8.6, 0.3, -10.8] },
    gate3: { position: [13.4, 2.05, -7.6], target: [13.4, 0.3, -14.0] },
    gate4: { position: [-11.3, 2.05, -17.3], target: [-11.3, 0.3, -23.7] }
  };

  function onPointerMove(event) {
    if (gameplayActive) {
      if (document.pointerLockElement !== canvas) return;
      yaw -= event.movementX * 0.0026;
      pitch = Math.max(-0.18, Math.min(0.9, pitch - event.movementY * 0.0022));
      return;
    }
    if (reducedMotion) return;
    pointer.x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    pointer.y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    document.documentElement.style.setProperty("--ui-tilt-x", pointer.x.toFixed(3));
    document.documentElement.style.setProperty("--ui-tilt-y", pointer.y.toFixed(3));
  }

  function onPointerLeave() {
    pointer.x = 0;
    pointer.y = 0;
    document.documentElement.style.setProperty("--ui-tilt-x", "0");
    document.documentElement.style.setProperty("--ui-tilt-y", "0");
  }

  function requestPointerLock() {
    if (!gameplayActive || !canvas || document.pointerLockElement === canvas) return;
    canvas.focus?.({ preventScroll: true });
    try {
      const lockRequest = canvas.requestPointerLock?.();
      // Some embedded browsers reject pointer lock even after a direct user
      // gesture. Keyboard movement remains usable, so treat that as a normal
      // capability limitation instead of an unhandled console error.
      lockRequest?.catch?.(() => {});
    } catch {
      // Pointer lock is optional for gameplay camera control.
    }
  }

  function onCanvasPointerDown(event) {
    if (event.button === 0) requestPointerLock();
  }

  function onCanvasWheel(event) {
    if (!gameplayActive) return;
    distance = Math.max(4.2, Math.min(12, distance + event.deltaY * 0.004));
    event.preventDefault();
  }

  function attachListeners() {
    if (!pointerListenerAttached) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("blur", onPointerLeave, { passive: true });
      pointerListenerAttached = true;
    }
    if (!canvasListenerAttached && canvas) {
      canvas.addEventListener("pointerdown", onCanvasPointerDown, { passive: true });
      canvasListenerAttached = true;
    }
    if (!wheelListenerAttached && canvas) {
      canvas.addEventListener("wheel", onCanvasWheel, { passive: false });
      wheelListenerAttached = true;
    }
  }

  function collides(position, padding = 0.12) {
    const terrainSurface = terrainHeight?.(position.x, position.z);
    if (Number.isFinite(terrainSurface)) {
      // Keep the camera above crater floors and rising terrain while tracing
      // the shoulder-camera path. The extra clearance avoids clipping into
      // the displaced mesh when the camera is close to the astronaut.
      if (position.y < terrainSurface + 0.18) return true;
    } else if (position.y < -0.6) {
      return true;
    }
    return collisionObjects.some((collider) => {
      const minX = collider.center[0] - collider.halfExtents[0] - padding;
      const maxX = collider.center[0] + collider.halfExtents[0] + padding;
      const minZ = collider.center[1] - collider.halfExtents[1] - padding;
      const maxZ = collider.center[1] + collider.halfExtents[1] + padding;
      return position.x > minX && position.x < maxX && position.z > minZ && position.z < maxZ;
    });
  }

  function collisionSafeCameraPosition(destination) {
    safePosition.copy(playerPosition);
    safePosition.y += 1.45;
    const origin = safePosition.clone();
    const steps = 24;
    for (let index = 1; index <= steps; index += 1) {
      const progress = index / steps;
      probe.lerpVectors(origin, destination, progress);
      if (collides(probe, 0.18)) break;
      safePosition.copy(probe);
    }
    return safePosition;
  }

  function updateGameplay(delta) {
    if (!player) return;
    playerPosition.copy(player.position);
    const horizontal = Math.cos(pitch) * distance;
    desired.set(
      playerPosition.x - Math.sin(yaw) * horizontal,
      playerPosition.y + 1.45 + Math.sin(pitch) * distance,
      playerPosition.z + Math.cos(yaw) * horizontal
    );
    const safe = collisionSafeCameraPosition(desired);
    const smoothing = 1 - Math.pow(0.00025, delta);
    camera.position.lerp(safe, smoothing);
    // Bias the look target toward the station so the third-person silhouette
    // stays readable without losing the base, Earth, or objective beacon.
    const forwardX = Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    lookTarget.set(playerPosition.x + forwardX * 3.5, playerPosition.y + 0.68, playerPosition.z + forwardZ * 3.5);
    camera.lookAt(lookTarget);
  }

  function updateStory(delta) {
    const preset = presets[mode] || presets.welcome;
    const destination = storyTargets[storyTarget] || storyTargets.base;
    const motion = reducedMotion ? 0 : preset.strength;
    target.set(destination.position[0] + pointer.x * motion * 0.48, destination.position[1] - pointer.y * motion * 0.24, destination.position[2]);
    lookTarget.set(destination.target[0] + pointer.x * motion * 0.24, destination.target[1] - pointer.y * motion * 0.12, destination.target[2]);
    const smoothing = 1 - Math.pow(0.0008, delta);
    camera.position.lerp(target, smoothing);
    camera.lookAt(lookTarget);
  }

  function setMode(nextMode) {
    mode = presets[nextMode] ? nextMode : "welcome";
    gameplayActive = mode === "game";
    if (mode === "welcome" || mode === "briefing") storyTarget = "base";
    if (!gameplayActive && document.pointerLockElement === canvas) document.exitPointerLock?.();
    attachListeners();
  }

  function setStoryTarget(nextTarget) {
    storyTarget = storyTargets[nextTarget] ? nextTarget : "base";
  }

  function setPlayer(nextPlayer) {
    player = nextPlayer || null;
  }

  function setCollisionObjects(nextObjects) {
    collisionObjects = nextObjects || [];
  }

  function setTerrainHeight(nextHeight) {
    terrainHeight = typeof nextHeight === "function" ? nextHeight : null;
  }

  function setGameplayActive(nextActive) {
    gameplayActive = Boolean(nextActive);
    if (!gameplayActive && document.pointerLockElement === canvas) document.exitPointerLock?.();
  }

  function setPresentationActive(nextActive) {
    presentationActive = Boolean(nextActive);
    if (presentationActive && document.pointerLockElement === canvas) document.exitPointerLock?.();
  }

  function setDistance(nextDistance) {
    distance = Math.max(4.2, Math.min(13, Number(nextDistance) || 10.6));
  }

  function setHeading(nextYaw) {
    const value = Number(nextYaw);
    if (Number.isFinite(value)) yaw = value;
  }

  function lookBy(deltaX = 0, deltaY = 0) {
    if (!gameplayActive || presentationActive) return;
    const horizontal = Number(deltaX);
    const vertical = Number(deltaY);
    if (Number.isFinite(horizontal)) yaw -= horizontal * 0.012;
    if (Number.isFinite(vertical)) pitch = Math.max(-0.18, Math.min(0.9, pitch - vertical * 0.009));
  }

  function update(delta) {
    if (gameplayActive && player && !presentationActive) updateGameplay(delta);
    else updateStory(delta);
  }

  function dispose() {
    if (pointerListenerAttached) {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
    }
    if (canvasListenerAttached && canvas) canvas.removeEventListener("pointerdown", onCanvasPointerDown);
    if (wheelListenerAttached && canvas) canvas.removeEventListener("wheel", onCanvasWheel);
    if (document.pointerLockElement === canvas) document.exitPointerLock?.();
  }

  attachListeners();
  setMode("welcome");
  return {
    setMode,
    setStoryTarget,
    setPlayer,
    setCollisionObjects,
    setTerrainHeight,
    setGameplayActive,
    setPresentationActive,
    setDistance,
    setHeading,
    lookBy,
    getCamera: () => camera,
    getMovementBasis: () => ({ yaw }),
    update,
    dispose
  };
}
