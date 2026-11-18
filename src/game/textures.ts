import * as THREE from 'three';
import { surfaceUrl } from './quality';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function finalizeColorTex(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

/** Only lettering, the evidence sketch and a tiny mist sprite need a canvas. Surface data is baked offline. */
export function loadVillageTextures(maxAnisotropy: number, compact: boolean) {
  const loader = new THREE.TextureLoader();
  const owned = new Set<THREE.Texture>();
  const load = (name: string, rx = 1, ry = rx, data = false) => {
    const tex: THREE.Texture = loader.load(surfaceUrl(name, compact), undefined, undefined, () => {
      // A missing photograph must not turn an entire wall black.
      const [c, g] = makeCanvas(2, 2);
      g.fillStyle = data ? (name.endsWith('normal') ? '#8080ff' : '#dddddd') : '#b4a996';
      g.fillRect(0, 0, 2, 2);
      tex.source.data = c;
      tex.needsUpdate = true;
    });
    tex.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    tex.anisotropy = maxAnisotropy;
    tex.name = name;
    owned.add(tex);
    return tex;
  };
  const linear = (name: string, rx = 1, ry = rx) => (compact ? null : load(name, rx, ry, true));
  // 6. Anatolian Kilim Rug
  const [cKilim, ctxK] = makeCanvas(512, 512);
  ctxK.fillStyle = '#6c1f1a';
  ctxK.fillRect(0, 0, 512, 512);
  ctxK.strokeStyle = '#c59b57';
  ctxK.lineWidth = 14;
  ctxK.strokeRect(24, 24, 464, 464);
  ctxK.strokeStyle = '#1f2836';
  ctxK.lineWidth = 8;
  ctxK.strokeRect(48, 48, 416, 416);
  for (let i = 0; i < 3; i++) {
    const cy = 128 + i * 128;
    ctxK.fillStyle = '#202b38';
    ctxK.beginPath();
    ctxK.moveTo(256, cy - 48);
    ctxK.lineTo(318, cy);
    ctxK.lineTo(256, cy + 48);
    ctxK.lineTo(194, cy);
    ctxK.closePath();
    ctxK.fill();
    ctxK.strokeStyle = '#d3ab65';
    ctxK.lineWidth = 4;
    ctxK.stroke();
  }
  const kilim = finalizeColorTex(cKilim, maxAnisotropy, 1, 1);

  // 9. Scratched Sepia Village Photo
  const [cPhoto, ctxPh] = makeCanvas(256, 256);
  ctxPh.fillStyle = '#8b795e';
  ctxPh.fillRect(0, 0, 256, 256);
  ctxPh.fillStyle = '#473c2d';
  ctxPh.fillRect(0, 140, 256, 116);
  ctxPh.fillStyle = '#2a2219';
  [54, 104, 154, 202].forEach((fx) => {
    ctxPh.fillRect(fx - 14, 110, 28, 86);
    ctxPh.beginPath();
    ctxPh.arc(fx, 92, 13, 0, Math.PI * 2);
    ctxPh.fill();
  });
  ctxPh.strokeStyle = '#0c0908';
  ctxPh.lineWidth = 4;
  [54, 104, 154].forEach((fx) => {
    ctxPh.beginPath();
    ctxPh.moveTo(fx - 12, 82);
    ctxPh.lineTo(fx + 12, 102);
    ctxPh.moveTo(fx + 12, 82);
    ctxPh.lineTo(fx - 12, 102);
    ctxPh.stroke();
  });
  const photo = finalizeColorTex(cPhoto, maxAnisotropy, 1, 1);

  // 10. Village Entrance Sign
  const [cSign, ctxSg] = makeCanvas(512, 256);
  ctxSg.fillStyle = '#1b365d';
  ctxSg.fillRect(0, 0, 512, 256);
  ctxSg.strokeStyle = '#e6e2d8';
  ctxSg.lineWidth = 10;
  ctxSg.strokeRect(14, 14, 484, 228);
  ctxSg.fillStyle = '#f0ece1';
  ctxSg.font = 'bold 46px Georgia, serif';
  ctxSg.textAlign = 'center';
  ctxSg.fillText('KUZDAĞ KÖYÜ', 256, 118);
  ctxSg.font = '28px monospace';
  ctxSg.fillStyle = '#c8d0da';
  ctxSg.fillText('RAKIM: 1480 m', 256, 178);
  const sign = finalizeColorTex(cSign, maxAnisotropy, 1, 1);

  // 11. Soft Radial Mist Sprite
  const [cMist, ctxMs] = makeCanvas(128, 128);
  const grad = ctxMs.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(205, 218, 228, 0.32)');
  grad.addColorStop(0.55, 'rgba(175, 190, 204, 0.12)');
  grad.addColorStop(1, 'rgba(150, 168, 184, 0.0)');
  ctxMs.fillStyle = grad;
  ctxMs.fillRect(0, 0, 128, 128);
  const mistSprite = finalizeColorTex(cMist, 1, 1, 1);

  const ground = load('forest-floor', 64),
    road = load('lane-cobble');
  return {
    stone: load('fieldstone', 2),
    stoneNormal: linear('fieldstone-normal', 2),
    plaster: load('limewash', 2),
    plasterNormal: linear('limewash-normal', 2),
    roof: load('pantile', 2),
    roofNormal: linear('pantile-normal', 2),
    timber: load('aged-planks', 2),
    timberNormal: linear('aged-planks-normal', 2),
    marble: load('cut-limestone'),
    marbleNormal: null,
    tile: load('cini', 3, 2),
    tileNormal: linear('cini-normal', 3, 2),
    tileRoughness: null,
    ground,
    groundNormal: linear('forest-floor-normal', 64),
    groundRoughness: linear('forest-floor-rough', 64),
    road,
    roadNormal: linear('lane-cobble-normal'),
    roadRoughness: linear('lane-cobble-rough'),
    board: load('mese'),
    clay: load('testi'),
    water: load('yalak-su'),
    sash: load('sash'),
    door: load('plank-door'),
    entry: load('gasil-siva'),
    kilim,
    photo,
    sign,
    mistSprite,
    disposeAll: () => {
      for (const t of [...owned, kilim, photo, sign, mistSprite]) t.dispose();
      owned.clear();
    },
  };
}
export type VillageTextures = ReturnType<typeof loadVillageTextures>;
