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

    scale: number;

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
    const rightEyeOuter = landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER];
    const leftEyeBottom = landmarks[LANDMARK_INDICES.LEFT_EYE_BOTTOM];
    const rightEyeBottom = landmarks[LANDMARK_INDICES.RIGHT_EYE_BOTTOM];
    const leftEyebrowOuter = landmarks[LANDMARK_INDICES.LEFT_EYEBROW_OUTER];
    const rightEyebrowOuter = landmarks[LANDMARK_INDICES.RIGHT_EYEBROW_OUTER];
    const leftEyebrowTop = landmarks[LANDMARK_INDICES.LEFT_EYEBROW_TOP];
    const rightEyebrowTop = landmarks[LANDMARK_INDICES.RIGHT_EYEBROW_TOP];
    const noseBottom = landmarks[LANDMARK_INDICES.NOSE_BOTTOM];
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

    const centerX = (leftCheek.x + rightCheek.x) / 2;
    const centerY = (foreheadTop.y + chinBottom.y) / 2;

    const eyeDeltaX = rightEyeOuter.x - leftEyeOuter.x;
    const eyeDeltaY = rightEyeOuter.y - leftEyeOuter.y;
    const rotation = Math.atan2(eyeDeltaY, eyeDeltaX);

    const scale = faceWidth / 0.35;

    const eyesMinX = Math.min(leftEyeOuter.x, leftEyebrowOuter.x);
    const eyesMaxX = Math.max(rightEyeOuter.x, rightEyebrowOuter.x);
    const eyesMinY = Math.min(leftEyebrowTop.y, rightEyebrowTop.y);
    const eyesMaxY = Math.max(leftEyeBottom.y, rightEyeBottom.y);
    const eyesWidth = eyesMaxX - eyesMinX;
    const eyesHeight = eyesMaxY - eyesMinY;
    const eyesCenterX = (eyesMinX + eyesMaxX) / 2;
    const eyesCenterY = (eyesMinY + eyesMaxY) / 2;

    // Forehead region: from top of head to eyebrows
    const foreheadMinY = foreheadTop.y;
    const foreheadMaxY = Math.min(leftEyebrowTop.y, rightEyebrowTop.y);
    const foreheadWidth = faceWidth * 0.9;
    const foreheadHeight = foreheadMaxY - foreheadMinY;
    const foreheadCenterX = centerX;
    const foreheadCenterY = (foreheadMinY + foreheadMaxY) / 2;

    // Nose region
    const noseMinX = Math.min(noseLeft.x, noseRight.x);
    const noseMaxX = Math.max(noseLeft.x, noseRight.x);
    const noseMinY = noseBridge.y;
    const noseMaxY = noseBottom.y;
    const noseWidth = noseMaxX - noseMinX;
    const noseHeight = noseMaxY - noseMinY;
    const noseCenterX = (noseMinX + noseMaxX) / 2;
    const noseCenterY = (noseMinY + noseMaxY) / 2;

    // Mouth region
    const mouthMinX = mouthLeft.x;
    const mouthMaxX = mouthRight.x;
    const mouthMinY = mouthTop.y;
    const mouthMaxY = mouthBottom.y;
    const mouthWidth = mouthMaxX - mouthMinX;
    const mouthHeight = mouthMaxY - mouthMinY;
    const mouthCenterX = (mouthMinX + mouthMaxX) / 2;
    const mouthCenterY = (mouthMinY + mouthMaxY) / 2;

    // Convert all to pixel coordinates with padding for full face overlay
    const padding = 0.15;
    const x = (centerX - faceWidth / 2 - padding * faceWidth) * videoWidth;
    const y = (centerY - faceHeight / 2 - padding * faceHeight) * videoHeight;
    const width = faceWidth * (1 + padding * 2) * videoWidth;
    const height = faceHeight * (1 + padding * 2) * videoHeight;

    return {
        x,
        y,
        width,
        height,
        centerX: centerX * videoWidth,
        centerY: centerY * videoHeight,
        rotation,
        scale,
        // Add stable dimensions based on Euclidean distance (rotation-invariant)
        stableWidth: faceWidth * videoWidth,
        stableHeight: faceHeight * videoHeight,
        regions: {
            eyes: {
                x: eyesMinX * videoWidth,
                y: eyesMinY * videoHeight,
                width: eyesWidth * videoWidth,
                height: eyesHeight * videoHeight,
                centerX: eyesCenterX * videoWidth,
                centerY: eyesCenterY * videoHeight,
            },
            forehead: {
                x: (foreheadCenterX - foreheadWidth / 2) * videoWidth,
                y: foreheadMinY * videoHeight,
                width: foreheadWidth * videoWidth,
                height: foreheadHeight * videoHeight,
                centerX: foreheadCenterX * videoWidth,
                centerY: foreheadCenterY * videoHeight,
            },
            nose: {
                x: noseMinX * videoWidth,
                y: noseMinY * videoHeight,
                width: noseWidth * videoWidth,
                height: noseHeight * videoHeight,
                centerX: noseCenterX * videoWidth,
                centerY: noseCenterY * videoHeight,
            },
            mouth: {
                x: mouthMinX * videoWidth,
                y: mouthMinY * videoHeight,
                width: mouthWidth * videoWidth,
                height: mouthHeight * videoHeight,
                centerX: mouthCenterX * videoWidth,
                centerY: mouthCenterY * videoHeight,
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
                        setFaces(faceDataArray);
                    } else {
                        setFaces([]);
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
