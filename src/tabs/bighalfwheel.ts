function generateBigHalfWheelTab(
  BUFF_WIDTH: number,
  BUFF_HEIGHT: number
): number[] {
  const tab: number[] = new Array(BUFF_WIDTH * BUFF_HEIGHT);
  const PI = Math.PI;
  let cx = BUFF_WIDTH * 0.4;
  let cy = 0;
  let q = PI / 2;
  let p = 0; // Converted directly from C, though it seems unused

  for (let j = 0; j < BUFF_HEIGHT; j++) {
    for (let i = 0; i < BUFF_WIDTH; i++) {
      let dx, dy, dist, ang;

      if (j === 0 || j === BUFF_HEIGHT - 1) {
        dx = (cx - i) * 0.75;
        dy = cy - j;
      } else {
        dist = Math.sqrt((i - cx) * (i - cx) + (j - cy) * (j - cy));

        if (i === cx) {
          ang = j > cx ? q : -q;
        } else {
          ang = Math.atan((j - cy) / (i - cx));
        }

        if (i < cx) ang += PI;

        if (dist < BUFF_HEIGHT) {
          dx = Math.ceil((-Math.sin(ang - p) * dist) / 10.0);
          dy = Math.ceil((Math.cos(ang - p) * dist) / 10.0);
        } else {
          dx = i < cx ? 3 : -3;
          dy = 0;
        }
      }

      let newX = i + dx;
      let newY = j + dy;
      let newIndex =
        Math.abs(newY * BUFF_WIDTH + newX) % (BUFF_WIDTH * BUFF_HEIGHT);
      tab[j * BUFF_WIDTH + i] = newIndex;
    }
  }

  return tab;
}

export const tabData = generateBigHalfWheelTab(320, 200);
