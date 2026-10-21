// 54-Sticker Cube State Validation & Mathematical Parity Engine
import { CubeNetState, CubeColor, FaceKey, SOLVED_CUBE } from './cubeState';

export interface CubeValidationResult {
  isValid: boolean;
  errors: string[]; // Localized Vietnamese diagnostic error messages
  details: {
    colorCountsValid: boolean;
    colorCounts: Record<CubeColor, number>;
    centersValid: boolean;
    edgesValid: boolean;
    cornersValid: boolean;
    edgeOrientationParity: boolean;
    cornerOrientationParity: boolean;
    permutationParity: boolean;
  };
}

// Standard WCA Face Centers
const EXPECTED_CENTERS: Record<FaceKey, CubeColor> = {
  U: 'yellow',
  D: 'white',
  F: 'green',
  B: 'blue',
  L: 'orange',
  R: 'red',
};

const VIETNAMESE_COLOR_NAMES: Record<CubeColor, string> = {
  yellow: 'Vàng',
  white: 'Trắng',
  green: 'Xanh lá',
  blue: 'Xanh dương',
  orange: 'Cam',
  red: 'Đỏ',
};

// 12 Standard Edge Piece definitions
// Each edge piece has two colors. One is designated as primary (Yellow/White, or Green/Blue for middle layer).
interface EdgeDefinition {
  name: string;
  colors: [CubeColor, CubeColor]; // [primaryColor, secondaryColor]
}

export const STANDARD_EDGES: EdgeDefinition[] = [
  { name: 'UB', colors: ['yellow', 'blue'] },    // 0
  { name: 'UL', colors: ['yellow', 'orange'] },  // 1
  { name: 'UR', colors: ['yellow', 'red'] },     // 2
  { name: 'UF', colors: ['yellow', 'green'] },   // 3
  { name: 'FL', colors: ['green', 'orange'] },   // 4
  { name: 'FR', colors: ['green', 'red'] },      // 5
  { name: 'BL', colors: ['blue', 'orange'] },    // 6
  { name: 'BR', colors: ['blue', 'red'] },       // 7
  { name: 'DF', colors: ['white', 'green'] },    // 8
  { name: 'DL', colors: ['white', 'orange'] },   // 9
  { name: 'DR', colors: ['white', 'red'] },      // 10
  { name: 'DB', colors: ['white', 'blue'] },     // 11
];

// Slot definitions: [face1, idx1, face2, idx2]
// face1 is designated as the primary face of the slot (U, D, or F/B)
const EDGE_SLOTS: { name: string; face1: FaceKey; idx1: number; face2: FaceKey; idx2: number }[] = [
  { name: 'UB', face1: 'U', idx1: 1, face2: 'B', idx2: 1 },
  { name: 'UL', face1: 'U', idx1: 3, face2: 'L', idx2: 1 },
  { name: 'UR', face1: 'U', idx1: 5, face2: 'R', idx2: 1 },
  { name: 'UF', face1: 'U', idx1: 7, face2: 'F', idx2: 1 },
  { name: 'FL', face1: 'F', idx1: 3, face2: 'L', idx2: 5 },
  { name: 'FR', face1: 'F', idx1: 5, face2: 'R', idx2: 3 },
  { name: 'BL', face1: 'B', idx1: 5, face2: 'L', idx2: 3 },
  { name: 'BR', face1: 'B', idx1: 3, face2: 'R', idx2: 5 },
  { name: 'DF', face1: 'D', idx1: 1, face2: 'F', idx2: 7 },
  { name: 'DL', face1: 'D', idx1: 3, face2: 'L', idx2: 7 },
  { name: 'DR', face1: 'D', idx1: 5, face2: 'R', idx2: 7 },
  { name: 'DB', face1: 'D', idx1: 7, face2: 'B', idx2: 7 },
];

// 8 Standard Corner Piece definitions
// [primaryColor (Yellow/White), clockwise2, clockwise3]
interface CornerDefinition {
  name: string;
  colors: [CubeColor, CubeColor, CubeColor];
}

export const STANDARD_CORNERS: CornerDefinition[] = [
  { name: 'UFL', colors: ['yellow', 'green', 'orange'] }, // 0
  { name: 'UFR', colors: ['yellow', 'red', 'green'] },     // 1
  { name: 'UBL', colors: ['yellow', 'orange', 'blue'] },   // 2
  { name: 'UBR', colors: ['yellow', 'blue', 'red'] },      // 3
  { name: 'DFL', colors: ['white', 'orange', 'green'] },   // 4
  { name: 'DFR', colors: ['white', 'green', 'red'] },      // 5
  { name: 'DBL', colors: ['white', 'blue', 'orange'] },    // 6
  { name: 'DBR', colors: ['white', 'red', 'blue'] },       // 7
];

// Corner slot definitions: 3 facelets listed in clockwise order from outside
// Position 0 is ALWAYS on the U or D face.
const CORNER_SLOTS: {
  name: string;
  stickers: [
    { face: FaceKey; idx: number },
    { face: FaceKey; idx: number },
    { face: FaceKey; idx: number }
  ];
}[] = [
  {
    name: 'UFL',
    stickers: [
      { face: 'U', idx: 6 },
      { face: 'F', idx: 0 },
      { face: 'L', idx: 2 },
    ],
  },
  {
    name: 'UFR',
    stickers: [
      { face: 'U', idx: 8 },
      { face: 'R', idx: 0 },
      { face: 'F', idx: 2 },
    ],
  },
  {
    name: 'UBL',
    stickers: [
      { face: 'U', idx: 0 },
      { face: 'L', idx: 0 },
      { face: 'B', idx: 2 },
    ],
  },
  {
    name: 'UBR',
    stickers: [
      { face: 'U', idx: 2 },
      { face: 'B', idx: 0 },
      { face: 'R', idx: 2 },
    ],
  },
  {
    name: 'DFL',
    stickers: [
      { face: 'D', idx: 0 },
      { face: 'L', idx: 8 },
      { face: 'F', idx: 6 },
    ],
  },
  {
    name: 'DFR',
    stickers: [
      { face: 'D', idx: 2 },
      { face: 'F', idx: 8 },
      { face: 'R', idx: 6 },
    ],
  },
  {
    name: 'DBL',
    stickers: [
      { face: 'D', idx: 6 },
      { face: 'B', idx: 8 },
      { face: 'L', idx: 6 },
    ],
  },
  {
    name: 'DBR',
    stickers: [
      { face: 'D', idx: 8 },
      { face: 'R', idx: 8 },
      { face: 'B', idx: 6 },
    ],
  },
];

// Helper: Calculate permutation inversion count
function countInversions(perm: number[]): number {
  let inv = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inv++;
    }
  }
  return inv;
}

export function validateCubeState(cube: CubeNetState): CubeValidationResult {
  const errors: string[] = [];

  // 1. Color Counts (54 stickers, exactly 9 per color)
  const colorCounts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    orange: 0,
    red: 0,
  };

  const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const f of faces) {
    if (!cube[f] || cube[f].length !== 9) {
      errors.push(`Mặt ${f} không có đủ 9 ô nhãn dán.`);
      continue;
    }
    for (const color of cube[f]) {
      if (color in colorCounts) {
        colorCounts[color]++;
      } else {
        errors.push(`Màu nhãn dán '${color}' trên mặt ${f} không hợp lệ.`);
      }
    }
  }

  const wrongCountColors = (Object.keys(colorCounts) as CubeColor[]).filter(
    (c) => colorCounts[c] !== 9
  );
  const colorCountsValid = wrongCountColors.length === 0;
  if (!colorCountsValid) {
    const detail = wrongCountColors
      .map((c) => `${VIETNAMESE_COLOR_NAMES[c]}: ${colorCounts[c]}/9`)
      .join(', ');
    errors.push(
      `Lỗi số lượng màu: Mỗi màu phải có chính xác 9 ô (${detail}). Vui lòng kiểm tra lại các mặt đã quét.`
    );
  }

  // 2. Fixed Centers Check (U=yellow, D=white, F=green, B=blue, L=orange, R=red)
  let centersValid = true;
  for (const f of faces) {
    const centerColor = cube[f]?.[4];
    const expected = EXPECTED_CENTERS[f];
    if (centerColor !== expected) {
      centersValid = false;
      errors.push(
        `Lỗi tâm mặt ${f}: Tâm hiện tại là ${VIETNAMESE_COLOR_NAMES[centerColor] || centerColor}, nhưng chuẩn WCA yêu cầu là ${VIETNAMESE_COLOR_NAMES[expected]}.`
      );
    }
  }

  // 3. 12 Edges Identification and Orientation
  let edgesValid = true;
  let edgeOrientationParity = true;
  const edgePermutation: number[] = [];
  let totalEdgeFlips = 0;
  const seenEdges = new Set<number>();

  for (let slotIdx = 0; slotIdx < EDGE_SLOTS.length; slotIdx++) {
    const slot = EDGE_SLOTS[slotIdx];
    const c1 = cube[slot.face1]?.[slot.idx1];
    const c2 = cube[slot.face2]?.[slot.idx2];

    if (!c1 || !c2) {
      edgesValid = false;
      continue;
    }

    // Match edge to one of 12 standard edges
    let matchedPieceIdx = -1;
    let flip = 0;

    for (let pIdx = 0; pIdx < STANDARD_EDGES.length; pIdx++) {
      const std = STANDARD_EDGES[pIdx];
      const primary = std.colors[0];
      const secondary = std.colors[1];

      if (c1 === primary && c2 === secondary) {
        matchedPieceIdx = pIdx;
        flip = 0;
        break;
      } else if (c1 === secondary && c2 === primary) {
        matchedPieceIdx = pIdx;
        flip = 1;
        break;
      }
    }

    if (matchedPieceIdx === -1) {
      edgesValid = false;
      errors.push(
        `Lỗi viên cạnh tại vị trí ${slot.name}: Cặp màu (${VIETNAMESE_COLOR_NAMES[c1] || c1}, ${VIETNAMESE_COLOR_NAMES[c2] || c2}) không tạo thành viên cạnh hợp lệ (màu trùng hoặc đối diện).`
      );
    } else {
      if (seenEdges.has(matchedPieceIdx)) {
        edgesValid = false;
        const pieceName = STANDARD_EDGES[matchedPieceIdx].name;
        errors.push(
          `Lỗi trùng lặp viên cạnh: Viên cạnh ${pieceName} (${STANDARD_EDGES[matchedPieceIdx].colors.map((c) => VIETNAMESE_COLOR_NAMES[c]).join('-')}) xuất hiện nhiều hơn 1 lần.`
        );
      }
      seenEdges.add(matchedPieceIdx);
      edgePermutation.push(matchedPieceIdx);
      totalEdgeFlips += flip;
    }
  }

  // 4. 8 Corners Identification, Orientation, and Chirality
  let cornersValid = true;
  let cornerOrientationParity = true;
  const cornerPermutation: number[] = [];
  let totalCornerTwists = 0;
  const seenCorners = new Set<number>();

  for (let slotIdx = 0; slotIdx < CORNER_SLOTS.length; slotIdx++) {
    const slot = CORNER_SLOTS[slotIdx];
    const s0 = cube[slot.stickers[0].face]?.[slot.stickers[0].idx];
    const s1 = cube[slot.stickers[1].face]?.[slot.stickers[1].idx];
    const s2 = cube[slot.stickers[2].face]?.[slot.stickers[2].idx];

    if (!s0 || !s1 || !s2) {
      cornersValid = false;
      continue;
    }

    const slotColors = [s0, s1, s2];
    const sortedSlotColors = [...slotColors].sort().join(',');

    let matchedCornerIdx = -1;
    let twist = 0;
    let chiralityOk = false;

    for (let cIdx = 0; cIdx < STANDARD_CORNERS.length; cIdx++) {
      const std = STANDARD_CORNERS[cIdx];
      const sortedStdColors = [...std.colors].sort().join(',');

      if (sortedSlotColors === sortedStdColors) {
        matchedCornerIdx = cIdx;

        // Find which slot sticker has the primary color (Yellow or White)
        const primaryColor = std.colors[0];
        const primarySlotIdx = slotColors.indexOf(primaryColor);
        twist = primarySlotIdx; // 0 if on U/D, 1 if rotated clockwise 1 step, 2 if rotated 2 steps

        // Verify chirality: from primary color, the remaining 2 colors must match clockwise cycle
        const observedClockwise = [
          slotColors[primarySlotIdx],
          slotColors[(primarySlotIdx + 1) % 3],
          slotColors[(primarySlotIdx + 2) % 3],
        ];

        if (
          observedClockwise[0] === std.colors[0] &&
          observedClockwise[1] === std.colors[1] &&
          observedClockwise[2] === std.colors[2]
        ) {
          chiralityOk = true;
        }
        break;
      }
    }

    if (matchedCornerIdx === -1) {
      cornersValid = false;
      errors.push(
        `Lỗi viên góc tại vị trí ${slot.name}: Bộ 3 màu (${slotColors.map((c) => VIETNAMESE_COLOR_NAMES[c] || c).join(', ')}) không tạo thành viên góc hợp lệ.`
      );
    } else if (!chiralityOk) {
      cornersValid = false;
      errors.push(
        `Lỗi góc nghịch hướng (Chirality) tại ${slot.name}: Viên góc (${slotColors.map((c) => VIETNAMESE_COLOR_NAMES[c] || c).join(', ')}) bị dán sai thứ tự không gian phản xạ.`
      );
    } else {
      if (seenCorners.has(matchedCornerIdx)) {
        cornersValid = false;
        const cornerName = STANDARD_CORNERS[matchedCornerIdx].name;
        errors.push(
          `Lỗi trùng lặp viên góc: Viên góc ${cornerName} xuất hiện nhiều hơn 1 lần.`
        );
      }
      seenCorners.add(matchedCornerIdx);
      cornerPermutation.push(matchedCornerIdx);
      totalCornerTwists += twist;
    }
  }

  // 5. Parity Checks (Only meaningful if pieces are uniquely identified)
  let permutationParity = true;

  if (edgesValid && edgePermutation.length === 12) {
    if (totalEdgeFlips % 2 !== 0) {
      edgeOrientationParity = false;
      errors.push(
        'Lỗi lật cạnh (Edge Flip Parity): Có 1 viên cạnh bị lật ngược đơn lẻ. Trạng thái này không thể giải được trên khối Rubik thực tế.'
      );
    }
  } else {
    edgeOrientationParity = false;
  }

  if (cornersValid && cornerPermutation.length === 8) {
    if (totalCornerTwists % 3 !== 0) {
      cornerOrientationParity = false;
      errors.push(
        'Lỗi xoay góc (Corner Twist Parity): Có 1 viên góc bị vặn/xoay góc đơn lẻ. Trạng thái này không thể giải được.'
      );
    }
  } else {
    cornerOrientationParity = false;
  }

  if (
    edgesValid &&
    cornersValid &&
    edgePermutation.length === 12 &&
    cornerPermutation.length === 8
  ) {
    const edgeInv = countInversions(edgePermutation);
    const cornerInv = countInversions(cornerPermutation);

    if (edgeInv % 2 !== cornerInv % 2) {
      permutationParity = false;
      errors.push(
        'Lỗi hoán vị (Permutation Parity): Phát hiện 2 viên bị hoán đổi vị trí (cần số lần hoán đổi chẵn giữa góc và cạnh).'
      );
    }
  } else {
    permutationParity = false;
  }

  const isValid =
    colorCountsValid &&
    centersValid &&
    edgesValid &&
    cornersValid &&
    edgeOrientationParity &&
    cornerOrientationParity &&
    permutationParity;

  return {
    isValid,
    errors,
    details: {
      colorCountsValid,
      colorCounts,
      centersValid,
      edgesValid,
      cornersValid,
      edgeOrientationParity,
      cornerOrientationParity,
      permutationParity,
    },
  };
}
