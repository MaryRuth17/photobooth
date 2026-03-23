"use client";

import { motion } from "framer-motion";
import ShutterButton from "./photobooth/ShutterButton";
import LivePreview from "./photobooth/LivePreview";
import CameraPanel from "./photobooth/CameraPanel";
import ToolsPanel from "./photobooth/ToolsPanel";
import StudioScreen from "./photobooth/StudioScreen";
import { useBoothSettings } from "@/hooks/useBoothSettings";
import { useCapture } from "@/hooks/useCapture";
import { useStudio } from "@/hooks/useStudio";

export default function Photobooth() {
    const {
        selectedLayout,
        selectedFilter, setSelectedFilter,
        selectedFrame, setSelectedFrame,
        activeTab, setActiveTab,
        currentFrames,
        handleLayoutChange,
    } = useBoothSettings();

    const {
        studioCanvasRef,
        inStudio, setInStudio,
        stickers, setStickers,
        draggingId,
        addSticker, removeSticker,
        onStickerPointerDown, onStickerPointerMove, onStickerPointerUp,
        exportStudio,
    } = useStudio();

    const {
        webcamRef,
        canvasRef,
        capturedImage,
        capturedSequence,
        countdown,
        currentShotIndex,
        isCapturing,
        captureSequence,
        cancelSession,
        resetCapture,
    } = useCapture({
        selectedLayout,
        selectedFilter,
        selectedFrame,
        onCaptureComplete: () => setInStudio(true),
    });

    const shotsTotal = selectedLayout.shots;
    const capturedCount = capturedSequence.length;

    const handleRetake = () => {
        setInStudio(false);
        resetCapture();
        setStickers([]);
    };

    const handleExportStudio = () => {
        if (!capturedImage) {
            return Promise.resolve(null);
        }
        return exportStudio(capturedImage);
    };

    if (inStudio && capturedImage) {
        return (
                <StudioScreen
                capturedImage={capturedImage}
                capturedLayoutId={selectedLayout.id}
                canvasRef={canvasRef}
                studioCanvasRef={studioCanvasRef}
                stickers={stickers}
                draggingId={draggingId}
                onAddSticker={addSticker}
                onRemoveSticker={removeSticker}
                    onStickerPointerDown={onStickerPointerDown}
                onStickerPointerMove={onStickerPointerMove}
                    onStickerPointerUp={onStickerPointerUp}
                    onExport={handleExportStudio}
                onRetake={handleRetake}
            />
        );
    }

    return (
        <section
            id="booth"
            style={{ scrollMarginTop: "calc(var(--header-height) + 1rem)" }}
            className="relative z-20 isolate flex flex-col overflow-x-hidden overflow-y-visible min-h-[calc(100dvh-var(--header-height))]"
        >
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#fdf1f4] to-[#fbe8f1]" aria-hidden="true" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-center items-center px-4 sm:px-6 pt-4 lg:pt-6 pb-6 lg:pb-10 gap-4 lg:gap-5">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="w-full max-w-[1240px] grid grid-cols-1 xl:grid-cols-[16rem_minmax(0,44rem)_13rem] gap-4 lg:gap-6 items-start justify-items-center"
                >
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col gap-3 w-full xl:w-64 shrink-0 order-2 xl:order-1"
                    >
                        <ToolsPanel
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            selectedLayout={selectedLayout}
                            onLayoutChange={handleLayoutChange}
                            selectedFilter={selectedFilter}
                            onFilterChange={setSelectedFilter}
                            selectedFrame={selectedFrame}
                            onFrameChange={setSelectedFrame}
                            frames={currentFrames}
                        />

                        <ShutterButton
                            onCapture={captureSequence}
                            onCancel={cancelSession}
                            isCapturing={isCapturing}
                        />
                    </motion.div>

                    <div className="flex min-w-0 w-full max-w-[44rem] items-start justify-center order-1 xl:order-2">
                        <CameraPanel
                            webcamRef={webcamRef}
                            filterValue={selectedFilter.value}
                            isCapturing={isCapturing}
                            shotsTotal={shotsTotal}
                            currentShotIndex={currentShotIndex}
                            capturedCount={capturedCount}
                            countdown={countdown}
                        />
                    </div>

                    <div className="hidden xl:flex w-full justify-center order-3">
                        <LivePreview
                            layoutId={selectedLayout.id}
                            selectedFrame={selectedFrame}
                            filterValue={selectedFilter.value}
                            capturedSequence={capturedSequence}
                            currentShotIndex={currentShotIndex}
                            isCapturing={isCapturing}
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

