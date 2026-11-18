export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Bounds are in house-local coordinates when a frame is supplied. */
  frame?: { x: number; z: number; cos: number; sin: number };
}

export function houseFootprint(x: number, z: number, width: number, depth: number, yaw: number): BoxCollider {
  return {
    minX: -width / 2,
    maxX: width / 2,
    minZ: -depth / 2,
    maxZ: depth / 2,
    frame: { x, z, cos: Math.cos(yaw), sin: Math.sin(yaw) },
  };
}

/** Resolve against the wall itself, not a rotated house's street-blocking bounding square. */
export function pushOutsideBox(p: { x: number; z: number }, c: BoxCollider, r: number) {
  const f = c.frame;
  const x = f ? (p.x - f.x) * f.cos - (p.z - f.z) * f.sin : p.x;
  const z = f ? (p.x - f.x) * f.sin + (p.z - f.z) * f.cos : p.z;
  const dx = x - Math.max(c.minX, Math.min(x, c.maxX));
  const dz = z - Math.max(c.minZ, Math.min(z, c.maxZ));
  const squared = dx * dx + dz * dz;
  if (squared >= r * r) return;
  let moveX = 0,
    moveZ = 0;
  if (squared > 0.000001) {
    const scale = r / Math.sqrt(squared) - 1;
    moveX = dx * scale;
    moveZ = dz * scale;
  } else {
    const left = x - c.minX,
      right = c.maxX - x,
      back = z - c.minZ,
      front = c.maxZ - z;
    const nearest = Math.min(left, right, back, front);
    if (nearest === left) moveX = -left - r;
    else if (nearest === right) moveX = right + r;
    else if (nearest === back) moveZ = -back - r;
    else moveZ = front + r;
  }
  p.x += f ? moveX * f.cos + moveZ * f.sin : moveX;
  p.z += f ? -moveX * f.sin + moveZ * f.cos : moveZ;
}

/** Place unrotated local wall boxes relative to their building anchor. */
export function translateColliders(anchor: { x: number; z: number }, boxes: readonly BoxCollider[]): BoxCollider[] {
  return boxes.map((box) => {
    if (box.frame) throw new Error('translateColliders expects unframed local boxes');
    return {
      minX: anchor.x + box.minX,
      maxX: anchor.x + box.maxX,
      minZ: anchor.z + box.minZ,
      maxZ: anchor.z + box.maxZ,
    };
  });
}
