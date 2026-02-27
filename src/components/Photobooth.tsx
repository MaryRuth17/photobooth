"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCcw, Camera, LayoutGrid, Sparkles, Image as ImageIcon } from "lucide-react";
import {
    FILTERS, FRAMES, GRID_FRAMES, STRIP_FRAMES, LAYOUTS,
    STRIP_W, STRIP_H, STRIP_PAD, STRIP_PHOTO_W, STRIP_PHOTO_H, STRIP_GAP,
} from "@/lib/constants";

export default function Photobooth() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
    const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
    const [activeTab, setActiveTab] = useState<"layout" | "filter" | "frame">("layout");

    const getFramesForLayout = (layoutId: string) => {
        if (layoutId === "grid") return GRID_FRAMES;
        if (layoutId === "strip") return STRIP_FRAMES;
        return FRAMES;
    };

    const currentFrames = getFramesForLayout(selectedLayout.id);

    const handleLayoutChange = (layout: typeof LAYOUTS[number]) => {
        setSelectedLayout(layout);
        const newFrames = getFramesForLayout(layout.id);
        setSelectedFrame(newFrames[0]);
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

    /* ─── Compositing ─── */
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

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const loadImages = sequence.map(src =>
            new Promise<HTMLImageElement>(resolve => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
            })
        );

        Promise.all(loadImages).then(images => {
            ctx.filter = selectedFilter.value !== "none" ? selectedFilter.value : "none";

            images.forEach((img, index) => {
                let dx: number, dy: number, dw: number, dh: number;

                if (selectedLayout.id === "strip") {
                    dx = STRIP_PAD;
                    dy = STRIP_PAD + index * (STRIP_PHOTO_H + STRIP_GAP);
                    dw = STRIP_PHOTO_W;
                    dh = STRIP_PHOTO_H;
                } else if (selectedLayout.id === "grid") {
                    // Grid: 4 photos in 2×2, with 25px padding, 10px gap, footer at bottom
                    const padX = 25, padY = 25, gapX = 10, gapY = 20;
                    dw = (800 - padX * 2 - gapX) / 2; // ~382.5
                    dh = (600 - padY * 2 - gapY) / 2; // ~277.5
                    dx = padX + (index % 2) * (dw + gapX);
                    dy = padY + Math.floor(index / 2) * (dh + gapY);
                } else {
                    // Single: full width with padding for frame
                    dx = 30; dy = 30;
                    dw = 740; dh = 520;
                }

                ctx.save();
                // Mirror horizontally (because webcam screenshot is already mirrored via CSS)
                ctx.translate(dx + dw, dy);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0, dw, dh);
                ctx.restore();
            });

            ctx.filter = "none";

            const finishCapture = () => {
                setCapturedImage(canvas.toDataURL("image/png"));
            };

            if (selectedFrame.url) {
                const frameImg = new Image();
                frameImg.src = selectedFrame.url;
                frameImg.onload = () => {
                    ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
                    finishCapture();
                };
            } else {
                finishCapture();
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

    /* ─── Strip photo Y-position helper (mirrors the constant) ─── */
    const stripPhotoY = (i: number) => STRIP_PAD + i * (STRIP_PHOTO_H + STRIP_GAP);

    return (
        <section id="booth" className="min-h-screen bg-white dark:bg-[#1A1A1A] py-20 px-4 flex flex-col items-center">
            <div className="max-w-5xl w-full flex flex-col items-center">

                <div className="text-center mb-10">
                    <h2 className="font-display text-4xl mb-2 text-foreground">The Booth</h2>
                    <p className="font-sans text-foreground/60">Customize your shot with premium layouts, filters, and frames</p>
                </div>

                {/* ═══ Main workspace: camera + optional strip preview ═══ */}
                <div className="flex gap-6 w-full max-w-5xl items-start justify-center">

                    {/* Viewfinder Container */}
                    <div className="relative flex-1 max-w-3xl aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-petal dark:ring-zinc-800">

                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width={800}
                            height={600}
                            className="w-full h-full object-cover scale-x-[-1]"
                            videoConstraints={{ width: 800, height: 600, facingMode: "user" }}
                            style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }}
                        />

                        {/* Frame Overlay (Live Preview) */}
                        {selectedFrame.url && (
                            <img
                                src={selectedFrame.url}
                                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                                alt="frame overlay"
                            />
                        )}

                        {/* Grid Overlay Guides */}
                        {selectedLayout.id === "grid" && !selectedFrame.url && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30" />
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30" />
                            </div>
                        )}

                        {/* Sequence Progress Indicator */}
                        {selectedLayout.shots > 1 && isCapturing && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full">
                                <span className="text-white text-sm font-medium mr-2">
                                    Shot {Math.min(currentShotIndex + 1, selectedLayout.shots)}/{selectedLayout.shots}
                                </span>
                                {Array.from({ length: selectedLayout.shots }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full transition-colors ${i < capturedSequence.length ? "bg-accent" : i === currentShotIndex && countdown !== null ? "bg-white animate-pulse" : "bg-white/30"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Countdown Overlay */}
                        <AnimatePresence>
                            {countdown !== null && countdown > 0 && (
                                <motion.div
                                    key={countdown}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.5 }}
                                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                                >
                                    <span className="text-8xl font-display font-bold text-white drop-shadow-2xl">{countdown}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Flash Effect */}
                        <AnimatePresence>
                            {countdown === 0 && (
                                <motion.div
                                    key={`flash-${currentShotIndex}`}
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="absolute inset-0 bg-white z-30 pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ═══ Real-time Strip Preview (only for strip layout during capture) ═══ */}
                    {selectedLayout.id === "strip" && (
                        <motion.div
                            layout
                            className="hidden md:flex flex-col items-center shrink-0"
                            style={{ width: 180 }}
                        >
                            <div
                                className="relative bg-white rounded-xl shadow-xl overflow-hidden border-2 border-zinc-200"
                                style={{ width: 180, height: 180 * (STRIP_H / STRIP_W) }}
                            >
                                {/* Mini frame overlay */}
                                {selectedFrame.url && (
                                    <img
                                        src={selectedFrame.url}
                                        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                                        alt="strip frame"
                                    />
                                )}

                                {/* Photo slots */}
                                {[0, 1, 2, 3].map(i => {
                                    const scale = 180 / STRIP_W;
                                    const top = stripPhotoY(i) * scale;
                                    const left = STRIP_PAD * scale;
                                    const w = STRIP_PHOTO_W * scale;
                                    const h = STRIP_PHOTO_H * scale;
                                    const photoSrc = capturedSequence[i];

                                    return (
                                        <div
                                            key={i}
                                            className="absolute overflow-hidden rounded-sm"
                                            style={{ top, left, width: w, height: h }}
                                        >
                                            {photoSrc ? (
                                                <motion.img
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    src={photoSrc}
                                                    className="w-full h-full object-cover scale-x-[-1]"
                                                    style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }}
                                                    alt={`Shot ${i + 1}`}
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${i === currentShotIndex && isCapturing
                                                        ? "bg-accent/10 text-accent animate-pulse"
                                                        : "bg-zinc-100 text-zinc-400"
                                                    }`}>
                                                    {i + 1}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="text-xs text-foreground/50 mt-3 font-sans">Live Strip Preview</span>
                        </motion.div>
                    )}
                </div>

                {/* Hidden Canvas for Compositing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Interactive Tools Panel */}
                <div className="w-full max-w-3xl mt-10 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">

                    {/* Tab Navigation */}
                    <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                        {([
                            { key: "layout" as const, icon: <LayoutGrid size={18} />, label: "Layout" },
                            { key: "filter" as const, icon: <Sparkles size={18} />, label: "Filter" },
                            { key: "frame" as const, icon: <ImageIcon size={18} />, label: "Frame" },
                        ]).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 font-sans font-medium transition-colors ${activeTab === tab.key
                                        ? "text-accent border-b-2 border-accent bg-accent/5"
                                        : "text-foreground/60 hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 h-40 relative">
                        {activeTab === "layout" && (
                            <div className="flex gap-4 h-full">
                                {LAYOUTS.map(layout => (
                                    <button
                                        key={layout.id}
                                        onClick={() => handleLayoutChange(layout)}
                                        className={`flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all ${selectedLayout.id === layout.id
                                                ? "border-accent bg-blush text-accent dark:bg-accent/10"
                                                : "border-zinc-200 dark:border-zinc-700 hover:border-accent hover:bg-zinc-50 text-foreground dark:hover:bg-zinc-800"
                                            }`}
                                    >
                                        <span className="font-sans font-medium">{layout.name}</span>
                                        <span className="text-xs text-foreground/50">{layout.shots} shot{layout.shots > 1 && "s"}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === "filter" && (
                            <div className="flex gap-3 overflow-x-auto h-full items-center snap-x px-2 scrollbar-none">
                                {FILTERS.map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setSelectedFilter(filter)}
                                        className={`snap-center shrink-0 px-6 py-3 rounded-full font-sans text-sm transition-all border ${selectedFilter.id === filter.id
                                                ? "bg-foreground text-background shadow-lg scale-105 border-foreground"
                                                : "bg-white text-foreground border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                                            }`}
                                    >
                                        {filter.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === "frame" && (
                            <div className="flex gap-4 overflow-x-auto h-full items-center snap-x px-2 scrollbar-none">
                                {currentFrames.map(frame => (
                                    <button
                                        key={frame.id}
                                        onClick={() => setSelectedFrame(frame)}
                                        className={`snap-center shrink-0 w-24 h-24 rounded-xl border-2 transition-all overflow-hidden relative bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center ${selectedFrame.id === frame.id
                                                ? "border-accent ring-4 ring-accent/20"
                                                : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-500"
                                            }`}
                                    >
                                        {frame.url ? (
                                            <img src={frame.url} className="w-full h-full object-contain p-1" alt={frame.name} />
                                        ) : (
                                            <span className="text-xs font-sans text-foreground/50">None</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Capture Button */}
                <div className="mt-8">
                    <button
                        onClick={captureSequence}
                        disabled={isCapturing}
                        className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-accent hover:bg-accent-hover text-white shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        <div className="absolute inset-0 rounded-full border-4 border-accent opacity-50 scale-110 group-hover:scale-125 transition-transform duration-500" />
                        <Camera size={36} />
                    </button>
                </div>

            </div>

            {/* ═══ Preview Modal Overlay ═══ */}
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
                            className="bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col items-center my-auto"
                        >
                            <h3 className="font-display text-4xl mb-8 text-foreground">Your Perfect Shot</h3>

                            <div className={`w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-inner overflow-hidden flex items-center justify-center mb-10 py-6`}>
                                <img
                                    src={capturedImage}
                                    alt="Captured preview"
                                    className={`object-contain rounded-md shadow-md bg-white ${selectedLayout.id === "strip" ? "h-[65vh] w-auto" : "w-full max-w-2xl"
                                        }`}
                                />
                            </div>

                            <div className="flex gap-4 w-full max-w-md">
                                <button
                                    onClick={() => { setCapturedImage(null); setCapturedSequence([]); setCurrentShotIndex(0); }}
                                    className="flex-1 flex justify-center items-center gap-2 py-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                                >
                                    <RefreshCcw size={20} /> Retake
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 flex justify-center items-center gap-2 py-4 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover shadow-lg hover:shadow-accent/40 shadow-accent/20 transition"
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
