import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  detectWheelClusters,
  type WheelCluster,
  type WheelDetectionResult,
} from '../utils/wheelDetection';

type WheelEditorViewerProps = {
  modelUrl?: string;
  replaceSignal: number;
  wheelModelUrl?: string;
  onDetection: (result: WheelDetectionResult | null) => void;
  onReplacementStatus: (status: string) => void;
};

function disposeObject(object: THREE.Object3D) {
  const stack = [object];

  while (stack.length > 0) {
    const child = stack.pop()!;
    const mesh = child as THREE.Mesh;

    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = mesh.material;

    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else if (material) {
      material.dispose();
    }

    for (let index = child.children.length - 1; index >= 0; index -= 1) {
      stack.push(child.children[index]);
    }
  }
}

function updateWorldMatricesIteratively(root: THREE.Object3D) {
  const stack: Array<{
    object: THREE.Object3D;
    parentWorldMatrix?: THREE.Matrix4;
  }> = [{ object: root }];

  while (stack.length > 0) {
    const { object, parentWorldMatrix } = stack.pop()!;

    if (object.matrixAutoUpdate) {
      object.updateMatrix();
    }

    if (parentWorldMatrix) {
      object.matrixWorld.multiplyMatrices(parentWorldMatrix, object.matrix);
    } else {
      object.matrixWorld.copy(object.matrix);
    }

    for (let index = object.children.length - 1; index >= 0; index -= 1) {
      stack.push({
        object: object.children[index],
        parentWorldMatrix: object.matrixWorld,
      });
    }
  }
}

function getSceneBox(object: THREE.Object3D) {
  const box = new THREE.Box3().makeEmpty();
  const stack = [object];

  while (stack.length > 0) {
    const child = stack.pop()!;
    const mesh = child as THREE.Mesh;

    if (mesh.isMesh && mesh.geometry) {
      if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
      }

      if (mesh.geometry.boundingBox) {
        box.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
      }
    }

    for (let index = child.children.length - 1; index >= 0; index -= 1) {
      stack.push(child.children[index]);
    }
  }

  return box;
}

function normalizeBottomCenterPivot(object: THREE.Object3D) {
  updateWorldMatricesIteratively(object);

  const box = getSceneBox(object);
  if (box.isEmpty()) {
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.y -= box.min.y;
  object.position.z -= center.z;
  updateWorldMatricesIteratively(object);
}

function clearHighlightGroup(group: THREE.Group) {
  const materials = new Set<THREE.Material>();
  const stack = [...group.children];

  while (stack.length > 0) {
    const child = stack.pop()!;
    const mesh = child as THREE.Mesh;
    const material = mesh.material;

    if (Array.isArray(material)) {
      material.forEach((item) => materials.add(item));
    } else if (material) {
      materials.add(material);
    }

    for (let index = child.children.length - 1; index >= 0; index -= 1) {
      stack.push(child.children[index]);
    }
  }

  materials.forEach((material) => material.dispose());
  group.clear();
}

function createWheelMask(cluster: WheelCluster) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0xd4a853,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  cluster.meshes.forEach((sourceMesh) => {
    const mask = new THREE.Mesh(sourceMesh.geometry, material);
    mask.matrix.copy(sourceMesh.matrixWorld);
    mask.matrixAutoUpdate = false;
    mask.renderOrder = 10;
    group.add(mask);
  });

  return group;
}

function createGltfLoader() {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(MeshoptDecoder);

  return { loader, dracoLoader };
}

function hideOriginalWheelMeshes(clusters: WheelCluster[]) {
  clusters.forEach((cluster) => {
    cluster.meshes.forEach((mesh) => {
      mesh.visible = false;
    });
  });
}

function getSmallestDimensionAxis(size: THREE.Vector3) {
  const dimensions = [
    { axis: new THREE.Vector3(1, 0, 0), value: size.x },
    { axis: new THREE.Vector3(0, 1, 0), value: size.y },
    { axis: new THREE.Vector3(0, 0, 1), value: size.z },
  ];

  return dimensions.sort((a, b) => a.value - b.value)[0].axis;
}

function createReplacementWheel(
  template: THREE.Object3D,
  cluster: WheelCluster,
  wheelsCenter: THREE.Vector3,
) {
  const wheel = template.clone(true);
  updateWorldMatricesIteratively(wheel);

  const sourceBox = getSceneBox(wheel);
  const sourceCenter = sourceBox.getCenter(new THREE.Vector3());
  const targetSize = cluster.box.getSize(new THREE.Vector3());
  const sourceAxleAxis = getSmallestDimensionAxis(sourceBox.getSize(new THREE.Vector3()));
  const targetAxleAxis = getSmallestDimensionAxis(targetSize);
  const side = cluster.center.clone().sub(wheelsCenter).dot(targetAxleAxis);
  const signedTargetAxleAxis = targetAxleAxis
    .clone()
    .multiplyScalar(side < 0 ? -1 : 1);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    sourceAxleAxis,
    signedTargetAxleAxis,
  );

  wheel.position.sub(sourceCenter);

  const alignedWheel = new THREE.Group();
  alignedWheel.quaternion.copy(rotation);
  alignedWheel.add(wheel);
  updateWorldMatricesIteratively(alignedWheel);

  const alignedSize = getSceneBox(alignedWheel).getSize(new THREE.Vector3());
  const wrapper = new THREE.Group();
  wrapper.position.copy(cluster.center);
  wrapper.scale.set(
    targetSize.x / Math.max(alignedSize.x, Number.EPSILON),
    targetSize.y / Math.max(alignedSize.y, Number.EPSILON),
    targetSize.z / Math.max(alignedSize.z, Number.EPSILON),
  );
  wrapper.add(alignedWheel);

  return wrapper;
}

function replaceDetectedWheels(
  scene: THREE.Scene,
  template: THREE.Object3D,
  clusters: WheelCluster[],
  previousReplacement?: THREE.Group,
) {
  if (previousReplacement) {
    scene.remove(previousReplacement);
    disposeObject(previousReplacement);
  }

  const replacementGroup = new THREE.Group();
  const wheelsCenter = clusters
    .reduce((box, cluster) => box.union(cluster.box), new THREE.Box3().makeEmpty())
    .getCenter(new THREE.Vector3());

  hideOriginalWheelMeshes(clusters);

  clusters.forEach((cluster) => {
    replacementGroup.add(createReplacementWheel(template, cluster, wheelsCenter));
  });

  scene.add(replacementGroup);

  return replacementGroup;
}

function frameModel(
  model: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
) {
  updateWorldMatricesIteratively(model);
  const box = getSceneBox(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const distance = maxSize * 1.8 || 8;

  controls.target.copy(center);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.position.set(
    center.x + distance,
    center.y + distance * 0.45,
    center.z + distance,
  );
  camera.updateProjectionMatrix();
  controls.update();
}

export function WheelEditorViewer({
  modelUrl,
  replaceSignal,
  wheelModelUrl,
  onDetection,
  onReplacementStatus,
}: WheelEditorViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const outlinesRef = useRef<THREE.Group | null>(null);
  const detectedClustersRef = useRef<WheelCluster[]>([]);
  const replacementRef = useRef<THREE.Group | null>(null);
  const [viewerStatus, setViewerStatus] = useState('Loading editor...');

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(4, 3, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(container.clientWidth, container.clientHeight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x334455, 2.2);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(6, 8, 6);

    const grid = new THREE.GridHelper(10, 10, 0x324155, 0x243143);
    const highlights = new THREE.Group();

    scene.add(ambientLight, keyLight, grid, highlights);
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;
    outlinesRef.current = highlights;

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let animationFrame = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const highlights = outlinesRef.current;

    if (!scene || !camera || !controls || !highlights || !modelUrl) {
      return undefined;
    }

    setViewerStatus('Loading 3D model...');
    onDetection(null);
    clearHighlightGroup(highlights);
    detectedClustersRef.current = [];

    if (modelRef.current) {
      scene.remove(modelRef.current);
      disposeObject(modelRef.current);
      modelRef.current = null;
    }

    if (replacementRef.current) {
      scene.remove(replacementRef.current);
      disposeObject(replacementRef.current);
      replacementRef.current = null;
    }

    const { loader, dracoLoader } = createGltfLoader();
    let isCancelled = false;

    loader.load(
      modelUrl,
      (gltf) => {
        if (isCancelled) {
          disposeObject(gltf.scene);
          return;
        }

        const model = gltf.scene;
        scene.add(model);
        modelRef.current = model;

        try {
          normalizeBottomCenterPivot(model);
          frameModel(model, camera, controls);

          const result = detectWheelClusters(model);
          detectedClustersRef.current = result.clusters;
          clearHighlightGroup(highlights);
          result.clusters.forEach((cluster) =>
            highlights.add(createWheelMask(cluster)),
          );

          onDetection(result);
          setViewerStatus(
            result.detectedCount > 0
              ? `Detected ${result.detectedCount} wheel object${result.detectedCount === 1 ? '' : 's'}.`
              : 'No clear wheel objects were detected.',
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown processing error';
          console.error('Wheel detection error:', error);
          onDetection(null);
          setViewerStatus(`Model loaded, but wheel detection failed: ${message}`);
        }
      },
      undefined,
      (error) => {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : 'Unknown loader error';
          console.error('GLB load error:', error);
          setViewerStatus(`Could not load this 3D model: ${message}`);
          onDetection(null);
        }
      },
    );

    return () => {
      isCancelled = true;
      dracoLoader.dispose();
    };
  }, [modelUrl, onDetection]);

  useEffect(() => {
    const scene = sceneRef.current;
    const clusters = detectedClustersRef.current;

    if (!scene || replaceSignal === 0) {
      return undefined;
    }

    if (!wheelModelUrl) {
      onReplacementStatus('Choose a wheel option first.');
      return undefined;
    }

    if (clusters.length !== 2 && clusters.length !== 4) {
      onReplacementStatus('Detect 2 or 4 wheels before replacing them.');
      return undefined;
    }

    onReplacementStatus('Loading replacement wheel model...');

    const { loader, dracoLoader } = createGltfLoader();
    let isCancelled = false;

    loader.load(
      wheelModelUrl,
      (gltf) => {
        if (isCancelled) {
          disposeObject(gltf.scene);
          return;
        }

        try {
          replacementRef.current = replaceDetectedWheels(
            scene,
            gltf.scene,
            clusters,
            replacementRef.current ?? undefined,
          );
          clearHighlightGroup(outlinesRef.current!);
          onReplacementStatus(`Replaced ${clusters.length} detected wheels.`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown replacement error';
          console.error('Wheel replacement error:', error);
          onReplacementStatus(`Wheel replacement failed: ${message}`);
        }
      },
      undefined,
      (error) => {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : 'Unknown loader error';
          console.error('Replacement wheel load error:', error);
          onReplacementStatus(`Could not load replacement wheel model: ${message}`);
        }
      },
    );

    return () => {
      isCancelled = true;
      dracoLoader.dispose();
    };
  }, [onReplacementStatus, replaceSignal, wheelModelUrl]);

  return (
    <div className="relative h-[min(72vh,680px)] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute bottom-4 right-4 max-w-[min(440px,calc(100%-32px))] rounded-full border border-mesh-gold/30 bg-mesh-bg/80 px-4 py-2 text-xs text-mesh-gold backdrop-blur-md">
        {viewerStatus}
      </div>
    </div>
  );
}
