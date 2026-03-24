# Face Filter Property Quick Reference

A concise cheat sheet for quickly creating and adjusting face-tracking filters.

---

## Filter Configuration Template

```typescript
{
  id: "unique-filter-id",           // Required: kebab-case string
  name: "Display Name",              // Required: shown in UI
  image: "/filters/image.png",       // Required: path or data URI
  placement: "forehead",             // Required: see placement types below
  scale: 1.2,                        // Optional: size multiplier (default: 1.0)
  offsetY: -80,                      // Optional: vertical shift in pixels
  offsetX: 0,                        // Optional: horizontal shift in pixels
  thumbnail: "/filters/thumb.png",   // Optional: preview image
}
```

---

## Property Reference Table

| Property  | Type   | Range/Options | Purpose | Example |
|-----------|--------|---------------|---------|---------|
| `id` | string | any | Unique identifier (kebab-case) | `"cat-ears"` |
| `name` | string | any | Display name in UI | `"Cat Ears"` |
| `image` | string | path or data URI | Image source | `"/filters/cat.png"` |
| `placement` | enum | 5 types (see below) | Face region to target | `"forehead"` |
| `scale` | number | 0.1 - 3.0 | Size multiplier | `1.2` |
| `offsetY` | number | -200 to +200 | Vertical shift (pixels) | `-80` |
| `offsetX` | number | -200 to +200 | Horizontal shift (pixels) | `0` |
| `thumbnail` | string | path | Optional preview image | `"/thumb.png"` |

---

## Placement Types

### Quick Reference

| Placement | Default Scale | Default OffsetY | Common Uses |
|-----------|---------------|-----------------|-------------|
| `full-face` | 1.0 | 0 | Masks, overlays, frames |
| `eyes` | 0.7 | -20 | Glasses, eye makeup, masks |
| `forehead` | 1.2 | -80 | Ears, crowns, hats, halos |
| `nose` | 0.4 | +15 | Clown nose, snout, piercings |
| `mouth` | 0.6 | +50 | Mustaches, beards, grills |

### Detailed Placement Guide

#### `"full-face"`
- **Covers**: Entire face with padding
- **Landmarks**: Forehead (10) to chin (152), cheek to cheek (234, 454)
- **Best for**: Full-face masks, decorative frames, screen effects
- **Typical scale**: 0.9 - 1.1
- **Typical offsetY**: -10 to +10

#### `"eyes"`
- **Covers**: Both eyes including eyebrows
- **Landmarks**: Eye corners (33, 133, 362, 263), eyebrow tops (66, 296)
- **Best for**: Sunglasses, eye accessories, party masks
- **Typical scale**: 0.7 - 1.0
- **Typical offsetY**: -25 to -10

#### `"forehead"`
- **Covers**: Top of head to eyebrows
- **Landmarks**: Forehead top (10), eyebrows (66, 296)
- **Best for**: Animal ears, crowns, hats, headbands
- **Typical scale**: 1.2 - 1.5
- **Typical offsetY**: -70 to -100

#### `"nose"`
- **Covers**: Nose bridge to tip
- **Landmarks**: Bridge (6), tip (1), nostrils (129, 358)
- **Best for**: Clown nose, pig snout, small accessories
- **Typical scale**: 0.3 - 0.6
- **Typical offsetY**: +10 to +25

#### `"mouth"`
- **Covers**: Lip area
- **Landmarks**: Mouth corners (61, 291), lips (0, 17)
- **Best for**: Mustaches, beards, mouth accessories
- **Typical scale**: 0.5 - 0.8
- **Typical offsetY**: +40 to +60

---

## Scale Guidelines

### By Item Size

| Item Type | Scale Range | Examples |
|-----------|-------------|----------|
| Tiny accessories | 0.3 - 0.5 | Nose piercing, small stud |
| Small items | 0.4 - 0.6 | Clown nose, small mustache |
| Medium items | 0.7 - 1.0 | Sunglasses, regular glasses |
| Large items | 1.2 - 1.5 | Animal ears, crowns, big hats |
| Full overlays | 0.9 - 1.1 | Full-face masks, frames |

### Scale Formulas

```typescript
// Final size calculation
finalWidth = regionWidth × scale

// Examples:
// Eyes region (300px) with scale 0.9
300 × 0.9 = 270px

// Forehead region (250px) with scale 1.4
250 × 1.4 = 350px
```

---

## Offset Guidelines

### OffsetY (Vertical Position)

| Direction | Value | Effect | Use Cases |
|-----------|-------|--------|-----------|
| UP | Negative (-) | Moves towards top of head | Forehead items, raise glasses |
| DOWN | Positive (+) | Moves towards chin | Mouth items, lower nose |
| Centered | 0 | No adjustment | Full-face, pre-centered items |

#### Common OffsetY Values

```typescript
// Forehead items (ears, crowns, hats)
offsetY: -70   // Low on forehead
offsetY: -85   // Medium height
offsetY: -100  // High above head

// Eyes items (glasses, eye masks)
offsetY: -25   // Lifted high
offsetY: -15   // On nose bridge
offsetY: -10   // Lower on nose

// Nose items
offsetY: 15    // On bridge
offsetY: 20    // On tip
offsetY: 25    // Below nose

// Mouth items (mustaches, beards)
offsetY: 40    // Above upper lip
offsetY: 50    // On upper lip
offsetY: 60    // Below lip

// Full-face
offsetY: 0     // Centered (default)
offsetY: -5    // Slight lift
offsetY: 5     // Slight lower
```

### OffsetX (Horizontal Position)

⚠️ **Rarely needed** - filters auto-center on face regions.

| Value | Effect (mirrored view) | Use Cases |
|-------|------------------------|-----------|
| Negative (-) | Shifts RIGHT | Right-side asymmetric items |
| Positive (+) | Shifts LEFT | Left-side asymmetric items |
| 0 | Centered (default) | Most filters |

#### When to Use OffsetX

```typescript
// Monocle on one eye
{ offsetX: 40, placement: "eyes" }  // Appears on left eye

// Cigarette in corner of mouth
{ offsetX: 30, placement: "mouth" }  // Left corner

// Eyepatch
{ offsetX: -35, placement: "eyes" }  // Right eye
```

---

## Common Filter Recipes

### Sunglasses
```typescript
{
  id: "sunglasses",
  name: "Sunglasses",
  image: "/filters/sunglasses.png",
  placement: "eyes",
  scale: 0.95,
  offsetY: -18,
  offsetX: 0,
}
```

### Animal Ears (Cat/Bunny/Dog)
```typescript
{
  id: "cat-ears",
  name: "Cat Ears",
  image: "/filters/cat-ears.png",
  placement: "forehead",
  scale: 1.4,
  offsetY: -90,
  offsetX: 0,
}
```

### Crown/Tiara
```typescript
{
  id: "crown",
  name: "Royal Crown",
  image: "/filters/crown.png",
  placement: "forehead",
  scale: 1.3,
  offsetY: -85,
  offsetX: 0,
}
```

### Clown Nose
```typescript
{
  id: "clown-nose",
  name: "Clown Nose",
  image: "/filters/clown-nose.png",
  placement: "nose",
  scale: 0.5,
  offsetY: 15,
  offsetX: 0,
}
```

### Mustache
```typescript
{
  id: "mustache",
  name: "Mustache",
  image: "/filters/mustache.png",
  placement: "mouth",
  scale: 0.8,
  offsetY: 45,
  offsetX: 0,
}
```

### Full-Face Mask
```typescript
{
  id: "pixel-mask",
  name: "Pixel Mask",
  image: "/filters/pixel-mask.png",
  placement: "full-face",
  scale: 1.0,
  offsetY: 0,
  offsetX: 0,
}
```

---

## Image Requirements Checklist

### PNG Files
- ✅ Transparent background (alpha channel)
- ✅ Minimum resolution: 500×500px
- ✅ Recommended: 1000×1000px
- ✅ Maximum: 2000×2000px (performance)
- ✅ File size: Under 500 KB
- ✅ Centered composition
- ✅ 10-20% padding around subject

### SVG Files
- ✅ Include `viewBox` attribute
- ✅ Inline all styles
- ✅ Use simple paths (performance)
- ✅ Avoid external dependencies
- ✅ Use hex or named colors

---

## Adding Filters - Quick Steps

### Method 1: PNG File
```bash
# 1. Place file in public folder
public/filters/my-filter.png

# 2. Add to faceFilters.ts
{
  id: "my-filter",
  name: "My Filter",
  image: "/filters/my-filter.png",
  placement: "forehead",
  scale: 1.2,
  offsetY: -80,
}
```

### Method 2: SVG Data URI
```typescript
// 1. In SAMPLE_FILTERS object
myFilter: `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <!-- SVG content -->
  </svg>
`)}`,

// 2. Reference in FACE_FILTERS array
{
  id: "my-svg",
  name: "My SVG",
  image: SAMPLE_FILTERS.myFilter,
  placement: "eyes",
  scale: 1.0,
}
```

---

## Debugging Tips

### Enable Debug Overlay
```typescript
<FaceFilterCamera showDebugOverlay={true} />
```

**Shows**:
- 🟥 Red box: Full face bounding box
- 🟩 Green box: Selected placement region
- 🟨 Yellow dot: Filter anchor point
- Text: Rotation angle

### Common Issues

| Problem | Solution |
|---------|----------|
| Filter not showing | Check image path (must start with `/`) |
| Too small/large | Adjust `scale` property |
| Wrong position | Adjust `offsetY` (and rarely `offsetX`) |
| Not rotating | Ensure both eyes are visible |
| Pixelated | Increase source image resolution |
| White background | Re-export PNG with transparency |
| Performance lag | Reduce PNG resolution or use SVG |

---

## Keyboard Shortcuts (for quick adjustments)

### Mental Math for Adjustments

```typescript
// Need filter 20% bigger?
scale: 1.0 → 1.2  // (+20%)

// Need filter 30% smaller?
scale: 1.0 → 0.7  // (-30%)

// Need filter 2x as big?
scale: 1.0 → 2.0  // (double)

// Need filter to move 40px up?
offsetY: 0 → -40  // (negative = up)

// Need filter to move 30px down?
offsetY: 0 → 30   // (positive = down)
```

---

## Landmark Reference (Advanced)

Key facial landmarks for custom regions:

```
Face Outline:
  10  - Top of head (forehead)
  152 - Bottom of chin
  234 - Left cheek
  454 - Right cheek

Eyes:
  33  - Left eye outer corner
  133 - Left eye inner corner
  362 - Right eye inner corner
  263 - Right eye outer corner

Eyebrows:
  66  - Left eyebrow outer
  107 - Left eyebrow inner
  336 - Right eyebrow inner
  296 - Right eyebrow outer

Nose:
  6   - Nose bridge (between eyes)
  1   - Nose tip
  129 - Left nostril
  358 - Right nostril

Mouth:
  61  - Left mouth corner
  291 - Right mouth corner
  0   - Upper lip top
  17  - Lower lip bottom
```

---

## File Paths

```
Project Structure:
  public/
    filters/             ← Your PNG/SVG files go here
      templates/         ← Example template filters
  src/
    lib/
      faceFilters.ts     ← Add filters to FACE_FILTERS array
    hooks/
      useFaceDetection.ts  ← Face detection logic
    components/
      photobooth/
        FaceFilterCamera.tsx  ← Rendering logic
        ToolsPanel.tsx        ← Filter selection UI
```

---

## Quick Commands

```bash
# Create a new filter directory
mkdir -p public/filters

# Optimize PNG
# Use https://tinypng.com or:
pngquant input.png --output output.png

# Convert JPG to PNG with transparency
# Use GIMP, Photoshop, or online tools like remove.bg
```

---

## Resources

- **Full Guide**: See `FACE_FILTERS_GUIDE.md` for detailed explanations
- **Templates**: Check `public/filters/templates/` for examples
- **MediaPipe Docs**: https://developers.google.com/mediapipe/solutions/vision/face_landmarker
- **SVG Reference**: https://developer.mozilla.org/en-US/docs/Web/SVG

---

## Pro Tips

💡 **Start with defaults**: Use the placement's default scale and offsetY, then adjust incrementally

💡 **Test with movement**: Tilt your head, move closer/farther to ensure filters look good at all angles

💡 **Use debug overlay**: Always enable debug mode when fine-tuning positions

💡 **Iterate in small steps**: Adjust properties by 0.1 (scale) or 5px (offset) at a time

💡 **Consider face diversity**: Test filters on different face shapes and sizes

💡 **Optimize images**: Smaller files = better performance

💡 **Center your designs**: Filters anchor at the center point - keep subjects centered in images

---

**Happy filter creation!** 🎭✨
