// Gold-Standard Layer-by-Layer (LBL) Beginner Algorithms Database
import { PermutationArrow } from '../../engine/algSimulator';

export interface AlgorithmEntry {
  id: string;
  name: string;
  level: 'level-1' | 'level-2' | 'level-3' | 'level-4';
  category: string;
  subGroup: string;
  mainAlg: string;
  altAlgs: string[];
  probability: string;
  recognitionVN: string;
  fingertrickVN: string;
  isTwoLook?: boolean;
  arrows?: PermutationArrow[];
  setupAlg?: string;
}

export const BEGINNER_ALGS: AlgorithmEntry[] = [
  {
    id: 'lbl-daisy-to-cross',
    name: 'Daisy to White Cross (Hoa Cúc Xuống Đáy)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '1. White Cross (Chữ Thập Trắng)',
    mainAlg: 'U F2',
    altAlgs: ['F2', "U' F2", 'U2 F2'],
    probability: '1/1',
    recognitionVN: 'Viên cạnh trắng nằm trên mặt đỉnh U xung quanh tâm Vàng (hình hoa cúc Daisy), màu bên hông khớp với tâm mặt trước F.',
    fingertrickVN: 'Giữ tâm Trắng ở đáy D, xoay tầng U để màu bên của viên cạnh trắng trùng tâm F rồi xoay đúp F2 bằng ngón trỏ phải.',
  },
  {
    id: 'lbl-cross-edge-flip',
    name: 'Flipped Cross Edge (Lật Cạnh Chữ Thập Trắng)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '1. White Cross (Chữ Thập Trắng)',
    mainAlg: "F' U' R U",
    altAlgs: ["F U' R U", "R' F R'"],
    probability: '1/2',
    recognitionVN: 'Viên cạnh trắng nằm đúng vị trí giữa tâm F và D nhưng bị lật ngược màu (màu trắng quay ra mặt trước F thay vì xuống đáy D).',
    fingertrickVN: 'Đưa viên cạnh bị lật về mặt trước F, thực hiện F\' bằng ngón cái phải rồi đẩy U\' R U để trả cạnh trắng xuống đúng đáy.',
  },
  {
    id: 'lbl-corner-right-trigger',
    name: 'Right Trigger Corner Insert (Chèn Góc Phải - Sexy Move)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '2. First Layer Corners (4 Góc Tầng 1)',
    mainAlg: "(R U R' U')",
    altAlgs: ["(U R U' R')", "R U R'"],
    probability: '1/3',
    recognitionVN: 'Viên góc có nhãn trắng nằm ở vị trí phía trên khe góc trước-phải (UFR), mặt trắng hướng sang bên phải (R) hoặc mặt trước (F).',
    fingertrickVN: 'Đặt viên góc ngay trên vị trí cần chèn ở góc trước-phải (FR), lặp lại tổ hợp (R U R\' U\') 1, 3 hoặc 5 lần tới khi góc khớp hoàn toàn.',
  },
  {
    id: 'lbl-corner-left-trigger',
    name: 'Left Trigger Corner Insert (Chèn Góc Trái)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '2. First Layer Corners (4 Góc Tầng 1)',
    mainAlg: "(L' U' L U)",
    altAlgs: ["(U' L' U L)", "L' U' L"],
    probability: '1/3',
    recognitionVN: 'Viên góc trắng nằm ở góc trên-trái (UFL) với nhãn trắng hướng sang mặt trái (L), cần đưa xuống khe góc trước-trái (DFL).',
    fingertrickVN: 'Thực hiện bằng tay trái đối xứng: ngón cái trái đẩy L\', ngón trỏ trái kéo U\', trả L và gẩy U bằng ngón trỏ phải.',
  },
  {
    id: 'lbl-middle-edge-right',
    name: 'Middle Layer Right Insert (Chèn Cạnh Tầng 2 Bên Phải)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '3. Middle Layer Edges (4 Cạnh Tầng 2)',
    mainAlg: "(U R U' R') U' (F' U F)",
    altAlgs: ["U (R U R' U') (F' U' F)", "U R U' R' d' L' U L"],
    probability: '1/2',
    recognitionVN: 'Viên cạnh tầng 2 trên đỉnh U không chứa màu vàng, màu mặt trước khớp với tâm F và màu mặt trên trùng với tâm bên phải R.',
    fingertrickVN: 'Bắt đầu bằng tổ hợp (U R U\' R\') để ghép cặp với góc trắng, sau đó xoay nhẹ cổ tay thực hiện U\' (F\' U F) đưa cặp vào khe FR.',
  },
  {
    id: 'lbl-middle-edge-left',
    name: 'Middle Layer Left Insert (Chèn Cạnh Tầng 2 Bên Trái)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '3. Middle Layer Edges (4 Cạnh Tầng 2)',
    mainAlg: "(U' L' U L) U (F U' F')",
    altAlgs: ["U' (L' U' L U) (F U F')", "U' L' U L d R U' R'"],
    probability: '1/2',
    recognitionVN: 'Viên cạnh tầng 2 trên đỉnh U có màu mặt trước khớp với tâm F và màu mặt trên trùng với tâm bên trái L.',
    fingertrickVN: 'Đẩy viên cạnh sang phải bằng U\', dùng tay trái kéo L\' U L rồi đón viên góc bằng U (F U\' F\') để hoàn tất khe FL.',
  },
  {
    id: 'lbl-yellow-cross',
    name: 'Yellow Cross FRURUF (Tạo Chữ Thập Vàng)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '4. Last Layer Orientation (Định Hướng Tầng Đỉnh)',
    mainAlg: "F (R U R' U') F'",
    altAlgs: ["f (R U R' U') f'", "F (U R U' R') F'"],
    probability: '3/4',
    recognitionVN: 'Mặt đỉnh U có hình dấu chấm (Dot), chữ L nhỏ (ở góc trên-trái UBL) hoặc thanh ngang (Line) màu vàng.',
    fingertrickVN: 'Với chữ L nhỏ đặt ở góc 9 giờ - 12 giờ (UL-UB); với thanh ngang đặt nằm ngang (UL-UR). Bấm F bằng ngón trỏ phải, chạy Sexy Move (R U R\' U\') rồi đóng F\'.',
  },
  {
    id: 'lbl-sune-edge-swap',
    name: 'Sune Edge Swap (Hoán Vị Cạnh Chữ Thập Vàng - Sune)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '5. Last Layer Permutation (Hoán Vị Tầng Đỉnh)',
    mainAlg: "R U R' U (R U2 R') U",
    altAlgs: ["R U R' U (R U2 R')", "(R U2 R') U' R U' R'"],
    probability: '2/3',
    recognitionVN: 'Chữ thập vàng đã hình thành nhưng chỉ có 2 cạnh bên khớp tâm (nằm kề nhau hoặc đối diện nhau), cần hoán vị các cạnh còn lại.',
    fingertrickVN: 'Đặt 2 cạnh đã đúng ở mặt sau (B) và mặt phải (R), thực hiện mượt R U R\' U tiếp nối bằng Fast Flick (R U2 R\') U.',
  },
  {
    id: 'lbl-niklas-corner-position',
    name: 'Niklas Corner Position (Đưa 4 Góc Vàng Về Đúng Vị Trí)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '5. Last Layer Permutation (Hoán Vị Tầng Đỉnh)',
    mainAlg: "U R U' L' U R' U' L",
    altAlgs: ["R U' L' U R' U' L U", "L' U R U' L U R' U'"],
    probability: '5/6',
    recognitionVN: 'Có 0 hoặc 1 viên góc trên tầng U nằm đúng vị trí (3 màu của góc khớp với 3 màu tâm xung quanh, dù có thể chưa lật đúng hướng).',
    fingertrickVN: 'Giữ viên góc đã đúng vị trí ở góc trước-phải (UFR), dùng hai ngón trỏ thay phiên gẩy U và U\' nhịp nhàng giữa R và L\'.',
  },
  {
    id: 'lbl-corner-twist-rd',
    name: 'Corner Twist R\' D\' R D (Xoay Lật Góc Vàng Hoàn Tất)',
    level: 'level-1',
    category: 'LBL',
    subGroup: '5. Last Layer Permutation (Hoán Vị Tầng Đỉnh)',
    mainAlg: "(R' D' R D) (R' D' R D)",
    altAlgs: ["(D' R' D R) (D' R' D R)", "(R U R' U') (R U R' U')"],
    probability: '1/1',
    recognitionVN: '4 góc tầng U đã nằm đúng vị trí nhưng nhãn vàng còn quay sang mặt bên, cần xoay lật từng góc lên mặt đỉnh U.',
    fingertrickVN: 'Giữ cố định mặt trước F suốt quá trình! Đưa góc cần lật về vị trí UFR, làm (R\' D\' R D) 2 hoặc 4 lần tới khi vàng ngửa lên, sau đó CHỈ xoay tầng U để đưa góc tiếp theo vào UFR.',
  },
];
