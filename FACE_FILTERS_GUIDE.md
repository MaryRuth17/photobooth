# Face Filters Guide - Complete Learning Resource

Welcome to the comprehensive guide for understanding and customizing face-tracking filters in this photobooth application! This guide will teach you everything from the underlying architecture to creating your own custom filters.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Understanding Placement Types](#understanding-placement-types)
3. [Tutorial: Adding Custom Filters](#tutorial-adding-custom-filters)
4. [Adjusting Filter Properties](#adjusting-filter-properties)
5. [Best Practices for Filter Design](#best-practices-for-filter-design)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Advanced Topics](#advanced-topics)

---

## Architecture Overview

### The Four Key Components

This face filter system is built on a clean, modular architecture with four main components:

#### 1. **useFaceDetection Hook** (`src/hooks/useFaceDetection.ts`)
**Purpose**: Manages MediaPipe's FaceLandmarker for real-time face tracking

**What it does**:
- Loads Google's MediaPipe WASM runtime and face detection model
- Processes webcam video frames at 60fps
- Detects up to 4 faces simultaneously
- Provides 468 landmark points per face (eyes, nose, mouth, face contour)
- Calculates 5 distinct face regions (full-face, eyes, forehead, nose, mouth)
- Computes face rotation based on eye alignment
- Returns structured FaceData objects for rendering

**Key Configuration**:
```typescript
{
  maxFaces: 4,                    // Track up to 4 faces
  minDetectionConfidence: 0.5,    // Sensitivity threshold
  minTrackingConfidence: 0.5,     // Tracking stability
  refineLandmarks: true           // Enhanced precision for iris/lips
}
```

#### 2. **FaceFilterCamera Component** (`src/components/photobooth/FaceFilterCamera.tsx`)
**Purpose**: Renders face filters overlaid on webcam feed

**What it does**:
- Creates a dual-layer canvas system (video layer + filter overlay)
- Processes face detection data from useFaceDetection hook
- Draws filter images on canvas positioned at specific face regions
- Handles coordinate transformations (normalized → pixel → mirrored)
- Applies rotation to match head tilt
- Maintains aspect ratio of filter images
- Captures screenshots with filters baked in

**Architecture**:
```
┌─────────────────────────────┐
│  Video Layer (z-index: 0)   │  ← Mirrored webcam feed
│  with optional CSS filters  │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Canvas Overlay (z-index: 1) │  ← Transparent canvas for face filters
│  Real-time filter rendering │
└─────────────────────────────┘
```

#### 3. **Face Filters Library** (`src/lib/faceFilters.ts`)
**Purpose**: Defines available filters and their properties

**What it contains**:
- FaceFilter interface defining filter structure
- 11 built-in SVG filters (cat ears, sunglasses, crowns, etc.)
- Placement defaults for each region type
- Helper function to get region-based placement

**Filter Structure**:
```typescript
interface FaceFilter {
  id: string;           // Unique identifier
  name: string;         // Display name in UI
  image: string;        // PNG path or SVG data URI
  scale?: number;       // Size multiplier (default: 1.0)
  offsetX?: number;     // Horizontal shift in pixels (default: 0)
  offsetY?: number;     // Vertical shift in pixels (varies by placement)
  placement: "full-face" | "eyes" | "forehead" | "nose" | "mouth";
  thumbnail?: string;   // Optional preview image
}
```

#### 4. **Tools Panel** (`src/components/photobooth/ToolsPanel.tsx`)
**Purpose**: Provides filter selection UI

**What it does**:
- Displays filter thumbnails in a grid
- Highlights selected filter
- Shows placement type badges
- Integrates with photobooth state management

### Data Flow

```
Webcam Video Stream
       ↓
useFaceDetection Hook
  - MediaPipe processes frames
  - Detects 468 landmarks per face
  - Calculates 5 face regions
       ↓
FaceData Objects
  { x, y, width, height, rotation, regions: {...}, landmarks: [...] }
       ↓
FaceFilterCamera Component
  - Loads filter image
  - Gets region for selected placement
  - Transforms coordinates (normalized → pixel → mirrored)
  - Applies scale, offset, rotation
  - Draws on canvas overlay
       ↓
Live Preview / Screenshot Capture
```

### Coordinate System

Understanding the coordinate transformations is crucial:

1. **MediaPipe Output**: Normalized coordinates (0.0 to 1.0)
   - (0, 0) = Top-left corner
   - (1, 1) = Bottom-right corner
   - Independent of video resolution

2. **Pixel Coordinates**: Multiplied by canvas dimensions
   - normalized_x × canvas.width = pixel_x
   - normalized_y × canvas.height = pixel_y

3. **Mirrored Coordinates**: For selfie-view (video is mirrored)
   - mirrored_x = canvas.width - pixel_x
   - This creates the mirror effect users expect

---

## Understanding Placement Types

Each placement type targets a specific face region using precise facial landmarks. Here's what you need to know:

### 1. Full-Face
**Landmarks Used**:
- Forehead top: landmark 10
- Chin bottom: landmark 152
- Left cheek: landmark 234
- Right cheek: landmark 454

**Coverage**: Entire face with 15% padding

**Default Properties**:
- Scale: `1.0`
- OffsetY: `0`

**Visual Description**: A rectangle encompassing the entire face from the top of the forehead to the bottom of the chin, with equal padding on all sides.

**Best Use Cases**:
- Full-face masks (skeleton, animal faces)
- Decorative frames and borders
- Face overlays (pixel effects, glitch effects)
- Screen filters that cover the whole face

**Example Filters**: `pixel-heart`

---

### 2. Eyes
**Landmarks Used**:
- Left eye outer corner: landmark 33
- Left eye inner corner: landmark 133
- Right eye inner corner: landmark 362
- Right eye outer corner: landmark 263
- Left eyebrow top: landmark 66
- Right eyebrow top: landmark 296

**Coverage**: From outer corner of left eye to outer corner of right eye, including eyebrows

**Default Properties**:
- Scale: `0.7`
- OffsetY: `-20` (slightly above eyes)

**Visual Description**: A horizontal region spanning both eyes, extending from the outer edges of the eyebrows inward, and including the space between the eyes.

**Best Use Cases**:
- Sunglasses and eyewear
- Eye makeup and decorations
- Party masks
- Eye accessories (hearts, stars)

**Example Filters**: `sunglasses`, `heart-eyes`, `party-mask`

**Design Tips**:
- Ensure the filter is wide enough to cover both eyes
- Leave space for the nose bridge in the center
- Test with different face angles

---

### 3. Forehead
**Landmarks Used**:
- Forehead top: landmark 10 (hairline)
- Eyebrow left: landmark 66
- Eyebrow right: landmark 296
- Face width: ~90% of full-face width

**Coverage**: From top of head/hairline down to eyebrow line

**Default Properties**:
- Scale: `1.2`
- OffsetY: `-80` (well above eyebrows)

**Visual Description**: The upper portion of the face above the eyebrows, often extending into the hairline area.

**Best Use Cases**:
- Animal ears (cat, bunny, dog)
- Crowns and tiaras
- Hats and headwear
- Halos and headbands
- Horns and antennae

**Example Filters**: `cat-ears`, `bunny-ears`, `dog-ears`, `crown`

**Design Tips**:
- Position items well above the eyebrows (offsetY: -70 to -100)
- Use larger scales (1.2 - 1.5) since items are farther from camera
- Center items horizontally for symmetrical look
- Consider head tilt - filters rotate automatically

---

### 4. Nose
**Landmarks Used**:
- Nose bridge (between eyes): landmark 6
- Nose tip: landmark 1
- Left nostril: landmark 129
- Right nostril: landmark 358
- Nose bottom: landmark 2

**Coverage**: From bridge to tip, including nostrils

**Default Properties**:
- Scale: `0.4`
- OffsetY: `15` (slightly below bridge)

**Visual Description**: A small region centered on the nose, from the bridge (between eyes) to the tip of the nose.

**Best Use Cases**:
- Clown nose
- Pig snout
- Small decorative items
- Nose piercings
- Animal noses

**Example Filters**: `clown-nose`

**Design Tips**:
- Keep filters small (scale: 0.3 - 0.6)
- Use small positive offsetY values (10 - 25)
- Ensure circular/round filters are centered
- Test on different nose sizes and shapes

---

### 5. Mouth
**Landmarks Used**:
- Left mouth corner: landmark 61
- Right mouth corner: landmark 291
- Upper lip top: landmark 0
- Lower lip bottom: landmark 17

**Coverage**: From above upper lip to below lower lip

**Default Properties**:
- Scale: `0.6`
- OffsetY: `50` (below nose, on upper lip area)

**Visual Description**: The lower-center portion of the face, encompassing the lips and immediate surrounding area.

**Best Use Cases**:
- Mustaches and beards
- Mouth accessories (grills, fangs)
- Food items (pizza slice, lollipop)
- Speech bubbles

**Example Filters**: `mustache`

**Design Tips**:
- Use moderate positive offsetY (40 - 60)
- For mustaches, position just above upper lip
- Keep horizontal width reasonable (scale: 0.5 - 0.8)
- Consider mouth movement - filter stays anchored

---

## Landmark Map Reference

For advanced customization, here are key landmark indices:

```
Face Outline:
  - Top of head: 10
  - Bottom of chin: 152
  - Left face edge: 234
  - Right face edge: 454

Eyes:
  - Left eye outer corner: 33
  - Left eye inner corner: 133
  - Right eye inner corner: 362
  - Right eye outer corner: 263

Eyebrows:
  - Left eyebrow outer: 66
  - Left eyebrow inner: 107
  - Right eyebrow inner: 336
  - Right eyebrow outer: 296

Nose:
  - Bridge (between eyes): 6
  - Tip: 1
  - Left nostril: 129
  - Right nostril: 358

Mouth:
  - Left corner: 61
  - Right corner: 291
  - Upper lip top: 0
  - Lower lip bottom: 17
```

---

## Tutorial: Adding Custom Filters

### Method 1: External PNG File

This is the recommended method for photographic or high-detail filters.

**Step-by-Step Instructions**:

1. **Prepare Your Image**
   - Create or download a PNG with transparent background
   - Recommended resolution: 500x500px minimum (higher for detail)
   - Ensure the subject is centered in the image
   - Save with transparency (alpha channel)

2. **Save the File**
   ```bash
   # Place your PNG in the public/filters/ directory
   public/filters/my-custom-filter.png
   ```

3. **Open the Filter Library**
   Open `src/lib/faceFilters.ts` in your code editor

4. **Add Your Filter to the Array**
   Scroll to the `FACE_FILTERS` array and add a new entry:

   ```typescript
   {
     id: "my-custom-filter",           // Unique ID (lowercase, hyphenated)
     name: "My Custom Filter",         // Display name (shown in UI)
     image: "/filters/my-custom-filter.png",  // Path to your PNG
     scale: 1.2,                       // Size multiplier
     offsetY: -60,                     // Vertical position adjustment
     offsetX: 0,                       // Horizontal adjustment (usually 0)
     placement: "forehead",            // Where to position it
   }
   ```

5. **Save and Test**
   - Refresh your photobooth application
   - Navigate to the Face tab in the tools panel
   - Your filter should appear in the grid
   - Click to select and see it on your face!

**Example - Adding Wizard Hat**:
```typescript
{
  id: "wizard-hat",
  name: "Wizard Hat",
  image: "/filters/wizard-hat.png",
  scale: 1.4,              // Larger for tall hat
  offsetY: -95,            // Very high up on forehead
  offsetX: 0,
  placement: "forehead",
}
```

---

### Method 2: Embedded SVG

This method is excellent for vector graphics, simple shapes, and keeping your code portable.

**Step-by-Step Instructions**:

1. **Create Your SVG**
   Design an SVG using tools like Figma, Illustrator, or code it manually:

   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
     <circle cx="100" cy="100" r="80" fill="#ff0000" />
     <text x="100" y="115" text-anchor="middle" font-size="60" fill="white">😎</text>
   </svg>
   ```

2. **Encode as Data URI**
   Open `src/lib/faceFilters.ts` and add to the `SAMPLE_FILTERS` object:

   ```typescript
   const SAMPLE_FILTERS = {
     // ... existing filters

     myCustomSvg: `data:image/svg+xml,${encodeURIComponent(`
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
         <circle cx="100" cy="100" r="80" fill="#ff0000" />
         <text x="100" y="115" text-anchor="middle" font-size="60" fill="white">😎</text>
       </svg>
     `)}`,
   };
   ```

3. **Add to FACE_FILTERS Array**

   ```typescript
   {
     id: "custom-svg-filter",
     name: "Custom SVG",
     image: SAMPLE_FILTERS.myCustomSvg,  // Reference your SVG
     scale: 1.0,
     offsetY: -30,
     placement: "eyes",
   }
   ```

4. **Save and Test**

**Advantages of SVG**:
- Infinitely scalable (no pixelation)
- Smaller file size
- Easy to edit colors/shapes in code
- No external dependencies

**Example - Simple Heart Eyes**:
```typescript
heartEyesSvg: `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
    <path d="M40,30 C40,20 30,15 25,15 C15,15 10,25 10,30 C10,40 25,50 25,50 C25,50 40,40 40,30 Z" fill="#ff1493"/>
    <path d="M90,30 C90,20 80,15 75,15 C65,15 60,25 60,30 C60,40 75,50 75,50 C75,50 90,40 90,30 Z" fill="#ff1493" transform="translate(100,0)"/>
  </svg>
`)}`,
```

---

### Method 3: Using External URLs (Advanced)

You can also reference images from external URLs:

```typescript
{
  id: "url-filter",
  name: "External Filter",
  image: "https://example.com/filter.png",  // External URL
  scale: 1.0,
  placement: "eyes",
}
```

**Note**: External images require CORS headers. Use this method only for trusted sources or your own CDN.

---

## Adjusting Filter Properties

Understanding how to fine-tune filter properties is key to perfect positioning.

### Scale Property

**Range**: `0.1` to `3.0` (practical range: 0.3 to 1.5)

**What it does**: Multiplies the size of the filter relative to the face region.

**Scale Guidelines by Item Type**:

| Item Type | Recommended Scale | Examples |
|-----------|-------------------|----------|
| Tiny accessories | 0.3 - 0.5 | Nose piercing, small nose ring |
| Small items | 0.4 - 0.6 | Clown nose, small mouth items |
| Medium items | 0.7 - 1.0 | Sunglasses, regular glasses, simple masks |
| Large items | 1.2 - 1.5 | Animal ears, crowns, large hats |
| Full overlays | 0.9 - 1.1 | Full-face masks, face frames |

**How Scale Works**:
```typescript
// The region width is calculated from landmarks
const regionWidth = region.width * scaleX;  // e.g., 300 pixels

// Your scale property multiples this
const finalWidth = regionWidth * filter.scale;  // e.g., 300 * 1.2 = 360 pixels
```

**Examples**:
```typescript
// Small clown nose
{ scale: 0.5, placement: "nose" }

// Regular sunglasses
{ scale: 0.9, placement: "eyes" }

// Large bunny ears
{ scale: 1.4, placement: "forehead" }
```

---

### OffsetY Property

**Range**: `-200` to `+200` pixels (practical range: -100 to +60)

**What it does**: Shifts the filter vertically in pixel space. Negative moves UP, positive moves DOWN.

**OffsetY Guidelines by Placement**:

| Placement | Typical Range | Use Cases |
|-----------|---------------|-----------|
| forehead | -70 to -100 | Push ears/crowns higher above head |
| eyes | -20 to -10 | Lift glasses slightly above eyes |
| nose | +10 to +25 | Lower clown nose to tip |
| mouth | +40 to +60 | Position mustache on upper lip |
| full-face | -10 to +10 | Fine-tune mask centering |

**How OffsetY Works**:
```typescript
// After calculating center of region
const centerY = region.centerY * scaleY;  // e.g., 200 pixels

// Your offsetY shifts this point
const finalY = centerY + filter.offsetY;  // e.g., 200 + (-80) = 120 pixels
```

**Examples**:
```typescript
// Cat ears high above forehead
{ offsetY: -90, placement: "forehead" }

// Sunglasses resting on nose bridge
{ offsetY: -15, placement: "eyes" }

// Mustache on upper lip
{ offsetY: 45, placement: "mouth" }
```

**Pro Tips**:
- Start with the placement default and adjust from there
- Forehead items almost always need negative offsetY
- Mouth items almost always need positive offsetY
- Bigger heads need bigger offsets (proportional)

---

### OffsetX Property

**Range**: `-200` to `+200` pixels (rarely used outside -30 to +30)

**What it does**: Shifts the filter horizontally. Negative moves LEFT, positive moves RIGHT.

**When to Use OffsetX**:
- Almost never needed (filters auto-center on face)
- Asymmetric filters (e.g., monocle on one eye)
- Artistic off-center effects
- Correcting imperfect filter images

**Examples**:
```typescript
// Monocle on right eye only
{ offsetX: 40, placement: "eyes" }

// Cigarette in corner of mouth
{ offsetX: 35, placement: "mouth" }
```

**Important**: Due to video mirroring, offsetX direction is reversed:
- Positive offsetX appears on LEFT side of face (from user's perspective)
- Negative offsetX appears on RIGHT side of face

---

### Rotation (Automatic)

**Range**: Calculated automatically from eye alignment

**What it does**: Rotates the filter to match head tilt.

**How it works**:
```typescript
// Calculate angle between eyes
const rotation = Math.atan2(rightEyeY - leftEyeY, rightEyeX - leftEyeX);

// Apply to canvas transform
ctx.rotate(rotation);
```

**This is automatic** - you don't need to configure rotation. The filter will naturally:
- Tilt when you tilt your head
- Stay aligned with facial features
- Follow head movements smoothly

---

### Combining Properties

**Example 1: Perfect Sunglasses**
```typescript
{
  id: "aviators",
  name: "Aviator Sunglasses",
  image: "/filters/aviators.png",
  scale: 0.95,        // Slightly smaller than eye region
  offsetY: -18,       // Lift to sit on nose bridge
  offsetX: 0,         // Centered
  placement: "eyes",
}
```

**Example 2: Dramatic Crown**
```typescript
{
  id: "royal-crown",
  name: "Royal Crown",
  image: "/filters/crown-gold.png",
  scale: 1.35,        // Large and prominent
  offsetY: -95,       // Very high above forehead
  offsetX: 0,
  placement: "forehead",
}
```

**Example 3: Silly Nose**
```typescript
{
  id: "pig-snout",
  name: "Pig Snout",
  image: "/filters/pig-nose.png",
  scale: 0.55,        // Small and cute
  offsetY: 20,        // Down on nose tip
  offsetX: 0,
  placement: "nose",
}
```

---

## Best Practices for Filter Design

### Image Requirements

#### For PNG Files:
1. **Transparent Background**
   - Must have alpha channel
   - No white/colored backgrounds (will show as rectangle)
   - Use tools like Photoshop, GIMP, or online editors

2. **Resolution**
   - Minimum: 500×500 pixels
   - Recommended: 1000×1000 pixels
   - Maximum: 2000×2000 pixels (performance consideration)
   - Higher resolution = sharper on large displays

3. **Aspect Ratio**
   - Component maintains aspect ratio automatically
   - Design filters in their natural proportions
   - Avoid stretching/squashing

4. **File Size**
   - Keep under 500 KB for performance
   - Optimize PNGs with tools like TinyPNG
   - Consider SVG for simple shapes (smaller size)

#### For SVG Files:
1. **ViewBox**
   - Always include viewBox attribute
   - Use `viewBox="0 0 200 200"` for square filters
   - Adjust for non-square filters (e.g., "0 0 300 100" for wide items)

2. **Simplicity**
   - Fewer paths = better performance
   - Avoid complex gradients and filters
   - Test rendering speed with your design

3. **Colors**
   - Use hex colors or named colors
   - Avoid external stylesheets
   - Inline all styles

---

### Design Guidelines

#### 1. Center Your Composition
```
BAD:                    GOOD:
┌──────────┐           ┌──────────┐
│          │           │          │
│  👓      │           │    👓    │
│          │           │          │
└──────────┘           └──────────┘
```
Filters are positioned by their center point. Off-center designs will appear misaligned.

#### 2. Leave Padding
```
BAD:                    GOOD:
┌──────────┐           ┌──────────┐
│👓👓👓👓👓👓│           │  👓👓👓  │
│👓👓👓👓👓👓│           │  👓👓👓  │
└──────────┘           └──────────┘
```
Leave ~10-20% padding around your subject. This accounts for different face sizes and prevents edge clipping.

#### 3. Test at Different Scales
- View your filter at 50% scale
- View at 150% scale
- Ensure details are visible at both extremes
- Avoid tiny details that disappear when small

#### 4. Consider Face Movement
- Filters stay anchored to face regions
- Don't rely on precise alignment with features
- Design filters that look good with slight misalignment
- Test by moving your head around

---

### Testing Your Filters

#### Debug Overlay
Enable debug mode to see exactly where filters are positioned:

```typescript
<FaceFilterCamera
  showDebugOverlay={true}  // Add this prop
  // ... other props
/>
```

**Debug Overlay Shows**:
- Red box: Full face bounding box
- Green box: Selected region (eyes, forehead, nose, mouth)
- Yellow dot: Center point where filter is anchored
- Rotation angle: Displayed as text

**How to Use Debug Mode**:
1. Enable showDebugOverlay
2. Select your filter
3. Observe the green region box
4. Adjust scale to fit within green box
5. Adjust offsetY/offsetX to move center point
6. Disable debug mode when satisfied

#### Testing Checklist
- [ ] Filter appears at correct placement
- [ ] Filter scales appropriately with face size
- [ ] Filter rotates smoothly when head tilts
- [ ] Filter doesn't clip at edges
- [ ] Filter is visible on different face sizes
- [ ] Filter performs well (no lag/stuttering)
- [ ] Filter looks good in screenshots
- [ ] Filter works with multiple faces (if applicable)

---

## Troubleshooting Guide

### Problem: Filter Not Appearing

**Possible Causes**:
1. **Incorrect image path**
   ```typescript
   // ❌ BAD
   image: "filters/my-filter.png"

   // ✅ GOOD
   image: "/filters/my-filter.png"  // Note the leading slash
   ```

2. **Image file not found**
   - Check file exists in `public/filters/`
   - Verify file name matches exactly (case-sensitive)
   - Refresh browser cache (Ctrl+Shift+R)

3. **Placement set to "none"**
   - Ensure placement is one of: "full-face", "eyes", "forehead", "nose", "mouth"

4. **No faces detected**
   - Check webcam permission
   - Ensure face is visible and well-lit
   - Try adjusting minDetectionConfidence to 0.3

**Debugging Steps**:
```typescript
// Add console logging
const img = new Image();
img.onload = () => console.log("Filter loaded:", filter.id);
img.onerror = () => console.error("Filter failed:", filter.id);
img.src = filter.image;
```

---

### Problem: Filter Too Small or Too Large

**Solution**: Adjust scale property

```typescript
// Too small?
scale: 0.5  →  scale: 1.2  // Increase

// Too large?
scale: 2.0  →  scale: 0.8  // Decrease
```

**Finding the Right Scale**:
1. Start with placement default (see reference)
2. Adjust in 0.1 increments
3. Test with different face sizes (get closer/farther from camera)

---

### Problem: Filter Poorly Positioned

**Solution**: Adjust offsetY and/or offsetX

```typescript
// Filter too low?
offsetY: 0  →  offsetY: -40  // Move up

// Filter too high?
offsetY: -100  →  offsetY: -60  // Move down

// Filter off to one side?
offsetX: 0  →  offsetX: -20  // Adjust horizontally
```

**Pro Tip**: Use debug overlay to visualize the region center point and adjust accordingly.

---

### Problem: Filter Not Rotating with Head

**Cause**: Rotation is applied in the rendering loop. If filters aren't rotating, check:

1. **FaceFilterCamera implementation**
   Ensure rotation is applied in the canvas transform:
   ```typescript
   ctx.rotate(face.rotation);
   ```

2. **Eye landmarks**
   Rotation requires both eyes to be detected. If one eye is obscured, rotation may be incorrect.

---

### Problem: Performance Issues (Lag/Stuttering)

**Solutions**:

1. **Reduce PNG resolution**
   - Resize PNG to 1000×1000 or smaller
   - Use tools like ImageMagick, Photoshop, or online compressors

2. **Use SVG instead of PNG**
   - SVG is lighter and faster for simple shapes

3. **Lower detection confidence**
   ```typescript
   minDetectionConfidence: 0.5  →  0.4  // Less CPU intensive
   ```

4. **Reduce maxFaces**
   ```typescript
   maxFaces: 4  →  maxFaces: 1  // Track fewer faces
   ```

---

### Problem: Filter Looks Pixelated

**Solution**: Increase source image resolution

```typescript
// Use higher-res source
500×500 PNG  →  1500×1500 PNG
```

---

### Problem: Filter Has White Background

**Cause**: PNG doesn't have transparency

**Solution**:
1. Re-export PNG with alpha channel enabled
2. Use online tools like Remove.bg to remove background
3. In Photoshop: Save As → PNG-24 → Transparency checked

---

## Advanced Topics

### Custom Face Regions

You can modify `useFaceDetection.ts` to create custom regions using any of the 468 landmarks.

**Example - Creating a "Forehead Center" Region**:
```typescript
// In calculateFaceData function
const foreheadCenter = {
  x: landmarks[10].x - 0.05,      // Landmark 10 is forehead top
  y: landmarks[10].y,
  width: 0.1,                      // Small region
  height: 0.1,
  centerX: landmarks[10].x,
  centerY: landmarks[10].y,
};
```

---

### Filter Animations (Experimental)

SVG filters can include CSS animations:

```typescript
animatedHeart: `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
      .heart { animation: pulse 1s infinite; transform-origin: center; }
    </style>
    <path class="heart" d="M50,80 L20,50 Q10,40 20,30 T50,40 T80,30 Q90,40 80,50 Z" fill="red"/>
  </svg>
`)}`,
```

**Note**: Performance may vary. Test thoroughly.

---

### Multiple Filters (Future Enhancement)

Currently, one filter per face is supported. To enable multiple filters:

1. Modify FaceFilterCamera to accept an array of filters
2. Loop through each filter in the rendering loop
3. Layer filters in order (background to foreground)

---

## Next Steps

Now that you understand the face filter system:

1. **Read the Code**: Review the three core files with inline comments
2. **Try the Examples**: Use template filters to see real configurations
3. **Experiment**: Create your first custom filter
4. **Use the Editor**: Build the FilterEditor component for visual editing
5. **Share**: Create awesome filters and share your creations!

---

## Additional Resources

- **MediaPipe Documentation**: https://developers.google.com/mediapipe/solutions/vision/face_landmarker
- **SVG Tutorial**: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial
- **PNG Optimization**: https://tinypng.com
- **Filter Templates**: See `public/filters/templates/` directory

---

Happy filtering! 🎭✨
