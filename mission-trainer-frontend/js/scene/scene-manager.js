(() => {
  "use strict";

  const canvas = document.querySelector("#lunar-canvas");
  const sceneRoot = document.querySelector("#lunar-scene");
  const scriptUrl = document.currentScript?.src || new URL("../js/scene/scene-manager.js", window.location.href).href;
  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
  const SCENE_VERSION = "20261110-v59";

  if (!canvas || !sceneRoot) return;

  let renderer = null;
  let scene = null;
  let environment = null;
  let cameraController = null;
  let effects = null;
  let storyDirector = null;
  let playerController = null;
  let interactionHandler = window.MOONBASE_SCENE_INTERACTION_HANDLER || null;
  let animationFrame = 0;
  let lastTime = 0;
  let currentMode = "welcome";
  let hidden = document.hidden;
  let disposed = false;
  let onResize = null;
  let onVisibilityChange = null;
  let onContextLost = null;
  let onContextRestored = null;

  function setStatus(status) {
    sceneRoot.dataset.sceneStatus = status;
    document.documentElement.dataset.sceneStatus = status;
  }

  function notifyLifecycle(event, detail = null) {
    const callback = window.MOONBASE_SCENE_LIFECYCLE?.[event];
    if (typeof callback === "function") callback(detail);
  }

  function fallback(error = null) {
    if (disposed) return;
    setStatus("fallback");
    canvas.setAttribute("aria-hidden", "true");
    window.MOONBASE_SCENE_AVAILABLE = false;
    notifyLifecycle("onFallback", error);
  }

  function resize(camera, THREE) {
    if (!renderer || !camera) return;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  }

  // Tear down only the active world. The renderer/canvas are reused so a
  // destination change does not reload the app or discard the backend mission.
  function teardownScene() {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (onResize) window.removeEventListener("resize", onResize);
    if (onVisibilityChange) document.removeEventListener("visibilitychange", onVisibilityChange);
    if (onContextLost) canvas.removeEventListener("webglcontextlost", onContextLost);
    if (onContextRestored) canvas.removeEventListener("webglcontextrestored", onContextRestored);
    onResize = null;
    onVisibilityChange = null;
    onContextLost = null;
    onContextRestored = null;
    cameraController?.dispose();
    playerController?.dispose();
    storyDirector?.dispose();
    environment?.dispose();
    effects?.dispose?.();
    renderer?.dispose();
    renderer = null;
    scene = null;
    environment = null;
    cameraController = null;
    effects = null;
    storyDirector = null;
    playerController = null;
    window.MOONBASE_SCENE_AVAILABLE = false;
  }

  async function initialize() {
    setStatus("loading");
    try {
      const moduleUrl = (relativePath) => `${new URL(relativePath, scriptUrl).href}?v=${SCENE_VERSION}`;
      const [threeModule, lunarEnvironmentModule, marsEnvironmentModule, cameraModule, effectsModule, storyModule, playerModule] = await Promise.all([
        import(THREE_URL),
        import(moduleUrl("./lunar-environment.js")),
        import(moduleUrl("./mars-environment.js")),
        import(moduleUrl("./camera-controller.js")),
        import(moduleUrl("./scene-effects.js")),
        import(moduleUrl("./story-director.js")),
        import(moduleUrl("./player-controller.js"))
      ]);
      if (disposed) return;
      const THREE = threeModule;
      renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: "high-performance" });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      scene = new THREE.Scene();
      const world = window.MOONBASE_SCENE_WORLD === "moon" ? "moon" : "mars";
      document.documentElement.dataset.sceneWorld = world;
      // Each environment owns its atmospheric profile. Moon is retained as an
      // explicit comparison world; Mars is the default playable world.
      if (world === "moon") {
        scene.background = new THREE.Color(0x010204);
        scene.fog = null;
      }
      const camera = new THREE.PerspectiveCamera(37, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 100);
      environment = world === "mars"
        ? marsEnvironmentModule.createMarsEnvironment(THREE, scene)
        : lunarEnvironmentModule.createLunarEnvironment(THREE, scene);
      document.documentElement.dataset.environmentName = environment.root?.name || world;
      cameraController = cameraModule.createCameraController(THREE, camera, {
        canvas,
        collisionObjects: environment.getCollisionObjects?.() || [],
        terrainHeight: environment.getTerrainHeight?.()
      });
      effects = effectsModule.createSceneEffects(environment);
      storyDirector = storyModule.createStoryDirector(THREE, scene, environment, cameraController);
      const player = storyDirector.getPlayer();
      cameraController.setPlayer(player.root);
      playerController = playerModule.createPlayerController(THREE, {
        canvas,
        astronaut: player,
        cameraController,
        environment,
        onInteractionState: (target) => interactionHandler?.onProximity?.(target),
        onInteract: (target) => interactionHandler?.onInteract?.(target),
        onGateOpening: (target) => interactionHandler?.onGateOpening?.(target),
        onGateOpened: (target) => interactionHandler?.onGateOpened?.(target),
        onPlayerUpdate: (telemetry) => interactionHandler?.onPlayerUpdate?.(telemetry)
      });
      const initialMode = window.MOONBASE_SCENE_MODE || "welcome";
      currentMode = initialMode;
      const initialExplorable = ["game", "welcome", "day1Complete"].includes(initialMode);
      playerController.setMissionState(window.MOONBASE_SCENE_STATE || null);
      playerController.setActive(initialExplorable);
      playerController.setPaused(!initialExplorable);
      cameraController.setMode(initialMode);
      cameraController.setGameplayActive(initialExplorable);
      effects.setMode(initialMode);
      effects.setMissionState(window.MOONBASE_SCENE_STATE || null);
      storyDirector.setState(window.MOONBASE_SCENE_STORY || {
        screen: window.MOONBASE_SCENE_MODE || "welcome",
        mission: window.MOONBASE_SCENE_STATE || null,
        selectedChoiceId: null
      });
      resize(camera, THREE);
      setStatus("ready");

      const render = (time) => {
        if (disposed) return;
        animationFrame = window.requestAnimationFrame(render);
        if (hidden) return;
        const delta = Math.min(0.05, Math.max(0, (time - lastTime) / 1000 || 0));
        lastTime = time;
        environment.update(time, delta);
        cameraController.update(delta);
        effects.update(delta);
        playerController?.update(delta);
        storyDirector.update(delta, time);
        renderer.render(scene, camera);
      };
      onResize = () => resize(camera, THREE);
      onVisibilityChange = () => { hidden = document.hidden; };
      onContextLost = (event) => { event.preventDefault(); hidden = true; fallback(); };
      onContextRestored = () => { hidden = document.hidden; setStatus("ready"); };
      window.addEventListener("resize", onResize, { passive: true });
      document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
      canvas.addEventListener("webglcontextlost", onContextLost, { passive: false });
      canvas.addEventListener("webglcontextrestored", onContextRestored, { passive: true });
      animationFrame = window.requestAnimationFrame(render);

      window.MOONBASE_SCENE_AVAILABLE = true;
      notifyLifecycle("onReady");

      window.MoonBaseScene = {
        setInteractionHandler(handler) {
          interactionHandler = handler || null;
          window.MOONBASE_SCENE_INTERACTION_HANDLER = interactionHandler;
        },
        setMode(mode) {
          const enteringGameplay = mode === "game" && currentMode !== "game";
          currentMode = mode;
          window.MOONBASE_SCENE_MODE = mode;
          cameraController?.setMode(mode);
          effects?.setMode(mode);
          const explorable = ["game", "welcome", "day1Complete"].includes(mode);
          cameraController?.setGameplayActive(explorable);
          playerController?.setActive(explorable);
          if (enteringGameplay) playerController?.focus?.();
        },
        setMissionState(mission) {
          window.MOONBASE_SCENE_STATE = mission || null;
          effects?.setMissionState(mission);
          playerController?.setMissionState(mission);
        },
        setStoryState(story) {
          window.MOONBASE_SCENE_STORY = story || null;
          storyDirector?.setState(story || {});
          const explorable = ["game", "welcome", "day1Complete"].includes(story?.screen);
          cameraController?.setGameplayActive(explorable);
          playerController?.setActive(explorable);
          playerController?.setPaused(!explorable || Boolean(story?.interactionOpen) || Boolean(story?.loading) || Boolean(story?.paused));
        },
        setWorld(nextWorld = "mars") {
          const world = nextWorld === "moon" ? "moon" : "mars";
          if (world === document.documentElement.dataset.sceneWorld && environment) return;
          window.MOONBASE_SCENE_WORLD = world;
          document.documentElement.dataset.sceneWorld = world;
          setStatus("loading");
          teardownScene();
          initialize();
        },
        dispose() {
          disposed = true;
          teardownScene();
        }
      };
    } catch (error) {
      console.warn("MoonBase 3D scene unavailable; using the lightweight fallback.", error);
      fallback(error);
    }
  }

  const requestedWorld = new URL(window.location.href).searchParams.get("world");
  window.MOONBASE_SCENE_WORLD = window.MOONBASE_SCENE_WORLD || (requestedWorld === "moon" ? "moon" : "mars");
  window.MOONBASE_SCENE_MODE = window.MOONBASE_SCENE_MODE || "welcome";
  window.MOONBASE_SCENE_STORY = window.MOONBASE_SCENE_STORY || {
    screen: "welcome",
    mission: null,
    selectedChoiceId: null
  };
  initialize();
})();
