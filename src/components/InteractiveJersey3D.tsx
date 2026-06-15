import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface InteractiveJersey3DProps {
  jerseyId: 'golden-albiceleste' | 'black-canarinho' | 'le-phantom' | 'lusitano-prime' | string;
}

// Map jersey ids to their respective texture files inside public/textures
const JERSEY_TEXTURES_MAP: Record<string, { front: string; back: string; nameColor: string; numColor: string }> = {
  'golden-albiceleste': {
    front: '/textures/Golden Albiceleste(front).png',
    back: '/textures/Golden Albiceleste(back).png',
    nameColor: '#ffffff',
    numColor: '#e0c068', // Golden number
  },
  'black-canarinho': {
    front: '/textures/Black Canarinho(front).png',
    back: '/textures/Black Canarinho(Back).png',
    nameColor: '#00d4aa',
    numColor: '#00d4aa', // Neon teal
  },
  'le-phantom': {
    front: '/textures/Le Phantom(Front).png',
    back: '/textures/Le Phantom(Back).png',
    nameColor: '#ffffff',
    numColor: '#4fc3f7', // Electric blue
  },
  'lusitano-prime': {
    front: '/textures/Lusitano Prime(front).png',
    back: '/textures/Lusitano Prime(back).png',
    nameColor: '#ef5350', // Crimson red
    numColor: '#ef5350',
  },
};

// 3D Model inner component
function JerseyModel({ texture }: { texture: THREE.CanvasTexture | null }) {
  // Load the blank t_shirt GLB
  const { scene } = useGLTF('/textures/t_shirt.glb', true);
  
  // Clone scene so we don't share instances across carousel changes, resolving caching bugs!
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const modelRef = useRef<THREE.Group>(null);

  // Gentle idle floating and rotating
  useFrame((state) => {
    if (modelRef.current) {
      // Float around the model's actual center Y (1.29)
      modelRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.7) * 0.02;
      // Subtlest rotation so it stays horizontal and keeps looking directly at the user
      modelRef.current.rotation.y = Math.PI + Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
    }
  });

  // Apply textures to materials on the cloned instance
  useEffect(() => {
    if (!clonedScene || !texture) return;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat) => {
            const m = mat as THREE.MeshStandardMaterial;
            m.map = texture;
            m.color = new THREE.Color('#ffffff'); // Force bright white color multiplier
            m.roughness = 0.45;
            m.metalness = 0.12;
            m.needsUpdate = true;
          });
        }
      }
    });
  }, [clonedScene, texture]);

  // Centered vertically around its actual mesh bounds, scaled up to look incredibly close!
  return (
    <primitive 
      object={clonedScene} 
      ref={modelRef} 
      scale={2.8} 
      position={[0, -1.29 * 2.8, 0]} // Shift the floating origin (1.29) down by scale so it pivots at the screen center!
      rotation={[0, Math.PI, 0]} // Rotated 180 degrees so FRONT faces you horizontally!
    />
  );
}

export default function InteractiveJersey3D({ jerseyId }: InteractiveJersey3DProps) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const config = JERSEY_TEXTURES_MAP[jerseyId] || JERSEY_TEXTURES_MAP['golden-albiceleste'];
  const numberToPrint = jerseyId === 'lusitano-prime' ? '07' : '10';

  useEffect(() => {
    // Create a 2D canvas compositor
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgFront = new Image();
    const imgBack = new Image();

    imgFront.crossOrigin = 'anonymous';
    imgBack.crossOrigin = 'anonymous';

    let loadedCount = 0;
    const compileTextures = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Fill base dark layer
        ctx.fillStyle = '#09090d';
        ctx.fillRect(0, 0, 2048, 2048);

        // Draw flat designs side-by-side onto our canvas
        ctx.drawImage(imgFront, 0, 0, 1024, 2048);
        ctx.drawImage(imgBack, 1024, 0, 1024, 2048);

        // --- DYNAMICALLY ERASE "MARZUK" FROM BACK (Right Half: X range 1024-2048) ---
        try {
          const pixelData = ctx.getImageData(1536, 680, 1, 1).data;
          ctx.fillStyle = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
        } catch (e) {
          ctx.fillStyle = '#111116';
        }
        // Erase text bounding box
        ctx.fillRect(1310, 560, 452, 145);

        // --- DRAW THE HIGH-RES SPORTS NUMBERS ---
        ctx.fillStyle = config.numColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 12;

        // Draw player numbers on the BACK
        ctx.font = "italic bold 175px 'Barlow Condensed', sans-serif";
        ctx.fillText(numberToPrint, 1536, 860);

        // Draw player numbers on the FRONT chest
        ctx.font = "italic bold 58px 'Barlow Condensed', sans-serif";
        ctx.fillText(numberToPrint, 660, 720);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        
        setTexture(tex);
      }
    };

    imgFront.onload = compileTextures;
    imgBack.onload = compileTextures;
    imgFront.onerror = compileTextures; 
    imgBack.onerror = compileTextures;   

    imgFront.src = config.front;
    imgBack.src = config.back;

  }, [jerseyId, config.front, config.back, config.numColor, numberToPrint]);

  return (
    <div className="w-full h-full relative" style={{ background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 0, 1.15], fov: 45 }} // Camera brought extremely close (Z = 1.15) for a full frame detail view!
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      >
        {/* Studio Lighting */}
        <ambientLight intensity={1.6} />
        <directionalLight position={[0, 4, 4]} intensity={2.0} />
        <directionalLight position={[0, -2, -4]} intensity={1.2} />
        <directionalLight position={[-4, 1, 3]} intensity={1.0} />
        <directionalLight position={[4, 1, 3]} intensity={1.0} />
        <pointLight position={[0, 0, 2]} intensity={0.6} />

        {/* 3D Model with pre-composited texture state passed down */}
        <JerseyModel texture={texture} />

        {/* Camera Control: Drag to spin, Scroll to zoom */}
        <OrbitControls
          enableZoom={true}
          maxDistance={2.5}
          minDistance={0.8}
          enablePan={false}
          autoRotate={false}
          makeDefault
          target={[0, 0, 0]} // Pivot point remains centered
        />
      </Canvas>

      {/* Subtle touch help hint overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] tracking-widest text-[#8a8a9a] uppercase font-bold flex items-center gap-1.5 z-20">
        <svg className="animate-pulse" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        Drag to spin • Scroll to zoom
      </div>
    </div>
  );
}

// Preload the blank GLTF model to avoid lag
useGLTF.preload('/textures/t_shirt.glb');
