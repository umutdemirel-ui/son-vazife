import * as THREE from 'three';
import { DERMANLI_PATHS, dermanliHeight, type SurveyPath } from './dermanliMap';

/** Independent terrain prototype. Does not mutate or remove the active world. */
export function createDermanliTerrain() {
  const root = new THREE.Group();
  root.name = 'Dermanlı arazi ve yollar';
  const geometries: THREE.BufferGeometry[] = [];
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x303b2c, roughness: 1 });
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x504234, roughness: 1, side: THREE.DoubleSide });
  const trailMaterial = new THREE.MeshStandardMaterial({ color: 0x3c3229, roughness: 1, side: THREE.DoubleSide });
  const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x183746, roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide });
  const ground = new THREE.PlaneGeometry(240, 240, 80, 80);
  ground.rotateX(-Math.PI / 2);
  const pos = ground.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, dermanliHeight(pos.getX(i), pos.getZ(i)));
  ground.computeVertexNormals();
  geometries.push(ground);
  const groundMesh = new THREE.Mesh(ground, groundMaterial);
  groundMesh.receiveShadow = true;
  root.add(groundMesh);

  for (const path of DERMANLI_PATHS) {
    const geometry = makeRibbon(path);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, path.kind === 'water' ? waterMaterial : path.kind === 'trail' ? trailMaterial : roadMaterial);
    mesh.name = path.id;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  return { root, dispose() { for (const geo of geometries) geo.dispose(); for (const mat of [groundMaterial, roadMaterial, trailMaterial, waterMaterial]) mat.dispose(); root.removeFromParent(); } };
}
function makeRibbon(path: SurveyPath): THREE.BufferGeometry {
  // Dense subdivisions avoid hovering over the surveyed heightfield on long straight spurs.
  const points: Array<readonly [number,number]> = [];
  const count = path.closed ? path.points.length : path.points.length - 1;
  for (let i = 0; i < count; i++) {
    const a = path.points[i], b = path.points[(i+1)%path.points.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0]-a[0], b[1]-a[1]) / 1.5));
    for (let k = 0; k < steps; k++) points.push([a[0]+(b[0]-a[0])*k/steps, a[1]+(b[1]-a[1])*k/steps]);
  }
  if (!path.closed) points.push(path.points[path.points.length-1]);
  const vertices: number[] = [], indices: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i === 0 ? (path.closed ? points.length-1 : 0) : i-1];
    const b = points[i === points.length-1 ? (path.closed ? 0 : i) : i+1];
    const dx = b[0]-a[0], dz = b[1]-a[1], length = Math.hypot(dx,dz) || 1;
    for (const side of [-1,1]) {
      const x = points[i][0] - dz/length*path.width/2*side;
      const z = points[i][1] + dx/length*path.width/2*side;
      vertices.push(x, dermanliHeight(x,z) + (path.kind === 'water' ? 0.07 : 0.055), z);
    }
  }
  for (let i = 0; i < (path.closed ? points.length : points.length-1); i++) {
    const a = 2*i, b = 2*((i+1)%points.length);
    indices.push(a,a+1,b, a+1,b+1,b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
  geo.setIndex(indices); geo.computeVertexNormals();
  return geo;
}
