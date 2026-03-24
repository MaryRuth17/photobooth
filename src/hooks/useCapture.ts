import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { LAYOUTS, FILTERS, STRIP_W, STRIP_H, STRIP_PAD, STRIP_PHOTO_W, STRIP_PHOTO_H, STRIP_GAP } from "@/lib/constants";
import { FaceFilter } from "@/lib/faceFilters";
import type { FrameItem } from "./useBoothSettings";
import type { FaceFilterCameraHandle } from "@/components/photobooth/FaceFilterCamera";

interface UseCaptureOptions {
    selectedLayout: typeof LAYOUTS[number];
    selectedFilter: typeof FILTERS[number];
    selectedFrame: FrameItem;
    selectedFaceFilter?: FaceFilter;
    onCaptureComplete: () => void;
}

export function useCapture({ selectedLayout, selectedFilter, selectedFrame, selectedFaceFilter, onCaptureComplete }: UseCaptureOptions) {
    const webcamRef = useRef<Webcam>(null);
    const faceFilterCameraRef = useRef<FaceFilterCameraHandle>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedSequence, setCapturedSequence] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [currentShotIndex, setCurrentShotIndex] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);

    // Track if we're using face filter
    const useFaceFilter = selectedFaceFilter && selectedFaceFilter.id !== "none";

    const captureSequence = useCallback(() => {
        setCapturedSequence([]);
        setCurrentShotIndex(0);
        setIsCapturing(true);
        setCountdown(3);
    }, []);

    const cancelSession = useCallback(() => {
        setIsCapturing(false);
        setCountdown(null);
        setCapturedSequence([]);
        setCurrentShotIndex(0);
    }, []);

    const resetCapture = useCallback(() => {
        setCapturedImage(null);
        setCapturedSequence([]);
        setCurrentShotIndex(0);
    }, []);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            takeSingleSnapshot();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    const takeSingleSnapshot = async () => {
        const attempt = async (retriesLeft: number) => {
            let imageSrc: string | null = null;

            // Try face filter camera first if available and active
            if (useFaceFilter && faceFilterCameraRef.current) {
                imageSrc = await faceFilterCameraRef.current.getScreenshotWithFilter();
            }

            // Fall back to regular webcam
            if (!imageSrc && webcamRef.current) {
                imageSrc = webcamRef.current.getScreenshot();
            }

            if (!imageSrc) {
                if (retriesLeft > 0) {
                    setTimeout(() => attempt(retriesLeft - 1), 150);
                    return;
                }
                setIsCapturing(false);
                setCountdown(null);
                return;
            }

            setCapturedSequence(prev => {
                const newSequence = [...prev, imageSrc!];
                if (newSequence.length < selectedLayout.shots) {
                    setTimeout(() => {
                        setCurrentShotIndex(newSequence.length);
                        setCountdown(3);
                    }, 800);
                } else {
                    setCountdown(null);
                    setIsCapturing(false);
                    generateComposite(newSequence);
                }
                return newSequence;
            });
        };

        attempt(3);
    };

    const generateComposite = (sequence: string[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const canvasWidth = selectedLayout.id === "strip" ? STRIP_W : 800;
        const canvasHeight = selectedLayout.id === "strip" ? STRIP_H : 700;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const loadImages = sequence.map(src =>
            new Promise<HTMLImageElement>(resolve => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
            })
        );

        const drawImageCover = (
            image: HTMLImageElement,
            dx: number,
            dy: number,
            dw: number,
            dh: number
        ) => {
            const sourceRatio = image.naturalWidth / image.naturalHeight;
            const targetRatio = dw / dh;

            let sx = 0;
            let sy = 0;
            let sw = image.naturalWidth;
            let sh = image.naturalHeight;

            if (sourceRatio > targetRatio) {
                sw = sh * targetRatio;
                sx = (image.naturalWidth - sw) / 2;
            } else {
                sh = sw / targetRatio;
                sy = (image.naturalHeight - sh) / 2;
            }

            ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
        };

        const drawPhotos = (images: HTMLImageElement[]) => {
            // Only apply CSS filter if NOT using face filter (face filter already has it baked in)
            const shouldApplyFilter = !useFaceFilter && selectedFilter.value !== "none";
            ctx.filter = shouldApplyFilter ? selectedFilter.value : "none";

            images.forEach((img, index) => {
                let dx: number, dy: number, dw: number, dh: number;
                if (selectedLayout.id === "strip") {
                    dx = STRIP_PAD;
                    dy = STRIP_PAD + index * (STRIP_PHOTO_H + STRIP_GAP);
                    dw = STRIP_PHOTO_W;
                    dh = STRIP_PHOTO_H;
                } else if (selectedLayout.id === "grid") {
                    const padX = 22, padY = 22, gapX = 14, gapY = 14;
                    dw = (800 - padX * 2 - gapX) / 2;
                    dh = (600 - padY * 2 - gapY) / 2;
                    dx = padX + (index % 2) * (dw + gapX);
                    dy = padY + Math.floor(index / 2) * (dh + gapY);
                } else {
                    dx = 20; dy = 20; dw = 760; dh = 560;
                }
                ctx.save();
                // If using face filter, image is already mirrored, don't flip again
                if (useFaceFilter) {
                    drawImageCover(img, dx, dy, dw, dh);
                } else {
                    ctx.translate(dx + dw, dy);
                    ctx.scale(-1, 1);
                    drawImageCover(img, 0, 0, dw, dh);
                }
                ctx.restore();
            });
            ctx.filter = "none";
        };

        Promise.all(loadImages).then(images => {
            const finish = (dataUrl: string) => {
                setCapturedImage(dataUrl);
                onCaptureComplete();
            };

            if (!selectedFrame.url) {
                drawPhotos(images);
                finish(canvas.toDataURL("image/png"));
                return;
            }

            const frameImg = new Image();
            frameImg.src = selectedFrame.url;
            frameImg.onload = () => {
                if (selectedLayout.id === "strip") {
                    ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
                    drawPhotos(images);
                } else {
                    drawPhotos(images);
                    ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
                }
                finish(canvas.toDataURL("image/png"));
            };
        });
    };

    return {
        webcamRef,
        faceFilterCameraRef,
        canvasRef,
        capturedImage,
        capturedSequence,
        countdown,
        currentShotIndex,
        isCapturing,
        captureSequence,
        cancelSession,
        resetCapture,
    };
}
