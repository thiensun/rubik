import React, { useMemo } from 'react';
import {
  ColorScheme,
  DEFAULT_COLOR_SCHEME,
  getCaseState,
  PermutationArrow,
} from '../engine/algSimulator';
import { CUBE_HEX_COLORS, CubeColor, FaceKey } from '../utils/cubeState';
import { CubeSize } from '../core/types';
import { getPreExecutionParametricState } from '../core/simulator';
import { DiagramArrow } from '../data/algorithms/beginnerAlgs';

export interface DynamicCaseDiagramProps {
  id: string;
  mainAlg: string;
  setupAlg?: string;
  category: string;
  subGroup?: string;
  colorScheme?: ColorScheme;
  size?: number;
  cubeSize?: CubeSize;
  customArrows?: Array<PermutationArrow | DiagramArrow>;
}

const COLOR_HEX_MAP: Record<CubeColor, string> = {
  ...CUBE_HEX_COLORS,
  yellow: '#FFD000',
  white: '#FFFFFF',
  green: '#009B48',
  blue: '#0046AD',
  red: '#B71234',
  orange: '#FF5800',
};

const GREY_STICKER = '#D1D5DB';
const SUBSTRATE_DARK = '#1E232A';

// Build an isometric polygon string for a 3x3 grid cell interpolated on a 4-corner quad
function getQuadCellPolygon(
  q00: [number, number],
  q10: [number, number],
  q11: [number, number],
  q01: [number, number],
  row: number,
  col: number,
  pad = 0.04,
): string {
  const u0 = (col + pad) / 3;
  const u1 = (col + 1 - pad) / 3;
  const v0 = (row + pad) / 3;
  const v1 = (row + 1 - pad) / 3;

  const bilerp = (u: number, v: number): [number, number] => {
    const topX = q00[0] + (q10[0] - q00[0]) * u;
    const topY = q00[1] + (q10[1] - q00[1]) * u;
    const botX = q01[0] + (q11[0] - q01[0]) * u;
    const botY = q01[1] + (q11[1] - q01[1]) * u;
    return [topX + (botX - topX) * v, topY + (botY - topY) * v];
  };

  const p0 = bilerp(u0, v0);
  const p1 = bilerp(u1, v0);
  const p2 = bilerp(u1, v1);
  const p3 = bilerp(u0, v1);

  return `${p0[0].toFixed(1)},${p0[1].toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} ${p3[0].toFixed(1)},${p3[1].toFixed(1)}`;
}

// Helper: Determine if a cubie (given its 2 or 3 sticker colors) is the target F2L/LBL pair
function isTargetPieceColors(colors: CubeColor[], targetPairColors: CubeColor[]): boolean {
  if (colors.length < 2) return false;
  return colors.every((c) => targetPairColors.includes(c));
}

// Map each (face, index) on the 54-sticker net to all stickers of that physical cubie
const CUBIE_GROUPS: { face: FaceKey; idx: number }[][] = [
  // 8 Corners
  [{ face: 'U', idx: 0 }, { face: 'L', idx: 0 }, { face: 'B', idx: 2 }], // UBL
  [{ face: 'U', idx: 2 }, { face: 'B', idx: 0 }, { face: 'R', idx: 2 }], // UBR
  [{ face: 'U', idx: 6 }, { face: 'F', idx: 0 }, { face: 'L', idx: 2 }], // UFL
  [{ face: 'U', idx: 8 }, { face: 'R', idx: 0 }, { face: 'F', idx: 2 }], // UFR
  [{ face: 'D', idx: 0 }, { face: 'L', idx: 8 }, { face: 'F', idx: 6 }], // DFL
  [{ face: 'D', idx: 2 }, { face: 'F', idx: 8 }, { face: 'R', idx: 6 }], // DFR
  [{ face: 'D', idx: 6 }, { face: 'B', idx: 8 }, { face: 'L', idx: 6 }], // DBL
  [{ face: 'D', idx: 8 }, { face: 'R', idx: 8 }, { face: 'B', idx: 6 }], // DBR
  // 12 Edges
  [{ face: 'U', idx: 1 }, { face: 'B', idx: 1 }], // UB
  [{ face: 'U', idx: 3 }, { face: 'L', idx: 1 }], // UL
  [{ face: 'U', idx: 5 }, { face: 'R', idx: 1 }], // UR
  [{ face: 'U', idx: 7 }, { face: 'F', idx: 1 }], // UF
  [{ face: 'F', idx: 3 }, { face: 'L', idx: 5 }], // FL
  [{ face: 'F', idx: 5 }, { face: 'R', idx: 3 }], // FR
  [{ face: 'B', idx: 3 }, { face: 'R', idx: 5 }], // BR
  [{ face: 'B', idx: 5 }, { face: 'L', idx: 3 }], // BL
  [{ face: 'D', idx: 1 }, { face: 'F', idx: 7 }], // DF
  [{ face: 'D', idx: 3 }, { face: 'L', idx: 7 }], // DL
  [{ face: 'D', idx: 5 }, { face: 'R', idx: 7 }], // DR
  [{ face: 'D', idx: 7 }, { face: 'B', idx: 7 }], // DB
];

export const DynamicCaseDiagram: React.FC<DynamicCaseDiagramProps> = React.memo(({
  id,
  mainAlg,
  setupAlg,
  category,
  subGroup = '',
  colorScheme = DEFAULT_COLOR_SCHEME,
  size = 86,
  cubeSize,
  customArrows,
}) => {
  const effectiveAlg = setupAlg || mainAlg;
  const sim = useMemo(() => getCaseState(effectiveAlg, colorScheme), [effectiveAlg, colorScheme]);

  const idLower = id.toLowerCase();
  const catUpper = category.toUpperCase();
  const subUpper = subGroup.toUpperCase();

  const effectiveCubeSize: CubeSize =
    cubeSize ??
    (catUpper.includes('ORTEGA') ||
    catUpper.includes('CLL') ||
    catUpper.includes('PBL') ||
    idLower.startsWith('2x2-')
      ? 2
      : catUpper.includes('L2C') ||
        catUpper.includes('L2E') ||
        catUpper.includes('PARITY') ||
        idLower.startsWith('4x4-')
      ? 4
      : 3);

  // Distinguish LBL Last Layer cases (which belong to Top-Down 2D view) from First/Second Layer Isometric cases
  const isLBLLastLayer =
    idLower.includes('yellow-cross') ||
    idLower.includes('sune') ||
    idLower.includes('niklas') ||
    subUpper.includes('LAST LAYER') ||
    subUpper.includes('YELLOW CROSS');

  const isIsometricView =
    effectiveCubeSize === 3 &&
    (catUpper.includes('F2L') || (catUpper.includes('LBL') && !isLBLLastLayer));

  const isLeftHandCase =
    idLower.includes('left') ||
    (!mainAlg.includes('R') && !mainAlg.includes('r') && mainAlg.includes('L'));

  const isOLL =
    (catUpper.includes('OLL') && !catUpper.includes('PARITY')) ||
    catUpper.includes('LSE') ||
    idLower.includes('yellow-cross') ||
    idLower.includes('sune');

  const isLseCase = catUpper.includes('LSE');
  const isCollOrCmll = catUpper.includes('COLL') || catUpper.includes('CMLL') || catUpper.includes('CLL');

  const isPermutationView =
    catUpper.includes('PLL') ||
    catUpper.includes('PBL') ||
    catUpper.includes('CLL') ||
    catUpper.includes('CMLL') ||
    catUpper.includes('COLL') ||
    catUpper.includes('ZBLL');

  const topColor = colorScheme.U;
  const bottomColor = colorScheme.D;

  // Strict WCA diagram rules for permutation arrows:
  // - Beginner, F2L, OLL, and Roux LSE EO: ZERO arrows (arrows = [])
  // - COLL / CMLL: ONLY arrows between the 4 corners (max 1 or 2 clean corner swap arrows)
  // - PLL and ZBLL: Both corner and edge arrows (with mutual swaps collapsed into bidirectional <->)
  const rawArrows = isPermutationView ? (customArrows ?? sim.arrows) : [];
  const arrowsToRender = useMemo(() => {
    if (!isPermutationView || isOLL || isLseCase || catUpper.includes('LBL') || catUpper.includes('F2L')) {
      return [];
    }
    if (isCollOrCmll) {
      const cornerOnly = rawArrows.filter((a) => a.pieceType === 'corner');
      // If corners form a 3-cycle or 4-cycle on a COLL card, collapse or cap to max 2 clean swap vectors
      const swaps = cornerOnly.filter((a) => a.bidirectional);
      if (swaps.length > 0) return swaps.slice(0, 2);
      return cornerOnly.slice(0, 2);
    }
    if (catUpper.includes('ZBLL')) {
      const cornerArrows = rawArrows.filter((a) => a.pieceType === 'corner');
      const edgeArrows = rawArrows.filter((a) => a.pieceType === 'edge');
      const cornerSwaps = cornerArrows.filter((a) => a.bidirectional);
      const selectedCorners = (cornerSwaps.length > 0 ? cornerSwaps : cornerArrows).slice(0, 1);
      const edgeSwaps = edgeArrows.filter((a) => a.bidirectional);
      const selectedEdges = (edgeSwaps.length > 0 ? edgeSwaps : edgeArrows).slice(0, 3);
      return [...selectedCorners, ...selectedEdges];
    }
    return rawArrows.slice(0, 4);
  }, [isPermutationView, isOLL, isLseCase, catUpper, isCollOrCmll, rawArrows]);

  // ============================================================================
  // RENDER 1: ISOMETRIC MINI-3D VIEW FOR F2L (41 Cases) & LBL FIRST TWO LAYERS
  // Focuses on U, F, R (or U, L, F for left-hand inserts) and greys out irrelevant
  // U-layer pieces with #D1D5DB so the target corner/edge pair pops out!
  // ============================================================================
  if (isIsometricView) {
    const topCenter: [number, number] = [50, 8];
    const leftTop: [number, number] = [10, 28];
    const rightTop: [number, number] = [90, 28];
    const centerMid: [number, number] = [50, 48];
    const leftBot: [number, number] = [10, 74];
    const rightBot: [number, number] = [90, 74];
    const centerBot: [number, number] = [50, 94];

    // Target pair colors: for FR slot -> [D, F, R]; for FL slot (left-hand) -> [D, F, L]
    const targetColors: CubeColor[] = isLeftHandCase
      ? [bottomColor, colorScheme.F, colorScheme.L]
      : [bottomColor, colorScheme.F, colorScheme.R];

    // Map all 27 visible polygons of the isometric cube (U 9 cells, F 9 cells, R 9 cells - or U, L, F for left-hand)
    // directly to the actual dynamic sticker colors returned by getCaseState(invertAlg(alg.mainAlg))!
    const getIsometricStickerFill = (face: FaceKey, idx: number): string => {
      const actualColor = sim.cubeState[face][idx];
      return COLOR_HEX_MAP[actualColor];
    };

    const isHighlightedSlotSticker = (face: FaceKey, idx: number): boolean => {
      const group = CUBIE_GROUPS.find((g) => g.some((s) => s.face === face && s.idx === idx));
      if (!group) return false;
      const cubieColors = group.map((s) => sim.cubeState[s.face][s.idx]);
      if (idLower.includes('daisy') || idLower.includes('cross')) {
        // Highlight any edge containing the bottom (White) color that is currently on U or F/R
        return cubieColors.length === 2 && cubieColors.includes(bottomColor);
      }
      return isTargetPieceColors(cubieColors, targetColors);
    };

    // For Left-Hand cases, show L on the front-left quad and F on the front-right quad,
    // and rotate U face 90 deg CCW so UFL is at the centerMid vertex!
    const uIndices = isLeftHandCase
      ? [2, 5, 8, 1, 4, 7, 0, 3, 6]
      : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const leftQuadFace: FaceKey = isLeftHandCase ? 'L' : 'F';
    const rightQuadFace: FaceKey = isLeftHandCase ? 'F' : 'R';

    return (
      <div
        style={{ width: size, height: size }}
        className="shrink-0 bg-[#F8F9FA] rounded-2xl border border-[#EAECEF] p-1.5 flex items-center justify-center relative select-none shadow-2xs"
        title={`${category} Isometric (${isLeftHandCase ? 'U-L-F' : 'U-F-R'}) View`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Isometric Substrate Shadow */}
          <polygon
            points={`${topCenter[0]},${topCenter[1]} ${rightTop[0]},${rightTop[1]} ${rightBot[0]},${rightBot[1]} ${centerBot[0]},${centerBot[1]} ${leftBot[0]},${leftBot[1]} ${leftTop[0]},${leftTop[1]}`}
            fill={SUBSTRATE_DARK}
            stroke={SUBSTRATE_DARK}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* U FACE (Top Rhombus) */}
          {uIndices.map((uIdx, renderPos) => {
            const row = Math.floor(renderPos / 3);
            const col = renderPos % 3;
            const fill = getIsometricStickerFill('U', uIdx);
            const isTarget = isHighlightedSlotSticker('U', uIdx);
            const pts = getQuadCellPolygon(topCenter, rightTop, centerMid, leftTop, row, col, 0.06);
            return (
              <polygon
                key={`u-${renderPos}`}
                points={pts}
                fill={fill}
                stroke={isTarget ? '#111111' : SUBSTRATE_DARK}
                strokeWidth={isTarget ? '1.35' : '0.9'}
                strokeLinejoin="round"
              />
            );
          })}

          {/* FRONT-LEFT PARALLELOGRAM (F face normally, or L face for left-hand inserts) */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const fill = getIsometricStickerFill(leftQuadFace, idx);
            const isTarget = isHighlightedSlotSticker(leftQuadFace, idx);
            const pts = getQuadCellPolygon(leftTop, centerMid, centerBot, leftBot, row, col, 0.06);
            return (
              <polygon
                key={`left-${idx}`}
                points={pts}
                fill={fill}
                stroke={isTarget ? '#10B981' : SUBSTRATE_DARK}
                strokeWidth={isTarget ? '1.45' : '0.9'}
                strokeLinejoin="round"
              />
            );
          })}

          {/* FRONT-RIGHT PARALLELOGRAM (R face normally, or F face for left-hand inserts) */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const fill = getIsometricStickerFill(rightQuadFace, idx);
            const isTarget = isHighlightedSlotSticker(rightQuadFace, idx);
            const pts = getQuadCellPolygon(centerMid, rightTop, rightBot, centerBot, row, col, 0.06);
            return (
              <polygon
                key={`right-${idx}`}
                points={pts}
                fill={fill}
                stroke={isTarget ? '#10B981' : SUBSTRATE_DARK}
                strokeWidth={isTarget ? '1.45' : '0.9'}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Active Slot Indicator Dot at Center Front Seam */}
          <circle
            cx={centerMid[0]}
            cy={(centerMid[1] + centerBot[1]) / 2}
            r="2.4"
            fill="#10B981"
            stroke="#111111"
            strokeWidth="0.8"
          />
        </svg>
      </div>
    );
  }

  // ============================================================================
  // RENDER 2: 2D TOP-DOWN SVG WITH SIDE STICKERS & VECTOR PERMUTATION ARROWS
  // Used for OLL, PLL, CMLL, COLL, ZBLL, and LBL Last Layer
  // ============================================================================
  const cellPositions = [
    { x: 20, y: 20 }, { x: 41, y: 20 }, { x: 62, y: 20 },
    { x: 20, y: 41 }, { x: 41, y: 41 }, { x: 62, y: 41 },
    { x: 20, y: 62 }, { x: 41, y: 62 }, { x: 62, y: 62 },
  ];

  const LSE_CORNER_GREY = '#E5E7EB';
  const isLseEoCase = isLseCase && idLower.includes('eo');

  const getTopCellFill = (color: CubeColor, idx: number): string => {
    if (isLseCase) {
      // For Roux LSE: Grey out (#E5E7EB) the 4 corner pieces (0, 2, 6, 8) so only the Center and Edges pop!
      if (idx === 0 || idx === 2 || idx === 6 || idx === 8) {
        return LSE_CORNER_GREY;
      }
      if (isLseEoCase) {
        // For LSE EO cases: oriented edges have U/D color on U (rendered in Yellow topColor),
        // while flipped/misoriented edges have their U/D sticker on the side (rendered in neutral slate on U so the flipped side tab pops!)
        return color === topColor || color === bottomColor
          ? COLOR_HEX_MAP[topColor]
          : '#94A3B8';
      }
      return COLOR_HEX_MAP[color];
    }
    if (isOLL) {
      return color === topColor ? COLOR_HEX_MAP[topColor] : GREY_STICKER;
    }
    return COLOR_HEX_MAP[color];
  };

  const getSideStickerFill = (color: CubeColor, sideIdx: number): string => {
    if (isLseCase) {
      // Grey out corner side stickers (sideIdx 0 and 2), keeping only the middle edge indicator (sideIdx 1)
      if (sideIdx === 0 || sideIdx === 2) {
        return LSE_CORNER_GREY;
      }
      if (isLseEoCase) {
        // Highlight flipped edge side stickers (where the Yellow/White sticker is facing the side!)
        return color === topColor || color === bottomColor
          ? COLOR_HEX_MAP[topColor]
          : GREY_STICKER;
      }
      return COLOR_HEX_MAP[color];
    }
    if (isOLL) {
      return color === topColor ? COLOR_HEX_MAP[topColor] : GREY_STICKER;
    }
    return COLOR_HEX_MAP[color];
  };

  const n = effectiveCubeSize;
  const xCoords = n === 2 ? [21, 51] : n === 4 ? [19.5, 35, 50.5, 66] : [20, 41, 62];
  const yCoords = xCoords;
  const cellW = n === 2 ? 28 : n === 4 ? 14.5 : 18;

  const paramState = useMemo(
    () =>
      n === 3 ? null : getPreExecutionParametricState(effectiveAlg, n, colorScheme),
    [n, effectiveAlg, colorScheme],
  );

  const sideTopStickers: CubeColor[] = paramState
    ? Array.from({ length: n }, (_, i) => paramState.B[n - 1 - i])
    : sim.sideStickers.top;
  const sideBottomStickers: CubeColor[] = paramState
    ? Array.from({ length: n }, (_, i) => paramState.F[i])
    : sim.sideStickers.bottom;
  const sideLeftStickers: CubeColor[] = paramState
    ? Array.from({ length: n }, (_, i) => paramState.L[i])
    : sim.sideStickers.left;
  const sideRightStickers: CubeColor[] = paramState
    ? Array.from({ length: n }, (_, i) => paramState.R[n - 1 - i])
    : sim.sideStickers.right;

  const isL2CCase = n === 4 && catUpper.includes('L2C');
  const isL2EOrOllParity =
    n === 4 && (catUpper.includes('L2E') || (catUpper.includes('OLL') && catUpper.includes('PARITY')));

  const topCells: {
    x: number;
    y: number;
    r: number;
    c: number;
    color: CubeColor;
    srcIdx: number;
  }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const idx = r * n + c;
      topCells.push({
        x: xCoords[c],
        y: yCoords[r],
        r,
        c,
        color: paramState ? paramState.U[idx] : sim.topFaceColors[idx],
        srcIdx: idx,
      });
    }
  }

  // Normalize arrows: convert grid [row, col] indices (<= 4) to SVG pixel coordinates
  const resolvedArrows = useMemo(() => {
    const toPixel = (pt: [number, number]): [number, number] => {
      if (pt[0] < n && pt[1] < n && pt[0] <= 3 && pt[1] <= 3) {
        return [xCoords[pt[1]] + cellW / 2, yCoords[pt[0]] + cellW / 2];
      }
      return pt;
    };

    if (n !== 3 && customArrows && customArrows.length > 0) {
      return customArrows.map((a) => ({
        from: toPixel(a.from),
        to: toPixel(a.to),
        bidirectional: a.bidirectional ?? true,
        pieceType: ('pieceType' in a ? a.pieceType : 'corner') as 'corner' | 'edge',
      }));
    }
    return arrowsToRender.map((a) => ({
      ...a,
      from: toPixel(a.from),
      to: toPixel(a.to),
    }));
  }, [n, customArrows, arrowsToRender, xCoords, yCoords, cellW]);

  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 bg-[#F8F9FA] rounded-2xl border border-[#EAECEF] p-1.5 flex items-center justify-center relative select-none shadow-2xs"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <marker
            id={`arrow-end-corner-${id}`}
            markerWidth="5.5"
            markerHeight="5.5"
            refX="4.2"
            refY="2.75"
            orient="auto"
          >
            <polygon points="0 0, 5.5 2.75, 0 5.5" fill="#111111" />
          </marker>
          <marker
            id={`arrow-start-corner-${id}`}
            markerWidth="5.5"
            markerHeight="5.5"
            refX="1.3"
            refY="2.75"
            orient="auto"
          >
            <polygon points="5.5 0, 0 2.75, 5.5 5.5" fill="#111111" />
          </marker>
          <marker
            id={`arrow-end-edge-${id}`}
            markerWidth="5.5"
            markerHeight="5.5"
            refX="4.2"
            refY="2.75"
            orient="auto"
          >
            <polygon points="0 0, 5.5 2.75, 0 5.5" fill="#0F172A" />
          </marker>
          <marker
            id={`arrow-start-edge-${id}`}
            markerWidth="5.5"
            markerHeight="5.5"
            refX="1.3"
            refY="2.75"
            orient="auto"
          >
            <polygon points="5.5 0, 0 2.75, 5.5 5.5" fill="#0F172A" />
          </marker>
        </defs>

        {/* Surrounding Top-Layer Side Stickers (B=top, F=bottom, L=left, R=right) */}
        {sideTopStickers.map((col, i) => (
          <rect
            key={`top-${i}`}
            x={xCoords[i]}
            y="8"
            width={cellW}
            height="6.5"
            rx="1.8"
            fill={getSideStickerFill(col, n === 2 ? (i === 0 ? 0 : 2) : n === 4 ? (i === 0 ? 0 : i === 3 ? 2 : 1) : i)}
            stroke={SUBSTRATE_DARK}
            strokeWidth="0.9"
          />
        ))}
        {sideBottomStickers.map((col, i) => (
          <rect
            key={`bot-${i}`}
            x={xCoords[i]}
            y="85.5"
            width={cellW}
            height="6.5"
            rx="1.8"
            fill={getSideStickerFill(col, n === 2 ? (i === 0 ? 0 : 2) : n === 4 ? (i === 0 ? 0 : i === 3 ? 2 : 1) : i)}
            stroke={SUBSTRATE_DARK}
            strokeWidth="0.9"
          />
        ))}
        {sideLeftStickers.map((col, i) => (
          <rect
            key={`left-${i}`}
            x="8"
            y={yCoords[i]}
            width="6.5"
            height={cellW}
            rx="1.8"
            fill={getSideStickerFill(col, n === 2 ? (i === 0 ? 0 : 2) : n === 4 ? (i === 0 ? 0 : i === 3 ? 2 : 1) : i)}
            stroke={SUBSTRATE_DARK}
            strokeWidth="0.9"
          />
        ))}
        {sideRightStickers.map((col, i) => (
          <rect
            key={`right-${i}`}
            x="85.5"
            y={yCoords[i]}
            width="6.5"
            height={cellW}
            rx="1.8"
            fill={getSideStickerFill(col, n === 2 ? (i === 0 ? 0 : 2) : n === 4 ? (i === 0 ? 0 : i === 3 ? 2 : 1) : i)}
            stroke={SUBSTRATE_DARK}
            strokeWidth="0.9"
          />
        ))}

        {/* N×N Dark Substrate */}
        <rect
          x="17.5"
          y="17.5"
          width="65"
          height="65"
          rx="4.5"
          fill={SUBSTRATE_DARK}
          stroke={SUBSTRATE_DARK}
          strokeWidth="1.2"
        />

        {/* N×N Top Face (U) Stickers */}
        {topCells.map((cell, idx) => {
          const isCenter4x4 =
            n === 4 && (cell.r === 1 || cell.r === 2) && (cell.c === 1 || cell.c === 2);
          const isWingEdge4x4 =
            n === 4 &&
            (((cell.r === 0 || cell.r === 3) && (cell.c === 1 || cell.c === 2)) ||
              ((cell.c === 0 || cell.c === 3) && (cell.r === 1 || cell.r === 2)));

          const isHighlighted4x4 =
            (isL2CCase && isCenter4x4) || (isL2EOrOllParity && isWingEdge4x4);
          const isDimmed4x4 =
            (isL2CCase && !isCenter4x4) || (isL2EOrOllParity && !isWingEdge4x4 && !isCenter4x4);

          const fill = getTopCellFill(cell.color, cell.srcIdx);
          return (
            <rect
              key={`u-cell-${idx}`}
              x={cell.x}
              y={cell.y}
              width={cellW}
              height={cellW}
              rx={n === 4 ? '1.8' : '2.5'}
              fill={fill}
              opacity={isDimmed4x4 ? 0.55 : 1}
              stroke={isHighlighted4x4 ? '#10B981' : SUBSTRATE_DARK}
              strokeWidth={isHighlighted4x4 ? '1.5' : '0.9'}
            />
          );
        })}

        {/* Automatic Permutation Vector Arrows for PLL, PBL, CLL, CMLL, COLL, ZBLL */}
        {isPermutationView &&
          resolvedArrows.map((arr, i) => {
            const dx = arr.to[0] - arr.from[0];
            const dy = arr.to[1] - arr.from[1];
            const len = Math.hypot(dx, dy) || 1;
            const shrinkStart = arr.bidirectional ? 4.8 : 2.5;
            const shrinkEnd = 4.8;
            const x1 = arr.from[0] + (dx / len) * shrinkStart;
            const y1 = arr.from[1] + (dy / len) * shrinkStart;
            const x2 = arr.to[0] - (dx / len) * shrinkEnd;
            const y2 = arr.to[1] - (dy / len) * shrinkEnd;

            const isCorner = arr.pieceType === 'corner';
            const endMarker = isCorner
              ? `url(#arrow-end-corner-${id})`
              : `url(#arrow-end-edge-${id})`;
            const startMarker = arr.bidirectional
              ? isCorner
                ? `url(#arrow-start-corner-${id})`
                : `url(#arrow-start-edge-${id})`
              : undefined;

            return (
              <g key={`arrow-${i}`}>
                {/* White halo outline for maximum legibility over dark/colored stickers */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFFFFF"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isCorner ? '#111111' : '#0F172A'}
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeDasharray={isCorner && !arr.bidirectional ? '3 1.5' : undefined}
                  markerEnd={endMarker}
                  markerStart={startMarker}
                />
              </g>
            );
          })}
      </svg>
    </div>
  );
});
