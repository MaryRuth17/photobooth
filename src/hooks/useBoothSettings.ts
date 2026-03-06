import { useState } from "react";
import { FILTERS, FRAMES, GRID_FRAMES, STRIP_FRAMES, LAYOUTS } from "@/lib/constants";

export type ActiveTab = "layout" | "filter" | "frame";
export type FrameItem = { id: string; name: string; url: string | null };

export function useBoothSettings() {
    const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
    const [selectedFrame, setSelectedFrame] = useState<FrameItem>(FRAMES[0]);
    const [activeTab, setActiveTab] = useState<ActiveTab>("layout");

    const getFramesForLayout = (layoutId: string): FrameItem[] => {
        if (layoutId === "grid") return GRID_FRAMES;
        if (layoutId === "strip") return STRIP_FRAMES;
        return FRAMES;
    };

    const currentFrames = getFramesForLayout(selectedLayout.id);

    const handleLayoutChange = (layout: typeof LAYOUTS[number]) => {
        setSelectedLayout(layout);
        setSelectedFrame(getFramesForLayout(layout.id)[0]);
    };

    return {
        selectedLayout,
        selectedFilter, setSelectedFilter,
        selectedFrame, setSelectedFrame,
        activeTab, setActiveTab,
        currentFrames,
        handleLayoutChange,
    };
}
