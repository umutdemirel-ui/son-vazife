// Offline only. Adapt CC0 models to the size they actually occupy on screen.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  weld,
  simplify,
  prune,
  unweld,
  tangents,
  textureCompress,
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { generateTangents } from 'mikktspace';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('public/assets'),
  out = path.join(root, 'workshop/dressing');
await mkdir(out, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
const props = {
  lantern: 'Lantern_01',
  chair: 'WoodenChair_01',
  barrel: 'Barrel_01',
  cabinet: 'GothicCabinet_01',
  candleholders: 'brass_candleholders',
  desk_lamp: 'desk_lamp_arm_01',
  binder: 'binder_notebook',
  dead_tree: 'dead_tree_trunk',
  rock: 'rock_04',
  crate: 'wooden_crate_01',
};
for (const [id, folder] of Object.entries(props)) {
  const dir = path.resolve('art/environment/cc0/models', folder);
  const [file] = (await readdir(dir)).filter((s) => s.endsWith('.gltf'));
  const doc = await io.read(path.join(dir, file));
  for (const m of doc.getRoot().listMaterials()) {
    // A thumbnail-size porch lamp shouldn't require refracting the entire village into a second framebuffer.
    m.setExtension('KHR_materials_transmission', null);
    if (id === 'lantern' && m.getName().includes('glass'))
      m.setAlphaMode('BLEND').setBaseColorFactor([0.8, 0.72, 0.55, 0.3]).setDoubleSided(false);
  }
  for (const ext of doc.getRoot().listExtensionsUsed())
    if (ext.extensionName === 'KHR_materials_transmission') ext.dispose();
  const size = ['dead_tree', 'rock', 'cabinet'].includes(id) ? 512 : 256;
  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.16, error: 0.013 }),
    unweld(),
    tangents({ generateTangents }),
    weld(),
    prune(),
    dedup(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size, size], quality: 82 }),
  );
  // A few original triangles have collapsed UVs. Mikk returns a zero tangent there;
  // choose a unit vector perpendicular to the normal instead of shipping invalid TANGENT data.
  for (const mesh of doc.getRoot().listMeshes())
    for (const primitive of mesh.listPrimitives()) {
      const t = primitive.getAttribute('TANGENT'),
        n = primitive.getAttribute('NORMAL');
      if (!t || !n) continue;
      for (let i = 0; i < t.getCount(); i++) {
        const [x, y, z, w] = t.getElement(i, []);
        if (Math.hypot(x, y, z) > 0.998) continue;
        const [nx, ny, nz] = n.getElement(i, []);
        const p = Math.abs(nz) < 0.8 ? [ny, -nx, 0] : [0, nz, -ny],
          len = Math.hypot(...p);
        t.setElement(i, [p[0] / len, p[1] / len, p[2] / len, w < 0 ? -1 : 1]);
      }
    }
  await io.write(path.join(out, id + '.glb'), doc);
}
