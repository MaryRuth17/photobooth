"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Camera, X } from "lucide-react";

interface ShutterButtonProps {
    onCapture: () => void;
    onCancel: () => void;
    isCapturing: boolean;
}

export default function ShutterButton({ onCapture, onCancel, isCapturing }: ShutterButtonProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col items-center justify-center gap-2 py-2 min-h-[9.5rem]"
        >
            <motion.button
                onClick={onCapture}
                disabled={isCapturing}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="relative flex items-center justify-center w-20 h-20 rounded-full bg-accent hover:bg-accent-hover text-white shadow-xl shadow-accent/25 hover:shadow-accent/45 transition-colors disabled:opacity-50"
            >
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-accent"
                    animate={isCapturing ? { scale: [1.12, 1.45, 1.12], opacity: [0.6, 0.15, 0.6] } : { scale: 1.12, opacity: 0.4 }}
                    transition={isCapturing ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                />
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-accent/30"
                    animate={isCapturing ? { scale: [1.25, 1.65, 1.25], opacity: [0.4, 0, 0.4] } : { scale: 1.28, opacity: 0.2 }}
                    transition={isCapturing ? { duration: 0.85, repeat: Infinity, ease: "easeInOut", delay: 0.15 } : { duration: 0.3 }}
                />
                <motion.div
                    animate={isCapturing ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 2, repeat: isCapturing ? Infinity : 0, ease: "linear" }}
                >
                    <Camera size={32} />
                </motion.div>
            </motion.button>

            <div className="relative h-10 w-full flex items-center justify-center">
                <AnimatePresence>
                    {isCapturing && (
                        <motion.button
                            key="cancel"
                            initial={{ opacity: 0, scale: 0.7, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.7, y: -8 }}
                            transition={{ type: "spring", stiffness: 360, damping: 24 }}
                            onClick={onCancel}
                            className="absolute flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-foreground/70 hover:text-foreground hover:bg-zinc-200 text-sm font-medium transition-colors shadow-sm"
                        >
                            <X size={14} /> Cancel
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
