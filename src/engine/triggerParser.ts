// Speedcubing Trigger Highlighting Parser & Metadata Engine

export type TriggerTag =
  | 'Sexy Move'
  | 'Inverse Sexy'
  | 'Sledgehammer'
  | 'Hedgeslammer'
  | 'Fast Flick'
  | 'Left Sexy'
  | 'Left Inv Sexy'
  | 'Front Insert'
  | 'Wide Parity';

export interface TriggerMetadata {
  tag: TriggerTag;
  pattern: string;
  color: string;
  bgColor: string;
  borderColor: string;
  descriptionVN: string;
}

export interface FormulaSegment {
  type: 'trigger' | 'group' | 'moves';
  rawText: string;
  moves: string[];
  repeatCount?: number;
  trigger?: TriggerMetadata;
}

export const TRIGGER_CATALOG: Record<TriggerTag, TriggerMetadata> = {
  'Sexy Move': {
    tag: 'Sexy Move',
    pattern: "(R U R' U')",
    color: '#059669',
    bgColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    descriptionVN: 'Tổ hợp 4 bước nền tảng tốc độ cao nhất trong CFOP (Right-hand Sexy Move).',
  },
  'Inverse Sexy': {
    tag: 'Inverse Sexy',
    pattern: "(U R U' R')",
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#7DD3FC',
    descriptionVN: 'Đảo ngược của Sexy Move, dùng phổ biến để chèn cặp F2L và giải OLL.',
  },
  Sledgehammer: {
    tag: 'Sledgehammer',
    pattern: "(R' F R F')",
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FCD34D',
    descriptionVN: 'Tổ hợp búa tạ định hướng cạnh đỉnh và bảo toàn cặp F2L.',
  },
  Hedgeslammer: {
    tag: 'Hedgeslammer',
    pattern: "(F R' F' R)",
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#C4B5FD',
    descriptionVN: 'Đảo ngược của Sledgehammer, dùng để chèn F2L góc đặc biệt và lật cạnh.',
  },
  'Fast Flick': {
    tag: 'Fast Flick',
    pattern: "(R U2 R')",
    color: '#E11D48',
    bgColor: '#FFE4E6',
    borderColor: '#FDA4AF',
    descriptionVN: 'Đòn bẩy Double-Flick U2 tốc độ cao trong F2L, Sune và ZBLL 2-Gen.',
  },
  'Left Sexy': {
    tag: 'Left Sexy',
    pattern: "(L' U' L U)",
    color: '#0D9488',
    bgColor: '#CCFBF1',
    borderColor: '#5EEAD4',
    descriptionVN: 'Tổ hợp Sexy Move tay trái đối xứng dùng để chèn góc trái và F2L khe FL.',
  },
  'Left Inv Sexy': {
    tag: 'Left Inv Sexy',
    pattern: "(U' L' U L)",
    color: '#0891B2',
    bgColor: '#CFFAFE',
    borderColor: '#67E8F9',
    descriptionVN: 'Đảo ngược của Left Sexy, dùng để ghép và chèn cạnh tầng 2 bên trái.',
  },
  'Front Insert': {
    tag: 'Front Insert',
    pattern: "(F' U F)",
    color: '#4F46E5',
    bgColor: '#E0E7FF',
    borderColor: '#A5B4FC',
    descriptionVN: 'Tổ hợp chèn mặt trước (Front Slot Insert) hoàn tất cặp góc-cạnh tầng 2.',
  },
  'Wide Parity': {
    tag: 'Wide Parity',
    pattern: '(Rw U2 Rw)',
    color: '#4338CA',
    bgColor: '#E0E7FF',
    borderColor: '#A5B4FC',
    descriptionVN: 'Tổ hợp Wide Parity Trigger (Rw U2 Rw) đặc trưng trong OLL Parity 4x4x4.',
  },
};

function normalizeInnerMoves(inner: string): string {
  return inner
    .replace(/[’‘`´]/g, "'")
    .replace(/[()[\]]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Identify if a sequence of moves inside parentheses matches one of the 8 canonical triggers.
 */
export function matchTriggerMoves(innerMoves: string): TriggerMetadata | undefined {
  const normalized = normalizeInnerMoves(innerMoves);

  switch (normalized) {
    case "R U R' U'":
      return TRIGGER_CATALOG['Sexy Move'];
    case "U R U' R'":
      return TRIGGER_CATALOG['Inverse Sexy'];
    case "R' F R F'":
      return TRIGGER_CATALOG['Sledgehammer'];
    case "F R' F' R":
      return TRIGGER_CATALOG['Hedgeslammer'];
    case "R U2 R'":
    case "R U2' R'":
      return TRIGGER_CATALOG['Fast Flick'];
    case "L' U' L U":
      return TRIGGER_CATALOG['Left Sexy'];
    case "U' L' U L":
      return TRIGGER_CATALOG['Left Inv Sexy'];
    case "F' U F":
    case "F U' F'":
    case "F' U' F":
    case "F U F'":
      return TRIGGER_CATALOG['Front Insert'];
    case 'Rw U2 Rw':
    case "Rw U2 Rw'":
    case "Rw' U2 Rw":
    case "Rw' U2 Rw'":
      return TRIGGER_CATALOG['Wide Parity'];
    default:
      return undefined;
  }
}

/**
 * Parse any formula string with parentheses and automatically tag known speedcubing triggers
 * with color metadata for the UI. Also supports unparenthesized canonical trigger detection
 * as fallback when `autoDetectUnparenthesized` is enabled.
 */
export function parseFormulaTriggers(
  formula: string,
  autoDetectUnparenthesized = false
): FormulaSegment[] {
  if (!formula || !formula.trim()) return [];

  const normalizedFormula = formula.replace(/[’‘`´]/g, "'").trim();
  const segments: FormulaSegment[] = [];

  // Match parenthesized groups with optional repetition suffix like (R U R' U')2
  const groupRegex = /\(([^()]+)\)(\d*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = groupRegex.exec(normalizedFormula)) !== null) {
    // Push preceding plain moves if any
    if (match.index > lastIndex) {
      const plainPart = normalizedFormula.slice(lastIndex, match.index).trim();
      if (plainPart) {
        const plainMoves = plainPart.split(/\s+/).filter(Boolean);
        if (plainMoves.length > 0) {
          segments.push({
            type: 'moves',
            rawText: plainPart,
            moves: plainMoves,
          });
        }
      }
    }

    const innerContent = match[1].trim();
    const repeatStr = match[2];
    const repeatCount = repeatStr ? parseInt(repeatStr, 10) : 1;
    const innerMoves = innerContent.split(/\s+/).filter(Boolean);
    const matchedTrigger = matchTriggerMoves(innerContent);

    if (matchedTrigger) {
      segments.push({
        type: 'trigger',
        rawText: match[0],
        moves: innerMoves,
        repeatCount,
        trigger: matchedTrigger,
      });
    } else {
      segments.push({
        type: 'group',
        rawText: match[0],
        moves: innerMoves,
        repeatCount,
      });
    }

    lastIndex = groupRegex.lastIndex;
  }

  // Push trailing plain moves if any
  if (lastIndex < normalizedFormula.length) {
    const trailingPart = normalizedFormula.slice(lastIndex).trim();
    if (trailingPart) {
      const trailingMoves = trailingPart.split(/\s+/).filter(Boolean);
      if (trailingMoves.length > 0) {
        segments.push({
          type: 'moves',
          rawText: trailingPart,
          moves: trailingMoves,
        });
      }
    }
  }

  // Optional fallback: if formula had no parentheses at all and autoDetectUnparenthesized is true
  if (autoDetectUnparenthesized && !normalizedFormula.includes('(')) {
    const autoParenthesized = normalizedFormula
      .replace(/\bR U R' U'(?!')/g, "(R U R' U')")
      .replace(/\bU R U' R'(?!')/g, "(U R U' R')")
      .replace(/\bR' F R F'(?!')/g, "(R' F R F')")
      .replace(/\bF R' F' R(?!['2])/g, "(F R' F' R)")
      .replace(/\bR U2'? R'(?!')/g, (m) => `(${m})`)
      .replace(/\bL' U' L U(?!['2])/g, "(L' U' L U)")
      .replace(/\bU' L' U L(?!['2])/g, "(U' L' U L)")
      .replace(/\bF' U F(?!['2])/g, "(F' U F)")
      .replace(/\bF U' F'(?!')/g, "(F U' F')");

    if (autoParenthesized !== normalizedFormula) {
      return parseFormulaTriggers(autoParenthesized, false);
    }
  }

  return segments;
}

/**
 * Return unique trigger metadata badges present in an algorithm formula.
 */
export function extractUniqueTriggers(formula: string): TriggerMetadata[] {
  const segments = parseFormulaTriggers(formula, true);
  const seen = new Set<TriggerTag>();
  const result: TriggerMetadata[] = [];

  for (const seg of segments) {
    if (seg.trigger && !seen.has(seg.trigger.tag)) {
      seen.add(seg.trigger.tag);
      result.push(seg.trigger);
    }
  }

  return result;
}
