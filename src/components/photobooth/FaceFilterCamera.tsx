"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { useFaceDetection, FaceData, FilterPlacement, getRegionForPlacement } from "@/hooks/useFaceDetection";

interface FaceFilterCameraProps {
    filterValue?: string;
    filterImage?: string; // URL or path to the PNG sticker
    filterScale?: number; // Additional scale multiplier (default 1)
    filterOffsetY?: number; // Vertical offset in pixels (positive = down)
    filterOffsetX?: number; // Horizontal offset in pixels (positive = right)
    filterPlacement?: FilterPlacement; // Where to anchor the filter (default "full-face")
    isCapturing?: boolean;
    shotsTotal?: number;
    currentShotIndex?: number;
    capturedCount?: number;
    countdown?: number | null;
    onFilterReady?: () => void;
    showDebugOverlay?: boolean;
}

export interface FaceFilterCameraHandle {
    getScreenshot: () => string | null;
    getScreenshotWithFilter: () => Promise<string | null>;
    getVideoElement: () => HTMLVideoElement | null;
}

const FaceFilterCamera = forwardRef<FaceFilterCameraHandle, FaceFilterCameraProps>(({
    filterValue = "none",
    filterImage,
    filterScale = 1,
    filterOffsetY = 0,
    filterOffsetX = 0,
    filterPlacement = "full-face",
    isCapturing = false,
    shotsTotal = 1,
    currentShotIndex = 0,
    capturedCount = 0,
    countdown = null,
    onFilterReady,
    showDebugOverlay = false,
}, ref) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const filterImageRef = useRef<HTMLImageElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [filterLoaded, setFilterLoaded] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 640, height: 480 });
    const containerRef = useRef<HTMLDivElement>(null);

    const { faces, isLoading, isReady, error, startDetection, stopDetection } = useFaceDetection({
        maxFaces: 4,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    // Load filter image
    useEffect(() => {
        if (!filterImage) {
            setFilterLoaded(false);
            filterImageRef.current = null;
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            filterImageRef.current = img;
            setFilterLoaded(true);
            onFilterReady?.();
        };
        img.onerror = () => {
            console.error("Failed to load filter image:", filterImage);
            setFilterLoaded(false);
        };
        img.src = filterImage;
    }, [filterImage, onFilterReady]);

    // Track container size for responsive canvas
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.height });
            }
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // Start face detection when webcam is ready
    useEffect(() => {
        if (!isReady) return;

        const checkWebcam = setInterval(() => {
            const video = webcamRef.current?.video;
            if (video && video.readyState >= 2) {
                startDetection(video);
                clearInterval(checkWebcam);
            }
        }, 100);

        return () => {
            clearInterval(checkWebcam);
            stopDetection();
        };
    }, [isReady, startDetection, stopDetection]);

    // Animation loop to draw filter overlay
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (faces.length > 0 && filterLoaded && filterImageRef.current) {
                const video = webcamRef.current?.video;
                if (!video) return;

                // Scale factors from video to canvas
                const scaleX = canvas.width / video.videoWidth;
                const scaleY = canvas.height / video.videoHeight;

                faces.forEach((face: FaceData) => {
                    const img = filterImageRef.current!;

                    // Get the appropriate region based on filter placement
                    const region = getRegionForPlacement(face, filterPlacement);

                    // Calculate mirrored position so overlay matches mirrored preview
                    const centerX = canvas.width - (region.centerX * scaleX);
                    const centerY = region.centerY * scaleY;

                    // Calculate size based on STABLE face dimensions (rotation-invariant)
                    // Use stableWidth/stableHeight instead of width/height to prevent size changes during rotation
                    const faceWidth = face.stableWidth * scaleX * filterScale;
                    const faceHeight = face.stableHeight * scaleY * filterScale;

                    // Maintain aspect ratio of the filter image
                    const imgAspect = img.width / img.height;
                    const faceAspect = faceWidth / faceHeight;

                    let drawWidth: number;
                    let drawHeight: number;

                    if (imgAspect > faceAspect) {
                        // Image is wider than face, fit to width
                        drawWidth = faceWidth * 1.2; // Slightly larger for full coverage
                        drawHeight = drawWidth / imgAspect;
                    } else {
                        // Image is taller than face, fit to height
                        drawHeight = faceHeight * 1.2;
                        drawWidth = drawHeight * imgAspect;
                    }

                    // Draw with rotation - offset applied AFTER rotation so it follows face tilt
                    ctx.save();
                    // 1. Translate to mirrored face center
                    ctx.translate(centerX, centerY);
                    // 2. Apply rotation inverted to account for mirror
                    ctx.rotate(-face.rotation);
                    // 3. Apply offset in rotated coordinate space (so offset follows face tilt)
                    ctx.translate(-filterOffsetX, filterOffsetY);
                    // 4. Draw image centered at this point
                    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
                    ctx.restore();

                    // Debug overlay
                    if (showDebugOverlay) {
                        const debugX = centerX - filterOffsetX - drawWidth / 2;
                        const debugY = centerY + filterOffsetY - drawHeight / 2;
                        ctx.strokeStyle = "#FF6B8B";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(debugX, debugY, drawWidth, drawHeight);

                        ctx.fillStyle = "#FF6B8B";
                        ctx.font = "12px monospace";
                        ctx.fillText(`Rotation: ${(face.rotation * 180 / Math.PI).toFixed(1)}°`, debugX, debugY - 5);
                    }
                });
            }

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [faces, filterLoaded, filterScale, filterOffsetX, filterOffsetY, filterPlacement, showDebugOverlay]);

    // Get screenshot with filter overlay
    const getScreenshotWithFilter = useCallback(async (): Promise<string | null> => {
        const video = webcamRef.current?.video;
        const filterCanvas = canvasRef.current;
        if (!video || !filterCanvas) return null;

        // Create a combined canvas
        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = video.videoWidth;
        outputCanvas.height = video.videoHeight;
        const ctx = outputCanvas.getContext("2d");
        if (!ctx) return null;

        // Draw mirrored video so capture matches mirrored lens
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight);
        ctx.restore();

        // Apply CSS filter if any
        if (filterValue && filterValue !== "none") {
            ctx.filter = filterValue;
            ctx.drawImage(outputCanvas, 0, 0);
            ctx.filter = "none";
        }

        // Draw filter overlay (scaled to match video dimensions)
        if (filterLoaded && filterImageRef.current && faces.length > 0) {
            faces.forEach((face: FaceData) => {
                const img = filterImageRef.current!;

                // Get the appropriate region based on filter placement
                const region = getRegionForPlacement(face, filterPlacement);

                // Mirror coordinates so overlay matches mirrored output
                const centerX = video.videoWidth - region.centerX;
                const centerY = region.centerY;

                // Use stable dimensions for rotation-invariant sizing
                const faceWidth = face.stableWidth * filterScale;
                const faceHeight = face.stableHeight * filterScale;

                const imgAspect = img.width / img.height;
                const faceAspect = faceWidth / faceHeight;

                let drawWidth: number;
                let drawHeight: number;

                if (imgAspect > faceAspect) {
                    drawWidth = faceWidth * 1.2;
                    drawHeight = drawWidth / imgAspect;
                } else {
                    drawHeight = faceHeight * 1.2;
                    drawWidth = drawHeight * imgAspect;
                }

                // Draw with rotation - offset applied AFTER rotation so it follows face tilt
                ctx.save();
                // 1. Translate to mirrored face center
                ctx.translate(centerX, centerY);
                // 2. Apply rotation inverted for mirror
                ctx.rotate(-face.rotation);
                // 3. Apply offset in rotated coordinate space
                ctx.translate(-filterOffsetX, filterOffsetY);
                // 4. Draw image centered at this point
                ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
                ctx.restore();
            });
        }

        return outputCanvas.toDataURL("image/png");
    }, [faces, filterLoaded, filterValue, filterScale, filterOffsetX, filterOffsetY, filterPlacement]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        getScreenshot: () => webcamRef.current?.getScreenshot() || null,
        getScreenshotWithFilter,
        getVideoElement: () => webcamRef.current?.video || null,
    }), [getScreenshotWithFilter]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative flex w-full justify-center px-4 sm:px-6 md:px-0"
        >
            {/* Gradient border — glows while capturing */}
            <motion.div
                className="p-[3px] rounded-[22px] w-full md:max-w-[640px] lg:max-w-[680px]"
                animate={{
                    boxShadow: isCapturing
                        ? "0 0 70px rgba(255,107,139,0.65), 0 20px 80px rgba(255,107,139,0.3)"
                        : "0 0 36px rgba(255,107,139,0.2), 0 12px 48px rgba(255,107,139,0.1)",
                }}
                transition={{ duration: 0.6 }}
                style={{ background: "linear-gradient(135deg, #FF6B8B 0%, #FFB3C6 40%, #FFD4A0 70%, #FF6B8B 100%)" }}
            >
                <div
                    ref={containerRef}
                    className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-zinc-900"
                >
                    {/* Webcam */}
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={800}
                        height={600}
                        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-0"
                        videoConstraints={{ width: 800, height: 600, facingMode: "user" }}
                        style={{ filter: filterValue !== "none" ? filterValue : "none" }}
                    />

                    {/* Face filter overlay canvas */}
                    <canvas
                        ref={canvasRef}
                        width={containerSize.width}
                        height={containerSize.height}
                        className="absolute inset-0 w-full h-full z-[1] pointer-events-none"
                    />

                    {/* Loading indicator */}
                    <AnimatePresence>
                        {isLoading && filterImage && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full"
                            >
                                <span className="text-white text-sm">Loading face filter...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error indicator */}
                    {error && (
                        <div className="absolute top-4 left-4 z-10 bg-red-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            <span className="text-white text-sm">{error}</span>
                        </div>
                    )}

                    {/* Face detection status */}
                    {filterImage && isReady && !isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full"
                        >
                            <span className={`text-sm ${faces.length > 0 ? "text-green-400" : "text-yellow-400"}`}>
                                {faces.length > 0
                                    ? `${faces.length} face${faces.length > 1 ? "s" : ""} detected`
                                    : "No face detected"}
                            </span>
                        </motion.div>
                    )}

                    {/* Lens vignette */}
                    <div className="absolute inset-0 z-[2] pointer-events-none rounded-[20px]" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)" }} />

                    {/* Scan line */}
                    <motion.div
                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent z-[3] pointer-events-none"
                        animate={{ top: ["0%", "100%"] }}
                        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                    />

                    {/* Shot progress dots */}
                    {shotsTotal > 1 && isCapturing && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full"
                        >
                            <span className="text-white text-sm font-medium mr-2">
                                Shot {Math.min(currentShotIndex + 1, shotsTotal)}/{shotsTotal}
                            </span>
                            {Array.from({ length: shotsTotal }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={i === currentShotIndex && countdown !== null ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : { scale: 1 }}
                                    transition={{ repeat: Infinity, duration: 0.7 }}
                                    className={`w-3 h-3 rounded-full ${
                                        i < capturedCount ? "bg-accent" :
                                        i === currentShotIndex && countdown !== null ? "bg-white" :
                                        "bg-white/30"
                                    }`}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Countdown */}
                    <AnimatePresence mode="popLayout">
                        {countdown !== null && countdown > 0 && (
                            <motion.div
                                key={countdown}
                                initial={{ opacity: 0, scale: 0.3, rotate: -15 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 1.8, rotate: 10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                            >
                                <span className="text-9xl font-display font-bold text-white drop-shadow-2xl select-none">{countdown}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Flash */}
                    <AnimatePresence>
                        {countdown === 0 && (
                            <motion.div
                                key={`flash-${currentShotIndex}`}
                                initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.55 }}
                                className="absolute inset-0 bg-white z-30 pointer-events-none"
                            />
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* L-bracket corner accents */}
            {[
                { pos: "top-[-4px] left-[-4px]",    h: "top-0 left-0",    v: "top-0 left-0"    },
                { pos: "top-[-4px] right-[-4px]",   h: "top-0 right-0",   v: "top-0 right-0"   },
                { pos: "bottom-[-4px] left-[-4px]",  h: "bottom-0 left-0",  v: "bottom-0 left-0"  },
                { pos: "bottom-[-4px] right-[-4px]", h: "bottom-0 right-0", v: "bottom-0 right-0" },
            ].map(({ pos, h, v }, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 * i, duration: 0.45, ease: "backOut" }} className={`absolute ${pos} w-5 h-5`}>
                    <div className={`absolute ${h} rounded-full bg-accent shadow-md shadow-accent/60`} style={{ width: 20, height: 3 }} />
                    <div className={`absolute ${v} rounded-full bg-accent shadow-md shadow-accent/60`} style={{ width: 3, height: 20 }} />
                </motion.div>
            ))}
        </motion.div>
    );
});

FaceFilterCamera.displayName = "FaceFilterCamera";

export default FaceFilterCamera;
