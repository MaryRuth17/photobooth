export const STICKER_PALETTE = [
    { id: "star",      emoji: "⭐" },
    { id: "heart",     emoji: "❤️" },
    { id: "sparkle",   emoji: "✨" },
    { id: "rainbow",   emoji: "🌈" },
    { id: "flower",    emoji: "🌸" },
    { id: "butterfly", emoji: "🦋" },
    { id: "camera",    emoji: "📸" },
    { id: "ribbon",    emoji: "🎀" },
    { id: "balloon",   emoji: "🎈" },
    { id: "moon",      emoji: "🌙" },
    { id: "sun",       emoji: "☀️" },
    { id: "gem",       emoji: "💎" },
    { id: "fire",      emoji: "🔥" },
    { id: "lips",      emoji: "💋" },
    { id: "crown",     emoji: "👑" },
    { id: "clover",    emoji: "🍀" },
];

export interface PlacedSticker {
    id: string;
    emoji: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
}
