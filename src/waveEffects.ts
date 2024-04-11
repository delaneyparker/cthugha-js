//
// This code was adapted from the Cthugha V5.3 source code.
// To zaph & team: Thank you for inspiring us late night coders! =D
//
//
// Cthugha - Audio Seeded Image Processing
//
// Zaph, Digital Aasvogel Group, Torps Productions 1993-1994
//
// Copyright Information:
// ======================
//
// Some parts of the source are from the public domain and are not
// copyrighted.
//
// Some parts of the source bear explicit copyright notices from the
// author and are subject to the conditions listed there by the author.
//
// The remainder of the source (not already public domain, no explicit
// author's copyright notice) is Copyright 1994 by Torps Productions
// (a loosely associated and ever-growing group of fanatic programmers).
//
// The source code may be copied freely and may be used in other programs
// under the following conditions:
//  It may not be used in a commercial program without prior permission.
//  Please credit the author (in general, credit Cthugha and Torps
//  Productions) as the source of the code.
//
// This copyright notice is grafted from the Fractint copyright notice.
//
//
// Modifying the code:
// ===================
//
// Feel free to modify this source code, HOWEVER, please send any working
// changes/fixes to me (zaph@torps.com) for inclusion in future
// versions of the code.
//
// Distributing the code:
// ======================
//
// Feel free to distribute this code, as long as it is complete and contains
// all copyright information that was included in the original.
//
// Legal Issues:
// =============
//
// What legal issues ???
//
// Come on guys, this is for *fun*, get on with it, make it great, make us
// all famous!!!
//
//                                                zaph, 12May94

import { AudioManager } from "./audioManager";
import { Framebuffer } from "./framebuffer";

export class WaveEffects {
  private static readonly NUM_TABLES: number = 10;
  private static readonly NUM_EFFECTS: number = 23;

  private framebuffer: Framebuffer;
  private audioManager: AudioManager;
  private tables: number[][] = [];
  private currentTable: number = 0;
  private currentEffect: number = 0;

  private col: number = 0;
  private row: number = 0;
  private xoff0: number = 0;
  private yoff0: number = 0;
  private xoff1: number = 0;
  private yoff1: number = 0;
  private sine: number[] = new Array(320).fill(0);

  private audioBuffer: { left: number[]; right: number[] };

  constructor(audioManager: AudioManager, framebuffer: Framebuffer) {
    this.audioManager = audioManager;
    this.framebuffer = framebuffer;
    this.audioBuffer = {
      left: new Array(framebuffer.width).fill(0),
      right: new Array(framebuffer.width).fill(0),
    };
    this.initTables();
    this.initSine();
  }

  private initSine(): void {
    this.sine = new Array(320)
      .fill(0)
      .map((_, i) => 128 * Math.sin(i * 0.03927));
  }

  private updateAudioBuffer() {
    if (!this.audioManager.leftAnalyser || !this.audioManager.rightAnalyser) {
      return;
    }

    const leftData = new Uint8Array(this.audioManager.leftAnalyser.fftSize);
    const rightData = new Uint8Array(this.audioManager.rightAnalyser.fftSize);
    this.audioManager.leftAnalyser.getByteTimeDomainData(leftData);
    this.audioManager.rightAnalyser.getByteTimeDomainData(rightData);

    let alignIndexLeft = this.findAlignmentIndex(leftData);
    let alignIndexRight = this.findAlignmentIndex(rightData);

    for (let i = 0; i < this.framebuffer.width; i++) {
      // Wrap around if necessary
      let audioIndexLeft = (alignIndexLeft + i) % leftData.length;
      let audioIndexRight = (alignIndexRight + i) % rightData.length;

      this.audioBuffer.left[i] = leftData[audioIndexLeft];
      this.audioBuffer.right[i] = rightData[audioIndexRight];
    }
  }

  private findAlignmentIndex(data: Uint8Array): number {
    let prev = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i] >= 128 && prev < 128) {
        // At a zero crossing, use this as alignment point
        return i;
      }
      prev = data[i];
    }
    return 0; // Default to starting at the beginning if no alignment point found
  }

  private initTables() {
    for (let j = 0; j < WaveEffects.NUM_TABLES; j++) {
      this.tables[j] = [];
      for (let i = 0; i < 256; i++) {
        switch (j) {
          default:
          case 0:
            this.tables[j][i] = Math.abs(128 - i) * 2;
            break;
          case 1:
            this.tables[j][i] = 255 - Math.abs(128 - i) * 2;
            break;
          case 2:
            this.tables[j][i] = i;
            break;
          case 3:
            this.tables[j][i] = 255 - i;
            break;
          case 4:
            this.tables[j][i] = Math.abs(128 - i) + 127;
            break;
          case 5:
            this.tables[j][i] = 255 - Math.abs(128 - i) + 127;
            break;
          case 6:
            this.tables[j][i] = Math.floor(Math.random() * 256);
            break;
          case 7:
            this.tables[j][i] =
              Math.abs(128 - i) < 64 ? 255 : Math.abs(128 - i) * 4;
            break;
          case 8:
            this.tables[j][i] = Math.abs(128 - i);
            break;
          case 9:
            this.tables[j][i] = 255 - Math.abs(128 - i);
            break;
        }
      }
    }
  }

  public nextTable = () => {
    this.currentTable = (this.currentTable + 1) % WaveEffects.NUM_TABLES;
  };

  public prevTable = () => {
    this.currentTable =
      (this.currentTable - 1 + WaveEffects.NUM_TABLES) % WaveEffects.NUM_TABLES;
  };

  public randomTable = () => {
    this.currentTable = Math.floor(Math.random() * WaveEffects.NUM_TABLES);
  };

  public getCurrentTable = () => {
    return this.currentTable;
  };

  public setCurrentTable = (index: number) => {
    this.currentTable = index;
  };

  public nextEffect = () => {
    this.currentEffect = (this.currentEffect + 1) % WaveEffects.NUM_EFFECTS;
  };

  public prevEffect = () => {
    this.currentEffect =
      (this.currentEffect - 1 + WaveEffects.NUM_EFFECTS) %
      WaveEffects.NUM_EFFECTS;
  };

  public randomEffect = () => {
    this.currentEffect = Math.floor(Math.random() * WaveEffects.NUM_EFFECTS);
  };

  public getCurrentEffect = () => {
    return this.currentEffect;
  };

  public setCurrentEffect = (index: number) => {
    this.currentEffect = index;
  };

  public update() {
    this.updateAudioBuffer();
    switch (this.currentEffect) {
      case 0:
        this.waveEffect0();
        break;
      case 1:
        this.waveEffect1();
        break;
      case 2:
        this.waveEffect2();
        break;
      case 3:
        this.waveEffect3();
        break;
      case 4:
        this.waveEffect4();
        break;
      case 5:
        this.waveEffect5();
        break;
      case 6:
        this.waveEffect6();
        break;
      case 7:
        this.waveEffect7();
        break;
      case 8:
        this.waveEffect8();
        break;
      case 9:
        this.waveEffect9();
        break;
      case 10:
        this.waveEffect10();
        break;
      case 11:
        this.waveEffect11();
        break;
      case 12:
        this.waveEffect12();
        break;
      case 13:
        this.waveEffect13();
        break;
      case 14:
        this.waveEffect14();
        break;
      case 15:
        this.waveEffect15();
        break;
      case 16:
        this.waveEffect16();
        break;
      case 17:
        this.waveEffect17();
        break;
      case 18:
        this.peteEffect0();
        break;
      case 19:
        this.peteEffect1();
        break;
      case 20:
        this.peteEffect2();
        break;
      case 21:
        this.molesFract();
        break;
      case 22:
        this.molesFract2();
        break;
      default:
        console.log(`Wave effect ${this.currentEffect} not implemented.`);
    }
  }

  public getColorFromTable(index: number): number {
    return this.tables[this.currentTable][index];
  }

  private drawHorizontalWave(
    startX: number,
    endX: number,
    y: number,
    colorIndex: number
  ): void {
    const start = Math.min(startX, endX);
    const end = Math.max(startX, endX);

    for (let x = start; x <= end; x++) {
      this.framebuffer.setPixel(x, y, colorIndex);
    }
  }

  private drawVerticalWave(
    ystart: number,
    yend: number,
    x: number,
    colorIndex: number
  ) {
    const start = Math.min(ystart, yend);
    const end = Math.max(ystart, yend);

    for (let y = start; y <= end; y++) {
      this.framebuffer.setPixel(x, y, colorIndex);
    }
  }

  private doVWave(startY: number, endY: number, x: number, colorIndex: number) {
    if (startY > endY) [startY, endY] = [endY, startY]; // Ensure startY is less than endY
    for (let y = startY; y <= endY; y++) {
      this.framebuffer.setPixel(x, y, colorIndex);
    }
  }

  private waveEffect0() {
    for (let x = 0; x < this.framebuffer.width; x++) {
      // Simulating "temp" based on loudness data
      const tempLeft = this.audioBuffer.left[x];
      const tempRight = this.audioBuffer.right[x];

      // Example of setting pixels based on temp values
      // Adjust logic to match the desired effect
      this.framebuffer.setPixel(
        x >> 1,
        this.framebuffer.height - (tempLeft >> 2) - 20,
        this.getColorFromTable(tempLeft)
      );
      this.framebuffer.setPixel(
        (x + this.framebuffer.width) >> 1,
        this.framebuffer.height - (tempRight >> 2) - 20,
        this.getColorFromTable(tempLeft)
      );
    }
  }

  private waveEffect1() {
    for (let x = 0; x < this.framebuffer.width; x++) {
      // Simulating "temp" based on loudness data
      const tempLeft = this.audioBuffer.left[x];
      const tempRight = this.audioBuffer.right[x];

      // Adjust logic to match the effect, using temp >> 1 for positioning
      this.framebuffer.setPixel(
        x >> 1,
        this.framebuffer.height - (tempLeft >> 1) - 20,
        this.getColorFromTable(tempLeft)
      );
      this.framebuffer.setPixel(
        (x + this.framebuffer.width) >> 1,
        this.framebuffer.height - (tempRight >> 1) - 20,
        this.getColorFromTable(tempRight)
      );
    }
  }

  private waveEffect2() {
    for (let x = 0; x < this.framebuffer.height; x++) {
      const tempLeft = this.audioBuffer.left[x];
      const tempRight = this.audioBuffer.right[x];

      this.framebuffer.setPixel(
        160 - (tempLeft >> 2),
        x,
        this.getColorFromTable(tempLeft)
      );
      this.framebuffer.setPixel(
        160 + (tempRight >> 2),
        x,
        this.getColorFromTable(tempRight)
      );
    }
  }

  private waveEffect3() {
    for (let x = 0; x < this.framebuffer.width; x++) {
      let tempLeft = Math.abs(128 - this.audioBuffer.left[x]) >> 1;
      for (let i = 0; i < tempLeft; i++) {
        this.framebuffer.setPixel(
          x >> 1,
          this.framebuffer.height - i - 1,
          this.getColorFromTable(
            this.audioBuffer.left[i % this.audioBuffer.left.length]
          )
        );
      }

      let tempRight = Math.abs(128 - this.audioBuffer.right[x]) >> 1;
      for (let i = 0; i < tempRight; i++) {
        this.framebuffer.setPixel(
          (x + this.framebuffer.width) >> 1,
          this.framebuffer.height - i - 1,
          this.getColorFromTable(
            this.audioBuffer.right[i % this.audioBuffer.right.length]
          )
        );
      }
    }
  }

  private waveEffect4() {
    for (let x = 0; x < this.framebuffer.width; x++) {
      let tempLeft = Math.abs(128 - this.audioBuffer.left[x]);
      for (let i = 0; i < tempLeft; i++) {
        this.framebuffer.setPixel(
          x >> 1,
          this.framebuffer.height - i - 1,
          this.getColorFromTable(tempLeft)
        );
      }

      let tempRight = Math.abs(128 - this.audioBuffer.right[x]);
      for (let i = 0; i < tempRight; i++) {
        this.framebuffer.setPixel(
          (x + this.framebuffer.width) >> 1,
          this.framebuffer.height - i - 1,
          this.getColorFromTable(tempRight)
        );
      }
    }
  }

  private waveEffect5() {
    let lastLeft = 128;
    let lastRight = 128;

    for (let x = 0; x < this.framebuffer.width; x++) {
      let tempLeft = this.audioBuffer.left[x];
      this.drawVerticalWave(
        this.framebuffer.height - (tempLeft >> 2),
        this.framebuffer.height - (lastLeft >> 2),
        x >> 1,
        this.getColorFromTable(tempLeft)
      );
      lastLeft = tempLeft;

      let tempRight = this.audioBuffer.right[x];
      this.drawVerticalWave(
        this.framebuffer.height - (tempRight >> 2),
        this.framebuffer.height - (lastRight >> 2),
        (x + this.framebuffer.width) >> 1,
        this.getColorFromTable(tempRight)
      );
      lastRight = tempRight;
    }
  }

  private waveEffect6() {
    let last = 128;

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        const temp = this.audioBuffer[y === 0 ? "left" : "right"][x];
        this.doVWave(
          this.framebuffer.height - (temp >> 1) - 20,
          this.framebuffer.height - (last >> 1) - 20,
          y === 0 ? x >> 1 : (x + this.framebuffer.width) >> 1,
          this.getColorFromTable(temp)
        );
        last = temp;
      }
    }
  }

  private waveEffect7() {
    const middleX = this.framebuffer.width / 2;

    for (let y = 0; y < this.framebuffer.height; y++) {
      const tempLeft = this.audioBuffer.left[y % this.audioBuffer.left.length];
      const tempRight =
        this.audioBuffer.right[y % this.audioBuffer.right.length];

      // Draw a point on the left of the middle
      this.framebuffer.setPixel(
        middleX - (tempLeft >> 1),
        y,
        this.getColorFromTable(tempLeft)
      );

      // Draw a point on the right of the middle
      this.framebuffer.setPixel(
        middleX + (tempRight >> 1),
        y,
        this.getColorFromTable(tempRight)
      );
    }
  }

  private waveEffect8() {
    let last = 0;

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        const temp = Math.abs(
          128 - this.audioBuffer[y === 0 ? "left" : "right"][x]
        );
        this.drawVerticalWave(
          this.framebuffer.height - temp,
          this.framebuffer.height - last,
          y === 0 ? x >> 1 : (x + this.framebuffer.width) >> 1,
          this.getColorFromTable(temp)
        );
        last = temp;
      }
    }
  }

  private waveEffect9(): void {
    let temp: number;
    let lastLeft = 128;
    let lastRight = 128;
    this.col = (this.col + 1) % this.framebuffer.width;

    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = this.audioBuffer.left[x];
      this.drawHorizontalWave(
        this.col - (temp >> 2),
        this.col - (lastLeft >> 2),
        x,
        this.getColorFromTable(temp)
      );
      lastLeft = temp;

      temp = this.audioBuffer.right[x];
      this.drawHorizontalWave(
        this.col + (temp >> 2),
        this.col + (lastRight >> 2),
        x,
        this.getColorFromTable(temp)
      );
      lastRight = temp;
    }
  }

  private waveEffect10(): void {
    this.row = (this.row + 1) % (this.framebuffer.height - 1);

    for (let i = 0; i < 160; i++) {
      this.framebuffer.setPixel(
        i,
        this.row + 1,
        this.getColorFromTable(this.audioBuffer.left[i])
      );
      this.framebuffer.setPixel(
        i + 160,
        this.row + 1,
        this.getColorFromTable(this.audioBuffer.right[i])
      );
      this.framebuffer.setPixel(
        i,
        this.row,
        this.getColorFromTable(this.audioBuffer.left[i + 160])
      );
      this.framebuffer.setPixel(
        i + 160,
        this.row,
        this.getColorFromTable(this.audioBuffer.right[i + 160])
      );
    }
  }

  private waveEffect11(): void {
    let temp: number;
    let temp2: number;

    for (let x = 0; x < this.framebuffer.width; x++) {
      temp = this.audioBuffer.left[x];
      temp2 = this.audioBuffer.right[x];

      this.framebuffer.setPixel(
        (temp2 + 32) % this.framebuffer.width,
        (temp + 200 - 28) % this.framebuffer.height,
        this.getColorFromTable(temp)
      );
    }
  }

  private waveEffect12(): void {
    let temp: number;
    let lastLeft = 128;
    let lastRight = 128;

    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = this.audioBuffer.left[x];
      this.drawHorizontalWave(
        this.framebuffer.width / 2 - (temp >> 2),
        this.framebuffer.width / 2 - (lastLeft >> 2),
        x,
        this.getColorFromTable(temp)
      );
      lastLeft = temp;

      temp = this.audioBuffer.right[x];
      this.drawHorizontalWave(
        this.framebuffer.width / 2 + (temp >> 2),
        this.framebuffer.width / 2 + (lastRight >> 2),
        x,
        this.getColorFromTable(temp)
      );
      lastRight = temp;
    }
  }

  private waveEffect13(): void {
    let temp: number;
    let lastLeft = 128;
    let lastRight = 128;

    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = this.audioBuffer.left[x];
      this.drawHorizontalWave(
        this.framebuffer.width / 2 - (temp >> 1),
        this.framebuffer.width / 2 - (lastLeft >> 1),
        x,
        this.getColorFromTable(temp)
      );
      lastLeft = temp;

      temp = this.audioBuffer.right[x];
      this.drawHorizontalWave(
        this.framebuffer.width / 2 + (temp >> 1),
        this.framebuffer.width / 2 + (lastRight >> 1),
        x,
        this.getColorFromTable(temp)
      );
      lastRight = temp;
    }
  }

  private waveEffect14(): void {
    let temp: number;
    let lastLeft = 128;

    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = this.audioBuffer.left[x];
      this.drawHorizontalWave(
        160 - (temp >> 2),
        160 - (lastLeft >> 2),
        x,
        this.getColorFromTable(temp)
      );
      lastLeft = temp;
    }

    let lastRight = 128;
    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = this.audioBuffer.right[x];
      this.drawHorizontalWave(
        120 + (temp >> 2),
        120 + (lastRight >> 2),
        x,
        this.getColorFromTable(temp)
      );
      lastRight = temp;
    }
  }

  private waveEffect15(): void {
    let temp = 100;
    let last = 100;

    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = (this.audioBuffer.left[x] - 127) / 16 + last;

      if (temp >= this.framebuffer.width) temp = this.framebuffer.width - 1;
      if (temp < 0) last = 0;

      temp = temp % this.framebuffer.width;
      this.drawHorizontalWave(temp, last, x, 255);
      last = temp;
    }

    last = 200;
    temp = 200;
    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = (this.audioBuffer.right[x] - 127) / 16 + last;

      if (temp >= this.framebuffer.width) temp = this.framebuffer.width - 1;
      if (temp < 0) last = 0;

      temp = temp % this.framebuffer.width;
      this.drawHorizontalWave(temp, last, x, 255);
      last = temp;
    }
  }

  private waveEffect16(): void {
    let temp = 100;
    let last = 100;

    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = (this.audioBuffer.left[x] - 127) / 32 + last;
      if (temp >= this.framebuffer.width) temp = this.framebuffer.width - 1;
      if (temp < 0) last = 0;

      temp = temp % this.framebuffer.width;
      this.drawHorizontalWave(temp, last, x, 255);
      last = temp;
    }

    last = 200;
    temp = 200;
    for (let x = 0; x < this.framebuffer.height; x++) {
      temp = (this.audioBuffer.right[x] - 127) / 32 + last;
      if (temp >= this.framebuffer.width) temp = this.framebuffer.width - 1;
      if (temp < 0) last = 0;

      // temp = temp % this.framebuffer.width;
      this.drawHorizontalWave(temp, last, x, 255);
      last = temp;
    }
  }

  private waveEffect17(): void {
    for (let x = 0; x < this.framebuffer.height; x++) {
      let tempLeft = this.audioBuffer.left[x];
      this.framebuffer.setPixel(
        160 - (tempLeft >> 2),
        x,
        this.getColorFromTable(tempLeft)
      );

      let tempRight = this.audioBuffer.right[x];
      this.framebuffer.setPixel(
        160 + (tempRight >> 2),
        x,
        this.getColorFromTable(tempRight)
      );
    }
  }

  private peteEffect0(): void {
    let temp: number, temp2: number;

    this.xoff0 += (this.audioBuffer.left[0] % 9) - 4;
    this.yoff0 += (this.audioBuffer.left[1] % 9) - 4;

    this.xoff1 += (this.audioBuffer.right[0] % 9) - 4;
    this.yoff1 += (this.audioBuffer.right[1] % 9) - 4;

    if (this.xoff0 < 0) this.xoff0 += this.framebuffer.width;
    if (this.yoff0 < 0) this.yoff0 += this.framebuffer.height;

    if (this.xoff1 < 0) this.xoff1 += this.framebuffer.width;
    if (this.yoff1 < 0) this.yoff1 += this.framebuffer.height;

    this.xoff0 = this.xoff0 % this.framebuffer.width;
    this.xoff1 = this.xoff1 % this.framebuffer.width;

    this.yoff0 = this.yoff0 % this.framebuffer.height;
    this.yoff1 = this.yoff1 % this.framebuffer.height;

    for (let x = 0; x < this.framebuffer.width; x++) {
      temp = this.audioBuffer.left[x];
      temp2 = this.audioBuffer.left[(x + 80) % this.framebuffer.width];

      this.framebuffer.setPixel(
        ((temp2 >> 2) + this.xoff0) % this.framebuffer.width,
        ((temp >> 2) + this.yoff0) % this.framebuffer.height,
        this.getColorFromTable(temp)
      );

      temp = this.audioBuffer.right[x];
      temp2 = this.audioBuffer.right[(x + 80) % this.framebuffer.width];

      this.framebuffer.setPixel(
        ((temp2 >> 2) + this.xoff1) % this.framebuffer.width,
        ((temp >> 2) + this.yoff1) % this.framebuffer.height,
        this.getColorFromTable(temp)
      );
    }
  }

  private peteEffect1(): void {
    let temp: number;
    let left = 0;
    let right = 0;

    for (let x = 0; x < this.framebuffer.width; x++) {
      left += Math.abs(this.audioBuffer.left[x] - 128);
      right += Math.abs(this.audioBuffer.right[x] - 128);
    }

    left /= 160;
    right /= 160;

    left = Math.min(left, 199);
    right = Math.min(right, 199);

    for (let x = 0; x < 160; x++) {
      temp = this.audioBuffer.left[x];
      this.framebuffer.setPixel(
        x,
        200 - (Math.abs(left * this.sine[x]) >> 8),
        this.getColorFromTable(temp)
      );
    }
    for (let x = 160; x < 320; x++) {
      temp = this.audioBuffer.right[x - 160]; // Adjusted for the correct indexing in the audio buffer
      this.framebuffer.setPixel(
        x,
        200 - (Math.abs(right * this.sine[x - 160]) >> 8), // Adjust sine index for continuity
        this.getColorFromTable(temp)
      );
    }
  }

  private peteEffect2(): void {
    for (let x = 0; x < 200; x++) {
      let tempLeft = this.audioBuffer.left[x];
      this.framebuffer.setPixel(
        160 - (tempLeft >> 2),
        x,
        this.getColorFromTable(this.sine[tempLeft])
      );

      let tempRight = this.audioBuffer.right[x];
      this.framebuffer.setPixel(
        160 + (tempRight >> 2),
        x,
        this.getColorFromTable(this.sine[tempRight])
      );
    }
  }

  private molesFract(): void {
    let temp: number;

    // Initialize offsets if they are not already set (assuming class properties)
    if (this.xoff0 === undefined) this.xoff0 = this.framebuffer.width / 2;
    if (this.yoff0 === undefined) this.yoff0 = this.framebuffer.height / 2;
    if (this.xoff1 === undefined) this.xoff1 = this.framebuffer.width / 2;
    if (this.yoff1 === undefined) this.yoff1 = this.framebuffer.height / 2;

    temp = this.audioBuffer.left[0];
    for (let x = 0; x < this.framebuffer.width - 2; x += 2) {
      this.xoff0 += (this.audioBuffer.left[x] - temp) >> 1;
      temp = this.audioBuffer.left[x];

      if (this.xoff0 < 0) this.xoff0 = this.framebuffer.width - 1;

      this.xoff0 %= this.framebuffer.width;
      this.framebuffer.setPixel(
        this.xoff0,
        this.yoff0,
        this.getColorFromTable(temp)
      );

      this.yoff0 += (this.audioBuffer.left[x + 1] - temp) >> 1;
      temp = this.audioBuffer.left[x + 1];

      if (this.yoff0 < 0) this.yoff0 = this.framebuffer.height - 1;

      this.yoff0 %= this.framebuffer.height;
      this.framebuffer.setPixel(
        this.xoff0,
        this.yoff0,
        this.getColorFromTable(temp)
      );
    }

    temp = this.audioBuffer.right[0];
    for (let x = 0; x < this.framebuffer.width - 2; x += 2) {
      this.xoff1 += (this.audioBuffer.right[x] - temp) >> 1;
      temp = this.audioBuffer.right[x];

      if (this.xoff1 < 0) this.xoff1 = this.framebuffer.width - 1;

      this.xoff1 %= this.framebuffer.width;
      this.framebuffer.setPixel(
        this.xoff1,
        this.yoff1,
        this.getColorFromTable(temp)
      );

      this.yoff1 -= (this.audioBuffer.right[x + 1] - temp) >> 1;
      temp = this.audioBuffer.right[x + 1];

      if (this.yoff1 < 0) this.yoff1 = this.framebuffer.height - 1;

      this.yoff1 %= this.framebuffer.height;
      this.framebuffer.setPixel(
        this.xoff1,
        this.yoff1,
        this.getColorFromTable(temp)
      );
    }
  }

  private molesFract2(): void {
    let temp: number;

    // Ensure offsets are initialized (if not part of class initialization)
    if (this.xoff0 === undefined) this.xoff0 = this.framebuffer.width / 2;
    if (this.yoff0 === undefined) this.yoff0 = this.framebuffer.height / 2;
    if (this.xoff1 === undefined) this.xoff1 = this.framebuffer.width / 2;
    if (this.yoff1 === undefined) this.yoff1 = this.framebuffer.height / 2;

    temp = this.audioBuffer.left[0];
    for (let x = 0; x < this.framebuffer.width - 2; x += 2) {
      this.xoff0 += this.audioBuffer.left[x] - temp;
      temp = this.audioBuffer.left[x];

      if (this.xoff0 < 0) this.xoff0 = this.framebuffer.width - 1;

      this.xoff0 %= this.framebuffer.width;
      this.framebuffer.setPixel(
        this.xoff0,
        this.yoff0,
        this.getColorFromTable(temp)
      );

      this.yoff0 += this.audioBuffer.left[x + 1] - temp;
      temp = this.audioBuffer.left[x + 1];

      if (this.yoff0 < 0) this.yoff0 = this.framebuffer.height - 1;

      this.yoff0 %= this.framebuffer.height;
      this.framebuffer.setPixel(
        this.xoff0,
        this.yoff0,
        this.getColorFromTable(temp)
      );
    }

    temp = this.audioBuffer.right[0];
    for (let x = 0; x < this.framebuffer.width - 2; x += 2) {
      this.xoff1 += this.audioBuffer.right[x] - temp;
      temp = this.audioBuffer.right[x];

      if (this.xoff1 < 0) this.xoff1 = this.framebuffer.width - 1;

      this.xoff1 %= this.framebuffer.width;
      this.framebuffer.setPixel(
        this.xoff1,
        this.yoff1,
        this.getColorFromTable(temp)
      );

      this.yoff1 -= this.audioBuffer.right[x + 1] - temp;
      temp = this.audioBuffer.right[x + 1];

      if (this.yoff1 < 0) this.yoff1 = this.framebuffer.height - 1;

      this.yoff1 %= this.framebuffer.height;
      this.framebuffer.setPixel(
        this.xoff1,
        this.yoff1,
        this.getColorFromTable(temp)
      );
    }
  }
}
