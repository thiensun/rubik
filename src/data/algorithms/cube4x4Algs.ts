import { AlgorithmEntry } from './beginnerAlgs';

// ============================================================================
// 4x4x4 REVENGE CUBE GOLD-STANDARD ALGORITHM DATABASE
// Categories:
// 1. Last 2 Centers (L2C)
// 2. Last 2 Edges (L2E)
// 3. OLL Parity
// 4. PLL Parity
// ============================================================================

export type Cube4x4Category =
  | 'Yau Cross'
  | 'Last 2 Centers (L2C)'
  | 'Last 2 Edges (L2E)'
  | 'OLL Parity'
  | 'PLL Parity';

export const YAU_CROSS_4X4_ALGS: AlgorithmEntry[] = [
  {
    id: '4x4-yau-cross-slice-pair',
    name: 'Yau Cross 1 — Free-Slot Cross Dedge Pairing',
    category: 'Yau Cross',
    subGroup: '3 Cross Dedges',
    probability: 'Core',
    mainAlg: "Uw (R U' R') Uw'",
    altAlgs: ["Uw' (R U R') Uw"],
    recognitionVN: 'Ghép 3 cặp cạnh Cross Trắng đầu tiên khi rãnh R/U còn tự do và đặt về mặt D (chừa trống DR).',
    fingertrickVN: 'Cắt Uw nối 2 viên cạnh Trắng lại rồi đưa thẳng xuống mặt đáy D.',
    isTwoLook: true,
  },
  {
    id: '4x4-yau-cross-4th-dedge',
    name: 'Yau Cross 2 — 4th Cross Dedge Finish (After L2C)',
    category: 'Yau Cross',
    subGroup: '4th Cross Dedge',
    probability: '1/2',
    mainAlg: "Rw U Rw' U' R'",
    altAlgs: ["Uw' (R U R' F R' F' R) Uw R'"],
    recognitionVN: 'Sau khi giải xong 4 tâm mặt bên (L2C), ghép nốt cạnh Cross Trắng thứ 4 và trả xuống DR.',
    fingertrickVN: 'Ghép cạnh thứ 4 ngay trên tầng U rồi hạ R\' xuống hoàn tất White Cross 4x4.',
    isTwoLook: true,
  },
  {
    id: '4x4-yau-cross-flipped-fix',
    name: 'Yau Cross 3 — Flipped Cross Dedge Quick Flip',
    category: 'Yau Cross',
    subGroup: 'Orientation Fix',
    probability: '1/4',
    mainAlg: "R' U' F' U2 F",
    altAlgs: ["R U' R' F' U' F"],
    recognitionVN: 'Cặp cạnh Cross thứ 4 đã ghép đôi nhưng bị ngược màu Trắng khi hạ xuống đáy D.',
    fingertrickVN: '5 bước xoay mặt ngoài lật lại đúng chiều Trắng mà không phá 6 tâm đã giải.',
    isTwoLook: false,
  },
];

export const L2C_4X4_ALGS: AlgorithmEntry[] = [
  {
    id: '4x4-l2c-bar-swap',
    name: 'L2C 1 — Right Bar Insert (1x2 Swap)',
    category: 'Last 2 Centers (L2C)',
    subGroup: 'Bar Building',
    probability: '1/3',
    mainAlg: "Rw U Rw'",
    altAlgs: ["Rw U' Rw'", "Rw U2 Rw'"],
    recognitionVN: 'Thanh tâm 1x2 ở mặt F và thanh tâm cần ghép ở mặt U cùng cột bên phải.',
    fingertrickVN: 'Đẩy Rw bằng lòng bàn tay phải kết hợp flick U bằng ngón trỏ.',
    isTwoLook: true,
  },
  {
    id: '4x4-l2c-single-dot-commutator',
    name: 'L2C 2 — Single Center Dot Swap',
    category: 'Last 2 Centers (L2C)',
    subGroup: '1-Piece Commutator',
    probability: '1/4',
    mainAlg: "Rw U Rw' U Rw U2 Rw'",
    altAlgs: ["Lw' U' Lw U' Lw' U2 Lw"],
    recognitionVN: 'Cả mặt U và mặt F đều đã có 3/4 viên tâm, chỉ còn 1 viên tâm đơn lẻ cần hoán đổi.',
    fingertrickVN: 'Giống hệt Sune nhưng xoay lát kép Rw thay vì R! Không làm hỏng 4 tâm đã giải.',
    isTwoLook: true,
  },
  {
    id: '4x4-l2c-diagonal-dots',
    name: 'L2C 3 — Diagonal Center Dots',
    category: 'Last 2 Centers (L2C)',
    subGroup: '2-Piece Commutator',
    probability: '1/8',
    mainAlg: "Rw U2 Rw' U Rw U2 Rw'",
    altAlgs: ["Rw U' Rw' U' Rw U2 Rw'"],
    recognitionVN: '2 viên tâm cùng màu nằm chéo nhau trên mặt U và mặt F.',
    fingertrickVN: 'Double flick U2 mở đầu giúp tách cặp chéo thành thanh 1x2 ngay lập tức.',
    isTwoLook: true,
  },
  {
    id: '4x4-l2c-niklas-commutator',
    name: 'L2C 4 — Niklas Center Commutator',
    category: 'Last 2 Centers (L2C)',
    subGroup: 'Yau / Hoya L2C',
    probability: '1/6',
    mainAlg: "2R U' 2L' U 2R' U' 2L",
    altAlgs: ["Rw U' Lw' U Rw' U' Lw"],
    recognitionVN: 'Hoán đổi đúng 1 viên tâm duy nhất từ F lên U khi giải 3 cạnh Cross Yau đã cố định.',
    fingertrickVN: 'Dùng lát trong 2R / 2L để bảo toàn tuyệt đối các cạnh Cross đã dựng.',
    isTwoLook: false,
  },
];

export const L2E_4X4_ALGS: AlgorithmEntry[] = [
  {
    id: '4x4-l2e-edge-flip',
    name: 'L2E 1 — Standard Edge Flipping Alg',
    category: 'Last 2 Edges (L2E)',
    subGroup: 'Core Pairing',
    probability: 'Core',
    mainAlg: "(R U R' F) (R' F' R)",
    altAlgs: ["(R U R' U') (F' U F)"],
    recognitionVN: 'Công thức lật cạnh tại chỗ FR chuẩn bị cho bước Slice-Flip-Slice trong 3-2-3 Edge Pairing.',
    fingertrickVN: '7 bước vàng của 4x4x4: R U R\' nối F R\' F\' R liên hoàn bằng 2 ngón trỏ.',
    isTwoLook: true,
  },
  {
    id: '4x4-l2e-same-row-pair',
    name: 'L2E 2 — Same-Level Dedge Pairing (Slice-Flip-Slice)',
    category: 'Last 2 Edges (L2E)',
    subGroup: '2-Edge Swap',
    probability: '1/2',
    mainAlg: "Uw' (R U R' F R' F' R) Uw",
    altAlgs: ["Dw (R U R' F R' F' R) Dw'"],
    recognitionVN: '2 cặp cạnh cuối cùng ở FL và FR có viên cùng màu nằm ngang hàng nhau (cùng tầng trên hoặc cùng tầng dưới).',
    fingertrickVN: 'Cắt Uw\' đưa sang, thực hiện thuật toán lật cạnh FR 7 bước, rồi trả Uw về để hoàn tất cả 2 cặp cạnh!',
    isTwoLook: true,
  },
  {
    id: '4x4-l2e-diag-pair',
    name: 'L2E 3 — Diagonal Wing Pairing',
    category: 'Last 2 Edges (L2E)',
    subGroup: '2-Edge Swap',
    probability: '1/2',
    mainAlg: "(R U R' F R' F' R) Uw' (R U R' F R' F' R) Uw",
    altAlgs: ["Uw2 (R U R' F R' F' R) Uw2"],
    recognitionVN: '2 cặp cạnh cuối ở FL và FR có viên cùng màu nằm chéo nhau.',
    fingertrickVN: 'Hoặc dùng Uw2 + Flip Alg + Uw2 chỉ trong 9 bước!',
    isTwoLook: true,
  },
  {
    id: '4x4-l2e-3cycle-wings',
    name: 'L2E 4 — 3-Cycle Last 3 Dedges',
    category: 'Last 2 Edges (L2E)',
    subGroup: '3-2-3 Finish',
    probability: '1/3',
    mainAlg: "Uw (R U R' F R' F' R) Uw'",
    altAlgs: ["2U (R U R' F R' F' R) 2U'"],
    recognitionVN: 'Kết thúc chu trình ghép cạnh 3-2-3 trong phương pháp Yau.',
    fingertrickVN: 'Đẩy Uw bằng ngón áp út trái, lật FR, kéo Uw\' bằng ngón áp út phải.',
    isTwoLook: false,
  },
];

export const OLL_PARITY_4X4_ALGS: AlgorithmEntry[] = [
  {
    id: '4x4-oll-parity-lucas',
    name: 'OLL Parity 1 — Lucas Parity (WCA Standard)',
    category: 'OLL Parity',
    subGroup: 'Single Dedge Flip',
    probability: '1/2',
    mainAlg: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
    altAlgs: ["2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2"],
    recognitionVN: 'Trên tầng đỉnh U có số lẻ cạnh Vàng (1 hoặc 3 cạnh Vàng) — trạng thái bất khả thi trên 3x3x3.',
    fingertrickVN: 'Thuật toán Lucas Parity dùng toàn bộ lát rộng Rw/Lw và U2, tốc độ thực thi Sub-1.5s!',
    isTwoLook: true,
  },
  {
    id: '4x4-oll-parity-pure-wing',
    name: 'OLL Parity 2 — Pure Inner-Slice Dedge Flip',
    category: 'OLL Parity',
    subGroup: 'Pure Flip (Preserves Corners)',
    probability: '1/2',
    mainAlg: "2R' U2 2L F2 2L' F2 2R2 U2 2R U2 2R' U2 F2 2R2 F2",
    altAlgs: ["Rw2 B2 U2 Lw U2 Rw' U2 Rw U2 F2 Rw F2 Lw' B2 Rw2"],
    recognitionVN: 'Lật thuần khiết duy nhất cặp cạnh UF mà không làm thay đổi vị trí các góc tầng U.',
    fingertrickVN: 'Phù hợp khi kết hợp OLL Parity + COLL hoặc khi đã giải xong toàn bộ phần còn lại.',
    isTwoLook: false,
  },
  {
    id: '4x4-oll-double-parity',
    name: 'OLL Parity 3 — Double Parity (OLL + PLL Parity)',
    category: 'OLL Parity',
    subGroup: 'Combined Parity',
    probability: '1/4',
    mainAlg: "Rw2 B2 Rw' U2 Rw' U2 x' U2 Rw' U2 Rw U2 Rw' U2 Rw2 U2",
    altAlgs: ["2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2"],
    recognitionVN: 'Vừa bị lỗi lật 1 cạnh OLL Parity vừa bị lỗi hoán vị 2 cạnh PLL Parity.',
    fingertrickVN: 'Bỏ bước Rw2 cuối cùng của công thức chuẩn để xử lý đồng thời cả OLL và PLL Parity!',
    isTwoLook: false,
  },
];

export const PLL_PARITY_4X4_ALGS: AlgorithmEntry[] = [
  {
    id: '4x4-pll-parity-opposite',
    name: 'PLL Parity 1 — Opposite Dedge Swap (UF ↔ UB)',
    category: 'PLL Parity',
    subGroup: 'Opposite Swap',
    probability: '1/2',
    mainAlg: "2R2 U2 2R2 Uw2 2R2 Uw2",
    altAlgs: ["Rw2 R2 U2 Rw2 R2 Uw2 Rw2 R2 Uw2 U2"],
    recognitionVN: 'Toàn bộ khối 4x4x4 đã giải xong ngoại trừ 2 cặp cạnh đối diện UF và UB cần đổi chỗ cho nhau.',
    fingertrickVN: 'Chỉ 6 bước siêu tốc: dùng lát trong 2R2 hoặc kép Rw2 R2 kết hợp U2 và Uw2.',
    isTwoLook: true,
    arrows: [
      { from: [0, 1], to: [3, 1], bidirectional: true },
      { from: [0, 2], to: [3, 2], bidirectional: true },
    ],
  },
  {
    id: '4x4-pll-parity-adjacent',
    name: 'PLL Parity 2 — Adjacent Dedge Swap (UF ↔ UR)',
    category: 'PLL Parity',
    subGroup: 'Adjacent Swap',
    probability: '1/2',
    mainAlg: "(R U R' U') (2R2 U2 2R2 Uw2 2R2 Uw2) (U R U' R')",
    altAlgs: ["(2R2 U2 2R2 Uw2 2R2 Uw2) U' (R U R' U') (R' F R2 U' R' U' R U R' F')"],
    recognitionVN: '2 cặp cạnh liền kề UF và UR cần đổi chỗ cho nhau trên tầng U.',
    fingertrickVN: 'Setup bằng Sexy Move đưa UR ra đối diện UF, chạy PLL Parity 6 bước, rồi trả Inverse Sexy!',
    isTwoLook: true,
    arrows: [
      { from: [3, 1], to: [1, 3], bidirectional: true },
      { from: [3, 2], to: [2, 3], bidirectional: true },
    ],
  },
  {
    id: '4x4-pll-parity-diag-corners',
    name: 'PLL Parity 3 — Diagonal Corner Swap (UFL ↔ UBR)',
    category: 'PLL Parity',
    subGroup: 'Corner Swap',
    probability: '1/8',
    mainAlg: "F (R U' R' U') (R U R' F') (2R2 U2 2R2 Uw2 2R2 Uw2) (R U R' U') (R' F R F')",
    altAlgs: ["(2R2 U2 2R2 Uw2 2R2 Uw2) F (R U' R' U') (R U R' F') (R U R' U') (R' F R F')"],
    recognitionVN: 'Chỉ còn 2 góc đối diện chéo trên tầng U cần hoán đổi trong khi 4 cạnh đã đúng.',
    fingertrickVN: 'Kết hợp Y-Perm và PLL Parity thành một chuỗi liền mạch.',
    isTwoLook: false,
    arrows: [{ from: [3, 0], to: [0, 3], bidirectional: true }],
  },
];

export const CUBE_4X4_ALGS: AlgorithmEntry[] = [
  ...YAU_CROSS_4X4_ALGS,
  ...L2C_4X4_ALGS,
  ...L2E_4X4_ALGS,
  ...OLL_PARITY_4X4_ALGS,
  ...PLL_PARITY_4X4_ALGS,
];
