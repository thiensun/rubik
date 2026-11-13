import { AlgorithmEntry } from './beginnerAlgs';

// ============================================================================
// 2x2x2 POCKET CUBE GOLD-STANDARD ALGORITHM DATABASE
// Includes:
// 0. 2x2 LBL Beginner (4 Cases)
// 1. Ortega OLL (7 Cases)
// 2. Ortega PBL - Permute Both Layers (5 Cases)
// 3. CLL - 1-Look Last Layer (42 Cases across 7 Sets: Sune, Anti-Sune, Pi, U, L, T, H)
// ============================================================================

export const LBL_2X2_ALGS: AlgorithmEntry[] = [
  {
    id: '2x2-lbl-corner-right',
    name: '2x2 LBL 1 — Right Corner Insert (Sexy Move)',
    category: '2x2 LBL',
    subGroup: 'First Layer',
    probability: 'Core',
    mainAlg: "(R U R' U')",
    altAlgs: ["R U R'"],
    recognitionVN: 'Viên góc Trắng nằm ở UFR với mặt Trắng hướng sang Phải R.',
    fingertrickVN: 'Sexy Move 4 bước kinh điển đưa góc Trắng xuống DFR.',
    isTwoLook: true,
  },
  {
    id: '2x2-lbl-corner-top',
    name: '2x2 LBL 2 — Top White Sticker Corner Insert',
    category: '2x2 LBL',
    subGroup: 'First Layer',
    probability: '1/3',
    mainAlg: "(R U2 R') U' (R U R')",
    altAlgs: ["(R U R' U')3"],
    recognitionVN: 'Viên góc Trắng nằm ở UFR với mặt Trắng ngửa thẳng lên đỉnh U.',
    fingertrickVN: 'Tách góc bằng R U2 R\' để lật mặt Trắng sang bên rồi chèn R U R\'.',
    isTwoLook: true,
  },
  {
    id: '2x2-lbl-oll-sune',
    name: '2x2 LBL 3 — Beginner OLL (Sune Loop)',
    category: '2x2 LBL',
    subGroup: 'Last Layer OLL',
    probability: 'Core',
    mainAlg: "(R U R' U) (R U2 R')",
    altAlgs: ["(R U2 R') (U' R U' R')"],
    recognitionVN: 'Định hướng toàn bộ 4 góc Vàng tầng U chỉ bằng 1 công thức Sune duy nhất.',
    fingertrickVN: 'Nếu có 1 góc Vàng đúng: đặt ở UFL. Nếu có 2 góc Vàng: đặt chấm Vàng ở mặt F bên trái.',
    isTwoLook: true,
  },
  {
    id: '2x2-lbl-pll-yperm',
    name: '2x2 LBL 4 — Diagonal Corner Swap (Y-Perm)',
    category: '2x2 LBL',
    subGroup: 'Last Layer PLL',
    probability: '1/6',
    mainAlg: "F (R U' R' U') (R U R' F') (R U R' U') (R' F R F')",
    altAlgs: ["R U' R' U' F2 U' R U R' D R2"],
    recognitionVN: 'Tầng D đã hoàn chỉnh, tầng U cần đổi chéo 2 góc UFL ↔ UBR.',
    fingertrickVN: 'Nối 2 cụm OLL 37 và OLL 33 (Sledgehammer) liền mạch.',
    isTwoLook: true,
    arrows: [{ from: [0, 0], to: [1, 1], bidirectional: true }],
  },
];

export const ORTEGA_OLL_ALGS: AlgorithmEntry[] = [
  {
    id: '2x2-oll-sune',
    name: 'Ortega OLL 1 — Sune',
    category: 'Ortega OLL',
    subGroup: '1 Corner Oriented',
    probability: '4/27',
    mainAlg: "(R U R' U) (R U2 R')",
    altAlgs: ["(L' U' L U') (L' U2 L)"],
    recognitionVN: '1 góc Vàng đã lật đúng ở UFL, chấm Vàng mặt trước ở UFR.',
    fingertrickVN: 'Sexy trigger mở rộng, flick U2 bằng ngón trỏ + giữa.',
    isTwoLook: true,
  },
  {
    id: '2x2-oll-antisune',
    name: 'Ortega OLL 2 — Anti-Sune',
    category: 'Ortega OLL',
    subGroup: '1 Corner Oriented',
    probability: '4/27',
    mainAlg: "(R U2 R') (U' R U' R')",
    altAlgs: ["(R' U' R U') (R' U2 R)"],
    recognitionVN: '1 góc Vàng đã lật đúng ở UBR, chấm Vàng hướng về phía trước ở UFL.',
    fingertrickVN: 'Double flick U2 đầu tiên để vào nhịp mượt.',
    isTwoLook: true,
  },
  {
    id: '2x2-oll-pi',
    name: 'Ortega OLL 3 — Pi (Bruno)',
    category: 'Ortega OLL',
    subGroup: '0 Corners Oriented',
    probability: '2/27',
    mainAlg: "R U2 (R2 U' R2 U') R2 U2 R",
    altAlgs: ["F (R U R' U') (R U R' U') F'"],
    recognitionVN: 'Không có góc Vàng trên U; bên trái có đèn pha Vàng, bên phải 2 chấm Vàng quay trước/sau.',
    fingertrickVN: '2-gen R-U hoàn toàn, giữ ngón cái cố định trên mặt F.',
    isTwoLook: true,
  },
  {
    id: '2x2-oll-h',
    name: 'Ortega OLL 4 — H (Double Sune)',
    category: 'Ortega OLL',
    subGroup: '0 Corners Oriented',
    probability: '1/27',
    mainAlg: "R2 U2 R U2 R2",
    altAlgs: ["F (R U R' U')3 F'"],
    recognitionVN: 'Cả mặt F và B đều có cặp đèn pha Vàng đối xứng (Double Headlights).',
    fingertrickVN: 'Chỉ tốn 5 bước trên 2x2x2: R2 U2 R U2 R2 cực nhanh!',
    isTwoLook: true,
  },
  {
    id: '2x2-oll-u',
    name: 'Ortega OLL 5 — U (Headlights)',
    category: 'Ortega OLL',
    subGroup: '2 Corners Oriented',
    probability: '4/27',
    mainAlg: "F (R U R' U') F'",
    altAlgs: ["(R U R' U') (R' F R F')"],
    recognitionVN: '2 góc Vàng đã lật đúng bên phải, 2 góc bên trái tạo đèn pha Vàng hướng sang trái.',
    fingertrickVN: 'F bằng ngón trỏ phải, Sexy Move, trả F\' bằng ngón cái.',
    isTwoLook: true,
  },
  {
    id: '2x2-oll-t',
    name: 'Ortega OLL 6 — T (Chameleon)',
    category: 'Ortega OLL',
    subGroup: '2 Corners Oriented',
    probability: '4/27',
    mainAlg: "(R U R' U') (R' F R F')",
    altAlgs: ["F (U R U' R') F'"],
    recognitionVN: '2 góc Vàng đã lật đúng bên phải, 2 góc bên trái có chấm Vàng quay ngược chiều nhau (F và B).',
    fingertrickVN: 'Sexy Move nối trực tiếp Sledgehammer không đổi thế cầm.',
    isTwoLook: true,
  },
  {
    id: '2x2-oll-l',
    name: 'Ortega OLL 7 — L (Bowtie)',
    category: 'Ortega OLL',
    subGroup: '2 Corners Oriented',
    probability: '4/27',
    mainAlg: "F (R' F' R) (U R U' R')",
    altAlgs: ["(R U2 R') (F R' F' R) (U' R U' R')"],
    recognitionVN: '2 góc Vàng nằm chéo nhau trên đỉnh U.',
    fingertrickVN: 'Hedgeslammer biến thể kết hợp Inverse Sexy.',
    isTwoLook: true,
  },
];

export const ORTEGA_PBL_ALGS: AlgorithmEntry[] = [
  {
    id: '2x2-pbl-adj-adj',
    name: 'PBL 1 — Adj / Adj (2 Bars)',
    category: 'Ortega PBL',
    subGroup: 'Both Layers Swap',
    probability: '4/9',
    mainAlg: "R2 U' B2 U2 R2 U' R2",
    altAlgs: ["R2 U' R2 U2 y R2 U' R2"],
    recognitionVN: 'Cả tầng trên U và tầng dưới D đều có 1 thanh màu đồng nhất (Bar), đặt cả 2 thanh ở mặt Trước F.',
    fingertrickVN: 'Chuỗi R2-U-B2 không regrip giúp đảo đồng thời 2 tầng trong 0.6s.',
    isTwoLook: true,
    arrows: [{ from: [0, 0], to: [0, 1], bidirectional: true }],
  },
  {
    id: '2x2-pbl-adj-diag',
    name: 'PBL 2 — Adj Top / Diag Bottom',
    category: 'Ortega PBL',
    subGroup: 'Both Layers Swap',
    probability: '1/9',
    mainAlg: "(R U' R) F2 (R' U R')",
    altAlgs: ["R' D R' F2 R D' R"],
    recognitionVN: 'Tầng U có 1 thanh Bar (đặt ở mặt Trước F), tầng D không có thanh nào (hoán vị chéo).',
    fingertrickVN: '7 bước siêu ngắn, F2 gảy kép bằng ngón trỏ phải + trái.',
    isTwoLook: true,
    arrows: [
      { from: [0, 0], to: [0, 1], bidirectional: true },
      { from: [1, 0], to: [1, 1], bidirectional: true, color: '#F59E0B' },
    ],
  },
  {
    id: '2x2-pbl-diag-adj',
    name: 'PBL 3 — Diag Top / Adj Bottom',
    category: 'Ortega PBL',
    subGroup: 'Both Layers Swap',
    probability: '1/9',
    mainAlg: "R2 U R2 U' R2 U R2 U' R2",
    altAlgs: ["x2 (R U' R) F2 (R' U R')"],
    recognitionVN: 'Tầng U hoán vị chéo (không có Bar), tầng D có 1 thanh Bar (đặt ở mặt Phải R).',
    fingertrickVN: '2-gen R2-U hoàn toàn, tốc độ TPS cực đại.',
    isTwoLook: true,
    arrows: [{ from: [0, 0], to: [1, 1], bidirectional: true }],
  },
  {
    id: '2x2-pbl-diag-diag',
    name: 'PBL 4 — Diag / Diag (No Bars)',
    category: 'Ortega PBL',
    subGroup: 'Both Layers Swap',
    probability: '1/36',
    mainAlg: "R2 F2 R2",
    altAlgs: ["R2 B2 R2"],
    recognitionVN: 'Cả tầng U và tầng D đều không có thanh Bar nào (hoán vị chéo cả 2 tầng).',
    fingertrickVN: 'Công thức ngắn nhất lịch sử WCA: R2 F2 R2 (3 bước, 0.3s)!',
    isTwoLook: true,
    arrows: [
      { from: [0, 0], to: [1, 1], bidirectional: true },
      { from: [0, 1], to: [1, 0], bidirectional: true, color: '#F59E0B' },
    ],
  },
  {
    id: '2x2-pbl-top-adj',
    name: 'PBL 5 — Top Adj Only (T / J-Perm)',
    category: 'Ortega PBL',
    subGroup: 'Single Layer Swap',
    probability: '1/6',
    mainAlg: "(R U R' U') (R' F) R2 (U' R' U') (R U R' F')",
    altAlgs: ["(R U R' F') (R U R' U') R' F R2 U' R'"],
    recognitionVN: 'Tầng D đã giải xong hoàn toàn, tầng U có 1 thanh Bar (đặt bên Trái L).',
    fingertrickVN: 'T-Perm hoặc Jb-Perm tiêu chuẩn từ 3x3x3.',
    isTwoLook: true,
    arrows: [{ from: [0, 1], to: [1, 1], bidirectional: true }],
  },
];

// Generate all 42 CLL cases across 7 orientation sets (Sune, Anti-Sune, Pi, U, L, T, H)
const CLL_SETS: Array<{
  setId: string;
  setName: string;
  cases: Array<{ sub: string; alg: string; rec: string }>;
}> = [
  {
    setId: 'sune',
    setName: 'CLL Sune',
    cases: [
      { sub: 'Pure', alg: "(R U R' U) (R U2 R')", rec: 'Cặp góc đối diện cùng màu, góc trước cùng màu mặt phải.' },
      { sub: 'Diag Swap', alg: "(R U R' U) (L' U R U') (L U2 R')", rec: '2 góc mặt phải cùng màu, hoán vị chéo góc.' },
      { sub: 'Niklas (Left Swap)', alg: "(R U' L' U) (R' U' L)", rec: 'Thanh đồng màu bên phải, đổi 2 góc bên trái.' },
      { sub: 'Right Swap', alg: "F (R U R' U')2 F'", rec: 'Đổi 2 góc mặt trước của thế Sune.' },
      { sub: 'Front Swap', alg: "(R U R' U') (R' F R F') (R U R' U) (R U2 R')", rec: 'Thanh đồng màu phía sau, đổi 2 góc phía trước.' },
      { sub: 'Back Swap', alg: "(R' F R2 F') (U' R' U' R)", rec: 'Đổi 2 góc phía sau trên nền Sune.' },
    ],
  },
  {
    setId: 'antisune',
    setName: 'CLL Anti-Sune',
    cases: [
      { sub: 'Pure', alg: "(R U2 R') (U' R U' R')", rec: 'Thế Anti-Sune thuần không đổi góc.' },
      { sub: 'Niklas Mirror', alg: "(L' U R U') (L U R')", rec: 'Đổi 2 góc bên phải trên thế Anti-Sune.' },
      { sub: 'Diag Swap', alg: "(R' F R F') (R U R')", rec: 'Hoán vị chéo siêu ngắn bằng Sledgehammer.' },
      { sub: 'Left Swap', alg: "(R U2 R') F (R' F' R U') (R U' R')", rec: 'Đổi 2 góc bên trái trên thế Anti-Sune.' },
      { sub: 'Front Swap', alg: "(R' U' R U') (R' U2 R)", rec: 'Góc nhìn từ mặt sau của Anti-Sune.' },
      { sub: 'Back Swap', alg: "F' (L' U' L U)2 F", rec: 'Đổi 2 góc mặt sau trên thế Anti-Sune.' },
    ],
  },
  {
    setId: 'pi',
    setName: 'CLL Pi',
    cases: [
      { sub: 'Pure / Bruno', alg: "R U2 (R2 U' R2 U') R2 U2 R", rec: '2 cột dọc cùng màu trên mặt U.' },
      { sub: 'Diag Swap', alg: "F (R' F' R) U2 (R U' R' U) (R U2 R')", rec: '2 đường chéo cùng màu trên mặt U.' },
      { sub: 'Front Bar', alg: "F (R U R' U') (R U R' U') F'", rec: 'Thanh ngang phía trước cùng màu, phía sau ngược màu.' },
      { sub: 'Back Bar', alg: "(R U' R U') (R' U R' F) R2 F'", rec: 'Thanh ngang phía sau cùng màu.' },
      { sub: 'Left Bar', alg: "(R' F R F') (R U' R' U') (R U' R')", rec: 'Đèn pha cùng màu bên trái.' },
      { sub: 'Right Bar', alg: "(R U2 R') (U' R U R') U2 (R' F R F')", rec: 'Đèn pha cùng màu bên phải.' },
    ],
  },
  {
    setId: 'u',
    setName: 'CLL U',
    cases: [
      { sub: 'Pure Headlights', alg: "F (R U R' U') F'", rec: 'Thanh Bar bên phải cùng màu, đèn pha bên trái cùng màu.' },
      { sub: 'Diag Swap', alg: "R2 F2 R U R' F R2 U2 R' U' R", rec: 'Các góc đối diện chéo cùng màu.' },
      { sub: 'Front Swap', alg: "(R' U R' F) R F' (R U2 R' U) R", rec: 'Cần đổi 2 góc phía trước trên thế U.' },
      { sub: 'Back Swap', alg: "F (R U R' U)2 (R' F' R)", rec: 'Cần đổi 2 góc phía sau trên thế U.' },
      { sub: 'Right Swap', alg: "(R U2 R' U') (R U' R') (U' F R U R' U' F')", rec: 'Đổi 2 góc bên phải đã định hướng.' },
      { sub: 'Left Swap', alg: "(R' F R2 U' R' U) (R U' R' F')", rec: 'Đổi 2 góc đèn pha bên trái.' },
    ],
  },
  {
    setId: 't',
    setName: 'CLL T',
    cases: [
      { sub: 'Pure Chameleon', alg: "(R U R' U') (R' F R F')", rec: '2 góc bên trái cùng màu, 2 góc bên phải ngược màu.' },
      { sub: 'Diag Swap', alg: "F (R U R' U') R U' R' U' R U R' F'", rec: 'Hoán vị chéo trên thế T.' },
      { sub: 'Front Bar', alg: "(L' U' L U) (L F' L' F)", rec: 'Gương trái của Chameleon.' },
      { sub: 'Back Bar', alg: "F (U R U' R') F'", rec: 'Inverse Sexy trong khung F.' },
      { sub: 'Left Swap', alg: "(R U R' U') R' F R2 U' R' U' R U R' F'", rec: 'T-Perm biến thể cho CLL T.' },
      { sub: 'Right Swap', alg: "(R' U R U2) R2 (F' R U' R' F2) R2", rec: 'Đổi 2 góc bên phải trên thế T.' },
    ],
  },
  {
    setId: 'l',
    setName: 'CLL L',
    cases: [
      { sub: 'Pure Bowtie', alg: "F (R' F' R) (U R U' R')", rec: '2 góc đã lật đúng cùng màu, 2 góc chưa lật ngược màu.' },
      { sub: 'Diag Swap', alg: "R (U2 R2 F) R F' R U2 R'", rec: 'Hoán vị chéo góc trên thế L.' },
      { sub: 'Same Diag', alg: "(R U2 R') (F R' F' R) (U' R U' R')", rec: '2 góc chéo cùng màu.' },
      { sub: 'Front Swap', alg: "F' (R U R' U') (R' F R)", rec: 'Đổi 2 góc mặt trước trên thế L.' },
      { sub: 'Back Swap', alg: "(R' U R' U2) (R U' R' U) (R U' R2)", rec: '2-gen R-U cho thế L Back Swap.' },
      { sub: 'Right Swap', alg: "(R U' R' U) (R U' R' F) (R' F' R2 U R')", rec: 'Đổi 2 góc bên phải trên thế L.' },
    ],
  },
  {
    setId: 'h',
    setName: 'CLL H',
    cases: [
      { sub: 'Pure Columns', alg: "R2 U2 R U2 R2", rec: '2 cột dọc đồng màu, giải trong 5 bước.' },
      { sub: 'Rows', alg: "F (R U R' U')3 F'", rec: '2 hàng ngang đồng màu, Triple Sexy trong F.' },
      { sub: 'Column Left', alg: "(R U R' U) (R U L' U) (R' U' L)", rec: 'Cột trái đồng màu, cột phải ngược màu.' },
      { sub: 'Column Right', alg: "(L' U' L U') (L' U' R U') (L U R')", rec: 'Cột phải đồng màu, cột trái ngược màu.' },
      { sub: 'Row Front', alg: "F (U R U' R')3 F'", rec: 'Hàng trước đồng màu, hàng sau ngược màu.' },
      { sub: 'Diag Checker', alg: "(R U R' U) (R U' R' U) (R U2 R')", rec: 'Bàn cờ chéo đồng màu.' },
    ],
  },
];

export const CLL_2X2_ALGS: AlgorithmEntry[] = CLL_SETS.flatMap((set) =>
  set.cases.map((c, idx) => {
    const subLower = c.sub.toLowerCase();
    const arrows = subLower.includes('diag')
      ? [{ from: [0, 0] as [number, number], to: [1, 1] as [number, number], bidirectional: true }]
      : subLower.includes('left')
      ? [{ from: [0, 0] as [number, number], to: [1, 0] as [number, number], bidirectional: true }]
      : subLower.includes('right')
      ? [{ from: [0, 1] as [number, number], to: [1, 1] as [number, number], bidirectional: true }]
      : subLower.includes('front')
      ? [{ from: [1, 0] as [number, number], to: [1, 1] as [number, number], bidirectional: true }]
      : subLower.includes('back')
      ? [{ from: [0, 0] as [number, number], to: [0, 1] as [number, number], bidirectional: true }]
      : undefined;

    return {
      id: `2x2-cll-${set.setId}-${idx + 1}`,
      name: `${set.setName} ${idx + 1} (${c.sub})`,
      category: 'CLL',
      subGroup: set.setName,
      probability: '1/42',
      mainAlg: c.alg,
      altAlgs: [],
      recognitionVN: c.rec,
      fingertrickVN: 'Nhận diện CP kết hợp CO trong 1 ánh nhìn để giải xong toàn bộ tầng trên.',
      isTwoLook: false,
      arrows,
    };
  }),
);

export const CUBE_2X2_ALGS: AlgorithmEntry[] = [
  ...LBL_2X2_ALGS,
  ...ORTEGA_OLL_ALGS,
  ...ORTEGA_PBL_ALGS,
  ...CLL_2X2_ALGS,
];
