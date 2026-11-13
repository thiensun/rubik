# Knowledge Item (KI) & Kiến Trúc Dự Án Rubik (CubeMaster AI)

Tài liệu này lưu trữ toàn bộ Knowledge Items (KI), các quyết định kỹ thuật cốt lõi (ADR), bài học kinh nghiệm và quy ước quan trọng đã thống nhất qua tất cả các phiên thảo luận. Mọi AI assistant hoặc developer khi tiếp quản dự án bắt buộc phải đọc và tuân theo các quy tắc này.

---

## 1. Định Hướng & Mục Đích Dự Án
- **Mục tiêu**: Ứng dụng web speedcubing toàn diện phục vụ đam mê cá nhân, định hướng miễn phí cho cộng đồng người chơi Rubik.
- **Điểm khác biệt (USP)**: Tích hợp công nghệ AI (Camera Color Recognition, CIELAB Delta-E, CFOP Solver, WCA Inspection 15s) giúp người dùng quét và giải khối Rubik thực tế một cách trực quan, chính xác vượt trội so với các trang web thông thường.
- **Tech Stack**:
  - Frontend: React + TypeScript + Vite + Tailwind CSS + Three.js (Interactive 3D Viewport) + Lucide Icons.
  - Test Suite: Vitest (399/399 automated tests, 15 test suites).
  - Code Splitting: Bundle chunks tách riêng Three.js, Lucide, React-vendor đảm bảo build không vượt quá ngưỡng cảnh báo 500 kB.

---

## 2. Quy Ước Không Gian Khối Rubik & Hệ Quy Chiếu Màu (WCA Color Scheme)

### 2.1. Cấu Trúc Trục Màu Chuẩn (Western / Boy Color Scheme)
- **Tâm đối xứng**:
  - Trắng (White) đối diện Vàng (Yellow).
  - Xanh lá (Green) đối diện Xanh dương (Blue).
  - Đỏ (Red) đối diện Cam (Orange).

### 2.2. Quy Ước Scramble (Step 1 Timer & Scramble Net) & Camera Scan (Step 2)
Tuân thủ 100% chuẩn quy ước thi đấu quốc tế WCA (Rule 4d) và csTimer:
- **Đỉnh U (Up)**: Màu **Trắng (White)** — Tâm trắng luôn hướng lên trên khi xáo khối và vẽ sơ đồ 2D.
- **Mặt Trước F (Front)**: Màu **Xanh lá (Green)** — Nhìn trực diện.
- **Mặt Phải R (Right)**: Màu **Đỏ (Red)**.
- **Mặt Trái L (Left)**: Màu **Cam (Orange)**.
- **Mặt Sau B (Back)**: Màu **Xanh dương (Blue)**.
- **Đáy D (Down)**: Màu **Vàng (Yellow)**.

### 2.3. Sơ Đồ Chiếu Phẳng 2D Net (Step 1 Scramble Preview & Step 2 Camera Scan)
- **Hàng 1**: Đỉnh **U (Trắng)**
- **Hàng 2**: **L (Cam)** — **F (Xanh lá)** — **R (Đỏ)** — **B (Xanh dương)**
- **Hàng 3**: Đáy **D (Vàng)**

### 2.4. Quy Ước Rubik 3D & Solver (Step 3 Interactive Solver)
- **Tự động lật xoay tâm Trắng xuống đáy (`rotateWhiteToBottom`)**:
  Dựa trên khối Rubik đã quét hoặc mẫu Scramble (vốn có Trắng ở trên), khi chuyển sang bước giải 3D:
  - Khối 3D tự động xoay tâm Trắng xuống mặt đáy ($D$), đưa tâm Vàng lên mặt đỉnh ($U$).
  - **Đáy D (Down)**: Màu **Trắng (White)** — Tầng đáy **luôn luôn giải Cross Trắng (White Cross)** và F2L theo chuẩn CFOP/LBL.
  - **Đỉnh U (Up)**: Màu **Vàng (Yellow)** — Tầng đỉnh giải OLL và PLL (Last Layer).
  - **Mặt Trước F (Front)**: Màu **Xanh lá (Green)**.
  - **Mặt Phải R (Right)**: Màu **Đỏ (Red)**.
  - **Mặt Trái L (Left)**: Màu **Cam (Orange)**.
  - **Mặt Sau B (Back)**: Màu **Xanh dương (Blue)**.
- **Bảo toàn vật lý & toán học**: Hàm `rotateWhiteToBottom` hoán đổi tọa độ $U \leftrightarrow D$ và lật đối xứng các mặt bên ($F, B, L, R$), bảo toàn nguyên vẹn 100% cấu trúc viên góc, viên cạnh và tính chẵn lẻ hoán vị (Parity).

---

## 3. Thứ Tự & Cơ Chế Quét Camera (AI Camera Scan - Step 2)

### 3.1. Thứ Tự Quét 6 Mặt Tự Nhiên Nhất
Người dùng cầm khối Rubik nhìn thẳng vào mặt trước và xoay theo trình tự:
1. **F (Front - Xanh lá)**: Cầm khối nhìn trực diện.
2. **R (Right - Đỏ)**: Xoay khối 90° sang phải (nhìn mặt Đỏ).
3. **B (Back - Xanh dương)**: Tiếp tục xoay 90° sang phải (nhìn mặt Xanh dương).
4. **L (Left - Cam)**: Tiếp tục xoay 90° sang phải (nhìn mặt Cam).
5. **U (Up - Trắng)**: Nghiêng khối nhìn mặt đỉnh (nhìn mặt Trắng).
6. **D (Down - Vàng)**: Nghiêng khối nhìn mặt đáy (nhìn mặt Vàng) $\rightarrow$ Hoàn tất 6 mặt.

### 3.2. Tính Năng Auto-Scan & Ổn Định Hình Ảnh
- **Tự động chụp khi đúng tâm & ổn định**: Khi tâm mặt được camera nhận diện trùng khớp với màu tâm yêu cầu (`targetCenterColor`), đồng thời tín hiệu màu ổn định trong 600ms, hệ thống sẽ tự động kích hoạt chụp và chuyển sang mặt kế tiếp.
- **Chống lật gương (Mirror Flip)**:
  - Khi dùng **Camera trước (Webcam laptop / Camera selfie)**: Bật mirror flip ngang để người dùng thao tác như soi gương.
  - Khi dùng **Camera sau (Rear camera trên điện thoại)**: Tự động tắt mirror flip (`scaleX(1)`) để hình ảnh không bị ngược chiều so với thực tế.
- **Nhận diện màu sắc thích ứng**: Áp dụng không gian màu CIELAB ($\Delta E$) kết hợp cân bằng sáng tự động nhằm phân biệt chuẩn xác Trắng vs Vàng, Cam vs Đỏ ngay cả trong điều kiện ánh sáng phòng yếu hoặc đèn vàng.

---

## 4. Chế Độ Bấm Giờ Speedcubing & Inspection 15s (Step 1 Scramble & Timer)
- **Quy tắc WCA B4**: Cho phép 15 giây quan sát (Inspection Time) trước khi giải:
  - Giây 0–7: Đếm ngược bình thường.
  - Giây 8: Cảnh báo âm thanh "8 seconds".
  - Giây 12: Cảnh báo âm thanh "12 seconds".
  - Quá 15 giây: Phạt +2 giây (theo luật WCA).
  - Quá 17 giây: DNF (Did Not Finish).
- **Cơ chế kích hoạt**: Khi bật chế độ 15s Inspection trong Cài đặt (Settings), nhấn phím Space hoặc giữ chuột vào timer sẽ kích hoạt đếm ngược 15s quan sát trước khi chuyển sang trạng thái sẵn sàng (Ready - Đèn xanh) để bấm giờ chính thức.

---

## 5. Quy Chuẩn Đóng Gói, Test & Triển Khai (CI/CD)
- **Kiểm thử tự động bắt buộc**: Trước khi commit và push bất kỳ thay đổi nào, bắt buộc phải chạy `npm test` và đảm bảo **413/413 tests PASS** (16/16 test suites).
- **Production Build**: Chạy `npm run build` để kiểm tra độ tương thích TypeScript và kích thước gói bundle không vượt ngưỡng warning của Vite.
- **Git Remote**: Nhánh chính là `main`, remote `origin` trỏ về `https://github.com/thiensun/rubik.git`.
- **Đồng bộ song song**: Luôn giữ đồng bộ giữa thư mục phát triển chính `D:\Projects\rubik` và worktree `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code`.

---

## 6. Design System & Vibe Coding Governance (Monochrome Editorial Bento)

### 6.1. Visual DNA (Apple-Inspired Editorial Tech & Zen Stage)
- **Page Background & Primary Text**: `#F8F9FA` (canvas) với `#111111` (chữ chính) và `selection:bg-[#111111] selection:text-white`.
- **Bento Cards**: `#FFFFFF` với `border: 1px solid #EAECEF`, `rounded-2xl`, shadow tinh tế `shadow-[0_2px_10px_rgba(0,0,0,0.02)]` (class `.bento-card`).
- **Strictly Monochrome UI**:
  - **Primary / Active States**: Matte black `#111111` với chữ trắng `#FFFFFF` (nút chính, segmented pill đang chọn, badge bước hiện tại).
  - **Secondary / Neutral States**: `#F1F5F9` (surface phụ), `#64748B` (nhãn phụ), `#94A3B8` (muted/placeholder).
  - **Color Discipline**: Tuyệt đối hạn chế màu sặc sỡ trên UI chrome; chỉ giữ màu rực rỡ cho **sticker khối Rubik 2D/3D**.
- **Typography**:
  - **UI text**: `Inter` / `Plus Jakarta Sans` với `tracking-tight` cho tiêu đề.
  - **Scramble, Notation, Algs, Timers, Keycaps**: Bắt buộc dùng `JetBrains Mono` kết hợp `tabular-nums`.
- **Touch & Micro-interactions**:
  - Vùng chạm mobile tối thiểu `min-h-[44px]` cho các nút thao tác chính/điều hướng.
  - Hiệu ứng chuyển động thống nhất: `transition-all duration-200 ease-out active:scale-[0.98]`.
  - Icon Lucide mảnh (`strokeWidth={1.5}`–`1.75`); không lặp icon ký tự Unicode (ví dụ `▶`) bên cạnh SVG icon `<Play />`.

### 6.2. Header, Navigation & Layout Invariants (Bất Biến Bắt Buộc - DO NOT BREAK)
- **Header & Mobile Bottom Dock**:
  - **Top Header**: Glassmorphism `bg-[#F8F9FA]/85 backdrop-blur-md border-b border-[#EAECEF]`, chỉ giữ logo 9 chấm + `CubeMaster AI`, bộ chuyển `[ 2x2 | 3x3 | 4x4 ]` đơn sắc, và nút Settings tối giản.
  - **Mobile Bottom Dock (< 1024px)**: `bg-white/95 backdrop-blur-md border-t border-[#EAECEF]`, dấu chấm active `#111111`, kèm khoảng đệm đáy `pb-24 lg:pb-8` cho các danh sách cuộn.
- **Step 3 (`Solve & Learn`) & 3D Viewport**:
  - **Grid Split**: `grid grid-cols-1 lg:grid-cols-12 gap-5 items-start` với cột trái 3D Stage `lg:col-span-7` và cột phải Roadmap `lg:col-span-5`.
  - **Luồng xếp chồng chuẩn (No Scroll Overlap)**: Cột trái dùng `flex flex-col gap-3` thông thường (không dùng `sticky` hay `max-h` cắt xén quanh thanh playback) để **3D Stage → Playback Controls (`Lùi`, `Chạy Space`, `Tiến`) → Speed Selector → Execution Tape** luôn hiển thị đầy đủ, không bị che khuất khi cuộn.
  - **3D Stage (`CubeViewport3D` & `ThreeCubeViewer`)**:
    - Chiều cao tiêu chuẩn: `h-[350px] sm:h-[400px] lg:h-[500px] w-full`, nền trắng `bg-white` hòa vào thẻ Bento, hỗ trợ vuốt xoay `touch-none`.
    - Camera `PerspectiveCamera(fov: 36)` đặt tại `(4.1, 3.4, 4.1)` (`Iso`), `cubeGroup.scale.setScalar(1.18)`, lõi cầu đen `#111111` + viền cạnh `EdgesGeometry` `#111111` tạo độ tương phản sắc nét.
    - Micro-HUD gắn gọn ở 4 góc ngoài (`top-3 left-3`, `top-3 right-3`, `bottom-3 left-3`, `bottom-3 right-3`), không đè lên khối 3D.
- **Algorithms Tab**:
  - Tách riêng thanh cuộn ngang Category Filter Bar (có edge fade + nút `‹`/`›`) và hàng Status Filter Bar (`whitespace-nowrap`); ô tìm kiếm responsive (`w-full sm:w-72 min-w-0`).

### 6.3. Component Size Guardrails (Quy Chuẩn Kích Thước Component)
- **Ngưỡng giới hạn**: Không component React đơn lẻ nào được vượt quá 350 dòng code (`LOC <= 350`).
- **Tự động chia tách (Decomposition)**: Nếu một component phát triển vượt quá 400 dòng, bắt buộc tự động phân tách module thành các sub-components theo phạm vi tính năng (feature-scoped components).

---

## 7. Rubik Mathematical Engine & Solver Invariants

### 7.1. Notation & Trigger Standards
- **Các bước xoay hỗ trợ**:
  - Mặt ngoài: `U, D, L, R, F, B` (kèm modifier `'`, `2`).
  - Lát kép (Wide): `u, d, l, r, f, b` (hoặc `Uw, Dw, Lw, Rw, Fw, Bw`).
  - Lát giữa (Slice): `M, E, S` (trong đó $M$ theo chiều $L$, $E$ theo chiều $D$, $S$ theo chiều $F$).
  - Xoay toàn khối (Cube rotations): `x, y, z`.
- **Nhận diện & tô màu cụm Trigger (Trigger Tokenization)**: Luôn phân tích cú pháp và hiển thị nổi bật các cụm ngoặc tròn:
  - `(R U R' U')` $\rightarrow$ **Sexy Move** (Emerald `#059669`)
  - `(U R U' R')` $\rightarrow$ **Inverse Sexy** (Sky Blue `#0284C7`)
  - `(R' F R F')` $\rightarrow$ **Sledgehammer** (Amber `#D97706`)
  - `(F R' F' R)` $\rightarrow$ **Hedgeslammer** (Violet `#7C3AED`)
  - `(L' U' L U)` $\rightarrow$ **Left Sexy** (Teal `#0D9488`)
  - `(R U2 R')`   $\rightarrow$ **Fast Flick** (Rose `#E11D48`)

### 7.2. State & Inverse Rules
- **Đảo ngược thuật toán (`invertAlg`)**: Bắt buộc loại bỏ toàn bộ dấu ngoặc đơn `( )`, tách token theo khoảng trắng, **ĐẢO NGƯỢC THỨ TỰ MẢNG TỪ CUỐI LÊN ĐẦU** (`.reverse()`), sau đó đảo modifier (`R` $\leftrightarrow$ `R'`, `R2` giữ nguyên `R2`).
- **Trạng thái tiền thực thi 2D & 3D (Pre-execution State)**: Luôn áp dụng `invertAlg(mainAlg)` lên một khối đã giải (Solved Cube) để tạo ra trạng thái xuất phát chính xác 100%.
- **Bắt cặp AUF (AUF Tracking)**: Hỗ trợ Pre-AUF (`U, U', U2`) quan sát căn chỉnh trước khi thực thi công thức tầng cuối (Last Layer - OLL/PLL/ZBLL).

### 7.3. Solver Optimization Invariants
- **Move count tối ưu cho CFOP**: Tổng số bước giải CFOP luôn nằm trong khoảng thực tế của speedcuber con người: **45 đến 65 bước** (không vượt quá 95 bước trong mọi scramble ngẫu nhiên).
- **Loại bỏ vòng lặp thừa**: Tuyệt đối không xuất bản vòng lặp lặp đi lặp lại như `(R U R' U') x 4`. Bắt buộc chạy `optimizeMoves()` trên toàn bộ chuỗi giải để triệt tiêu các bước nghịch đảo liền kề (`R + R' -> []`, `R + R -> R2`, `U2 + U -> U'`).
- **Phân tách 4 cặp F2L chuẩn xác**: Tầng F2L phải được chia rõ thành 4 cặp độc lập (`FR`, `FL`, `BR`, `BL`), mỗi cặp chỉ tiêu tốn từ **4 đến 8 bước**.
