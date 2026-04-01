"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Sparkles, Image as ImageIcon, Smile, X } from "lucide-react";
import { LAYOUTS, FILTERS } from "@/lib/constants";
import { FACE_FILTERS, FaceFilter, PLACEMENT_DEFAULTS } from "@/lib/faceFilters";
import type { ActiveTab, FrameItem } from "@/hooks/useBoothSettings";

interface ToolsPanelProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    selectedLayout: typeof LAYOUTS[number];
    onLayoutChange: (layout: typeof LAYOUTS[number]) => void;
    selectedFilter: typeof FILTERS[number];
    onFilterChange: (filter: typeof FILTERS[number]) => void;
    selectedFrame: FrameItem;
    onFrameChange: (frame: FrameItem) => void;
    frames: FrameItem[];
    selectedFaceFilter: FaceFilter;
    onFaceFilterChange: (filter: FaceFilter) => void;
}

export default function ToolsPanel({
    activeTab, setActiveTab,
    selectedLayout, onLayoutChange,
    selectedFilter, onFilterChange,
    selectedFrame, onFrameChange,
    frames,
    selectedFaceFilter, onFaceFilterChange,
}: ToolsPanelProps) {
    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-zinc-100 h-full min-h-[420px] max-h-[420px] md:min-h-[460px] md:max-h-[460px] xl:min-h-[460px] xl:max-h-[460px] flex flex-col">

            {/* Tab bar */}
            <div className="flex border-b border-zinc-100 px-2 py-1 gap-1">
                {([
                    { key: "layout" as const, icon: <LayoutGrid size={18} />, label: "Layout" },
                    { key: "filter" as const, icon: <Sparkles   size={18} />, label: "Filter"  },
                    { key: "frame"  as const, icon: <ImageIcon   size={18} />, label: "Frame"   },
                    { key: "faceFilter" as const, icon: <Smile size={18} />, label: "Face" },
                ]).map(tab => (
                    <motion.button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3.5 font-sans font-medium transition-colors relative rounded-xl text-[11px] sm:text-sm ${
                            activeTab === tab.key
                                ? "text-accent bg-accent/5"
                                : "text-foreground/60 hover:text-foreground hover:bg-zinc-50"
                        }`}
                    >
                        {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
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
            <div className="p-5 md:p-6 overflow-y-auto flex-1 min-h-0">
                <AnimatePresence mode="wait" initial={false}>
                    {activeTab === "layout" && (
                        <motion.div key="layout" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
                            {LAYOUTS.map((layout, i) => (
                                <motion.button
                                    key={layout.id}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
                                    onClick={() => onLayoutChange(layout)}
                                    className={`w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded-2xl border-2 transition-all ${
                                        selectedLayout.id === layout.id
                                            ? "border-accent bg-blush text-accent"
                                            : "border-zinc-200 hover:border-accent hover:bg-zinc-50 text-foreground"
                                    }`}
                                >
                                    <span className="font-sans font-medium">{layout.name}</span>
                                    <span className="text-xs text-foreground/50">{layout.shots} shot{layout.shots > 1 && "s"}</span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === "filter" && (
                        <motion.div key="filter" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} className="flex flex-col gap-2">
                            {FILTERS.map((filter, i) => (
                                <motion.button
                                    key={filter.id}
                                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => onFilterChange(filter)}
                                    className={`w-full px-5 py-3 rounded-xl font-sans text-sm transition-all border text-left ${
                                        selectedFilter.id === filter.id
                                            ? "bg-foreground text-background shadow-lg border-foreground"
                                            : "bg-white text-foreground border-zinc-200 hover:border-zinc-300"
                                    }`}
                                >
                                    {filter.name}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === "frame" && (
                        <motion.div key="frame" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} className="grid grid-cols-2 gap-3">
                            {frames.map((frame, i) => (
                                <motion.button
                                    key={frame.id}
                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                                    whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }}
                                    onClick={() => onFrameChange(frame)}
                                    className={`aspect-square rounded-xl border-2 transition-all overflow-hidden relative bg-zinc-50 flex items-center justify-center ${
                                        selectedFrame.id === frame.id
                                            ? "border-accent ring-4 ring-accent/20 shadow-md"
                                            : "border-transparent hover:border-zinc-300"
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

                    {activeTab === "faceFilter" && (
                        <motion.div key="faceFilter" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
                            <p className="text-xs text-foreground/60 text-center">
                                AR face filters track your face in real-time
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {FACE_FILTERS.map((filter, i) => {
                                    const isSelected = filter.id === selectedFaceFilter.id;
                                    const isNone = filter.id === "none";

                                    return (
                                        <motion.button
                                            key={filter.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            whileHover={{ scale: 1.08, y: -2 }}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => onFaceFilterChange(filter)}
                                            className={`
                                                relative aspect-square rounded-xl overflow-hidden
                                                border-2 transition-all duration-200 bg-zinc-100
                                                ${isSelected
                                                    ? "border-accent ring-2 ring-accent/30 shadow-lg"
                                                    : "border-zinc-200 hover:border-accent/50"
                                                }
                                            `}
                                        >
                                            {isNone ? (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-50">
                                                    <X className="w-5 h-5 text-zinc-400" />
                                                </div>
                                            ) : filter.image ? (
                                                <img
                                                    src={filter.image}
                                                    alt={filter.name}
                                                    className="w-full h-full object-contain p-2 bg-zinc-50"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-50">
                                                    <Smile className="w-5 h-5 text-accent" />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            {/* Selected filter name */}
                            <p className="text-sm font-medium text-center text-foreground">
                                {selectedFaceFilter.name}
                            </p>
                            {/* Placement badge */}
                            {selectedFaceFilter.id !== "none" && (
                                <div className="flex justify-center">
                                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                                        {selectedFaceFilter.placement.replace("-", " ")}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
