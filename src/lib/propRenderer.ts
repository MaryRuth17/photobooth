import type { FaceData, FilterPlacement } from "@/hooks/useFaceDetection";
import { getRegionForPlacement } from "@/hooks/useFaceDetection";

interface StabilizedRegionPose {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    rotation: number;
    depthScale: number;
}

interface PoseTransformOptions {
    scaleX: number;
    scaleY: number;
    outputWidth: number;
    mirrorX: boolean;
}

interface DrawSize {
    width: number;
    height: number;
}

interface RenderImageOverlayOptions {
    userScale?: number;
    offsetX?: number;
    offsetY?: number;
    opacity?: number;
}

interface FaceFrameRenderOptions {
    ctx: CanvasRenderingContext2D;
    faces: FaceData[];
    canvasWidth: number;
    canvasHeight: number;
    videoWidth: number;
    videoHeight: number;
    filterPlacement: FilterPlacement;
    filterScale?: number;
    filterOffsetX?: number;
    filterOffsetY?: number;
    filterImage?: HTMLImageElement | null;
    mirrorX?: boolean;
    showDebugOverlay?: boolean;
    clearCanvas?: boolean;
}

const FILTER_COVERAGE = 1.2;

function getImageDrawSize(
    image: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
): DrawSize {
    const imgAspect = image.width / image.height;
    const faceAspect = targetWidth / Math.max(1e-5, targetHeight);

    if (imgAspect > faceAspect) {
        const width = targetWidth * FILTER_COVERAGE;
        return {
            width,
            height: width / imgAspect,
        };
    }

    const height = targetHeight * FILTER_COVERAGE;
    return {
        width: height * imgAspect,
        height,
    };
}

function createStabilizedRegionPose(
    face: FaceData,
    placement: FilterPlacement,
    options: PoseTransformOptions,
): StabilizedRegionPose {
    const region = getRegionForPlacement(face, placement);
    const baseRotation = face.roll ?? face.rotation ?? 0;
    const centerX = region.centerX * options.scaleX;

    return {
        centerX: options.mirrorX ? options.outputWidth - centerX : centerX,
        centerY: region.centerY * options.scaleY,
        width: region.width * options.scaleX,
        height: region.height * options.scaleY,
        rotation: options.mirrorX ? -baseRotation : baseRotation,
        depthScale: face.depthScale ?? 1,
    };
}

function renderImageOverlay(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    pose: StabilizedRegionPose,
    options: RenderImageOverlayOptions = {},
): DrawSize {
    const userScale = options.userScale ?? 1;
    const depthScale = pose.depthScale || 1;
    const baseWidth = pose.width * userScale * depthScale;
    const baseHeight = pose.height * userScale * depthScale;
    const drawSize = getImageDrawSize(image, baseWidth, baseHeight);

    ctx.save();
    ctx.globalAlpha = options.opacity ?? 1;
    ctx.translate(pose.centerX, pose.centerY);
    ctx.rotate(pose.rotation);
    ctx.translate(options.offsetX ?? 0, options.offsetY ?? 0);
    ctx.drawImage(
        image,
        -drawSize.width / 2,
        -drawSize.height / 2,
        drawSize.width,
        drawSize.height,
    );
    ctx.restore();

    return drawSize;
}

function drawDebugBounds(
    ctx: CanvasRenderingContext2D,
    pose: StabilizedRegionPose,
    drawSize: DrawSize,
    offsetX: number,
    offsetY: number,
) {
    ctx.save();
    ctx.translate(pose.centerX, pose.centerY);
    ctx.rotate(pose.rotation);
    ctx.translate(offsetX, offsetY);
    ctx.strokeStyle = "#FF6B8B";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        -drawSize.width / 2,
        -drawSize.height / 2,
        drawSize.width,
        drawSize.height,
    );
    ctx.restore();

    ctx.fillStyle = "#FF6B8B";
    ctx.font = "12px monospace";
    ctx.fillText(
        `Rotation: ${(pose.rotation * 180 / Math.PI).toFixed(1)} deg`,
        pose.centerX - drawSize.width / 2,
        pose.centerY - drawSize.height / 2 - 8,
    );
}

export function renderFaceFrame(options: FaceFrameRenderOptions) {
    const {
        ctx,
        faces,
        canvasWidth,
        canvasHeight,
        videoWidth,
        videoHeight,
        filterPlacement,
        filterScale = 1,
        filterOffsetX = 0,
        filterOffsetY = 0,
        filterImage,
        mirrorX = true,
        showDebugOverlay = false,
        clearCanvas = true,
    } = options;

    if (clearCanvas) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    if (videoWidth <= 0 || videoHeight <= 0 || faces.length === 0) {
        return;
    }

    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;
    const overlayOffsetX = mirrorX ? -filterOffsetX : filterOffsetX;

    for (const face of faces) {
        const filterPose = createStabilizedRegionPose(face, filterPlacement, {
            scaleX,
            scaleY,
            outputWidth: canvasWidth,
            mirrorX,
        });

        if (filterImage) {
            const drawSize = renderImageOverlay(ctx, filterImage, filterPose, {
                userScale: filterScale,
                offsetX: overlayOffsetX,
                offsetY: filterOffsetY,
            });

            if (showDebugOverlay) {
                drawDebugBounds(ctx, filterPose, drawSize, overlayOffsetX, filterOffsetY);
            }
        }
    }
}
