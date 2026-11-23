import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Merges static sibling meshes inside a group by material & shadow flags to slash draw calls.
 * Skips any objects in `skipSet` (doors, shutters, interactive props, lights, autopsy tables).
 */
export function bakeStaticChildrenByMaterial(
  root: THREE.Group,
  skipSet?: Set<THREE.Object3D>,
): void {
  root.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const relMatrix = new THREE.Matrix4();

  interface Bucket {
    mat: THREE.Material;
    castShadow: boolean;
    receiveShadow: boolean;
    meshes: THREE.Mesh[];
  }
  const buckets = new Map<string, Bucket>();

  const collect = (obj: THREE.Object3D) => {
    if (skipSet && skipSet.has(obj)) return;
    if (obj instanceof THREE.Light) return;

    const mesh = obj as THREE.Mesh;
    if (
      mesh.isMesh &&
      mesh.geometry &&
      !Array.isArray(mesh.material) &&
      mesh.material instanceof THREE.Material
    ) {
      const key = `${mesh.material.uuid}:${mesh.castShadow ? 1 : 0}:${mesh.receiveShadow ? 1 : 0}`;
      let b = buckets.get(key);
      if (!b) {
        b = {
          mat: mesh.material,
          castShadow: mesh.castShadow,
          receiveShadow: mesh.receiveShadow,
          meshes: [],
        };
        buckets.set(key, b);
      }
      b.meshes.push(mesh);
      return;
    }

    const children = [...obj.children];
    for (let i = 0; i < children.length; i++) {
      collect(children[i]);
    }
  };

  const topChildren = [...root.children];
  for (let i = 0; i < topChildren.length; i++) {
    collect(topChildren[i]);
  }

  buckets.forEach((b) => {
    if (b.meshes.length < 2) {
      if (b.meshes.length === 1) {
        b.meshes[0].matrixAutoUpdate = false;
        b.meshes[0].updateMatrix();
      }
      return;
    }

    const geos: THREE.BufferGeometry[] = [];
    let valid = true;
    const refHasUv = Boolean(b.meshes[0].geometry.attributes.uv);
    const refHasNormal = Boolean(b.meshes[0].geometry.attributes.normal);

    for (let i = 0; i < b.meshes.length; i++) {
      const m = b.meshes[i];
      if (
        Boolean(m.geometry.attributes.uv) !== refHasUv ||
        Boolean(m.geometry.attributes.normal) !== refHasNormal
      ) {
        valid = false;
        break;
      }
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      relMatrix.multiplyMatrices(invRoot, m.matrixWorld);
      g.applyMatrix4(relMatrix);
      geos.push(g);
    }

    if (!valid || geos.length < 2) {
      geos.forEach((g) => g.dispose());
      return;
    }

    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) return;

    for (let i = 0; i < b.meshes.length; i++) {
      b.meshes[i].parent?.remove(b.meshes[i]);
    }

    const mergedMesh = new THREE.Mesh(merged, b.mat);
    mergedMesh.castShadow = b.castShadow;
    mergedMesh.receiveShadow = b.receiveShadow;
    mergedMesh.matrixAutoUpdate = false;
    mergedMesh.updateMatrix();
    root.add(mergedMesh);
  });
}
