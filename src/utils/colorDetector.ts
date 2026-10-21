import { CubeColor, CUBE_HEX_COLORS } from './cubeState';

export interface ColorDetectionResult {
  color: CubeColor;
  confidence: number;
  label: string;
  hex: string;
  rgb: [number, number, number];
  hsv: [number, number, number];
}

export const COLOR_CONFIG: Record<CubeColor, { label: string; nameVi: string; hex: string }> = {
  white: { label: 'W', nameVi: 'Trắng', hex: '#FFFFFF' },
  yellow: { label: 'Y', nameVi: 'Vàng', hex: '#FACC15' },
  green: { label: 'G', nameVi: 'Xanh Lá', hex: '#10B981' },
  blue: { label: 'B', nameVi: 'Xanh Dương', hex: '#3B82F6' },
  orange: { label: 'O', nameVi: 'Cam', hex: '#F97316' },
  red: { label: 'R', nameVi: 'Đỏ', hex: '#EF4444' },
};

/**
 * Convert RGB (0-255) to HSV
 * H: 0-360 deg, S: 0-1, V: 0-1
 */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
      if (h < 0) h += 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
  }

  return [h, s, v];
}

/**
 * Robust Color Classifier for 3x3 Rubik's Cube Facelets
 * Takes average R, G, B values and classifies into:
 * 'white' | 'yellow' | 'green' | 'blue' | 'orange' | 'red'
 */
export function classifyRubikColor(r: number, g: number, b: number): ColorDetectionResult {
  const [h, s, v] = rgbToHsv(r, g, b);

  // 0. VERY DARK / BLACK (Camera uninitialized, blocked, or loading)
  if (v < 0.20) {
    return {
      color: 'white',
      confidence: 0,
      label: '?',
      hex: '#334155',
      rgb: [r, g, b],
      hsv: [h, s, v],
    };
  }

  // 1. WHITE: Low saturation, reasonable brightness, balanced RGB channels
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if ((s < 0.22 && v > 0.32) || (s < 0.28 && maxDiff < 32 && v > 0.45)) {
    const confidence = Math.min(99, Math.max(86, Math.round(98 - s * 45)));
    return {
      color: 'white',
      confidence,
      label: 'W',
      hex: CUBE_HEX_COLORS.white,
      rgb: [r, g, b],
      hsv: [h, s, v],
    };
  }

  // 2. GREEN: Hue between 75° and 165°
  if (h >= 75 && h <= 165) {
    const dist = Math.abs(h - 120) / 45;
    const confidence = Math.min(99, Math.max(85, Math.round(98 - dist * 12)));
    return {
      color: 'green',
      confidence,
      label: 'G',
      hex: CUBE_HEX_COLORS.green,
      rgb: [r, g, b],
      hsv: [h, s, v],
    };
  }

  // 3. BLUE: Hue between 166° and 265°
  if (h > 165 && h <= 265) {
    const dist = Math.abs(h - 215) / 50;
    const confidence = Math.min(99, Math.max(85, Math.round(98 - dist * 12)));
    return {
      color: 'blue',
      confidence,
      label: 'B',
      hex: CUBE_HEX_COLORS.blue,
      rgb: [r, g, b],
      hsv: [h, s, v],
    };
  }

  // 4. YELLOW: Hue 42° - 74°, both R & G strong, B lower
  if (h >= 42 && h <= 74) {
    // If very high Red and low Green, could be orange edge
    if (h < 46 && r > 200 && g < 125) {
      return {
        color: 'orange',
        confidence: 88,
        label: 'O',
        hex: CUBE_HEX_COLORS.orange,
        rgb: [r, g, b],
        hsv: [h, s, v],
      };
    }
    const dist = Math.abs(h - 58) / 16;
    const confidence = Math.min(99, Math.max(86, Math.round(98 - dist * 11)));
    return {
      color: 'yellow',
      confidence,
      label: 'Y',
      hex: CUBE_HEX_COLORS.yellow,
      rgb: [r, g, b],
      hsv: [h, s, v],
    };
  }

  // 5. ORANGE: Hue 11° - 41°
  if (h >= 11 && h < 42) {
    // Distinguish between Orange and Red
    if (h < 15 && g < 55) {
      return {
        color: 'red',
        confidence: 89,
        label: 'R',
        hex: CUBE_HEX_COLORS.red,
        rgb: [r, g, b],
        hsv: [h, s, v],
      };
    }
    const dist = Math.abs(h - 26) / 15;
    const confidence = Math.min(99, Math.max(85, Math.round(98 - dist * 12)));
    return {
      color: 'orange',
      confidence,
      label: 'O',
      hex: CUBE_HEX_COLORS.orange,
      rgb: [r, g, b],
      hsv: [h, s, v],
    };
  }

  // 6. RED: Hue < 11° or Hue >= 340°, and must have reasonable saturation and brightness
  if ((h < 11 || h >= 340) && s > 0.35 && v > 0.22) {
    const dist = h < 11 ? h / 11 : (360 - h) / 20;
    const confidence = Math.min(99, Math.max(86, Math.round(98 - dist * 11)));
    return {
      color: 'red',
      confidence,
      label: 'R',
      hex: CUBE_HEX_COLORS.red,
      rgb: [r, g, b],
      hsv: [h, s, v],
    };
  }

  // Fallback: Euclidean distance in RGB to reference centers
  const referenceColors: { color: CubeColor; rgb: [number, number, number] }[] = [
    { color: 'white', rgb: [245, 245, 245] },
    { color: 'yellow', rgb: [245, 215, 20] },
    { color: 'green', rgb: [16, 175, 115] },
    { color: 'blue', rgb: [30, 115, 235] },
    { color: 'orange', rgb: [245, 115, 20] },
    { color: 'red', rgb: [225, 40, 40] },
  ];

  let bestColor: CubeColor = 'white';
  let minDistance = Infinity;

  for (const ref of referenceColors) {
    const dR = r - ref.rgb[0];
    const dG = g - ref.rgb[1];
    const dB = b - ref.rgb[2];
    const dist = Math.sqrt(dR * dR * 1.2 + dG * dG * 1.5 + dB * dB);
    if (dist < minDistance) {
      minDistance = dist;
      bestColor = ref.color;
    }
  }

  return {
    color: bestColor,
    confidence: 85,
    label: COLOR_CONFIG[bestColor].label,
    hex: COLOR_CONFIG[bestColor].hex,
    rgb: [r, g, b],
    hsv: [h, s, v],
  };
}

/**
 * Sample 9 region centers from a video element via canvas
 * gridNormalized: 3x3 array of [normX, normY] coordinates (0 to 1)
 */
export function sample9TilesFromCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  sampleRadius = 10,
  isMirrored = false
): ColorDetectionResult[] {
  const results: ColorDetectionResult[] = [];

  // 3x3 normalized grid centers in the central 55% area of viewport
  // rows 0..2, cols 0..2
  const centerOffsets = [-0.17, 0, 0.17];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let normX = 0.5 + centerOffsets[c];
      const normY = 0.5 + centerOffsets[r];

      // If mirrored (front webcam), invert X
      if (isMirrored) {
        normX = 1 - normX;
      }

      const pixelX = Math.round(normX * canvasWidth);
      const pixelY = Math.round(normY * canvasHeight);

      // Average pixel block around (pixelX, pixelY)
      const xStart = Math.max(0, pixelX - sampleRadius);
      const yStart = Math.max(0, pixelY - sampleRadius);
      const boxWidth = Math.min(canvasWidth - xStart, sampleRadius * 2);
      const boxHeight = Math.min(canvasHeight - yStart, sampleRadius * 2);

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let pixelCount = 0;

      try {
        const imgData = ctx.getImageData(xStart, yStart, boxWidth, boxHeight);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          sumR += data[i];
          sumG += data[i + 1];
          sumB += data[i + 2];
          pixelCount++;
        }
      } catch {
        // Fallback default color
      }

      const avgR = pixelCount > 0 ? Math.round(sumR / pixelCount) : 200;
      const avgG = pixelCount > 0 ? Math.round(sumG / pixelCount) : 200;
      const avgB = pixelCount > 0 ? Math.round(sumB / pixelCount) : 200;

      results.push(classifyRubikColor(avgR, avgG, avgB));
    }
  }

  return results;
}
