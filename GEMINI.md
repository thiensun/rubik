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
- **Kiểm thử tự động bắt buộc**: Trước khi commit và push bất kỳ thay đổi nào, bắt buộc phải chạy `npm test` và đảm bảo **399/399 tests PASS** (15/15 test suites).
- **Production Build**: Chạy `npm run build` để kiểm tra độ tương thích TypeScript và kích thước gói bundle không vượt ngưỡng warning của Vite.
- **Git Remote**: Nhánh chính là `main`, remote `origin` trỏ về `https://github.com/thiensun/rubik.git`.
- **Đồng bộ song song**: Luôn giữ đồng bộ giữa thư mục phát triển chính `D:\Projects\rubik` và worktree `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code`.
