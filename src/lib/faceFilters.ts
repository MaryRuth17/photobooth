
// You can add custom PNG filters to the public/filters/ folder

export interface FaceFilter {
    id: string;
    name: string;
    image: string; // Path to PNG/SVG in public folder or data URI
    scale?: number; // Scale multiplier (default 1)
    offsetX?: number; // Horizontal offset in pixels
    offsetY?: number; // Vertical offset in pixels
    placement: "full-face" | "eyes" | "forehead" | "nose" | "mouth";
    // Preview thumbnail (optional, uses image if not set)
    thumbnail?: string;
}

// Sample SVG filters as data URIs for testing
const SAMPLE_FILTERS = {
    catEars: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
        <!-- Left ear -->
        <path d="M20 110 L50 20 L80 90 Z" fill="#FFA07A" stroke="#FF6B8B" stroke-width="3"/>
        <path d="M35 100 L50 40 L65 85 Z" fill="#FFD4D4"/>
        <!-- Right ear -->
        <path d="M120 90 L150 20 L180 110 Z" fill="#FFA07A" stroke="#FF6B8B" stroke-width="3"/>
        <path d="M135 85 L150 40 L165 100 Z" fill="#FFD4D4"/>
    </svg>`)}`,

    bearEars: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140">
        <!-- Left floppy ear -->
        <ellipse cx="40" cy="80" rx="35" ry="55" fill="#8B4513" transform="rotate(-20 40 80)"/>
        <ellipse cx="40" cy="85" rx="20" ry="35" fill="#D2691E" transform="rotate(-20 40 85)"/>
        <!-- Right floppy ear -->
        <ellipse cx="200" cy="80" rx="35" ry="55" fill="#8B4513" transform="rotate(20 200 80)"/>
        <ellipse cx="200" cy="85" rx="20" ry="35" fill="#D2691E" transform="rotate(20 200 85)"/>
    </svg>`)}`,

    crown: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
        <defs>
            <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#FFD700"/>
                <stop offset="100%" style="stop-color:#FFA500"/>
            </linearGradient>
        </defs>
        <!-- Crown base -->
        <path d="M10 90 L10 50 L40 70 L70 30 L100 60 L130 30 L160 70 L190 50 L190 90 Z" fill="url(#gold)" stroke="#B8860B" stroke-width="2"/>
        <!-- Gems -->
        <circle cx="40" cy="70" r="8" fill="#FF6B8B"/>
        <circle cx="100" cy="55" r="10" fill="#FF6B8B"/>
        <circle cx="160" cy="70" r="8" fill="#FF6B8B"/>
        <!-- Crown band -->
        <rect x="10" y="80" width="180" height="15" fill="url(#gold)" stroke="#B8860B" stroke-width="2"/>
    </svg>`)}`,

    clownNose: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
        <defs>
            <radialGradient id="noseGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" style="stop-color:#FF4444"/>
                <stop offset="100%" style="stop-color:#CC0000"/>
            </radialGradient>
        </defs>
        <circle cx="30" cy="30" r="25" fill="url(#noseGrad)"/>
        <ellipse cx="22" cy="22" rx="8" ry="6" fill="#FF6666" opacity="0.6"/>
    </svg>`)}`,

    bunnyEars: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">
        <!-- Left ear -->
        <ellipse cx="50" cy="60" rx="25" ry="55" fill="#FFE4E1" stroke="#FFB6C1" stroke-width="2"/>
        <ellipse cx="50" cy="65" rx="12" ry="40" fill="#FFB6C1"/>
        <!-- Right ear -->
        <ellipse cx="150" cy="60" rx="25" ry="55" fill="#FFE4E1" stroke="#FFB6C1" stroke-width="2"/>
        <ellipse cx="150" cy="65" rx="12" ry="40" fill="#FFB6C1"/>
        <!-- Ear tips slightly bent -->
        <ellipse cx="45" cy="15" rx="18" ry="20" fill="#FFE4E1" stroke="#FFB6C1" stroke-width="2" transform="rotate(-10 45 15)"/>
        <ellipse cx="155" cy="15" rx="18" ry="20" fill="#FFE4E1" stroke="#FFB6C1" stroke-width="2" transform="rotate(10 155 15)"/>
    </svg>`)}`,
};

export const FACE_FILTERS: FaceFilter[] = [
    {
        id: "none",
        name: "No Filter",
        image: "",
        placement: "full-face",
    },
    {
        id: "cat-ears",
        name: "Cat Ears",
        image: SAMPLE_FILTERS.catEars,
        scale: 0.9,
        offsetY: -70,
        placement: "forehead",
    },
    {
        id: "bunny-ears",
        name: "Bunny Ears",
        image: SAMPLE_FILTERS.bunnyEars,
        scale: 1.0,
        offsetY: -70,
        placement: "forehead",
    },
    {
        id: "bear-ears",
        name: "Bear Ears",
        image: SAMPLE_FILTERS.bearEars,
        scale: 0.9,
        offsetY: -70,
        placement: "forehead",
    },
    {
        id: "crown",
        name: "Crown",
        image: SAMPLE_FILTERS.crown,
        scale: 0.8,
        offsetY: -70,
        placement: "forehead",
    },
    {
        id: "clown-nose",
        name: "Clown Nose",
        image: SAMPLE_FILTERS.clownNose,
        scale: 0.3,
        offsetY: 7,
        placement: "nose",
    },
];

// Placement-specific default offsets and scales
export const PLACEMENT_DEFAULTS: Record<FaceFilter["placement"], { offsetY: number; scale: number }> = {
    "full-face": { offsetY: 0, scale: 1.0 },
    "eyes": { offsetY: -20, scale: 0.7 },
    "forehead": { offsetY: -110, scale: 1.2 },
    "nose": { offsetY: 15, scale: 0.4 },
    "mouth": { offsetY: 50, scale: 0.6 },
};

// Helper to get a filter by ID
export function getFaceFilterById(id: string): FaceFilter | undefined {
    return FACE_FILTERS.find(f => f.id === id);
}
