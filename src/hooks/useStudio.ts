import { useRef, useState } from "react";
import type { PlacedSticker } from "@/lib/stickers";

export function useStudio() {
    const studioCanvasRef = useRef<HTMLDivElement>(null);
    const [inStudio, setInStudio] = useState(false);
    const [stickers, setStickers] = useState<PlacedSticker[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const addSticker = (emoji: string) => {
        const container = studioCanvasRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        setStickers(prev => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                emoji,
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

    const exportStudio = (capturedImage: string) => {
        const container = studioCanvasRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const exportCanvas = document.createElement("canvas");
        const exportCtx = exportCanvas.getContext("2d");
        if (!exportCtx) return;
        const baseImg = new Image();
        baseImg.src = capturedImage;
        baseImg.onload = () => {
            exportCanvas.width = baseImg.naturalWidth;
            exportCanvas.height = baseImg.naturalHeight;
            exportCtx.drawImage(baseImg, 0, 0);
            const scaleX = baseImg.naturalWidth / rect.width;
            const scaleY = baseImg.naturalHeight / rect.height;
            stickers.forEach(s => {
                const cx = s.x * scaleX;
                const cy = s.y * scaleY;
                const sz = s.size * Math.min(scaleX, scaleY);
                exportCtx.save();
                exportCtx.translate(cx, cy);
                exportCtx.rotate((s.rotation * Math.PI) / 180);
                exportCtx.font = `${sz}px serif`;
                exportCtx.textAlign = "center";
                exportCtx.textBaseline = "middle";
                exportCtx.fillText(s.emoji, 0, 0);
                exportCtx.restore();
            });
            const a = document.createElement("a");
            a.href = exportCanvas.toDataURL("image/png");
            a.download = "aura-photobooth.png";
            a.click();
        };
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
