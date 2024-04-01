function generateDownspiralTab(
  buffWidth: number,
  buffHeight: number
): number[] {
  const XSIZE = buffWidth;
  const YSIZE = buffHeight;
  const BSIZE = XSIZE * YSIZE;
  let theTab: number[] = new Array(BSIZE);
  const PI = Math.PI;
  const q = PI / 2;
  const p = (45 / 180) * PI;
  let cx = XSIZE / 2;
  let cy = YSIZE / 2;

  for (let j = 0; j < YSIZE; j++) {
    for (let i = 0; i < XSIZE; i++) {
      let dx, dy;
      if (j === 0 || j === YSIZE - 1 || i === 0 || i === XSIZE - 1) {
        // Simplified edge handling might be needed here, or an improved logic for edges
        dx = (cx - i) * 0.75;
        dy = (cy - j) * 0.75;
      } else {
        let dist = Math.sqrt((i - cx) ** 2 + (j - cy) ** 2);
        let ang = i === cx ? (j > cy ? q : -q) : Math.atan2(j - cy, i - cx);

        dx = Math.round((-Math.sin(ang - p) * dist) / 10.0);
        dy = Math.round((Math.cos(ang - p) * dist) / 10.0);
      }

      let newIndex = (i + dx + (j + dy) * XSIZE) % BSIZE;
      theTab[i + j * XSIZE] = Math.abs(newIndex);
    }
  }

  return theTab;
}

export const tabData = generateDownspiralTab(320, 200);
