import * as THREE from 'three';

type Axis = 0 | 1 | 2;

type WheelCandidate = {
  mesh: THREE.Mesh;
  box: THREE.Box3;
  center: THREE.Vector3;
  diameter: number;
  score: number;
};

export type WheelCluster = {
  id: number;
  box: THREE.Box3;
  center: THREE.Vector3;
  diameter: number;
  score: number;
  meshes: THREE.Mesh[];
};

export type WheelDetectionResult = {
  detectedCount: number;
  candidateCount: number;
  clusters: WheelCluster[];
};

const axisNames = ['x', 'y', 'z'] as const;
const maxVertexSamplesPerMesh = 1400;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getDimension(size: THREE.Vector3, axis: Axis) {
  return size[axisNames[axis]];
}

function getCoordinate(point: THREE.Vector3, axis: Axis) {
  return point[axisNames[axis]];
}

function getPlaneAxes(thicknessAxis: Axis): [Axis, Axis] {
  return [0, 1, 2].filter((axis) => axis !== thicknessAxis) as [Axis, Axis];
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

function collectMeshes(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const object = stack.pop()!;
    const mesh = object as THREE.Mesh;

    if (mesh.isMesh && mesh.geometry) {
      meshes.push(mesh);
    }

    for (let index = object.children.length - 1; index >= 0; index -= 1) {
      stack.push(object.children[index]);
    }
  }

  return meshes;
}

function getMeshWorldBox(mesh: THREE.Mesh) {
  const geometry = mesh.geometry;

  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }

  return geometry.boundingBox?.clone().applyMatrix4(mesh.matrixWorld);
}

function getRadialConsistency(
  mesh: THREE.Mesh,
  center: THREE.Vector3,
  planeAxes: [Axis, Axis],
) {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute('position');

  if (!position) {
    return 0;
  }

  const point = new THREE.Vector3();
  const radii: number[] = [];
  const step = Math.max(1, Math.ceil(position.count / maxVertexSamplesPerMesh));
  let maxRadius = 0;

  for (let index = 0; index < position.count; index += step) {
    point.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld);

    const a =
      getCoordinate(point, planeAxes[0]) - getCoordinate(center, planeAxes[0]);
    const b =
      getCoordinate(point, planeAxes[1]) - getCoordinate(center, planeAxes[1]);
    const radius = Math.sqrt(a * a + b * b);

    if (Number.isFinite(radius) && radius > 0) {
      radii.push(radius);
      maxRadius = Math.max(maxRadius, radius);
    }
  }

  if (radii.length < 8) {
    return 0;
  }

  const outerRadii = radii.filter((radius) => radius >= maxRadius * 0.55);

  if (outerRadii.length < 8) {
    return 0;
  }

  const mean =
    outerRadii.reduce((sum, radius) => sum + radius, 0) / outerRadii.length;
  const variance =
    outerRadii.reduce((sum, radius) => sum + (radius - mean) ** 2, 0) /
    outerRadii.length;
  const deviation = Math.sqrt(variance);

  return clamp(1 - deviation / Math.max(mean, Number.EPSILON));
}

function analyzeCircularShape(mesh: THREE.Mesh, box: THREE.Box3) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  let best:
    | {
        diameter: number;
        roundness: number;
        radialConsistency: number;
        thicknessRatio: number;
        shapeScore: number;
      }
    | undefined;

  for (const thicknessAxis of [0, 1, 2] as Axis[]) {
    const [planeA, planeB] = getPlaneAxes(thicknessAxis);
    const a = getDimension(size, planeA);
    const b = getDimension(size, planeB);
    const thickness = getDimension(size, thicknessAxis);
    const diameter = Math.max(a, b);

    if (diameter <= 0) {
      continue;
    }

    const roundness = Math.min(a, b) / diameter;
    const thicknessRatio = thickness / diameter;
    const radialConsistency = getRadialConsistency(mesh, center, [
      planeA,
      planeB,
    ]);
    const shapeScore = roundness * 0.62 + radialConsistency * 0.38;

    if (!best || shapeScore > best.shapeScore) {
      best = {
        diameter,
        roundness,
        radialConsistency,
        thicknessRatio,
        shapeScore,
      };
    }
  }

  return best;
}

function toCandidate(
  mesh: THREE.Mesh,
  box: THREE.Box3,
  modelBox: THREE.Box3,
  modelSize: THREE.Vector3,
) {
  const size = box.getSize(new THREE.Vector3());

  if (size.lengthSq() === 0) {
    return undefined;
  }

  const shape = analyzeCircularShape(mesh, box);

  if (!shape) {
    return undefined;
  }

  const modelMax = Math.max(modelSize.x, modelSize.y, modelSize.z);
  const minDiameter = modelMax * 0.04;
  const maxDiameter = modelMax * 0.42;
  const center = box.getCenter(new THREE.Vector3());
  const verticalPosition =
    (center.y - modelBox.min.y) / Math.max(modelSize.y, Number.EPSILON);

  if (
    shape.diameter < minDiameter ||
    shape.diameter > maxDiameter ||
    shape.roundness < 0.58 ||
    shape.radialConsistency < 0.28 ||
    shape.thicknessRatio > 0.95 ||
    verticalPosition > 0.7
  ) {
    return undefined;
  }

  const xSide =
    Math.abs(
      (center.x - modelBox.min.x) / Math.max(modelSize.x, Number.EPSILON) -
        0.5,
    ) * 2;
  const zSide =
    Math.abs(
      (center.z - modelBox.min.z) / Math.max(modelSize.z, Number.EPSILON) -
        0.5,
    ) * 2;
  const sideScore = Math.max(xSide, zSide);
  const lowerScore = 1 - clamp(verticalPosition / 0.7);
  const diameterRatio = shape.diameter / Math.max(modelMax, Number.EPSILON);
  const wheelSizeScore = 1 - clamp(Math.abs(diameterRatio - 0.16) / 0.16);

  return {
    mesh,
    box,
    center,
    diameter: shape.diameter,
    score: shape.shapeScore * 4 + lowerScore * 2 + sideScore + wheelSizeScore,
  } satisfies WheelCandidate;
}

function addToCluster(cluster: WheelCluster, candidate: WheelCandidate) {
  cluster.meshes.push(candidate.mesh);
  cluster.box.union(candidate.box);
  cluster.center = cluster.box.getCenter(new THREE.Vector3());
  cluster.diameter = Math.max(cluster.diameter, candidate.diameter);
  cluster.score = Math.max(cluster.score, candidate.score);
}

function clusterCandidates(candidates: WheelCandidate[]) {
  const clusters: WheelCluster[] = [];

  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    const matchingCluster = clusters.find((cluster) => {
      const distance = cluster.center.distanceTo(candidate.center);
      return distance <= Math.max(cluster.diameter, candidate.diameter) * 0.7;
    });

    if (matchingCluster) {
      addToCluster(matchingCluster, candidate);
      continue;
    }

    clusters.push({
      id: clusters.length + 1,
      box: candidate.box.clone(),
      center: candidate.center.clone(),
      diameter: candidate.diameter,
      score: candidate.score,
      meshes: [candidate.mesh],
    });
  }

  return clusters.sort((a, b) => b.score - a.score);
}

export function detectWheelClusters(
  root: THREE.Object3D,
): WheelDetectionResult {
  updateWorldMatricesIteratively(root);

  const meshes = collectMeshes(root);
  const meshBoxes = meshes
    .map((mesh) => ({ mesh, box: getMeshWorldBox(mesh) }))
    .filter(
      (entry): entry is { mesh: THREE.Mesh; box: THREE.Box3 } =>
        Boolean(entry.box),
    );
  const modelBox = meshBoxes.reduce(
    (box, entry) => box.union(entry.box),
    new THREE.Box3().makeEmpty(),
  );
  const modelSize = modelBox.getSize(new THREE.Vector3());
  const candidates: WheelCandidate[] = [];

  for (const { mesh, box } of meshBoxes) {
    const candidate = toCandidate(mesh, box, modelBox, modelSize);

    if (candidate) {
      candidates.push(candidate);
    }
  }

  const clusters = clusterCandidates(candidates);
  const targetCount = clusters.length >= 4 ? 4 : clusters.length >= 2 ? 2 : 0;
  const selectedClusters = clusters.slice(0, targetCount).map((cluster, index) => ({
    ...cluster,
    id: index + 1,
  }));

  return {
    detectedCount: selectedClusters.length,
    candidateCount: candidates.length,
    clusters: selectedClusters,
  };
}
