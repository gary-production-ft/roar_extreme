/**
 * Device-side Biometric Processing & Pluggable Liveness Engine
 * ROAR EXTREME — Software-only Face Access (Phase 1)
 *
 * Built with @vladmandic/face-api
 * - Models lazy-loaded on demand from /models
 * - Descriptors computed locally on device (WebGL/WASM)
 * - Raw video frames & images never leave the device
 * - Zero third-party transmissions
 */

let faceapiModule: typeof import('@vladmandic/face-api') | null = null;
let modelsLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

export async function getFaceApi() {
  if (!faceapiModule) {
    faceapiModule = await import('@vladmandic/face-api');
  }
  return faceapiModule;
}

export async function loadFaceModels(onProgress?: (progress: number, label: string) => void): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    const faceapi = await getFaceApi();
    const MODEL_URL = '/models';

    if (onProgress) onProgress(0.2, 'Loading face detector weights...');
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

    if (onProgress) onProgress(0.6, 'Loading landmark points...');
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

    if (onProgress) onProgress(0.9, 'Loading recognition descriptors...');
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

    if (onProgress) onProgress(1.0, 'Models loaded and initialized.');
    modelsLoaded = true;
  })();

  return modelLoadingPromise;
}

export interface DetectionResult {
  descriptor: number[];
  landmarks: {
    nose: { x: number; y: number }[];
    leftEye: { x: number; y: number }[];
    rightEye: { x: number; y: number }[];
    jawOutline: { x: number; y: number }[];
  };
  detectionBox: { x: number; y: number; width: number; height: number };
  score: number;
}

/**
 * Detect face and extract 128-d descriptor on the client hardware
 */
export async function detectSingleFaceDescriptor(
  videoElement: HTMLVideoElement
): Promise<DetectionResult | null> {
  const faceapi = await getFaceApi();
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  // Use SSD MobileNet for accurate landmark geometry and descriptor computation
  const detection = await faceapi
    .detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  return {
    descriptor: Array.from(detection.descriptor),
    landmarks: {
      nose: detection.landmarks.getNose(),
      leftEye: detection.landmarks.getLeftEye(),
      rightEye: detection.landmarks.getRightEye(),
      jawOutline: detection.landmarks.getJawOutline(),
    },
    detectionBox: {
      x: detection.detection.box.x,
      y: detection.detection.box.y,
      width: detection.detection.box.width,
      height: detection.detection.box.height,
    },
    score: detection.detection.score,
  };
}

/**
 * Eye Aspect Ratio (EAR) calculation for Blink Liveness Check
 * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 */
export function calculateEyeAspectRatio(eyePoints: { x: number; y: number }[]): number {
  if (!eyePoints || eyePoints.length < 6) return 0.3;

  const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
    Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

  const vertical1 = dist(eyePoints[1], eyePoints[5]);
  const vertical2 = dist(eyePoints[2], eyePoints[4]);
  const horizontal = dist(eyePoints[0], eyePoints[3]);

  if (horizontal === 0) return 0.3;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

/**
 * Calculate Face Yaw Angle ratio for Head Turn Liveness Check
 * Compares distance from nose tip to left jaw edge vs right jaw edge
 */
export function calculateHeadYawRatio(landmarks: DetectionResult['landmarks']): number {
  if (!landmarks?.nose?.length || !landmarks?.jawOutline?.length) return 1.0;

  const noseTip = landmarks.nose[landmarks.nose.length - 1]; // bottom of nose
  const leftJaw = landmarks.jawOutline[0]; // leftmost jaw point
  const rightJaw = landmarks.jawOutline[landmarks.jawOutline.length - 1]; // rightmost jaw point

  const distToLeft = Math.abs(noseTip.x - leftJaw.x);
  const distToRight = Math.abs(noseTip.x - rightJaw.x);

  if (distToRight === 0) return 1.0;
  return distToLeft / distToRight;
}

export type LivenessChallengeType = 'blink' | 'turn_left' | 'turn_right';

export interface LivenessProof {
  passed: boolean;
  challenge: LivenessChallengeType;
  confidence: number;
  delta: number;
}
