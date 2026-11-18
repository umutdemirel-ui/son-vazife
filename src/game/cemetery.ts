/** Shared survey for cemetery art, terrain and solid grave footprints. */
export const CEMETERY = { x: -34, z: -36 } as const;
export const CEMETERY_GRAVES = [
  [-3.5, 2.2], [-1.4, 2.6], [-3.8, -0.4], [-1.8, -0.6],
  [-4.2, -3.2], [-2.0, -3.6], [1.8, 3.2], [4.8, 0.1],
] as const;

/** The smaller grave cluster beside the mosque uses the same visible and solid markers. */
export const MOSQUE_GRAVES = [
  { x: 0, z: 0, rot: 0.08, h: 1.35, turban: true },
  { x: -1.6, z: 0.4, rot: -0.14, h: 1.1, turban: false },
  { x: 1.4, z: -0.5, rot: 0.18, h: 1.25, turban: true },
  { x: -0.5, z: -1.7, rot: -0.06, h: 1.05, turban: false },
  { x: 1.1, z: -2.1, rot: 0.11, h: 1.3, turban: false },
] as const;

/** Old graves around the village square, kept away from doors and the mill road. */
export const VILLAGE_GRAVES = [
  ...[-21.0, -19.5, -18.0, -16.5].flatMap((x, col) =>
    [13.4, 16.0, 18.6, 21.2].map((z, row) => ({
      x, z: z + (col % 2) * 0.35, rot: ((col * 7 + row * 3) % 9 - 4) * 0.055,
      h: 0.82 + ((col + row * 2) % 4) * 0.12, turban: (col + row) % 4 === 0,
    })),
  ),
] as const;
