export function createPlayerController(THREE, {
  canvas,
  astronaut,
  cameraController,
  environment,
  onInteractionState,
  onInteract,
  onGateOpening,
  onGateOpened,
  onPlayerUpdate
} = {}) {
  const keys = new Set();
  const velocity = new THREE.Vector3();
  const desiredVelocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const nextPosition = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  const fallbackGroundY = -1.03;
  // The astronaut root is centered at the suit's boot plane. Keep a small
  // clearance above the sampled terrain so tiny numerical changes do not make
  // the feet clip into displaced crater floors or highland slopes.
  const playerGroundOffset = 0.05;
  const playerRadius = 0.34;
  const playerHeight = 1.95;
  // This scene uses one world unit as one metre for the player/terrain
  // collision layer. Lunar gravity is therefore applied directly in m/s².
  const lunarGravity = 1.62;
  const lunarWalkSpeed = 1.35;
  const lopingSpeed = 2.2;
  const jumpVelocity = 1.85;
  const lopingJumpVelocity = 2.05;
  const maxVerticalSpeed = 3.2;
  const groundAcceleration = 4.8;
  const groundDeceleration = 5.8;
  const airAcceleration = 1.55;
  const airDeceleration = 1.35;
  const groundEpsilon = 0.035;
  const maxTerrainStep = 0.46;
  const landingDuration = 0.24;
  const gateOpeningFallbackDuration = 1.35;
  const MOVEMENT_STATES = Object.freeze({
    LUNAR_WALK: "LUNAR_WALK",
    LOPING: "LOPING",
    JUMPING: "JUMPING",
    AIRBORNE: "AIRBORNE",
    LANDING: "LANDING"
  });
  const movementActions = {
    [MOVEMENT_STATES.LUNAR_WALK]: "lunar-walk",
    [MOVEMENT_STATES.LOPING]: "loping",
    [MOVEMENT_STATES.JUMPING]: "jumping",
    [MOVEMENT_STATES.AIRBORNE]: "airborne",
    [MOVEMENT_STATES.LANDING]: "landing"
  };
  // The moon surface remains a large explorable play area while the player
  // moves across it with low-gravity jumps and controlled backpack thrust.
  const bounds = { minX: -36.5, maxX: 36.5, minZ: -40.5, maxZ: 27.5 };
  let active = false;
  let paused = true;
  let mission = null;
  let focusedTarget = null;
  let lastTargetId = "";
  let attached = false;
  let verticalVelocity = 0;
  let grounded = true;
  let movementState = MOVEMENT_STATES.LUNAR_WALK;
  let landingElapsed = 0;
  let jumpElapsed = 0;
  let landingSpeed = 0;
  let gateOpeningTarget = null;
  let gateOpeningElapsed = 0;

  function terrainGroundY(x = astronaut.root.position.x, z = astronaut.root.position.z) {
    const terrainSurface = environment?.getTerrainHeight?.(x, z);
    if (Number.isFinite(terrainSurface)) return terrainSurface + playerGroundOffset;
    return fallbackGroundY;
  }

  function clearInput() {
    keys.clear();
  }

  function isEditableElement(element) {
    if (!element) return false;
    if (element.isContentEditable) return true;
    const tagName = String(element.tagName || "").toLowerCase();
    if (tagName === "input" || tagName === "textarea") return true;
    return Boolean(element.closest?.("input, textarea, [contenteditable=\"true\"], [contenteditable=\"plaintext-only\"]"));
  }

  function isMovementKey(key) {
    return ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(key);
  }

  function isSpaceKey(key) {
    return key === " " || key === "space";
  }

  function normalizeKey(event) {
    // Prefer the physical key code so movement and interaction still work when
    // the active keyboard layout changes the value of event.key (for example,
    // Arabic layouts report an Arabic character for the physical E key).
    const rawCode = String(event?.code || "").toLowerCase();
    if (rawCode.startsWith("key") && rawCode.length === 4) return rawCode.slice(3);
    const rawKey = String(event?.key || "").toLowerCase();
    return rawKey.startsWith("key") && rawKey.length === 4 ? rawKey.slice(3) : rawKey;
  }

  function setMovementState(nextState) {
    if (!movementActions[nextState]) return;
    movementState = nextState;
    astronaut.root.userData = astronaut.root.userData || {};
    astronaut.root.userData.movementState = movementState;
    astronaut.setAction?.(movementActions[movementState]);
  }

  function beginJump() {
    if (!active || paused || !grounded || movementState === MOVEMENT_STATES.LANDING) return false;
    grounded = false;
    const lopingLaunch = keys.has("shift")
      && (keys.has("w") || keys.has("a") || keys.has("s") || keys.has("d")
        || keys.has("arrowup") || keys.has("arrowdown") || keys.has("arrowleft") || keys.has("arrowright"));
    verticalVelocity = lopingLaunch ? lopingJumpVelocity : jumpVelocity;
    jumpElapsed = 0;
    landingElapsed = 0;
    landingSpeed = 0;
    setMovementState(MOVEMENT_STATES.JUMPING);
    return true;
  }

  function onKeyDown(event) {
    if (isEditableElement(event.target) || isEditableElement(document.activeElement)) {
      clearInput();
      return;
    }
    const key = normalizeKey(event);
    if (isSpaceKey(key)) {
      if (!event.repeat) {
        keys.add("space");
        if (active && !paused) {
          event.preventDefault();
          beginJump();
        }
      }
      return;
    }
    if (isMovementKey(key)) {
      keys.add(key);
      if (active && !paused) event.preventDefault();
      return;
    }
    if (key === "e" && !event.repeat && active && !paused) {
      event.preventDefault();
      // Recalculate proximity at the moment of interaction. A cached target
      // can belong to the previous mission station while the player has just
      // reached the next airlock, especially during a Day 1 -> Day 2 transition.
      const target = findInteractionTarget();
      if (target && !target.locked) {
        if (isMissionGate(target)) {
          startGateOpening(target);
          return;
        }
        paused = true;
        const dx = target.position[0] - astronaut.root.position.x;
        const dz = target.position[1] - astronaut.root.position.z;
        astronaut.root.rotation.y = Math.atan2(-dx, -dz);
        astronaut.setAction("talk");
        onInteract?.(target);
      }
    }
  }

  function onKeyUp(event) {
    const key = normalizeKey(event);
    if (isSpaceKey(key)) {
      keys.delete("space");
      return;
    }
    keys.delete(key);
  }

  function onBlur() {
    clearInput();
  }

  function onVisibilityChange() {
    if (document.hidden) clearInput();
  }

  function onPointerLockChange() {
    if (document.pointerLockElement !== canvas) clearInput();
  }

  function attach() {
    if (attached) return;
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp, { passive: true });
    window.addEventListener("blur", onBlur, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
    document.addEventListener("pointerlockchange", onPointerLockChange, { passive: true });
    attached = true;
  }

  function detach() {
    if (!attached) return;
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("pointerlockchange", onPointerLockChange);
    attached = false;
  }

  function intersectsCollider(position, collider, padding = playerRadius) {
    if (collider.enabled === false) return false;
    const colliderMinY = Number.isFinite(collider.minY) ? collider.minY : Number.NEGATIVE_INFINITY;
    const colliderMaxY = Number.isFinite(collider.maxY) ? collider.maxY : Number.POSITIVE_INFINITY;
    const playerMaxY = position.y + playerHeight;
    if (playerMaxY < colliderMinY || position.y > colliderMaxY) return false;
    const minX = collider.center[0] - collider.halfExtents[0] - padding;
    const maxX = collider.center[0] + collider.halfExtents[0] + padding;
    const minZ = collider.center[1] - collider.halfExtents[1] - padding;
    const maxZ = collider.center[1] + collider.halfExtents[1] + padding;
    return position.x > minX && position.x < maxX && position.z > minZ && position.z < maxZ;
  }

  function resolveCollisions(position, motion = null) {
    const boundedX = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
    const boundedZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z));
    if (motion && boundedX !== position.x) motion.x = 0;
    if (motion && boundedZ !== position.z) motion.z = 0;
    position.x = boundedX;
    position.z = boundedZ;
    const colliders = environment?.getCollisionObjects?.() || [];
    for (const collider of colliders) {
      if (!intersectsCollider(position, collider)) continue;
      const left = position.x - (collider.center[0] - collider.halfExtents[0]);
      const rightPush = (collider.center[0] + collider.halfExtents[0]) - position.x;
      const back = position.z - (collider.center[1] - collider.halfExtents[1]);
      const front = (collider.center[1] + collider.halfExtents[1]) - position.z;
      const smallest = Math.min(left, rightPush, back, front);
      if (smallest === left) {
        position.x = collider.center[0] - collider.halfExtents[0] - playerRadius;
        if (motion) motion.x = 0;
      } else if (smallest === rightPush) {
        position.x = collider.center[0] + collider.halfExtents[0] + playerRadius;
        if (motion) motion.x = 0;
      } else if (smallest === back) {
        position.z = collider.center[1] - collider.halfExtents[1] - playerRadius;
        if (motion) motion.z = 0;
      } else {
        position.z = collider.center[1] + collider.halfExtents[1] + playerRadius;
        if (motion) motion.z = 0;
      }
    }
    return position;
  }

  function findInteractionTarget() {
    const eventDay = Number(mission?.event?.day || mission?.day || 0);
    const gateId = environment?.getGateIdForDay?.(eventDay);
    const gateEntered = environment?.isGateEntered?.(eventDay) ?? false;
    const welcomeEntryActive = environment?.isWelcomeEntryActive?.() ?? eventDay === 0;
    const availableObjects = environment?.getInteractiveObjects?.() || [];
    const hasDayOneSolarStation = availableObjects.some((object) => object.id === "solar-array");
    const objects = availableObjects
      .filter((object) => {
        // Day 1 is solved at the solar array itself. The MoonBase entry gate
        // is only the welcome transition and must not replace the objective.
        if (eventDay === 1 && hasDayOneSolarStation) return object.id === "solar-array";
        // MoonBase 1 owns the Day 1 mission only. It remains usable after the
        // welcome button starts Day 1, but must not reopen the next mission
        // when the player returns to the first gate on a later day.
        if (object.id === "moonbase-entry") return welcomeEntryActive || (object.id === gateId && !gateEntered);
        if (object.id === gateId) return !gateEntered;
        return object.day === eventDay && gateEntered;
      });
    if (!objects.length || !astronaut?.root || !cameraController) return null;

    const playerPosition = astronaut.root.position;
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const object of objects) {
      const dx = playerPosition.x - object.position[0];
      const dz = playerPosition.z - object.position[1];
      const distance = Math.hypot(dx, dz);
      if (distance <= object.radius && distance < nearestDistance) {
        nearest = { ...object, distance };
        nearestDistance = distance;
      }
    }
    if (!nearest) return null;

    // The proximity check is the child-friendly affordance; the center-screen ray
    // gives the object an intentional, camera-facing interaction when several
    // stations are close together.
    const camera = cameraController.getCamera?.();
    if (camera) {
      raycaster.setFromCamera(center, camera);
      const hit = raycaster.intersectObjects(nearest.object?.children || [], true)[0];
      if (hit) return nearest;
    }
    return nearest;
  }

  function findLockedGateTarget(eventDay) {
    const gates = (environment?.getInteractiveObjects?.() || [])
      .filter((object) => object.id?.endsWith("-entry") && Number(object.day) > Number(eventDay || 0));
    if (!gates.length || !astronaut?.root) return null;
    const playerPosition = astronaut.root.position;
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const gate of gates) {
      const distance = Math.hypot(playerPosition.x - gate.position[0], playerPosition.z - gate.position[1]);
      if (distance <= gate.radius && distance < nearestDistance) {
        nearest = {
          ...gate,
          distance,
          available: false,
          locked: true,
          description: `Complete Mission Day ${Math.max(1, Number(gate.day) - 1)} before entering ${gate.name}.`
        };
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function isMissionGate(target) {
    return Boolean(target?.id?.endsWith("-entry"));
  }

  function startGateOpening(target) {
    if (!isMissionGate(target) || target.locked || gateOpeningTarget) return;
    gateOpeningTarget = target;
    gateOpeningElapsed = 0;
    paused = true;
    clearInput();
    environment?.setGateDoorOpen?.(target.id, true);
    onGateOpening?.(target);
  }

  function updateGateOpening(delta) {
    if (!gateOpeningTarget) return false;
    gateOpeningElapsed += delta;
    environment?.setGateDoorOpen?.(gateOpeningTarget.id, true);
    const isOpen = environment?.isGateDoorOpen?.(gateOpeningTarget.id)
      || gateOpeningElapsed >= gateOpeningFallbackDuration;
    if (isOpen) {
      const openedGate = gateOpeningTarget;
      gateOpeningTarget = null;
      gateOpeningElapsed = 0;
      paused = true;
      onGateOpened?.(openedGate);
    }
    return true;
  }

  function updateInteractionState() {
    if (gateOpeningTarget) return;
    const eventDay = Number(mission?.event?.day || mission?.day || 0);
    const target = active && !paused ? (findInteractionTarget() || findLockedGateTarget(eventDay)) : null;
    const targetId = target?.id || "";
    if (targetId === "moonbase-entry") {
      environment?.setEntryDoorOpen?.(true);
      environment?.setGateDoorOpen?.("moonbase-two-entry", false);
      environment?.setGateDoorOpen?.("moonbase-three-entry", false);
      environment?.setGateDoorOpen?.("moonbase-four-entry", false);
    } else if (isMissionGate(target) && !target.locked) {
      environment?.setEntryDoorOpen?.(false);
      environment?.setGateDoorOpen?.(targetId, true);
    } else if (isMissionGate(target) && target.locked) {
      environment?.setEntryDoorOpen?.(false);
      environment?.setGateDoorOpen?.("moonbase-two-entry", false);
      environment?.setGateDoorOpen?.("moonbase-three-entry", false);
      environment?.setGateDoorOpen?.("moonbase-four-entry", false);
    } else {
      if (active && !paused) {
        environment?.setEntryDoorOpen?.(false);
        environment?.setGateDoorOpen?.("moonbase-two-entry", false);
        environment?.setGateDoorOpen?.("moonbase-three-entry", false);
        environment?.setGateDoorOpen?.("moonbase-four-entry", false);
      }
    }
    if (targetId === lastTargetId) return;
    lastTargetId = targetId;
    focusedTarget = target;
    environment?.setInteractionFocus?.(targetId);
    // All mission gates use the same explicit E interaction as MoonBase 1.
    // Opening the door on proximity is only visual; the mission must not open
    // until the player deliberately presses E at that gate.
    onInteractionState?.(target ? { ...target, available: !target.locked } : null);
  }

  function updateMovement(delta) {
    const inputX = (keys.has("d") || keys.has("arrowright") ? 1 : 0)
      - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    const inputZ = (keys.has("s") || keys.has("arrowdown") ? 1 : 0)
      - (keys.has("w") || keys.has("arrowup") ? 1 : 0);

    direction.set(0, 0, 0);
    if (inputX || inputZ) {
      const basis = cameraController.getMovementBasis?.() || { yaw: 0 };
      forward.set(Math.sin(basis.yaw), 0, -Math.cos(basis.yaw));
      right.set(Math.cos(basis.yaw), 0, Math.sin(basis.yaw));
      direction.addScaledVector(forward, -inputZ).addScaledVector(right, inputX).normalize();
    }

    const wasGrounded = grounded;
    const hasHorizontalIntent = direction.lengthSq() > 0;
    const loping = grounded && hasHorizontalIntent && keys.has("shift") && movementState !== MOVEMENT_STATES.LANDING;
    const speed = loping ? lopingSpeed : lunarWalkSpeed;
    desiredVelocity.copy(direction).multiplyScalar(speed);
    if (grounded) {
      const acceleration = hasHorizontalIntent
        ? (loping ? groundAcceleration * 1.08 : groundAcceleration)
        : groundDeceleration;
      velocity.lerp(desiredVelocity, 1 - Math.exp(-acceleration * delta));
    } else {
      // The suit's mass and limited boot traction make airborne steering much
      // softer than surface walking. Releasing WASD bleeds momentum rather
      // than stopping the astronaut in place.
      if (hasHorizontalIntent) {
        velocity.lerp(desiredVelocity, 1 - Math.exp(-airAcceleration * delta));
      } else {
        velocity.multiplyScalar(Math.exp(-airDeceleration * delta));
      }
    }

    if (!grounded) {
      jumpElapsed += delta;
      // No atmosphere and no thruster assistance: this is purely ballistic
      // motion under the Moon's 1.62 m/s² surface gravity.
      verticalVelocity -= lunarGravity * delta;
      verticalVelocity = Math.max(-maxVerticalSpeed, Math.min(maxVerticalSpeed, verticalVelocity));
      if (movementState === MOVEMENT_STATES.JUMPING && jumpElapsed >= 0.28) {
        setMovementState(MOVEMENT_STATES.AIRBORNE);
      }
    } else {
      verticalVelocity = 0;
    }

    const displacement = Math.hypot(velocity.x, velocity.z, verticalVelocity) * delta;
    const substeps = Math.max(1, Math.ceil(displacement / (playerRadius * 0.7)));
    const stepDelta = delta / substeps;
    nextPosition.copy(astronaut.root.position);
    for (let step = 0; step < substeps; step += 1) {
      const previousX = nextPosition.x;
      const previousZ = nextPosition.z;
      nextPosition.addScaledVector(velocity, stepDelta);
      if (!wasGrounded || !grounded) nextPosition.y += verticalVelocity * stepDelta;
      let surfaceY = terrainGroundY(nextPosition.x, nextPosition.z);
      const previousSurfaceY = terrainGroundY(previousX, previousZ);
      // A crater wall or highland face should be an obstacle, not a hidden
      // vertical elevator. Allow smooth slopes, but stop a single movement
      // step from climbing an abrupt terrain rise.
      if (surfaceY - previousSurfaceY > maxTerrainStep) {
        nextPosition.x = previousX;
        nextPosition.z = previousZ;
        velocity.x = 0;
        velocity.z = 0;
        surfaceY = previousSurfaceY;
      }
      if (nextPosition.y <= surfaceY + groundEpsilon && (!wasGrounded || verticalVelocity <= 0)) {
        nextPosition.y = surfaceY;
        if (!wasGrounded && verticalVelocity <= 0) {
          landingSpeed = Math.abs(verticalVelocity);
          grounded = true;
          verticalVelocity = 0;
          landingElapsed = 0;
          astronaut.root.userData.landingSpeed = landingSpeed;
          astronaut.setLandingImpact?.(Math.min(1, landingSpeed / maxVerticalSpeed));
          setMovementState(MOVEMENT_STATES.LANDING);
        }
      }
      resolveCollisions(nextPosition, velocity);
    }

    if (wasGrounded && grounded) nextPosition.y = terrainGroundY(nextPosition.x, nextPosition.z);
    astronaut.root.position.x = nextPosition.x;
    astronaut.root.position.z = nextPosition.z;
    astronaut.root.position.y = nextPosition.y;
    if (direction.lengthSq() > 0 && velocity.lengthSq() > 0.02) {
      const targetRotation = Math.atan2(-direction.x, -direction.z);
      let rotationDelta = targetRotation - astronaut.root.rotation.y;
      rotationDelta = Math.atan2(Math.sin(rotationDelta), Math.cos(rotationDelta));
      astronaut.root.rotation.y += rotationDelta * (1 - Math.exp(-12 * delta));
    }

    if (grounded) {
      if (movementState === MOVEMENT_STATES.LANDING) {
        landingElapsed += delta;
        if (landingElapsed >= landingDuration) {
          setMovementState(loping ? MOVEMENT_STATES.LOPING : MOVEMENT_STATES.LUNAR_WALK);
        }
      } else if (movementState !== MOVEMENT_STATES.LANDING) {
        setMovementState(loping ? MOVEMENT_STATES.LOPING : MOVEMENT_STATES.LUNAR_WALK);
      }
    }
  }

  function setActive(nextActive) {
    active = Boolean(nextActive);
    if (!active) {
      paused = true;
      clearInput();
      verticalVelocity = 0;
      const surfaceY = terrainGroundY();
      grounded = astronaut.root.position.y <= surfaceY + groundEpsilon;
      if (grounded) astronaut.root.position.y = surfaceY;
      landingElapsed = 0;
      jumpElapsed = 0;
      setMovementState(grounded ? MOVEMENT_STATES.LUNAR_WALK : MOVEMENT_STATES.AIRBORNE);
      gateOpeningTarget = null;
      gateOpeningElapsed = 0;
      environment?.setEntryDoorOpen?.(false);
      environment?.setGateDoorOpen?.("moonbase-two-entry", false);
      environment?.setGateDoorOpen?.("moonbase-three-entry", false);
      environment?.setGateDoorOpen?.("moonbase-four-entry", false);
      focusedTarget = null;
      lastTargetId = "";
      environment?.setInteractionFocus?.("");
      onInteractionState?.(null);
    } else {
      paused = false;
      const surfaceY = terrainGroundY();
      grounded = astronaut.root.position.y <= surfaceY + groundEpsilon;
      if (grounded) {
        astronaut.root.position.y = surfaceY;
        verticalVelocity = 0;
        setMovementState(MOVEMENT_STATES.LUNAR_WALK);
      } else if (movementState === MOVEMENT_STATES.LUNAR_WALK || movementState === MOVEMENT_STATES.LOPING) {
        setMovementState(MOVEMENT_STATES.AIRBORNE);
      }
      attach();
    }
  }

  function setPaused(nextPaused) {
    paused = Boolean(nextPaused);
    if (paused) clearInput();
    updateInteractionState();
  }

  function setMissionState(nextMission) {
    mission = nextMission || null;
    updateInteractionState();
  }

  function update(delta) {
    const gateAnimating = updateGateOpening(delta);
    if (active && !paused && !gateAnimating) updateMovement(delta);
    updateInteractionState();
    if (astronaut?.root) {
      const eventDay = Number(mission?.event?.day || mission?.day || 0);
      const objective = environment?.getNavigationTarget?.()
        || (environment?.getInteractiveObjects?.() || []).find((object) => object.day === eventDay);
      const objectiveCoordinates = objective?.position
        ? { x: objective.position[0], z: objective.position[1] }
        : objective
          ? { x: objective.x, z: objective.z }
          : null;
      onPlayerUpdate?.({
        player: {
          x: astronaut.root.position.x,
          z: astronaut.root.position.z,
          heading: cameraController.getMovementBasis?.().yaw ?? astronaut.root.rotation.y
        },
        movementState,
        airborne: !grounded,
        landingSpeed,
        objective: objectiveCoordinates
      });
    }
  }

  function dispose() {
    detach();
    clearInput();
  }

  attach();
  return {
    setActive,
    setPaused,
    setMissionState,
    focus: () => canvas?.focus?.({ preventScroll: true }),
    update,
    dispose,
    getMotionState: () => ({
      grounded,
      verticalVelocity,
      movementState,
      landingSpeed,
      gateOpening: Boolean(gateOpeningTarget)
    }),
    getFocusedTarget: () => focusedTarget,
    isActive: () => active,
    isPaused: () => paused
  };
}
