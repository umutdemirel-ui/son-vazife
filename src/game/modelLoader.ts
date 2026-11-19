import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** HTML images decode embedded GLB textures without ImageBitmapLoader's fetch(blob:).
 * This works with restrictive connect-src policies and browsers with unreliable bitmap decoding. */
export function createModelLoader(): GLTFLoader {
  const loader = new GLTFLoader();
  loader.register(parser => {
    const textureLoader = new THREE.TextureLoader(parser.options.manager);
    textureLoader.setCrossOrigin(parser.options.crossOrigin);
    textureLoader.setWithCredentials(parser.options.withCredentials);
    textureLoader.setRequestHeader(parser.options.requestHeader);
    parser.textureLoader = textureLoader;
    return {
      name: 'safe-embedded-textures',
      afterRoot(gltf) {
        if (!parser.json.images?.length) return null;
        let mapped = false;
        gltf.scene.traverse(obj => {
          if (!(obj instanceof THREE.Mesh)) return;
          for (const material of Array.isArray(obj.material) ? obj.material : [obj.material])
            if ('map' in material && material.map instanceof THREE.Texture && material.map.image) mapped = true;
        });
        if (!mapped) {
          // GLTFLoader can silently swallow image failures. Reject so callers retain their
          // usable procedural fallback rather than installing a featureless white model.
          const geometries = new Set<THREE.BufferGeometry>();
          const materials = new Set<THREE.Material>();
          gltf.scene.traverse(obj => {
            if (!(obj instanceof THREE.Mesh)) return;
            geometries.add(obj.geometry);
            for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(material);
          });
          geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
          return Promise.reject(new Error('Model texture failed to decode'));
        }
        return null;
      },
    };
  });
  return loader;
}
