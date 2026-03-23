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
            className="flex flex-col overflow-hidden bg-white dark:bg-[#1A1A1A] scroll-mt-20 viewport-height"
        >
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex-1 min-h-0 flex flex-col items-center px-4 sm:px-6 py-6 lg:py-14 gap-10">
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="text-center shrink-0 w-full max-w-6xl"
                >
                    <h2 className="font-display text-3xl lg:text-4xl mb-1 text-foreground">Yshots Photobooth</h2>
                    <p className="font-sans text-sm text-foreground/60">
                        Customize your shot with layouts, filters &amp; frames
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="flex flex-col md:flex-row gap-4 lg:gap-5 flex-1 min-h-0 items-center justify-center w-full max-w-6xl"
                >
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col gap-3 w-full md:w-56 lg:w-64 shrink-0 order-2 md:order-1 overflow-y-auto"
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

                    <div className="flex gap-3 lg:gap-4 flex-1 min-h-0 min-w-0 items-center justify-center order-1 md:order-2">
                        <CameraPanel
                            webcamRef={webcamRef}
                            filterValue={selectedFilter.value}
                            isCapturing={isCapturing}
                            shotsTotal={shotsTotal}
                            currentShotIndex={currentShotIndex}
                            capturedCount={capturedCount}
                            countdown={countdown}
                        />

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

