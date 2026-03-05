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
        <section id="booth" className="relative min-h-screen bg-gradient-to-b from-white via-blush-light to-blush py-20 px-4 flex flex-col items-center overflow-hidden">
            <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-rose/30 blur-3xl pointer-events-none" />

            <div className="max-w-6xl w-full flex flex-col items-center relative z-10">

                <div className="text-center mb-10">
                    <h2 className="font-display text-4xl mb-2 text-foreground">The Booth</h2>
                    <p className="font-sans text-foreground/60">Customize your shot with premium layouts, filters, and frames</p>
                </div>

                {/* ═══ Dashboard: camera left, sidebar right ═══ */}
                <div className="flex gap-6 w-full items-start">

                    {/* ── LEFT: Camera Column ── */}
                    <div className="flex-1 flex flex-col gap-3 min-w-0">

                        {/* Viewfinder — clean lens, no frame/grid overlays */}
                        <div className="relative aspect-[4/3] rounded-[28px] overflow-hidden bg-black shadow-2xl">
                            {/* Minimalist inner border ring */}
                            <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/15 pointer-events-none z-20" />

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

                            {/* Sequence Progress Indicator */}
                            {selectedLayout.shots > 1 && isCapturing && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                                    <span className="text-white text-sm font-medium mr-1">
                                        Shot {Math.min(currentShotIndex + 1, selectedLayout.shots)}/{selectedLayout.shots}
                                    </span>
                                    {Array.from({ length: selectedLayout.shots }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                                i < capturedSequence.length
                                                    ? "bg-accent"
                                                    : i === currentShotIndex && countdown !== null
                                                    ? "bg-white animate-pulse"
                                                    : "bg-white/30"
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

                        {/* Camera status bar */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-xs text-foreground/50 font-sans">
                                <span className={`w-1.5 h-1.5 rounded-full ${isCapturing ? "bg-red-500 animate-pulse" : "bg-emerald-400"}`} />
                                {isCapturing ? "Recording…" : "Live"}
                            </div>
                            {selectedFrame.url && (
                                <AnimatePresence>
                                    <motion.span
                                        key={selectedFrame.id}
                                        initial={{ opacity: 0, x: 6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-[11px] font-sans text-foreground/45 bg-foreground/5 px-3 py-1 rounded-full"
                                    >
                                        {selectedFrame.name} · applied to output
                                    </motion.span>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT: Sidebar ── */}
                    <div className="w-72 shrink-0 flex flex-col gap-4">

                        {/* Controls panel */}
                        <div className="bg-white/70 rounded-3xl shadow-xl overflow-hidden border border-white/80 backdrop-blur-xl">

                            {/* Tab Navigation */}
                            <div className="flex border-b border-zinc-100">
                                {([
                                    { key: "layout" as const, icon: <LayoutGrid size={15} />, label: "Layout" },
                                    { key: "filter" as const, icon: <Sparkles size={15} />, label: "Filter" },
                                    { key: "frame" as const, icon: <ImageIcon size={15} />, label: "Frame" },
                                ]).map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-sans text-[11px] font-medium tracking-wide transition-colors ${
                                            activeTab === tab.key
                                                ? "text-accent border-b-2 border-accent bg-accent/5"
                                                : "text-foreground/55 hover:text-foreground hover:bg-zinc-50"
                                        }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="p-4">
                                <AnimatePresence mode="wait">

                                    {activeTab === "layout" && (
                                        <motion.div
                                            key="layout-tab"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.18 }}
                                            className="flex flex-col gap-2"
                                        >
                                            {LAYOUTS.map(layout => (
                                                <button
                                                    key={layout.id}
                                                    onClick={() => handleLayoutChange(layout)}
                                                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                                                        selectedLayout.id === layout.id
                                                            ? "border-accent bg-blush text-accent"
                                                            : "border-zinc-200 hover:border-accent/60 hover:bg-zinc-50 text-foreground"
                                                    }`}
                                                >
                                                    <span className="font-sans font-medium text-sm">{layout.name}</span>
                                                    <span className="text-xs text-foreground/40">{layout.shots} shot{layout.shots > 1 && "s"}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {activeTab === "filter" && (
                                        <motion.div
                                            key="filter-tab"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.18 }}
                                            className="flex flex-col gap-2"
                                        >
                                            {FILTERS.map(filter => (
                                                <button
                                                    key={filter.id}
                                                    onClick={() => setSelectedFilter(filter)}
                                                    className={`px-4 py-3 rounded-xl font-sans text-sm transition-all border text-left ${
                                                        selectedFilter.id === filter.id
                                                            ? "bg-foreground text-background border-foreground shadow-sm"
                                                            : "bg-white text-foreground border-zinc-200 hover:border-zinc-300"
                                                    }`}
                                                >
                                                    {filter.name}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {activeTab === "frame" && (
                                        <motion.div
                                            key="frame-tab"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.18 }}
                                            className="flex flex-col gap-3"
                                        >
                                            <div className="grid grid-cols-3 gap-2">
                                                {currentFrames.map(frame => (
                                                    <button
                                                        key={frame.id}
                                                        onClick={() => setSelectedFrame(frame)}
                                                        className={`aspect-square rounded-xl border-2 transition-all overflow-hidden relative bg-zinc-50 flex flex-col items-center justify-center gap-1 ${
                                                            selectedFrame.id === frame.id
                                                                ? "border-accent ring-2 ring-accent/20"
                                                                : "border-transparent hover:border-zinc-300"
                                                        }`}
                                                    >
                                                        {frame.url ? (
                                                            <img src={frame.url} className="w-full h-full object-contain p-1" alt={frame.name} />
                                                        ) : (
                                                            <span className="text-[10px] font-sans text-foreground/40 leading-tight text-center px-1">No Frame</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedFrame.url && (
                                                <p className="text-[11px] text-foreground/40 font-sans text-center pt-1">
                                                    ✦ Frame applied to captured photo only
                                                </p>
                                            )}
                                        </motion.div>
                                    )}

                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ── Strip Live Preview (strip layout only) ── */}
                        <AnimatePresence>
                            {selectedLayout.id === "strip" && (
                                <motion.div
                                    key="strip-preview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.25 }}
                                    className="bg-white/70 rounded-3xl shadow-xl border border-white/80 backdrop-blur-xl p-4 flex flex-col items-center gap-3"
                                >
                                    <span className="text-[11px] text-foreground/45 font-sans font-medium uppercase tracking-wider">Strip Preview</span>
                                    <div
                                        className="relative w-full bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200"
                                        style={{ aspectRatio: `${STRIP_W}/${STRIP_H}` }}
                                    >
                                        {selectedFrame.url && (
                                            <img
                                                src={selectedFrame.url}
                                                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                                                alt="strip frame preview"
                                            />
                                        )}
                                        {[0, 1, 2, 3].map(i => {
                                            const padPct  = (STRIP_PAD / STRIP_W) * 100;
                                            const wPct    = (STRIP_PHOTO_W / STRIP_W) * 100;
                                            const topPct  = (stripPhotoY(i) / STRIP_H) * 100;
                                            const hPct    = (STRIP_PHOTO_H / STRIP_H) * 100;
                                            const photoSrc = capturedSequence[i];
                                            return (
                                                <div
                                                    key={i}
                                                    className="absolute overflow-hidden"
                                                    style={{ top: `${topPct}%`, left: `${padPct}%`, width: `${wPct}%`, height: `${hPct}%` }}
                                                >
                                                    {photoSrc ? (
                                                        <motion.img
                                                            initial={{ opacity: 0, scale: 0.85 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            src={photoSrc}
                                                            className="w-full h-full object-cover scale-x-[-1]"
                                                            style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }}
                                                            alt={`Shot ${i + 1}`}
                                                        />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${
                                                            i === currentShotIndex && isCapturing
                                                                ? "bg-accent/10 text-accent animate-pulse"
                                                                : "bg-zinc-200/60 text-zinc-400"
                                                        }`}>
                                                            {i + 1}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Capture Button ── */}
                        <div className="flex flex-col items-center gap-2">
                            <motion.button
                                onClick={captureSequence}
                                disabled={isCapturing}
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative w-full flex items-center justify-center gap-3 h-16 rounded-2xl bg-gradient-to-r from-accent to-[#ff4f75] hover:from-accent-hover hover:to-accent text-white shadow-2xl shadow-accent/30 transition-all disabled:opacity-50"
                            >
                                <span className="absolute -inset-1 rounded-2xl bg-accent/30 blur-md -z-10" />
                                <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/20 border border-white/40">
                                    <Camera size={20} />
                                </span>
                                <span className="font-sans text-lg font-semibold tracking-wide">Capture</span>
                            </motion.button>
                            <p className="text-xs font-sans text-foreground/45 text-center">
                                {isCapturing
                                    ? "Capture in progress…"
                                    : `${selectedLayout.shots} shot${selectedLayout.shots > 1 ? "s" : ""} · ${selectedLayout.name}`}
                            </p>
                        </div>

                    </div>{/* end sidebar */}
                </div>{/* end dashboard row */}

                {/* Hidden Canvas for Compositing */}
                <canvas ref={canvasRef} className="hidden" />

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

                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-inner overflow-hidden flex items-center justify-center mb-10 py-6">
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
