export type CubeSize = 2 | 3 | 4;

export interface CubeSizeConfig {
  size: CubeSize;
  label: string;
  shortLabel: string;
  wcaName: string;
  stickersPerFace: number;
  totalStickers: number;
  scrambleLength: number;
}

export const CUBE_SIZE_CONFIGS: Record<CubeSize, CubeSizeConfig> = {
  2: {
    size: 2,
    label: '2x2x2 Pocket',
    shortLabel: '2x2',
    wcaName: '2x2x2 Cube',
    stickersPerFace: 4,
    totalStickers: 24,
    scrambleLength: 11,
  },
  3: {
    size: 3,
    label: '3x3x3 Standard',
    shortLabel: '3x3',
    wcaName: '3x3x3 Cube',
    stickersPerFace: 9,
    totalStickers: 54,
    scrambleLength: 21,
  },
  4: {
    size: 4,
    label: '4x4x4 Revenge',
    shortLabel: '4x4',
    wcaName: '4x4x4 Cube',
    stickersPerFace: 16,
    totalStickers: 96,
    scrambleLength: 40,
  },
};
