import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { LAYOUTS, FILTERS, STRIP_W, STRIP_H, STRIP_PAD, STRIP_PHOTO_W, STRIP_PHOTO_H, STRIP_GAP } from "@/lib/constants";
import type { FrameItem } from "./useBoothSettings";

interface UseCaptureOptions {
    selectedLayout: typeof LAYOUTS[number];
    selectedFilter: typeof FILTERS[number];
    selectedFrame: FrameItem;
    onCaptureComplete: () => void;
}

export function useCapture({ selectedLayout, selectedFilter, selectedFrame, onCaptureComplete }: UseCaptureOptions) {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedSequence, setCapturedSequence] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [currentShotIndex, setCurrentShotIndex] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);

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

    const takeSingleSnapshot = () => {
        const attempt = (retriesLeft: number) => {
            const webcam = webcamRef.current;
            if (!webcam) {
                setIsCapturing(false);
                setCountdown(null);
                return;
            }

            const imageSrc = webcam.getScreenshot();

            if (!imageSrc) {
                if (retriesLeft > 0) {
                    setTimeout(() => attempt(retriesLeft - 1), 150);
                    return;
                }
                // If we still can't grab a frame, stop the session gracefully
                // so the UI doesn't get stuck.
                setIsCapturing(false);
                setCountdown(null);
                return;
            }

            setCapturedSequence(prev => {
                const newSequence = [...prev, imageSrc];
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

        // Retry a few times in case the webcam frame isn't ready exactly
        // when the countdown hits zero.
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

        const drawPhotos = (images: HTMLImageElement[]) => {
            ctx.filter = selectedFilter.value !== "none" ? selectedFilter.value : "none";
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
                ctx.translate(dx + dw, dy);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0, dw, dh);
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
