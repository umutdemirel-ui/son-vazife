import * as THREE from 'three';
// Layout matches art/environment/surfaces.py. A gutter keeps adjoining photos out of the mip chain.
const swatches = [
  'limewash',
  'fieldstone',
  'pantile',
  'aged-planks',
  'cini',
  'cut-limestone',
  'plank-door',
  'sash',
  'gasil-siva',
  'testi',
  'yalak-su',
];
export function shellMaterial(tile: THREE.Texture) {
  const material = new THREE.MeshBasicMaterial({ map: tile, vertexColors: true });
  material.onBeforeCompile = (s) => {
    s.vertexShader =
      'attribute float swatch; varying vec2 kdCell;\n' +
      s.vertexShader.replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
      kdCell=vec2(mod(swatch,4.),3.-floor(swatch/4.));`,
      );
    s.fragmentShader =
      'varying vec2 kdCell;\n' +
      s.fragmentShader.replace(
        '#include <map_fragment>',
        'diffuseColor *= texture2D(map, (kdCell + (.03125 + fract(vMapUv)*.9375))*.25);',
      );
  };
  return material;
}
/** At street distance the same exterior (not a billboard) costs one draw. Keep the exact near
 * building, its animated props and its live interaction anchors. No hidden examination layers,
 * people, glass or sub-metre furnishings enter the distant shell. */
export function distantShell(
  root: THREE.Object3D,
  material: THREE.Material,
  skip: ReadonlySet<THREE.Object3D>,
) {
  root.updateWorldMatrix(true, true);
  const inv = root.matrixWorld.clone().invert(),
    mat = new THREE.Matrix4(),
    nmat = new THREE.Matrix3();
  const P: number[] = [],
    C: number[] = [],
    U: number[] = [],
    S: number[] = [],
    I: number[] = [];
  const p = new THREE.Vector3(),
    n = new THREE.Vector3(),
    v = new THREE.Vector2(),
    size = new THREE.Vector3();
  const sun = new THREE.Vector3(0.469, 0.677, 0.573);
  const collect = (o: THREE.Object3D) => {
    if (!o.visible || skip.has(o)) return;
    if (
      o instanceof THREE.Mesh &&
      o.layers.mask === 1 &&
      !(o instanceof THREE.SkinnedMesh) &&
      !(o instanceof THREE.InstancedMesh)
    ) {
      const m = o.material,
        g = o.geometry;
      if (
        m instanceof THREE.MeshStandardMaterial &&
        !m.transparent &&
        g.attributes.normal &&
        g.attributes.uv
      ) {
        g.computeBoundingBox();
        g.boundingBox!.getSize(size);
        if (Math.max(size.x, size.y, size.z) > 0.68) {
          mat.multiplyMatrices(inv, o.matrixWorld);
          nmat.getNormalMatrix(mat);
          const base = P.length / 3;
          const slot = swatches.indexOf(m.map?.name ?? ''),
            pos = g.attributes.position,
            normal = g.attributes.normal,
            uv = g.attributes.uv;
          for (let k = 0; k < pos.count; k++) {
            p.fromBufferAttribute(pos, k).applyMatrix4(mat);
            P.push(p.x, p.y, p.z);
            n.fromBufferAttribute(normal, k).applyNormalMatrix(nmat);
            const lum = 0.51 + 0.22 * n.y + 0.34 * Math.max(n.dot(sun), 0);
            C.push(lum * m.color.r, lum * m.color.g, lum * m.color.b);
            v.fromBufferAttribute(uv, k);
            U.push(v.x * (m.map?.repeat.x ?? 1), v.y * (m.map?.repeat.y ?? 1));
            S.push(slot < 0 ? 15 : slot);
          }
          for (let i = 0; i < (g.index?.count ?? pos.count); i++) I.push(base + (g.index?.getX(i) ?? i));
        }
      }
    }
    for (const c of o.children) collect(c);
  };
  collect(root);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setAttribute('swatch', new THREE.Float32BufferAttribute(S, 1));
  g.setIndex(I);
  g.computeBoundingSphere();
  const proxy = new THREE.Mesh(g, material);
  proxy.name = 'Uzak dış kabuk';
  proxy.position.copy(root.position);
  proxy.quaternion.copy(root.quaternion);
  proxy.scale.copy(root.scale);
  proxy.updateMatrix();
  proxy.matrixAutoUpdate = false;
  return proxy;
}
