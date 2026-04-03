"use client";

import {
    forwardRef,
    type ForwardedRef,
    type MutableRefObject,
    type RefObject,
    useEffect,
    useRef,
} from "react";
import type { FaceData, FilterPlacement } from "@/hooks/useFaceDetection";
import { renderFaceFrame } from "@/lib/propRenderer";

interface FaceFilterRendererProps {
    videoRef: RefObject<HTMLVideoElement | null>;
    faces: FaceData[];
    width: number;
    height: number;
    filterImage?: HTMLImageElement | null;
    filterPlacement?: FilterPlacement;
    filterScale?: number;
    filterOffsetX?: number;
    filterOffsetY?: number;
    showDebugOverlay?: boolean;
    className?: string;
}

function assignCanvasRef(
    ref: ForwardedRef<HTMLCanvasElement>,
    value: HTMLCanvasElement | null,
) {
    if (!ref) {
        return;
    }

    if (typeof ref === "function") {
        ref(value);
        return;
    }

    (ref as MutableRefObject<HTMLCanvasElement | null>).current = value;
}

const FaceFilterRenderer = forwardRef<HTMLCanvasElement, FaceFilterRendererProps>(({
    videoRef,
    faces,
    width,
    height,
    filterImage = null,
    filterPlacement = "full-face",
    filterScale = 1,
    filterOffsetX = 0,
    filterOffsetY = 0,
    showDebugOverlay = false,
    className = "absolute inset-0 w-full h-full z-[1] pointer-events-none",
}, forwardedRef) => {
    const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const facesRef = useRef<FaceData[]>(faces);
    const filterImageRef = useRef<HTMLImageElement | null>(filterImage);

    useEffect(() => {
        facesRef.current = faces;
    }, [faces]);

    useEffect(() => {
        filterImageRef.current = filterImage;
    }, [filterImage]);

    useEffect(() => {
        let animationFrameId: number;

        const draw = () => {
            const canvas = internalCanvasRef.current;
            const video = videoRef.current;

            if (!canvas) {
                animationFrameId = requestAnimationFrame(draw);
                return;
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                animationFrameId = requestAnimationFrame(draw);
                return;
            }

            if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                animationFrameId = requestAnimationFrame(draw);
                return;
            }

            renderFaceFrame({
                ctx,
                faces: facesRef.current,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                filterPlacement,
                filterScale,
                filterOffsetX,
                filterOffsetY,
                filterImage: filterImageRef.current,
                mirrorX: true,
                showDebugOverlay,
                clearCanvas: true,
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [
        videoRef,
        filterPlacement,
        filterScale,
        filterOffsetX,
        filterOffsetY,
        showDebugOverlay,
        width,
        height,
    ]);

    const setCanvasRef = (element: HTMLCanvasElement | null) => {
        internalCanvasRef.current = element;
        assignCanvasRef(forwardedRef, element);
    };

    return (
        <canvas
            ref={setCanvasRef}
            width={width}
            height={height}
            className={className}
        />
    );
});

FaceFilterRenderer.displayName = "FaceFilterRenderer";

export default FaceFilterRenderer;
