"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Sparkles, Image as ImageIcon } from "lucide-react";
import { LAYOUTS, FILTERS } from "@/lib/constants";
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
}

export default function ToolsPanel({
    activeTab, setActiveTab,
    selectedLayout, onLayoutChange,
    selectedFilter, onFilterChange,
    selectedFrame, onFrameChange,
    frames,
}: ToolsPanelProps) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">

            {/* Tab bar */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                {([
                    { key: "layout" as const, icon: <LayoutGrid size={18} />, label: "Layout" },
                    { key: "filter" as const, icon: <Sparkles   size={18} />, label: "Filter"  },
                    { key: "frame"  as const, icon: <ImageIcon   size={18} />, label: "Frame"   },
                ]).map(tab => (
                    <motion.button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-4 font-sans font-medium transition-colors relative text-sm ${
                            activeTab === tab.key
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
            <div className="p-4 md:p-5 overflow-y-auto h-[320px] md:h-[400px]">
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
                                            : "bg-white text-foreground border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
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
                                    className={`aspect-square rounded-xl border-2 transition-all overflow-hidden relative bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center ${
                                        selectedFrame.id === frame.id
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
    );
}
