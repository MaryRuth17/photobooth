export const FILTERS = [
    { id: "none", name: "Normal", value: "none" },
    { id: "grayscale", name: "B&W", value: "grayscale(100%)" },
    { id: "rosy", name: "Rosy Tint", value: "sepia(30%) saturate(180%) hue-rotate(300deg)" },
    { id: "soft", name: "Soft Glow", value: "brightness(110%) blur(0.5px) saturate(120%)" },
    { id: "vintage", name: "Vintage", value: "sepia(60%) contrast(90%)" },
    { id: "cool", name: "Cool Breeze", value: "hue-rotate(180deg) saturate(80%)" },
];

/* ════════════════════════════════════════════
   Single-Frame Frames (800×700)
   Photo area: 800×600 (y=0..600), Footer: y=600..700
   SVG backgrounds are TRANSPARENT (fill="none") so the
   webcam / photo shows through — only borders & footer band visible.
   ════════════════════════════════════════════ */
export const FRAMES = [
    { id: "none", name: "No Frame", url: null },
    {
        id: "s_blush_ornate", name: "Blush Ornate",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            // Transparent background
            `<rect width="800" height="700" fill="none"/>` +
            // Outer thick border (photo region only)
            `<rect x="8" y="8" width="784" height="584" rx="16" fill="none" stroke="#FF6B8B" stroke-width="12"/>` +
            // Inner thin border
            `<rect x="22" y="22" width="756" height="556" rx="10" fill="none" stroke="#F4D1D6" stroke-width="4"/>` +
            // Corner accents
            `<circle cx="16" cy="16" r="10" fill="#FF6B8B" opacity=".6"/>` +
            `<circle cx="784" cy="16" r="10" fill="#FF6B8B" opacity=".6"/>` +
            `<circle cx="16" cy="592" r="10" fill="#FF6B8B" opacity=".6"/>` +
            `<circle cx="784" cy="592" r="10" fill="#FF6B8B" opacity=".6"/>` +
            // Footer band (semi-transparent)
            `<rect x="0" y="600" width="800" height="100" fill="#FDF1F4" rx="0"/>` +
            `<line x1="80" y1="615" x2="720" y2="615" stroke="#F4D1D6" stroke-width="2"/>` +
            `<text x="400" y="665" font-family="serif" font-size="28" font-style="italic" text-anchor="middle" fill="#FF6B8B" opacity=".9">Your Aura Moment</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "s_gold_elegance", name: "Gold Elegance",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="8" y="8" width="784" height="584" rx="12" fill="none" stroke="#D4A574" stroke-width="12"/>` +
            `<rect x="28" y="28" width="744" height="544" rx="6" fill="none" stroke="#D4A574" stroke-width="2" stroke-dasharray="10 5"/>` +
            `<path d="M8 8 L58 8 L8 58Z" fill="#D4A574" opacity=".35"/>` +
            `<path d="M792 8 L742 8 L792 58Z" fill="#D4A574" opacity=".35"/>` +
            `<path d="M8 592 L58 592 L8 542Z" fill="#D4A574" opacity=".35"/>` +
            `<path d="M792 592 L742 592 L792 542Z" fill="#D4A574" opacity=".35"/>` +
            `<rect x="0" y="600" width="800" height="100" fill="#FFFDF7"/>` +
            `<line x1="60" y1="616" x2="740" y2="616" stroke="#D4A574" stroke-width="1.5"/>` +
            `<text x="400" y="663" font-family="serif" font-size="26" text-anchor="middle" fill="#D4A574">✦ Aura Moments ✦</text>` +
            `<line x1="60" y1="682" x2="740" y2="682" stroke="#D4A574" stroke-width="1.5"/>` +
            `</svg>`
        )}`,
    },
    {
        id: "s_polaroid_xl", name: "Polaroid",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="12" y="12" width="776" height="576" rx="6" fill="none" stroke="#e8e8e8" stroke-width="14"/>` +
            `<rect x="28" y="28" width="744" height="544" rx="4" fill="none" stroke="#f0f0f0" stroke-width="3"/>` +
            `<rect x="0" y="600" width="800" height="100" fill="#ffffff"/>` +
            `<text x="400" y="655" font-family="serif" font-size="38" font-style="italic" text-anchor="middle" fill="#FF6B8B">Aura Moments</text>` +
            `<text x="400" y="685" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#ccc">photobooth</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "s_watercolor", name: "Watercolor",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="8" y="8" width="784" height="584" rx="16" fill="none" stroke="#B8D4E3" stroke-width="12"/>` +
            `<rect x="24" y="24" width="752" height="552" rx="10" fill="none" stroke="#B8D4E3" stroke-width="3" stroke-dasharray="8 5"/>` +
            `<circle cx="45" cy="45" r="36" fill="#B8D4E3" opacity=".18"/>` +
            `<circle cx="755" cy="45" r="28" fill="#D4A574" opacity=".14"/>` +
            `<circle cx="762" cy="568" r="40" fill="#B8D4E3" opacity=".14"/>` +
            `<circle cx="38" cy="558" r="24" fill="#D4A574" opacity=".12"/>` +
            `<rect x="0" y="600" width="800" height="100" fill="#F0F4F8"/>` +
            `<text x="400" y="658" font-family="serif" font-size="24" text-anchor="middle" fill="#8BA4B5" opacity=".9">captured with love</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "s_vintage_lace", name: "Vintage Lace",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="8" y="8" width="784" height="584" rx="16" fill="none" stroke="#E8D5C4" stroke-width="12"/>` +
            `<rect x="26" y="26" width="748" height="548" rx="10" fill="none" stroke="#E8D5C4" stroke-width="3" stroke-dasharray="6 4"/>` +
            `<circle cx="20" cy="20" r="16" fill="none" stroke="#E8D5C4" stroke-width="3"/>` +
            `<circle cx="780" cy="20" r="16" fill="none" stroke="#E8D5C4" stroke-width="3"/>` +
            `<circle cx="20" cy="580" r="16" fill="none" stroke="#E8D5C4" stroke-width="3"/>` +
            `<circle cx="780" cy="580" r="16" fill="none" stroke="#E8D5C4" stroke-width="3"/>` +
            `<rect x="0" y="600" width="800" height="100" fill="#FFF8F0"/>` +
            `<text x="400" y="660" font-family="serif" font-size="26" font-style="italic" text-anchor="middle" fill="#C4A882">♡ sweet memories ♡</text>` +
            `</svg>`
        )}`,
    },
];

/* ════════════════════════════════════════════
   2×2 Grid Frames (800×700, with footer)
   Photo grid: 800×600, Footer: 600..700
   Transparent background — only borders & footer band visible.
   ════════════════════════════════════════════ */
export const GRID_FRAMES = [
    { id: "none", name: "No Frame", url: null },
    {
        id: "g_thick_blush", name: "Blush Ornate",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            // Outer full-grid border
            `<rect x="8" y="8" width="784" height="584" rx="16" fill="none" stroke="#FF6B8B" stroke-width="10"/>` +
            // Cell borders (2x2 grid within 800x600, 25px padding, 10px gap)
            `<rect x="22" y="22" width="370" height="272" rx="10" fill="none" stroke="#FF6B8B" stroke-width="5"/>` +
            `<rect x="408" y="22" width="370" height="272" rx="10" fill="none" stroke="#FF6B8B" stroke-width="5"/>` +
            `<rect x="22" y="310" width="370" height="272" rx="10" fill="none" stroke="#FF6B8B" stroke-width="5"/>` +
            `<rect x="408" y="310" width="370" height="272" rx="10" fill="none" stroke="#FF6B8B" stroke-width="5"/>` +
            // Corner accents
            `<circle cx="14" cy="14" r="10" fill="#FF6B8B" opacity=".6"/>` +
            `<circle cx="786" cy="14" r="10" fill="#FF6B8B" opacity=".6"/>` +
            `<circle cx="14" cy="590" r="10" fill="#FF6B8B" opacity=".6"/>` +
            `<circle cx="786" cy="590" r="10" fill="#FF6B8B" opacity=".6"/>` +
            // Footer band
            `<rect x="0" y="600" width="800" height="100" fill="#FDF1F4"/>` +
            `<line x1="80" y1="615" x2="720" y2="615" stroke="#F4D1D6" stroke-width="2"/>` +
            `<text x="400" y="665" font-family="serif" font-size="28" font-style="italic" text-anchor="middle" fill="#FF6B8B" opacity=".9">Your Aura Moment</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "g_gold", name: "Gold Elegance",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="8" y="8" width="784" height="584" rx="12" fill="none" stroke="#D4A574" stroke-width="10"/>` +
            `<rect x="22" y="22" width="370" height="272" rx="8" fill="none" stroke="#D4A574" stroke-width="5"/>` +
            `<rect x="408" y="22" width="370" height="272" rx="8" fill="none" stroke="#D4A574" stroke-width="5"/>` +
            `<rect x="22" y="310" width="370" height="272" rx="8" fill="none" stroke="#D4A574" stroke-width="5"/>` +
            `<rect x="408" y="310" width="370" height="272" rx="8" fill="none" stroke="#D4A574" stroke-width="5"/>` +
            `<path d="M8 8 L55 8 L8 55Z" fill="#D4A574" opacity=".3"/>` +
            `<path d="M792 8 L745 8 L792 55Z" fill="#D4A574" opacity=".3"/>` +
            `<path d="M8 592 L55 592 L8 545Z" fill="#D4A574" opacity=".3"/>` +
            `<path d="M792 592 L745 592 L792 545Z" fill="#D4A574" opacity=".3"/>` +
            `<rect x="0" y="600" width="800" height="100" fill="#FFFDF7"/>` +
            `<line x1="60" y1="616" x2="740" y2="616" stroke="#D4A574" stroke-width="1.5"/>` +
            `<text x="400" y="663" font-family="serif" font-size="26" text-anchor="middle" fill="#D4A574">✦ Aura Moments ✦</text>` +
            `<line x1="60" y1="682" x2="740" y2="682" stroke="#D4A574" stroke-width="1.5"/>` +
            `</svg>`
        )}`,
    },
    {
        id: "g_watercolor", name: "Watercolor",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="8" y="8" width="784" height="584" rx="16" fill="none" stroke="#B8D4E3" stroke-width="10"/>` +
            `<rect x="22" y="22" width="370" height="272" rx="12" fill="none" stroke="#B8D4E3" stroke-width="5"/>` +
            `<rect x="408" y="22" width="370" height="272" rx="12" fill="none" stroke="#B8D4E3" stroke-width="5"/>` +
            `<rect x="22" y="310" width="370" height="272" rx="12" fill="none" stroke="#B8D4E3" stroke-width="5"/>` +
            `<rect x="408" y="310" width="370" height="272" rx="12" fill="none" stroke="#B8D4E3" stroke-width="5"/>` +
            `<circle cx="50" cy="50" r="45" fill="#B8D4E3" opacity=".1"/>` +
            `<circle cx="750" cy="565" r="55" fill="#B8D4E3" opacity=".1"/>` +
            `<circle cx="762" cy="40" r="32" fill="#D4A574" opacity=".08"/>` +
            `<rect x="0" y="600" width="800" height="100" fill="#F0F4F8"/>` +
            `<text x="400" y="658" font-family="serif" font-size="24" text-anchor="middle" fill="#8BA4B5">captured with love</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "g_polaroid", name: "Polaroid Grid",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="10" y="10" width="780" height="580" rx="6" fill="none" stroke="#e0e0e0" stroke-width="14"/>` +
            `<rect x="22" y="22" width="370" height="272" rx="4" fill="none" stroke="#ebebeb" stroke-width="3"/>` +
            `<rect x="408" y="22" width="370" height="272" rx="4" fill="none" stroke="#ebebeb" stroke-width="3"/>` +
            `<rect x="22" y="310" width="370" height="272" rx="4" fill="none" stroke="#ebebeb" stroke-width="3"/>` +
            `<rect x="408" y="310" width="370" height="272" rx="4" fill="none" stroke="#ebebeb" stroke-width="3"/>` +
            `<rect x="0" y="600" width="800" height="100" fill="#ffffff"/>` +
            `<text x="400" y="655" font-family="serif" font-size="34" font-style="italic" text-anchor="middle" fill="#FF6B8B">Aura Grid</text>` +
            `<text x="400" y="684" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#ccc">photobooth</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "g_hearts", name: "Heart Accents",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="8" y="8" width="784" height="584" rx="16" fill="none" stroke="#FFB6C1" stroke-width="10"/>` +
            `<rect x="22" y="22" width="370" height="272" rx="10" fill="none" stroke="#FFB6C1" stroke-width="6"/>` +
            `<rect x="408" y="22" width="370" height="272" rx="10" fill="none" stroke="#FFB6C1" stroke-width="6"/>` +
            `<rect x="22" y="310" width="370" height="272" rx="10" fill="none" stroke="#FFB6C1" stroke-width="6"/>` +
            `<rect x="408" y="310" width="370" height="272" rx="10" fill="none" stroke="#FFB6C1" stroke-width="6"/>` +
            `<text x="400" y="302" font-size="20" text-anchor="middle" fill="#FF6B8B" opacity=".5">♥</text>` +
            `<text x="12" y="20" font-size="18" fill="#FFB6C1">♥</text>` +
            `<text x="778" y="20" font-size="18" fill="#FFB6C1">♥</text>` +
            `<text x="12" y="596" font-size="18" fill="#FFB6C1">♥</text>` +
            `<text x="778" y="596" font-size="18" fill="#FFB6C1">♥</text>` +
            `<rect x="0" y="600" width="800" height="100" fill="#FFF5F7"/>` +
            `<text x="400" y="662" font-family="serif" font-size="28" font-style="italic" text-anchor="middle" fill="#FF6B8B">♡ with love ♡</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "g_lace", name: "Vintage Lace",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">` +
            `<rect width="800" height="700" fill="none"/>` +
            `<rect x="8" y="8" width="784" height="584" rx="16" fill="none" stroke="#E8D5C4" stroke-width="10"/>` +
            `<rect x="22" y="22" width="370" height="272" rx="10" fill="none" stroke="#E8D5C4" stroke-width="6"/>` +
            `<rect x="408" y="22" width="370" height="272" rx="10" fill="none" stroke="#E8D5C4" stroke-width="6"/>` +
            `<rect x="22" y="310" width="370" height="272" rx="10" fill="none" stroke="#E8D5C4" stroke-width="6"/>` +
            `<rect x="408" y="310" width="370" height="272" rx="10" fill="none" stroke="#E8D5C4" stroke-width="6"/>` +
            `<rect x="12" y="12" width="776" height="576" rx="14" fill="none" stroke="#E8D5C4" stroke-width="2" stroke-dasharray="6 4"/>` +
            `<rect x="0" y="600" width="800" height="100" fill="#FFF8F0"/>` +
            `<text x="400" y="660" font-family="serif" font-size="24" font-style="italic" text-anchor="middle" fill="#C4A882">♡ sweet memories ♡</text>` +
            `</svg>`
        )}`,
    },
];

/* ════════════════════════════════════════════════════
   Vertical 4-Strip Frames (480×1310)
   — Inspired by physical photo strips: rounded photo
     cutouts, thick padding, watercolor/marble accents,
     footer area for branding
   Compositing layout (canvas coords):
     Outer padding: 30px sides, 30px top
     Photo area: 420×280 per photo
     Gap between photos: 20px
     Footer: 120px at bottom
     Total: 480 × (30 + 4×280 + 3×20 + 120) = 480 × 1310
   ════════════════════════════════════════════════════ */
const STRIP_W = 480;
const STRIP_PAD = 30;
const STRIP_PHOTO_W = STRIP_W - STRIP_PAD * 2; // 420
const STRIP_PHOTO_H = 280;
const STRIP_GAP = 20;
const STRIP_FOOTER = 120;
const STRIP_H = STRIP_PAD + 4 * STRIP_PHOTO_H + 3 * STRIP_GAP + STRIP_FOOTER; // 1310

export { STRIP_W, STRIP_PAD, STRIP_PHOTO_W, STRIP_PHOTO_H, STRIP_GAP, STRIP_FOOTER, STRIP_H };

// Helper to build photo cutout rects used across strip frames
function stripPhotoY(index: number): number {
    return STRIP_PAD + index * (STRIP_PHOTO_H + STRIP_GAP);
}

function stripPhotoCutouts(stroke: string, sw: number, rx: number): string {
    return [0, 1, 2, 3].map(i =>
        `<rect x="${STRIP_PAD}" y="${stripPhotoY(i)}" width="${STRIP_PHOTO_W}" height="${STRIP_PHOTO_H}" rx="${rx}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`
    ).join("");
}

export const STRIP_FRAMES = [
    { id: "none", name: "No Frame", url: null },
    {
        id: "st_blush", name: "Blush Ornate",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}">` +
            `<rect width="${STRIP_W}" height="${STRIP_H}" fill="#FDF1F4" rx="14"/>` +
            // Outer thick border
            `<rect x="6" y="6" width="${STRIP_W - 12}" height="${STRIP_H - 12}" rx="12" fill="none" stroke="#FF6B8B" stroke-width="8"/>` +
            stripPhotoCutouts("#FF6B8B", 4, 10) +
            `<circle cx="16" cy="16" r="8" fill="#FF6B8B" opacity=".5"/>` +
            `<circle cx="${STRIP_W - 16}" cy="16" r="8" fill="#FF6B8B" opacity=".5"/>` +
            `<circle cx="16" cy="${STRIP_H - 16}" r="8" fill="#FF6B8B" opacity=".5"/>` +
            `<circle cx="${STRIP_W - 16}" cy="${STRIP_H - 16}" r="8" fill="#FF6B8B" opacity=".5"/>` +
            `<line x1="80" y1="${STRIP_H - 60}" x2="${STRIP_W - 80}" y2="${STRIP_H - 60}" stroke="#F4D1D6" stroke-width="2"/>` +
            `<text x="${STRIP_W / 2}" y="${STRIP_H - 30}" font-family="serif" font-size="22" font-style="italic" text-anchor="middle" fill="#FF6B8B" opacity=".8">Your Aura Moment</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "st_gold", name: "Gold Elegance",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}">` +
            `<rect width="${STRIP_W}" height="${STRIP_H}" fill="#FFFDF7" rx="8"/>` +
            `<rect x="6" y="6" width="${STRIP_W - 12}" height="${STRIP_H - 12}" rx="6" fill="none" stroke="#D4A574" stroke-width="8"/>` +
            `<rect x="16" y="16" width="${STRIP_W - 32}" height="${STRIP_H - 32}" rx="4" fill="none" stroke="#D4A574" stroke-width="2" stroke-dasharray="8 4"/>` +
            stripPhotoCutouts("#D4A574", 5, 8) +
            `<path d="M0 0 L40 0 L0 40Z" fill="#D4A574" opacity=".2"/>` +
            `<path d="${STRIP_W} 0 L${STRIP_W - 40} 0 L${STRIP_W} 40Z" fill="#D4A574" opacity=".2"/>` +
            `<path d="M0 ${STRIP_H} L40 ${STRIP_H} L0 ${STRIP_H - 40}Z" fill="#D4A574" opacity=".2"/>` +
            `<path d="M${STRIP_W} ${STRIP_H} L${STRIP_W - 40} ${STRIP_H} L${STRIP_W} ${STRIP_H - 40}Z" fill="#D4A574" opacity=".2"/>` +
            `<text x="${STRIP_W / 2}" y="${STRIP_H - 35}" font-family="serif" font-size="20" text-anchor="middle" fill="#D4A574">✦ Aura Moments ✦</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "st_watercolor", name: "Watercolor",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}">` +
            `<rect width="${STRIP_W}" height="${STRIP_H}" fill="#F0F4F8" rx="12"/>` +
            `<rect x="6" y="6" width="${STRIP_W - 12}" height="${STRIP_H - 12}" rx="10" fill="none" stroke="#B8D4E3" stroke-width="8"/>` +
            `<circle cx="50" cy="50" r="50" fill="#B8D4E3" opacity=".12"/>` +
            `<circle cx="${STRIP_W - 40}" cy="${STRIP_H - 60}" r="60" fill="#B8D4E3" opacity=".12"/>` +
            `<circle cx="${STRIP_W - 30}" cy="40" r="30" fill="#D4A574" opacity=".08"/>` +
            `<circle cx="40" cy="${STRIP_H - 40}" r="35" fill="#D4A574" opacity=".08"/>` +
            stripPhotoCutouts("#B8D4E3", 5, 12) +
            `<text x="${STRIP_W / 2}" y="${STRIP_H - 35}" font-family="serif" font-size="20" text-anchor="middle" fill="#8BA4B5">captured with love</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "st_film", name: "Film Strip",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}">` +
            `<rect width="${STRIP_W}" height="${STRIP_H}" fill="#1a1a1a" rx="6"/>` +
            `<rect x="4" y="4" width="${STRIP_W - 8}" height="${STRIP_H - 8}" rx="4" fill="none" stroke="#444" stroke-width="4"/>` +
            `<line x1="0" y1="18" x2="${STRIP_W}" y2="18" stroke="#444" stroke-width="4" stroke-dasharray="14 10"/>` +
            `<line x1="0" y1="${STRIP_H - 18}" x2="${STRIP_W}" y2="${STRIP_H - 18}" stroke="#444" stroke-width="4" stroke-dasharray="14 10"/>` +
            stripPhotoCutouts("#555", 3, 4) +
            `<text x="${STRIP_W / 2}" y="${STRIP_H - 35}" font-family="monospace" font-size="16" text-anchor="middle" fill="#888">AURA PHOTOBOOTH</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "st_hearts", name: "Heart Accents",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}">` +
            `<rect width="${STRIP_W}" height="${STRIP_H}" fill="#FFF5F7" rx="12"/>` +
            `<rect x="6" y="6" width="${STRIP_W - 12}" height="${STRIP_H - 12}" rx="10" fill="none" stroke="#FFB6C1" stroke-width="8"/>` +
            stripPhotoCutouts("#FFB6C1", 5, 10) +
            `<text x="18" y="24" font-size="16" fill="#FFB6C1">♥</text>` +
            `<text x="${STRIP_W - 24}" y="24" font-size="16" fill="#FFB6C1">♥</text>` +
            `<text x="18" y="${STRIP_H - 12}" font-size="16" fill="#FFB6C1">♥</text>` +
            `<text x="${STRIP_W - 24}" y="${STRIP_H - 12}" font-size="16" fill="#FFB6C1">♥</text>` +
            [0, 1, 2].map(i => `<text x="${STRIP_W / 2}" y="${stripPhotoY(i) + STRIP_PHOTO_H + STRIP_GAP / 2 + 6}" font-size="14" text-anchor="middle" fill="#FF6B8B" opacity=".5">♥</text>`).join("") +
            `<text x="${STRIP_W / 2}" y="${STRIP_H - 30}" font-family="serif" font-size="22" font-style="italic" text-anchor="middle" fill="#FF6B8B">♡ with love ♡</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "st_lace", name: "Vintage Lace",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}">` +
            `<rect width="${STRIP_W}" height="${STRIP_H}" fill="#FFF8F0" rx="10"/>` +
            `<rect x="6" y="6" width="${STRIP_W - 12}" height="${STRIP_H - 12}" rx="8" fill="none" stroke="#E8D5C4" stroke-width="8"/>` +
            `<rect x="16" y="16" width="${STRIP_W - 32}" height="${STRIP_H - 32}" rx="6" fill="none" stroke="#E8D5C4" stroke-width="2" stroke-dasharray="6 4"/>` +
            stripPhotoCutouts("#E8D5C4", 5, 10) +
            `<circle cx="${STRIP_PAD}" cy="${STRIP_PAD}" r="12" fill="none" stroke="#E8D5C4" stroke-width="2"/>` +
            `<circle cx="${STRIP_W - STRIP_PAD}" cy="${STRIP_PAD}" r="12" fill="none" stroke="#E8D5C4" stroke-width="2"/>` +
            `<circle cx="${STRIP_PAD}" cy="${STRIP_H - STRIP_FOOTER + 10}" r="12" fill="none" stroke="#E8D5C4" stroke-width="2"/>` +
            `<circle cx="${STRIP_W - STRIP_PAD}" cy="${STRIP_H - STRIP_FOOTER + 10}" r="12" fill="none" stroke="#E8D5C4" stroke-width="2"/>` +
            `<text x="${STRIP_W / 2}" y="${STRIP_H - 35}" font-family="serif" font-size="20" font-style="italic" text-anchor="middle" fill="#C4A882">♡ sweet memories ♡</text>` +
            `</svg>`
        )}`,
    },
    {
        id: "st_polaroid", name: "Polaroid Strip",
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}">` +
            `<rect width="${STRIP_W}" height="${STRIP_H}" fill="#fff" rx="4"/>` +
            `<rect x="6" y="6" width="${STRIP_W - 12}" height="${STRIP_H - 12}" rx="4" fill="none" stroke="#e0e0e0" stroke-width="8"/>` +
            stripPhotoCutouts("#f0f0f0", 2, 4) +
            `<text x="${STRIP_W / 2}" y="${STRIP_H - 55}" font-family="serif" font-size="28" font-style="italic" text-anchor="middle" fill="#FF6B8B">Aura Booth</text>` +
            `<text x="${STRIP_W / 2}" y="${STRIP_H - 30}" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#ccc">photobooth</text>` +
            `</svg>`
        )}`,
    },
];

export const LAYOUTS = [
    { id: "single", name: "1x1 Single", shots: 1, icon: "square" },
    { id: "grid", name: "2x2 Grid", shots: 4, icon: "grid" },
    { id: "strip", name: "4-Strip", shots: 4, icon: "columns" },
];
