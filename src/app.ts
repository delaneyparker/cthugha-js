import { AudioManager } from "./audioManager";
import { BoomBox } from "./boomBox";
import { Cthugha } from "./cthugha";

// TODO:
// - Real playlist support (external JSON file?)
// - Implement "where's the music?" messages
// - Find a way to keep mobile devices awake (see end of this file)
// - Support other resolutions besides 320x200? (some of the tabs won't work as is, but otherwise should be doable)
// - Experiment with PIXI.js filters, maybe a CRT shader?

document.addEventListener("DOMContentLoaded", () => {
  const LONG_PRESS_THRESHOLD_MS = 500;
  const MENU_TIMEOUT_MS = 5000;

  let showBoomBoxes = false;
  let randomizerEnabled = true;
  let randomizeIntervalId: string | number | NodeJS.Timeout = null;
  let randomizeIntervalDuration = 1000;
  let enableColorCycling = false;

  // TODO: This is probably overkill, double protection against multiple instances of audio.
  let keyInputEnabled = true;

  const audioManager = new AudioManager();
  const cthugha = new Cthugha(audioManager);
  const framebuffer = cthugha.getFramebuffer();
  const flameEffects = cthugha.getFlameEffects();
  const waveEffects = cthugha.getWaveEffects();

  const boomBoxL = new BoomBox(
    framebuffer.width / 2 - 20,
    framebuffer.height / 2
  );
  const boomBoxR = new BoomBox(
    framebuffer.width / 2 + 20,
    framebuffer.height / 2
  );

  cthugha.start(() => {
    const leftLoudness = audioManager.getChannelLoudness(
      audioManager.leftAnalyser
    );
    const rightLoudness = audioManager.getChannelLoudness(
      audioManager.rightAnalyser
    );

    boomBoxL.setSize(Math.max(2, (leftLoudness / 256) * 100));
    boomBoxR.setSize(Math.max(2, (rightLoudness / 256) * 100));

    if (showBoomBoxes) {
      boomBoxL.update(framebuffer, waveEffects);
      boomBoxR.update(framebuffer, waveEffects);
    }

    if (enableColorCycling) {
      framebuffer.cyclePalette();
    }

    flameEffects.update();
    framebuffer.translateScreen();
    waveEffects.update();

    framebuffer.updateTexture();
  });
  document.body.appendChild(cthugha.getCanvas());

  // [-] UI ============= 🐉 here be dragons 🐉 =============|

  const menu = document.getElementById("menu");
  const audioSelector = document.getElementById("audioSelector");

  // Context menu event to prevent the default context menu from showing on long press
  document.body.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  menu.addEventListener("click", () => {
    menu.style.display = "none";
    setAudioSelectorVisible(true);
  });

  function setAudioSelectorVisible(show: boolean) {
    audioSelector.style.display = show ? "block" : "none";
  }
  // @ts-ignore - Expose the setAudioSelectorVisible function to the window for the HTML onclick attribute
  window.setAudioSelectorVisible = setAudioSelectorVisible;

  async function selectPlaylist(playlistName: string) {
    keyInputEnabled = false;
    switch (playlistName) {
      // TODO: Leaving this here as an example of how to add playlists...
      // case "dj2-continuum":
      //   await audioManager.setPlaylist(dj2Continuum);
      //   break;
      // case "dj2-low-orbit":
      //   await audioManager.setPlaylist(dj2LowOrbit);
      //   break;
      // ... TODO: Add more playlists
      default:
        console.error(`Unknown playlist: ${playlistName}`);
        break;
    }
    keyInputEnabled = true;
    setAudioSelectorVisible(false);
    updateMusicControls();
  }
  // @ts-ignore - Expose the selectPlaylist function to the window for the HTML onclick attribute
  window.selectPlaylist = selectPlaylist;

  async function startMicrophoneInput() {
    if (await audioManager.startMicrophoneInput()) {
      setAudioSelectorVisible(false);
      updateMusicControls();
    }
  }
  // @ts-ignore - Expose the startMicrophoneInput function to the window for the HTML onclick attribute
  window.startMicrophoneInput = startMicrophoneInput;

  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
  fileInput.addEventListener("change", async (event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const files = Array.from(target.files);
      const urls = files.map((file) => URL.createObjectURL(file));
      await audioManager.setPlaylist(urls);
      setAudioSelectorVisible(false);
      updateMusicControls();
      // Clear the input so the change event fires again, even with the same file.
      target.value = "";
    }
  });

  type ControlLock =
    | "effect"
    | "flame"
    | "palette"
    | "table"
    | "displayFunction"
    | "boomBoxes";
  let controlLocks: Record<ControlLock, boolean> = {
    effect: false,
    flame: false,
    palette: false,
    table: false,
    displayFunction: false,
    boomBoxes: false,
  };
  const toggleControlLock = (lockName: ControlLock) => {
    const locked = !controlLocks[lockName];
    controlLocks[lockName] = locked;
    if (!locked && !randomizerEnabled) {
      randomizerEnabled = true;
      updateControlMenuItems();
    }
  };

  const toggleBoomBoxes = () => {
    if (Math.random() < 0.1) {
      boomBoxL.reset();
      boomBoxR.reset();
    }
    showBoomBoxes = !showBoomBoxes;
  };

  const toggleRandomizerEnabled = () => {
    randomizerEnabled = !randomizerEnabled;
    controlLocks.boomBoxes = !randomizerEnabled;
    controlLocks.displayFunction = !randomizerEnabled;
    controlLocks.effect = !randomizerEnabled;
    controlLocks.flame = !randomizerEnabled;
    controlLocks.palette = !randomizerEnabled;
    controlLocks.table = !randomizerEnabled;
    updateControlMenuItems();
  };

  const randomizeEverything = () => {
    // If all controls are locked, randomize everything, otherwise this function would have nothing to do.
    if (!randomizerEnabled) {
      framebuffer.randomPalette();
      framebuffer.randomDisplayFunction();
      waveEffects.randomTable();
      waveEffects.randomEffect();
      flameEffects.randomFlame();
      if (Math.random() < 0.5) {
        toggleBoomBoxes();
      }
    } else {
      !controlLocks.palette && framebuffer.randomPalette();
      !controlLocks.displayFunction && framebuffer.randomDisplayFunction();
      !controlLocks.table && waveEffects.randomTable();
      !controlLocks.effect && waveEffects.randomEffect();
      !controlLocks.flame && flameEffects.randomFlame();
      if (Math.random() < 0.5) {
        !controlLocks.boomBoxes && toggleBoomBoxes();
      }
    }
  };
  randomizeEverything();

  const randomize = () => {
    const dice = Math.round(Math.random() * 6);
    if (dice == 0 && !controlLocks.palette) {
      framebuffer.randomPalette();
    }
    if (dice == 1 && !controlLocks.displayFunction) {
      framebuffer.randomDisplayFunction();
    }
    if (dice == 2 && !controlLocks.table) {
      waveEffects.randomTable();
    }
    if (dice == 3 && !controlLocks.effect) {
      waveEffects.randomEffect();
    }
    if (dice == 4 && !controlLocks.flame) {
      flameEffects.randomFlame();
    }
    if (dice == 5 && !controlLocks.boomBoxes) {
      toggleBoomBoxes();
    }
    // ... randomize more?
  };

  function startRandomizeTimer() {
    if (randomizeIntervalId !== null) {
      clearInterval(randomizeIntervalId);
    }
    randomizeIntervalId = setInterval(() => {
      if (randomizerEnabled) {
        randomize();
      }
    }, randomizeIntervalDuration);
  }
  startRandomizeTimer();

  function changeRandomizeInterval(newDuration: number) {
    if (newDuration > 0 && newDuration < 10000) {
      randomizeIntervalDuration = newDuration;
      startRandomizeTimer();
    }
  }

  function returnToMenu() {
    hideControlMenu(0);
    audioManager.stopAudio();

    setAudioSelectorVisible(false);
    const menu = document.getElementById("menu");
    menu.style.display = "flex";
  }

  // [-] UI - Control Menu

  type ControlMenuItem = {
    label: string | (() => string);
    onClick: () => void;
    onLockToggle?: () => void;
    lockState?: () => boolean;
  };

  const controlMenuItems: ControlMenuItem[] = [
    { label: "🔊", onClick: () => setAudioSelectorVisible(true) },
    {
      label: "🌊",
      onClick: () => waveEffects.nextEffect(),
      onLockToggle: () => toggleControlLock("effect"),
      lockState: () => controlLocks.effect,
    },
    {
      label: "🔥",
      onClick: () => flameEffects.nextFlame(),
      onLockToggle: () => toggleControlLock("flame"),
      lockState: () => controlLocks.flame,
    },
    {
      label: "🎨",
      onClick: () => framebuffer.nextPalette(),
      onLockToggle: () => toggleControlLock("palette"),
      lockState: () => controlLocks.palette,
    },
    {
      label: "🌈",
      onClick: () => waveEffects.nextTable(),
      onLockToggle: () => toggleControlLock("table"),
      lockState: () => controlLocks.table,
    },
    {
      label: "🌀",
      onClick: () => framebuffer.nextDisplayFunction(),
      onLockToggle: () => toggleControlLock("displayFunction"),
      lockState: () => controlLocks.displayFunction,
    },
    {
      label: "📻",
      onClick: () => toggleBoomBoxes(),
      onLockToggle: () => toggleControlLock("boomBoxes"),
      lockState: () => controlLocks.boomBoxes,
    },
    {
      label: () => (randomizerEnabled ? "🔮" : "🔒"),
      onClick: () => toggleRandomizerEnabled(),
    },
    { label: "🎲", onClick: () => randomizeEverything() },
    {
      label: () => (enableColorCycling ? "💫" : "✨"),
      onClick: () => {
        enableColorCycling = !enableColorCycling;
        updateControlMenuItems();
      },
    },
    // TODO: Animate boombox icon when boomboxes are enabled
    // TODO: { label: () => (crtEnabled ? "📺" : "🖥"), onClick: () => toggleCRT() },
    // { label: "⏱", onClick: () => changeRandomizeInterval(Math.random() * 10000)},
    // { label: "❌", onClick: () => returnToMenu() },
    { label: "❌", onClick: () => hideControlMenu() },
  ];

  function updateControlMenuItems() {
    // Clear existing items
    controlsContainer.innerHTML = "";

    controlMenuItems.forEach((control) => {
      const button = document.createElement("button");
      let pressTimer: number | null = null;

      button.innerHTML =
        typeof control.label === "function" ? control.label() : control.label;

      if (control.lockState && control.lockState()) {
        button.style.backgroundColor = "rgba(128, 0, 0, 0.5)";
        button.style.borderColor = "rgba(255, 0, 0, 0.5)";
      }

      const startPress = () => {
        // Clear any existing timer
        if (pressTimer !== null) {
          clearTimeout(pressTimer);
        }
        const startTime = Date.now();
        pressTimer = window.setTimeout(() => {
          // Long press action
          control.onLockToggle?.();
          updateControlMenuItems();
          resetHideMenuTimeout();
        }, LONG_PRESS_THRESHOLD_MS);
        button.dataset.startTime = startTime.toString();
      };

      const endPress = () => {
        const startTime = Number(button.dataset.startTime);
        const endTime = Date.now();
        const duration = endTime - startTime;
        if (duration < LONG_PRESS_THRESHOLD_MS) {
          // Short press action
          control.onClick();
          updateControlMenuItems();
          resetHideMenuTimeout();
        }
        // Always clear the timer
        clearTimeout(pressTimer);
        pressTimer = null;
      };

      // Touch / mouse events
      let lastTouchEventTime = 0;

      button.addEventListener(
        "touchstart",
        (event) => {
          lastTouchEventTime = Date.now();
          startPress();
          event.preventDefault();
        },
        { passive: false }
      );

      button.addEventListener("touchend", (event) => {
        lastTouchEventTime = Date.now();
        endPress();
        event.preventDefault();
      });

      button.addEventListener("mousedown", (event) => {
        if (Date.now() - lastTouchEventTime < 100) return; // Ignore if recently had a touch event
        startPress();
      });

      button.addEventListener("mouseup", (event) => {
        if (Date.now() - lastTouchEventTime < 100) return; // Ignore if recently had a touch event
        endPress();
      });

      async function buttonKeyDownHandler(event: KeyboardEvent) {
        if (event.code === "Enter" || event.code === "Space") {
          event.preventDefault();
          control.onClick();
          resetHideMenuTimeout();
        }
      }
      button.removeEventListener("keydown", buttonKeyDownHandler);
      button.addEventListener("keydown", buttonKeyDownHandler);

      controlsContainer.appendChild(button);
    });
  }

  const controlsContainer = document.getElementById("controlsContainer");
  const controlsMenu = document.getElementById("controlsMenu");
  updateControlMenuItems();

  var menuTimeout: number | NodeJS.Timeout = null;
  var fadeTimeout: number | NodeJS.Timeout = null;

  function showControlMenu() {
    clearTimeout(fadeTimeout);
    controlsMenu.style.opacity = "1";
    controlsMenu.style.display = "flex";
    resetHideMenuTimeout();
  }

  function hideControlMenu(ttl: number = 500) {
    controlsMenu.style.opacity = "0";
    fadeTimeout = setTimeout(() => (controlsMenu.style.display = "none"), ttl);
  }

  function resetHideMenuTimeout() {
    clearTimeout(menuTimeout);
    menuTimeout = setTimeout(() => {
      hideControlMenu();
    }, MENU_TIMEOUT_MS);
  }

  // Extend auto-hide timeout when interacting with the controls menu
  controlsMenu.addEventListener("mouseover", () => {
    resetHideMenuTimeout();
  });
  controlsMenu.addEventListener("mousedown", () => {
    clearTimeout(menuTimeout);
  });
  controlsMenu.addEventListener("mousemove", () => {
    resetHideMenuTimeout();
  });
  controlsMenu.addEventListener("mouseleave", () => {
    // TODO: Fade out the menu after a short delay?
    resetHideMenuTimeout();
  });
  controlsMenu.addEventListener("click", () => {
    resetHideMenuTimeout();
  });
  // controlsMenu.addEventListener(
  //   "touchstart",
  //   () => {
  //     resetHideMenuTimeout();
  //   },
  //   { passive: true }
  // );

  const handleMenuClick = (event: MouseEvent) => {
    if (!cthugha.isRunning()) {
      return;
    }
    const target = event.target as Node;

    // TODO: Should this be checking the timeout instead of display style?
    const isMenuVisible = controlsMenu.style.display === "flex";

    // Click inside the menu area
    if (controlsMenu.contains(target)) {
      if (isMenuVisible) {
        resetHideMenuTimeout();
      }
      return;
    }

    // Click outside the menu area
    if (isMenuVisible) {
      // TODO: Clicking the 🔮 / 🔒 button fades out the menu w/ the code below.
      // Find a way to prevent this from happening when the button is clicked.
      // hideControlMenu();
    } else {
      event.preventDefault();
      showControlMenu();
      clearTimeout(menuTimeout);
      menuTimeout = setTimeout(() => {
        hideControlMenu();
      }, MENU_TIMEOUT_MS);
    }
  };
  document.body.addEventListener("click", handleMenuClick);
  // document.body.addEventListener("touchstart", handleMenuClick);

  function setupAudioControls() {
    // Music playback controls
    const playPauseButton = document.getElementById("playPause");
    if (playPauseButton) {
      playPauseButton.onclick = () => {
        audioManager.togglePlayback();
        updateMusicControls();
      };
    }
    const prevTrackButton = document.getElementById("prevTrack");
    if (prevTrackButton) {
      prevTrackButton.onclick = () => {
        keyInputEnabled = false;
        audioManager.prevTrack();
        keyInputEnabled = true;
        updateMusicControls();
      };
    }
    const nextTrackButton = document.getElementById("nextTrack");
    if (nextTrackButton) {
      nextTrackButton.onclick = () => {
        keyInputEnabled = false;
        audioManager.nextTrack();
        keyInputEnabled = true;
        updateMusicControls();
      };
    }

    const volumeControl = document.getElementById(
      "volumeControl"
    ) as HTMLInputElement;
    if (volumeControl) {
      volumeControl.style.display = "block";
      volumeControl.oninput = (e) => {
        const input = e.target as HTMLInputElement;
        audioManager.setVolume(parseFloat(input.value));
        updateMusicControls();
      };
    }

    // Microphone gain control
    const muteButton = document.getElementById("mute");
    if (muteButton) {
      muteButton.onclick = () => {
        audioManager.toggleMicrophoneMute();
        updateMusicControls();
      };
    }
    const gainControl = document.getElementById(
      "gainControl"
    ) as HTMLInputElement;
    if (gainControl) {
      gainControl.oninput = (e) => {
        const input = e.target as HTMLInputElement;
        audioManager.setGain(parseFloat(input.value));
        updateMusicControls();
      };
    }
  }
  setupAudioControls();

  function updateMusicControls() {
    const musicControls = document.getElementById("musicControls");
    const microphoneControls = document.getElementById("microphoneControls");

    if (audioManager.isUsingMicrophone()) {
      musicControls.style.display = "none";
      microphoneControls.style.display = "flex";

      const muteButton = document.getElementById("mute");
      if (muteButton) {
        muteButton.textContent = audioManager.isMicrophoneMuted() ? "🔇" : "🎤";
      }
      const gainControl = document.getElementById(
        "gainControl"
      ) as HTMLInputElement;
      if (gainControl) {
        gainControl.value = audioManager.getGain().toString();
      }
    } else {
      musicControls.style.display = "flex";
      microphoneControls.style.display = "none";

      const playPauseLabel = document.getElementById("playPauseLabel");
      if (audioManager.isMusicPlaying()) {
        // playPauseLabel.textContent = "⏸";
        playPauseLabel.textContent = "■";
        // playPauseLabel.innerHTML = `
        // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="16" height="16">
        //   <rect width="100" height="100" fill="currentColor"/>
        // </svg>
        // `;
      } else {
        playPauseLabel.textContent = "▶";
        // playPauseLabel.textContent = "▶️";
        // playPauseLabel.innerHTML = `
        // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="16" height="16">
        //   <polygon points="0,0 100,50 0,100" fill="currentColor"/>
        // </svg>
        // `;
      }

      let volumeLabel = "🔇";
      if (audioManager.getVolume() > 0.7) {
        volumeLabel = "🔊";
      } else if (audioManager.getVolume() > 0) {
        volumeLabel = "🔉";
      }
      document.getElementById("volumeLabel").textContent = volumeLabel;

      let currentTrack = document.getElementById("currentTrack");
      if (currentTrack) {
        if (audioManager.isMusicPlaying()) {
          currentTrack.textContent = audioManager.getCurrentTrackInfo();
        } else {
          currentTrack.textContent = "[paused]";
        }
      }
    }
  }
  updateMusicControls();

  // [-] UI - Keyboard Input / Keyboard Shortcuts
  const keyStates: { [key: string]: boolean } = {};
  const latchKeys = ["ArrowLeft", "ArrowRight"];

  window.removeEventListener("keyup", keyUpHandler);
  window.addEventListener("keyup", keyUpHandler);
  function keyUpHandler(event: KeyboardEvent) {
    keyStates[event.code] = false;
  }

  window.removeEventListener("keydown", keyDownHandler);
  window.addEventListener("keydown", keyDownHandler);
  async function keyDownHandler(event: KeyboardEvent) {
    if (
      !keyInputEnabled ||
      event.metaKey ||
      event.ctrlKey ||
      (keyStates[event.code] && latchKeys.includes(event.code))
    ) {
      return;
    }

    keyStates[event.code] = true;

    if (event.code === "KeyX") {
      event.preventDefault();
      if (audioSelector.style.display === "block") {
        setAudioSelectorVisible(false);
      } else {
        returnToMenu();
      }
    }

    // If esape is pressed, hide whatever might be showing (control menu, title menu, etc.)
    if (event.code === "Escape") {
      if (controlsMenu.style.display === "flex") {
        hideControlMenu();
      }
      if (menu.style.display === "flex") {
        menu.style.display = "none";
      }
      if (audioSelector.style.display === "block") {
        setAudioSelectorVisible(false);
      }
    }

    // The following keys are only active when the visualizer is running, bail early if not.
    if (!cthugha.isRunning()) {
      return;
    }

    // Check if the event target is an interactive element
    const targetElement = event.target as HTMLElement;
    if (["INPUT", "BUTTON"].includes(targetElement.tagName)) {
      // If so, exit the handler early to allow default behavior
      return;
    }

    // If enter key is pressed, show menu (if not already showing)
    if (event.code === "Enter") {
      event.preventDefault();
      showControlMenu();
    }

    // Randomization controls
    if (event.code === "Space") {
      event.preventDefault();
      randomize();
    }
    if (event.code === "KeyR") {
      event.preventDefault();
      randomizeEverything();
    }
    if (
      (event.code === "Equal" || event.code === "NumpadAdd") &&
      !event.shiftKey
    ) {
      event.preventDefault();
      randomizerEnabled = true;
      updateControlMenuItems();
      changeRandomizeInterval(randomizeIntervalDuration - 100);
    }
    if (
      (event.code === "Minus" || event.code === "NumpadSubtract") &&
      !event.shiftKey
    ) {
      event.preventDefault();
      randomizerEnabled = true;
      updateControlMenuItems();
      changeRandomizeInterval(randomizeIntervalDuration + 100);
    }

    // Music / audio source control
    if (event.code === "KeyM" || event.code === "KeyA") {
      event.preventDefault();
      setAudioSelectorVisible(true);
    }

    // Visualizer parameter controls
    if (event.code === "KeyW") {
      event.preventDefault();
      if (!event.shiftKey) {
        waveEffects.nextEffect();
      } else {
        waveEffects.prevEffect();
      }
    }
    if (event.code === "KeyF") {
      event.preventDefault();
      if (!event.shiftKey) {
        flameEffects.nextFlame();
      } else {
        flameEffects.prevFlame();
      }
    }
    if (event.code === "KeyP") {
      event.preventDefault();
      if (!event.shiftKey) {
        framebuffer.nextPalette();
      } else {
        framebuffer.prevPalette();
      }
    }
    if (event.code === "KeyT") {
      event.preventDefault();
      if (!event.shiftKey) {
        waveEffects.nextTable();
      } else {
        waveEffects.prevTable();
      }
    }
    if (event.code === "KeyD") {
      event.preventDefault();
      if (!event.shiftKey) {
        framebuffer.nextDisplayFunction();
      } else {
        framebuffer.prevDisplayFunction();
      }
    }
    if (event.code === "KeyL") {
      event.preventDefault();
      toggleRandomizerEnabled();
    }
    if (event.code === "KeyB") {
      event.preventDefault();
      toggleBoomBoxes();
    }
    if (event.code === "KeyC") {
      event.preventDefault();
      enableColorCycling = !enableColorCycling;
      updateControlMenuItems();
    }

    // Playlist controls
    if (event.code == "ArrowLeft") {
      event.preventDefault();
      keyInputEnabled = false;
      await audioManager.prevTrack();
      keyInputEnabled = true;
    }
    if (event.code == "ArrowRight") {
      event.preventDefault();
      keyInputEnabled = false;
      await audioManager.nextTrack();
      keyInputEnabled = true;
    }

    // Up and down should control volume and/or microphone gain
    if (event.code == "ArrowUp") {
      event.preventDefault();
      if (audioManager.isUsingMicrophone()) {
        audioManager.setGain(audioManager.getGain() + 0.1);
      } else {
        audioManager.setVolume(audioManager.getVolume() + 0.1);
      }
      updateMusicControls();
    }
    if (event.code == "ArrowDown") {
      event.preventDefault();
      if (audioManager.isUsingMicrophone()) {
        audioManager.setGain(audioManager.getGain() - 0.1);
      } else {
        audioManager.setVolume(audioManager.getVolume() - 0.1);
      }
      updateMusicControls();
    }

    // If user presses shift and + or - keys, change the target FPS
    if (
      (event.code === "Equal" || event.code === "NumpadAdd") &&
      event.shiftKey
    ) {
      event.preventDefault();
      cthugha.changeTargetFps(1);
    }
    if (
      (event.code === "Minus" || event.code === "NumpadSubtract") &&
      event.shiftKey
    ) {
      event.preventDefault();
      cthugha.changeTargetFps(-1);
    }

    // Background image controls
    if (event.code === "KeyG") {
      event.preventDefault();
      framebuffer.fillGradient();
    }
    if (event.code === "KeyI") {
      event.preventDefault();
      framebuffer.setBackgroundImage("public/images/dparker.png");
    }
    if (event.code === "KeyZ") {
      event.preventDefault();
      framebuffer.setBackgroundImage("public/images/zaph.png");
    }

    // Visualizer parameter locks
    if (event.code === "Digit1") {
      event.preventDefault();
      toggleControlLock("effect");
      updateControlMenuItems();
    }
    if (event.code === "Digit2") {
      event.preventDefault();
      toggleControlLock("flame");
      updateControlMenuItems();
    }
    if (event.code === "Digit3") {
      event.preventDefault();
      toggleControlLock("palette");
      updateControlMenuItems();
    }
    if (event.code === "Digit4") {
      event.preventDefault();
      toggleControlLock("table");
      updateControlMenuItems();
    }
    if (event.code === "Digit5") {
      event.preventDefault();
      toggleControlLock("displayFunction");
      updateControlMenuItems();
    }
    if (event.code === "Digit6") {
      event.preventDefault();
      toggleControlLock("boomBoxes");
      updateControlMenuItems();
    }

    // Misc cycle speed controls
    if (event.code == "Digit7") {
      event.preventDefault();
      framebuffer.changeCycleSpeed(1);
    }
    if (event.code == "Digit8") {
      event.preventDefault();
      framebuffer.changeCycleSpeed(-1);
    }
    if (event.code == "Digit9") {
      event.preventDefault();
      boomBoxL.changeCycleSpeed(1);
      boomBoxR.changeCycleSpeed(1);
    }
    if (event.code == "Digit0") {
      event.preventDefault();
      boomBoxL.changeCycleSpeed(-1);
      boomBoxR.changeCycleSpeed(-1);
    }
  }

  // Update the URL hash with the current locked parameters
  // e.g. #p4d2t0e1f7b1, #p0d1e6b0, etc.
  function updateUrlHash() {
    let hash = "";

    const lockedParameters = Object.entries(controlLocks).filter(
      ([_, locked]) => locked
    );

    lockedParameters.forEach(([param, _]) => {
      let value = "";
      switch (param) {
        case "effect":
          value = `e${waveEffects.getCurrentEffect()}`;
          break;
        case "flame":
          value = `f${flameEffects.getCurrentFlame()}`;
          break;
        case "palette":
          value = `p${framebuffer.getPaletteIndex()}`;
          break;
        case "table":
          value = `t${waveEffects.getCurrentTable()}`;
          break;
        case "displayFunction":
          value = `d${framebuffer.getCurrentDisplayFunction()}`;
          break;
        case "boomBoxes":
          value = `b${showBoomBoxes ? "1" : "0"}`;
          break;
      }
      hash += value;
    });

    if (hash !== "") {
      hash = "#" + hash;
    }

    if (window.location.hash !== hash) {
      history.replaceState(null, "", window.location.pathname + hash);
    }
  }

  setInterval(() => {
    if (audioManager.isMusicPlaying() || audioManager.isUsingMicrophone()) {
      updateUrlHash();
    }
  }, 100);

  function restoreStateFromHash() {
    const hash = window.location.hash?.substring(1);

    if (!hash) {
      return;
    }

    const regex = /[efptdb]\d+/g;
    let match;

    while ((match = regex.exec(hash)) !== null) {
      const param = match[0].charAt(0);
      const value = parseInt(match[0].substring(1));

      switch (param) {
        case "e":
          waveEffects.setCurrentEffect(value);
          controlLocks.effect = true;
          break;
        case "f":
          flameEffects.setCurrentFlame(value);
          controlLocks.flame = true;
          break;
        case "p":
          framebuffer.setPaletteIndex(value);
          controlLocks.palette = true;
          break;
        case "t":
          waveEffects.setCurrentTable(value);
          controlLocks.table = true;
          break;
        case "d":
          framebuffer.setCurrentDisplayFunction(value);
          controlLocks.displayFunction = true;
          break;
        case "b":
          showBoomBoxes = value === 1;
          controlLocks.boomBoxes = true;
          break;
        default:
          console.error(`Unknown parameter in hash: ${param}`);
          break;
      }

      randomizerEnabled = !(
        controlLocks.effect &&
        controlLocks.flame &&
        controlLocks.palette &&
        controlLocks.table &&
        controlLocks.displayFunction &&
        controlLocks.boomBoxes
      );
    }
    updateControlMenuItems();
  }
  restoreStateFromHash();

  window.addEventListener("hashchange", () => {
    restoreStateFromHash();
  });

  // Here are a couple of ways we could keep the screen awake on mobile devices.
  // The wakeLock feature is pretty new and not supported in all browsers yet.
  // The video method is a bit of a hack, but it's more widely supported.
  // Not using either for now, but leaving the code here for reference.

  // async function requestWakeLock() {
  //   if ("wakeLock" in navigator) {
  //     const wakeLock = await navigator.wakeLock.request("screen");
  //     document.addEventListener("visibilitychange", async () => {
  //       if (document.visibilityState === "visible" && wakeLock !== null) {
  //         await navigator.wakeLock.request("screen");
  //       }
  //     });
  //   }
  // }
  // try {
  //   requestWakeLock();
  // } catch (err) {
  //   // Feature is probably not supported; ignore the error.
  // }

  // const video = document.createElement("video");
  // video.src = "public/video/keep-alive.mp4";
  // video.autoplay = true;
  // video.loop = true;
  // video.muted = true;
});
