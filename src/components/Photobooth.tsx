"use client";

import { motion } from "framer-motion";
import ShutterButton from "./photobooth/ShutterButton";
import LivePreview from "./photobooth/LivePreview";
import CameraPanel from "./photobooth/CameraPanel";
import FaceFilterCamera from "./photobooth/FaceFilterCamera";
import ToolsPanel from "./photobooth/ToolsPanel";
import StudioScreen from "./photobooth/StudioScreen";
import { useBoothSettings } from "@/hooks/useBoothSettings";
import { useCapture } from "@/hooks/useCapture";
import { useStudio } from "@/hooks/useStudio";
import { PLACEMENT_DEFAULTS } from "@/lib/faceFilters";

export default function Photobooth() {
    const {
        selectedLayout,
        selectedFilter, setSelectedFilter,
        selectedFrame, setSelectedFrame,
        selectedFaceFilter, setSelectedFaceFilter,
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
        faceFilterCameraRef,
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
        selectedFaceFilter,
        onCaptureComplete: () => setInStudio(true),
    });

    const shotsTotal = selectedLayout.shots;
    const capturedCount = capturedSequence.length;

    // Check if face filter is active
    const useFaceFilter = selectedFaceFilter && selectedFaceFilter.id !== "none";

    // Get placement-specific defaults for face filter
    const placementDefaults = useFaceFilter
        ? PLACEMENT_DEFAULTS[selectedFaceFilter.placement]
        : { offsetY: 0, scale: 1 };

    const handleRetake = () => {
        setInStudio(false);
        resetCapture();
        setStickers([]);

        // Wait for the photobooth layout to render, then anchor it from the bottom.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.getElementById("booth")?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                });
            });
        });
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
            className="relative z-20 isolate flex flex-col overflow-x-hidden overflow-y-visible min-h-[calc(100dvh-var(--header-height))] mt-16 md:mt-20 lg:mt-24"
        >
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#fdf1f4] to-[#fbe8f1]" aria-hidden="true" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-center items-center px-4 sm:px-6 pt-4 lg:pt-6 pb-6 lg:pb-10 gap-4 lg:gap-5">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-[23rem_minmax(0,44rem)_16rem] gap-4 lg:gap-6 items-stretch justify-items-center"
                >
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col gap-4 w-full max-w-[23rem] xl:w-[23rem] xl:min-w-[23rem] xl:max-w-[23rem] shrink-0 order-2 xl:order-1 xl:h-[628px]"
                    >
                        <div className="w-full flex-1 min-h-0 h-[420px] md:h-[460px] xl:h-[460px]">
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
                                selectedFaceFilter={selectedFaceFilter}
                                onFaceFilterChange={setSelectedFaceFilter}
                            />
                        </div>

                        <ShutterButton
                            onCapture={captureSequence}
                            onCancel={cancelSession}
                            isCapturing={isCapturing}
                        />
                    </motion.div>

                    <div className="flex min-w-0 w-full max-w-[44rem] items-center justify-center order-1 xl:order-2 xl:h-[628px]">
                        {useFaceFilter ? (
                            <FaceFilterCamera
                                ref={faceFilterCameraRef}
                                filterValue={selectedFilter.value}
                                filterImage={selectedFaceFilter.image}
                                filterPlacement={selectedFaceFilter.placement}
                                filterScale={selectedFaceFilter.scale ?? placementDefaults.scale}
                                filterOffsetY={selectedFaceFilter.offsetY ?? placementDefaults.offsetY}
                                filterOffsetX={selectedFaceFilter.offsetX ?? 0}
                                isCapturing={isCapturing}
                                shotsTotal={shotsTotal}
                                currentShotIndex={currentShotIndex}
                                capturedCount={capturedCount}
                                countdown={countdown}
                            />
                        ) : (
                            <CameraPanel
                                webcamRef={webcamRef}
                                filterValue={selectedFilter.value}
                                isCapturing={isCapturing}
                                shotsTotal={shotsTotal}
                                currentShotIndex={currentShotIndex}
                                capturedCount={capturedCount}
                                countdown={countdown}
                            />
                        )}
                    </div>

                    <div className="hidden xl:flex w-full justify-center items-center self-stretch order-3">
                        <LivePreview
                            layoutId={selectedLayout.id}
                            selectedFrame={selectedFrame}
                            filterValue={selectedFilter.value}
                            capturedSequence={capturedSequence}
                            currentShotIndex={currentShotIndex}
                            isCapturing={isCapturing}
                            isSourceMirrored={useFaceFilter}
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

