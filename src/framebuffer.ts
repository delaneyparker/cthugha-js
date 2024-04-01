import { PALETTES } from "./palettes";
import * as PIXI from "./pixi.js";
import { tabData as hurr } from "./tabs/hurr";
import { tabData as moles } from "./tabs/moles";
import { tabData as rotate } from "./tabs/rotate";
import { tabData as yinYang } from "./tabs/yin-yang";

export class Framebuffer {
  public width: number;
  public height: number;
  private pixels: Uint8Array;
  private palette: number[];
  private paletteIndex: number;
  private cycleSpeed: number;
  private cycleCounter: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public texture: PIXI.Texture;

  private displayFunctions = [
    () => this.shiftUp(),
    () => this.shiftDown(),
    () => this.applyTab(hurr),
    () => this.applyTab(rotate),
    () => this.applyTab(yinYang),
    () => this.applyTab(moles),
    // Available, but not in rotation:
    // () => this.applyTab(spirOut),
    // () => this.applyTab(downSpiral),
    // () => this.applyTab(bigHalfWheel),
    // () => this.applyTab(vortex),
  ];
  private currentDisplayFunction: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height);
    this.cycleCounter = 0;
    this.cycleSpeed = 5;
    this.setPaletteIndex(5);

    // Create a canvas element to manipulate pixels
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;

    // Create a PIXI texture from the canvas
    this.texture = PIXI.Texture.from(this.canvas);
  }

  public nextDisplayFunction(): void {
    this.currentDisplayFunction =
      (this.currentDisplayFunction + 1) % this.displayFunctions.length;
  }

  public prevDisplayFunction(): void {
    this.currentDisplayFunction =
      (this.currentDisplayFunction - 1 + this.displayFunctions.length) %
      this.displayFunctions.length;
  }

  public randomDisplayFunction(): void {
    this.currentDisplayFunction = Math.floor(
      Math.random() * this.displayFunctions.length
    );
  }

  public getCurrentDisplayFunction(): number {
    return this.currentDisplayFunction;
  }

  public setCurrentDisplayFunction(index: number): void {
    this.currentDisplayFunction = index;
  }

  public translateScreen(): void {
    const displayFunction = this.displayFunctions[this.currentDisplayFunction];
    displayFunction();
  }

  public changeCycleSpeed(delta: number): void {
    this.cycleSpeed = Math.min(Math.max(this.cycleSpeed + delta, 1), 32);
  }

  private shiftUp(): void {
    const newPixels = new Uint8Array(this.width * this.height);
    for (let y = 1; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const newIndex = (y - 1) * this.width + x;
        const oldIndex = y * this.width + x;
        newPixels[newIndex] = this.pixels[oldIndex];
      }
    }

    // TODO: Keep?
    // for (let x = 0; x < this.width; x++) {
    //   newPixels[(this.height - 1) * this.width + x] = 0;
    // }

    this.pixels = newPixels;
  }

  private shiftDown(): void {
    const newPixels = new Uint8Array(this.width * this.height);
    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width; x++) {
        const newIndex = (y + 1) * this.width + x;
        const oldIndex = y * this.width + x;
        newPixels[newIndex] = this.pixels[oldIndex];
      }
    }

    // TODO: Keep?
    // for (let x = 0; x < this.width; x++) {
    //   newPixels[x] = 0;
    // }

    this.pixels = newPixels;
  }

  private applyTab(tab: number[]): void {
    let newPixels = new Uint8Array(this.width * this.height);
    newPixels[0] = 0;

    var index = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        newPixels[index] = this.pixels[tab[index]];
        index++;
      }
    }

    this.pixels = newPixels;
  }

  public updateTexture(): void {
    const imageData = this.ctx.createImageData(this.width, this.height);
    for (let i = 0; i < this.pixels.length; i++) {
      const color = this.palette[this.pixels[i]];
      const index = i * 4;
      imageData.data[index] = (color >> 16) & 0xff; // R
      imageData.data[index + 1] = (color >> 8) & 0xff; // G
      imageData.data[index + 2] = color & 0xff; // B
      imageData.data[index + 3] = 0xff; // A
    }
    this.ctx.putImageData(imageData, 0, 0);
    this.texture.update();
  }

  public getPaletteIndex(): number {
    return this.paletteIndex;
  }

  public setPaletteIndex(index: number): void {
    this.paletteIndex = index;
    this.setPalette(PALETTES[index]);
  }

  private setPalette(palette: number[]): void {
    this.palette = new Array(256).fill(0).map((_, i) => {
      const r = palette[i * 3];
      const g = palette[i * 3 + 1];
      const b = palette[i + 3 + 2];
      return (r << 16) | (g << 8) | b;
    });
  }

  public nextPalette(): void {
    const nextIndex = (this.paletteIndex + 1) % PALETTES.length;
    this.setPaletteIndex(nextIndex);
  }

  public prevPalette(): void {
    const prevIndex =
      (this.paletteIndex - 1 + PALETTES.length) % PALETTES.length;
    this.setPaletteIndex(prevIndex);
  }

  public randomPalette(): void {
    const randomIndex = Math.floor(Math.random() * PALETTES.length);
    this.setPaletteIndex(randomIndex);
  }

  public getPixel(x: number, y: number): number {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.pixels[y * this.width + x];
    }
    return 0;
  }

  public setPixel(x: number, y: number, colorIndex: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.pixels[y * this.width + x] = colorIndex;
    }
  }

  public fillGradient(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setPixel(x, y, (x + y) % 256);
      }
    }
  }

  public setBackgroundImage(imagePath: string): void {
    const image = new Image();
    image.onload = () => {
      this.ctx.drawImage(image, 0, 0, this.width, this.height);
      this.updateTextureFromCanvas();
    };
    image.src = imagePath;
  }

  private updateTextureFromCanvas(): void {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      // Update your framebuffer's pixel data based on the image
      // This assumes your pixels array is a 1D array mapping directly to the image data
      // You may need to adjust this logic based on your specific data structure
      const index = i / 4;
      this.pixels[index] = this.getColorIndex(
        imageData.data[i],
        imageData.data[i + 1],
        imageData.data[i + 2]
      );
    }
  }

  private getColorIndex(r: number, g: number, b: number): number {
    // Assume grayscale, so just use the red channel.
    return r;
  }

  public cyclePalette(): void {
    this.cycleCounter++;
    if (this.cycleCounter >= this.cycleSpeed) {
      this.cycleCounter = 0;
      const firstColor = this.palette.shift();
      this.palette.push(firstColor!);
    }
  }
}
