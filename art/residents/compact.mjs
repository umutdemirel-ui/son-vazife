// Same skins, sockets, UVs and animation clips for memory-constrained village sessions.
import { NodeIO } from '@gltf-transform/core';
import { weld, simplify, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const dir = 'public/assets/residents',
  io = new NodeIO();
await mkdir(`${dir}/compact`, { recursive: true });
await MeshoptSimplifier.ready;
for (const id of ['bekci', 'serife', 'kenan', 'idris']) {
  const doc = await io.read(`${dir}/${id}.glb`);
  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.52, error: 0.004 }),
    prune({ keepLeaves: true }),
    textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [512, 512], quality: 86 }),
  );
  await io.write(`${dir}/compact/${id}.glb`, doc);
}
