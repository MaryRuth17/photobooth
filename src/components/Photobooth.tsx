"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { ChevronLeft, Wand2, Download, LayoutGrid, Sparkles, ImageIcon, Camera, X } from "lucide-react";
import { LAYOUTS, FILTERS, FRAMES, GRID_FRAMES, STRIP_FRAMES, STRIP_W, STRIP_H, STRIP_PAD, STRIP_PHOTO_W, STRIP_PHOTO_H, STRIP_GAP } from "@/lib/constants";

/* ─────────────────────────────────────────
   Sticker palette used in The Studio step
───────────────────────────────────────── */
const STICKER_PALETTE = [
    { id: "star",      emoji: "⭐" },
    { id: "heart",     emoji: "❤️" },
    { id: "sparkle",   emoji: "✨" },
    { id: "rainbow",   emoji: "🌈" },
    { id: "flower",    emoji: "🌸" },
    { id: "butterfly", emoji: "🦋" },
    { id: "camera",    emoji: "📸" },
    { id: "ribbon",    emoji: "🎀" },
    { id: "balloon",   emoji: "🎈" },
    { id: "moon",      emoji: "🌙" },
    { id: "sun",       emoji: "☀️" },
    { id: "gem",       emoji: "💎" },
    { id: "fire",      emoji: "🔥" },
    { id: "lips",      emoji: "💋" },
    { id: "crown",     emoji: "👑" },
    { id: "clover",    emoji: "🍀" },
];

interface PlacedSticker {
    id: string;
    emoji: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
}

export default function Photobooth() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    /* ── Booth settings ── */
    const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
    const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
    const [activeTab, setActiveTab] = useState<"layout" | "filter" | "frame">("layout");

    /* ── Capture state ── */
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedSequence, setCapturedSequence] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [currentShotIndex, setCurrentShotIndex] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);

    /* ── Studio state ── */
    const [inStudio, setInStudio] = useState(false);
    const [stickers, setStickers] = useState<PlacedSticker[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const studioCanvasRef = useRef<HTMLDivElement>(null);
    const capturedLayoutRef = useRef<typeof LAYOUTS[0]>(LAYOUTS[0]);

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
                capturedLayoutRef.current = selectedLayout;
                setStickers([]);
                setInStudio(true);
            };

            if (!selectedFrame.url) {
                // No frame — just draw photos and done
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

    /* ──────────────────────────────────────
       Studio: add / move / remove stickers
    ────────────────────────────────────── */
    const addSticker = (emoji: string) => {
        const container = studioCanvasRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        setStickers(prev => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                emoji,
                x: rect.width / 2,
                y: rect.height / 2,
                size: 52,
                rotation: Math.round((Math.random() - 0.5) * 30),
            },
        ]);
    };

    const removeSticker = (id: string) => {
        setStickers(prev => prev.filter(s => s.id !== id));
    };

    const onStickerPointerDown = (e: React.PointerEvent, id: string) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const sticker = stickers.find(s => s.id === id);
        if (!sticker) return;
        setDraggingId(id);
        setDragOffset({ x: e.clientX - sticker.x, y: e.clientY - sticker.y });
    };

    const onStickerPointerMove = (e: React.PointerEvent) => {
        if (!draggingId) return;
        const container = studioCanvasRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        setStickers(prev =>
            prev.map(s =>
                s.id === draggingId
                    ? {
                        ...s,
                        x: Math.max(0, Math.min(rect.width,  e.clientX - dragOffset.x)),
                        y: Math.max(0, Math.min(rect.height, e.clientY - dragOffset.y)),
                    }
                    : s
            )
        );
    };

    const onStickerPointerUp = () => setDraggingId(null);

    /* ──────────────────────────────────────
       Studio: export (base image + stickers)
    ────────────────────────────────────── */
    const exportStudio = () => {
        if (!capturedImage || !studioCanvasRef.current) return;
        const container = studioCanvasRef.current;
        const rect = container.getBoundingClientRect();
        const exportCanvas = document.createElement("canvas");
        const exportCtx = exportCanvas.getContext("2d");
        if (!exportCtx) return;
        const baseImg = new Image();
        baseImg.src = capturedImage;
        baseImg.onload = () => {
            exportCanvas.width = baseImg.naturalWidth;
            exportCanvas.height = baseImg.naturalHeight;
            exportCtx.drawImage(baseImg, 0, 0);
            const scaleX = baseImg.naturalWidth / rect.width;
            const scaleY = baseImg.naturalHeight / rect.height;
            stickers.forEach(s => {
                const cx = s.x * scaleX;
                const cy = s.y * scaleY;
                const sz = s.size * Math.min(scaleX, scaleY);
                exportCtx.save();
                exportCtx.translate(cx, cy);
                exportCtx.rotate((s.rotation * Math.PI) / 180);
                exportCtx.font = `${sz}px serif`;
                exportCtx.textAlign = "center";
                exportCtx.textBaseline = "middle";
                exportCtx.fillText(s.emoji, 0, 0);
                exportCtx.restore();
            });
            const a = document.createElement("a");
            a.href = exportCanvas.toDataURL("image/png");
            a.download = "aura-photobooth.png";
            a.click();
        };
    };

    const retakeFromStudio = () => {
        setInStudio(false);
        setCapturedImage(null);
        setCapturedSequence([]);
        setCurrentShotIndex(0);
        setStickers([]);
    };

    /* ──────────────────────────────────────
       Live preview sidebar helpers
    ────────────────────────────────────── */
    const stripPhotoY = (i: number) => STRIP_PAD + i * (STRIP_PHOTO_H + STRIP_GAP);

    const gridPreviewSlots = (previewW: number, previewH: number) => {
        const scaleX = previewW / 800;
        const scaleY = (previewH * (600 / 700)) / 600;
        const padX = 22 * scaleX, padY = 22 * scaleY;
        const gapX = 14 * scaleX, gapY = 14 * scaleY;
        const slotW = (previewW - padX * 2 - gapX) / 2;
        const slotH = ((previewH * 600 / 700) - padY * 2 - gapY) / 2;
        return [0, 1, 2, 3].map(i => ({
            left: padX + (i % 2) * (slotW + gapX),
            top: padY + Math.floor(i / 2) * (slotH + gapY),
            w: slotW,
            h: slotH,
        }));
    };

    const singlePreviewSlot = (previewW: number, previewH: number) => {
        const photoH = previewH * (600 / 700);
        return {
            left: 20 * (previewW / 800),
            top: 20 * (photoH / 600),
            w: previewW - 40 * (previewW / 800),
            h: photoH - 40 * (photoH / 600),
        };
    };

    const STRIP_PREVIEW_W = 150;
    const PREVIEW_W = 200;

    const previewHeight = selectedLayout.id === "strip"
        ? Math.round(STRIP_PREVIEW_W * (STRIP_H / STRIP_W))
        : Math.round(PREVIEW_W * (700 / 800));

    /* ══════════════════════════════════════
       RENDER — Studio screen
    ══════════════════════════════════════ */
    if (inStudio && capturedImage) {
        return (
            <motion.section
                key="studio"
                id="booth"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex flex-col overflow-hidden bg-white dark:bg-[#1A1A1A] scroll-mt-20"
                style={{ marginTop: 80, height: "calc(100dvh - 80px)" }}
            >
                {/* Studio header bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={retakeFromStudio}
                            className="flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
                        >
                            <ChevronLeft size={18} /> Retake
                        </motion.button>
                        <span className="text-foreground/20 select-none">|</span>
                        <div className="flex items-center gap-2">
                            <Wand2 size={18} className="text-accent" />
                            <span className="font-display text-xl text-foreground">The Studio</span>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={exportStudio}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white font-medium text-sm shadow-lg shadow-accent/25 hover:bg-accent-hover transition-colors"
                    >
                        <Download size={16} /> Download
                    </motion.button>
                </div>

                {/* Studio body */}
                <div className="flex flex-1 min-h-0 gap-4 p-4 lg:p-5">

                    {/* Sticker palette — desktop sidebar */}
                    <div className="hidden lg:flex flex-col shrink-0 w-52 gap-3">
                        <p className="text-xs font-sans font-semibold text-foreground/50 uppercase tracking-wider px-1">Stickers</p>
                        <div className="flex-1 overflow-y-auto rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
                            <div className="grid grid-cols-4 gap-2">
                                {STICKER_PALETTE.map(s => (
                                    <motion.button
                                        key={s.id}
                                        whileHover={{ scale: 1.2, y: -3 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => addSticker(s.emoji)}
                                        className="aspect-square text-2xl flex items-center justify-center rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors select-none"
                                        title={`Add ${s.id}`}
                                    >
                                        {s.emoji}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                        <p className="text-[11px] text-foreground/40 font-sans text-center">Tap · Drag · ✕ remove</p>
                    </div>

                    {/* Canvas area */}
                    <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-3">

                        {/* Sticker row — mobile */}
                        <div className="flex lg:hidden w-full overflow-x-auto gap-2 pb-1 shrink-0">
                            {STICKER_PALETTE.map(s => (
                                <motion.button
                                    key={s.id}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => addSticker(s.emoji)}
                                    className="text-2xl shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm select-none"
                                >
                                    {s.emoji}
                                </motion.button>
                            ))}
                        </div>

                        {/* Photo canvas with sticker layer */}
                        <div
                            ref={studioCanvasRef}
                            className="relative rounded-2xl overflow-hidden shadow-2xl select-none"
                            style={{
                                aspectRatio: capturedLayoutRef.current.id === "strip"
                                    ? `${STRIP_W} / ${STRIP_H}`
                                    : "800 / 700",
                                maxHeight: "calc(100dvh - 220px)",
                                width: "auto",
                                maxWidth: "100%",
                            }}
                            onPointerMove={onStickerPointerMove}
                            onPointerUp={onStickerPointerUp}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={capturedImage}
                                alt="Your photo"
                                className="w-full h-full object-cover block"
                                draggable={false}
                            />
                            {stickers.map(s => (
                                <div
                                    key={s.id}
                                    className="absolute cursor-grab active:cursor-grabbing touch-none group"
                                    style={{
                                        left: s.x,
                                        top: s.y,
                                        transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                                        fontSize: s.size,
                                        lineHeight: 1,
                                        userSelect: "none",
                                        zIndex: draggingId === s.id ? 50 : 10,
                                    }}
                                    onPointerDown={e => onStickerPointerDown(e, s.id)}
                                >
                                    {s.emoji}
                                    <button
                                        className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-50"
                                        onPointerDown={e => { e.stopPropagation(); removeSticker(s.id); }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </motion.section>
        );
    }

    /* ══════════════════════════════════════
       RENDER — Booth screen
    ══════════════════════════════════════ */
    return (
        <section
            id="booth"
            className="flex flex-col overflow-hidden bg-white dark:bg-[#1A1A1A] scroll-mt-20"
            style={{ marginTop: 80, height: "calc(100dvh - 80px)" }}
        >
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 py-4 lg:py-5 gap-4 max-w-[1200px] w-full mx-auto">

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="text-center shrink-0"
                >
                    <h2 className="font-display text-3xl lg:text-4xl mb-1 text-foreground">The Booth</h2>
                    <p className="font-sans text-sm text-foreground/60">
                        Customize your shot with premium layouts, filters &amp; frames
                    </p>
                </motion.div>

                {/* Main Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="flex flex-col md:flex-row gap-4 lg:gap-5 flex-1 min-h-0"
                >

                    {/* Left Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col gap-3 w-full md:w-56 lg:w-64 shrink-0 order-2 md:order-1 overflow-y-auto"
                    >
                        {/* Tools Panel */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                            <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                                {([
                                    { key: "layout" as const, icon: <LayoutGrid size={16} />, label: "Layout" },
                                    { key: "filter" as const, icon: <Sparkles size={16} />, label: "Filter" },
                                    { key: "frame"  as const, icon: <ImageIcon  size={16} />, label: "Frame"  },
                                ]).map(tab => (
                                    <motion.button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex-1 flex items-center justify-center gap-1 py-3 font-sans font-medium transition-colors relative text-xs ${activeTab === tab.key
                                            ? "text-accent bg-accent/5"
                                            : "text-foreground/60 hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                            }`}
                                    >
                                        {tab.icon} {tab.label}
                                        {activeTab === tab.key && (
                                            <motion.div
                                                layoutId="tab-indicator"
                                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            <div className="p-3 overflow-y-auto" style={{ maxHeight: 280 }}>
                                <AnimatePresence mode="wait" initial={false}>
                                    {activeTab === "layout" && (
                                        <motion.div key="layout" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }} className="flex flex-col gap-2">
                                            {LAYOUTS.map((layout, i) => (
                                                <motion.button
                                                    key={layout.id}
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.2 }}
                                                    whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                    onClick={() => handleLayoutChange(layout)}
                                                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border-2 transition-all text-sm ${selectedLayout.id === layout.id
                                                        ? "border-accent bg-blush text-accent dark:bg-accent/10"
                                                        : "border-zinc-200 dark:border-zinc-700 hover:border-accent hover:bg-zinc-50 text-foreground dark:hover:bg-zinc-800"}`}
                                                >
                                                    <span className="font-sans font-medium">{layout.name}</span>
                                                    <span className="text-xs text-foreground/50">{layout.shots} shot{layout.shots > 1 && "s"}</span>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                    {activeTab === "filter" && (
                                        <motion.div key="filter" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }} className="flex flex-col gap-2">
                                            {FILTERS.map((filter, i) => (
                                                <motion.button
                                                    key={filter.id}
                                                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, duration: 0.2 }}
                                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                    onClick={() => setSelectedFilter(filter)}
                                                    className={`w-full px-4 py-2.5 rounded-xl font-sans text-sm transition-all border text-left ${selectedFilter.id === filter.id
                                                        ? "bg-foreground text-background shadow-lg border-foreground"
                                                        : "bg-white text-foreground border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"}`}
                                                >
                                                    {filter.name}
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                    {activeTab === "frame" && (
                                        <motion.div key="frame" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }} className="grid grid-cols-2 gap-2">
                                            {currentFrames.map((frame, i) => (
                                                <motion.button
                                                    key={frame.id}
                                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, duration: 0.2 }}
                                                    whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }}
                                                    onClick={() => setSelectedFrame(frame)}
                                                    className={`aspect-square rounded-xl border-2 transition-all overflow-hidden relative bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center ${selectedFrame.id === frame.id
                                                        ? "border-accent ring-4 ring-accent/20 shadow-md"
                                                        : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-500"}`}
                                                >
                                                    {frame.url ? (
                                                        <img src={frame.url} className="w-full h-full object-contain p-1" alt={frame.name} />
                                                    ) : (
                                                        <span className="text-xs font-sans text-foreground/50">None</span>
                                                    )}
                                                    {selectedFrame.id === frame.id && (
                                                        <motion.div layoutId="frame-selected" className="absolute inset-0 rounded-xl border-2 border-accent pointer-events-none" transition={{ type: "spring", stiffness: 350, damping: 28 }} />
                                                    )}
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Shutter + Cancel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45, delay: 0.35 }}
                            className="flex flex-col items-center gap-3 py-2 shrink-0"
                        >
                            <motion.button
                                onClick={captureSequence}
                                disabled={isCapturing}
                                whileHover={{ scale: 1.08, y: -3 }}
                                whileTap={{ scale: 0.92 }}
                                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                                className="relative flex items-center justify-center rounded-full bg-accent hover:bg-accent-hover text-white shadow-xl shadow-accent/25 hover:shadow-accent/45 transition-colors disabled:opacity-50"
                                style={{ width: 72, height: 72 }}
                            >
                                <motion.div
                                    className="absolute inset-0 rounded-full border-4 border-accent"
                                    animate={isCapturing ? { scale: [1.12, 1.45, 1.12], opacity: [0.6, 0.15, 0.6] } : { scale: 1.12, opacity: 0.4 }}
                                    transition={isCapturing ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                                />
                                <motion.div
                                    animate={isCapturing ? { rotate: 360 } : { rotate: 0 }}
                                    transition={{ duration: 2, repeat: isCapturing ? Infinity : 0, ease: "linear" }}
                                >
                                    <Camera size={28} />
                                </motion.div>
                            </motion.button>
                            <AnimatePresence>
                                {isCapturing && (
                                    <motion.button
                                        key="cancel"
                                        initial={{ opacity: 0, scale: 0.7, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7, y: -8 }}
                                        transition={{ type: "spring", stiffness: 360, damping: 24 }}
                                        onClick={cancelSession}
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground/70 hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors shadow-sm"
                                    >
                                        <X size={12} /> Cancel
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>{/* /Left Controls */}

                    {/* Right: Camera + Preview */}
                    <div className="flex gap-3 lg:gap-4 flex-1 min-h-0 min-w-0 items-start order-1 md:order-2">

                        {/* Camera Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.65, ease: "easeOut" }}
                            className="relative flex-1 min-w-0 flex flex-col justify-center"
                        >
                            <motion.div
                                className="p-[3px] rounded-[22px]"
                                animate={{
                                    boxShadow: isCapturing
                                        ? "0 0 70px rgba(255,107,139,0.65), 0 20px 80px rgba(255,107,139,0.3)"
                                        : "0 0 36px rgba(255,107,139,0.2), 0 12px 48px rgba(255,107,139,0.1)",
                                }}
                                transition={{ duration: 0.6 }}
                                style={{ background: "linear-gradient(135deg, #FF6B8B 0%, #FFB3C6 40%, #FFD4A0 70%, #FF6B8B 100%)" }}
                            >
                                {/*
                                  FIXED camera viewport — always aspect-[4/3].
                                  The sidebar changes width but the feed never resizes
                                  beyond max-height, maintaining a stable lens size.
                                */}
                                <div
                                    className="relative rounded-[20px] overflow-hidden bg-zinc-900"
                                    style={{ aspectRatio: "4 / 3", maxHeight: "calc(100dvh - 230px)", width: "100%" }}
                                >
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        width={800}
                                        height={600}
                                        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-0"
                                        videoConstraints={{ width: 800, height: 600, facingMode: "user" }}
                                        style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }}
                                    />
                                    <div className="absolute inset-0 z-[2] pointer-events-none rounded-[20px]" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)" }} />
                                    <motion.div
                                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent z-[3] pointer-events-none"
                                        animate={{ top: ["0%", "100%"] }}
                                        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                                    />

                                    {selectedLayout.shots > 1 && isCapturing && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full"
                                        >
                                            <span className="text-white text-sm font-medium mr-2">
                                                Shot {Math.min(currentShotIndex + 1, selectedLayout.shots)}/{selectedLayout.shots}
                                            </span>
                                            {Array.from({ length: selectedLayout.shots }).map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={i === currentShotIndex && countdown !== null ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : { scale: 1 }}
                                                    transition={{ repeat: Infinity, duration: 0.7 }}
                                                    className={`w-3 h-3 rounded-full ${i < capturedSequence.length ? "bg-accent" : i === currentShotIndex && countdown !== null ? "bg-white" : "bg-white/30"}`}
                                                />
                                            ))}
                                        </motion.div>
                                    )}

                                    <AnimatePresence mode="popLayout">
                                        {countdown !== null && countdown > 0 && (
                                            <motion.div
                                                key={countdown}
                                                initial={{ opacity: 0, scale: 0.3, rotate: -15 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.8, rotate: 10 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                                            >
                                                <span className="text-9xl font-display font-bold text-white drop-shadow-2xl select-none">{countdown}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

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

                            {/* L-bracket corners */}
                            {([
                                { pos: "top-[-4px] left-[-4px]",   h: "top-0 left-0",   v: "top-0 left-0"   },
                                { pos: "top-[-4px] right-[-4px]",  h: "top-0 right-0",  v: "top-0 right-0"  },
                                { pos: "bottom-[-4px] left-[-4px]",  h: "bottom-0 left-0",  v: "bottom-0 left-0"  },
                                { pos: "bottom-[-4px] right-[-4px]", h: "bottom-0 right-0", v: "bottom-0 right-0" },
                            ] as const).map(({ pos, h, v }, i) => (
                                <motion.div key={i} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 * i, duration: 0.4, ease: "backOut" }} className={`absolute ${pos} w-5 h-5`}>
                                    <div className={`absolute ${h} rounded-full bg-accent shadow-md shadow-accent/60`} style={{ width: 20, height: 3 }} />
                                    <div className={`absolute ${v} rounded-full bg-accent shadow-md shadow-accent/60`} style={{ width: 3, height: 20 }} />
                                </motion.div>
                            ))}
                        </motion.div>{/* /Camera Panel */}

                        {/* Live Preview Sidebar */}
                        <motion.div
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
                            className="hidden lg:flex flex-col items-center shrink-0 gap-2"
                            style={{ width: selectedLayout.id === "strip" ? STRIP_PREVIEW_W : PREVIEW_W }}
                        >
                            <div className="w-full flex items-center justify-between px-1">
                                <span className="text-xs font-sans font-semibold text-foreground/50 uppercase tracking-wider">
                                    {selectedLayout.id === "strip" ? "Strip" : selectedLayout.id === "grid" ? "Grid" : "Single"} Preview
                                </span>
                                <AnimatePresence>
                                    {isCapturing && (
                                        <motion.span key="rec" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} className="text-[10px] font-sans text-accent font-bold animate-pulse">
                                            ● REC
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div
                                className="relative bg-white rounded-xl shadow-xl overflow-hidden border-2 border-zinc-200"
                                style={{ width: selectedLayout.id === "strip" ? STRIP_PREVIEW_W : PREVIEW_W, height: previewHeight }}
                            >
                                {selectedFrame.url && (
                                    <img src={selectedFrame.url} className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" alt="frame overlay" />
                                )}

                                {selectedLayout.id === "strip" && [0, 1, 2, 3].map(idx => {
                                    const scale = STRIP_PREVIEW_W / STRIP_W;
                                    const sTop = stripPhotoY(idx) * scale;
                                    const sLeft = STRIP_PAD * scale;
                                    const w = STRIP_PHOTO_W * scale;
                                    const h = STRIP_PHOTO_H * scale;
                                    const photoSrc = capturedSequence[idx];
                                    return (
                                        <div key={idx} className="absolute overflow-hidden rounded-sm z-[20]" style={{ top: sTop, left: sLeft, width: w, height: h }}>
                                            {photoSrc ? (
                                                <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                                                    src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                                    style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }} alt={`Shot ${idx + 1}`} />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${idx === currentShotIndex && isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>{idx + 1}</div>
                                            )}
                                        </div>
                                    );
                                })}

                                {selectedLayout.id === "grid" && gridPreviewSlots(PREVIEW_W, previewHeight).map((slot, idx) => {
                                    const photoSrc = capturedSequence[idx];
                                    return (
                                        <div key={idx} className="absolute overflow-hidden rounded-sm z-[5]" style={{ top: slot.top, left: slot.left, width: slot.w, height: slot.h }}>
                                            {photoSrc ? (
                                                <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                                                    src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                                    style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }} alt={`Shot ${idx + 1}`} />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${idx === currentShotIndex && isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>{idx + 1}</div>
                                            )}
                                        </div>
                                    );
                                })}

                                {selectedLayout.id === "single" && (() => {
                                    const slot = singlePreviewSlot(PREVIEW_W, previewHeight);
                                    const photoSrc = capturedSequence[0];
                                    return (
                                        <div className="absolute overflow-hidden rounded-sm z-[5]" style={{ top: slot.top, left: slot.left, width: slot.w, height: slot.h }}>
                                            {photoSrc ? (
                                                <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                                                    src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                                    style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }} alt="Shot 1" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>1</div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <span className="text-xs text-foreground/40 font-sans">
                                {selectedLayout.id === "strip" ? "Live Strip Preview" : selectedLayout.id === "grid" ? "Live Grid Preview" : "Live Preview"}
                            </span>
                        </motion.div>
                    </div>{/* /Right column */}
                </motion.div>{/* /Main Row */}
            </div>
        </section>
    );
}


    /* ─── Frame background color derived from frame id ─── */
    const getFrameStyle = (id: string): { bg: string; accent: string } => {
        if (id.includes("blush")) return { bg: "#FDF1F4", accent: "#FF6B8B" };
        if (id.includes("gold")) return { bg: "#FFFDF7", accent: "#D4A574" };
        if (id.includes("watercolor")) return { bg: "#F0F4F8", accent: "#B8D4E3" };
        if (id.includes("lace")) return { bg: "#FFF8F0", accent: "#E8D5C4" };
        if (id.includes("polaroid")) return { bg: "#ffffff", accent: "#e0e0e0" };
        if (id.includes("hearts")) return { bg: "#FFF5F7", accent: "#FFB6C1" };
        if (id.includes("film")) return { bg: "#1a1a1a", accent: "#555555" };
        return { bg: "#FDF1F4", accent: "#FF6B8B" };
    };

    const GRID_SLOTS = [
        { left: "2.75%", top: "3.14%", width: "46.25%", height: "38.86%" },
        { left: "51%", top: "3.14%", width: "46.25%", height: "38.86%" },
        { left: "2.75%", top: "44.29%", width: "46.25%", height: "38.86%" },
        { left: "51%", top: "44.29%", width: "46.25%", height: "38.86%" },
    ];
    const SINGLE_SLOT = { left: "2.5%", top: "2.86%", width: "95%", height: "80%" };

    const frameMountBands = (fs: { bg: string }) => {
        const c = fs.bg;   // shorthand for background color
        if (selectedLayout.id === "grid") return [
            // Top band (above all slots)
            { top: "0%", left: "0%", width: "100%", height: "3.14%" },
            // Left column
            { top: "3.14%", left: "0%", width: "2.75%", height: "80%" },
            // Right column
            { top: "3.14%", left: "97.25%", width: "2.75%", height: "80%" },
            // Vertical center divider (between col 1 and col 2)
            { top: "3.14%", left: "49%", width: "2%", height: "80%" },
            // Horizontal center divider (between row 1 and row 2)
            { top: "42%", left: "2.75%", width: "94.5%", height: "2.29%" },
            // Strip between bottom-of-slots and SVG footer
            { top: "83.14%", left: "0%", width: "100%", height: "2.57%" },
        ].map(s => ({ ...s, bg: c }));

        if (selectedLayout.id === "single") return [
            // Top band
            { top: "0%", left: "0%", width: "100%", height: "2.86%" },
            // Left column
            { top: "2.86%", left: "0%", width: "2.5%", height: "80%" },
            // Right column
            { top: "2.86%", left: "97.5%", width: "2.5%", height: "80%" },
            // Strip between bottom-of-slot and SVG footer
            { top: "82.86%", left: "0%", width: "100%", height: "2.86%" },
        ].map(s => ({ ...s, bg: c }));

        return [];
    };

    const frameStyle = selectedFrame.url ? getFrameStyle(selectedFrame.id) : null;
    const viewfinderSlots = selectedLayout.id === "grid" ? GRID_SLOTS : selectedLayout.id === "single" ? [SINGLE_SLOT] : [];
    const mountBands = frameStyle ? frameMountBands(frameStyle) : [];

    /* ─── Live Preview Sidebar helpers ─── */

    // For grid layout: photo slot positions (scaled to preview width)
    const gridPreviewSlots = (previewW: number, previewH: number) => {
        // Canvas is 800×700 (600 photo + 100 footer)
        const scaleX = previewW / 800;
        const scaleY = (previewH * (600 / 700)) / 600; // scale only photo region
        const padX = 22 * scaleX, padY = 22 * scaleY;
        const gapX = 14 * scaleX, gapY = 14 * scaleY;
        const slotW = (previewW - padX * 2 - gapX) / 2;
        const slotH = ((previewH * 600 / 700) - padY * 2 - gapY) / 2;
        return [0, 1, 2, 3].map(i => ({
            left: padX + (i % 2) * (slotW + gapX),
            top: padY + Math.floor(i / 2) * (slotH + gapY),
            w: slotW,
            h: slotH,
        }));
    };

    // Single layout: one slot
    const singlePreviewSlot = (previewW: number, previewH: number) => {
        const photoH = previewH * (600 / 700);
        return { left: 20 * (previewW / 800), top: 20 * (photoH / 600), w: previewW - 40 * (previewW / 800), h: photoH - 40 * (photoH / 600) };
    };

    // Strip sidebar uses a narrower width so all 4 slots + footer fit in ~390px height
    const STRIP_PREVIEW_W = 150;
    const PREVIEW_W = 200;

    const previewHeight = selectedLayout.id === "strip"
        ? Math.round(STRIP_PREVIEW_W * (STRIP_H / STRIP_W))
        : Math.round(PREVIEW_W * (700 / 800));

    return (
        <section
            id="booth"
            className="min-h-screen bg-white dark:bg-[#1A1A1A] pt-28 pb-16 px-4 sm:px-6 flex flex-col items-center scroll-mt-20"
        >
            <div className="max-w-[1100px] w-full flex flex-col items-center">

            {/* ── Title ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="text-center mb-6 w-full"
            >
                <h2 className="font-display text-4xl mb-2 text-foreground">The Booth</h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="font-sans text-foreground/60"
                >
                    Customize your shot with premium layouts, filters &amp; frames
                </motion.p>
            </motion.div>

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ═══ Main Row: Controls Left + Camera Right ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
                className="flex flex-col md:flex-row gap-5 lg:gap-6 w-full"
            >

                {/* ── Left: Controls Column ── */}
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                    className="flex flex-col gap-4 w-full md:w-60 lg:w-72 md:shrink-0 order-2 md:order-1"
                >
                    {/* Tools Panel */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                        {/* Tab bar */}
                        <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                            {([
                                { key: "layout" as const, icon: <LayoutGrid size={18} />, label: "Layout" },
                                { key: "filter" as const, icon: <Sparkles size={18} />, label: "Filter" },
                                { key: "frame" as const, icon: <ImageIcon size={18} />, label: "Frame" },
                            ]).map(tab => (
                                <motion.button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-4 font-sans font-medium transition-colors relative text-sm ${activeTab === tab.key
                                        ? "text-accent bg-accent/5"
                                        : "text-foreground/60 hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        }`}
                                >
                                    {tab.icon} {tab.label}
                                    {activeTab === tab.key && (
                                        <motion.div
                                            layoutId="tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="p-4 overflow-y-auto" style={{ maxHeight: '320px' }}>
                            <AnimatePresence mode="wait" initial={false}>
                                {activeTab === "layout" && (
                                    <motion.div
                                        key="layout"
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="flex flex-col gap-3"
                                    >
                                        {LAYOUTS.map((layout, i) => (
                                            <motion.button
                                                key={layout.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05, duration: 0.25 }}
                                                whileHover={{ y: -2, scale: 1.03 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => handleLayoutChange(layout)}
                                                className={`w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded-2xl border-2 transition-all ${selectedLayout.id === layout.id
                                                    ? "border-accent bg-blush text-accent dark:bg-accent/10"
                                                    : "border-zinc-200 dark:border-zinc-700 hover:border-accent hover:bg-zinc-50 text-foreground dark:hover:bg-zinc-800"
                                                    }`}
                                            >
                                                <span className="font-sans font-medium">{layout.name}</span>
                                                <span className="text-xs text-foreground/50">{layout.shots} shot{layout.shots > 1 && "s"}</span>
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === "filter" && (
                                    <motion.div
                                        key="filter"
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="flex flex-col gap-2"
                                    >
                                        {FILTERS.map((filter, i) => (
                                            <motion.button
                                                key={filter.id}
                                                initial={{ opacity: 0, scale: 0.85 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.04, duration: 0.22 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setSelectedFilter(filter)}
                                                className={`w-full px-5 py-3 rounded-xl font-sans text-sm transition-all border text-left ${selectedFilter.id === filter.id
                                                    ? "bg-foreground text-background shadow-lg border-foreground"
                                                    : "bg-white text-foreground border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                                                    }`}
                                            >
                                                {filter.name}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === "frame" && (
                                    <motion.div
                                        key="frame"
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        {currentFrames.map((frame, i) => (
                                            <motion.button
                                                key={frame.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.04, duration: 0.22 }}
                                                whileHover={{ scale: 1.06, y: -2 }}
                                                whileTap={{ scale: 0.94 }}
                                                onClick={() => setSelectedFrame(frame)}
                                                className={`aspect-square rounded-xl border-2 transition-all overflow-hidden relative bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center ${selectedFrame.id === frame.id
                                                    ? "border-accent ring-4 ring-accent/20 shadow-md"
                                                    : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-500"
                                                    }`}
                                            >
                                                {frame.url ? (
                                                    <img src={frame.url} className="w-full h-full object-contain p-1" alt={frame.name} />
                                                ) : (
                                                    <span className="text-xs font-sans text-foreground/50">None</span>
                                                )}
                                                {selectedFrame.id === frame.id && (
                                                    <motion.div
                                                        layoutId="frame-selected"
                                                        className="absolute inset-0 rounded-xl border-2 border-accent pointer-events-none"
                                                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                                    />
                                                )}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Shutter + Cancel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
                        className="flex flex-col items-center justify-center gap-3 py-2"
                    >
                        <motion.button
                            onClick={captureSequence}
                            disabled={isCapturing}
                            whileHover={{ scale: 1.1, y: -4 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 380, damping: 18 }}
                            className="relative flex items-center justify-center w-20 h-20 rounded-full bg-accent hover:bg-accent-hover text-white shadow-xl shadow-accent/25 hover:shadow-accent/45 transition-colors disabled:opacity-50"
                        >
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-accent"
                                animate={isCapturing
                                    ? { scale: [1.12, 1.45, 1.12], opacity: [0.6, 0.15, 0.6] }
                                    : { scale: 1.12, opacity: 0.4 }}
                                transition={isCapturing
                                    ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" }
                                    : { duration: 0.3 }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-accent/30"
                                animate={isCapturing
                                    ? { scale: [1.25, 1.65, 1.25], opacity: [0.4, 0, 0.4] }
                                    : { scale: 1.28, opacity: 0.2 }}
                                transition={isCapturing
                                    ? { duration: 0.85, repeat: Infinity, ease: "easeInOut", delay: 0.15 }
                                    : { duration: 0.3 }}
                            />
                            <motion.div
                                animate={isCapturing ? { rotate: 360 } : { rotate: 0 }}
                                transition={{ duration: 2, repeat: isCapturing ? Infinity : 0, ease: "linear" }}
                            >
                                <Camera size={32} />
                            </motion.div>
                        </motion.button>

                        <AnimatePresence>
                            {isCapturing && (
                                <motion.button
                                    key="cancel"
                                    initial={{ opacity: 0, scale: 0.7, y: -8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.7, y: -8 }}
                                    transition={{ type: "spring", stiffness: 360, damping: 24 }}
                                    onClick={cancelSession}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground/70 hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium transition-colors shadow-sm"
                                >
                                    <X size={14} /> Cancel
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>{/* /Left Controls Column */}

                {/* ── Right: Camera + Preview ── */}
                <div className="flex gap-4 lg:gap-6 flex-1 min-w-0 w-full items-start order-1 md:order-2">

                {/* ── Camera Panel ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="relative flex-1 min-w-0"
                >
                    {/* Gradient border — glows while capturing */}
                        <motion.div
                            className="p-[3px] rounded-[22px]"
                            animate={{
                                boxShadow: isCapturing
                                    ? "0 0 70px rgba(255,107,139,0.65), 0 20px 80px rgba(255,107,139,0.3)"
                                    : "0 0 36px rgba(255,107,139,0.2), 0 12px 48px rgba(255,107,139,0.1)",
                            }}
                            transition={{ duration: 0.6 }}
                            style={{
                                background: "linear-gradient(135deg, #FF6B8B 0%, #FFB3C6 40%, #FFD4A0 70%, #FF6B8B 100%)",
                            }}
                        >
                            <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-zinc-900">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    width={800}
                                    height={600}
                                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-0"
                                    videoConstraints={{ width: 800, height: 600, facingMode: "user" }}
                                    style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }}
                                />

                                {/* Lens vignette */}
                                <div
                                    className="absolute inset-0 z-[2] pointer-events-none rounded-[20px]"
                                    style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)" }}
                                />

                                {/* Scan line */}
                                <motion.div
                                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent z-[3] pointer-events-none"
                                    animate={{ top: ["0%", "100%"] }}
                                    transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                                />

                                {/* Shot progress dots */}
                                {selectedLayout.shots > 1 && isCapturing && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full"
                                    >
                                        <span className="text-white text-sm font-medium mr-2">
                                            Shot {Math.min(currentShotIndex + 1, selectedLayout.shots)}/{selectedLayout.shots}
                                        </span>
                                        {Array.from({ length: selectedLayout.shots }).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={i === currentShotIndex && countdown !== null
                                                    ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }
                                                    : { scale: 1 }}
                                                transition={{ repeat: Infinity, duration: 0.7 }}
                                                className={`w-3 h-3 rounded-full ${i < capturedSequence.length ? "bg-accent" :
                                                    i === currentShotIndex && countdown !== null ? "bg-white" :
                                                        "bg-white/30"}`}
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
                                            initial={{ opacity: 1 }}
                                            animate={{ opacity: 0 }}
                                            transition={{ duration: 0.55 }}
                                            className="absolute inset-0 bg-white z-30 pointer-events-none"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* L-bracket corner accents */}
                        {[
                            { pos: "top-[-4px] left-[-4px]", h: "top-0 left-0", v: "top-0 left-0" },
                            { pos: "top-[-4px] right-[-4px]", h: "top-0 right-0", v: "top-0 right-0" },
                            { pos: "bottom-[-4px] left-[-4px]", h: "bottom-0 left-0", v: "bottom-0 left-0" },
                            { pos: "bottom-[-4px] right-[-4px]", h: "bottom-0 right-0", v: "bottom-0 right-0" },
                        ].map(({ pos, h, v }, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.08 * i, duration: 0.45, ease: "backOut" }}
                                className={`absolute ${pos} w-5 h-5`}
                            >
                                <div className={`absolute ${h} rounded-full bg-accent shadow-md shadow-accent/60`} style={{ width: 20, height: 3 }} />
                                <div className={`absolute ${v} rounded-full bg-accent shadow-md shadow-accent/60`} style={{ width: 3, height: 20 }} />
                            </motion.div>
                        ))}
                </motion.div>{/* /camera panel */}

                {/* ── Live Preview Sidebar ── */}
                <motion.div
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
                    className="hidden lg:flex flex-col items-center shrink-0 gap-3"
                    style={{ width: selectedLayout.id === "strip" ? STRIP_PREVIEW_W : PREVIEW_W }}
                >
                    <div className="w-full flex items-center justify-between px-1">
                        <span className="text-xs font-sans font-semibold text-foreground/50 uppercase tracking-wider">
                            {selectedLayout.id === "strip" ? "Strip" : selectedLayout.id === "grid" ? "Grid" : "Single"} Preview
                        </span>
                        <AnimatePresence>
                            {isCapturing && (
                                <motion.span
                                    key="rec"
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.7 }}
                                    className="text-[10px] font-sans text-accent font-bold animate-pulse"
                                >
                                    ● REC
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    <div
                        className="relative bg-white rounded-xl shadow-xl overflow-hidden border-2 border-zinc-200"
                        style={{
                            width: selectedLayout.id === "strip" ? STRIP_PREVIEW_W : PREVIEW_W,
                            height: previewHeight,
                        }}
                    >
                        {selectedFrame.url && (
                            <img
                                src={selectedFrame.url}
                                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                                alt="frame overlay"
                            />
                        )}

                        {/* Strip slots */}
                        {selectedLayout.id === "strip" && [0, 1, 2, 3].map(i => {
                            const scale = STRIP_PREVIEW_W / STRIP_W;
                            const top = stripPhotoY(i) * scale;
                            const left = STRIP_PAD * scale;
                            const w = STRIP_PHOTO_W * scale;
                            const h = STRIP_PHOTO_H * scale;
                            const photoSrc = capturedSequence[i];
                            return (
                                <div key={i} className="absolute overflow-hidden rounded-sm z-[20]" style={{ top, left, width: w, height: h }}>
                                    {photoSrc ? (
                                        <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}
                                            src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                            style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }} alt={`Shot ${i + 1}`} />
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className={`w-full h-full flex items-center justify-center text-xs font-sans ${i === currentShotIndex && isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>
                                            {i + 1}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Grid slots */}
                        {selectedLayout.id === "grid" && gridPreviewSlots(PREVIEW_W, previewHeight).map((slot, i) => {
                            const photoSrc = capturedSequence[i];
                            return (
                                <div key={i} className="absolute overflow-hidden rounded-sm z-[5]" style={{ top: slot.top, left: slot.left, width: slot.w, height: slot.h }}>
                                    {photoSrc ? (
                                        <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}
                                            src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                            style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }} alt={`Shot ${i + 1}`} />
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className={`w-full h-full flex items-center justify-center text-xs font-sans ${i === currentShotIndex && isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>
                                            {i + 1}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Single slot */}
                        {selectedLayout.id === "single" && (() => {
                            const slot = singlePreviewSlot(PREVIEW_W, previewHeight);
                            const photoSrc = capturedSequence[0];
                            return (
                                <div className="absolute overflow-hidden rounded-sm z-[5]" style={{ top: slot.top, left: slot.left, width: slot.w, height: slot.h }}>
                                    {photoSrc ? (
                                        <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}
                                            src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                            style={{ filter: selectedFilter.value !== "none" ? selectedFilter.value : "none" }} alt="Shot 1" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>1</div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <span className="text-xs text-foreground/50 font-sans">
                        {selectedLayout.id === "strip" ? "Live Strip Preview" : selectedLayout.id === "grid" ? "Live Grid Preview" : "Live Preview"}
                    </span>
                </motion.div>
                </div>{/* /Right column */}
            </motion.div>{/* /Main Row */}

            </div>{/* /max-w container */}

            {/* ═══ Preview Modal ═══ */}
            <AnimatePresence>
                {capturedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 32, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.85, y: 32, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}
                            className="bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col items-center my-auto"
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12, duration: 0.4 }}
                                className="font-display text-4xl mb-8 text-foreground"
                            >
                                Your Perfect Shot
                            </motion.h3>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-inner overflow-hidden flex items-center justify-center mb-10 py-6"
                            >
                                <img
                                    src={capturedImage}
                                    alt="Captured preview"
                                    className={`object-contain rounded-md shadow-md bg-white ${selectedLayout.id === "strip" ? "h-[65vh] w-auto" : "w-full max-w-2xl"}`}
                                />
                            </motion.div>

                            <div className="flex gap-4 w-full max-w-md">
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => { setCapturedImage(null); setCapturedSequence([]); setCurrentShotIndex(0); }}
                                    className="flex-1 flex justify-center items-center gap-2 py-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                                >
                                    <RefreshCcw size={20} /> Retake
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={handleDownload}
                                    className="flex-1 flex justify-center items-center gap-2 py-4 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover shadow-lg hover:shadow-accent/40 shadow-accent/20 transition"
                                >
                                    <Download size={20} /> Download
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </section>
    );
}
