import { AudioManager } from "./audioManager";
import { FlameEffects } from "./flameEffects";
import { Framebuffer } from "./framebuffer";
import * as PIXI from "./pixi.js";
import { WaveEffects } from "./waveEffects";

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 200;
const DEFAULT_TARGET_FPS = 30;

// Use nearest neighbor scaling to maintain pixelation
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

export class Cthugha {
  private app: PIXI.Application;
  private width: number;
  private height: number;
  private running: boolean = false;

  private audioManager: AudioManager;
  private framebuffer: Framebuffer;

  private flameEffects: FlameEffects;
  private waveEffects: WaveEffects;

  constructor(
    audioManager: AudioManager,
    width: number = DEFAULT_WIDTH,
    height: number = DEFAULT_HEIGHT,
    targetFps: number = DEFAULT_TARGET_FPS
  ) {
    this.audioManager = audioManager;
    this.width = width;
    this.height = height;
    this.running = false;

    this.app = new PIXI.Application({
      width: width,
      height: height,
      antialias: false, // this is the default, but just in-case
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: 0x0,
    });
    this.app.ticker.maxFPS = targetFps;
    // this.app.ticker.add(this.update);

    // this.audioManager = new AudioManager();
    this.framebuffer = new Framebuffer(width, height);
    this.flameEffects = new FlameEffects(this.framebuffer);
    this.waveEffects = new WaveEffects(this.audioManager, this.framebuffer);

    const sprite = new PIXI.Sprite(this.framebuffer.texture);
    this.app.stage.addChild(sprite);

    Object.assign(this.app.view.style, {
      display: "block",
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "100%",
      height: "auto",
    });

    this.onResize();
    window.addEventListener("resize", this.onResize);
  }

  private onResize = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const appRatio = this.width / this.height;
    const windowRatio = viewportWidth / viewportHeight;

    let newWidth, newHeight;

    if (windowRatio < appRatio) {
      // Window is narrower than the game's aspect ratio
      newWidth = viewportWidth;
      newHeight = newWidth / appRatio;
    } else {
      // Window is as wide or wider than the game's aspect ratio
      newHeight = Math.min(viewportHeight, viewportWidth / appRatio);
      newWidth = newHeight * appRatio;
    }

    // Adjust the canvas style to align and scale properly
    Object.assign(this.app.view.style, {
      width: `${newWidth}px`,
      height: `${newHeight}px`,
      maxWidth: "100%",
      maxHeight: "100%",
      margin: "auto",
    });
  };

  public getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }

  public show(): void {
    Object.assign(this.app.view.style, {
      display: "block",
    });
  }

  public hide(): void {
    Object.assign(this.app.view.style, {
      display: "none",
    });
  }

  public start(onTick: (delta: number) => void): void {
    this.app.ticker.add(onTick);
    this.show();
    this.running = true;
  }

  public pause(): void {
    this.app.ticker.stop();
    this.running = false;
  }

  public resume(): void {
    this.app.ticker.start();
    this.show();
    this.running = true;
  }

  public stop(): void {
    this.hide();
    this.app.ticker.stop();
    this.running = false;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public setTargetFps(fps: number): void {
    this.app.ticker.maxFPS = Math.min(Math.max(fps, 1), 120);
  }

  public changeTargetFps(delta: number): void {
    this.setTargetFps(this.app.ticker.maxFPS + delta);
  }

  // TODO: Consider moving app controls here, versus exposing app components directly
  public getFramebuffer(): Framebuffer {
    return this.framebuffer;
  }
  public getFlameEffects(): FlameEffects {
    return this.flameEffects;
  }
  public getWaveEffects(): WaveEffects {
    return this.waveEffects;
  }
}
