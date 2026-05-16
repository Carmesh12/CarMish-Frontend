import { Suspense, useLayoutEffect, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Center, Environment, Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import type { SupportedModelExtension } from './modelExtension';

/** Slight IBL response on PBR materials — does not move or rescale the model */
function EnhanceMaterials({ object }: { object: THREE.Object3D }) {
  useLayoutEffect(() => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material;
        const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
        for (const m of mats) {
          if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
            m.envMapIntensity = THREE.MathUtils.clamp((m.envMapIntensity ?? 1) * 0.9, 0.35, 1.4);
          }
        }
      }
    });
  }, [object]);
  return <primitive object={object} />;
}

function GlbOrGltfModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);
  return <EnhanceMaterials object={scene} />;
}

function ObjModel({ url }: { url: string }) {
  const obj = useLoader(OBJLoader, url);
  const cloned = useMemo(() => obj.clone(), [obj]);
  return <EnhanceMaterials object={cloned} />;
}

function StlModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  const geom = useMemo(() => geometry.clone(), [geometry]);
  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#c8d4e2"
        metalness={0.22}
        roughness={0.42}
        clearcoat={0.08}
        clearcoatRoughness={0.4}
        envMapIntensity={1}
      />
    </mesh>
  );
}

function LoadedModel({ url, ext }: { url: string; ext: SupportedModelExtension }) {
  if (ext === 'glb' || ext === 'gltf') return <GlbOrGltfModel url={url} />;
  if (ext === 'obj') return <ObjModel url={url} />;
  return <StlModel url={url} />;
}

function CanvasLoading() {
  return (
    <Html center>
      <div className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
        Loading model…
      </div>
    </Html>
  );
}

interface LocalModelSceneProps {
  assetUrl: string;
  extension: SupportedModelExtension;
  className?: string;
}

export function LocalModelScene({ assetUrl, extension, className }: LocalModelSceneProps) {
  return (
    <div className={className}>
      <Canvas
        className="block h-full w-full touch-none"
        shadows
        camera={{ position: [2.8, 2, 2.8], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={['#070b14']} />

        <hemisphereLight color="#e8eefc" groundColor="#18120c" intensity={0.32} />
        <ambientLight intensity={0.38} />

        <directionalLight
          castShadow
          position={[8, 12, 6]}
          intensity={1.05}
          color="#fff6ed"
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-5, 4, -4]} intensity={0.28} color="#c8d8ff" />

        <Suspense fallback={<CanvasLoading />}>
          <Environment preset="studio" environmentIntensity={0.55} />
          <Center>
            <LoadedModel url={assetUrl} ext={extension} />
          </Center>
        </Suspense>

        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
