// Gold-Standard Full PLL (21 Cases) + 2-Look PLL (6 Flagged Cases) Algorithm Database
// Verified against SpeedCubeDB & J Perm with automatic Permutation Vector computation
import { getCaseState } from '../../engine/algSimulator';
import { AlgorithmEntry } from './beginnerAlgs';

export const PLL_SUBGROUPS = [
  '1. Edges Only (Chỉ Hoán Vị Cạnh - 4 Cases)',
  '2. Corners Only (Chỉ Hoán Vị Góc - 3 Cases)',
  '3. Adjacent Corner Swap (Hoán Vị 2 Góc Kề - 6 Cases)',
  '4. Diagonal Corner Swap (Hoán Vị 2 Góc Chéo - 4 Cases)',
  '5. G-Perms (Chu Kỳ Đôi Góc & Cạnh - 4 Cases)',
] as const;

const RAW_PLL_ALGS: Omit<AlgorithmEntry, 'arrows'>[] = [
  // ============================================================================
  // 1. EDGES ONLY (4 Cases: Ua, Ub, Z, H) - All 4 are 2-Look PLL Edge Cases
  // ============================================================================
  {
    id: 'pll-ua',
    name: 'PLL Ua (Chu Kỳ 3 Cạnh Ngược Chiều Kim Đồng Hồ)',
    level: 'level-2',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[0],
    isTwoLook: true,
    mainAlg: "(R U' R U) R U (R U' R' U') R2",
    altAlgs: [
      "M2 U M U2 M' U M2",
      "(R2 U' R' U') R U R U (R U' R)",
      "y2 (R U R' U) (R' U' R2 U') (R' U R' U) R",
    ],
    probability: '1/18',
    recognitionVN: 'Dải 1 mặt nguyên vẹn (Bar 3 ô) đặt ở mặt sau B; 3 viên cạnh còn lại (UF, UL, UR) hoán vị vòng tròn ngược chiều kim đồng hồ (UL -> UR -> UF).',
    fingertrickVN: 'Đặt dải Bar hoàn chỉnh ra mặt sau (B), thực hiện chuỗi 2-gen R-U liền mạch không đổi thế cầm tay hoặc dùng M2 U M U2 M\' U M2 siêu tốc.',
  },
  {
    id: 'pll-ub',
    name: 'PLL Ub (Chu Kỳ 3 Cạnh Cùng Chiều Kim Đồng Hồ)',
    level: 'level-2',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[0],
    isTwoLook: true,
    mainAlg: "R2 U (R U R' U') R' U' (R' U R')",
    altAlgs: [
      "M2 U' M U2 M' U' M2",
      "R' U R' U' R' U' (R' U R U) R2",
      "y2 (R' U' R U') R U R2 U (R U' R U') R'",
    ],
    probability: '1/18',
    recognitionVN: 'Dải 1 mặt nguyên vẹn (Bar 3 ô) đặt ở mặt sau B; 3 viên cạnh (UF, UR, UL) hoán vị vòng tròn theo chiều kim đồng hồ (UR -> UL -> UF).',
    fingertrickVN: 'Đặt dải Bar hoàn chỉnh ở mặt sau (B), khởi đầu R2 U rồi nối trực tiếp (R U R\' U\') R\' U\' R\' U R\' hoặc vuốt M-slice bằng ngón áp út.',
  },
  {
    id: 'pll-z',
    name: 'PLL Z (Đổi Chéo 2 Cặp Cạnh Kề)',
    level: 'level-2',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[0],
    isTwoLook: true,
    mainAlg: "M' U' M2 U' M2 U' M' U2 M2",
    altAlgs: [
      "M2 U M2 U M' U2 M2 U2 M'",
      "(R' U' R U') R U (R U' R' U) R U R2 U' R'",
    ],
    probability: '1/36',
    recognitionVN: 'Tất cả 4 góc đã đúng; các mặt bên có hoa văn xen kẽ 2 màu (Checkerboard), đổi chỗ cặp cạnh Trước-Trái (UF-UL) và Sau-Phải (UB-UR).',
    fingertrickVN: 'Giữ cặp cạnh cần đổi ở Trước-Phải hoặc Trước-Trái tùy công thức M-slice, kết hợp gẩy M2 kép bằng ngón áp út + ngón giữa tay trái.',
  },
  {
    id: 'pll-h',
    name: 'PLL H (Đổi Chéo 2 Cặp Cạnh Đối Diện)',
    level: 'level-2',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[0],
    isTwoLook: true,
    mainAlg: "M2 U M2 U2 M2 U M2",
    altAlgs: [
      "M2 U' M2 U2 M2 U' M2",
      "R2 U2 R U2 R2 U2 R2 U2 R U2 R2",
    ],
    probability: '1/72',
    recognitionVN: '4 góc đã đúng vị trí; viên cạnh ở giữa mỗi mặt bên có màu đối diện với 2 viên góc hai bên (Trước <-> Sau, Trái <-> Phải).',
    fingertrickVN: 'Cầm ở bất kỳ góc độ nào, thực hiện M2 bằng kỹ thuật double-flick (ngón áp út đẩy trước, ngón giữa đẩy nối tiếp) xen kẽ U và U2.',
  },

  // ============================================================================
  // 2. CORNERS ONLY (3 Cases: Aa, Ab, E)
  // ============================================================================
  {
    id: 'pll-aa',
    name: 'PLL Aa (Chu Kỳ 3 Góc Cùng Chiều Kim Đồng Hồ)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[1],
    mainAlg: "x R' U R' D2 R U' R' D2 R2 x'",
    altAlgs: [
      "x (R' U R') D2 (R U' R') D2 R2 x'",
      "R' F R' B2 R F' R' B2 R2",
    ],
    probability: '1/18',
    recognitionVN: 'Khối 2x2x1 hoàn chỉnh ở góc Sau-Trái (UBL) cùng cặp đèn pha (Headlights) ở mặt sau B; 3 góc UFR, UBR, UFL xoay cùng chiều kim đồng hồ.',
    fingertrickVN: 'Đặt khối 2x2 đã giải ở góc trên-trái, nghiêng khối x và dùng ngón áp út + ngón giữa tay trái kéo D2 cực nhanh.',
  },
  {
    id: 'pll-ab',
    name: 'PLL Ab (Chu Kỳ 3 Góc Ngược Chiều Kim Đồng Hồ)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[1],
    mainAlg: "x R2 D2 R U R' D2 R U' R x'",
    altAlgs: [
      "x' R U' R D2 R' U R D2 R2 x",
      "R2 B2 R F R' B2 R F' R",
    ],
    probability: '1/18',
    recognitionVN: 'Khối 2x2x1 hoàn chỉnh ở góc Sau-Trái (UBL) cùng cặp đèn pha (Headlights) ở mặt phải R; 3 góc UBR, UFR, UFL xoay ngược chiều kim đồng hồ.',
    fingertrickVN: 'Đặt khối 2x2 ở góc Sau-Trái, lật khối x rồi thực hiện R2 D2 ngay đầu công thức để tận dụng đà cổ tay phải.',
  },
  {
    id: 'pll-e',
    name: 'PLL E (Hoán Vị 2 Cặp Góc Song Song)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[1],
    mainAlg: "x' (R U' R' D) (R U R' D') (R U R' D) (R U' R' D') x",
    altAlgs: [
      "x' R U' R' D R U R' u2 R' U R D R' U' R x",
      "R B' R' F R B R' F' R B R' F R B' R' F'",
    ],
    probability: '1/36',
    recognitionVN: 'Không có cặp đèn pha (Headlights) nào ở cả 4 mặt bên, tất cả 4 cạnh đã giải đúng; cần đổi chỗ cặp góc UFR<->UBR và UFL<->UBL.',
    fingertrickVN: 'Đặt mặt trước sao cho màu bên phải của góc UFR trùng với màu tâm mặt trước F, nghiêng x\' rồi phối hợp nhịp nhàng R-U bằng tay phải và D/D\' bằng ngón áp út trái.',
  },

  // ============================================================================
  // 3. ADJACENT CORNER SWAP (6 Cases: T, F, Ja, Jb, Ra, Rb)
  // ============================================================================
  {
    id: 'pll-t',
    name: 'PLL T (Đổi 2 Góc Phải & 2 Cạnh Trái-Phải)',
    level: 'level-2',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[2],
    isTwoLook: true,
    mainAlg: "(R U R' U') R' F R2 U' R' U' (R U R') F'",
    altAlgs: [
      "(R U R' U') R' F R2 (U' R' U') R U R' F'",
    ],
    probability: '1/18',
    recognitionVN: 'Cặp đèn pha (Headlights) ở mặt trái L kết hợp với hai khối Bar 2 ô đối xứng nằm ở mặt Trước (F) và mặt Sau (B); đổi chỗ UFR<->UBR và UL<->UR.',
    fingertrickVN: 'Đặt đèn pha sang bên trái (L), bắt đầu bằng (R U R\' U\') rồi nối mượt sang R\' F R2 mà không cần đổi thế cầm tay.',
  },
  {
    id: 'pll-f',
    name: 'PLL F (Dải Bar 3 Ô Trái & Đổi 2 Góc Phải)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[2],
    mainAlg: "R' U' F' (R U R' U') R' F R2 U' R' U' (R U R') U R",
    altAlgs: [
      "R' U2 R' d' R' F' R2 U' R' U R' F R U' F",
    ],
    probability: '1/18',
    recognitionVN: 'Có duy nhất 1 dải Bar 3 ô nguyên vẹn đặt ở mặt trái L, 3 mặt còn lại hoàn toàn không có đèn pha hay khối 2 ô nào.',
    fingertrickVN: 'Đặt dải Bar 3 ô bên trái (L), thực hiện setup R\' U\' F\' rồi chạy thẳng vào lõi công thức T-Perm và kết thúc bằng U R.',
  },
  {
    id: 'pll-ja',
    name: 'PLL Ja (Dải Bar Trái - Khối 2 Ô Bên Trái)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[2],
    mainAlg: "x R2 F R F' R U2 r' U r U2 x'",
    altAlgs: [
      "L' U' L F (L' U' L U) L F' L2 U L",
      "(R' U L' U2) (R U' R' U2) R L",
    ],
    probability: '1/18',
    recognitionVN: 'Một dải Bar 3 ô hoàn chỉnh kết hợp với các khối 2x1 nằm lệch về phía bên trái của mỗi mặt kề.',
    fingertrickVN: 'Đặt dải Bar 3 ô ở mặt sau (B) hoặc mặt trái (L), dùng công thức x R2 F R F\' R U2 r\' U r U2 x\' để xoay hoàn toàn bằng tay phải.',
  },
  {
    id: 'pll-jb',
    name: 'PLL Jb (Dải Bar Trái - Khối 2 Ô Bên Phải)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[2],
    mainAlg: "(R U R') F' (R U R' U') R' F R2 U' R'",
    altAlgs: [
      "(R U R' F') (R U R' U') R' F R2 U' R' U'",
    ],
    probability: '1/18',
    recognitionVN: 'Dải Bar 3 ô nguyên vẹn đặt ở mặt trái L, mặt Trước F có khối 2x1 ở phía bên trái (UFL-UF); đổi 2 góc phải (UFR<->UBR) và 2 cạnh (UF<->UR).',
    fingertrickVN: 'Một trong những PLL nhanh nhất: bắt đầu bằng (R U R\') F\' bằng ngón trỏ trái đẩy F\', sau đó thực hiện phần đuôi của T-Perm.',
  },
  {
    id: 'pll-ra',
    name: 'PLL Ra (Đèn Pha Trái - Khối 2 Ô Phải)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[2],
    mainAlg: "(R U' R' U') (R U R D) (R' U' R D') R' U2 R'",
    altAlgs: [
      "(R U R') F' (R U2 R') U2 R' F R U R U2 R'",
      "L U2 L' U2 L F' L' U' L U L F L2",
    ],
    probability: '1/18',
    recognitionVN: 'Cặp đèn pha (Headlights) ở mặt trái L và một khối 2x1 nằm ở mặt Trước-Phải (UF-UFR).',
    fingertrickVN: 'Đặt đèn pha bên trái (L), tận dụng kỹ thuật đẩy D bằng ngón áp út trái và kéo D\' bằng ngón áp út phải để không phải xoay khối.',
  },
  {
    id: 'pll-rb',
    name: 'PLL Rb (Đèn Pha Sau - Khối 2 Ô Trái)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[2],
    mainAlg: "(R' U2 R U2) R' F (R U R' U') R' F' R2",
    altAlgs: [
      "(R' U2 R) U2 R' F (R U R' U') R' F' R2 U'",
    ],
    probability: '1/18',
    recognitionVN: 'Cặp đèn pha (Headlights) ở mặt sau B kèm khối 2x1 dính liền phía bên phải của đèn pha; đổi chỗ 2 góc mặt trước và 2 cạnh UL<->UR.',
    fingertrickVN: 'Thực hiện R\' U2 R U2 bằng double-flick liên hoàn, tiếp nối R\' F (Sexy Move) R\' F\' R2 cực kỳ trơn tru.',
  },

  // ============================================================================
  // 4. DIAGONAL CORNER SWAP (4 Cases: V, Y, Na, Nb)
  // ============================================================================
  {
    id: 'pll-v',
    name: 'PLL V (Khối 2x2 Trước-Trái & Đổi Góc Chéo)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[3],
    mainAlg: "(R' U R' U') R D' R' D R' U D' R2 U' R2 D R2",
    altAlgs: [
      "(R' U R' d') R' F' R2 U' R' U R' F R F",
      "R' U R U' R' f' U' R U2 R' U' R U' R' f R",
    ],
    probability: '1/18',
    recognitionVN: 'Một khối 2x2x1 hoàn chỉnh ở góc Trước-Trái (UFL), không có đèn pha ở bất kỳ mặt nào; hoán vị chéo 2 góc UFR<->UBL và 2 cạnh UB<->UR.',
    fingertrickVN: 'Đặt khối 2x2 ở góc Trước-Trái (UFL), dùng biến thể RUD hiện đại (U D\' đồng thời) để tránh phải xoay khối d\'.',
  },
  {
    id: 'pll-y',
    name: 'PLL Y (Hai Khối 2 Ô Vuông Góc & Đổi Góc Chéo)',
    level: 'level-2',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[3],
    isTwoLook: true,
    mainAlg: "F R U' R' U' (R U R') F' (R U R' U') (R' F R F')",
    altAlgs: [
      "F (R U' R' U') (R U R' F') (R U R' U') (R' F R F')",
    ],
    probability: '1/18',
    recognitionVN: 'Không có đèn pha; có 2 khối 2x1 nằm ở mặt Trước F và mặt Trái L tạo thành góc vuông bao quanh góc UFL; đổi chéo UFR<->UBL và UF<->UL.',
    fingertrickVN: 'Ghép từ 2 công thức OLL quen thuộc: F (R U\' R\' U\') (R U R\' F\') nối liền với Sexy Move (R U R\' U\') và Sledgehammer (R\' F R F\').',
  },
  {
    id: 'pll-na',
    name: 'PLL Na (Hai Khối 2 Ô Đối Xứng Bên Phải)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[3],
    mainAlg: "(R U R' U) (R U R') F' (R U R' U') R' F R2 U' R' U2 (R U' R')",
    altAlgs: [
      "L U' R U2 L' U R' L U' R U2 L' U R'",
    ],
    probability: '1/72',
    recognitionVN: 'Tất cả 4 mặt bên đều có khối 2x1 nằm ở phía bên phải, mặt đối diện có màu đối xứng hoàn toàn; đổi chéo UFR<->UBL và UL<->UR.',
    fingertrickVN: 'Bản chất là Setup (R U R\' U) + Jb-Perm + Undo Setup (U2 R U\' R\'), giúp thực hiện tốc độ cao như Jb-Perm mà không cần học nhịp mới.',
  },
  {
    id: 'pll-nb',
    name: 'PLL Nb (Hai Khối 2 Ô Đối Xứng Bên Trái)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[3],
    mainAlg: "(R' U R U') R' F' U' F (R U R') F R' F' (R U' R)",
    altAlgs: [
      "R' U L' U2 R U' L R' U L' U2 R U' L",
    ],
    probability: '1/72',
    recognitionVN: 'Tất cả 4 mặt bên đều có khối 2x1 nằm ở phía bên trái; đổi chéo cặp góc UFL<->UBR và cặp cạnh UF<->UB.',
    fingertrickVN: 'Sử dụng công thức R-U-F hiện đại khởi đầu bằng (R\' U R U\') R\' F\' U\' F để loại bỏ hoàn toàn các bước L rườm rà.',
  },

  // ============================================================================
  // 5. G-PERMS (4 Cases: Ga, Gb, Gc, Gd)
  // ============================================================================
  {
    id: 'pll-ga',
    name: 'PLL Ga (Đèn Pha Trái - Khối 2 Ô Trước-Phải)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[4],
    mainAlg: "R2 U R' U R' U' R U' R2 U' D (R' U R) D'",
    altAlgs: [
      "R2 u R' U R' U' R u' R2 y' R' U R",
    ],
    probability: '1/18',
    recognitionVN: 'Cặp đèn pha (Headlights) ở mặt trái L và một khối 2x1 nằm ở mặt Trước-Phải (UF-UFR).',
    fingertrickVN: 'Đặt đèn pha bên trái (L), dùng công thức RUD (thực hiện U\' D đồng thời ở giữa công thức) giúp không phải xoay khối y\'.',
  },
  {
    id: 'pll-gb',
    name: 'PLL Gb (Đèn Pha Trái - Khối 2 Ô Phải-Sau)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[4],
    mainAlg: "(R' U' R) U D' R2 U R' U R U' R U' R2 D",
    altAlgs: [
      "R' U' R y R2 u R' U R U' R u' R2",
    ],
    probability: '1/18',
    recognitionVN: 'Cặp đèn pha (Headlights) ở mặt trái L và một khối 2x1 nằm ở mặt Phải-Sau (UR-UBR).',
    fingertrickVN: 'Đặt đèn pha bên trái (L), mở đầu bằng (R\' U\' R) rồi gẩy đồng thời U D\' trước khi cuộn chuỗi R2 U R\' U R U\' R U\' R2 D.',
  },
  {
    id: 'pll-gc',
    name: 'PLL Gc (Đèn Pha Trái - Khối 2 Ô Sau-Trái)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[4],
    mainAlg: "R2 U' R U' R U R' U R2 U D' (R U' R') D",
    altAlgs: [
      "R2 u' R U' R U R' u R2 y R U' R'",
      "R2 F2 R U2 R U2 R' F (R U R' U') R' F R2",
    ],
    probability: '1/18',
    recognitionVN: 'Cặp đèn pha (Headlights) ở mặt trái L và một khối 2x1 nằm ở mặt Sau-Phải (nhìn từ mặt B là bên trái UB-UBR).',
    fingertrickVN: 'Đặt đèn pha bên trái (L), xoay R2 U\' R U\' R U R\' U R2 rồi kẹp U D\' đồng thời để khép lại bằng (R U\' R\') D.',
  },
  {
    id: 'pll-gd',
    name: 'PLL Gd (Đèn Pha Trái - Khối 2 Ô Phải-Trước)',
    level: 'level-3',
    category: 'PLL',
    subGroup: PLL_SUBGROUPS[4],
    mainAlg: "(R U R') U' D R2 U' R U' R' U R' U R2 D'",
    altAlgs: [
      "R U R' y' R2 u' R U' R' U R' u R2",
    ],
    probability: '1/18',
    recognitionVN: 'Cặp đèn pha (Headlights) ở mặt trái L và một khối 2x1 nằm ở mặt Phải-Trước (UR-UFR).',
    fingertrickVN: 'Đặt đèn pha bên trái (L), thực hiện (R U R\') rồi gẩy đồng thời U\' D trước khi hoàn tất chuỗi R2 U\' R U\' R\' U R\' U R2 D\'.',
  },
];

export const PLL_ALGS: AlgorithmEntry[] = RAW_PLL_ALGS.map((entry) => ({
  ...entry,
  arrows: getCaseState(entry.mainAlg).arrows,
}));
