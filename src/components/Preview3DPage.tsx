import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Box, Loader2, Rotate3D, Shirt, ZoomIn } from 'lucide-react';
import * as THREE from 'three';

interface JerseyAsset {
  id: string;
  name: string;
  model: string;
  atlas: string;
  front: string;
  back: string;
}

const FALLBACK_ASSETS: JerseyAsset[] = [
  {
    id: 'black-canarinho',
    name: 'Black Canarinho',
    model: 'public/textures/final-3d/models/black-canarinho.glb',
    atlas: 'public/textures/final-3d/texture-atlas/black-canarinho-atlas.png',
    front: 'public/textures/Black Canarinho(front).png',
    back: 'public/textures/Black Canarinho(Back).png',
  },
  {
    id: 'golden-albiceleste',
    name: 'Golden Albiceleste',
    model: 'public/textures/final-3d/models/golden-albiceleste.glb',
    atlas: 'public/textures/final-3d/texture-atlas/golden-albiceleste-atlas.png',
    front: 'public/textures/Golden Albiceleste(front).png',
    back: 'public/textures/Golden Albiceleste(back).png',
  },
  {
    id: 'le-phantom',
    name: 'Le Phantom',
    model: 'public/textures/final-3d/models/le-phantom.glb',
    atlas: 'public/textures/final-3d/texture-atlas/le-phantom-atlas.png',
    front: 'public/textures/Le Phantom(Front).png',
    back: 'public/textures/Le Phantom(Back).png',
  },
  {
    id: 'lusitano-prime',
    name: 'Lusitano Prime',
    model: 'public/textures/final-3d/models/lusitano-prime.glb',
    atlas: 'public/textures/final-3d/texture-atlas/lusitano-prime-atlas.png',
    front: 'public/textures/Lusitano Prime(front).png',
    back: 'public/textures/Lusitano Prime(back).png',
  },
];

function publicPath(path: string) {
  return `/${path.replace(/^public\//, '')}`;
}

function lerp(min: number, max: number, value: number) {
  return min + (max - min) * value;
}

function createPatchGeometry(
  columns: number,
  rows: number,
  getPosition: (u: number, v: number) => [number, number, number],
  getUv: (u: number, v: number) => [number, number]
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      const [x, y, z] = getPosition(u, v);
      const [texU, texV] = getUv(u, v);
      positions.push(x, y, z);
      uvs.push(texU, texV);
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createWornJerseyGeometry(facing: 'front' | 'back', aspect: number) {
  const front = facing === 'front';
  const height = 2.95;
  const width = Math.min(3.25, height * aspect);
  const zBase = front ? 0.13 : -0.13;

  return createPatchGeometry(
    96,
    88,
    (u, v) => {
      const centeredX = u - 0.5;
      const y = (0.5 - v) * height;
      const shoulderZone = THREE.MathUtils.smoothstep(0.08, 0.28, v) * (1 - THREE.MathUtils.smoothstep(0.62, 0.82, v));
      const hemFlare = THREE.MathUtils.smoothstep(0.72, 1, v) * 0.08;
      const sleeveReach = Math.max(0, Math.abs(centeredX) - 0.27);
      const sleeveDrop = sleeveReach * 0.28 * shoulderZone;
      const xScale = 1 - Math.abs(v - 0.45) * 0.06 + hemFlare;
      const x = centeredX * width * xScale;
      const torsoCurve = Math.cos(THREE.MathUtils.clamp(centeredX / 0.5, -1, 1) * Math.PI * 0.5);
      const chestBulge = Math.max(0, torsoCurve) * (0.11 + shoulderZone * 0.025);
      const sleeveWrap = sleeveReach * 0.25 * shoulderZone;
      const fabricRipple = Math.sin(u * Math.PI * 6) * Math.sin(v * Math.PI * 3) * 0.006;
      const z = zBase + (front ? 1 : -1) * (chestBulge - sleeveWrap + fabricRipple);

      return [x, y - sleeveDrop, z];
    },
    (u, v) => [u, v]
  );
}

function createSideBandGeometry(side: 'left' | 'right') {
  const sign = side === 'right' ? 1 : -1;

  return createPatchGeometry(
    12,
    58,
    (u, v) => {
      const y = lerp(1.18, -1.3, v);
      const width = lerp(1.28, 1.18, v);
      const x = sign * width;
      const z = lerp(0.18, -0.18, u);
      return [x, y, z];
    },
    (u, v) => {
      const edgeU = side === 'right' ? lerp(0.94, 1, u) : lerp(0, 0.06, u);
      return [edgeU, v];
    }
  );
}

function WornJerseySurface({ asset }: { asset: JerseyAsset }) {
  const [frontTexture, backTexture] = useLoader(THREE.TextureLoader, [
    publicPath(asset.front),
    publicPath(asset.back),
  ]);
  const modelRef = useRef<THREE.Group>(null);
  const aspect = useMemo(() => {
    const image = frontTexture.image as HTMLImageElement | HTMLCanvasElement | undefined;
    return image && image.height > 0 ? image.width / image.height : 1.1;
  }, [frontTexture]);
  const geometries = useMemo(
    () => ({
      front: createWornJerseyGeometry('front', aspect),
      back: createWornJerseyGeometry('back', aspect),
      leftSide: createSideBandGeometry('left'),
      rightSide: createSideBandGeometry('right'),
    }),
    [aspect]
  );

  useMemo(() => {
    [frontTexture, backTexture].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
    });
  }, [frontTexture, backTexture]);

  const frontMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: frontTexture,
        transparent: true,
        alphaTest: 0.08,
        roughness: 0.62,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    [frontTexture]
  );
  const backMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: backTexture,
        transparent: true,
        alphaTest: 0.08,
        roughness: 0.62,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    [backTexture]
  );
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#07070a',
        roughness: 0.8,
        metalness: 0.02,
        transparent: true,
        opacity: 0.28,
      }),
    []
  );

  useFrame((state) => {
    if (!modelRef.current) return;
    modelRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.7) * 0.025;
  });

  return (
    <group ref={modelRef} rotation={[0, 0, 0]}>
      <mesh geometry={geometries.front} material={frontMaterial} renderOrder={3} />
      <mesh geometry={geometries.back} material={backMaterial} rotation={[0, Math.PI, 0]} renderOrder={2} />
      <mesh geometry={geometries.leftSide} material={frontMaterial} renderOrder={1} />
      <mesh geometry={geometries.rightSide} material={frontMaterial} renderOrder={1} />
      <mesh position={[0, -0.08, 0]} scale={[0.72, 1.35, 0.33]}>
        <capsuleGeometry args={[0.72, 1.7, 18, 32]} />
        <meshStandardMaterial {...bodyMaterial} />
      </mesh>
    </group>
  );
}

function PreviewJerseyModel({ asset }: { asset: JerseyAsset }) {
  return <WornJerseySurface asset={asset} />;
}

function PreviewCanvas({ asset }: { asset: JerseyAsset }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.15], fov: 42 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
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
        minDistance={1.0}
        maxDistance={4.0}
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

    fetch('/textures/final-3d/manifest.json')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load final 3D manifest');
        return response.json() as Promise<JerseyAsset[]>;
      })
      .then((manifest) => {
        if (!mounted || manifest.length === 0) return;
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
            <PreviewCanvas asset={selectedAsset} />
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
          href="/"
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8a8a9a] transition hover:border-[#00d4aa]/50 hover:text-[#00d4aa]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Back to site
        </a>
      </header>

      <nav className="absolute bottom-5 left-1/2 z-20 flex w-[min(92vw,760px)] -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/70 p-2 backdrop-blur-xl">
        {assets.map((asset) => {
          const selected = asset.id === selectedAsset?.id;

          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelectedId(asset.id)}
              className="min-w-0 flex-1 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition sm:text-xs"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                background: selected ? 'rgba(0,212,170,0.14)' : 'transparent',
                border: selected ? '1px solid rgba(0,212,170,0.55)' : '1px solid transparent',
                color: selected ? '#00d4aa' : '#8a8a9a',
                boxShadow: selected ? '0 0 18px rgba(0,212,170,0.18)' : 'none',
              }}
            >
              {asset.name}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/55 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a8a9a] backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <Rotate3D size={13} />
          Drag
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1.5">
          <ZoomIn size={13} />
          Zoom
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1.5">
          <Shirt size={13} />
          {loadingManifest ? 'Loading assets' : `${assets.length} jerseys`}
        </span>
      </div>
    </main>
  );
}
