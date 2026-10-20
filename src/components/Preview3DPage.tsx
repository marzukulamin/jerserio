import { assetUrl } from '../lib/demo';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Box, Loader2, Rotate3D, Shirt, ZoomIn } from 'lucide-react';
import * as THREE from 'three';
import ModelErrorBoundary from './ModelErrorBoundary';

interface JerseyAsset {
  id: string;
  name: string;
  model: string;
  atlas?: string;
  front?: string;
  back?: string;
  bakedTexture?: string;
}

const FALLBACK_ASSETS: JerseyAsset[] = [
  {
    id: 'black-canarinho',
    name: 'Black Canarinho',
    model: 'public/textures/demo-models/black-canarinho.glb',
  },
  {
    id: 'golden-albiceleste',
    name: 'Golden Albiceleste',
    model: 'public/textures/demo-models/golden-albiceleste.glb',
  },
  {
    id: 'le-phantom',
    name: 'Le Phantom',
    model: 'public/textures/demo-models/le-phantom.glb',
  },
  {
    id: 'lusitano-prime',
    name: 'Lusitano Prime',
    model: 'public/textures/demo-models/lusitano-prime.glb',
  },
];

function publicPath(path: string) {
  return assetUrl(path);
}

function tuneMaterial(material: THREE.Material) {
  const mat = material as THREE.MeshStandardMaterial;

  if (mat.map) {
    mat.map.colorSpace = THREE.SRGBColorSpace;
    mat.map.needsUpdate = true;
  }

  if ('roughness' in mat) {
    mat.roughness = Math.max(mat.roughness ?? 0.5, 0.55);
  }

  mat.side = THREE.FrontSide;
  mat.needsUpdate = true;
}

function PreviewJerseyModel({ asset }: { asset: JerseyAsset }) {
  const modelPath = publicPath(asset.model);
  const { scene } = useGLTF(modelPath, assetUrl('draco/'));
  const modelRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => {
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
      } else {
        const clonedMaterial = mesh.material.clone();
        tuneMaterial(clonedMaterial);
        mesh.material = clonedMaterial;
      }
    });

    return cloned;
  }, [scene]);
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
      scale: 2.35 / (size.y || 1),
    };
  }, [clonedScene]);

  useFrame((state) => {
    if (!modelRef.current) return;
    modelRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.7) * 0.02;
  });

  return (
    <group ref={modelRef} scale={modelMetrics.scale}>
      <primitive
        object={clonedScene}
        dispose={null}
        position={[-modelMetrics.center.x, -modelMetrics.center.y, -modelMetrics.center.z]}
      />
    </group>
  );
}

function PreviewCanvas({ asset }: { asset: JerseyAsset }) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      camera={{ position: [0, 0, 4.4], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#08080c']} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[0, 4, 4]} intensity={2.2} />
      <directionalLight position={[0, -2, -4]} intensity={1.1} />
      <directionalLight position={[-4, 1, 3]} intensity={1.1} />
      <directionalLight position={[4, 1, 3]} intensity={1.1} />
      <pointLight position={[0, 0, 2]} intensity={0.7} />
      <Suspense
        fallback={
          <Html center>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#00d4aa]">
              <Loader2 className="animate-spin" size={16} />
              Loading model
            </div>
          </Html>
        }
      >
        <PreviewJerseyModel asset={asset} />
      </Suspense>
      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={2.4}
        maxDistance={7.5}
        target={[0, 0, 0]}
        makeDefault
      />
    </Canvas>
  );
}

export default function Preview3DPage() {
  const [assets, setAssets] = useState<JerseyAsset[]>(FALLBACK_ASSETS);
  const [selectedId, setSelectedId] = useState(FALLBACK_ASSETS[0].id);
  const [loadingManifest, setLoadingManifest] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch(assetUrl('textures/final-3d/manifest.json'), {
      cache: 'no-store',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load final 3D manifest');
        return response.json() as Promise<JerseyAsset[]>;
      })
      .then((manifest) => {
        if (!Array.isArray(manifest) || manifest.length === 0 || !manifest.every((asset) =>
          asset && typeof asset.id === 'string' && typeof asset.name === 'string' &&
          typeof asset.model === 'string' && asset.model.startsWith('public/textures/')
        )) throw new Error('Invalid 3D manifest');
        if (!mounted) return;
        setAssets(manifest);
        setSelectedId(manifest[0].id);
      })
      .catch(() => {
        if (mounted) setAssets(FALLBACK_ASSETS);
      })
      .finally(() => {
        if (mounted) setLoadingManifest(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? assets[0];

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#040407] text-white">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 46%, rgba(0,212,170,0.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 34%)',
        }}
      />

      <section className="absolute inset-0">
        {selectedAsset ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#00d4aa]">
                <Loader2 className="animate-spin" size={22} />
                Loading preview
              </div>
            }
          >
            <ModelErrorBoundary key={selectedAsset.id}>
              <PreviewCanvas asset={selectedAsset} />
            </ModelErrorBoundary>
          </Suspense>
        ) : null}
      </section>

      <header className="absolute left-5 right-5 top-4 z-20 flex items-center justify-between gap-4">
        <div>
          <div
            className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#00d4aa]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
          >
            <Box size={14} />
            3D Asset Preview
          </div>
          <h1
            className="mt-1 text-3xl uppercase text-white sm:text-4xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}
          >
            {selectedAsset?.name ?? 'Jersey Preview'}
          </h1>
        </div>

        <a
          href={import.meta.env.BASE_URL}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8a8a9a] transition hover:border-[#00d4aa]/50 hover:text-[#00d4aa]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Back to site
        </a>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-36 z-20 flex justify-center px-4">
        <div className="flex items-center gap-5 rounded-full border border-white/10 bg-black/45 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#a0a0b0] backdrop-blur-md">
          <span className="flex items-center gap-2">
            <Rotate3D size={14} />
            Drag
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span className="flex items-center gap-2">
            <ZoomIn size={14} />
            Zoom
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span className="flex items-center gap-2">
            <Shirt size={14} />
            {assets.length} jerseys
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-20 w-[min(920px,calc(100%-2rem))] -translate-x-1/2 rounded-[28px] border border-white/10 bg-black/55 p-3 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {assets.map((asset) => {
            const active = asset.id === selectedId;

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedId(asset.id)}
                className={`rounded-full border px-4 py-3 text-center text-sm uppercase tracking-[0.14em] transition ${
                  active
                    ? 'border-[#00d4aa]/60 bg-[#00d4aa]/10 text-[#00d4aa]'
                    : 'border-transparent bg-transparent text-[#9d9dad] hover:border-white/10 hover:text-white'
                }`}
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
              >
                {asset.name}
              </button>
            );
          })}
        </div>
      </div>

      {loadingManifest ? (
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 text-[10px] uppercase tracking-[0.18em] text-[#6d6d7a]">
          Refreshing preview manifest
        </div>
      ) : null}
    </main>
  );
}
