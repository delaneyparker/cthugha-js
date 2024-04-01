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

// Port of the Cthugha V5.3 molestab.c to TypeScript.
const BUFF_WIDTH = 320;
const BUFF_HEIGHT = 200;

function generateMolesTab(
  delta_r: number = 2.0,
  delta_a: number = 0.1
): number[] {
  let tab: number[] = [];
  let map_x, map_y;
  let cent_x,
    cent_y = BUFF_HEIGHT / 2;

  for (let y = 0; y < BUFF_HEIGHT; y++) {
    for (let x = 0; x < BUFF_WIDTH; x++) {
      if (
        (x === BUFF_WIDTH / 4 && y === BUFF_HEIGHT / 2) ||
        (x === (3 * BUFF_WIDTH) / 4 && y === BUFF_HEIGHT / 2)
      ) {
        map_x = 0;
        map_y = 0;
      } else {
        if (x > BUFF_WIDTH / 2) {
          cent_x = (3 * BUFF_WIDTH) / 4;
        } else {
          cent_x = BUFF_WIDTH / 4;
        }
        let temp_x = Math.abs(x - cent_x);
        let temp_y = Math.abs(y - cent_y);

        let polar_r = Math.sqrt(temp_x * temp_x + temp_y * temp_y);
        let polar_a = Math.atan2(x - cent_x, y - cent_y);

        polar_r += delta_r;
        if (polar_r < 0) polar_r = 0.0;

        if (x > BUFF_WIDTH / 2) {
          polar_a += delta_a;
        } else {
          polar_a -= delta_a;
        }

        temp_y = polar_r * Math.cos(polar_a);
        temp_x = polar_r * Math.sin(polar_a);

        map_x = Math.round(temp_x + cent_x);
        map_y = Math.round(temp_y + cent_y);

        if (
          map_y >= BUFF_HEIGHT ||
          map_y < 0 ||
          map_x >= BUFF_WIDTH ||
          map_x < 0
        ) {
          map_x = 0;
          map_y = 0;
        }

        map_x = Math.max(map_x, 0);
        map_y = Math.max(map_y, 0);
      }

      let map = map_y * BUFF_WIDTH + map_x;
      tab.push(map);
    }
  }

  return tab;
}

export const tabData = generateMolesTab(2.0, 0.1);
