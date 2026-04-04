import { useRef, useState } from "react";
import type { PlacedSticker, StickerDefinition } from "@/lib/stickers";

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load sticker image: ${src}`));
        img.src = src;
    });
};

export function useStudio() {
    const studioCanvasRef = useRef<HTMLDivElement>(null);
    const [inStudio, setInStudio] = useState(false);
    const [stickers, setStickers] = useState<PlacedSticker[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const addSticker = (sticker: StickerDefinition) => {
        const container = studioCanvasRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        setStickers(prev => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                stickerId: sticker.id,
                imageUrl: sticker.imageUrl,
                emoji: sticker.emoji,
                x: rect.width / 2,
                y: rect.height / 2,
                size: 52,
                rotation: Math.round((Math.random() - 0.5) * 30),
            },
        ]);
    };

    const removeSticker = (id: string) => setStickers(prev => prev.filter(s => s.id !== id));

    const onStickerPointerDown = (e: React.PointerEvent, id: string) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const sticker = stickers.find(s => s.id === id);
        if (!sticker) return;
        setDraggingId(id);
        setDragOffset({ x: e.clientX - sticker.x, y: e.clientY - sticker.y });
    };

    const onStickerPointerMove = (e: React.PointerEvent) => {
        if (!draggingId) return;
        const container = studioCanvasRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        setStickers(prev =>
            prev.map(s =>
                s.id === draggingId
                    ? {
                        ...s,
                        x: Math.max(0, Math.min(rect.width,  e.clientX - dragOffset.x)),
                        y: Math.max(0, Math.min(rect.height, e.clientY - dragOffset.y)),
                    }
                    : s
            )
        );
    };

    const onStickerPointerUp = () => setDraggingId(null);

    const exportStudio = (capturedImage: string): Promise<string | null> => {
        return new Promise(resolve => {
            const container = studioCanvasRef.current;
            if (!container) {
                resolve(null);
                return;
            }
            const rect = container.getBoundingClientRect();
            const exportCanvas = document.createElement("canvas");
            const exportCtx = exportCanvas.getContext("2d");
            if (!exportCtx) {
                resolve(null);
                return;
            }
            const baseImg = new Image();
            baseImg.src = capturedImage;
            baseImg.onload = async () => {
                exportCanvas.width = baseImg.naturalWidth;
                exportCanvas.height = baseImg.naturalHeight;
                exportCtx.drawImage(baseImg, 0, 0);
                const scaleX = baseImg.naturalWidth / rect.width;
                const scaleY = baseImg.naturalHeight / rect.height;

                const uniqueStickerUrls = Array.from(
                    new Set(
                        stickers
                            .map(s => s.imageUrl)
                            .filter((url): url is string => Boolean(url))
                    )
                );
                const stickerImages = new Map<string, HTMLImageElement>();
                await Promise.all(
                    uniqueStickerUrls.map(async url => {
                        try {
                            const image = await loadImage(url);
                            stickerImages.set(url, image);
                        } catch {
                            // Ignore; this sticker will use emoji fallback during export.
                        }
                    })
                );

                stickers.forEach(s => {
                    const cx = s.x * scaleX;
                    const cy = s.y * scaleY;
                    const sz = s.size * Math.min(scaleX, scaleY);
                    exportCtx.save();
                    exportCtx.translate(cx, cy);
                    exportCtx.rotate((s.rotation * Math.PI) / 180);

                    const stickerImage = stickerImages.get(s.imageUrl);
                    if (stickerImage) {
                        exportCtx.drawImage(stickerImage, -sz / 2, -sz / 2, sz, sz);
                    } else {
                        exportCtx.font = `${sz}px serif`;
                        exportCtx.textAlign = "center";
                        exportCtx.textBaseline = "middle";
                        exportCtx.fillText(s.emoji, 0, 0);
                    }

                    exportCtx.restore();
                });
                const dataUrl = exportCanvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = "aura-photobooth.png";
                a.click();
                resolve(dataUrl);
            };
            baseImg.onerror = () => resolve(null);
        });
    };

    return {
        studioCanvasRef,
        inStudio, setInStudio,
        stickers, setStickers,
        draggingId,
        addSticker, removeSticker,
        onStickerPointerDown, onStickerPointerMove, onStickerPointerUp,
        exportStudio,
    };
}
