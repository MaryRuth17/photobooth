"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCcw, Camera, X, LayoutGrid, Sparkles, Image as ImageIcon } from "lucide-react";
import {
    FILTERS, FRAMES, GRID_FRAMES, STRIP_FRAMES, LAYOUTS,
    STRIP_W, STRIP_H, STRIP_PAD, STRIP_PHOTO_W, STRIP_PHOTO_H, STRIP_GAP,
} from "@/lib/constants";

const FILTER_COLORS: Record<string, string> = {
    none:      "#DCE5EA",
    grayscale: "#909090",
    rosy:      "#F4B8C8",
    soft:      "#FFF8DC",
    vintage:   "#C9A772",
    cool:      "#A8C8E8",
};

function CameraFeed({
    stream,
    filterCss,
    className = "",
}: {
    stream: MediaStream | null;
    filterCss?: string;
    className?: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !stream) return;
        if (el.srcObject !== stream) {
            el.srcObject = stream;
            el.play().catch(() => {});
        }
        return () => { el.srcObject = null; };
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`scale-x-[-1] ${className}`}
            style={{ filter: filterCss ?? undefined }}
        />
    );
}

function LayoutIconSvg({ id }: { id: string }) {
    if (id === "single") return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <rect x="1" y="1" width="16" height="16" rx="2.5" />
        </svg>
    );
    if (id === "grid") return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <rect x="1" y="1" width="7" height="7" rx="1.5" />
            <rect x="10" y="1" width="7" height="7" rx="1.5" />
            <rect x="1" y="10" width="7" height="7" rx="1.5" />
            <rect x="10" y="10" width="7" height="7" rx="1.5" />
        </svg>
    );
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <rect x="1"  y="1" width="4" height="16" rx="1.5" />
            <rect x="7"  y="1" width="4" height="16" rx="1.5" />
            <rect x="13" y="1" width="4" height="16" rx="1.5" />
        </svg>
    );
}

/* ─────────────────────────────────────────────────────────────────────
   Strips the opaque background rect from a frame SVG data URI so the
   camera feed shows through during the live overlay preview.
   The original (opaque) URL is still used for canvas compositing.
───────────────────────────────────────────────────────────────────── */
function toTransparentOverlay(url: string | null): string | null {
    if (!url) return null;
    const prefix = 'data:image/svg+xml;charset=utf-8,';
    if (!url.startsWith(prefix)) return url;
    const decoded = decodeURIComponent(url.slice(prefix.length));
    // Remove the first <rect> immediately after <svg …> — that is the mat background
    const transparent = decoded.replace(/(<svg[^>]*>)\s*<rect[^>]*\/>/, '$1');
    return prefix + encodeURIComponent(transparent);
}

export default function Photobooth() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
    const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);

    const getFramesForLayout = (layoutId: string) => {
        if (layoutId === "grid") return GRID_FRAMES;
        if (layoutId === "strip") return STRIP_FRAMES;
        return FRAMES;
    };

    const currentFrames = getFramesForLayout(selectedLayout.id);

    const handleLayoutChange = (layout: typeof LAYOUTS[number]) => {
        setSelectedLayout(layout);
        setSelectedFrame(getFramesForLayout(layout.id)[0]);
        setCapturedSequence([]);
        setCurrentShotIndex(0);
    };

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

    const handleCancel = () => {
        setIsCapturing(false);
        setCountdown(null);
        setCapturedSequence([]);
        setCurrentShotIndex(0);
    };

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
        const webcam = webcamRef.current;
        if (!webcam) return;
        const imageSrc = webcam.getScreenshot();

        if (imageSrc) {
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
        }
    };

    const generateComposite = (sequence: string[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let canvasWidth: number, canvasHeight: number;

        if (selectedLayout.id === "strip") {
            canvasWidth = STRIP_W;
            canvasHeight = STRIP_H;
        } else if (selectedLayout.id === "grid") {
            canvasWidth = 800;
            canvasHeight = 700; // includes 100px footer
        } else {
            canvasWidth = 800;
            canvasHeight = 700; // includes 100px footer
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const loadImages = sequence.map(src =>
            new Promise<HTMLImageElement>(resolve => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
            })
        );

        Promise.all(loadImages).then(images => {
            const drawPhotos = () => {
                ctx.filter = selectedFilter.value !== "none" ? selectedFilter.value : "none";

                images.forEach((img, index) => {
                    let dx: number, dy: number, dw: number, dh: number;

                    if (selectedLayout.id === "strip") {
                        dx = STRIP_PAD;
                        dy = STRIP_PAD + index * (STRIP_PHOTO_H + STRIP_GAP);
                        dw = STRIP_PHOTO_W;
                        dh = STRIP_PHOTO_H;
                    } else if (selectedLayout.id === "grid") {
                        // Grid: positions match SVG frame cell rects exactly
                        const padX = 25, padY = 25, gapX = 40, gapY = 20;
                        dw = (800 - padX * 2 - gapX) / 2; // 355
                        dh = (600 - padY * 2 - gapY) / 2; // 265
                        dx = padX + (index % 2) * (dw + gapX);
                        dy = padY + Math.floor(index / 2) * (dh + gapY);
                    } else {
                        // Single: full width with padding for frame
                        dx = 30; dy = 30;
                        dw = 740; dh = 520;
                    }

                    ctx.save();
                    // Mirror horizontally (webcam CSS scale-x-[-1] already flips preview)
                    ctx.translate(dx + dw, dy);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, 0, 0, dw, dh);
                    ctx.restore();
                });

                ctx.filter = "none";
                setCapturedImage(canvas.toDataURL("image/png"));
            };

            // Draw frame first (as decorative mat), then photos on top inside the cells
            if (selectedFrame.url) {
                const frameImg = new Image();
                frameImg.src = selectedFrame.url;
                frameImg.onload = () => {
                    ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
                    drawPhotos();
                };
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                drawPhotos();
            }
        });
    };

    const handleDownload = () => {
        if (!capturedImage) return;
        const a = document.createElement("a");
        a.href = capturedImage;
        a.download = "aura-photobooth.png";
        a.click();
    };

    /* â”€â”€â”€ Strip photo Y-position helper (mirrors the constant) â”€â”€â”€ */
    const stripPhotoY = (i: number) => STRIP_PAD + i * (STRIP_PHOTO_H + STRIP_GAP);

    const filterCss = selectedFilter.value !== "none" ? selectedFilter.value : undefined;

    return (
        <section
            id="booth"
            className="min-h-screen py-6 px-4 flex flex-col items-center overflow-x-hidden"
            style={{ backgroundColor: "#FFF0F3" }}
        >
            {/* â”€â”€ Header â”€â”€ */}
            <div className="text-center mb-5">
                <h2
                    className="font-display text-5xl font-bold mb-2"
                    style={{ color: "#3D1520" }}
                >
                    The Studio
                </h2>
                <p className="font-sans text-base" style={{ color: "#9B7280" }}>
                    Strike a pose. Customize. Save.
                </p>
            </div>

            {/* â”€â”€ Dashboard: Left | Camera | Right â”€â”€ */}
            <div className="flex items-start gap-4 w-full max-w-6xl">

                {/* â•â• LEFT COLUMN: Layout + Filters â•â• */}
                <div className="flex flex-col gap-4 shrink-0" style={{ width: 200 }}>

                    {/* Layout card */}
                    <div className="bg-white rounded-3xl px-5 py-5" style={{ boxShadow: "0 2px 16px rgba(61,21,32,0.06)" }}>
                        <div className="flex items-center gap-2 mb-4">
                            <LayoutGrid size={15} style={{ color: "#FF6B8B" }} />
                            <span className="font-sans font-semibold text-sm" style={{ color: "#3D1520" }}>Layout</span>
                        </div>
                        <div className="flex gap-2">
                            {LAYOUTS.map(layout => {
                                const active = selectedLayout.id === layout.id;
                                return (
                                    <button
                                        key={layout.id}
                                        onClick={() => handleLayoutChange(layout)}
                                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                                        style={{
                                            background:     active ? "#FFF0F3" : "transparent",
                                            outline:        active ? "2px solid #FF6B8B" : "2px solid transparent",
                                            outlineOffset:  "-2px",
                                            color:          active ? "#FF6B8B" : "#B09098",
                                        }}
                                    >
                                        <LayoutIconSvg id={layout.id} />
                                        <span className="text-[10px] font-sans font-semibold uppercase tracking-wide">
                                            {layout.id === "grid" ? "2x2" : layout.id === "strip" ? "Strip" : "Single"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filters card */}
                    <div className="bg-white rounded-3xl px-5 py-5" style={{ boxShadow: "0 2px 16px rgba(61,21,32,0.06)" }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={15} style={{ color: "#FF6B8B" }} />
                            <span className="font-sans font-semibold text-sm" style={{ color: "#3D1520" }}>Filters</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {FILTERS.map(filter => {
                                const active = selectedFilter.id === filter.id;
                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => setSelectedFilter(filter)}
                                        className="flex flex-col items-center gap-1.5"
                                    >
                                        <div
                                            className="w-full rounded-2xl transition-transform"
                                            style={{
                                                height: 46,
                                                backgroundColor: FILTER_COLORS[filter.id] ?? "#E0E5EA",
                                                boxShadow: active ? "0 0 0 2.5px #FF6B8B, 0 0 0 4.5px white" : "none",
                                                transform: active ? "scale(1.06)" : "scale(1)",
                                            }}
                                        />
                                        <span
                                            className="text-[10px] font-sans leading-tight text-center"
                                            style={{ color: active ? "#FF6B8B" : "#9B7280" }}
                                        >
                                            {filter.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* â•â• CENTER: Viewport + Buttons â•â• */}
                <div className="flex-1 flex flex-col items-center min-w-0">

                    {/* Viewport */}
                    <div
                        className="relative w-full overflow-hidden"
                        style={{
                            borderRadius: 24,
                            border: "6px solid white",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                            background: "#FFF0F3",
                            aspectRatio: "4/3",
                            maxHeight: "calc(100vh - 280px)",
                        }}
                    >
                        {/* Hidden Webcam â€” used only for screenshots */}
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            width={800}
                            height={600}
                            className="absolute pointer-events-none opacity-0"
                            style={{ width: 1, height: 1 }}
                            videoConstraints={{ width: 800, height: 600, facingMode: "user" }}
                            onUserMedia={(s) => setMediaStream(s)}
                        />

                        {/* Live display â€” animated layout switch */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedLayout.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0"
                            >
                                {/* Single: one fullâ€‘size feed */}
                                {selectedLayout.id === "single" && (
                                    <CameraFeed
                                        stream={mediaStream}
                                        filterCss={filterCss}
                                        className="w-full h-full object-cover"
                                    />
                                )}

                                {/* 2Ã—2 Grid: four feeds in a 2-col grid */}
                                {selectedLayout.id === "grid" && (
                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="overflow-hidden">
                                                <CameraFeed
                                                    stream={mediaStream}
                                                    filterCss={filterCss}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Strip: four equal rows */}
                                {selectedLayout.id === "strip" && (
                                    <div className="absolute inset-0 flex flex-col gap-0.5">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="flex-1 overflow-hidden">
                                                <CameraFeed
                                                    stream={mediaStream}
                                                    filterCss={filterCss}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Frame overlay â€” layered above feeds, pointer-events none */}
                        <AnimatePresence mode="wait">
                            {selectedFrame.url && (
                                <motion.img
                                    key={selectedFrame.id}
                                    src={toTransparentOverlay(selectedFrame.url) ?? ""}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                                    style={{ zIndex: 10 }}
                                    alt={selectedFrame.name}
                                />
                            )}
                        </AnimatePresence>

                        {/* Shot progress dots (multi-shot layouts) */}
                        {selectedLayout.shots > 1 && isCapturing && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                                <span className="text-white text-sm font-medium mr-1">
                                    {Math.min(currentShotIndex + 1, selectedLayout.shots)}/{selectedLayout.shots}
                                </span>
                                {Array.from({ length: selectedLayout.shots }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-colors ${
                                            i < capturedSequence.length
                                                ? "bg-[#FF6B8B]"
                                                : i === currentShotIndex
                                                ? "bg-white animate-pulse"
                                                : "bg-white/30"
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Countdown */}
                        <AnimatePresence>
                            {countdown !== null && countdown > 0 && (
                                <motion.div
                                    key={countdown}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.5 }}
                                    className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                                >
                                    <span className="text-9xl font-display font-bold text-white drop-shadow-2xl">{countdown}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Flash */}
                        <AnimatePresence>
                            {countdown === 0 && (
                                <motion.div
                                    key={`flash-${currentShotIndex}`}
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0 bg-white z-30 pointer-events-none"
                                />
                            )}
                        </AnimatePresence>

                        {/* Floating capture & cancel buttons */}
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
                            <AnimatePresence>
                                {isCapturing && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={handleCancel}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full font-sans font-medium text-sm bg-white/90 backdrop-blur-sm"
                                        style={{
                                            border: "1.5px solid #E5D0D5",
                                            color: "#9B7280",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                                        }}
                                    >
                                        <X size={13} /> Cancel
                                    </motion.button>
                                )}
                            </AnimatePresence>
                            <motion.button
                                onClick={captureSequence}
                                disabled={isCapturing}
                                whileHover={{ scale: 1.07 }}
                                whileTap={{ scale: 0.93 }}
                                className="relative flex items-center justify-center rounded-full transition-opacity disabled:opacity-40"
                                style={{
                                    width: 64,
                                    height: 64,
                                    background: "radial-gradient(circle at 38% 38%, #FF8FAA, #E8325C)",
                                    boxShadow: "0 6px 24px rgba(232,50,92,0.40), 0 2px 8px rgba(0,0,0,0.10)",
                                }}
                            >
                                <span
                                    className="absolute inset-0 rounded-full"
                                    style={{ border: "3px solid rgba(255,255,255,0.55)" }}
                                />
                                <Camera size={22} className="text-white relative z-10" />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* â•â• RIGHT COLUMN: Frames â•â• */}
                <div className="shrink-0" style={{ width: 190 }}>
                    <div className="bg-white rounded-3xl px-5 py-5" style={{ boxShadow: "0 2px 16px rgba(61,21,32,0.06)" }}>
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon size={15} style={{ color: "#FF6B8B" }} />
                            <span className="font-sans font-semibold text-sm" style={{ color: "#3D1520" }}>Frames</span>
                        </div>
                        {selectedFrame.url && (
                            <div
                                className="mb-3 rounded-xl overflow-hidden"
                                style={{ border: "1px solid #F4D1D6", background: "#FFF8FA" }}
                            >
                                <img
                                    src={selectedFrame.url}
                                    alt={selectedFrame.name}
                                    style={{ width: "100%", height: 72, objectFit: "contain" }}
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            {currentFrames.map(frame => {
                                const active = selectedFrame.id === frame.id;
                                return (
                                    <button
                                        key={frame.id}
                                        onClick={() => setSelectedFrame(frame)}
                                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-sans text-sm transition-all"
                                        style={{
                                            border:      active ? "1.5px solid #FF6B8B" : "1.5px solid transparent",
                                            color:       active ? "#FF6B8B" : "#6B4455",
                                            fontWeight:  active ? 500 : 400,
                                        }}
                                    >
                                        {frame.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>

            {/* Hidden canvas for compositing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* â•â• Preview Modal â•â• */}
            <AnimatePresence>
                {capturedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white p-8 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col items-center my-auto"
                        >
                            <h3 className="font-display text-4xl mb-8" style={{ color: "#3D1520" }}>
                                Your Perfect Shot
                            </h3>

                            <div className="w-full bg-zinc-100 rounded-2xl overflow-hidden flex items-center justify-center mb-10 py-6">
                                <img
                                    src={capturedImage}
                                    alt="Captured preview"
                                    className={`object-contain rounded-md shadow-md bg-white ${
                                        selectedLayout.id === "strip" ? "h-[65vh] w-auto" : "w-full max-w-2xl"
                                    }`}
                                />
                            </div>

                            <div className="flex gap-4 w-full max-w-md">
                                <button
                                    onClick={() => { setCapturedImage(null); setCapturedSequence([]); setCurrentShotIndex(0); }}
                                    className="flex-1 flex justify-center items-center gap-2 py-4 rounded-xl font-sans font-medium bg-zinc-100 hover:bg-zinc-200 transition"
                                    style={{ color: "#3D1520" }}
                                >
                                    <RefreshCcw size={20} /> Retake
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 flex justify-center items-center gap-2 py-4 rounded-xl font-sans font-medium text-white transition"
                                    style={{
                                        background: "linear-gradient(135deg, #FF6B8B, #E8325C)",
                                        boxShadow: "0 4px 16px rgba(232,50,92,0.35)",
                                    }}
                                >
                                    <Download size={20} /> Download
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </section>
    );
}
