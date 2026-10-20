import { assetUrl } from '../lib/demo';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import ModelErrorBoundary from './ModelErrorBoundary';

interface InteractiveJersey3DProps {
  jerseyId: 'golden-albiceleste' | 'black-canarinho' | 'le-phantom' | 'lusitano-prime' | string;
}

const MODEL_PATHS: Record<string, string> = {
  'black-canarinho': '/textures/demo-models/black-canarinho.glb',
  'golden-albiceleste': '/textures/demo-models/golden-albiceleste.glb',
  'le-phantom': '/textures/demo-models/le-phantom.glb',
  'lusitano-prime': '/textures/demo-models/lusitano-prime.glb',
};

const PRODUCT_STAGE_OFFSET = new THREE.Vector3(0, 0, 0);
const AUTO_ROTATION_START_DELAY = 1.6;

function getModelPath(jerseyId: string) {
  const path = MODEL_PATHS[jerseyId] ?? MODEL_PATHS['golden-albiceleste'];
  return assetUrl(path);
}

function tuneMaterial(material: THREE.Material) {
  const mat = material as THREE.MeshStandardMaterial;

  if (mat.map) {
    mat.map.colorSpace = THREE.SRGBColorSpace;
    mat.map.needsUpdate = true;
  }

  if ('roughness' in mat) {
    mat.roughness = Math.max(mat.roughness ?? 0.55, 0.58);
  }

  mat.side = THREE.FrontSide;
  mat.needsUpdate = true;
}

function cloneAndPrepareScene(scene: THREE.Group) {
  const cloned = scene.clone(true);

  cloned.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh;
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material) => {
        const clonedMaterial = material.clone();
        tuneMaterial(clonedMaterial);
        return clonedMaterial;
      });
      return;
    }

    const clonedMaterial = mesh.material.clone();
    tuneMaterial(clonedMaterial);
    mesh.material = clonedMaterial;
  });

  return cloned;
}

function JerseyModel({ jerseyId, rotating, angle }: { jerseyId: string; rotating: boolean; angle: number }) {
  const modelPath = getModelPath(jerseyId);
  const { scene } = useGLTF(modelPath, assetUrl('draco/'));
  const modelRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);
  const clonedScene = useMemo(() => cloneAndPrepareScene(scene), [scene]);
  useEffect(() => () => {
    clonedScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const material = (child as THREE.Mesh).material;
      (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
    });
  }, [clonedScene]);
  const modelMetrics = useMemo(() => {
    clonedScene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    return {
      center,
      scale: 1.34 / (size.y || 1),
    };
  }, [clonedScene]);

  useFrame((state) => {
    if (!modelRef.current) return;
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }

    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
    const rotationElapsed = Math.max(0, elapsed - AUTO_ROTATION_START_DELAY);
    if (rotating) modelRef.current.rotation.y = (rotationElapsed / 10) * Math.PI * 2 + angle;
    else modelRef.current.rotation.y = angle;
    modelRef.current.position.x = PRODUCT_STAGE_OFFSET.x;
    modelRef.current.position.y = PRODUCT_STAGE_OFFSET.y + Math.sin(elapsed * 0.7) * 0.012;
    modelRef.current.position.z = PRODUCT_STAGE_OFFSET.z;
  });

  return (
    <group ref={modelRef} scale={modelMetrics.scale} position={PRODUCT_STAGE_OFFSET}>
      <primitive
        object={clonedScene}
        dispose={null}
        position={[-modelMetrics.center.x, -modelMetrics.center.y, -modelMetrics.center.z]}
      />
    </group>
  );
}

export default function InteractiveJersey3D({ jerseyId }: InteractiveJersey3DProps) {
  const [rotating, setRotating] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [angle, setAngle] = useState(0);
  return (
    <div className="relative h-full w-full" style={{ background: 'transparent' }}>
      <ModelErrorBoundary key={jerseyId}>
        <Canvas
          className="h-full w-full"
          style={{ width: '100%', height: '100%' }}
          dpr={[1, 1.25]}
          camera={{ position: [0, 0, 4.25], fov: 33 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={1.75} />
          <directionalLight position={[0, 4, 4]} intensity={2.1} />
          <directionalLight position={[0, -2, -4]} intensity={1.05} />
          <directionalLight position={[-4, 1, 3]} intensity={1.0} />
          <directionalLight position={[4, 1, 3]} intensity={1.0} />
          <pointLight position={[0, 0, 2]} intensity={0.55} />

          <Suspense
            fallback={
              <Html center>
                <div className="rounded-full border border-white/10 bg-black/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00d4aa]">
                  Loading jersey
                </div>
              </Html>
            }
          >
            <JerseyModel jerseyId={jerseyId} rotating={rotating} angle={angle} />
          </Suspense>

          <OrbitControls
            onStart={() => setRotating(false)}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
            rotateSpeed={0.8}
            target={[0, 0, 0]}
            makeDefault
          />
        </Canvas>
      </ModelErrorBoundary>

      <div className="model-controls absolute top-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        <button className="model-button" aria-label="Rotate jersey left" onClick={() => { setRotating(false); setAngle((value) => value - Math.PI / 4); }}>↶</button>
        <button className="model-button" aria-pressed={rotating} onClick={() => setRotating((value) => !value)}>{rotating ? 'Pause' : 'Auto rotate'}</button>
        <button className="model-button" aria-label="Rotate jersey right" onClick={() => { setRotating(false); setAngle((value) => value + Math.PI / 4); }}>↷</button>
      </div>

      <div className="pointer-events-none absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8a8a9a] backdrop-blur-md">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
        Drag horizontally
      </div>
    </div>
  );
}
