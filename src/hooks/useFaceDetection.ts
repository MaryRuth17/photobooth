"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

// Filter placement types - each targets a specific face region
export type FilterPlacement = "full-face" | "eyes" | "forehead" | "nose" | "mouth";

export interface FaceData {
    x: number;        // Top-left X position
    y: number;        // Top-left Y position
    width: number;    // Width in pixels (bounding box)
    height: number;   // Height in pixels (bounding box)

    // Center point of the face (for positioning filters)
    centerX: number;  // Horizontal center (used for filter anchoring)
    centerY: number;  // Vertical center

    rotation: number;

    // In-plane roll (same as rotation, exposed for clarity)
    roll: number;

    // Head pose angles (radians)
    yaw: number;   // Left/right turning
    pitch: number; // Up/down nodding

    scale: number;

    // Depth-aware size multiplier derived from landmark z-values
    depthScale: number;

    // Stable dimensions based on Euclidean distance (rotation-invariant)
    stableWidth: number;   // Distance between cheeks (doesn't change with rotation)
    stableHeight: number;  // Distance from forehead to chin (doesn't change with rotation)

    regions: {
        eyes: { x: number; y: number; width: number; height: number; centerX: number; centerY: number };
        forehead: { x: number; y: number; width: number; height: number; centerX: number; centerY: number };
        nose: { x: number; y: number; width: number; height: number; centerX: number; centerY: number };
        mouth: { x: number; y: number; width: number; height: number; centerX: number; centerY: number };
    };
    landmarks: { x: number; y: number; z: number }[];
}

interface UseFaceDetectionOptions {
    maxFaces?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
}

interface UseFaceDetectionReturn {
    faces: FaceData[];
    isLoading: boolean;
    isReady: boolean;
    error: string | null;
    startDetection: (videoElement: HTMLVideoElement) => void;
    stopDetection: () => void;
}


const LANDMARK_INDICES = {
    // Face boundaries (used for full-face bounding box)
    FOREHEAD_TOP: 10,      // Hairline/top of head
    CHIN_BOTTOM: 152,      // Lowest point of chin
    LEFT_CHEEK: 234,       // Left edge of face
    RIGHT_CHEEK: 454,      // Right edge of face

    // Eyes (used for eye region and rotation calculation)
    LEFT_EYE_OUTER: 33,    // Left eye outer corner (near temple)
    LEFT_EYE_INNER: 133,   // Left eye inner corner (near nose)
    LEFT_EYE_TOP: 159,     // Top of left eyelid
    LEFT_EYE_BOTTOM: 145,  // Bottom of left eyelid
    RIGHT_EYE_OUTER: 263,  // Right eye outer corner (near temple)
    RIGHT_EYE_INNER: 362,  // Right eye inner corner (near nose)
    RIGHT_EYE_TOP: 386,    // Top of right eyelid
    RIGHT_EYE_BOTTOM: 374, // Bottom of right eyelid

    // Eyebrows (used for forehead region boundary)
    LEFT_EYEBROW_OUTER: 70,   // Left eyebrow outer edge
    LEFT_EYEBROW_INNER: 107,  // Left eyebrow inner edge
    LEFT_EYEBROW_TOP: 66,     // Highest point of left eyebrow
    RIGHT_EYEBROW_OUTER: 300, // Right eyebrow outer edge
    RIGHT_EYEBROW_INNER: 336, // Right eyebrow inner edge
    RIGHT_EYEBROW_TOP: 296,   // Highest point of right eyebrow

    // Nose (used for nose region)
    NOSE_TIP: 1,        // Very tip of the nose
    NOSE_BOTTOM: 2,     // Bottom of nose (above upper lip)
    NOSE_LEFT: 129,     // Left nostril
    NOSE_RIGHT: 358,    // Right nostril
    NOSE_BRIDGE: 6,     // Bridge between eyes (top of nose)

    // Mouth (used for mouth region)
    MOUTH_LEFT: 61,        // Left corner of mouth
    MOUTH_RIGHT: 291,      // Right corner of mouth
    MOUTH_TOP: 0,          // Top of upper lip
    MOUTH_BOTTOM: 17,      // Bottom of lower lip
    UPPER_LIP_TOP: 13,     // Peak of upper lip (Cupid's bow)
    LOWER_LIP_BOTTOM: 14,  // Lowest point of lower lip
};

function calculateFaceData(landmarks: { x: number; y: number; z: number }[], videoWidth: number, videoHeight: number): FaceData {
    // Get key points (extracting specific landmarks by index)
    const foreheadTop = landmarks[LANDMARK_INDICES.FOREHEAD_TOP];
    const chinBottom = landmarks[LANDMARK_INDICES.CHIN_BOTTOM];
    const leftCheek = landmarks[LANDMARK_INDICES.LEFT_CHEEK];
    const rightCheek = landmarks[LANDMARK_INDICES.RIGHT_CHEEK];
    const leftEyeOuter = landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER];
    const leftEyeInner = landmarks[LANDMARK_INDICES.LEFT_EYE_INNER];
    const leftEyeTop = landmarks[LANDMARK_INDICES.LEFT_EYE_TOP];
    const leftEyeBottom = landmarks[LANDMARK_INDICES.LEFT_EYE_BOTTOM];
    const rightEyeOuter = landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER];
    const rightEyeInner = landmarks[LANDMARK_INDICES.RIGHT_EYE_INNER];
    const rightEyeTop = landmarks[LANDMARK_INDICES.RIGHT_EYE_TOP];
    const rightEyeBottom = landmarks[LANDMARK_INDICES.RIGHT_EYE_BOTTOM];
    const leftEyebrowInner = landmarks[LANDMARK_INDICES.LEFT_EYEBROW_INNER];
    const rightEyebrowInner = landmarks[LANDMARK_INDICES.RIGHT_EYEBROW_INNER];
    const leftEyebrowOuter = landmarks[LANDMARK_INDICES.LEFT_EYEBROW_OUTER];
    const rightEyebrowOuter = landmarks[LANDMARK_INDICES.RIGHT_EYEBROW_OUTER];
    const leftEyebrowTop = landmarks[LANDMARK_INDICES.LEFT_EYEBROW_TOP];
    const rightEyebrowTop = landmarks[LANDMARK_INDICES.RIGHT_EYEBROW_TOP];
    const noseBottom = landmarks[LANDMARK_INDICES.NOSE_BOTTOM];
    const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
    const noseLeft = landmarks[LANDMARK_INDICES.NOSE_LEFT];
    const noseRight = landmarks[LANDMARK_INDICES.NOSE_RIGHT];
    const noseBridge = landmarks[LANDMARK_INDICES.NOSE_BRIDGE];
    const mouthLeft = landmarks[LANDMARK_INDICES.MOUTH_LEFT];
    const mouthRight = landmarks[LANDMARK_INDICES.MOUTH_RIGHT];
    const mouthTop = landmarks[LANDMARK_INDICES.MOUTH_TOP];
    const mouthBottom = landmarks[LANDMARK_INDICES.MOUTH_BOTTOM];

    const faceWidth = Math.sqrt(
        Math.pow(rightCheek.x - leftCheek.x, 2) +
        Math.pow(rightCheek.y - leftCheek.y, 2)
    );
    const faceHeight = Math.sqrt(
        Math.pow(chinBottom.x - foreheadTop.x, 2) +
        Math.pow(chinBottom.y - foreheadTop.y, 2)
    );

    const avgZ = landmarks.reduce((sum, lm) => sum + lm.z, 0) / landmarks.length;

    const centerX = (leftCheek.x + rightCheek.x) / 2;
    const centerY = (foreheadTop.y + chinBottom.y) / 2;

    // Use both inner/outer + top/bottom eye landmarks for a stable roll estimate
    const leftEyeCenter = {
        x: (leftEyeOuter.x + leftEyeInner.x + leftEyeTop.x + leftEyeBottom.x) / 4,
        y: (leftEyeOuter.y + leftEyeInner.y + leftEyeTop.y + leftEyeBottom.y) / 4,
    };
    const rightEyeCenter = {
        x: (rightEyeOuter.x + rightEyeInner.x + rightEyeTop.x + rightEyeBottom.x) / 4,
        y: (rightEyeOuter.y + rightEyeInner.y + rightEyeTop.y + rightEyeBottom.y) / 4,
    };
    const roll = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x);

    // Approximate head pose using landmark depth
    const yaw = Math.atan2((rightCheek.z ?? 0) - (leftCheek.z ?? 0), rightCheek.x - leftCheek.x);
    const pitch = Math.atan2((noseTip.z ?? 0) - (foreheadTop.z ?? 0), Math.max(1e-5, chinBottom.y - foreheadTop.y));

    const cosYaw = Math.max(0.35, Math.abs(Math.cos(yaw)));
    const cosPitch = Math.max(0.35, Math.abs(Math.cos(pitch)));

    // Nudge center toward the nose so overlays stick when yawing/tilting (reduced to avoid over-shoot)
    const yawShift = (noseTip.x - centerX) * 0.16;
    const pitchShift = (noseTip.y - centerY) * 0.07;
    const centerXAdjusted = centerX + yawShift;
    const centerYAdjusted = centerY + pitchShift;

    const scale = (faceWidth / cosYaw) / 0.35;

    const distance2D = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y);
    const averagePoint = (points: { x: number; y: number }[]) => ({
        x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
        y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    });

    const eyesAnchorPoints = [leftEyeOuter, leftEyeInner, leftEyeTop, leftEyeBottom, rightEyeOuter, rightEyeInner, rightEyeTop, rightEyeBottom];
    const eyesCenterBase = averagePoint(eyesAnchorPoints);
    const eyesCenter = {
        x: eyesCenterBase.x + yawShift,
        y: eyesCenterBase.y + pitchShift,
    };
    const eyesWidth = distance2D(leftEyeOuter, rightEyeOuter);
    const eyesHeight = (distance2D(leftEyeTop, leftEyeBottom) + distance2D(rightEyeTop, rightEyeBottom)) / 2;

    const eyebrowPoints = [leftEyebrowOuter, leftEyebrowInner, leftEyebrowTop, rightEyebrowOuter, rightEyebrowInner, rightEyebrowTop];
    const eyebrowMidpoint = averagePoint(eyebrowPoints);
    const foreheadCenter = {
        x: (foreheadTop.x + eyebrowMidpoint.x) / 2 + yawShift,
        y: (foreheadTop.y + eyebrowMidpoint.y) / 2 + pitchShift,
    };
    const foreheadWidth = distance2D(leftEyebrowOuter, rightEyebrowOuter);
    const foreheadHeight = distance2D(foreheadTop, eyebrowMidpoint);

    const noseCenterBase = averagePoint([noseBridge, noseTip, noseBottom, noseLeft, noseRight]);
    const noseCenter = {
        x: noseCenterBase.x + yawShift,
        y: noseCenterBase.y + pitchShift,
    };
    const noseWidth = distance2D(noseLeft, noseRight);
    const noseHeight = distance2D(noseBridge, noseBottom);

    const mouthCenterBase = averagePoint([mouthLeft, mouthRight, mouthTop, mouthBottom]);
    const mouthCenter = {
        x: mouthCenterBase.x + yawShift,
        y: mouthCenterBase.y + pitchShift,
    };
    const mouthWidth = distance2D(mouthLeft, mouthRight);
    const mouthHeight = distance2D(mouthTop, mouthBottom);

    const depthScale = Math.min(1.8, Math.max(0.65, 1 + (-avgZ || 0) * 0.6));

    const widthStretch = 1 / cosYaw;
    const heightStretch = 1 / cosPitch;
    const foreheadWidthStretch = Math.min(widthStretch, 1.1);
    const foreheadHeightStretch = Math.min(heightStretch, 1.08);

    // Convert all to pixel coordinates with padding for full face overlay
    const padding = 0.15;
    const stableWidthNorm = faceWidth * widthStretch;
    const stableHeightNorm = faceHeight * heightStretch;
    const x = (centerXAdjusted - stableWidthNorm * (0.5 + padding)) * videoWidth;
    const y = (centerYAdjusted - stableHeightNorm * (0.5 + padding)) * videoHeight;
    const width = stableWidthNorm * (1 + padding * 2) * videoWidth;
    const height = stableHeightNorm * (1 + padding * 2) * videoHeight;

    return {
        x,
        y,
        width,
        height,
        centerX: centerXAdjusted * videoWidth,
        centerY: centerYAdjusted * videoHeight,
        rotation: roll,
        roll,
        yaw,
        pitch,
        scale,
        // Add stable dimensions based on Euclidean distance (rotation-invariant)
        stableWidth: stableWidthNorm * videoWidth,
        stableHeight: stableHeightNorm * videoHeight,
        depthScale,
        regions: {
            eyes: {
                x: (eyesCenter.x - (eyesWidth * widthStretch) / 2) * videoWidth,
                y: (eyesCenter.y - (eyesHeight * heightStretch) / 2) * videoHeight,
                width: eyesWidth * videoWidth * widthStretch,
                height: eyesHeight * videoHeight * heightStretch,
                centerX: eyesCenter.x * videoWidth,
                centerY: eyesCenter.y * videoHeight,
            },
            forehead: {
                x: (foreheadCenter.x - (foreheadWidth * foreheadWidthStretch) / 2) * videoWidth,
                y: (foreheadCenter.y - (foreheadHeight * foreheadHeightStretch) / 2) * videoHeight,
                width: foreheadWidth * videoWidth * foreheadWidthStretch,
                height: foreheadHeight * videoHeight * foreheadHeightStretch,
                centerX: foreheadCenter.x * videoWidth,
                centerY: foreheadCenter.y * videoHeight,
            },
            nose: {
                x: (noseCenter.x - (noseWidth * widthStretch) / 2) * videoWidth,
                y: (noseCenter.y - (noseHeight * heightStretch) / 2) * videoHeight,
                width: noseWidth * videoWidth * widthStretch,
                height: noseHeight * videoHeight * heightStretch,
                centerX: noseCenter.x * videoWidth,
                centerY: noseCenter.y * videoHeight,
            },
            mouth: {
                x: (mouthCenter.x - (mouthWidth * widthStretch) / 2) * videoWidth,
                y: (mouthCenter.y - (mouthHeight * heightStretch) / 2) * videoHeight,
                width: mouthWidth * videoWidth * widthStretch,
                height: mouthHeight * videoHeight * heightStretch,
                centerX: mouthCenter.x * videoWidth,
                centerY: mouthCenter.y * videoHeight,
            },
        },
        landmarks: landmarks,
    };
}

export function useFaceDetection(options: UseFaceDetectionOptions = {}): UseFaceDetectionReturn {
    const {
        maxFaces = 4,
        minDetectionConfidence = 0.5,
        minTrackingConfidence = 0.5,
    } = options;

    const [faces, setFaces] = useState<FaceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isRunningRef = useRef(false);
    const lastVideoTimeRef = useRef(-1);
    const previousFacesRef = useRef<FaceData[] | null>(null);

    // Initialize FaceLandmarker
    useEffect(() => {
        const initFaceLandmarker = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numFaces: maxFaces,
                    minFaceDetectionConfidence: minDetectionConfidence,
                    minTrackingConfidence: minTrackingConfidence,
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: false,
                });

                faceLandmarkerRef.current = faceLandmarker;
                setIsReady(true);
                setIsLoading(false);
            } catch (err) {
                console.error("FaceLandmarker initialization error:", err);
                setError(err instanceof Error ? err.message : "Failed to initialize face detection");
                setIsLoading(false);
            }
        };

        initFaceLandmarker();

        return () => {
            isRunningRef.current = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (faceLandmarkerRef.current) {
                faceLandmarkerRef.current.close();
            }
        };
    }, [maxFaces, minDetectionConfidence, minTrackingConfidence]);

    const startDetection = useCallback((videoElement: HTMLVideoElement) => {
        if (!faceLandmarkerRef.current || !isReady) {
            console.warn("FaceLandmarker not ready yet");
            return;
        }

        videoRef.current = videoElement;
        isRunningRef.current = true;
        lastVideoTimeRef.current = -1;

        // Frame processing loop
        const processFrame = () => {
            if (!isRunningRef.current || !faceLandmarkerRef.current || !videoRef.current) {
                return;
            }

            const video = videoRef.current;

            // Only process if video is ready and time has changed
            if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = video.currentTime;
                const startTimeMs = performance.now();

                try {
                    const results: FaceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

                    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                        const videoWidth = video.videoWidth;
                        const videoHeight = video.videoHeight;

                        const faceDataArray = results.faceLandmarks.map((landmarks) => {
                            // Convert NormalizedLandmark[] to our format
                            const formattedLandmarks = landmarks.map(lm => ({
                                x: lm.x,
                                y: lm.y,
                                z: lm.z || 0,
                            }));
                            return calculateFaceData(formattedLandmarks, videoWidth, videoHeight);
                        });
                        // Smooth tracking to avoid jumps while staying responsive when scaling/rotating
                        const smoothingPos = 0.45;
                        const smoothingScale = 0.6;
                        const smoothingRot = 0.5;
                        const mixPos = (a: number, b: number) => a + (b - a) * smoothingPos;
                        const mixScale = (a: number, b: number) => a + (b - a) * smoothingScale;
                        const mixRot = (a: number, b: number) => a + (b - a) * smoothingRot;

                        const smoothedFaces = faceDataArray.map((face, idx) => {
                            const prev = previousFacesRef.current?.[idx];
                            if (!prev) return face;

                            const smoothRegion = (curr: typeof face.regions.eyes, prevRegion: typeof face.regions.eyes) => ({
                                x: mixPos(prevRegion.x, curr.x),
                                y: mixPos(prevRegion.y, curr.y),
                                width: mixScale(prevRegion.width, curr.width),
                                height: mixScale(prevRegion.height, curr.height),
                                centerX: mixPos(prevRegion.centerX, curr.centerX),
                                centerY: mixPos(prevRegion.centerY, curr.centerY),
                            });

                            return {
                                ...face,
                                x: mixPos(prev.x, face.x),
                                y: mixPos(prev.y, face.y),
                                width: mixScale(prev.width, face.width),
                                height: mixScale(prev.height, face.height),
                                centerX: mixPos(prev.centerX, face.centerX),
                                centerY: mixPos(prev.centerY, face.centerY),
                                rotation: mixRot(prev.rotation, face.rotation),
                                yaw: mixRot(prev.yaw, face.yaw),
                                pitch: mixRot(prev.pitch, face.pitch),
                                roll: mixRot(prev.roll, face.roll),
                                scale: mixScale(prev.scale, face.scale),
                                depthScale: mixScale(prev.depthScale, face.depthScale),
                                stableWidth: mixScale(prev.stableWidth, face.stableWidth),
                                stableHeight: mixScale(prev.stableHeight, face.stableHeight),
                                regions: {
                                    eyes: smoothRegion(face.regions.eyes, prev.regions.eyes),
                                    forehead: smoothRegion(face.regions.forehead, prev.regions.forehead),
                                    nose: smoothRegion(face.regions.nose, prev.regions.nose),
                                    mouth: smoothRegion(face.regions.mouth, prev.regions.mouth),
                                },
                            };
                        });

                        previousFacesRef.current = smoothedFaces;
                        setFaces(smoothedFaces);
                    } else {
                        setFaces([]);
                        previousFacesRef.current = null;
                    }
                } catch (e) {
                    // Ignore detection errors during rapid state changes
                }
            }

            animationFrameRef.current = requestAnimationFrame(processFrame);
        };

        processFrame();
    }, [isReady]);

    const stopDetection = useCallback(() => {
        isRunningRef.current = false;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        previousFacesRef.current = null;
        setFaces([]);
    }, []);

    return {
        faces,
        isLoading,
        isReady,
        error,
        startDetection,
        stopDetection,
    };
}

// Helper function to get the appropriate region for a placement
export function getRegionForPlacement(face: FaceData, placement: FilterPlacement) {
    switch (placement) {
        case "eyes":
            return face.regions.eyes;
        case "forehead":
            return face.regions.forehead;
        case "nose":
            return face.regions.nose;
        case "mouth":
            return face.regions.mouth;
        case "full-face":
        default:
            return {
                x: face.x,
                y: face.y,
                width: face.width,
                height: face.height,
                centerX: face.centerX,
                centerY: face.centerY,
            };
    }
}
