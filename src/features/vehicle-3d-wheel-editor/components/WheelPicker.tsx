import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { WheelModelOption } from '../api/wheelEditorApi';

type WheelPickerProps = {
  disabled: boolean;
  options: WheelModelOption[];
  selectedWheelId?: string;
  onSelect: (option: WheelModelOption) => void;
};

type WheelPreviewProps = {
  option: WheelModelOption;
  isSelected: boolean;
  disabled: boolean;
  onSelect: (option: WheelModelOption) => void;
};

const PREVIEW_CANVAS_SIZE = 72;

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

function getSmallestDimensionAxis(size: THREE.Vector3) {
  const dimensions = [
    { axis: new THREE.Vector3(1, 0, 0), value: size.x },
    { axis: new THREE.Vector3(0, 1, 0), value: size.y },
    { axis: new THREE.Vector3(0, 0, 1), value: size.z },
  ];

  return dimensions.sort((a, b) => a.value - b.value)[0].axis;
}

function createGltfLoader() {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(MeshoptDecoder);

  return { loader, dracoLoader };
}

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

function WheelPreview({
  option,
  isSelected,
  disabled,
  onSelect,
}: WheelPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(PREVIEW_CANVAS_SIZE, PREVIEW_CANVAS_SIZE);
    renderer.domElement.style.display = 'block';
    container.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 1000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2b3442, 2.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const { loader, dracoLoader } = createGltfLoader();
    let model: THREE.Object3D | undefined;
    let isCancelled = false;

    loader.load(
      option.url,
      (gltf) => {
        if (isCancelled) {
          disposeObject(gltf.scene);
          return;
        }

        model = gltf.scene;
        scene.add(model);
        updateWorldMatricesIteratively(model);

        const box = getSceneBox(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const viewAxis = getSmallestDimensionAxis(size);
        const radius = Math.max(size.length() / 2, Number.EPSILON);
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distance = radius / Math.sin(fov / 2) * 1.2;

        model.position.sub(center);
        updateWorldMatricesIteratively(model);

        camera.position.copy(viewAxis.multiplyScalar(distance));
        camera.lookAt(0, 0, 0);
        camera.near = Math.max(distance / 100, 0.01);
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      },
      undefined,
      () => setFailed(true),
    );

    return () => {
      isCancelled = true;
      dracoLoader.dispose();
      renderer.dispose();

      if (model) {
        disposeObject(model);
      }
    };
  }, [option.url]);

  return (
    <button
      aria-label={`Use ${option.name} wheel`}
      className={`group grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border p-2 transition-all ${
        isSelected
          ? 'border-mesh-gold bg-mesh-gold/10 shadow-[0_0_0_3px_rgba(212,168,83,0.12)]'
          : 'border-mesh-border/70 bg-white/[0.03] hover:border-mesh-gold/40 hover:bg-white/[0.05]'
      } disabled:cursor-not-allowed disabled:opacity-50`}
      disabled={disabled || failed}
      title={failed ? `${option.name} could not be loaded` : option.name}
      type="button"
      onClick={() => onSelect(option)}
    >
      <div ref={containerRef} className="grid h-[72px] w-[72px] place-items-center overflow-hidden" />
    </button>
  );
}

export function WheelPicker({
  disabled,
  options,
  selectedWheelId,
  onSelect,
}: WheelPickerProps) {
  if (options.length === 0) {
    return (
      <div className="rounded-[var(--radius-mesh-sm)] border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
        Add wheel .glb or .gltf files under backend/assets/wheels to enable wheel choices.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((option) => (
        <WheelPreview
          key={option.id}
          option={option}
          isSelected={option.id === selectedWheelId}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
