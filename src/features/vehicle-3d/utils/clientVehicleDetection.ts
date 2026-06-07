export type VehicleDetectionSlot = "front" | "left" | "back" | "right";

type SlotFiles = Record<VehicleDetectionSlot, File>;

type SlotDetectionResult = {
  slot: VehicleDetectionSlot;
  fileName: string;
  score: number;
  detectedClass: string | null;
  accepted: boolean;
};

export type VehicleDetectionResult = {
  valid: boolean;
  averageScore: number;
  acceptedSlots: number;
  results: SlotDetectionResult[];
};

let modelPromise: Promise<
  import("@tensorflow-models/coco-ssd").ObjectDetection
> | null = null;

const VEHICLE_CLASSES = new Set(["car", "truck", "bus"]);
const MIN_SLOT_SCORE = 0.35;
const MIN_AVERAGE_SCORE = 0.5;
const MIN_ACCEPTED_SLOTS = 3;

function getModel() {
  modelPromise ??= Promise.all([
    import("@tensorflow/tfjs"),
    import("@tensorflow-models/coco-ssd"),
  ]).then(([, cocoSsd]) => cocoSsd.load({ base: "lite_mobilenet_v2" }));
  return modelPromise;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to read image: ${file.name}`));
    };
    image.src = url;
  });
}

export async function detectVehicleIn3dImages(
  files: SlotFiles,
): Promise<VehicleDetectionResult> {
  const model = await getModel();
  const slots: VehicleDetectionSlot[] = ["front", "left", "back", "right"];

  const results = await Promise.all(
    slots.map(async (slot) => {
      const image = await loadImage(files[slot]);
      const predictions = await model.detect(image);
      const bestVehicle = predictions
        .filter((prediction) => VEHICLE_CLASSES.has(prediction.class))
        .sort((a, b) => b.score - a.score)[0];
      const score = bestVehicle?.score ?? 0;

      return {
        slot,
        fileName: files[slot].name,
        score,
        detectedClass: bestVehicle?.class ?? null,
        accepted: score >= MIN_SLOT_SCORE,
      };
    }),
  );

  const averageScore =
    results.reduce((sum, result) => sum + result.score, 0) / results.length;
  const acceptedSlots = results.filter((result) => result.accepted).length;

  return {
    valid:
      averageScore >= MIN_AVERAGE_SCORE &&
      acceptedSlots >= MIN_ACCEPTED_SLOTS,
    averageScore,
    acceptedSlots,
    results,
  };
}

export function formatVehicleDetectionError(result: VehicleDetectionResult) {
  const percent = Math.round(result.averageScore * 100);
  const failedSlots = result.results
    .filter((slot) => !slot.accepted)
    .map((slot) => `${slot.slot} (${Math.round(slot.score * 100)}%)`)
    .join(", ");

  return failedSlots
    ? `Invalid object: car detection confidence is ${percent}%. Weak views: ${failedSlots}. Please upload clear photos of the same car.`
    : `Invalid object: car detection confidence is ${percent}%. Please upload clear photos of a car.`;
}
