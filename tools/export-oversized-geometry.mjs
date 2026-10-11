import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'node:fs/promises';
import path from 'node:path';

globalThis.self = globalThis;

const [, , inputArg, outputArg] = process.argv;

if (!inputArg || !outputArg) {
  console.error('Usage: node tools/export-oversized-geometry.mjs <input.glb> <output.json>');
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);

const loader = new GLTFLoader();
const glbBuffer = await fs.readFile(inputPath);

const gltf = await new Promise((resolve, reject) => {
  loader.parse(
    glbBuffer.buffer.slice(glbBuffer.byteOffset, glbBuffer.byteOffset + glbBuffer.byteLength),
    '',
    resolve,
    reject,
  );
});

gltf.scene.updateMatrixWorld(true);

const sceneBounds = new THREE.Box3().setFromObject(gltf.scene);
const center = sceneBounds.getCenter(new THREE.Vector3());

const positions = [];
const normals = [];
const uvs = [];
const indices = [];

let vertexOffset = 0;

const worldPosition = new THREE.Vector3();
const worldNormal = new THREE.Vector3();

gltf.scene.traverse((child) => {
  if (!child.isMesh) return;

  const geometry = child.geometry;
  const positionAttr = geometry.getAttribute('position');
  const normalAttr = geometry.getAttribute('normal');
  const uvAttr = geometry.getAttribute('uv');

  if (!positionAttr || !normalAttr || !uvAttr) return;

  const normalMatrix = new THREE.Matrix3().getNormalMatrix(child.matrixWorld);

  for (let i = 0; i < positionAttr.count; i += 1) {
    worldPosition.fromBufferAttribute(positionAttr, i).applyMatrix4(child.matrixWorld);
    positions.push(
      worldPosition.x - center.x,
      worldPosition.y - center.y,
      worldPosition.z - center.z,
    );

    worldNormal.fromBufferAttribute(normalAttr, i).applyMatrix3(normalMatrix).normalize();
    normals.push(worldNormal.x, worldNormal.y, worldNormal.z);

    uvs.push(uvAttr.getX(i), uvAttr.getY(i));
  }

  if (geometry.index) {
    for (let i = 0; i < geometry.index.count; i += 1) {
      indices.push(vertexOffset + geometry.index.getX(i));
    }
  } else {
    for (let i = 0; i < positionAttr.count; i += 1) {
      indices.push(vertexOffset + i);
    }
  }

  vertexOffset += positionAttr.count;
});

const geometryData = {
  bounds: {
    minX: sceneBounds.min.x - center.x,
    maxX: sceneBounds.max.x - center.x,
    minY: sceneBounds.min.y - center.y,
    maxY: sceneBounds.max.y - center.y,
  },
  positions,
  normals,
  uvs,
  indices,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(geometryData));

console.log(`Wrote geometry to ${outputPath}`);
