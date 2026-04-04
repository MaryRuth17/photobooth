export interface StickerDefinition {
    id: string;
    label: string;
    imageUrl: string;
    // Fallback glyph used if the image asset cannot be loaded.
    emoji: string;
}

export const STICKER_PALETTE: StickerDefinition[] = [
    {
        id: "hello-kitty",
        label: "Hello Kitty",
        imageUrl: "/stickers/hello-kitty.png",
        emoji: "🐱",
    },
    {
        id: "finger-heart",
        label: "Finger Heart",
        imageUrl: "/stickers/finger-heart.png",
        emoji: "💖",
    },
];

export interface PlacedSticker {
    id: string;
    stickerId: string;
    imageUrl: string;
    emoji: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
}
