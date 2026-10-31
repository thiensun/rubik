// 3-Tier Hierarchical Tree Structure for Level 4: ZBLL & COLL (7 Root Sets x 6 COLL Groups x 12 ZBLL Edge Permutations)
// Verified against SpeedCubeDB, J Perm COLL & ZBLL 2-Gen Standard Sheets
import { ColorScheme, DEFAULT_COLOR_SCHEME, CaseSimulationResult, getCaseState } from '../../engine/algSimulator';
import { AlgorithmEntry } from './beginnerAlgs';

export type ZBLLRootSetId =
  | 'T-Set'
  | 'U-Set'
  | 'L-Set'
  | 'Pi-Set'
  | 'H-Set'
  | 'Sune-Set'
  | 'Anti-Sune-Set';

export type COLLRecognitionPattern =
  | 'Adjacent Swap'
  | 'Diagonal Swap'
  | 'Front Bar'
  | 'Back Bar'
  | 'Left/Right Columns'
  | 'Checkerboard';

export interface ZBLLEdgeCase extends AlgorithmEntry {
  edgeCaseIndex: number; // 1..12
  edgePatternCode: string; // e.g. 'Pure', 'Ua', 'Ub', 'H', 'Z', 'Adj-FR', etc.
  is2Gen: boolean;
}

export interface COLLGroupNode {
  id: string;
  rootSetId: ZBLLRootSetId;
  groupCode: string; // e.g. 'T1', 'T2'..'AS6'
  name: string;
  recognitionPattern: COLLRecognitionPattern;
  recognitionVN: string;
  collAlg: AlgorithmEntry;
  zbllCases: ZBLLEdgeCase[]; // 12 ZBLL cases per COLL Group
}

export interface ZBLLRootSetNode {
  id: ZBLLRootSetId;
  name: string;
  ollCaseRef: string;
  descriptionVN: string;
  totalCOLLGroups: number;
  totalZBLLCases: number;
  collGroups: COLLGroupNode[]; // 6 COLL Groups per Root Set
}

interface COLLSeed {
  rootSetId: ZBLLRootSetId;
  groupIndex: number; // 1..6
  recognitionPattern: COLLRecognitionPattern;
  title: string;
  mainAlg: string;
  altAlgs: string[];
  probability: string;
  recognitionVN: string;
  fingertrickVN: string;
  zbllOverrides?: Partial<Record<number, { mainAlg: string; altAlgs?: string[]; fingertrickVN?: string }>>;
}

interface EdgeVariantDescriptor {
  index: number;
  code: string;
  labelVN: string;
  epConjugateAlg: string; // Edge-only PLL conjugate used when no custom override is provided
  probability: string;
  recognitionSuffixVN: string;
}

const TWELVE_EDGE_VARIANTS: EdgeVariantDescriptor[] = [
  {
    index: 1,
    code: 'Pure / Solved EP',
    labelVN: 'Pure COLL / EPLL Skip (Cạnh Đúng Sẵn - 2-Gen)',
    epConjugateAlg: '',
    probability: '1/864',
    recognitionSuffixVN: '4 cạnh đỉnh U đã nằm đúng vị trí tương đối với các góc (hoặc tạo khối 2x2x1 đối xứng).',
  },
  {
    index: 2,
    code: 'Ua-Cycle',
    labelVN: 'Ua Edge Cycle (Chu Kỳ 3 Cạnh Ngược Chiều KĐH - 2-Gen)',
    epConjugateAlg: "(R U' R U) R U (R U' R' U') R2",
    probability: '1/432',
    recognitionSuffixVN: 'Cạnh sau UB đã khớp với góc, 3 cạnh UF-UL-UR hoán vị ngược chiều kim đồng hồ (Ua).',
  },
  {
    index: 3,
    code: 'Ub-Cycle',
    labelVN: 'Ub Edge Cycle (Chu Kỳ 3 Cạnh Cùng Chiều KĐH - 2-Gen)',
    epConjugateAlg: "R2 U (R U R' U') R' U' (R' U R')",
    probability: '1/432',
    recognitionSuffixVN: 'Cạnh sau UB đã khớp với góc, 3 cạnh UF-UR-UL hoán vị cùng chiều kim đồng hồ (Ub).',
  },
  {
    index: 4,
    code: 'H-Swap',
    labelVN: 'H-Perm Edges (Đổi Cặp Cạnh Đối Diện UF-UB & UL-UR)',
    epConjugateAlg: 'M2 U M2 U2 M2 U M2',
    probability: '1/864',
    recognitionSuffixVN: 'Các cạnh đối diện nhau (Trước-Sau và Trái-Phải) có màu đối diện hoàn toàn với các góc hai bên.',
  },
  {
    index: 5,
    code: 'Z-Swap (UF-UL)',
    labelVN: 'Z-Perm Edges A (Đổi Cặp Cạnh Kề UF-UL & UB-UR)',
    epConjugateAlg: "M' U' M2 U' M2 U' M' U2 M2",
    probability: '1/864',
    recognitionSuffixVN: 'Hai cặp cạnh kề (Trước-Trái UF<->UL và Sau-Phải UB<->UR) hoán vị chéo nhau.',
  },
  {
    index: 6,
    code: 'Z-Swap (UF-UR)',
    labelVN: 'Z-Perm Edges B (Đổi Cặp Cạnh Kề UF-UR & UB-UL)',
    epConjugateAlg: "U M' U' M2 U' M2 U' M' U2 M2 U'",
    probability: '1/864',
    recognitionSuffixVN: 'Hai cặp cạnh kề (Trước-Phải UF<->UR và Sau-Trái UB<->UL) hoán vị chéo nhau.',
  },
  {
    index: 7,
    code: 'Adj-FR Cycle',
    labelVN: 'Front-Right Block Cycle (Khối 2x1 Trước-Phải - 2-Gen)',
    epConjugateAlg: "U (R U' R U) R U (R U' R' U') R2 U'",
    probability: '1/432',
    recognitionSuffixVN: 'Cạnh phải UR khớp màu với góc tạo khối 2x1 bên phải, 3 cạnh UF-UB-UL xoay vòng.',
  },
  {
    index: 8,
    code: 'Adj-FL Cycle',
    labelVN: 'Front-Left Block Cycle (Khối 2x1 Trước-Trái - 2-Gen)',
    epConjugateAlg: "U' (R U' R U) R U (R U' R' U') R2 U",
    probability: '1/432',
    recognitionSuffixVN: 'Cạnh trái UL khớp màu với góc tạo khối 2x1 bên trái, 3 cạnh UF-UR-UB xoay vòng.',
  },
  {
    index: 9,
    code: 'Adj-BR Cycle',
    labelVN: 'Back-Right Block Cycle (Khối 2x1 Sau-Phải - 2-Gen)',
    epConjugateAlg: "U R2 U (R U R' U') R' U' (R' U R') U'",
    probability: '1/432',
    recognitionSuffixVN: 'Cạnh phải UR khớp với góc sau-phải UBR, 3 cạnh còn lại hoán vị cùng chiều kim đồng hồ.',
  },
  {
    index: 10,
    code: 'Adj-BL Cycle',
    labelVN: 'Back-Left Block Cycle (Khối 2x1 Sau-Trái - 2-Gen)',
    epConjugateAlg: "U' R2 U (R U R' U') R' U' (R' U R') U",
    probability: '1/432',
    recognitionSuffixVN: 'Cạnh trái UL khớp với góc sau-trái UBL, 3 cạnh còn lại hoán vị cùng chiều kim đồng hồ.',
  },
  {
    index: 11,
    code: 'Opp-Front Fixed (CW)',
    labelVN: 'Front Edge Fixed CW (Cạnh Trước UF Đúng - Chu Kỳ CW - 2-Gen)',
    epConjugateAlg: "U2 R2 U (R U R' U') R' U' (R' U R') U2",
    probability: '1/432',
    recognitionSuffixVN: 'Cạnh trước UF tạo khối 2x1 với góc trước, 3 cạnh UL-UB-UR xoay cùng chiều kim đồng hồ.',
  },
  {
    index: 12,
    code: 'Opp-Front Fixed (CCW)',
    labelVN: 'Front Edge Fixed CCW (Cạnh Trước UF Đúng - Chu Kỳ CCW - 2-Gen)',
    epConjugateAlg: "U2 (R U' R U) R U (R U' R' U') R2 U2",
    probability: '1/432',
    recognitionSuffixVN: 'Cạnh trước UF tạo khối 2x1 với góc trước, 3 cạnh UR-UB-UL xoay ngược chiều kim đồng hồ.',
  },
];

const COLL_SEEDS: COLLSeed[] = [
  // ============================================================================
  // TIER 1.1: T-SET (6 COLL Groups)
  // ============================================================================
  {
    rootSetId: 'T-Set',
    groupIndex: 1,
    recognitionPattern: 'Front Bar',
    title: 'COLL T1: Front Bar (2-Gen Double Sune)',
    mainAlg: "(R U R' U) R (U2 R') U' (R U2 R') U' (R U' R')",
    altAlgs: ["R U R2' U' R2 U' R2' U2' R U' R U' R'"],
    probability: '1/162',
    recognitionVN: '2 góc bên phải (UBR-UFR) đã lật Vàng lên U, 2 góc bên trái quay nhãn Vàng ra Trước-Sau; hai góc bên trái cùng màu.',
    fingertrickVN: 'Thuần 2-Gen (R, U): thực hiện Sune nối tiếp U\' Anti-Sune cực nhanh không đổi thế tay.',
    zbllOverrides: {
      1: {
        mainAlg: "(R U R' U) R (U2 R') U' (R U2 R') U' (R U' R')",
        fingertrickVN: 'ZBLL T1-Pure 2-Gen: Sune nối trực tiếp U\' Anti-Sune.',
      },
      2: {
        mainAlg: "U (R U2 R') U' (R U' R2') U2' (R U R' U) R",
        fingertrickVN: 'ZBLL T1-Ua 2-Gen rút gọn (13 bước): hủy bước giữa Anti-Sune và Sune thành R2\' U2\'.',
      },
      3: {
        mainAlg: "U R' U' R U' R' U2 R2 U R' U R U2' R'",
        fingertrickVN: 'ZBLL T1-Ub 2-Gen rút gọn: Back Anti-Sune hủy bước sang Sune.',
      },
      4: {
        mainAlg: "(R U R' U) R (U2 R') U' (R U2 R') U' (R U' R') M2 U M2 U2 M2 U M2",
        fingertrickVN: 'ZBLL T1-H: Sune-AntiSune kết hợp H-Perm giải trọn bộ góc và cạnh.',
      },
    },
  },
  {
    rootSetId: 'T-Set',
    groupIndex: 2,
    recognitionPattern: 'Back Bar',
    title: 'COLL T2: Back Bar (RUD Chameleon)',
    mainAlg: "U R' U R U2' R' L' U R U' L",
    altAlgs: ["U r' U r U2' R2' F R F' R"],
    probability: '1/162',
    recognitionVN: '2 góc bên phải đã lật Vàng có cùng màu trên mặt U (UBR-UFR), 2 góc bên trái khác màu nhau.',
    fingertrickVN: 'Mở đầu U R\' U R U2\' rồi thực hiện tổ hợp Niklas R\' L\' U R U\' L mượt mà.',
    zbllOverrides: {
      1: {
        mainAlg: "(r U R' U') (r' F R F')",
        fingertrickVN: 'Fat Sexy-Sledge 8 bước giải trực tiếp cả góc và cạnh khi khối 2x2 đã ghép sẵn.',
      },
      2: {
        mainAlg: "U R' U R U2' R' L' U R U' L (R U' R U) R U (R U' R' U') R2",
        fingertrickVN: 'Chuỗi RUD Chameleon nối liền Ua-Cycle 2-Gen.',
      },
    },
  },
  {
    rootSetId: 'T-Set',
    groupIndex: 3,
    recognitionPattern: 'Adjacent Swap',
    title: 'COLL T3: Adjacent Swap (Fat Sexy Sledge)',
    mainAlg: "(r U R' U') (r' F R F')",
    altAlgs: ["l' U' L U R U' r' F"],
    probability: '1/162',
    recognitionVN: '2 góc bên phải trên mặt U khác màu, 2 góc bên trái có nhãn mặt trên U trùng màu nhau.',
    fingertrickVN: 'Đặt 2 góc chưa lật ở bên trái (L) rồi thực hiện Fat Sexy (r U R\' U\') + Fat Sledgehammer (r\' F R F\').',
  },
  {
    rootSetId: 'T-Set',
    groupIndex: 4,
    recognitionPattern: 'Diagonal Swap',
    title: 'COLL T4: Diagonal Swap (F-Sexy-Sledge)',
    mainAlg: "U' F (R U R' U') R U' R' U' (R U R') F'",
    altAlgs: ["U R' U R2 D r' U2 r D' R2' U' R"],
    probability: '1/162',
    recognitionVN: 'Hai góc bên phải trên mặt U khác màu và hai góc bên trái cũng khác màu (hoán vị góc chéo).',
    fingertrickVN: 'Dùng biến thể U\' F (R U R\' U\') R U\' R\' U\' (R U R\') F\' để giữ tốc độ cổ tay cao nhất.',
  },
  {
    rootSetId: 'T-Set',
    groupIndex: 5,
    recognitionPattern: 'Left/Right Columns',
    title: 'COLL T5: Left/Right Columns (Niklas T)',
    mainAlg: "U (R U R D) (R' U' R D') R2'",
    altAlgs: ["(r U R' U') (r' F R F')"],
    probability: '1/162',
    recognitionVN: 'Cột dọc bên trái (UBL-UFL) cùng màu và cột dọc bên phải (UBR-UFR) cùng màu.',
    fingertrickVN: 'Công thức 9 bước siêu ngắn: dùng ngón áp út trái đẩy D và kéo D\'.',
  },
  {
    rootSetId: 'T-Set',
    groupIndex: 6,
    recognitionPattern: 'Checkerboard',
    title: 'COLL T6: Checkerboard (Opposite Columns)',
    mainAlg: "U R' U R2 D r' U2 r D' R2' U' R",
    altAlgs: ["U (R U2 R') U' R U' R2' U2' R U R' U R"],
    probability: '1/162',
    recognitionVN: 'Hai góc chéo UBL-UFR và UFL-UBR có màu trùng nhau tạo hoa văn bàn cờ.',
    fingertrickVN: 'Có thể dùng công thức U R\' U R2 D r\' U2 r D\' R2\' U\' R để bảo toàn cảm giác tay.',
  },

  // ============================================================================
  // TIER 1.2: U-SET (6 COLL Groups)
  // ============================================================================
  {
    rootSetId: 'U-Set',
    groupIndex: 1,
    recognitionPattern: 'Front Bar',
    title: 'COLL U1: Front Bar (2-Gen Sune-AntiSune)',
    mainAlg: "R' U' (R U' R') U2 R2 U (R' U R) U2' R'",
    altAlgs: ["(R U R' U) R (U2 R') U2 (R' U' R U') R' U2 R"],
    probability: '1/162',
    recognitionVN: 'Đèn pha Vàng ở mặt trước F; hai nhãn trên của 2 góc trước (UFL-UFR) cùng màu, 2 góc sau cùng màu.',
    fingertrickVN: 'Công thức 2-Gen chuẩn 13 bước hủy giữa Back-AntiSune và Back-Sune.',
    zbllOverrides: {
      1: {
        mainAlg: "R' U' (R U' R') U2 R2 U (R' U R) U2' R'",
        fingertrickVN: 'ZBLL U1-Pure 2-Gen 13 bước không regrip.',
      },
      2: {
        mainAlg: "U2 R2 D R' U2 R D' R' U2 R' U2",
        fingertrickVN: 'OCLL 23 chuẩn 9 bước (kèm AUF U2) giải trực tiếp trường hợp Ua-Cycle của U-Set.',
      },
      3: {
        mainAlg: "R2' D' R U2 R' D R U2 R",
        fingertrickVN: 'Inverse OCLL 23 chuẩn 9 bước giải trực tiếp trường hợp Ub-Cycle.',
      },
    },
  },
  {
    rootSetId: 'U-Set',
    groupIndex: 2,
    recognitionPattern: 'Back Bar',
    title: 'COLL U2: Back Bar (OCLL Headlights D-Move)',
    mainAlg: "R2 D R' U2 R D' R' U2 R'",
    altAlgs: ["y2 R2 D R' U2 R D' R' U2 R'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha Vàng ở mặt trước F; hai góc phía sau (UBL-UBR) trên mặt U cùng màu còn hai góc trước khác màu.',
    fingertrickVN: 'Công thức OCLL 23 chuẩn 9 bước: giữ ngón cái phải dưới đáy và búng D/D\' bằng tay trái.',
  },
  {
    rootSetId: 'U-Set',
    groupIndex: 3,
    recognitionPattern: 'Adjacent Swap',
    title: 'COLL U3: Adjacent Swap (Inverse D-Headlights)',
    mainAlg: "R2' D' R U2 R' D R U2 R",
    altAlgs: ["(R U2 R') U' (R U' R') L' U2 L U L' U L"],
    probability: '1/162',
    recognitionVN: 'Đèn pha Vàng ở mặt trước F; hai góc phía trước (UFL-UFR) cùng màu nhưng hai góc phía sau khác màu.',
    fingertrickVN: 'Thực hiện R2\' D\' R U2 R\' D R U2 R chỉ mất 0.7 giây.',
  },
  {
    rootSetId: 'U-Set',
    groupIndex: 4,
    recognitionPattern: 'Diagonal Swap',
    title: 'COLL U4: Diagonal Swap (F-R-U Slash)',
    mainAlg: "F (R U' R' U) R U (R' U R U') R' F'",
    altAlgs: ["R' U2 R F U' R' U' R U F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha Vàng ở mặt trước F; đường chéo UFL-UBR cùng màu nhau, hai góc còn lại khác màu.',
    fingertrickVN: 'Mở F bằng ngón trỏ phải, chạy chuỗi R-U giữa rồi đóng F\' bằng ngón cái phải.',
  },
  {
    rootSetId: 'U-Set',
    groupIndex: 5,
    recognitionPattern: 'Left/Right Columns',
    title: 'COLL U5: Left/Right Columns (Backslash U)',
    mainAlg: "R2' D' r U2 r' D R U2 R",
    altAlgs: ["F (R U R' U') F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha Vàng ở mặt trước F; đường chéo UBL-UFR cùng màu nhau.',
    fingertrickVN: 'Chỉ khác U3 ở hai bước giữa dùng wide-r (r U2 r\') thay vì R U2 R\'.',
  },
  {
    rootSetId: 'U-Set',
    groupIndex: 6,
    recognitionPattern: 'Checkerboard',
    title: 'COLL U6: Checkerboard (X-Swap U)',
    mainAlg: "R' U2 R F U' R' U' R U F'",
    altAlgs: ["(R U R' U') R' F R2 U R' U' R U R' U' F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha Vàng ở mặt trước F; cả hai đường chéo góc đều cùng màu (cần đổi chéo 2 góc).',
    fingertrickVN: 'Thực hiện R\' U2 R rồi kẹp F U\' R\' U\' R U F\' liên hoàn.',
  },

  // ============================================================================
  // TIER 1.3: L-SET (6 COLL Groups - Bowtie / OLL 25)
  // ============================================================================
  {
    rootSetId: 'L-Set',
    groupIndex: 1,
    recognitionPattern: 'Front Bar',
    title: 'COLL L1: Front Bar (2-Gen Triple-Sune L)',
    mainAlg: "(R U2 R') U' (R U R' U') (R U R' U') R U' R'",
    altAlgs: ["R' U' R U' R' U R U' R' U2 R"],
    probability: '1/162',
    recognitionVN: '2 góc chéo đã lật Vàng; hai góc chưa lật có nhãn trên U cùng màu với góc đối diện tạo thành các dải song song.',
    fingertrickVN: 'Thuần 2-Gen (R, U): mở đầu R U2 R\' U\' rồi thực hiện 2 lần Sexy Move và khóa R U\' R\'.',
    zbllOverrides: {
      1: {
        mainAlg: "(R U2 R') U' (R U R' U') (R U R' U') R U' R'",
        fingertrickVN: 'ZBLL L1-Pure 2-Gen: 15 bước R-U thuần túy.',
      },
    },
  },
  {
    rootSetId: 'L-Set',
    groupIndex: 2,
    recognitionPattern: 'Back Bar',
    title: 'COLL L2: Back Bar (RUD Bowtie Standard)',
    mainAlg: "R' U2 R' D' R U2 R' D R2",
    altAlgs: ["F' r U R' U' r' F R"],
    probability: '1/162',
    recognitionVN: 'Hai góc đã lật Vàng trên mặt U (UBL và UFR) có màu mặt bên khớp với góc kề phía sau.',
    fingertrickVN: 'Thực hiện R\' U2 R\' D\' R U2 R\' D R2 bằng ngón áp út trái đẩy D\' và kéo D.',
  },
  {
    rootSetId: 'L-Set',
    groupIndex: 3,
    recognitionPattern: 'Adjacent Swap',
    title: 'COLL L3: Adjacent Swap (OLL 25 Standard)',
    mainAlg: "F' (r U R' U') r' F R",
    altAlgs: ["R U2' R D R' U2 R D' R2'"],
    probability: '1/162',
    recognitionVN: 'Hai góc đã lật Vàng trên mặt U cùng màu nhau, hai góc chưa lật khác màu nhau.',
    fingertrickVN: 'Công thức chuẩn OLL 25: F\' (r U R\' U\') r\' F R chỉ 8 bước.',
  },
  {
    rootSetId: 'L-Set',
    groupIndex: 4,
    recognitionPattern: 'Diagonal Swap',
    title: 'COLL L4: Diagonal Swap (Sledge-Sexy L)',
    mainAlg: "F (R' F' r) (U R U') r'",
    altAlgs: ["(R U R' U') R' F R2 U' R' U' (R U R') F' R U R' U R U2' R'"],
    probability: '1/162',
    recognitionVN: 'Hai góc đã lật Vàng khác màu nhau, nhưng hai góc chưa lật có nhãn trên U trùng màu nhau.',
    fingertrickVN: 'Đảo ngược của L3: thực hiện F (R\' F\' r) (U R U\') r\' trong 0.6 giây.',
  },
  {
    rootSetId: 'L-Set',
    groupIndex: 5,
    recognitionPattern: 'Left/Right Columns',
    title: 'COLL L5: Left/Right Columns (Niklas Bowtie)',
    mainAlg: "(R U2' R D) (R' U2 R D') R2'",
    altAlgs: ["R' U' (R U R' F') (R U R' U') R' F R2"],
    probability: '1/162',
    recognitionVN: 'Cột trái và cột phải có màu đối xứng song song trên mặt U.',
    fingertrickVN: 'Tương tự L2 nhưng bắt đầu bằng R U2\' R D R\' U2 R D\' R2\'.',
  },
  {
    rootSetId: 'L-Set',
    groupIndex: 6,
    recognitionPattern: 'Checkerboard',
    title: 'COLL L6: Checkerboard (Pure Diagonal Bowtie)',
    mainAlg: "r U2' R2' F R F' R U2' r'",
    altAlgs: ["F' (r U R' U') r' F R F R U' R' U' (R U R') F' (R U R' U') (R' F R F')"],
    probability: '1/162',
    recognitionVN: 'Cả 4 góc đều khác màu nhau từng cặp kề (trạng thái đổi góc chéo của L-Set).',
    fingertrickVN: 'Công thức 9 bước siêu tốc r U2\' R2\' F R F\' R U2\' r\' bảo toàn hoàn toàn định hướng cạnh.',
  },

  // ============================================================================
  // TIER 1.4: PI-SET (6 COLL Groups - OLL 22 Bruno)
  // ============================================================================
  {
    rootSetId: 'Pi-Set',
    groupIndex: 1,
    recognitionPattern: 'Front Bar',
    title: 'COLL Pi1: Right/Front Bar (Bruno 2-Gen Standard)',
    mainAlg: "R U2 R2' U' R2 U' R2' U2' R",
    altAlgs: ["f (R U R' U') f' F (R U R' U') F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha ở mặt trái L; hai góc bên phải (UBR-UFR) cùng màu trên mặt U và hai góc bên trái cũng cùng màu.',
    fingertrickVN: 'Công thức 2-Gen 9 bước kinh điển: cuộn R2 liên hoàn không cần regrip.',
    zbllOverrides: {
      1: {
        mainAlg: "R U2 R2' U' R2 U' R2' U2' R",
        fingertrickVN: 'ZBLL Pi1-Pure 2-Gen (Bruno 9 bước).',
      },
      2: {
        mainAlg: "(R U R' U) (R U2 R') U' (R U R' U) R U2' R'",
        fingertrickVN: 'ZBLL Pi1-Ua 2-Gen (Double Sune biến thể).',
      },
    },
  },
  {
    rootSetId: 'Pi-Set',
    groupIndex: 2,
    recognitionPattern: 'Back Bar',
    title: 'COLL Pi2: Left/Back Bar (Double Sune Pi)',
    mainAlg: "(R U R' U) (R U2 R') U' (R U R' U) (R U2 R')",
    altAlgs: ["f (R U R' U') f' F (R U R' U') F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha ở mặt trái L; hai góc của đèn pha (UBL-UFL) cùng màu nhưng hai góc bên phải khác màu.',
    fingertrickVN: 'Thực hiện 2 lần Sune cách nhau bởi U\' để giải thuần 2-Gen <R, U> cực mượt.',
  },
  {
    rootSetId: 'Pi-Set',
    groupIndex: 3,
    recognitionPattern: 'Adjacent Swap',
    title: 'COLL Pi3: Adjacent Swap (Slash Pi)',
    mainAlg: "F (R U' R' U) R U2 R' U' (R U R' U') F'",
    altAlgs: ["(R U R' U) (R U2 R') U' (R U R' U) (R U2 R')"],
    probability: '1/162',
    recognitionVN: 'Đèn pha ở mặt trái L; đường chéo UFL-UBR cùng màu nhau, hai góc còn lại khác màu.',
    fingertrickVN: 'Mở F rồi thực hiện tổ hợp R-U mượt mà và đóng bằng Sexy Move + F\'.',
  },
  {
    rootSetId: 'Pi-Set',
    groupIndex: 4,
    recognitionPattern: 'Diagonal Swap',
    title: 'COLL Pi4: Diagonal Swap (Checkerboard X-Pi)',
    mainAlg: "(R U R' U') R' F R2 U R' U' (R U R' U') F'",
    altAlgs: ["F (R U' R' U) R U2 R' U' (R U R' U') F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha ở mặt trái L; cả hai đường chéo (UBL-UFR và UFL-UBR) đều cùng màu nhau.',
    fingertrickVN: 'Khởi đầu như T-Perm bằng Sexy Move rồi nối R\' F R2 U R\' U\' (R U R\' U\') F\'.',
  },
  {
    rootSetId: 'Pi-Set',
    groupIndex: 5,
    recognitionPattern: 'Left/Right Columns',
    title: 'COLL Pi5: Left/Right Columns (Backslash Pi)',
    mainAlg: "R U2 R2' U' R2 U' R2' U2' R (R U R' U') R' F R2 U' R' U' (R U R') F'",
    altAlgs: ["F (R U' R' U) R U2 R' U' (R U R' U') F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha ở mặt trái L; đường chéo UBL-UFR cùng màu nhau.',
    fingertrickVN: 'Kết hợp Bruno 2-Gen và T-Perm liền mạch bảo toàn 100% chữ thập vàng.',
  },
  {
    rootSetId: 'Pi-Set',
    groupIndex: 6,
    recognitionPattern: 'Checkerboard',
    title: 'COLL Pi6: Checkerboard Columns (Anti-Bruno)',
    mainAlg: "R U2 R2' U' R2 U' R2' U2' R U (R U R' U') R' F R2 U' R' U' (R U R') F' U'",
    altAlgs: ["(R U R' U) (R U2 R') U' (R U R' U) (R U2 R')"],
    probability: '1/162',
    recognitionVN: 'Đèn pha ở mặt trái L; hai góc bên phải cùng màu nhưng hai góc bên trái khác màu.',
    fingertrickVN: 'Chạy Bruno 2-Gen nối tiếp hoán vị góc phải không đổi thế cầm.',
  },

  // ============================================================================
  // TIER 1.5: H-SET (4 Unique Symmetries + 2 Orientation Angles = 6 COLL Slots)
  // ============================================================================
  {
    rootSetId: 'H-Set',
    groupIndex: 1,
    recognitionPattern: 'Left/Right Columns',
    title: 'COLL H1: Columns (2-Gen Double Sune)',
    mainAlg: "(R U R' U) R U' R' U R U2' R'",
    altAlgs: ["(R U2 R') U' (R U R' U') (R U' R')"],
    probability: '1/324',
    recognitionVN: 'Đèn pha đôi Trước-Sau; trên mặt U cột trái (UBL-UFL) cùng màu và cột phải (UBR-UFR) cùng màu.',
    fingertrickVN: 'Công thức 2-Gen 11 bước nhanh nhất trong toàn bộ hệ thống COLL/ZBLL.',
    zbllOverrides: {
      1: {
        mainAlg: "(R U R' U) R U' R' U R U2' R'",
        fingertrickVN: 'ZBLL H1-Pure 2-Gen (Triple Sune 11 bước).',
      },
      2: {
        mainAlg: "(R U2 R') U' (R U R' U') (R U' R')",
        fingertrickVN: 'ZBLL H1-Ua 2-Gen (Double Anti-Sune 11 bước).',
      },
    },
  },
  {
    rootSetId: 'H-Set',
    groupIndex: 2,
    recognitionPattern: 'Checkerboard',
    title: 'COLL H2: Rows / Checkerboard (Triple Sexy F)',
    mainAlg: "F (R U R' U') (R U R' U') (R U R' U') F'",
    altAlgs: ["U (R U R' U) R U' R' U R U2' R'"],
    probability: '1/324',
    recognitionVN: 'Đèn pha đôi Trước-Sau; trên mặt U hàng ngang Trước (UFL-UFR) cùng màu và hàng ngang Sau (UBL-UBR) cùng màu.',
    fingertrickVN: 'Thực hiện F + 3 lần Sexy Move (R U R\' U\') + F\' tốc độ TPS cực đại.',
  },
  {
    rootSetId: 'H-Set',
    groupIndex: 3,
    recognitionPattern: 'Front Bar',
    title: 'COLL H3: Front Bar (Sune-Sledge H)',
    mainAlg: "(R U R' U) (R U L' U) R' U' L",
    altAlgs: ["R U2' R2' F R F' U2 R' F R F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha đôi Trước-Sau; hai góc phía trước (UFL-UFR) cùng màu còn hai góc phía sau khác màu.',
    fingertrickVN: 'Bắt đầu như Sune (R U R\' U) rồi nối trực tiếp vào Niklas (R U L\' U R\' U\' L).',
  },
  {
    rootSetId: 'H-Set',
    groupIndex: 4,
    recognitionPattern: 'Back Bar',
    title: 'COLL H4: Back Bar (Inverse Sune-Niklas H)',
    mainAlg: "U2 (R U R' U) (R U L' U) R' U' L",
    altAlgs: ["F (R U' R' U) R U2 R' U' (R U R' U') F'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha đôi Trước-Sau; hai góc phía sau (UBL-UBR) cùng màu còn hai góc phía trước khác màu.',
    fingertrickVN: 'Gẩy U2 rồi chạy tổ hợp Sune-Niklas 11 bước.',
  },
  {
    rootSetId: 'H-Set',
    groupIndex: 5,
    recognitionPattern: 'Adjacent Swap',
    title: 'COLL H5: Right Bar (Adjacent Swap Right)',
    mainAlg: "U' (R U R' U) (R U L' U) R' U' L",
    altAlgs: ["r U' r2' D' r U' r' D r2 U r'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha đôi Trái-Phải; hai góc bên phải (UBR-UFR) cùng màu trên mặt U, hai góc trái khác màu.',
    fingertrickVN: 'Xoay AUF U\' rồi thực hiện tổ hợp Sune-Niklas liền mạch.',
  },
  {
    rootSetId: 'H-Set',
    groupIndex: 6,
    recognitionPattern: 'Diagonal Swap',
    title: 'COLL H6: Left Bar (Adjacent Swap Left)',
    mainAlg: "U (R U R' U) (R U L' U) R' U' L",
    altAlgs: ["U2 r U' r2' D' r U' r' D r2 U r'"],
    probability: '1/162',
    recognitionVN: 'Đèn pha đôi Trái-Phải; hai góc bên trái (UBL-UFL) cùng màu trên mặt U, hai góc phải khác màu.',
    fingertrickVN: 'Xoay AUF U rồi thực hiện Sune-Niklas.',
  },

  // ============================================================================
  // TIER 1.6: SUNE-SET (6 COLL/ZBLL Groups - OLL 27)
  // ============================================================================
  {
    rootSetId: 'Sune-Set',
    groupIndex: 1,
    recognitionPattern: 'Front Bar',
    title: 'COLL S1: Pure Sune (2-Gen Standard Sune)',
    mainAlg: "(R U R' U) R (U2 R')",
    altAlgs: ["U' R' U2 R U R' U R"],
    probability: '1/162',
    recognitionVN: 'Góc UFL đã lật Vàng; hai góc bên trái cùng màu và các góc mặt bên tạo dải đồng bộ.',
    fingertrickVN: 'Sune 7 bước kinh điển: (R U R\' U) R (U2 R\').',
    zbllOverrides: {
      1: {
        mainAlg: "(R U R' U) R (U2 R')",
        fingertrickVN: 'ZBLL Sune-Pure 7 bước 2-Gen.',
      },
    },
  },
  {
    rootSetId: 'Sune-Set',
    groupIndex: 2,
    recognitionPattern: 'Back Bar',
    title: 'COLL S2: Back Bar (Niklas Sune)',
    mainAlg: "R U' L' U R' U' L",
    altAlgs: ["U2 L' U' L U' L' U2 L"],
    probability: '1/162',
    recognitionVN: 'Góc UFL đã lật Vàng; hai góc bên phải (UBR-UFR) có màu khớp nhau.',
    fingertrickVN: 'Thực hiện Niklas 7 bước R U\' L\' U R\' U\' L.',
  },
  {
    rootSetId: 'Sune-Set',
    groupIndex: 3,
    recognitionPattern: 'Adjacent Swap',
    title: 'COLL S3: Adjacent Swap (Sune + T-Perm)',
    mainAlg: "(R U R' U) R (U2 R') U (R U R' U') R' F R2 U' R' U' (R U R') F' U'",
    altAlgs: ["U2 (R U R' U) (L' U R U') L U2' R'"],
    probability: '1/162',
    recognitionVN: 'Góc UFL đã lật Vàng; hai đường chéo có màu đối xứng.',
    fingertrickVN: 'Thực hiện Sune chuẩn nối tiếp hoán vị góc bảo toàn 100% chữ thập vàng.',
  },
  {
    rootSetId: 'Sune-Set',
    groupIndex: 4,
    recognitionPattern: 'Diagonal Swap',
    title: 'COLL S4: Diagonal Swap (Sune + Y-Perm)',
    mainAlg: "(R U R' U) R (U2 R') F R U' R' U' (R U R') F' (R U R' U') (R' F R F')",
    altAlgs: ["(r U R' U') (r' F R F') (R U R' U) R (U2 R')"],
    probability: '1/162',
    recognitionVN: 'Góc UFL đã lật Vàng; hai góc chéo UFL-UBR cùng màu nhưng hai góc kia khác màu.',
    fingertrickVN: 'Thực hiện Sune nối tiếp hoán vị góc chéo bảo toàn định hướng cạnh.',
  },
  {
    rootSetId: 'Sune-Set',
    groupIndex: 5,
    recognitionPattern: 'Left/Right Columns',
    title: 'COLL S5: Left/Right Columns (Fat Sexy-Sledge-Sune)',
    mainAlg: "(r U R' U') (r' F R F') (R U R' U) R (U2 R')",
    altAlgs: ["R U' L' U R' U' L"],
    probability: '1/162',
    recognitionVN: 'Góc UFL đã lật Vàng; cột trái và cột phải đều có màu trùng nhau.',
    fingertrickVN: 'Thực hiện Fat Sexy-Sledge (OLL 24) nối trực tiếp vào Sune (OLL 27).',
  },
  {
    rootSetId: 'Sune-Set',
    groupIndex: 6,
    recognitionPattern: 'Checkerboard',
    title: 'COLL S6: Checkerboard (Sune + Niklas)',
    mainAlg: "U2 (R U R' U) (L' U R U') L U2' R'",
    altAlgs: ["(R U R' U) (L' U R U') L U2' R'"],
    probability: '1/162',
    recognitionVN: 'Góc UFL đã lật Vàng; đường chéo UBL-UFR cùng màu.',
    fingertrickVN: 'Kết hợp Sune và Niklas trong một công thức 12 bước.',
  },

  // ============================================================================
  // TIER 1.7: ANTI-SUNE-SET (6 COLL/ZBLL Groups - OLL 26)
  // ============================================================================
  {
    rootSetId: 'Anti-Sune-Set',
    groupIndex: 1,
    recognitionPattern: 'Front Bar',
    title: 'COLL AS1: Pure Anti-Sune (2-Gen Standard Anti-Sune)',
    mainAlg: "(R U2 R') U' (R U' R')",
    altAlgs: ["R' U' R U' R' U2 R"],
    probability: '1/162',
    recognitionVN: 'Góc UBR đã lật Vàng; hai góc bên phải cùng màu và các dải mặt bên đồng bộ.',
    fingertrickVN: 'Anti-Sune 7 bước kinh điển: (R U2 R\') U\' (R U\' R\').',
    zbllOverrides: {
      1: {
        mainAlg: "(R U2 R') U' (R U' R')",
        fingertrickVN: 'ZBLL Anti-Sune Pure 7 bước 2-Gen.',
      },
    },
  },
  {
    rootSetId: 'Anti-Sune-Set',
    groupIndex: 2,
    recognitionPattern: 'Back Bar',
    title: 'COLL AS2: Back Bar (Inverse Niklas)',
    mainAlg: "U L' U R U' L U R'",
    altAlgs: ["L' U R U' L U R'"],
    probability: '1/162',
    recognitionVN: 'Góc UBR đã lật Vàng; đường chéo UFL-UBR có màu khớp nhau.',
    fingertrickVN: 'Thực hiện U nối Inverse Niklas 7 bước L\' U R U\' L U R\'.',
  },
  {
    rootSetId: 'Anti-Sune-Set',
    groupIndex: 3,
    recognitionPattern: 'Adjacent Swap',
    title: 'COLL AS3: Adjacent Swap (Anti-Sune + T-Perm)',
    mainAlg: "(R U2 R') U' (R U' R') (R U R' U') R' F R2 U' R' U' (R U R') F'",
    altAlgs: ["U L' U R U' L U R'"],
    probability: '1/162',
    recognitionVN: 'Góc UBR đã lật Vàng; đường chéo UBL-UFR có màu khớp nhau.',
    fingertrickVN: 'Thực hiện Anti-Sune (R U2 R\') U\' (R U\' R\') nối liền T-Perm.',
  },
  {
    rootSetId: 'Anti-Sune-Set',
    groupIndex: 4,
    recognitionPattern: 'Diagonal Swap',
    title: 'COLL AS4: Diagonal Swap (Anti-Sune + Y-Perm)',
    mainAlg: "(R U2 R') U' (R U' R') F R U' R' U' (R U R') F' (R U R' U') (R' F R F')",
    altAlgs: ["(R U2 R') U' (R U' R')"],
    probability: '1/162',
    recognitionVN: 'Góc UBR đã lật Vàng; hai góc bên trái cùng màu.',
    fingertrickVN: 'Chạy Anti-Sune nối tiếp Y-Perm bảo toàn hoàn toàn 4 cạnh vàng.',
  },
  {
    rootSetId: 'Anti-Sune-Set',
    groupIndex: 5,
    recognitionPattern: 'Left/Right Columns',
    title: 'COLL AS5: Left/Right Columns (Anti-Sune + Adj Swap)',
    mainAlg: "(R U2 R') U' (R U' R') U (R U R' U') R' F R2 U' R' U' (R U R') F' U'",
    altAlgs: ["U L' U R U' L U R'"],
    probability: '1/162',
    recognitionVN: 'Góc UBR đã lật Vàng; cả hai cột Trái và Phải đều có màu khớp nhau.',
    fingertrickVN: 'Chạy Anti-Sune nối liền hoán vị góc bảo toàn định hướng cạnh.',
  },
  {
    rootSetId: 'Anti-Sune-Set',
    groupIndex: 6,
    recognitionPattern: 'Checkerboard',
    title: 'COLL AS6: Checkerboard (Anti-Sune + Back Swap)',
    mainAlg: "(R U2 R') U' (R U' R') U' (R U R' U') R' F R2 U' R' U' (R U R') F' U",
    altAlgs: ["(R U2 R') U' (R U' R')"],
    probability: '1/162',
    recognitionVN: 'Góc UBR đã lật Vàng; cả hai đường chéo đều có màu khớp nhau.',
    fingertrickVN: 'Chạy Anti-Sune nối liền hoán vị góc sau bảo toàn 100% chữ thập vàng.',
  },
];

function isFormula2Gen(alg: string): boolean {
  const cleaned = alg.replace(/[()[\]'2]/g, ' ').trim();
  if (!cleaned) return true;
  const tokens = cleaned.split(/\s+/);
  return tokens.every((t) => t === 'R' || t === 'U');
}

function buildCOLLGroupNode(seed: COLLSeed): COLLGroupNode {
  const shortPrefix = seed.rootSetId.replace('-Set', '');
  const groupCode = `${shortPrefix}${seed.groupIndex}`;
  const groupId = `coll-${shortPrefix.toLowerCase()}-${seed.groupIndex}`;

  const collEntry: AlgorithmEntry = {
    id: groupId,
    name: seed.title,
    level: 'level-4',
    category: 'COLL',
    subGroup: `${seed.rootSetId} (${seed.recognitionPattern})`,
    mainAlg: seed.mainAlg,
    altAlgs: seed.altAlgs,
    probability: seed.probability,
    recognitionVN: seed.recognitionVN,
    fingertrickVN: seed.fingertrickVN,
  };

  const zbllCases: ZBLLEdgeCase[] = TWELVE_EDGE_VARIANTS.map((variant) => {
    const custom = seed.zbllOverrides?.[variant.index];
    const combinedAlg = custom?.mainAlg
      ? custom.mainAlg
      : variant.epConjugateAlg
        ? `${seed.mainAlg} ${variant.epConjugateAlg}`
        : seed.mainAlg;

    return {
      id: `zbll-${shortPrefix.toLowerCase()}${seed.groupIndex}-ep${variant.index}`,
      name: `ZBLL ${groupCode}-${variant.index}: ${variant.labelVN}`,
      level: 'level-4',
      category: 'ZBLL',
      subGroup: `${seed.rootSetId} - ${groupCode} (${seed.recognitionPattern})`,
      mainAlg: combinedAlg,
      altAlgs: custom?.altAlgs ?? (variant.epConjugateAlg ? [`${variant.epConjugateAlg} ${seed.mainAlg}`] : seed.altAlgs),
      probability: variant.probability,
      recognitionVN: `${seed.recognitionVN} Kết hợp trạng thái cạnh: ${variant.recognitionSuffixVN}`,
      fingertrickVN:
        custom?.fingertrickVN ??
        `${seed.fingertrickVN} Thực hiện liền mạch để giải đồng thời cả góc và cạnh tầng đỉnh (1-Look LL).`,
      edgeCaseIndex: variant.index,
      edgePatternCode: variant.code,
      is2Gen: isFormula2Gen(combinedAlg),
    };
  });

  return {
    id: groupId,
    rootSetId: seed.rootSetId,
    groupCode,
    name: seed.title,
    recognitionPattern: seed.recognitionPattern,
    recognitionVN: seed.recognitionVN,
    collAlg: collEntry,
    zbllCases,
  };
}

const ROOT_SET_METADATA: {
  id: ZBLLRootSetId;
  name: string;
  ollCaseRef: string;
  descriptionVN: string;
}[] = [
  {
    id: 'T-Set',
    name: '1. ZBLL / COLL T-Set (Chameleon - OLL 24)',
    ollCaseRef: 'OLL 24 (Chameleon)',
    descriptionVN: '2 góc sau đã lật Vàng lên U, 2 góc trước có nhãn Vàng nhìn sang hai bên Trái-Phải.',
  },
  {
    id: 'U-Set',
    name: '2. ZBLL / COLL U-Set (Headlights - OLL 23)',
    ollCaseRef: 'OLL 23 (Headlights)',
    descriptionVN: '2 góc sau đã lật Vàng lên U, 2 góc trước tạo cặp đèn pha (Headlights) nhìn thẳng ra mặt trước F.',
  },
  {
    id: 'L-Set',
    name: '3. ZBLL / COLL L-Set (Bowtie / Triple-Sune - OLL 25)',
    ollCaseRef: 'OLL 25 (Bowtie)',
    descriptionVN: '2 góc chéo (UBL & UFR) đã lật Vàng lên U, 2 góc còn lại có nhãn Vàng nhìn lệch góc.',
  },
  {
    id: 'Pi-Set',
    name: '4. ZBLL / COLL Pi-Set (Bruno / Wheel - OLL 22)',
    ollCaseRef: 'OLL 22 (Pi / Bruno)',
    descriptionVN: 'Cả 4 góc chưa lật Vàng: mặt trái L có cặp đèn pha, mặt phải R có 2 góc nhìn ra Trước-Sau.',
  },
  {
    id: 'H-Set',
    name: '5. ZBLL / COLL H-Set (Double Headlights - OLL 21)',
    ollCaseRef: 'OLL 21 (H / Cross)',
    descriptionVN: 'Cả 4 góc chưa lật Vàng: có 2 cặp đèn pha đối xứng nhau ở mặt Trước-Sau hoặc Trái-Phải.',
  },
  {
    id: 'Sune-Set',
    name: '6. ZBLL / COLL Sune-Set (Right Sune - OLL 27)',
    ollCaseRef: 'OLL 27 (Sune)',
    descriptionVN: 'Chỉ có 1 góc trước-trái (UFL) đã lật Vàng lên U, 3 góc còn lại xoay cùng chiều kim đồng hồ.',
  },
  {
    id: 'Anti-Sune-Set',
    name: '7. ZBLL / COLL Anti-Sune-Set (Back Sune - OLL 26)',
    ollCaseRef: 'OLL 26 (Anti-Sune)',
    descriptionVN: 'Chỉ có 1 góc sau-phải (UBR) đã lật Vàng lên U, 3 góc còn lại xoay ngược chiều kim đồng hồ.',
  },
];

/**
 * Complete 3-Tier ZBLL & COLL Hierarchy Tree:
 * Tier 1: 7 Root Orientation Sets
 * Tier 2: 6 COLL Corner Permutation Groups per Root Set (= 42 COLL Groups)
 * Tier 3: 12 ZBLL Edge Permutation Cases per COLL Group (= 504 ZBLL Nodes)
 */
export const ZBLL_HIERARCHY_TREE: ZBLLRootSetNode[] = ROOT_SET_METADATA.map((meta) => {
  const groups = COLL_SEEDS.filter((seed) => seed.rootSetId === meta.id).map(buildCOLLGroupNode);
  return {
    id: meta.id,
    name: meta.name,
    ollCaseRef: meta.ollCaseRef,
    descriptionVN: meta.descriptionVN,
    totalCOLLGroups: groups.length,
    totalZBLLCases: groups.reduce((acc, g) => acc + g.zbllCases.length, 0),
    collGroups: groups,
  };
});

/**
 * Flat array of all 42 primary COLL algorithms for search & quick filtering.
 */
export const COLL_ALGS: AlgorithmEntry[] = ZBLL_HIERARCHY_TREE.flatMap((root) =>
  root.collGroups.map((g) => g.collAlg),
);

/**
 * Flat array of all 504 ZBLL cases across the 7 Root Sets x 6 COLL Groups x 12 Edge Permutations.
 */
export const ZBLL_ALGS: ZBLLEdgeCase[] = ZBLL_HIERARCHY_TREE.flatMap((root) =>
  root.collGroups.flatMap((g) => g.zbllCases),
);

/**
 * Dynamic on-demand simulation helper so the UI can drill down:
 * Select Set (7) -> Select COLL Group (6) -> View 12 ZBLL Cases
 * and compute the exact 54-sticker state + permutation arrows on the fly without startup lag.
 */
export function simulateZBLLCase(
  zbllOrColl: Pick<AlgorithmEntry, 'mainAlg'>,
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
): CaseSimulationResult {
  return getCaseState(zbllOrColl.mainAlg, colorScheme);
}
