import * as THREE from 'three';
import { DERMANLI_PATHS, dermanliHeight, type SurveyPath } from './dermanliMap';

const GRID_SIZE=80, TERRAIN_HALF=120, GRID_STEP=2*TERRAIN_HALF/GRID_SIZE;
let heightGrid:Float32Array|undefined;
function heights():Float32Array {
  if(!heightGrid){
    const grid=new Float32Array((GRID_SIZE+1)*(GRID_SIZE+1));
    for(let z=0;z<=GRID_SIZE;z++)for(let x=0;x<=GRID_SIZE;x++)grid[z*(GRID_SIZE+1)+x]=dermanliHeight(-TERRAIN_HALF+x*GRID_STEP,-TERRAIN_HALF+z*GRID_STEP);
    heightGrid=grid;
  }
  return heightGrid;
}
/** Height on the actual triangulated ground, rather than the unsampled survey function. */
export function dermanliSurfaceHeight(x:number,z:number):number {
  const gx=THREE.MathUtils.clamp((x+TERRAIN_HALF)/GRID_STEP,0,GRID_SIZE),gz=THREE.MathUtils.clamp((z+TERRAIN_HALF)/GRID_STEP,0,GRID_SIZE);
  const ix=Math.min(GRID_SIZE-1,Math.floor(gx)),iz=Math.min(GRID_SIZE-1,Math.floor(gz)),u=gx-ix,v=gz-iz;
  const grid=heights(),stride=GRID_SIZE+1,a=grid[iz*stride+ix],b=grid[(iz+1)*stride+ix],c=grid[iz*stride+ix+1],d=grid[(iz+1)*stride+ix+1];
  return u+v<=1 ? a+u*(c-a)+v*(b-a) : d*(u+v-1)+b*(1-u)+c*(1-v);
}

/** Independent terrain prototype. Does not mutate or remove the active world. */
export function createDermanliTerrain(textures?: {ground:THREE.Texture;road:THREE.Texture}) {
  const root = new THREE.Group();
  root.name = 'Dermanlı arazi ve yollar';
  const geometries: THREE.BufferGeometry[] = [];
  const groundMaterial = new THREE.MeshStandardMaterial({ color: textures ? 0xb5b5a3 : 0x303b2c, map:textures?.ground, roughness: 1 });
  const roadMaterial = new THREE.MeshStandardMaterial({ color: textures ? 0xb9a897 : 0x504234, map:textures?.road, roughness: 1, side: THREE.DoubleSide });
  const trailMaterial = new THREE.MeshStandardMaterial({ color: 0x3c3229, roughness: 1, side: THREE.DoubleSide });
  const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x183746, roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide });
  const ground = new THREE.PlaneGeometry(2*TERRAIN_HALF, 2*TERRAIN_HALF, GRID_SIZE, GRID_SIZE);
  ground.rotateX(-Math.PI / 2);
  const pos = ground.attributes.position;
  const grid=heights();
  for (let i = 0; i < pos.count; i++) pos.setY(i, grid[i]);
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
  const vertices: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i === 0 ? (path.closed ? points.length-1 : 0) : i-1];
    const b = points[i === points.length-1 ? (path.closed ? 0 : i) : i+1];
    const dx = b[0]-a[0], dz = b[1]-a[1], length = Math.hypot(dx,dz) || 1;
    for (const side of [-1,1]) {
      const x = points[i][0] - dz/length*path.width/2*side;
      const z = points[i][1] + dx/length*path.width/2*side;
      uv.push(x/3.4,z/3.4);
      vertices.push(x, dermanliSurfaceHeight(x,z) + (path.kind === 'water' ? 0.07 : 0.055), z);
    }
  }
  for (let i = 0; i < (path.closed ? points.length : points.length-1); i++) {
    const a = 2*i, b = 2*((i+1)%points.length);
    indices.push(a,a+1,b, a+1,b+1,b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(indices); geo.computeVertexNormals();
  return geo;
}
