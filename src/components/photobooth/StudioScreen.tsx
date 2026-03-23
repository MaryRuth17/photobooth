"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Wand2, ChevronLeft } from "lucide-react";
import { STICKER_PALETTE } from "@/lib/stickers";
import type { PlacedSticker } from "@/lib/stickers";
import { STRIP_W, STRIP_H } from "@/lib/constants";

interface StudioScreenProps {
    capturedImage: string;
    capturedLayoutId: string;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    studioCanvasRef: React.RefObject<HTMLDivElement | null>;
    stickers: PlacedSticker[];
    draggingId: string | null;
    onAddSticker: (emoji: string) => void;
    onRemoveSticker: (id: string) => void;
    onStickerPointerDown: (e: React.PointerEvent, id: string) => void;
    onStickerPointerMove: (e: React.PointerEvent) => void;
    onStickerPointerUp: () => void;
    onExport: () => Promise<string | null>;
    onRetake: () => void;
}

export default function StudioScreen({
    capturedImage, capturedLayoutId, canvasRef, studioCanvasRef,
    stickers, draggingId,
    onAddSticker, onRemoveSticker,
    onStickerPointerDown, onStickerPointerMove, onStickerPointerUp,
    onExport, onRetake,
}: StudioScreenProps) {
    const [isReviewPhase, setIsReviewPhase] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const [exportedImage, setExportedImage] = useState<string | null>(null);

    const handleDownload = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const dataUrl = await onExport();
            if (dataUrl) {
                setExportedImage(dataUrl);
                setShowSavePrompt(true);
            }
        } finally {
            setIsExporting(false);
        }
    };

    const handleSaveToGallery = async () => {
        if (!exportedImage) {
            setShowSavePrompt(false);
            return;
        }
        try {
            await fetch("/api/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageData: exportedImage }),
            });
        } catch {
            // ignore errors for now
        } finally {
            setShowSavePrompt(false);
        }
    };

    const handleSkipSave = () => {
        setShowSavePrompt(false);
    };
    if (isReviewPhase) {
        return (
            <motion.section
                key="review"
                id="booth"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex flex-col overflow-hidden bg-white dark:bg-[#1A1A1A] scroll-mt-20 viewport-height"
            >
                {/* Header — Review Phase */}
                <div className="flex items-center px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <h2 className="font-display text-xl text-foreground">Review Your Photo</h2>
                </div>

                {/* Body — Review Phase */}
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 p-6">
                    {/* Photo Display */}
                    <div
                        ref={studioCanvasRef}
                        className="relative rounded-2xl overflow-hidden shadow-2xl select-none"
                        style={{
                            aspectRatio: capturedLayoutId === "strip" ? `${STRIP_W} / ${STRIP_H}` : "800 / 700",
                            maxHeight: "calc(100dvh - var(--header-height) - 200px)",
                            width: "auto",
                            maxWidth: "100%",
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={capturedImage}
                            alt="Your photo"
                            className="w-full h-full object-cover block"
                            draggable={false}
                        />
                    </div>

                    {/* Keep/Retake Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.2 }}
                        className="flex gap-3 justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={onRetake}
                            className="px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-700 text-foreground font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                            <ChevronLeft size={16} className="inline mr-1" /> Retake
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setIsReviewPhase(false)}
                            className="px-6 py-3 rounded-full bg-accent text-white font-medium text-sm shadow-lg shadow-accent/25 hover:bg-accent-hover transition-colors"
                        >
                            Keep Photo
                        </motion.button>
                    </motion.div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </motion.section>
        );
    }

    return (
        <motion.section
            key="studio"
            id="booth"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col overflow-hidden bg-white dark:bg-[#1A1A1A] scroll-mt-20 viewport-height"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setIsReviewPhase(true)}
                        className="flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
                    >
                        <ChevronLeft size={18} /> Back to Review
                    </motion.button>
                    <span className="text-foreground/20 select-none">|</span>
                    <div className="flex items-center gap-2">
                        <Wand2 size={18} className="text-accent" />
                        <span className="font-display text-xl text-foreground">The Studio</span>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white font-medium text-sm shadow-lg shadow-accent/25 hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Download size={16} /> {isExporting ? "Preparing..." : "Download"}
                </motion.button>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 gap-4 p-4 lg:p-5">

                {/* Sticker palette — desktop sidebar */}
                <div className="hidden lg:flex flex-col shrink-0 w-52 gap-3">
                    <p className="text-xs font-sans font-semibold text-foreground/50 uppercase tracking-wider px-1">Stickers</p>
                    <div className="flex-1 overflow-y-auto rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
                        <div className="grid grid-cols-4 gap-2">
                            {STICKER_PALETTE.map(s => (
                                <motion.button
                                    key={s.id}
                                    whileHover={{ scale: 1.2, y: -3 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => onAddSticker(s.emoji)}
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
                                onClick={() => onAddSticker(s.emoji)}
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
                            aspectRatio: capturedLayoutId === "strip" ? `${STRIP_W} / ${STRIP_H}` : "800 / 700",
                            maxHeight: "calc(100dvh - var(--header-height) - 180px)",
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
                                    onPointerDown={e => { e.stopPropagation(); onRemoveSticker(s.id); }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <AnimatePresence>
                {showSavePrompt && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
                        >
                            <h3 className="font-display text-lg text-foreground mb-2">
                                Save this photo to our gallery?
                            </h3>
                            <p className="text-sm text-foreground/70 font-sans mb-4">
                                With your permission, we can feature this shot in the public gallery on this site.
                                You can always download without saving if you prefer.
                            </p>
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={handleSkipSave}
                                    className="px-4 py-2 rounded-full text-sm font-medium font-sans border border-zinc-200 dark:border-zinc-700 text-foreground/80 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                >
                                    No, just download
                                </button>
                                <button
                                    onClick={handleSaveToGallery}
                                    className="px-4 py-2 rounded-full text-sm font-medium font-sans bg-accent text-white hover:bg-accent-hover"
                                >
                                    Yes, add to gallery
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    );
}
