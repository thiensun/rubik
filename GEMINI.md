# Knowledge Item (KI) & Kiến Trúc Dự Án Rubik (CubeMaster AI)

Tài liệu này lưu trữ toàn bộ Knowledge Items (KI), các quyết định kỹ thuật cốt lõi (ADR), bài học kinh nghiệm và quy ước quan trọng đã thống nhất qua tất cả các phiên thảo luận. Mọi AI assistant hoặc developer khi tiếp quản dự án bắt buộc phải đọc và tuân theo các quy tắc này.

---

## 1. Định Hướng & Mục Đích Dự Án
- **Mục tiêu**: Ứng dụng web speedcubing toàn diện phục vụ đam mê cá nhân, định hướng miễn phí cho cộng đồng người chơi Rubik.
- **Điểm khác biệt (USP)**: Tích hợp công nghệ AI (Camera Color Recognition, CIELAB Delta-E, CFOP Solver, WCA Inspection 15s) giúp người dùng quét và giải khối Rubik thực tế một cách trực quan, chính xác vượt trội so với các trang web thông thường.
- **Tech Stack**:
  - Frontend: React + TypeScript + Vite + Tailwind CSS + Three.js (Interactive 3D Viewport) + Lucide Icons.
  - Test Suite: Vitest (395/395 automated tests, 14 test suites).
  - Code Splitting: Bundle chunks tách riêng Three.js, Lucide, React-vendor đảm bảo build không vượt quá ngưỡng cảnh báo 500 kB.

---

## 2. Quy Ước Không Gian Khối Rubik & Hệ Quy Chiếu Màu (WCA Color Scheme)

### 2.1. Cấu Trúc Trục Màu Chuẩn (Western / Boy Color Scheme)
- **Tâm đối xứng**:
  - Trắng (White) đối diện Vàng (Yellow).
  - Xanh lá (Green) đối diện Xanh dương (Blue).
  - Đỏ (Red) đối diện Cam (Orange).

### 2.2. Chiều Không Gian 3D (Right-Hand Rule - Phương Án 2)
Hệ thống solver toán học, 2D net và 3D viewport chuẩn hóa theo Phương Án 2:
- **Đỉnh U (Up)**: Màu **Trắng (White)**.
- **Đáy D (Down)**: Màu **Vàng (Yellow)**.
- **Mặt Trước F (Front)**: Màu **Xanh lá (Green)**.
- **Mặt Sau B (Back)**: Màu **Xanh dương (Blue)**.
- **Mặt Phải R (Right)**: Màu **Đỏ (Red)**.
- **Mặt Trái L (Left)**: Màu **Cam (Orange)**.

> [!IMPORTANT]
> **Quy Tắc Chirality & Trục Không Gian**:
> Khi Đỉnh là Trắng ($U$) và Trước là Xanh lá ($F$), Bên Phải **bắt buộc là Đỏ ($R$)** và Bên Trái là Cam ($L$). Đây là hệ trục tọa độ bàn tay phải chuẩn ($+X \times +Y = +Z$), bảo toàn hoàn hảo tính đối xứng không gian (Chirality) và chẵn lẻ hoán vị (Parity).

### 2.3. Sơ Đồ Chiếu Phẳng 2D Net
Cả trong Bước 2 (Quét Camera) và thẻ hiển thị Scramble Net 2D:
- **Hàng 1**: Đỉnh **U (Trắng)**
- **Hàng 2**: **L (Cam)** — **F (Xanh lá)** — **R (Đỏ)** — **B (Xanh dương)**
- **Hàng 3**: Đáy **D (Vàng)**

---

## 3. Thứ Tự & Cơ Chế Quét Camera (AI Camera Scan - Step 2)

### 3.1. Thứ Tự Quét 6 Mặt Tự Nhiên Nhất
Người dùng cầm khối Rubik nhìn thẳng vào mặt trước và xoay theo trình tự:
1. **F (Front - Xanh lá)**: Cầm khối nhìn trực diện.
2. **R (Right - Đỏ)**: Xoay khối 90° sang phải.
3. **B (Back - Xanh dương)**: Tiếp tục xoay 90° sang phải.
4. **L (Left - Cam)**: Tiếp tục xoay 90° sang phải.
5. **U (Up - Trắng)**: Nghiêng khối nhìn mặt đỉnh.
6. **D (Down - Vàng)**: Nghiêng khối nhìn mặt đáy $\rightarrow$ Hoàn tất 6 mặt.

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
- **Kiểm thử tự động bắt buộc**: Trước khi commit và push bất kỳ thay đổi nào, bắt buộc phải chạy `npm test` và đảm bảo **395/395 tests PASS** (14/14 test suites).
- **Production Build**: Chạy `npm run build` để kiểm tra độ tương thích TypeScript và kích thước gói bundle không vượt ngưỡng warning của Vite.
- **Git Remote**: Nhánh chính là `main`, remote `origin` trỏ về `https://github.com/thiensun/rubik.git`.
- **Đồng bộ song song**: Luôn giữ đồng bộ giữa thư mục phát triển chính `D:\Projects\rubik` và worktree `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code`.
