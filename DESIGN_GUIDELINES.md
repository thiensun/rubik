# CubeMaster AI — Design System & Style Guide

Tài liệu quy chuẩn phong cách thiết kế giao diện (UI/UX Design System) cho dự án **CubeMaster AI (Rubik Solver & Speedcubing Studio)**.

---

## 1. Triết Lý Thiết Kế (Design Philosophy)
* **Bento Grid & Clean Aesthetic:** Giao diện lấy cảm hứng từ phong cách Bento hiện đại và ngôn ngữ thiết kế tối giản, cao cấp của Apple.
* **Màu sắc nhã nhặn, dịu mắt (Soft Neutrals):** Sử dụng các gam màu nền sáng thanh lịch (`#F8F9FA`), thẻ card trắng tinh khiết (`#FFFFFF`), đường viền mờ tinh tế (`#EAECEF`) thay vì các đường viền đen đậm thô cứng.
* **Tỷ lệ hình học chuẩn xác (Strict 1:1 Squares):** Trong thế giới Rubik, các viên cubie, ô sticker và lưới 3x3 luôn luôn phải tuân thủ tỷ lệ **hình vuông tuyệt đối** (`aspect-square`), không được kéo dẹt hay méo thành hình chữ nhật.
* **Typography tương phản cao:** Kết hợp hoàn hảo giữa phông chữ hiện đại **Inter** cho văn bản điều hướng và **JetBrains Mono** cho các chỉ số, bước giải, ký hiệu WCA và mã màu.

---

## 2. Bảng Màu Quy Chuẩn (Color Palette)

### 2.1. Nền Tảng Giao Diện (Core UI Colors)
| Token | Hex Code | Ứng Dụng |
| :--- | :--- | :--- |
| `app-bg` | `#F8F9FA` | Màu nền canvas toàn ứng dụng |
| `app-card` | `#FFFFFF` | Nền các khối thẻ Bento |
| `app-border` | `#EAECEF` | Đường viền mảnh chia khối |
| `app-border-dashed` | `#E5E7EB` | Đường viền nét đứt cho module chưa active |
| `app-dark` | `#111111` | Nút bấm chính (Primary CTA), header tối màu |
| `text-primary` | `#111111` | Tiêu đề chính, văn bản nổi bật |
| `text-secondary`| `#4B5563` / `#6B7280` | Văn bản giải thích, mô tả phụ |
| `text-muted` | `#9CA3AF` | Thông số kỹ thuật micro, telemetry |

### 2.2. Màu Sắc Rubik Tiêu Chuẩn WCA
| Mặt | Màu Tiêu Chuẩn | Hex Code | Đặc Điểm Hiển Thị |
| :--- | :--- | :--- | :--- |
| **D (Down - Đáy)** | Trắng (White) | `#FFFFFF` | Có viền mảnh `rgba(200, 205, 210, 0.8)` chống chìm nền |
| **U (Up - Đỉnh)** | Vàng (Yellow) | `#FFD000` | Màu vàng speedcubing sáng rõ |
| **F (Front - Trước)** | Xanh lá (Green) | `#009B48` | Xanh lục tươi WCA |
| **B (Back - Sau)** | Xanh dương (Blue)| `#0046AD` | Xanh lam đậm WCA |
| **R (Right - Phải)** | Đỏ (Red) | `#B71234` | Đỏ đậm WCA |
| **L (Left - Trái)** | Cam (Orange) | `#FF5800` | Cam tươi WCA |

---

## 3. Quy Chuẩn Sơ Đồ 2D Net (Scanned 2D Net)

### 3.1. Cấu Trúc Khối Chữ Thập (Cross Projection)
* Sơ đồ mở phẳng 6 mặt luôn chia thành 3 hàng chuẩn:
  * **Hàng 1:** Chỉ duy nhất mặt **U (Vàng - Đỉnh)** căn giữa (`col-start-2`).
  * **Hàng 2:** Đủ 4 mặt liên tiếp trên một hàng: **L (Cam)** — **F (Xanh lá)** — **R (Đỏ)** — **B (Xanh dương)**.
  * **Hàng 3:** Chỉ duy nhất mặt **D (Trắng - Đáy)** căn giữa (`col-start-2`).

### 3.2. Quy Chuẩn Thẻ Mặt (Face Card)
* **Khung chứa ngoài:**
  * Kích thước: `rounded-xl p-1.5 sm:p-2`, chiều rộng tự động co giãn đều.
  * Trạng thái đang chọn (Active): `ring-2 ring-red-500 bg-red-50/40 shadow-xs`.
  * Trạng thái bình thường: `bg-neutral-50/50 border border-dashed border-neutral-200 hover:border-neutral-300`.
  * Trạng thái đã quét (Verified): `bg-neutral-50/80 hover:bg-neutral-100`.
* **Tiêu đề mặt (Label):**
  * Đặt phía trên lưới 3x3, định dạng chữ hoa monospace, đậm:
    * `U - VÀNG (ĐỈNH)`
    * `L - CAM`
    * `F - XANH LÁ`
    * `R - ĐỎ`
    * `B - XANH DƯƠNG`
    * `D - TRẮNG (CROSS)`
* **Lưới 3x3 ô màu (3x3 Facelet Grid):**
  * **BẮT BUỘC:** `aspect-square w-full grid grid-cols-3 grid-rows-3 gap-[2px] p-[2px] bg-neutral-200/80 rounded-md`.
  * Nền lưới là màu xám dịu mắt `bg-neutral-200/80`, bo góc nhẹ `rounded-md`.
  * **Từng ô màu (Sticker):**
    * Bắt buộc có thuộc tính `aspect-square w-full h-full rounded-[2px]`.
    * Khi chưa quét: Ô tâm hiển thị màu chuẩn kèm chấm tròn `w-1.5 h-1.5 rounded-full bg-black/40`; 8 ô xung quanh hiển thị màu xám mờ mềm mại `#DFE5ED`.
    * Khi đã quét: Hiển thị đầy đủ màu sắc nhận diện của từng ô.

---

## 4. Khung Camera Quét (Camera HUD & Reticle)
* **Viewfinder 3x3:**
  * Khung bao ngoài là hình vuông chuẩn: `w-[205px] h-[205px] sm:w-[260px] sm:h-[260px] aspect-square rounded-2xl`.
  * 4 góc ngoàm căn chỉnh: Có bo góc camera `rounded-tl`, `rounded-tr`, `rounded-bl`, `rounded-br`.
  * Lưới 9 ô: `grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2.5 w-full h-full aspect-square`.
  * Từng ô nhận diện: `rounded-xl border-2 aspect-square w-full h-full` với hiệu ứng kính mờ `backdrop-blur-[0.5px]`.

---

## 5. Các Thành Phần Giao Diện Chung (UI Components)

### 5.1. Thẻ Bento (Bento Cards)
* Lớp nền: `bg-white rounded-[20px] sm:rounded-[24px] border border-[#EAECEF] p-4 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]`.
* Tiêu đề mục: Font monospace in hoa, kèm icon đại diện (`w-4 h-4 text-neutral-600`), có vạch kẻ mờ `border-b border-[#F2F4F7]`.

### 5.2. Nút Bấm (Buttons)
* **Nút chính (Primary CTA):**
  * `bg-[#111111] hover:bg-neutral-800 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]`.
  * Thường đi kèm phím tắt hiển thị dạng keycap đen (`keycap-dark`).
* **Nút phụ (Secondary):**
  * `bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] font-semibold text-xs py-2 px-3 rounded-xl transition-all shadow-sm`.
* **Phím tắt (Keycaps):**
  * Nền sáng: `.keycap` (`bg-white border border-[#D1D5DB] rounded-[4px] shadow-2xs`).
  * Nền tối: `.keycap-dark` (`bg-[#27272A] border border-[#3F3F46] text-[#E4E4E7] rounded-[4px]`).

---

## 6. Nguyên Tắc Cho Các Chức Năng Mới
Khi thêm bất kỳ màn hình hoặc tính năng mới nào (ví dụ: chế độ luyện F2L/OLL/PLL, đồng hồ Timer nâng cao, thống kê phiên đấu, quản lý thiết bị Smart Cube bluetooth):
1. **Tuyệt đối không phá vỡ tỷ lệ vuông (`aspect-square`):** Bất kỳ sơ đồ Rubik 2D, mô phỏng mặt cube hay ô sticker nào cũng phải là hình vuông.
2. **Tuân thủ đúng tông màu Bento nhã nhặn:** Tránh dùng viền đen đậm, màu nền chói lóa hay góc cắt sắc lẹm không đồng bộ với phần còn lại của ứng dụng.
3. **Giữ tính nhất quán về ngôn ngữ:** Monospace in hoa cho mã WCA / nhãn thuật toán; chữ thường tự nhiên cho hướng dẫn tiếng Việt.
