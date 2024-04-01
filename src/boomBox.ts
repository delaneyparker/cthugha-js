import { Framebuffer } from "./framebuffer";
import { WaveEffects } from "./waveEffects";

export class BoomBox {
  private x: number;
  private y: number;
  private initialX: number;
  private initialY: number;
  private velocityX: number;
  private velocityY: number;
  private colorIndex: number;
  private cycleSpeed: number;
  private cycleCounter: number;
  private size: number;

  constructor(initialX: number, initialY: number, size: number = 2) {
    this.x = initialX;
    this.y = initialY;
    this.initialX = initialX;
    this.initialY = initialY;
    this.size = size;
    this.colorIndex = 0;
    this.cycleCounter = 0;
    this.cycleSpeed = 1;
    this.reset();
  }

  public reset(): void {
    this.x = this.initialX;
    this.y = this.initialY;

    let rx = Math.random() * 2 + 1;
    let ry = Math.random() * 2 + 1;
    if (Math.random() < 0.5) {
      rx = -rx;
    }
    if (Math.random() < 0.5) {
      ry = -ry;
    }
    this.velocityX = rx;
    this.velocityY = ry;

    this.colorIndex = 0;
    this.cycleCounter = 0;
  }

  public changeCycleSpeed(delta: number): void {
    this.cycleSpeed = Math.min(Math.max(this.cycleSpeed + delta, 1), 32);
  }

  public setSize(newSize: number): void {
    this.size = newSize;
  }

  public update(framebuffer: Framebuffer, waveEffects: WaveEffects): void {
    const halfSize = Math.floor(this.size / 2);

    // Calculate next potential position
    const nextX = this.x + this.velocityX;
    const nextY = this.y + this.velocityY;

    // Check for collisions and adjust position and velocity accordingly
    if (nextX - halfSize <= 0 || nextX + halfSize >= framebuffer.width) {
      // Only flip the velocity if the ball is moving towards the edge
      if (
        (this.velocityX > 0 && nextX + halfSize >= framebuffer.width) ||
        (this.velocityX < 0 && nextX - halfSize <= 0)
      ) {
        this.velocityX *= -1;
      }
      this.x =
        this.velocityX > 0 ? halfSize + 1 : framebuffer.width - halfSize - 1;
    } else {
      this.x = nextX;
    }

    if (nextY - halfSize <= 0 || nextY + halfSize >= framebuffer.height) {
      // Only flip the velocity if the ball is moving towards the edge
      if (
        (this.velocityY > 0 && nextY + halfSize >= framebuffer.height) ||
        (this.velocityY < 0 && nextY - halfSize <= 0)
      ) {
        this.velocityY *= -1;
      }
      this.y =
        this.velocityY > 0 ? halfSize + 1 : framebuffer.height - halfSize - 1;
    } else {
      this.y = nextY;
    }

    // Cycle the color
    this.cycleCounter++;
    if (this.cycleCounter >= this.cycleSpeed) {
      this.cycleCounter = 0;
      this.colorIndex = (this.colorIndex + 1) % 256;
    }

    // Draw the box
    this.draw(framebuffer, waveEffects);
  }

  // Draw the ball on the framebuffer
  private draw(framebuffer: Framebuffer, waveEffects: WaveEffects): void {
    // Calculate the top-left corner based on the current center (x, y)
    const halfSize = Math.floor(this.size / 2);
    const startX = Math.floor(this.x - halfSize);
    const startY = Math.floor(this.y - halfSize);

    for (let dy = 0; dy < this.size; dy++) {
      for (let dx = 0; dx < this.size; dx++) {
        // Adjust framebuffer.setPixel to draw from the calculated start position
        framebuffer.setPixel(
          startX + dx,
          startY + dy,
          waveEffects.getColorFromTable(this.colorIndex)
        );
      }
    }
  }
}
