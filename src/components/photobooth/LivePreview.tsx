"use client";

import { motion, AnimatePresence } from "framer-motion";
import { STRIP_W, STRIP_H, STRIP_PAD, STRIP_PHOTO_W, STRIP_PHOTO_H, STRIP_GAP } from "@/lib/constants";
import type { FrameItem } from "@/hooks/useBoothSettings";

// Responsive preview widths
const getPreviewDimensions = (): { strip: number; standard: number } => {
    // These will be overridden by responsive Tailwind classes
    // Fallback to desktop sizes
    return { strip: 150, standard: 200 };
};

function stripPhotoY(i: number) {
    return STRIP_PAD + i * (STRIP_PHOTO_H + STRIP_GAP);
}

function gridPreviewSlots(previewW: number, previewH: number) {
    const scaleX = previewW / 800;
    const scaleY = (previewH * (600 / 700)) / 600;
    const padX = 22 * scaleX, padY = 22 * scaleY;
    const gapX = 14 * scaleX, gapY = 14 * scaleY;
    const slotW = (previewW - padX * 2 - gapX) / 2;
    const slotH = ((previewH * 600 / 700) - padY * 2 - gapY) / 2;
    return [0, 1, 2, 3].map(i => ({
        left: padX + (i % 2) * (slotW + gapX),
        top: padY + Math.floor(i / 2) * (slotH + gapY),
        w: slotW, h: slotH,
    }));
}

function singlePreviewSlot(previewW: number, previewH: number) {
    const photoH = previewH * (600 / 700);
    return {
        left: 20 * (previewW / 800),
        top: 20 * (photoH / 600),
        w: previewW - 40 * (previewW / 800),
        h: photoH - 40 * (photoH / 600),
    };
}

interface LivePreviewProps {
    layoutId: string;
    selectedFrame: FrameItem;
    filterValue: string;
    capturedSequence: string[];
    currentShotIndex: number;
    isCapturing: boolean;
}

export default function LivePreview({
    layoutId, selectedFrame, filterValue,
    capturedSequence, currentShotIndex, isCapturing,
}: LivePreviewProps) {
    // Responsive preview dimensions - scale based on layout
    const baseStripW = 150;
    const baseStandardW = 200;

    const previewW = layoutId === "strip" ? baseStripW : baseStandardW;
    const previewH = layoutId === "strip"
        ? Math.round(baseStripW * (STRIP_H / STRIP_W))
        : Math.round(baseStandardW * (700 / 800));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
            className="hidden lg:flex flex-col items-center shrink-0 gap-3 md:max-w-[150px]"
            style={{ width: previewW }}
        >
            <div className="w-full flex items-center justify-between px-1">
                <span className="text-xs font-sans font-semibold text-foreground/50 uppercase tracking-wider">
                    {layoutId === "strip" ? "Strip" : layoutId === "grid" ? "Grid" : "Single"} Preview
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
                style={{ width: previewW, height: previewH }}
            >
                {selectedFrame.url && (
                    <img src={selectedFrame.url} className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" alt="frame overlay" />
                )}

                {/* Strip slots */}
                {layoutId === "strip" && [0, 1, 2, 3].map(i => {
                    const scale = STRIP_PREVIEW_W / STRIP_W;
                    const photoSrc = capturedSequence[i];
                    return (
                        <div key={i} className="absolute overflow-hidden rounded-sm z-[20]" style={{ top: stripPhotoY(i) * scale, left: STRIP_PAD * scale, width: STRIP_PHOTO_W * scale, height: STRIP_PHOTO_H * scale }}>
                            {photoSrc ? (
                                <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
                                    src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                    style={{ filter: filterValue !== "none" ? filterValue : "none" }} alt={`Shot ${i + 1}`} />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${i === currentShotIndex && isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>{i + 1}</div>
                            )}
                        </div>
                    );
                })}

                {/* Grid slots */}
                {layoutId === "grid" && gridPreviewSlots(previewW, previewH).map((slot, i) => {
                    const photoSrc = capturedSequence[i];
                    return (
                        <div key={i} className="absolute overflow-hidden rounded-sm z-[5]" style={{ top: slot.top, left: slot.left, width: slot.w, height: slot.h }}>
                            {photoSrc ? (
                                <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
                                    src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                    style={{ filter: filterValue !== "none" ? filterValue : "none" }} alt={`Shot ${i + 1}`} />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${i === currentShotIndex && isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>{i + 1}</div>
                            )}
                        </div>
                    );
                })}

                {/* Single slot */}
                {layoutId === "single" && (() => {
                    const slot = singlePreviewSlot(previewW, previewH);
                    const photoSrc = capturedSequence[0];
                    return (
                        <div className="absolute overflow-hidden rounded-sm z-[5]" style={{ top: slot.top, left: slot.left, width: slot.w, height: slot.h }}>
                            {photoSrc ? (
                                <motion.img key={photoSrc} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
                                    src={photoSrc} className="w-full h-full object-cover scale-x-[-1]"
                                    style={{ filter: filterValue !== "none" ? filterValue : "none" }} alt="Shot 1" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center text-xs font-sans ${isCapturing ? "bg-accent/10 text-accent animate-pulse" : "bg-zinc-100 text-zinc-400"}`}>1</div>
                            )}
                        </div>
                    );
                })()}
            </div>

            <span className="text-xs text-foreground/50 font-sans">
                {layoutId === "strip" ? "Live Strip Preview" : layoutId === "grid" ? "Live Grid Preview" : "Live Preview"}
            </span>
        </motion.div>
    );
}
