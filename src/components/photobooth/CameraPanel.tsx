"use client";

import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";

interface CameraPanelProps {
    webcamRef: React.RefObject<Webcam | null>;
    filterValue: string;
    isCapturing: boolean;
    shotsTotal: number;
    currentShotIndex: number;
    capturedCount: number;
    countdown: number | null;
}

export default function CameraPanel({
    webcamRef, filterValue, isCapturing,
    shotsTotal, currentShotIndex, capturedCount, countdown,
}: CameraPanelProps) {
    return (
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
                style={{ background: "linear-gradient(135deg, #FF6B8B 0%, #FFB3C6 40%, #FFD4A0 70%, #FF6B8B 100%)" }}
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
                        style={{ filter: filterValue !== "none" ? filterValue : "none" }}
                    />

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
}
