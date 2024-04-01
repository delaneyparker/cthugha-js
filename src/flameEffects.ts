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
// changes/fixes to me (zaph@torps.apana.org.au) for inclusion in future
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

import { Framebuffer } from "./framebuffer";

export class FlameEffects {
  // Leaving out flameWeird for now
  private static readonly NUM_FLAMES: number = 12;
  private framebuffer: Framebuffer;
  private currentFlame: number = 0;

  constructor(framebuffer: Framebuffer) {
    this.framebuffer = framebuffer;
  }

  public nextFlame = () => {
    this.currentFlame = (this.currentFlame + 1) % FlameEffects.NUM_FLAMES;
  };

  public prevFlame = () => {
    this.currentFlame =
      (this.currentFlame - 1 + FlameEffects.NUM_FLAMES) %
      FlameEffects.NUM_FLAMES;
  };

  public randomFlame = () => {
    this.currentFlame = Math.floor(Math.random() * FlameEffects.NUM_FLAMES);
  };

  public getCurrentFlame = () => {
    return this.currentFlame;
  };

  public setCurrentFlame = (flame: number) => {
    this.currentFlame = flame;
  };

  public update(): void {
    switch (this.currentFlame) {
      case 0:
        this.flameUpSlow();
        break;
      case 1:
        this.flameUpSubtle();
        break;
      case 2:
        this.flameLeftSlow();
        break;
      case 3:
        this.flameRightSlow();
        break;
      case 4:
        this.flameWater();
        break;
      case 5:
        this.flameSkyline();
        break;
      case 6:
        this.flameUpFast();
        break;
      case 7:
        this.flameLeftFast();
        break;
      case 8:
        this.flameRightFast();
        break;
      case 9:
        this.flameLeftSubtle();
        break;
      case 10:
        this.flameRightSubtle();
        break;
      case 11:
        this.flameWaterSubtle();
        break;
      case 12:
        this.flameWeird();
        break;
      default:
        console.log(`Flame effect ${this.currentFlame} not implemented.`);
        break;
    }
  }

  private flameUpSlow(): void {
    for (let y = 0; y < this.framebuffer.height; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let sum =
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x, y + 1);

        let avg = (sum >> 2) - 1;
        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }
  }

  private flameUpSubtle(): void {
    for (let y = 0; y < this.framebuffer.height; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let sum =
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x, y + 1);

        let avg = (sum >> 2) - 1;
        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }
  }

  private flameLeftSlow() {
    for (let y = 0; y < this.framebuffer.height; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let sum =
          this.framebuffer.getPixel(x, y - 1) +
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y);

        let avg = (sum >> 2) - 1;
        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }
  }

  private flameRightSlow(): void {
    for (let y = 0; y < this.framebuffer.height; y++) {
      for (let x = this.framebuffer.width; x >= 0; x--) {
        let sum =
          this.framebuffer.getPixel(x, y - 1) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y + 1);

        let avg = (sum >> 2) - 1;
        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }
  }

  private flameWater(): void {
    // First pass (similar to flame_upslow but with adjustments)
    for (let y = 0; y < this.framebuffer.height; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let sum =
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x, y + 1);
        let avg = (sum >> 2) - 1;

        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }

    // Second pass (reversed direction and slightly different calculations)
    for (let y = this.framebuffer.height - 2; y > 0; y--) {
      for (let x = this.framebuffer.width - 2; x > 0; x--) {
        let sum =
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y - 1);
        let avg = sum >> 2;

        this.framebuffer.setPixel(x, y + 1, avg);
      }
    }
  }

  private flameSkyline(): void {
    for (let y = 0; y < this.framebuffer.height; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let sum =
          this.framebuffer.getPixel(x - 1, y) +
          2 * this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y);
        let avg = sum >> 2;

        if (avg !== 0) avg -= 1;

        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }
  }

  private flameUpFast(): void {
    for (let y = this.framebuffer.height - 2; y > 0; y--) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let sum =
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x - 1, y + 1) +
          this.framebuffer.getPixel(x + 1, y + 1) +
          this.framebuffer.getPixel(x, y + 1);
        let avg = (sum >> 2) - 1;

        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x, y + 1, avg);
      }
    }
  }

  private flameLeftFast(): void {
    for (let y = this.framebuffer.height - 2; y > 0; y--) {
      for (let x = -1; x < this.framebuffer.width - 1; x++) {
        let sum =
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y - 1) +
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x + 1, y + 1);
        let avg = (sum >> 2) - 1;

        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x + 1, y, avg);
      }
    }
  }

  private flameRightFast(): void {
    for (let y = this.framebuffer.height - 2; y > 0; y--) {
      for (let x = this.framebuffer.width - 1; x > -2; x--) {
        let sum =
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y - 1) +
          this.framebuffer.getPixel(x + 1, y - 1) +
          this.framebuffer.getPixel(x, y - 1);
        let avg = (sum >> 2) - 1;

        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x + 1, y, avg);
      }
    }
  }

  private flameLeftSubtle(): void {
    for (let y = 0; y < this.framebuffer.height; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let sum =
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x, y + 1);
        let avg = (sum >> 2) - 1;

        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }
  }

  private flameRightSubtle(): void {
    for (let y = 0; y < this.framebuffer.height; y++) {
      for (let x = this.framebuffer.width - 1; x >= 0; x--) {
        let sum =
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y + 1);
        let avg = (sum >> 2) - 1;

        if (avg < 0) avg = 0;

        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }
  }

  private flameWaterSubtle(): void {
    // First pass (similar to flame_upsubtle)
    for (let y = 1; y < this.framebuffer.height; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let sum =
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x, y - 1);
        let avg = Math.max((sum >> 2) - 1, 0);
        this.framebuffer.setPixel(x, y - 1, avg);
      }
    }

    // Second pass (inverted direction from flame_upsubtle)
    for (let y = this.framebuffer.height - 2; y >= 0; y--) {
      for (let x = this.framebuffer.width - 2; x > 0; x--) {
        let sum =
          this.framebuffer.getPixel(x + 1, y) +
          this.framebuffer.getPixel(x, y) +
          this.framebuffer.getPixel(x - 1, y) +
          this.framebuffer.getPixel(x, y + 1);
        let avg = Math.max((sum >> 2) - 1, 0);
        this.framebuffer.setPixel(x, y + 1, avg);
      }
    }
  }

  private flameWeird(): void {
    for (let y = 1; y < this.framebuffer.height; y++) {
      for (let x = 0; x < this.framebuffer.width; x++) {
        let current = this.framebuffer.getPixel(x, y);
        let left = this.framebuffer.getPixel(x - 1, y);
        let right = this.framebuffer.getPixel(x + 1, y);
        let below = this.framebuffer.getPixel(x, y - 1);

        let combined = (current | left | right | below) - 1;

        if (combined < 0) combined = 0;

        this.framebuffer.setPixel(x, y - 1, combined);
      }
    }
  }
}
